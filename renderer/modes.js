
// Mock data for modes
const mockData = {
  health: {
    title: 'Santé du Registre',
    description: 'Analyse avancée du registre Windows',
    stats: [
      { label: 'DLL Manquantes', value: 5, risk: 'high' },
      { label: 'Clés Orphelines', value: 12, risk: 'medium' },
      { label: 'Références Rompues', value: 3, risk: 'low' }
    ],
    actions: ['Réparer', 'Sauvegarder', 'Ignorer']
  },
  duplicates: {
    title: 'Fichiers Doublons',
    description: 'Détecte et supprime les doublons',
    stats: { total: 247, space: '1.2 GB' },
    preview: ['photo1.jpg (2x)', 'document.pdf (3x)', 'video.mp4 (1.5GB)']
  },
  uninstaller: {
    title: 'Désinstallateur',
    description: 'Gérer les applications installées',
    apps: [
      { name: 'Adobe Reader', size: '150MB', version: '2023' },
      { name: 'VLC', size: '45MB', version: '3.0' }
    ]
  },
  about: {
    title: 'À Propos',
    version: 'v1.2.0',
    credits: 'Glok Team 2024',
    license: 'ISC'
  }
};

export default mockData;

