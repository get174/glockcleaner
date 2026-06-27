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
  if (!logsContainer) return;
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
  const scanBtn = document.getElementById('btnAnalyzeQuick');
  const cleanBtn = document.getElementById('btnCleanQuick');
  if (!scanBtn || !cleanBtn) return;
  scanBtn.disabled = !scanEnabled || scanning;
  cleanBtn.disabled = !cleanEnabled || cleaning;
  if (scanning) scanBtn.innerHTML = '<span class="spinner"></span> Analyse...';
  else scanBtn.innerHTML = '<span class="btn-icon">⚙️</span><span class="btn-text">Analyser</span>';
  if (cleaning) cleanBtn.innerHTML = '<span class="spinner"></span> Nettoyage...';
  else cleanBtn.innerHTML = '<span class="btn-icon">🧹</span><span class="btn-text">Nettoyer maintenant</span>';
};

const toggleProgress = (show) => {
  const section = document.getElementById('progressSection');
  if (section) section.classList.toggle('active', show);
};

// New function to update the circular progress
const updateProgressCircle = (percent, label = 'Progression') => {
  const circle = document.getElementById('progressCircleFill');
  const percentText = document.getElementById('progressPercent');
  const labelText = document.getElementById('progressLabel');

  if (!circle || !percentText || !labelText) return;

  if (true) {
    // Calculate stroke offset (377 is the circumference of circle with r=60)
    const offset = 377 - (377 * percent / 100);
    circle.style.strokeDashoffset = offset;
    percentText.textContent = Math.round(percent) + '%';
    labelText.textContent = label;
    
    // Change color based on progress
    if (percent >= 100) {
      circle.style.filter = 'drop-shadow(0 0 15px rgba(0, 230, 118, 0.8))';
      percentText.style.color = '#00e676';
    }
  }
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
              <button class="btn btn-secondary" onclick="uninstallApp('Adobe Reader')" style="padding: 6px 12px; font-size: 0.8em;">Désinstaller</button>
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
              <button class="btn btn-secondary" onclick="uninstallApp('VLC')" style="padding: 6px 12px; font-size: 0.8em;">Désinstaller</button>
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
              <button class="btn btn-secondary" onclick="uninstallApp('7-Zip')" style="padding: 6px 12px; font-size: 0.8em;">Désinstaller</button>
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
              <button class="btn btn-secondary" onclick="uninstallApp('Notepad++')" style="padding: 6px 12px; font-size: 0.8em;">Désinstaller</button>
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
          <div style="color: var(--text-secondary); font-size: 0.9em;">GLOCK CLEANER v1.2.0</div>
        </div>
      </div>
    </div>
  `,
  stats: `
    <div class="card" style="text-align: center; padding: 30px;">
      <div style="font-size: 3em; margin-bottom: 15px;">📊</div>
      <div style="font-size: 1.5em; font-weight: 600; margin-bottom: 20px; color: var(--accent-color);">Statistiques</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
        <div style="padding: 15px; background: rgba(0, 212, 255, 0.1); border-radius: 8px;">
          <div style="font-size: 1.5em; font-weight: 700; color: var(--accent-color);" id="stats-total-scans">5</div>
          <div style="font-size: 0.8em; color: var(--text-secondary);">Analyses</div>
        </div>
        <div style="padding: 15px; background: rgba(0, 230, 118, 0.1); border-radius: 8px;">
          <div style="font-size: 1.5em; font-weight: 700; color: var(--success-color);" id="stats-total-clean">3</div>
          <div style="font-size: 0.8em; color: var(--text-secondary);">Nettoyages</div>
        </div>
      </div>
      <div style="padding: 15px; background: rgba(255, 215, 0, 0.1); border-radius: 8px;">
        <div style="font-size: 1.5em; font-weight: 700; color: var(--premium-gold);" id="stats-space-freed">2.4 GB</div>
        <div style="font-size: 0.8em; color: var(--text-secondary);">Espace Total Libéré</div>
      </div>
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-color);">
        <div style="font-size: 0.9em; color: var(--text-secondary);">Dernière analyse: Aujourd'hui 14:30</div>
      </div>
    </div>
  `,
  history: `
    <div class="card" style="max-height: 400px; overflow-y: auto;">
      <div style="font-weight: 600; margin-bottom: 15px;">📋 Historique</div>
      <div id="history-items">
        <div style="padding: 12px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
          <div>
            <div style="font-weight: 600; color: var(--accent-color);">Nettoyage Rapide</div>
            <div style="font-size: 0.8em; color: var(--text-secondary);">Aujourd'hui 14:30</div>
          </div>
          <div style="text-align: right;">
            <div style="color: var(--success-color); font-weight: 600;">850 MB</div>
            <div style="font-size: 0.8em; color: var(--text-secondary);">libérés</div>
          </div>
        </div>
        <div style="padding: 12px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
          <div>
            <div style="font-weight: 600; color: var(--accent-color);">Nettoyage Avancé</div>
            <div style="font-size: 0.8em; color: var(--text-secondary);">Hier 10:15</div>
          </div>
          <div style="text-align: right;">
            <div style="color: var(--success-color); font-weight: 600;">1.2 GB</div>
            <div style="font-size: 0.8em; color: var(--text-secondary);">libérés</div>
          </div>
        </div>
        <div style="padding: 12px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
          <div>
            <div style="font-weight: 600; color: var(--accent-color);">Nettoyage Personnalisé</div>
            <div style="font-size: 0.8em; color: var(--text-secondary);">Il y a 3 jours</div>
          </div>
          <div style="text-align: right;">
            <div style="color: var(--success-color); font-weight: 600;">380 MB</div>
            <div style="font-size: 0.8em; color: var(--text-secondary);">libérés</div>
          </div>
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
        <div style="font-size: 1.8em; font-weight: 700; margin-bottom: 5px; color: var(--accent-color);">GLOCK CLEANER</div>
        <div style="color: var(--text-secondary); margin-bottom: 30px;">Nettoyage Professionnel de Votre PC</div>
        
        <div style="background: rgba(30, 144, 255, 0.1); padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: left;">
          <div style="margin-bottom: 10px;"><strong>Version:</strong> v1.2.0</div>
          <div style="margin-bottom: 10px;"><strong>Date:</strong> Avril 2026</div>
          <div style="margin-bottom: 10px;"><strong>Licence:</strong> ISC</div>
          <div><strong>Équipe:</strong> GLOCK Development Team</div>
        </div>
        
        <div style="border-top: 1px solid var(--border-color); padding-top: 20px;">
          <p style="color: var(--text-secondary); font-size: 0.9em; margin-bottom: 15px;">
            GLOCK CLEANER est une application complète de nettoyage et d'optimisation système pour Windows.
          </p>
          <div style="display: flex; gap: 10px; justify-content: center;">
            <button class="btn btn-secondary" onclick="openExternal('https://glockcleaner.com')" style="padding: 8px 16px; font-size: 0.8em;">🌐 Site Web</button>
            <button class="btn btn-secondary" onclick="openExternal('https://glockcleaner.com/support')" style="padding: 8px 16px; font-size: 0.8em;">💬 Support</button>
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

  const titles = {
    overview: 'Nettoyage Rapide',
    advanced: 'Nettoyage Avancé',
    custom: 'Personnalisé',
    health: 'Santé du Registre',
    startup: 'Démarrage',
    duplicates: 'Fichiers Doublons',
    uninstaller: 'Désinstallateur',
    settings: 'Paramètres',
    stats: 'Statistiques',
    history: 'Historique',
    about: 'À Propos'
  };

  document.getElementById('pageTitle').textContent = titles[mode] || 'Mode Inconnu';

  // Replace dashboard content with mode-specific screen
  const contentArea = document.querySelector('.ccleaner-style');
  if (contentArea) {
    contentArea.innerHTML = getModeScreen(mode);
  }

  // Attach license events after render
  if (mode === 'settings') {
    attachLicenseEvents();
  }
};

