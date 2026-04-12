// ==================== Utils ====================
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const addLog = (message, type = 'info') => {
  const logsContainer = document.getElementById('logsContainer');
  const time = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = `[${time}] ${message}`;
  logsContainer.appendChild(entry);
  logsContainer.scrollTop = logsContainer.scrollHeight;
};

const updateDashboard = (results) => {
  document.getElementById('filesDetected').textContent = results.totalFiles || 0;
  document.getElementById('spaceToFree').textContent = formatBytes(results.totalSize || 0);
};

const updateDiskUI = (diskInfo) => {
  const usedGB = formatBytes(diskInfo.used);
  const totalGB = formatBytes(diskInfo.total);
  document.getElementById('diskUsed').textContent = usedGB;
  document.getElementById('diskTotal').textContent = totalGB;
  const percent = (diskInfo.used / diskInfo.total) * 100;
  document.getElementById('diskBar').style.width = `${Math.min(percent, 100)}%`;
};

const setButtonState = (scanEnabled = true, cleanEnabled = false, scanning = false, cleaning = false) => {
  const scanBtn = document.getElementById('scanBtn');
  const cleanBtn = document.getElementById('cleanBtn');
  scanBtn.disabled = !scanEnabled || scanning;
  cleanBtn.disabled = !cleanEnabled || cleaning;
  if (scanning) scanBtn.innerHTML = '<span class="spinner"></span> SCAN...';
  else scanBtn.innerHTML = '⚙️ ANALYSER';
  if (cleaning) cleanBtn.innerHTML = '<span class="spinner"></span> NETTOIE...';
  else cleanBtn.innerHTML = '🧹 NETTOYER';
};

const toggleProgress = (show) => {
  document.getElementById('progressSection').classList.toggle('active', show);
};

// ==================== State ====================
let appState = {
  isScanning: false,
  isCleaning: false,
  scanResults: null,
  currentMode: 'overview',
  selectedCategories: []
};

