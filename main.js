const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs-extra');
const config = require('./config.js'); // ✅ INTÉGRATION CONFIG
const { execSync } = require('child_process');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let isAdmin = false;
let appConfig = config; // Cache config

// Vérifier les droits administrateur
function checkAdminRights() {
  try {
    execSync('net session', { stdio: 'pipe', shell: 'cmd.exe' });
    return true;
  } catch (e) {
    return false;
  }
}

// Créer la fenêtre principale
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
    },
    icon: path.join(__dirname, 'assets/icon.png') || null, // ✅ Gestion icône
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Configurer autoUpdater
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // Gérer les événements de mise à jour
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
    mainWindow.webContents.send('update-status', { status: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);
    mainWindow.webContents.send('update-status', { status: 'available', version: info.version });
    autoUpdater.downloadUpdate();
  });

  autoUpdater.on('update-not-available', () => {
    console.log('No updates available');
    mainWindow.webContents.send('update-status', { status: 'not-available' });
  });

  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('update-status', { status: 'downloading', percent: progress.percent });
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info.version);
    mainWindow.webContents.send('update-status', { status: 'downloaded', version: info.version });
  });

  autoUpdater.on('error', (err) => {
    console.error('Update error:', err);
    mainWindow.webContents.send('update-status', { status: 'error', error: err.message });
  });

  // Vérifier les mises à jour au démarrage
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  }
}

// Fonction utilitaire: mapper catégorie → paths
function getPathsForCategories(categories) {
  const pathMap = {
    temp: config.cleaningPaths.slice(0,3), // TEMP paths
    cache: config.cleaningPaths.slice(3,5), // Chrome cache
    recycle: [path.join(os.homedir(), '$Recycle.Bin')],
    prefetch: ['C:\\Windows\\Prefetch'],
    thumbnails: config.cleaningPaths.slice(6,7),
    // etc.
  };

  const requestedCategories = Array.isArray(categories) ? categories : [];
  const availableCategories = Object.keys(pathMap);

  // ✅ Si "all" est demandé (ou aucune catégorie valide), nettoyer toutes les catégories connues
  const normalizedCategories = requestedCategories.includes('all')
    ? availableCategories
    : requestedCategories.filter(cat => availableCategories.includes(cat));

  const effectiveCategories = normalizedCategories.length > 0 ? normalizedCategories : availableCategories;

  const paths = new Set();
  effectiveCategories.forEach(cat => {
    (pathMap[cat] || []).forEach(p => paths.add(p));
  });

  return Array.from(paths).filter(fs.existsSync);
}

// Fonction batch cleaning avec progress
async function cleanWithBatching(pathsToClean, dryRun = false) {
  let results = { deleted: 0, failed: 0, errors: [], freedSpace: 0 };
  const batchSize = appConfig.batchSize || 50;
  let processed = 0;

  for (let i = 0; i < pathsToClean.length; i += batchSize) {
    const batch = pathsToClean.slice(i, i + batchSize);
    await Promise.all(batch.map(async (dirPath) => {
      try {
        if (!fs.existsSync(dirPath)) return;
        const files = await fs.readdir(dirPath);
        for (const file of files) {
          const filePath = path.join(dirPath, file);
          const stat = await fs.stat(filePath).catch(() => null);
          if (!stat) continue;

          // ✅ Vérifier preserveExtensions
          const ext = path.extname(filePath).toLowerCase();
          if (appConfig.preserveExtensions.includes(ext)) continue;

          if (stat.isDirectory()) {
            await cleanWithBatching([filePath], dryRun); // Récursif
            if (!dryRun) await fs.rmdir(filePath).catch(() => {});
          } else {
            if (!dryRun) {
              await fs.unlink(filePath).catch(() => {});
              results.deleted++;
              results.freedSpace += stat.size;
            } else {
              results.deleted++; // Compte pour dry-run
              results.freedSpace += stat.size;
            }
          }
        }
      } catch (e) {
        results.failed++;
        results.errors.push(e.message);
      }
    }));

    processed += batch.length;
    // ✅ Émettre progress
    mainWindow.webContents.send('clean-progress', {
      progress: (processed / pathsToClean.length) * 100,
      currentBatch: i / batchSize + 1,
      totalBatches: Math.ceil(pathsToClean.length / batchSize)
    });

    // Delay entre batches
    await new Promise(r => setTimeout(r, appConfig.delayBetweenBatches || 50));
  }
  return results;
}