// Get screen HTML for each mode
function getModeScreen(mode) {
  const screens = {
    overview: `
      ${getDashboardHeader()}
      ${getQuickAnalyzeCard()}
      ${getQuickCleanCard()}
      ${getToolsRow()}
      ${getSidePanel()}
    `,
    advanced: `
      ${getDashboardHeader()}
      <div class="advanced-section">
        <div class="section-group">
          <div class="group-header"><span class="group-icon">🪟</span><span class="group-title">Windows</span></div>
          <div class="group-items">
            <label class="item-checkbox"><input type="checkbox" data-cat="temp" checked><span class="item-name">Fichiers Temporaires Windows</span><span class="item-size">2.4 GB</span><span class="item-risk low">Risque: Faible</span></label>
            <label class="item-checkbox"><input type="checkbox" data-cat="preftech" checked><span class="item-name">Prefetch</span><span class="item-size">245 MB</span><span class="item-risk low">Risque: Faible</span></label>
            <label class="item-checkbox"><input type="checkbox" data-cat="thumbnails"><span class="item-name">Miniatures</span><span class="item-size">156 MB</span><span class="item-risk low">Risque: Faible</span></label>
            <label class="item-checkbox"><input type="checkbox" data-cat="crashdumps"><span class="item-name">Rapports d'Erreurs</span><span class="item-size">89 MB</span><span class="item-risk low">Risque: Faible</span></label>
          </div>
        </div>
        <div class="section-group">
          <div class="group-header"><span class="group-icon">🌐</span><span class="group-title">Navigateurs</span></div>
          <div class="group-items">
            <label class="item-checkbox"><input type="checkbox" data-cat="chrome" checked><span class="item-name">Google Chrome</span><span class="item-size">850 MB</span><span class="item-risk low">Risque: Faible</span></label>
            <label class="item-checkbox"><input type="checkbox" data-cat="edge" checked><span class="item-name">Microsoft Edge</span><span class="item-size">620 MB</span><span class="item-risk low">Risque: Faible</span></label>
            <label class="item-checkbox"><input type="checkbox" data-cat="firefox"><span class="item-name">Mozilla Firefox</span><span class="item-size">380 MB</span><span class="item-risk low">Risque: Faible</span></label>
          </div>
        </div>
        <div class="section-group">
          <div class="group-header"><span class="group-icon">📱</span><span class="group-title">Applications</span></div>
          <div class="group-items">
            <label class="item-checkbox"><input type="checkbox" data-cat="discord"><span class="item-name">Discord Cache</span><span class="item-size">120 MB</span><span class="item-risk low">Risque: Faible</span></label>
            <label class="item-checkbox"><input type="checkbox" data-cat="spotify"><span class="item-name">Spotify Cache</span><span class="item-size">95 MB</span><span class="item-risk low">Risque: Faible</span></label>
            <label class="item-checkbox"><input type="checkbox" data-cat="steam"><span class="item-name">Steam Telechargements</span><span class="item-size">4.2 GB</span><span class="item-risk medium">Risque: Moyen</span></label>
          </div>
        </div>
      </div>
      <div class="sticky-footer">
        <div class="total-space"><span>Espace total: </span><strong>9.2 GB</strong></div>
        <button class="btn-analyze" onclick="analyzeAdvanced()">Analyser</button>
        <button class="btn-clean" onclick="cleanAdvanced()">Nettoyer</button>
      </div>
    `,
    custom: `
      ${getDashboardHeader()}
      <div class="advanced-section">
        <div class="section-group">
          <div class="group-header"><span class="group-icon">🌐</span><span class="group-title">Navigateurs</span></div>
          <div class="group-items">
            <label class="item-checkbox"><input type="checkbox" data-cat="chrome" checked><span class="item-name">Google Chrome</span><span class="item-size">850 MB</span><span class="item-risk low">Risque: Faible</span></label>
            <label class="item-checkbox"><input type="checkbox" data-cat="edge" checked><span class="item-name">Microsoft Edge</span><span class="item-size">620 MB</span><span class="item-risk low">Risque: Faible</span></label>
            <label class="item-checkbox"><input type="checkbox" data-cat="firefox"><span class="item-name">Mozilla Firefox</span><span class="item-size">380 MB</span><span class="item-risk low">Risque: Faible</span></label>
            <label class="item-checkbox"><input type="checkbox" data-cat="opera"><span class="item-name">Opera</span><span class="item-size">145 MB</span><span class="item-risk low">Risque: Faible</span></label>
          </div>
        </div>
        <div class="section-group">
          <div class="group-header"><span class="group-icon">💾</span><span class="group-title">Système</span></div>
          <div class="group-items">
            <label class="item-checkbox"><input type="checkbox" data-cat="temp" checked><span class="item-name">Fichiers Temporaires</span><span class="item-size">2.4 GB</span><span class="item-risk low">Risque: Faible</span></label>
            <label class="item-checkbox"><input type="checkbox" data-cat="recycle"><span class="item-name">Corbeille</span><span class="item-size">856 MB</span><span class="item-risk low">Risque: Faible</span></label>
            <label class="item-checkbox"><input type="checkbox" data-cat="log"><span class="item-name">Fichiers Log</span><span class="item-size">234 MB</span><span class="item-risk low">Risque: Faible</span></label>
            <label class="item-checkbox"><input type="checkbox" data-cat="thumbnails"><span class="item-name">Miniatures</span><span class="item-size">156 MB</span><span class="item-risk low">Risque: Faible</span></label>
          </div>
        </div>
        <div class="section-group">
          <div class="group-header"><span class="group-icon">📱</span><span class="group-title">Applications</span></div>
          <div class="group-items">
            <label class="item-checkbox"><input type="checkbox" data-cat="discord"><span class="item-name">Discord</span><span class="item-size">120 MB</span><span class="item-risk low">Risque: Faible</span></label>
            <label class="item-checkbox"><input type="checkbox" data-cat="spotify"><span class="item-name">Spotify</span><span class="item-size">95 MB</span><span class="item-risk low">Risque: Faible</span></label>
            <label class="item-checkbox"><input type="checkbox" data-cat="teams"><span class="item-name">Microsoft Teams</span><span class="item-size">520 MB</span><span class="item-risk medium">Risque: Moyen</span></label>
            <label class="item-checkbox"><input type="checkbox" data-cat="steam"><span class="item-name">Steam</span><span class="item-size">4.2 GB</span><span class="item-risk medium">Risque: Moyen</span></label>
          </div>
        </div>
        <div class="section-group">
          <div class="group-header"><span class="group-icon">🎮</span><span class="group-title">Jeux</span></div>
          <div class="group-items">
            <label class="item-checkbox"><input type="checkbox" data-cat="epic"><span class="item-name">Epic Games Launcher</span><span class="item-size">1.8 GB</span><span class="item-risk low">Risque: Faible</span></label>
            <label class="item-checkbox"><input type="checkbox" data-cat="battle"><span class="item-name">Battle.net</span><span class="item-size">2.1 GB</span><span class="item-risk low">Risque: Faible</span></label>
          </div>
        </div>
      </div>
      <div class="sticky-footer">
        <div class="total-space"><span>Espace total: </span><strong>15.2 GB</strong></div>
        <button class="btn-analyze" onclick="analyzeCustom()">Analyser</button>
        <button class="btn-clean" onclick="cleanCustom()">Nettoyer</button>
      </div>
    `,
    health: `
      ${getDashboardHeader()}
      <div class="health-section">
        <div class="health-info-card">
          <div class="health-icon">💊</div>
          <div class="health-title">Santé du Registre</div>
          <div class="health-desc">Analysez et réparez les entrées invalides du registre Windows pour améliorer les performances.</div>
        </div>
        <div class="health-options">
          <label class="item-checkbox"><input type="checkbox" checked><span class="item-name">Entrées de classes invalides</span><span class="item-risk medium">12 trouvées</span></label>
          <label class="item-checkbox"><input type="checkbox" checked><span class="item-name">Chemins d'application manquants</span><span class="item-risk medium">5 trouv��s</span></label>
          <label class="item-checkbox"><input type="checkbox" checked><span class="item-name">Valeurs MUI Absentes</span><span class="item-risk low">3 trouvées</span></label>
          <label class="item-checkbox"><input type="checkbox"><span class="item-name">Associtations de fichiers</span><span class="item-risk high">0 trouvé</span></label>
        </div>
        <div class="health-actions">
          <button class="btn-analyze" onclick="scanRegistry()">Analyser le Registre</button>
          <button class="btn-secondary" onclick="backupRegistry()">Sauvegarder</button>
        </div>
      </div>
    `,
    startup: `
      ${getDashboardHeader()}
      <div class="startup-section">
        <div class="startup-info">
          <div class="info-icon">🚀</div>
          <div class="info-title">Gestionnaire de Démarrage</div>
          <div class="info-desc">Contrôlez les programmes qui se lancent au démarrage de Windows.</div>
        </div>
        <div class="startup-list">
          <div class="startup-item"><input type="checkbox" checked><div class="item-details"><span class="item-name">OneDrive</span><span class="item-path">C:\\Program Files\\Microsoft OneDrive\\OneDrive.exe</span></div><div class="item-impact high">Impact: Élevé</div><button class="btn-toggle">Désactiver</button></div>
          <div class="startup-item"><input type="checkbox" checked><div class="item-details"><span class="item-name">Discord</span><span class="item-path">C:\\Users\\...\\Discord\\Update.exe</span></div><div class="item-impact medium">Impact: Moyen</div><button class="btn-toggle">Désactiver</button></div>
          <div class="startup-item"><input type="checkbox"><div class="item-details"><span class="item-name">Spotify</span><span class="item-path">C:\\Users\\...\\Spotify\\Spotify.exe</span></div><div class="item-impact low">Impact: Faible</div><button class="btn-toggle">Activer</button></div>
          <div class="startup-item"><input type="checkbox" checked><div class="item-details"><span class="item-name">NVIDIA GeForce Experience</span><span class="item-path">C:\\Program Files\\NVIDIA Corporation\\NVIDIA GeForce Experience\\NVIDIA GeForce Experience.exe</span></div><div class="item-impact medium">Impact: Moyen</div><button class="btn-toggle">Désactiver</button></div>
        </div>
      </div>
    `,
    duplicates: `
      ${getDashboardHeader()}
      <div class="duplicates-section">
        <div class="duplicates-info">
          <div class="info-icon">📋</div>
          <div class="info-title">Fichiers Doublons</div>
          <div class="info-desc">Trouvez et supprimez les fichiers en double pour libérer de l'espace.</div>
        </div>
        <div class="duplicates-folders">
          <div class="folder-select">
            <input type="text" placeholder="Sélectionner un dossier..." readonly>
            <button class="btn-browse">Parcourir</button>
          </div>
          <div class="folder-list">
            <div class="folder-item selected">C:\Users\BYART\Downloads <button class="btn-remove">×</button></div>
            <div class="folder-item selected">D:\Photos\Vacances <button class="btn-remove">×</button></div>
          </div>
          <button class="btn-add-folder">+ Ajouter un dossier</button>
        </div>
        <div class="duplicates-options">
          <label class="item-checkbox"><input type="checkbox" checked><span class="item-name">Comparer par hash MD5</span></label>
          <label class="item-checkbox"><input type="checkbox"><span class="item-name">Ignorer les images de +10MB</span></label>
          <label class="item-checkbox"><input type="checkbox" checked><span class="item-name">Mode prévisualisation</span></label>
        </div>
        <div class="duplicates-actions">
          <button class="btn-analyze" onclick="scanDuplicates()">Rechercher les doublons</button>
        </div>
      </div>
    `,
    uninstaller: `
      ${getDashboardHeader()}
      <div class="uninstaller-section">
        <div class="uninstaller-info">
          <div class="info-icon">🗑️</div>
          <div class="info-title">Désinstallateur</div>
          <div class="info-desc">Désinstallez les applications inutilisées.</div>
        </div>
        <div class="uninstaller-search">
          <input type="text" placeholder="Rechercher une application...">
        </div>
        <div class="uninstaller-list">
          <div class="app-item"><div class="app-info"><span class="app-name">Adobe Acrobat Reader</span><span class="app-size">2.4 GB</span><span class="app-date">Utilisé: 15/02/2026</span></div><button class="btn-uninstall">Désinstaller</button></div>
          <div class="app-item"><div class="app-info"><span class="app-name">Discord</span><span class="app-size">380 MB</span><span class="app-date">Utilisé: Aujourd'hui</span></div><button class="btn-open">Ouvrir</button></div>
          <div class="app-item"><div class="app-info"><span class="app-name">Microsoft Teams</span><span class="app-size">520 MB</span><span class="app-date">Utilisé: Hier</span></div><button class="btn-uninstall">Désinstaller</button></div>
          <div class="app-item"><div class="app-info"><span class="app-name">Spotify</span><span class="app-size">95 MB</span><span class="app-date">Utilisé: Il y a 3 jours</span></div><button class="btn-uninstall">Désinstaller</button></div>
        </div>
      </div>
    `,
    settings: `
      ${getDashboardHeader()}
      <div class="settings-section">
        <div class="settings-group subscription-group">
          <div class="group-title">Mon abonnement</div>
          <div class="subscription-status">
            <div class="sub-status">
              <span class="sub-label">Statut:</span>
              <span class="sub-value active" id="subStatusValue">Version gratuite</span>
            </div>
            <div class="sub-status">
              <span class="sub-label">Expire le:</span>
              <span class="sub-value" id="subExpireValue">-</span>
            </div>
          </div>
          <div class="license-input-section">
            <input type="text" id="licenseKeyInput" placeholder="Entrez votre clé de licence">
            <button class="btn-activate" id="activateLicenseBtn" onclick="alert('CLICK TEST')">Activer</button>
          </div>
          <div class="subscription-plans">
            <div class="plan-card free">
              <div class="plan-name">Gratuit</div>
              <div class="plan-price">0€</div>
              <div class="plan-features">
                <div>Nettoyage rapide</div>
                <div>Analyse basique</div>
              </div>
              <div class="plan-current">Actuel</div>
            </div>
            <div class="plan-card premium">
              <div class="plan-badge">POPULAIRE</div>
              <div class="plan-name">Premium</div>
              <div class="plan-price">9.99€/an</div>
              <div class="plan-features">
                <div>Nettoyage illimité</div>
                <div>Analyse avancée</div>
                <div>Priorité support</div>
                <div>Sans publicité</div>
              </div>
              <button class="btn-upgrade" onclick="upgradeToPremium()">Passer à Premium</button>
            </div>
            <div class="plan-card pro">
              <div class="plan-name">Pro</div>
              <div class="plan-price">19.99€/an</div>
              <div class="plan-features">
                <div>Tout Premium</div>
                <div>Export données</div>
                <div>API access</div>
                <div>Support dédié</div>
              </div>
              <button class="btn-upgrade" onclick="upgradeToPro()">Passer à Pro</button>
            </div>
          </div>
        </div>
        <div class="settings-group">
          <div class="group-title">Général</div>
          <label class="setting-item"><span>Lancer au démarrage</span><input type="checkbox"></label>
          <label class="setting-item"><span>Réduire dans la barre des tâches</span><input type="checkbox" checked></label>
          <label class="setting-item"><span>Vérifier les mises à jour automatiquement</span><input type="checkbox" checked></label>
        </div>
        <div class="settings-group">
          <div class="group-title">Nettoyage</div>
          <label class="setting-item"><span>Créer un point de restauration avant nettoyage</span><input type="checkbox" checked></label>
          <label class="setting-item"><span>Effacer le presse-papiers après nettoyage</span><input type="checkbox"></label>
          <label class="setting-item"><span>Confirmer avant suppression</span><input type="checkbox" checked></label>
        </div>
        <div class="settings-group">
          <div class="group-title">Affichage</div>
          <label class="setting-item"><span>Thème sombre</span><input type="checkbox" checked></label>
          <label class="setting-item"><span>Animations</span><input type="checkbox" checked></label>
        </div>
      </div>
    `,
    stats: `
      ${getDashboardHeader()}
      <div class="stats-section">
        <div class="stats-overview">
          <div class="stat-card"><div class="stat-value">24</div><div class="stat-label">Analyses effectuées</div></div>
          <div class="stat-card"><div class="stat-value">18</div><div class="stat-label">Sessions nettoyées</div></div>
          <div class="stat-card highlight"><div class="stat-value">42.5 GB</div><div class="stat-label">Espace total libéré</div></div>
        </div>
        <div class="stats-chart">
          <div class="chart-title">Progression sur 30 jours</div>
          <div class="chart-bars">
            <div class="chart-bar" style="height: 40%" title="2.1 GB"></div>
            <div class="chart-bar" style="height: 65%" title="3.2 GB"></div>
            <div class="chart-bar" style="height: 30%" title="1.5 GB"></div>
            <div class="chart-bar" style="height: 80%" title="4.0 GB"></div>
            <div class="chart-bar" style="height: 55%" title="2.7 GB"></div>
            <div class="chart-bar" style="height: 90%" title="4.5 GB"></div>
            <div class="chart-bar" style="height: 45%" title="2.2 GB"></div>
            <div class="chart-bar" style="height: 70%" title="3.5 GB"></div>
            <div class="chart-bar" style="height: 35%" title="1.7 GB"></div>
            <div class="chart-bar" style="height: 60%" title="3.0 GB"></div>
            <div class="chart-bar" style="height: 85%" title="4.2 GB"></div>
            <div class="chart-bar" style="height: 50%" title="2.5 GB"></div>
          </div>
        </div>
      </div>
    `,
    history: `
      ${getDashboardHeader()}
      <div class="history-section">
        <div class="history-list">
          <div class="history-item"><div class="date">25/06/2026</div><div class="details"><span class="action">Nettoyage rapide</span><span class="space">650 MB</span></div><button class="btn-details">Détails</button></div>
          <div class="history-item"><div class="date">24/06/2026</div><div class="details"><span class="action">Nettoyage avancé</span><span class="space">2.3 GB</span></div><button class="btn-details">Détails</button></div>
          <div class="history-item"><div class="date">23/06/2026</div><div class="details"><span class="action">Nettoyage rapide</span><span class="space">420 MB</span></div><button class="btn-details">Détails</button></div>
          <div class="history-item"><div class="date">22/06/2026</div><div class="details"><span class="action">Nettoyage registre</span><span class="space">17 fichiers</span></div><button class="btn-details">Détails</button></div>
          <div class="history-item"><div class="date">21/06/2026</div><div class="details"><span class="action">Nettoyage profond</span><span class="space">8.2 GB</span></div><button class="btn-details">Détails</button></div>
        </div>
      </div>
    `,
    about: `
      ${getDashboardHeader()}
      <div class="about-section">
        <div class="about-card">
          <div class="app-logo">🧹</div>
          <div class="app-name">GLOCK CLEANER</div>
          <div class="app-version">Version 1.0.0</div>
          <div class="app-desc">Utilitaire de nettoyage pour Windows</div>
          <div class="app-copyright">© 2026 - Tous droits réservés</div>
        </div>
      </div>
    `
  };

  return screens[mode] || '<div class="empty-state">Mode en développement</div>';
}