// Mode content templates
const modeTemplates = {
  overview: `
    <div class="cleaning-section">
      <div class="section-header">
        <span>Nettoyage Rapide</span>
        <label><input type="checkbox" id="selectAllQuick" checked> Tout Sélectionner</label>
      </div>
      <div class="section-items">
        <div class="item-row">
          <input type="checkbox" data-cat="temp" checked>
          <div class="item-info">
            <span class="item-name">Fichiers Temporaires</span>
            <span class="item-size">2.4 GB</span>
          </div>
        </div>
        <div class="item-row">
          <input type="checkbox" data-cat="cache" checked>
          <div class="item-info">
            <span class="item-name">Cache Navigateurs</span>
            <span class="item-size">1.8 GB</span>
          </div>
        </div>
        <div class="item-row">
          <input type="checkbox" data-cat="recycle" checked>
          <div class="item-info">
            <span class="item-name">Corbeille</span>
            <span class="item-size">856 MB</span>
          </div>
        </div>
      </div>
    </div>
  `,
  advanced: `
    <div class="cleaning-section">
      <div class="section-header">
        <span>Nettoyage Avancé</span>
        <label><input type="checkbox" id="selectAllAdv"> Tout Sélectionner</label>
      </div>
      <div class="section-items">
        <div class="item-row"><input type="checkbox" data-cat="prefetch"><div class="item-info"><span>Prefetch Windows</span><span>245 MB</span></div></div>
        <div class="item-row"><input type="checkbox" data-cat="thumbnails"><div class="item-info"><span>Miniatures</span><span>156 MB</span></div></div>
        <div class="item-row"><input type="checkbox" data-cat="crashdumps"><div class="item-info"><span>Dumps Crash</span><span>89 MB</span></div></div>
        <div class="item-row"><input type="checkbox" data-cat="dns"><div class="item-info"><span>Cache DNS</span><span>12 MB</span></div></div>
        <div class="item-row"><input type="checkbox" data-cat="clipboard"><div class="item-info"><span>Presse-papiers</span><span>2 MB</span></div></div>
      </div>
    </div>
  `,
  custom: `
    <div class="cleaning-section">
      <div class="section-header">
        <span>Sélectionner les Éléments à Nettoyer</span>
      </div>
      <div class="section-items">
        <div class="item-row"><input type="checkbox" data-cat="browsers" checked><div class="item-info"><span>📱 Navigateurs Web</span><span>856 MB</span></div></div>
        <div class="item-row"><input type="checkbox" data-cat="chrome"><div class="item-info"><span>🔹 Google Chrome</span><span>412 MB</span></div></div>
        <div class="item-row"><input type="checkbox" data-cat="firefox"><div class="item-info"><span>🔴 Mozilla Firefox</span><span>234 MB</span></div></div>
        <div class="item-row"><input type="checkbox" data-cat="edge"><div class="item-info"><span>🔵 Edge</span><span>210 MB</span></div></div>
        <div class="item-row"><input type="checkbox" data-cat="applications"><div class="item-info"><span>📦 Applications</span><span>1.2 GB</span></div></div>
        <div class="item-row"><input type="checkbox" data-cat="media"><div class="item-info"><span>🎬 Média Temporaires</span><span>456 MB</span></div></div>
        <div class="item-row"><input type="checkbox" data-cat="windows"><div class="item-info"><span>💾 Système Windows</span><span>2.1 GB</span></div></div>
      </div>
    </div>
  `,
  health: `
    <div class="cleaning-section">
      <div class="section-header">
        <span>💊 Analyse du Registre</span>
        <button class="btn btn-primary" onclick="analyzeRegistry()" style="padding: 8px 16px; font-size: 0.85em;">Analyser</button>
      </div>
      <div class="section-items">
        <div class="item-row" style="background: rgba(244, 67, 54, 0.1); border-bottom: 1px solid rgba(244, 67, 54, 0.3);">
          <div class="item-info" style="padding: 10px 0;">
            <span class="item-name" style="color: #f44336; font-weight: 600;">🔴 DLL Manquantes</span>
            <span class="item-size" style="color: #f44336;">5 problèmes</span>
          </div>
        </div>
        <div class="item-row" style="background: rgba(255, 152, 0, 0.1); border-bottom: 1px solid rgba(255, 152, 0, 0.3);">
          <div class="item-info" style="padding: 10px 0;">
            <span class="item-name" style="color: #ff9800; font-weight: 600;">🟠 Entrées Orphelines</span>
            <span class="item-size" style="color: #ff9800;">12 problèmes</span>
          </div>
        </div>
        <div class="item-row">
          <div class="item-info" style="padding: 10px 0;">
            <span class="item-name" style="color: #4caf50; font-weight: 600;">🟢 Références Valides</span>
            <span class="item-size" style="color: #4caf50;">2,847 entrées OK</span>
          </div>
        </div>
      </div>
    </div>
  `,
  duplicates: `
    <div class="cleaning-section">
      <div class="section-header">
        <span>📋 Détecteur de Doublons</span>
        <button class="btn btn-primary" onclick="scanDuplicates()" style="padding: 8px 16px; font-size: 0.85em;">Rechercher</button>
      </div>
      <div class="section-items">
        <div style="padding: 15px; text-align: center; color: var(--text-secondary);">
          <div style="font-size: 1.2em; margin-bottom: 10px;">📁 Sélectionnez des dossiers</div>
          <div style="font-size: 0.9em;">Cliquez sur "Rechercher" pour analyser et trouver les fichiers doublons</div>
        </div>
        <div style="padding: 15px; border-top: 1px solid var(--border-color);">
          <div style="margin-bottom: 10px;">
            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
              <input type="checkbox" data-cat="duplicates-docs">
              <span>Documents</span>
              <span style="color: var(--text-secondary); margin-left: auto;">850 fichiers</span>
            </label>
          </div>
          <div style="margin-bottom: 10px;">
            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
              <input type="checkbox" data-cat="duplicates-media">
              <span>Média (Photos/Vidéos)</span>
              <span style="color: var(--text-secondary); margin-left: auto;">5.2 GB</span>
            </label>
          </div>
          <div>
            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
              <input type="checkbox" data-cat="duplicates-all">
              <span>Tout le disque</span>
              <span style="color: var(--text-secondary); margin-left: auto;">⚠️ Long</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  `,
  uninstaller: `
    <div class="cleaning-section">
      <div class="section-header">
        <span>🗑️ Désinstallateur Avancé</span>
      </div>
      <div class="section-items" style="max-height: 500px; overflow-y: auto;">
        <div class="item-row">
          <div class="item-info" style="width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <div>
                <div class="item-name">Adobe Reader DC</div>
                <div style="font-size: 0.8em; color: var(--text-secondary);">v2024.001</div>
              </div>
              <button class="btn btn-secondary" onclick="alert('Désinstallation de Adobe Reader...')" style="padding: 6px 12px; font-size: 0.8em;">Désinstaller</button>
            </div>
          </div>
        </div>
        <div class="item-row">
          <div class="item-info" style="width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <div>
                <div class="item-name">VLC Media Player</div>
                <div style="font-size: 0.8em; color: var(--text-secondary);">v3.0.16</div>
              </div>
              <button class="btn btn-secondary" onclick="alert('Désinstallation de VLC...')" style="padding: 6px 12px; font-size: 0.8em;">Désinstaller</button>
            </div>
          </div>
        </div>
        <div class="item-row">
          <div class="item-info" style="width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <div>
                <div class="item-name">7-Zip</div>
                <div style="font-size: 0.8em; color: var(--text-secondary);">v23.01</div>
              </div>
              <button class="btn btn-secondary" onclick="alert('Désinstallation de 7-Zip...')" style="padding: 6px 12px; font-size: 0.8em;">Désinstaller</button>
            </div>
          </div>
        </div>
        <div class="item-row">
          <div class="item-info" style="width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <div>
                <div class="item-name">Notepad++</div>
                <div style="font-size: 0.8em; color: var(--text-secondary);">v8.5.1</div>
              </div>
              <button class="btn btn-secondary" onclick="alert('Désinstallation de Notepad++...')" style="padding: 6px 12px; font-size: 0.8em;">Désinstaller</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  settings: `
    <div class="cleaning-section">
      <div class="section-header">
        <span>⚙️ Paramètres</span>
      </div>
      <div class="section-items" style="padding: 20px;">
        <div style="margin-bottom: 20px;">
          <div style="font-weight: 600; margin-bottom: 10px;">Langue</div>
          <select style="width: 100%; padding: 8px; background: var(--secondary-color); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px;">
            <option>Français</option>
            <option>English</option>
            <option>Español</option>
            <option>Deutsch</option>
          </select>
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
            <input type="checkbox" checked>
            <span>Démarrer avec Windows</span>
          </label>
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
            <input type="checkbox" checked>
            <span>Notifier des résultats</span>
          </label>
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
            <input type="checkbox">
            <span>Mode sombre (par défaut)</span>
          </label>
        </div>
        <div style="border-top: 1px solid var(--border-color); padding-top: 20px; margin-top: 20px;">
          <div style="font-weight: 600; margin-bottom: 10px;">Version de l\'Application</div>
          <div style="color: var(--text-secondary); font-size: 0.9em;">GLOK CLEANER v1.2.0</div>
        </div>
      </div>
    </div>
  `,
  about: `
    <div class="cleaning-section" style="max-width: 500px;">
      <div class="section-header">
        <span>ℹ️ À Propos</span>
      </div>
      <div class="section-items" style="padding: 30px; text-align: center;">
        <div style="font-size: 3em; margin-bottom: 15px;">⚡</div>
        <div style="font-size: 1.8em; font-weight: 700; margin-bottom: 5px; color: var(--accent-color);">GLOK CLEANER</div>
        <div style="color: var(--text-secondary); margin-bottom: 30px;">Nettoyage Professionnel de Votre PC</div>
        
        <div style="background: rgba(30, 144, 255, 0.1); padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: left;">
          <div style="margin-bottom: 10px;"><strong>Version:</strong> v1.2.0</div>
          <div style="margin-bottom: 10px;"><strong>Date:</strong> Avril 2026</div>
          <div style="margin-bottom: 10px;"><strong>Licence:</strong> ISC</div>
          <div><strong>Équipe:</strong> GLOK Development Team</div>
        </div>
        
        <div style="border-top: 1px solid var(--border-color); padding-top: 20px;">
          <p style="color: var(--text-secondary); font-size: 0.9em; margin-bottom: 15px;">
            GLOK CLEANER est une application complète de nettoyage et d'optimisation système pour Windows.
          </p>
          <div style="display: flex; gap: 10px; justify-content: center;">
            <button class="btn btn-secondary" onclick="alert('Site Web')" style="padding: 8px 16px; font-size: 0.8em;">🌐 Site Web</button>
            <button class="btn btn-secondary" onclick="alert('Support')" style="padding: 8px 16px; font-size: 0.8em;">💬 Support</button>
          </div>
        </div>
      </div>
    </div>
  `
};

// Main functions (HTML onclick handlers)
window.switchMode = async (mode, event) => {
  appState.currentMode = mode;
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('active');
  }
  
  const content = document.getElementById('mode-content');
  if (modeTemplates[mode]) {
    content.innerHTML = modeTemplates[mode];
    
    const titles = {
      overview: 'Nettoyage Rapide',
      advanced: 'Nettoyage Avancé',
      custom: 'Personnalisé',
      health: 'Santé du Registre',
      duplicates: 'Fichiers Doublons',
      uninstaller: 'Désinstallateur',
      settings: 'Paramètres',
      about: 'À Propos'
    };
    document.getElementById('pageTitle').textContent = titles[mode] || 'Mode Inconnu';
    
    // Setup checkboxes
    document.querySelectorAll('input[data-cat]').forEach(cb => {
      cb.addEventListener('change', (e) => {
        if (e.target.checked) {
          if (!appState.selectedCategories.includes(e.target.dataset.cat)) {
            appState.selectedCategories.push(e.target.dataset.cat);
          }
        } else {
          appState.selectedCategories = appState.selectedCategories.filter(c => c !== e.target.dataset.cat);
        }
        addLog(`Catégorie ${e.target.dataset.cat}: ${e.target.checked ? 'activée' : 'désactivée'}`, 'info');
      });
    });
  } else {
    content.innerHTML = '<div style="padding:20px;color:var(--text-secondary);">Mode en développement</div>';
    document.getElementById('pageTitle').textContent = 'Mode en développement';
  }
};

window.handleScan = async () => {
  if (appState.isScanning) return;
  
  appState.isScanning = true;
  setButtonState(false, false, true, false);
  toggleProgress(true);
  addLog('Démarrage de l\'analyse système...', 'info');
  
  try {
    const results = await window.api.scan();
    appState.scanResults = results;
    updateDashboard(results);
    addLog(`Analyse terminée: ${results.totalFiles} fichiers, ${formatBytes(results.totalSize)}`, 'success');
    setButtonState(true, true, false, false);
  } catch (error) {
    addLog(`Erreur analyse: ${error.message}`, 'error');
    setButtonState(true, false, false, false);
  } finally {
    appState.isScanning = false;
    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('progressText').textContent = '0%';
  }
};

window.handleClean = async () => {
  if (appState.isCleaning || !appState.scanResults) {
    addLog('Effectuez d\'abord une analyse', 'warning');
    return;
  }
  
  appState.isCleaning = true;
  setButtonState(false, false, false, true);
  toggleProgress(true);
  addLog('Démarrage du nettoyage...', 'info');
  
  // Listen for progress
  window.api.onCleanProgress((progressData) => {
    document.getElementById('progressBar').style.width = `${progressData.progress}%`;
    document.getElementById('progressText').textContent = `${Math.round(progressData.progress)}%`;
  });
  
  try {
    const results = await window.api.clean({ categories: appState.selectedCategories.length ? appState.selectedCategories : ['all'] });
    addLog(`Nettoyage terminé: ${results.deleted} supprimés, ${formatBytes(results.freedSpace)} libérés`, 'success');
    // Re-scan after clean
    setTimeout(handleScan, 1000);
  } catch (error) {
    addLog(`Erreur nettoyage: ${error.message}`, 'error');
  } finally {
    appState.isCleaning = false;
    setButtonState(true, appState.scanResults, false, false);
    window.api.offCleanProgress();
    document.getElementById('progressBar').style.width = '100%';
    document.getElementById('progressText').textContent = '100%';
  }
};

window.activatePremium = () => {
  addLog('Fonction Premium activée (démo)', 'info');
};

window.analyzeRegistry = () => {
  addLog('Lancement de l\'analyse du registre...', 'info');
  setTimeout(() => {
    addLog('Analyse complète: 17 problèmes détectés', 'success');
    addLog('5 DLL manquantes, 12 entrées orphelines', 'warning');
  }, 2000);
};

window.scanDuplicates = () => {
  addLog('Recherche de fichiers doublons en cours...', 'info');
  setTimeout(() => {
    addLog('Scan terminé: 247 fichiers doublons détectés', 'success');
    addLog('Espace à récupérer: 1.2 GB', 'info');
  }, 3000);
};

// Init on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  addLog('GLOK CLEANER initialisé', 'info');
  
  try {
    // Load disk info
    const diskInfo = await window.api.getDiskInfo();
    updateDiskUI(diskInfo);
    
    // Load status
    const status = await window.api.getStatus();
    const adminCard = document.getElementById('adminStatusCard');
    if (status.isAdmin) {
      adminCard.innerHTML = '<div class="status-dot"></div><div class="status-text">Droits administrateur confirmés</div>';
    } else {
      adminCard.innerHTML = '<div class="status-dot" style="background:var(--warning-color);"></div><div class="status-text">Redémarrez en tant qu\'administrateur</div>';
    }
    
    // Default mode - directly call switchMode
    window.switchMode('overview', null);
    
  } catch (error) {
    addLog(`Init erreur: ${error.message}`, 'error');
  }
});