// Initialiser l'app
app.on('ready', () => {
  isAdmin = checkAdminRights();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

// ==================== IPC Handlers ====================

ipcMain.handle('getStatus', () => ({ isAdmin, platform: process.platform }));

ipcMain.handle('get-config', () => appConfig);

ipcMain.handle('update-config', async (event, newConfig) => {
  appConfig = { ...appConfig, ...newConfig };
  // Sauvegarder (simple pour démo)
  console.log('Config updated:', appConfig);
  return appConfig;
});

// ✅ IPC pour gérer les mises à jour
ipcMain.handle('check-for-updates', async () => {
  if (!app.isPackaged) {
    return { success: false, error: 'Updates only work in packaged app' };
  }
  try {
    await autoUpdater.checkForUpdatesAndNotify();
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
});

// ✅ Créer un point de restauration système
ipcMain.handle('create-restore-point', async () => {
  const restoreName = `GLOCK_Cleaner_${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const psScript = `checkpoint-computer -restorepointname "${restoreName}" -description "GLOCK Cleaner - Nettoyage PC"`;

  try {
    execSync(`powershell -Command "${psScript}"`, { stdio: 'pipe', shell: 'cmd.exe' });
    return { success: true, name: restoreName };
  } catch (e) {
    console.error('Restore point error:', e);
    return { success: false, error: e.message };
  }
});

// ✅ Ouvrir un lien externe
const { shell } = require('electron');
ipcMain.handle('open-external', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ✅ Désinstaller une application
ipcMain.handle('uninstall-app', async (event, appName) => {
  const uninstallCommands = {
    'Adobe Reader': 'Adobe Acrobat',
    'VLC': '*VLC*',
    '7-Zip': '7-Zip',
    'Notepad++': 'Notepad++'
  };

  const package = uninstallCommands[appName];
  if (!package) return { success: false, error: 'Application non trouvée' };

  try {
    // Trouver le package uninstallstring
    const psScript = `Get-WmiObject -Class Win32_Product | Where-Object {$_.Name -like "*${package}*"} | Select-Object -First 1 -ExpandProperty UninstallString`;
    const uninstallStr = execSync(`powershell -Command "${psScript}"`, { encoding: 'utf-8', shell: 'cmd.exe' }).trim();

    if (uninstallStr) {
      execSync(uninstallStr, { stdio: 'pipe', shell: 'cmd.exe' });
      return { success: true, name: appName };
    }
    return { success: false, error: 'Désinstalleur non trouvé' };
  } catch (e) {
    console.error('Uninstall error:', e);
    return { success: false, error: e.message };
  }
});

// ✅ Scan avec config
ipcMain.handle('scan', async () => {
  const paths = appConfig.cleaningPaths.filter(p => fs.existsSync(p));
  let totalSize = 0, totalFiles = 0;
  const results = { folders: [], totalSize: 0, totalFiles: 0, timestamp: new Date().toISOString() };

  for (const p of paths) {
    try {
      const folderResult = { path: p, size: 0, files: 0 };
      // Analyse récursive (simplifiée)
      const scanDir = async (dir) => {
        const files = await fs.readdir(dir).catch(() => []);
        for (const f of files) {
          const fPath = path.join(dir, f);
          const stat = await fs.stat(fPath).catch(() => null);
          if (stat?.isDirectory()) {
            await scanDir(fPath);
          } else if (stat) {
            // Skip preserves
            const ext = path.extname(fPath).toLowerCase();
            if (!appConfig.preserveExtensions.includes(ext)) {
              folderResult.size += stat.size;
              folderResult.files++;
            }
          }
        }
      };
      await scanDir(p);
      if (folderResult.files > 0) {
        results.folders.push(folderResult);
        totalSize += folderResult.size;
        totalFiles += folderResult.files;
      }
    } catch (e) {
      console.error(`Scan error ${p}:`, e);
    }
  }

  results.totalSize = totalSize;
  results.totalFiles = totalFiles;
  return results;
});

// ✅ Clean avec catégories + batching
ipcMain.handle('clean', async (event, options) => {
  const { categories = [], dryRun = appConfig.dryRunMode } = options;
  const pathsToClean = getPathsForCategories(categories.length ? categories : ['all']);
  if (pathsToClean.length === 0) throw new Error('No paths to clean');

  const results = await cleanWithBatching(pathsToClean, dryRun);
  return results;
});

ipcMain.handle('getDiskInfo', async () => {
  // Même logique existante (inchangée pour stabilité)
  try {
    const output = execSync('wmic logicaldisk where name="C:" get size,freespace /format:value', { encoding: 'utf-8' });
    let totalBytes = 0, availableBytes = 0;
    output.trim().split('\n').forEach(line => {
      if (line.startsWith('Size=')) totalBytes = parseInt(line.substring(5).trim());
      else if (line.startsWith('FreeSpace=')) availableBytes = parseInt(line.substring(10).trim());
    });
    if (totalBytes > 0) {
      return {
        drive: 'C:\\',
        total: totalBytes,
        used: totalBytes - availableBytes,
        available: availableBytes,
        blockSize: 1024,
      };
    }
  } catch (e) {
    // Fallback PowerShell/default (code existant)
    return {
      drive: 'C:\\',
      total: 500 * 1024**3,
      used: 250 * 1024**3,
      available: 250 * 1024**3,
      blockSize: 1024,
    };
  }
});