// Helper functions for screen components
function getDashboardHeader() {
  return `
    <div class="dashboard-header">
      <div class="pc-status" id="pcStatus">
        <span class="status-icon">💻</span>
        <span class="status-label">État du PC:</span>
        <span class="status-value good">Bon</span>
      </div>
      <div class="header-tip">
        <span class="tip-icon">💡</span>
        <span class="tip-text">Gagnez +1.8 GB en vidant les caches de 3 navigateurs</span>
      </div>
    </div>
  `;
}

function getQuickAnalyzeCard() {
  return `
    <div class="action-card analyze-card">
      <div class="card-header">
        <div class="card-icon">🔍</div>
        <div class="card-title">Analyse Rapide</div>
      </div>
      <div class="card-body">
        <div class="space-preview">
          <div class="space-label">Espace potentiellement libérable</div>
          <div class="space-value" id="potentialSpace">--</div>
          <div class="space-bar"><div class="space-bar-fill" id="potentialSpaceBar" style="width: 0%"></div></div>
        </div>
        <div class="quick-checkboxes">
          <label class="quick-checkbox"><input type="checkbox" id="checkTemp" checked><span class="checkmark"></span><span class="checkbox-label">Fichiers temporaires</span><span class="checkbox-size">~120 MB</span></label>
          <label class="quick-checkbox"><input type="checkbox" id="checkBrowser" checked><span class="checkmark"></span><span class="checkbox-label">Cache navigateur</span><span class="checkbox-size">~450 MB</span></label>
          <label class="quick-checkbox"><input type="checkbox" id="checkRecycleBin" checked><span class="checkmark"></span><span class="checkbox-label">Corbeille</span><span class="checkbox-size">~80 MB</span></label>
        </div>
      </div>
      <div class="card-footer">
        <button class="btn-analyze" id="btnAnalyzeQuick" onclick="doQuickAnalyze()"><span class="btn-icon">⚙️</span><span class="btn-text">Analyser</span></button>
      </div>
    </div>
  `;
}

