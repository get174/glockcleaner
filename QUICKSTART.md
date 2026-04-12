# 🚀 Guide de Démarrage Rapide - GLOK CLEANER

## ⚡ Démarrage en 3 étapes

### Étape 1 : Ouvrir PowerShell ou Terminal
Dans le dossier du projet `glockcleaner/`, ouvrez un terminal.

### Étape 2 : Installer les dépendances
```powershell
npm install
```

### Étape 3 : Lancer l'application
```powershell
npm start
```

---

## 📱 Interface de l'application

Une fois l'application lancée, vous verrez :

```
┌─────────────────────────────────────────┐
│        ⚡ GLOK CLEANER               │
│    Nettoyage professionnel du PC     │
└─────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐
│  État du Disque  │  │  Journaux        │
│  250 GB / 500 GB │  │  d'Activité      │
└──────────────────┘  │                  │
│  Fichiers: 0     │  │  - [10:30:45]    │
└──────────────────┘  │    Log 1         │
┌──────────────────┐  │  - [10:30:46]    │
│  Admin: Actif    │  │    Log 2         │
└──────────────────┘  └──────────────────┘
┌──────────────────┐
│  ⚙️ ANALYSER      │
│  🧹 NETTOYER     │
│  📋 LOGS         │
└──────────────────┘
```

---

## 🎯 Utilisation

### 1️⃣ Analyser
- Cliquez sur "ANALYSER"
- Attendez que le scan se termine
- L'application affiche les fichiers trouvés

### 2️⃣ Nettoyer
- Cliquez sur "NETTOYER" (après analyse)
- Confirmez dans la boîte de dialogue
- Attendez que le nettoyage se termine

### 3️⃣ Suivi
- Consultez les logs en temps réel
- La barre de progression indique l'avancement
- Les informations disque se mettent à jour

---

## 🔍 Fichiers créés

- **main.js** - Logique du processus principal Electron
- **preload.js** - Pont de sécurité (Context Bridge)
- **renderer/index.html** - Interface utilisateur avec CSS
- **renderer/index.js** - Interactions et appels IPC
- **config.js** - Configuration de l'application
- **package.json** - Dépendances et scripts

---

## ⚙️ Configuration

Modifiez `config.js` pour personnaliser :
- Les chemins à nettoyer
- La couleur du thème
- Le niveau de log
- Les paramètres de performance

---

## 🆘 Problèmes courants

| Problème | Solution |
|----------|----------|
| Electron non trouvé | `npm install electron` |
| Application qui crash | Vérifiez les logs dans la console |
| Pas de droits admin | Exécutez PowerShell en tant qu'administrateur |
| Fichiers non supprimés | Fermez les applications qui les utilisent |

---

## 🔐 Sécurité & Droits

✅ **Sandbox Electron** : Isolé pour la sécurité
✅ **Context Isolation** : Limitation des accès système
⚠️ **Droits Admin** : Recommandés pour les chemins système

---

## 📚 Fichiers disponibles

Consultez :
- **README.md** - Documentation complète
- **config.js** - Paramètres de configuration
- **main.js** - Implémentation backend
- **renderer/index.html** - Vue HTML avec CSS
- **renderer/index.js** - Logique frontend

---

## 💡 Conseils d'utilisation

✨ **Avant le premier nettoyage** :
- Fermez toutes les applications
- Assurez-vous d'avoir une sauvegarde
- Mettez à jour Windows

✨ **Après le nettoyage** :
- Redémarrez votre ordinateur
- Vérifiez les logs pour les erreurs
- Contrôlez l'espace disque libéré

---

## 🚀 Prochaines étapes

1. Lancer l'application : `npm start`
2. Analyser votre système
3. Nettoyer les fichiers temporaires
4. Vérifier l'espace disque libéré

---

**Bon nettoyage ! 🧹✨**
