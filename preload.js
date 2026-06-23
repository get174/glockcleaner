const { contextBridge, ipcRenderer } = require('electron');

// Exposer uniquement les fonctions nécessaires via contextBridge
contextBridge.exposeInMainWorld('api', {
  // Analyser l'espace disque
  scan: () => ipcRenderer.invoke('scan'),

  // Nettoyer les fichiers (maintenant supporte categories)
  clean: (options) => ipcRenderer.invoke('clean', options),

  // Récupérer l'état (droits admin, etc.)
  getStatus: () => ipcRenderer.invoke('getStatus'),

  // Récupérer les infos disque
  getDiskInfo: () => ipcRenderer.invoke('getDiskInfo'),

  // Récupérer la config actuelle
  getConfig: () => ipcRenderer.invoke('get-config'),

  // Mettre à jour la config
  updateConfig: (newConfig) => ipcRenderer.invoke('update-config', newConfig),

  // Créer un point de restauration système
  createRestorePoint: () => ipcRenderer.invoke('create-restore-point'),

  // Désinstaller une application
  uninstallApp: (appName) => ipcRenderer.invoke('uninstall-app', appName),

  // Ouvrir un lien externe
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Écouter les mises à jour de progression (réel)
  onCleanProgress: (callback) => {
    ipcRenderer.on('clean-progress', (event, data) => callback(data));
  },

  // Retirer l'écouteur
  offCleanProgress: () => {
    ipcRenderer.removeAllListeners('clean-progress');
  },
});