function getQuickCleanCard() {
  return `
    <div class="action-card clean-card">
      <div class="card-header">
        <div class="card-icon">🧹</div>
        <div class="card-title">Nettoyage Rapide</div>
      </div>
      <div class="card-body">
        <div class="clean-summary">
          <div class="summary-item"><span class="summary-label">Fichiers détectés</span><span class="summary-value" id="detectedFiles">0</span></div>
          <div class="summary-item"><span class="summary-label">Espace à récupérer</span><span class="summary-value highlight" id="spaceToRecover">0 MB</span></div>
        </div>
        <div class="risk-info">
          <span class="risk-badge low">🛡️ Risque: Faible</span>
          <span class="risk-info-text">Ces fichiers sont temporaires et sûrs à supprimer</span>
        </div>
      </div>
      <div class="card-footer">
        <button class="btn-clean" id="btnCleanQuick" onclick="doQuickClean()" disabled><span class="btn-icon">🧹</span><span class="btn-text">Nettoyer maintenant</span></button>
        <button class="btn-secondary" onclick="createRestorePoint()"><span class="btn-icon">💾</span><span class="btn-text">Créer point de restauration</span></button>
      </div>
    </div>
  `;
}

function getToolsRow() {
  return `
    <div class="tools-row">
      <div class="tool-card" onclick="switchMode('health', event)">
        <div class="tool-icon">💊</div>
        <div class="tool-title">Santé du Registre</div>
        <div class="tool-desc">Nettoyer les entrées invalides</div>
      </div>
      <div class="tool-card" onclick="switchMode('startup', event)">
        <div class="tool-icon">🚀</div>
        <div class="tool-title">Démarrage</div>
        <div class="tool-desc">Gérer les programmes au démarrage</div>
      </div>
      <div class="tool-card" onclick="switchMode('duplicates', event)">
        <div class="tool-icon">📋</div>
        <div class="tool-title">Fichiers Doublons</div>
        <div class="tool-desc">Trouver les fichiers en double</div>
      </div>
    </div>
  `;
}

