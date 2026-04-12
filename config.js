/**
 * Configuration de GLOK CLEANER - Améliorée
 */

const path = require('path');
const os = require('os');

module.exports = {
  // Application Info
  appName: 'GLOK CLEANER',
  appVersion: '1.1.0',
  appDescription: 'Nettoyage professionnel de votre système Windows',

  // Chemins de nettoyage étendus
  cleaningPaths: [
    process.env.TEMP || path.join(os.tmpdir()),
    'C:\\Windows\\Temp',
    path.join(os.homedir(), 'AppData', 'Local', 'Temp'),
    path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'Cache'),
    path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'Code Cache'),
    // NOUVEAUX CHEMINS
    path.join(os.homedir(), '$Recycle.Bin'), // Corbeille
    'C:\\Windows\\Prefetch',
    path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Windows', 'Explorer', 'thumbcache_*.db'), // Thumbnails
    path.join(os.homedir(), 'AppData', 'Local', 'Packages', 'Microsoft.MicrosoftEdge_*', 'AC', 'INetCache'), // Edge
    'C:\\Windows\\SoftwareDistribution\\Download', // Windows Update cache
    path.join(os.homedir(), 'AppData', 'Local', 'CrashDumps'), // Crash dumps
  ],

  // Extensions à préserver (étendues)
  preserveExtensions: [
    '.lnk', '.sys', '.ini', '.dll', '.exe', '.com',
    '.mui', '.pf', '.pfm', '.ttf', '.otf', // Polices
    '.tmp.locked', '.crdownload', // Fichiers en téléchargement
  ],

  // Presets de nettoyage par mode
  cleaningPresets: {
    overview: ['temp', 'cache', 'recycle'], // Rapide
    advanced: ['temp', 'cache', 'prefetch', 'thumbnails', 'crashdumps'], // Complet
    custom: ['all'], // Utilisateur sélectionne
    health: ['registry_backup'] // À implémenter
  },

  // UI Configuration étendue
  ui: {
    theme: 'dark',
    accentColor: '#00ff88',
    animationsEnabled: true,
    language: 'fr', // 'fr', 'en', 'es'
    showDetailedStats: true,
  },

  // Sécurité avancée
  requiresAdmin: true,
  enableSandbox: true,
  enableContextIsolation: true,
  dryRunMode: false, // Simulation sans suppression
  maxDeleteBatch: 100, // Par batch pour éviter surcharge

  // Logging avancé
  logLevel: 'info',
  maxLogEntries: 2000,
  logFile: path.join(os.tmpdir(), 'glockcleaner.log'),

  // Performance
  batchSize: 50,
  delayBetweenBatches: 50, // ms augmenté pour stabilité
  maxParallelWorkers: 4, // Pour nettoyage parallèle

  // Planification (future)
  schedule: {
    enabled: false,
    daily: '02:00', // Heure quotidienne
    weekly: false
  }
};

