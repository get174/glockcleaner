# ⚡ GLOK CLEANER

Une application de nettoyage de PC professionnel pour Windows construite avec **Electron.js**.

## 🎯 Fonctionnalités

✨ **Analyse intelligente** : Détecte et calcule l'espace disque utilisé par :
- Dossiers temporaires Windows (`%TEMP%`, `C:\Windows\Temp`)
- Cache applicatif
- Cache navigateur (Chrome)

🧹 **Nettoyage sécurisé** : Supprime les fichiers temporaires inutilisés avec gestion des erreurs

📊 **Dashboard en temps réel** : Affiche l'état du disque et les résultats d'analyse

🔐 **Gestion des droits** : Détecte automatiquement les droits administrateur

🌙 **Interface moderne** : Design Dark Mode futuriste avec thème Néon

---

## 📋 Prérequis

- **Node.js** v14 ou supérieur
- **npm** v6 ou supérieur
- **Windows** (application destinée à Windows)
- **Droits administrateur** (recommandés pour les fonctionnalités complètes)

---

## 🚀 Installation

### 1. Cloner ou télécharger le projet

```bash
git clone <repository-url>
cd glockcleaner
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Lancer l'application

```bash
npm start
```

---

## 🛠️ Commandes disponibles

| Commande | Description |
|----------|-------------|
| `npm start` | Lance l'application Electron |
| `npm run dev` | Lance l'application en mode développement |

---

## 📁 Structure du projet

```
glockcleaner/
├── main.js                 # Processus principal Electron
├── preload.js             # Contexte de sécurité (Bridge)
├── package.json           # Configuration du projet
├── renderer/              # Interface utilisateur
│   ├── index.html         # Fichier HTML principal
│   └── index.js           # Logique de l'interface
└── node_modules/          # Dépendances installées
```

---

## 🔧 Architecture Electron

### **main.js** - Processus Principal
Gère :
- La création de la fenêtre principale
- Les opérations IPC (Inter-Process Communication)
- Les analyses de disque
- Les suppressions de fichiers
- La vérification des droits administrateur

Handlers IPC disponibles :
- `scan` : Analyse les fichiers temporaires
- `clean` : Supprime les fichiers détectés
- `getStatus` : Récupère l'état du système
- `getDiskInfo` : Obtient les infos du disque

### **preload.js** - Pont de Sécurité
Expose uniquement les APIs sécurisées :
```javascript
window.api.scan()
window.api.clean(paths)
window.api.getStatus()
window.api.getDiskInfo()
```

### **renderer/index.html** - Interface
- Design Dark Mode avec thème Néon (#00ff88)
- Boutons interactifs avec effets de lueur
- Barre de progression animée
- Zone de logs en temps réel
- Dashboard avec infos système

---

## 💻 Usage

### 1. **Analyser le système**
   - Cliquez sur le bouton "ANALYSER"
   - L'application détecte automatiquement les fichiers temporaires
   - Affiche la taille totale et le nombre de fichiers

### 2. **Nettoyer**
   - Une fois l'analyse complète, cliquez sur "NETTOYER"
   - Confirmez l'action dans la boîte de dialogue
   - Les fichiers sont supprimés progressivement
   - Les logs affichent le détail de chaque opération

### 3. **Suivi**
   - La barre de progression indique l'avancement
   - Les logs affichent chaque action en temps réel
   - L'interface se met à jour avec l'espace disque libéré

---

## 🔒 Sécurité

- **Context Isolation** : Activée pour isoler le processus de rendu
- **Sandbox** : Actif pour limiter les accès système
- **Node Integration** : Désactivé
- **Remote Module** : Désactivé
- **Preload Script** : Utilisé pour exposer uniquement les APIs nécessaires

---

## 📊 Chemins nettoyés

L'application supprime les fichiers temporaires dans :

- `%TEMP%` (Dossier temporaire utilisateur)
- `%USERPROFILE%\AppData\Local\Temp`
- `C:\Windows\Temp` (Temp système)
- `%USERPROFILE%\AppData\Local\Google\Chrome\User Data\Default\Cache`
- `%USERPROFILE%\AppData\Local\Google\Chrome\User Data\Default\Code Cache`

---

## ⚠️ Avertissements

⚠️ **Cette application supprime définitivement les fichiers**. Assurez-vous que :
- Vous ne supprimez pas les dossiers temporaires actuellement en cours d'utilisation
- Vous avez une sauvegarde de vos données importantes
- L'application est exécutée avec les droits appropriés

---

## 🐛 Dépannage

### L'application ne démarre pas
```bash
# Vérifiez que Electron est installé
npm list electron

# Réinstallez les dépendances
rm -r node_modules
npm install
```

### Les droits admin ne sont pas détectés
- Assurez-vous d'exécuter l'application en tant qu'administrateur
- Redémarrez l'application une fois les droits obtenus

### Les fichiers ne sont pas supprimés
- Vérifiez que vous avez les droits administrateur
- Vérifiez que les fichiers ne sont pas verrouillés par d'autres applications
- Compétés les logs pour les messages d'erreur

---

## 📝 Stack Technique

| Technologie | Version |
|-------------|---------|
| **Electron** | ^41.0.1 |
| **Node.js** | v14+ |
| **JavaScript** | ES6+ |
| **fs-extra** | ^11.3.4 |

---

## 📄 Licence

ISC License

---

## 👨‍💻 Développement

### Mode développement avec DevTools
Modifiez `main.js` :
```javascript
mainWindow.webContents.openDevTools();
```

### Modification du design
- **Couleurs** : Modifiez les variables CSS dans `renderer/index.html`
- **Polices** : Ajustez le CSS pour changer la typographie
- **Layout** : Modifiez le HTML pour restructurer l'interface

---

## 📞 Support

Pour signaler des bugs ou des suggestions :
1. Vérifiez les logs sur l'interface
2. Consultez la console de développement (F12)
3. Vérifiez que toutes les dépendances sont installées

---

**Créé avec ❤️ par Glok Team**

*Dernière mise à jour : 2026*