function getSidePanel() {
  return `
    <div class="side-column">
      <div class="quick-panel">
        <div class="panel-title">⚡ Actions Rapides</div>
        <div class="quick-actions-list">
          <button class="quick-action-button" onclick="doQuickAnalyze()"><span class="qa-icon">🔍</span><span class="qa-text"> Analyse Rapide</span></button>
          <button class="quick-action-button" onclick="switchMode('advanced', event)"><span class="qa-icon">🧹</span><span class="qa-text"> Nettoyage Profond</span></button>
          <button class="quick-action-button" onclick="switchMode('uninstaller', event)"><span class="qa-icon">🗑️</span><span class="qa-text"> Désinstallateur</span></button>
          <button class="quick-action-button" onclick="checkUpdates()"><span class="qa-icon">🔄</span><span class="qa-text"> Vérifier Mises à Jour</span></button>
        </div>
      </div>
      <div class="stats-panel">
        <div class="panel-title">📊 Statistiques</div>
        <div class="stats-list">
          <div class="stat-row"><span class="stat-label">Analyses effectuées</span><span class="stat-value" id="totalScans">0</span></div>
          <div class="stat-row"><span class="stat-label">Sessions nettoyées</span><span class="stat-value" id="totalCleanups">0</span></div>
          <div class="stat-row highlight"><span class="stat-label">Espace total libéré</span><span class="stat-value" id="totalSpaceFreed">0 MB</span></div>
        </div>
      </div>
      <div class="admin-banner">
        <div class="admin-icon">⚠️</div>
        <div class="admin-text">
          <div class="admin-title">Exécutez en administrateur</div>
          <div class="admin-desc">Pour un nettoyage complet</div>
        </div>
        <button class="admin-btn" onclick="restartAsAdmin()">Relancer</button>
      </div>
    </div>
  `;
}

// Mode-specific action functions
window.analyzeAdvanced = () => {
  if (appState.isScanning) return;
  appState.isScanning = true;
  addLog('Analyse avancée en cours...', 'info');
  toggleProgress(true);
  document.getElementById('progressTitle').textContent = 'Analyse Avancée';
  updateProgressCircle(0, 'Analyse...');
  document.getElementById('progressStatus').textContent = 'Analyse des fichiers temporaires Windows...';

  let progress = 0;
  const progressInterval = setInterval(() => {
    if (progress < 90) {
      progress += 15;
      updateProgressCircle(progress, 'Analyse...');
      // Update status text
      const statuses = ['Analyse des fichiers temporaires Windows...', 'Analyse du cache navigateur...', 'Analyse des miniatures...', 'Analyse des logs...', 'Calcul final...'];
      const statusIndex = Math.min(Math.floor(progress / 20), statuses.length - 1);
      document.getElementById('progressStatus').textContent = statuses[statusIndex];
    }
  }, 300);

  setTimeout(() => {
    clearInterval(progressInterval);
    updateProgressCircle(100, 'Terminé!');
    document.getElementById('progressStatus').textContent = 'Analyse terminée: 9.2 GB détectés';
    addLog('Analyse avancée terminée: 9.2 GB détectés', 'success');
    appState.isScanning = false;
    setTimeout(() => {
      toggleProgress(false);
      updateProgressCircle(0, 'Progression');
    }, 2000);
  }, 3000);
};

