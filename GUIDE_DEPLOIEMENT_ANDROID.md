# 🚀 Guide de Déploiement Android - Devis Rénovation Pro

## 📋 Informations de l'Application

| Élément | Valeur |
|---------|--------|
| **Nom** | Devis Rénovation Pro |
| **Package** | `com.renovationpro.devis` |
| **Version** | 1.0.0 |
| **Description** | Créez des devis et factures professionnels pour vos projets de rénovation |

---

## 🔧 Étape 1 : Prérequis

### A. Créer un compte Google Play Developer
1. Allez sur [Google Play Console](https://play.google.com/console)
2. Connectez-vous avec votre compte Google
3. Payez les frais d'inscription uniques de **25$**
4. Remplissez les informations de votre entreprise

### B. Installer les outils Expo (sur votre ordinateur)
```bash
# Installer Node.js si pas déjà fait
# https://nodejs.org/

# Installer EAS CLI globalement
npm install -g eas-cli

# Se connecter à Expo
eas login
```

---

## 📱 Étape 2 : Préparer le Build

### A. Cloner votre projet
Téléchargez votre code depuis Emergent et placez-le sur votre ordinateur.

### B. Configurer EAS
Dans le dossier `frontend/`, exécutez :
```bash
cd frontend

# Initialiser le projet EAS (première fois seulement)
eas build:configure

# Cela va créer/mettre à jour eas.json et ajouter le projectId
```

### C. Configurer les variables d'environnement
Créez un fichier `.env.production` :
```
EXPO_PUBLIC_API_URL=https://votre-domaine.com
```

---

## 🏗️ Étape 3 : Générer le Build Android

### Option A : Build APK (pour tester)
```bash
eas build --platform android --profile preview
```
Cela génère un fichier `.apk` que vous pouvez installer directement sur un téléphone Android.

### Option B : Build AAB (pour Play Store)
```bash
eas build --platform android --profile production
```
Cela génère un fichier `.aab` (Android App Bundle) requis par le Play Store.

---

## 📤 Étape 4 : Publier sur Google Play Store

### A. Préparer les assets
Vous aurez besoin de :
- **Icône** : 512x512 PNG (déjà créée ✅)
- **Feature Graphic** : 1024x500 PNG
- **Screenshots** : Au moins 2 captures d'écran (téléphone)
- **Description courte** : Max 80 caractères
- **Description complète** : Max 4000 caractères

### B. Créer l'application dans Play Console
1. Allez dans [Google Play Console](https://play.google.com/console)
2. Cliquez sur **"Créer une application"**
3. Remplissez les informations :
   - Nom : `Devis Rénovation Pro`
   - Langue par défaut : `Français`
   - Type : `Application`
   - Gratuit/Payant : À vous de choisir

### C. Configurer la fiche Store
1. **Détails de l'application**
   - Titre : Devis Rénovation Pro
   - Description courte : Créez des devis et factures professionnels pour vos projets de rénovation
   - Description complète : (voir suggestion ci-dessous)

2. **Éléments graphiques**
   - Uploadez l'icône
   - Uploadez les screenshots
   - Uploadez le Feature Graphic

### D. Uploader l'AAB
1. Allez dans **Version** > **Production** > **Créer une release**
2. Uploadez le fichier `.aab` généré par EAS
3. Ajoutez les notes de version
4. Cliquez sur **Examiner la release**

### E. Remplir les questionnaires
Google demande plusieurs informations :
- Classification du contenu
- Application cible (public)
- Politique de confidentialité (URL requise)
- Accès au compte (pour les reviewers)

---

## 📝 Suggestion de Description Complète

```
🏠 Devis Rénovation Pro - L'outil indispensable pour les professionnels de la rénovation

Créez des devis et factures professionnels en quelques minutes directement depuis votre téléphone !

✨ FONCTIONNALITÉS PRINCIPALES :

📋 Création de Devis
• Cuisines : types, plans de travail, extras
• Parquets : stratifié, massif avec pose
• Peinture : murs et plafonds
• Cloisons : tous types avec options
• Services : déplacement, nettoyage, débarras

💰 Calcul Automatique
• Prix TTC avec calcul automatique HT/TVA
• Gestion des articles offerts
• Sous-totaux par catégorie

📄 PDF Professionnels
• Devis et factures au format PDF
• Groupés par catégorie
• Conditions de paiement personnalisables
• Numérotation automatique

🔄 Workflow Complet
• Transformez vos devis en factures en 1 clic
• Suivi du statut des factures
• Export et partage facile

👤 Profil Entreprise
• Logo personnalisé
• Coordonnées complètes
• Numéros SIRET/RCS/TVA

💼 Idéal pour :
• Artisans du bâtiment
• Entreprises de rénovation
• Auto-entrepreneurs
• Architectes d'intérieur

📱 Application 100% mobile, travaillez où que vous soyez !
```

---

## ⚠️ Points Importants

### Politique de Confidentialité
Vous devez avoir une politique de confidentialité accessible par URL. Exemple de contenu minimal :
- Quelles données vous collectez
- Comment vous les utilisez
- Comment les utilisateurs peuvent vous contacter

### Backend / API
Pour que l'application fonctionne en production, vous devrez :
1. Déployer votre backend sur un serveur (AWS, DigitalOcean, etc.)
2. Configurer une base de données MongoDB
3. Mettre à jour l'URL de l'API dans les variables d'environnement

---

## 🎯 Checklist Finale

- [ ] Compte Google Play Developer créé
- [ ] EAS CLI installé et configuré
- [ ] Build AAB généré
- [ ] Icône 512x512 prête
- [ ] Feature Graphic 1024x500 créé
- [ ] Screenshots capturés
- [ ] Description rédigée
- [ ] Politique de confidentialité publiée
- [ ] Backend déployé en production
- [ ] Application uploadée sur Play Console
- [ ] Questionnaires Google remplis
- [ ] Release soumise pour review

---

## 📞 Support

Si vous avez des questions sur le déploiement, n'hésitez pas à demander !

Bonne publication ! 🎉