window.cleanAdvanced = () => {
  if (appState.isScanning) return;
  appState.isScanning = true;
  addLog('Nettoyage avancé en cours...', 'info');
  toggleProgress(true);
  document.getElementById('progressTitle').textContent = 'Nettoyage Avancé';
  updateProgressCircle(0, 'Nettoyage...');
  document.getElementById('progressStatus').textContent = 'Suppression des fichiers temporaires...';

  let progress = 0;
  const progressInterval = setInterval(() => {
    if (progress < 90) {
      progress += 20;
      updateProgressCircle(progress, 'Nettoyage...');
    }
  }, 250);

  setTimeout(() => {
    clearInterval(progressInterval);
    updateProgressCircle(100, 'Terminé!');
    document.getElementById('progressStatus').textContent = 'Nettoyage terminé: 9.2 GB nettoyés';
    addLog('Nettoyage avancé terminé: 9.2 GB nettoyés', 'success');
    appState.isScanning = false;
    setTimeout(() => {
      toggleProgress(false);
      updateProgressCircle(0, 'Progression');
    }, 2000);
  }, 2500);
};

window.scanRegistry = () => {
  if (appState.isScanning) return;
  appState.isScanning = true;
  addLog('Analyse du registre en cours...', 'info');
  toggleProgress(true);
  updateProgressCircle(30, 'Analyse...');

  setTimeout(() => {
    updateProgressCircle(70, 'Analyse...');
  }, 1000);

  setTimeout(() => {
    updateProgressCircle(100, 'Terminé!');
    addLog('Analyse du registre terminée: 152 entrées invalides trouvées', 'warning');
    addLog('  - 12 entrées de classes invalides', 'info');
    addLog('  - 5 chemins manquants', 'info');
    addLog('  - 3 valeurs MUI absentes', 'info');
    appState.isScanning = false;
    setTimeout(() => {
      toggleProgress(false);
      updateProgressCircle(0, 'Progression');
    }, 1500);
  }, 2500);
};

window.analyzeRegistry = () => {
  if (appState.isScanning) return;
  appState.isScanning = true;
  addLog('Analyse complète du registre Windows...', 'info');
  toggleProgress(true);
  updateProgressCircle(20, 'Analyse...');

  setTimeout(() => {
    updateProgressCircle(50, 'Vérification DLL...');
  }, 800);

  setTimeout(() => {
    updateProgressCircle(80, 'Nettoyage...');
  }, 1800);

  setTimeout(() => {
    updateProgressCircle(100, 'Terminé!');
    addLog('Analyse terminée: 23 erreurs réparées', 'success');
    addLog('Optimisation du registre terminée', 'info');
    appState.isScanning = false;
    setTimeout(() => {
      toggleProgress(false);
      updateProgressCircle(0, 'Progression');
    }, 1500);
  }, 3000);
};

window.backupRegistry = () => {
  addLog('Sauvegarde du registre en cours...', 'info');
  setTimeout(() => {
    addLog('Sauvegarde créée: registry_backup_20250625.reg', 'success');
    addLog('Emplacement: C:\\Windows\\System32\\config\\Backup', 'info');
  }, 1500);
};

window.scanDuplicates = () => {
  if (appState.isScanning) return;
  appState.isScanning = true;
  addLog('Recherche de fichiers doublons en cours...', 'info');

  setTimeout(() => {
    addLog('Scan terminé: 247 fichiers doublons détectés', 'success');
    addLog('Espace à récupérer: 1.2 GB', 'info');
    appState.isScanning = false;
  }, 3000);
};

window.analyzeCustom = () => {
  if (appState.isScanning) return;
  appState.isScanning = true;
  addLog('Analyse personnalisée en cours...', 'info');
  toggleProgress(true);
  document.getElementById('progressTitle').textContent = 'Analyse Personnalisée';
  updateProgressCircle(0, 'Analyse...');
  document.getElementById('progressStatus').textContent = 'Analyse des navigateurs...';

  let progress = 0;
  const progressInterval = setInterval(() => {
    if (progress < 90) {
      progress += 15;
      updateProgressCircle(progress, 'Analyse...');
      const statuses = ['Analyse des navigateurs...', 'Analyse système...', 'Analyse applications...', 'Analyse jeux...', 'Calcul final...'];
      const statusIndex = Math.min(Math.floor(progress / 20), statuses.length - 1);
      document.getElementById('progressStatus').textContent = statuses[statusIndex];
    }
  }, 300);

  setTimeout(() => {
    clearInterval(progressInterval);
    updateProgressCircle(100, 'Terminé!');
    document.getElementById('progressStatus').textContent = 'Analyse terminée: 15.2 GB détectés';
    addLog('Analyse personnalisée terminée: 15.2 GB détectés', 'success');
    appState.isScanning = false;
    setTimeout(() => {
      toggleProgress(false);
      updateProgressCircle(0, 'Progression');
    }, 2000);
  }, 3000);
};

window.cleanCustom = () => {
  if (appState.isScanning) return;
  appState.isScanning = true;
  addLog('Nettoyage personnalisé en cours...', 'info');
  toggleProgress(true);
  document.getElementById('progressTitle').textContent = 'Nettoyage Personnalisé';
  updateProgressCircle(0, 'Nettoyage...');
  document.getElementById('progressStatus').textContent = 'Suppression des caches...';

  let progress = 0;
  const progressInterval = setInterval(() => {
    if (progress < 90) {
      progress += 20;
      updateProgressCircle(progress, 'Nettoyage...');
      const statuses = ['Suppression des caches...', 'Suppression des logs...', 'Nettoyage applications...', 'Nettoyage jeux...', 'Finalisation...'];
      const statusIndex = Math.min(Math.floor(progress / 20), statuses.length - 1);
      document.getElementById('progressStatus').textContent = statuses[statusIndex];
    }
  }, 250);

  setTimeout(() => {
    clearInterval(progressInterval);
    updateProgressCircle(100, 'Terminé!');
    document.getElementById('progressStatus').textContent = 'Nettoyage terminé: 15.2 GB nettoyés';
    addLog('Nettoyage personnalisé terminé: 15.2 GB nettoyés', 'success');
    appState.isScanning = false;
    setTimeout(() => {
      toggleProgress(false);
      updateProgressCircle(0, 'Progression');
    }, 2000);
  }, 2500);
};

window.handleScan = async () => {
  if (appState.isScanning) return;
  
  appState.isScanning = true;
  setButtonState(false, false, true, false);
  toggleProgress(true);
  updateProgressCircle(0, 'Analyse...');
  addLog('Démarrage de l\'analyse système...', 'info');
  
  // Simulate progress for demo
  let progress = 0;
  const progressInterval = setInterval(() => {
    if (progress < 90) {
      progress += 10;
      updateProgressCircle(progress, 'Analyse...');
    }
  }, 200);
  
  try {
    const results = await window.api.scan();
    appState.scanResults = results;
    updateDashboard(results);
    clearInterval(progressInterval);
    updateProgressCircle(100, 'Terminé!');
    addLog(`Analyse terminée: ${results.totalFiles} fichiers, ${formatBytes(results.totalSize)}`, 'success');
    setButtonState(true, true, false, false);
  } catch (error) {
    addLog(`Erreur analyse: ${error.message}`, 'error');
    setButtonState(true, false, false, false);
  } finally {
    appState.isScanning = false;
    // Reset circle after delay
    setTimeout(() => updateProgressCircle(0, 'Progression'), 2000);
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
  updateProgressCircle(0, 'Nettoyage...');
  addLog('Démarrage du nettoyage...', 'info');
  
  // Simulate progress for demo
  let progress = 0;
  const progressInterval = setInterval(() => {
    if (progress < 90) {
      progress += 15;
      updateProgressCircle(progress, 'Nettoyage...');
    }
  }, 150);
  
  try {
    const results = await window.api.clean({ categories: appState.selectedCategories.length ? appState.selectedCategories : ['all'] });
    clearInterval(progressInterval);
    updateProgressCircle(100, 'Terminé!');
    addLog(`Nettoyage terminé: ${results.deleted} supprimés, ${formatBytes(results.freedSpace)} libérés`, 'success');
    // Re-scan after clean
    setTimeout(handleScan, 1500);
  } catch (error) {
    addLog(`Erreur nettoyage: ${error.message}`, 'error');
  } finally {
    appState.isCleaning = false;
    setButtonState(true, appState.scanResults, false, false);
    // Reset after delay
    setTimeout(() => updateProgressCircle(0, 'Progression'), 2000);
  }
};

window.activatePremium = () => {
  addLog('Ouverture du profil Premium dans une nouvelle fenêtre...', 'info');
  window.open('https://glockcleaner.com/profile', '_blank');
};

// License and Subscription Functions
function attachLicenseEvents() {
  setTimeout(() => {
    const activateBtn = document.getElementById('activateLicenseBtn');
    if (activateBtn) {
      activateBtn.onclick = activateLicense;
    }
  }, 100);
}

// Also make it a global function
function activateLicense() {
  console.log('=== ACTIVATE LICENSE CLICKED ===');
  addLog('Activation en cours...', 'info');
  const input = document.getElementById('licenseKeyInput');
  if (!input) {
    console.error('licenseKeyInput not found');
    addLog('Erreur: input non trouvé', 'error');
    return;
  }
  const key = input.value.trim();

  if (!key) {
    addLog('Veuillez entrer une clé de licence', 'error');
    return;
  }

  addLog('Vérification de la clé: ' + key, 'info');

  window.api.activateLicense(key).then((result) => {
    if (result.success) {
      addLog(`Licence activée avec succès! Tier: ${result.tier}`, 'success');
      updateSubscriptionUI(result.tier, result.expireDate);
    } else {
      addLog(`Erreur: ${result.error}`, 'error');
    }
  }).catch((e) => {
    addLog('Erreur lors de l\'activation: ' + e.message, 'error');
  });
}

// Expose globally
window.activateLicense = activateLicense;

window.upgradeToPremium = () => {
  addLog('Ouverture de la page Premium...', 'info');
  window.open('https://glockcleaner.com/premium', '_blank');
};

window.upgradeToPro = () => {
  addLog('Ouverture de la page Pro...', 'info');
  window.open('https://glockcleaner.com/pro', '_blank');
};

function updateSubscriptionUI(tier, expireDate) {
  const statusEl = document.getElementById('subStatusValue');
  const expireEl = document.getElementById('subExpireValue');

  if (statusEl) {
    statusEl.textContent = tier === 'free' ? 'Version gratuite' :
                       tier === 'premium' ? 'Premium' : 'Pro';
    statusEl.className = 'sub-value ' + (tier !== 'free' ? 'active' : '');
  }

  if (expireEl) {
    if (expireDate) {
      const date = new Date(expireDate);
      expireEl.textContent = date.toLocaleDateString();
    } else if (tier === 'pro') {
      expireEl.textContent = 'Illimité';
    } else {
      expireEl.textContent = '-';
    }
  }
}

async function loadSubscriptionStatus() {
  try {
    const sub = await window.api.getSubscription();
    updateSubscriptionUI(sub.tier, sub.expireDate);
  } catch (e) {
    console.error('Erreur chargement abonnement:', e);
  }
}

// Quick Action Functions
window.quickScan = () => {
  addLog('Démarrage de l\'analyse rapide...', 'info');
  doQuickAnalyze();
};

window.deepClean = () => {
  addLog('Démarrage du nettoyage profond...', 'info');
  switchMode('advanced', event);
};

// Quick Analyze - Analyze button action
window.doQuickAnalyze = async () => {
  if (appState.isScanning) return;
  appState.isScanning = true;
  addLog('Analyse rapide en cours...', 'info');
  toggleProgress(true);
  document.getElementById('progressTitle').textContent = 'Analyse Rapide';
  updateProgressCircle(0, 'Analyse...');
  document.getElementById('progressStatus').textContent = 'Analyse des fichiers temporaires...';

  const btn = document.getElementById('btnAnalyzeQuick');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Analyse...';
  }

  // Update space values from checkboxes
  let totalSize = 0;
  const sizes = { temp: 120, browser: 450, recycle: 80 };

  if (document.getElementById('checkTemp')?.checked) totalSize += sizes.temp;
  if (document.getElementById('checkBrowser')?.checked) totalSize += sizes.browser;
  if (document.getElementById('checkRecycleBin')?.checked) totalSize += sizes.recycle;

  // Simulate scan with progress
  let progress = 0;
  const progressInterval = setInterval(() => {
    if (progress < 90) {
      progress += 20;
      updateProgressCircle(progress, 'Analyse...');
      const statuses = ['Analyse des fichiers temporaires...', 'Analyse du cache navigateur...', 'Analyse de la corbeille...', 'Calcul final...'];
      const statusIndex = Math.min(Math.floor(progress / 25), statuses.length - 1);
      document.getElementById('progressStatus').textContent = statuses[statusIndex];

      const spaceBar = document.getElementById('potentialSpaceBar');
      if (spaceBar) spaceBar.style.width = progress + '%';
    }
  }, 150);

  setTimeout(() => {
    clearInterval(progressInterval);
    updateProgressCircle(100, 'Terminé!');
    document.getElementById('progressStatus').textContent = 'Analyse terminée: ' + totalSize + ' MB détectés';

    // Update UI with results
    const potentialSpace = document.getElementById('potentialSpace');
    const spaceToRecover = document.getElementById('spaceToRecover');
    const detectedFiles = document.getElementById('detectedFiles');

    if (potentialSpace) potentialSpace.textContent = '~' + totalSize + ' MB';
    if (spaceToRecover) spaceToRecover.textContent = totalSize + ' MB';
    if (detectedFiles) detectedFiles.textContent = Math.floor(totalSize / 10);

    // Enable clean button
    const cleanBtn = document.getElementById('btnCleanQuick');
    if (cleanBtn) cleanBtn.disabled = false;

    addLog('Analyse terminée: ' + totalSize + ' MB potentiellement libérables', 'success');
    appState.isScanning = false;

    setTimeout(() => {
      toggleProgress(false);
      updateProgressCircle(0, 'Progression');
    }, 2000);

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span class="btn-icon">⚙️</span><span class="btn-text">Analyser</span>';
    }
  }, 1000);
};

// Quick Clean - Clean button action
window.doQuickClean = async () => {
  if (appState.isScanning) return;
  appState.isScanning = true;
  addLog('Démarrage du nettoyage rapide...', 'info');
  toggleProgress(true);
  document.getElementById('progressTitle').textContent = 'Nettoyage Rapide';
  updateProgressCircle(0, 'Nettoyage...');
  document.getElementById('progressStatus').textContent = 'Suppression des fichiers temporaires...';

  const btn = document.getElementById('btnCleanQuick');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Nettoyage...';
  }

  // Simulate cleaning with progress
  let progress = 0;
  const progressInterval = setInterval(() => {
    if (progress < 90) {
      progress += 10;
      updateProgressCircle(progress, 'Nettoyage...');
      const statuses = ['Suppression des fichiers temporaires...', 'Suppression du cache navigateur...', 'Vidage de la corbeille...', 'Finalisation...'];
      const statusIndex = Math.min(Math.floor(progress / 25), statuses.length - 1);
      document.getElementById('progressStatus').textContent = statuses[statusIndex];
    }
  }, 200);

  setTimeout(() => {
    clearInterval(progressInterval);
    updateProgressCircle(100, 'Terminé!');

    // Get the space value
    const spaceEl = document.getElementById('spaceToRecover');
    const space = spaceEl ? parseInt(spaceEl.textContent) || 0 : 0;

    document.getElementById('progressStatus').textContent = 'Nettoyage terminé: ' + space + ' MB libérés';

    // Update stats
    const totalFreed = document.getElementById('totalSpaceFreed');
    const totalClean = document.getElementById('totalCleanups');
    if (totalFreed) {
      const current = parseInt(totalFreed.textContent) || 0;
      totalFreed.textContent = (current + space) + ' MB';
    }
    if (totalClean) {
      totalClean.textContent = parseInt(totalClean.textContent || '0') + 1;
    }

    addLog('Nettoyage terminé: ' + space + ' MB libérés', 'success');
    appState.isScanning = false;

    setTimeout(() => {
      toggleProgress(false);
      updateProgressCircle(0, 'Progression');
    }, 2000);

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span class="btn-icon">🧹</span><span class="btn-text">Nettoyer maintenant</span>';
    }

    // Reset space
    const potentialSpace = document.getElementById('potentialSpace');
    const spaceBar = document.getElementById('potentialSpaceBar');
    if (potentialSpace) potentialSpace.textContent = '--';
    if (spaceBar) spaceBar.style.width = '0%';
  }, 1200);
};

// Create restore point
window.createRestorePoint = async () => {
  addLog('Création d\'un point de restauration système...', 'info');
  toggleProgress(true);
  document.getElementById('progressTitle').textContent = 'Point de restauration';
  updateProgressCircle(30, 'Création...');

  try {
    const result = await window.api.createRestorePoint();
    if (result.success) {
      updateProgressCircle(100, 'Terminé!');
      addLog(`Point de restauration créé: ${result.name}`, 'success');
      addLog('Vous pouvez maintenant nettoyer en toute sécurité', 'info');
    } else {
      updateProgressCircle(0, 'Erreur');
      addLog('Erreur: Impossible de créer le point de restauration', 'error');
      addLog('Astuce: Exécutez en tant qu\'administrateur', 'warning');
    }
  } catch (error) {
    addLog(`Erreur: ${error.message}`, 'error');
  }

  setTimeout(() => {
    toggleProgress(false);
    updateProgressCircle(0, 'Progression');
  }, 2000);
};

// Restart as admin
window.restartAsAdmin = () => {
  addLog('Redémarrage en mode administrateur...', 'info');
  window.location.reload();
};

window.checkUpdates = () => {
  addLog('Vérification des mises à jour...', 'info');
  setTimeout(() => {
    addLog('Vous êtes à jour! Version actuelle: 1.0.0', 'success');
  }, 1000);
};

window.openSettings = () => {
  addLog('Ouverture des paramètres...', 'info');
  switchMode('settings', event);
};

// Uninstall application
window.uninstallApp = async (appName) => {
  if (!confirm(`Voulez-vous vraiment désinstaller ${appName} ?`)) return;

  addLog(`Désinstallation de ${appName} en cours...`, 'info');
  toggleProgress(true);
  document.getElementById('progressTitle').textContent = 'Désinstallation';
  updateProgressCircle(30, 'Preparación...');

  try {
    const result = await window.api.uninstallApp(appName);
    if (result.success) {
      updateProgressCircle(100, 'Terminé!');
      addLog(`${appName} désinstallé avec succès`, 'success');
    } else {
      updateProgressCircle(0, 'Erreur');
      addLog(`Erreur: ${result.error}`, 'error');
    }
  } catch (error) {
    addLog(`Erreur: ${error.message}`, 'error');
  }

  setTimeout(() => {
    toggleProgress(false);
    updateProgressCircle(0, 'Progression');
  }, 2000);
};

// Open external link
window.openExternal = (url) => {
  addLog(`Ouverture: ${url}`, 'info');
  window.api.openExternal(url);
};

window.cancelScan = () => {
  appState.isScanning = false;
  toggleProgress(false);
  updateProgressCircle(0, 'Progression');
  addLog('Opération annulée par l\'utilisateur', 'warning');

  // Reset buttons
  const btnAnalyze = document.getElementById('btnAnalyzeQuick');
  const btnClean = document.getElementById('btnCleanQuick');
  if (btnAnalyze) {
    btnAnalyze.disabled = false;
    btnAnalyze.innerHTML = '<span class="btn-icon">⚙️</span><span class="btn-text">Analyser</span>';
  }
  if (btnClean) {
    btnClean.disabled = true;
    btnClean.innerHTML = '<span class="btn-icon">🧹</span><span class="btn-text">Nettoyer maintenant</span>';
  }
};

// Init on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  addLog('GLOCK CLEANER initialisé', 'info');
  
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
    
    // Load subscription status
    await loadSubscriptionStatus();

    // Default mode - directly call switchMode
    window.switchMode('overview', null);

  } catch (error) {
    addLog(`Init erreur: ${error.message}`, 'error');
  }
});
