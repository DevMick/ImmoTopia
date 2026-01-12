# Guide Utilisateur : Créer vos Modèles de Documents pour les Baux

## 📋 Introduction

Ce guide vous explique comment créer et gérer vos propres modèles de documents (contrats de bail, reçus de loyer, etc.) personnalisés pour votre agence immobilière. Vous pouvez ainsi utiliser votre propre mise en page, votre logo et vos conditions spécifiques.

## 🎯 Types de Documents Disponibles

Vous pouvez créer des modèles pour les types de documents suivants :

1. **Bail Habitation** (`LEASE_HABITATION`) - Contrat de location pour un bien d'habitation
2. **Bail Commercial** (`LEASE_COMMERCIAL`) - Contrat de location pour un bien commercial
3. **Reçu de Loyer** (`RENT_RECEIPT`) - Reçu de paiement de loyer
4. **Relevé de Compte** (`RENT_STATEMENT`) - Relevé de compte locatif

## 📝 Étape 1 : Préparer votre Modèle DOCX

### Créer le Fichier Word

1. Ouvrez Microsoft Word (ou un autre éditeur compatible DOCX)
2. Créez votre document avec la mise en page souhaitée :
   - Ajoutez votre logo en en-tête
   - Définissez vos polices et couleurs
   - Structurez le document comme vous le souhaitez

### Utiliser les Variables (Placeholders)

Dans votre document Word, utilisez des **variables** au format `{{NOM_VARIABLE}}` pour que le système remplace automatiquement ces valeurs lors de la génération du document.

**Exemple de texte dans votre document :**

```
CONTRAT DE BAIL HABITATION

Entre les soussignés :

{{AGENCE_NOM}}
{{AGENCE_ADRESSE}}
Téléphone : {{AGENCE_TELEPHONE}}
Email : {{AGENCE_EMAIL}}

Et :

{{LOCATAIRE_NOM}}
Email : {{LOCATAIRE_EMAIL}}

Pour le bien situé au :
{{BIEN_ADRESSE}}
Type : {{BIEN_TYPE}}
Surface : {{BIEN_SURFACE}} m²
Nombre de pièces : {{BIEN_PIECES}}

CONDITIONS DU BAIL

Numéro de bail : {{BAIL_NUMERO}}
Date de début : {{BAIL_DATE_DEBUT}}
Date de fin : {{BAIL_DATE_FIN}}
Loyer mensuel : {{BAIL_LOYER_MENSUEL}} FCFA
Charges : {{BAIL_CHARGES}} FCFA
Dépôt de garantie : {{BAIL_DEPOT_GARANTIE}} FCFA
Fréquence de paiement : {{BAIL_FREQUENCE}}
Jour d'échéance : Le {{BAIL_JOUR_ECHEANCE}} de chaque mois

Fait le {{DATE_GENERATION}}
```

### Variables Disponibles par Type de Document

#### Pour les Baux (Habitation et Commercial)

**Informations de l'Agence :**
- `{{AGENCE_NOM}}` - Nom de votre agence
- `{{AGENCE_ADRESSE}}` - Adresse de l'agence
- `{{AGENCE_TELEPHONE}}` - Téléphone de l'agence
- `{{AGENCE_EMAIL}}` - Email de l'agence

**Informations du Locataire :**
- `{{LOCATAIRE_NOM}}` - Nom complet du locataire principal
- `{{LOCATAIRE_EMAIL}}` - Email du locataire
- `{{LOCATAIRE_TELEPHONE}}` - Téléphone du locataire (si disponible)

**Informations du Bailleur :**
- `{{BAILLEUR_NOM}}` - Nom du propriétaire/bailleur
- `{{BAILLEUR_EMAIL}}` - Email du bailleur
- `{{BAILLEUR_TELEPHONE}}` - Téléphone du bailleur (si disponible)

**Informations du Bien :**
- `{{BIEN_ADRESSE}}` - Adresse complète du bien
- `{{BIEN_TYPE}}` - Type de bien (Appartement, Maison, etc.)
- `{{BIEN_SURFACE}}` - Surface en m²
- `{{BIEN_PIECES}}` - Nombre de pièces
- `{{BIEN_CHAMBRES}}` - Nombre de chambres

**Informations du Bail :**
- `{{BAIL_NUMERO}}` - Numéro unique du bail
- `{{BAIL_DATE_DEBUT}}` - Date de début (format DD/MM/YYYY)
- `{{BAIL_DATE_FIN}}` - Date de fin (format DD/MM/YYYY)
- `{{BAIL_LOYER_MENSUEL}}` - Montant du loyer mensuel (formaté en FCFA)
- `{{BAIL_CHARGES}}` - Montant des charges (formaté en FCFA)
- `{{BAIL_DEPOT_GARANTIE}}` - Montant du dépôt de garantie (formaté en FCFA)
- `{{BAIL_FREQUENCE}}` - Fréquence de facturation (MENSUEL, TRIMESTRIEL, etc.)
- `{{BAIL_JOUR_ECHEANCE}}` - Jour du mois pour l'échéance

**Dates :**
- `{{DATE_GENERATION}}` - Date de génération du document (format DD/MM/YYYY)

#### Pour les Reçus de Loyer

**Informations de l'Agence :**
- `{{AGENCE_NOM}}`, `{{AGENCE_ADRESSE}}`, `{{AGENCE_TELEPHONE}}`, `{{AGENCE_EMAIL}}`

**Informations du Locataire :**
- `{{LOCATAIRE_NOM}}`, `{{LOCATAIRE_EMAIL}}`

**Informations du Bail :**
- `{{BAIL_NUMERO}}`, `{{BAIL_LOYER_MENSUEL}}`

**Informations du Paiement :**
- `{{PAIEMENT_MONTANT}}` - Montant payé (formaté en FCFA)
- `{{PAIEMENT_METHODE}}` - Méthode de paiement (Espèces, Virement, etc.)
- `{{PAIEMENT_DATE}}` - Date du paiement (format DD/MM/YYYY)
- `{{PAIEMENT_NUMERO}}` - Numéro de référence du paiement

**Période :**
- `{{PERIODE_MOIS}}` - Période au format MM/YYYY
- `{{PERIODE_ANNEE}}` - Année

**Date :**
- `{{DATE_GENERATION}}` - Date de génération du document

#### Pour les Relevés de Compte

**Informations de l'Agence :**
- `{{AGENCE_NOM}}`, `{{AGENCE_ADRESSE}}`, `{{AGENCE_TELEPHONE}}`, `{{AGENCE_EMAIL}}`

**Informations du Locataire :**
- `{{LOCATAIRE_NOM}}`, `{{LOCATAIRE_EMAIL}}`

**Informations du Bail :**
- `{{BAIL_NUMERO}}`, `{{BAIL_LOYER_MENSUEL}}`

**Période :**
- `{{PERIODE_DEBUT}}` - Date de début de période (format DD/MM/YYYY)
- `{{PERIODE_FIN}}` - Date de fin de période (format DD/MM/YYYY)

**Soldes :**
- `{{TOTAL_DU}}` - Total dû (formaté en FCFA)
- `{{TOTAL_PAYE}}` - Total payé (formaté en FCFA)
- `{{SOLDE}}` - Solde restant (formaté en FCFA)

**Date :**
- `{{DATE_GENERATION}}` - Date de génération du document

### Conseils pour la Création du Modèle

1. **Testez d'abord avec un modèle simple** pour comprendre le fonctionnement
2. **Utilisez des tableaux** pour organiser les informations si nécessaire
3. **Ajoutez votre logo** en en-tête ou en pied de page
4. **Vérifiez l'orthographe** des noms de variables (ils sont sensibles à la casse)
5. **Sauvegardez en format DOCX** (pas .doc)

## 📤 Étape 2 : Télécharger votre Modèle

### Via l'Interface Web

1. Connectez-vous à votre compte ImmoTopia
2. Accédez à la section **"Templates de Documents"** dans le menu
3. Cliquez sur le bouton **"+ Ajouter un template"**
4. Remplissez le formulaire :
   - **Type de document** : Sélectionnez le type (Bail Habitation, Bail Commercial, etc.)
   - **Nom du template** : Donnez un nom descriptif (ex: "Contrat Bail Standard 2024")
   - **Fichier** : Sélectionnez votre fichier DOCX
5. Cliquez sur **"Télécharger"**

### Vérification après Téléchargement

Après le téléchargement, le système :
- ✅ Vérifie que le fichier est valide
- ✅ Extrait automatiquement toutes les variables utilisées
- ✅ Active le template par défaut (s'il s'agit de votre premier template pour ce type)

## ⚙️ Étape 3 : Gérer vos Modèles

### Lister vos Modèles

Dans la page "Templates de Documents", vous pouvez :
- Voir tous vos templates
- Filtrer par type de document
- Voir le statut de chaque template (Actif/Inactif)

### Définir un Template par Défaut

1. Trouvez le template que vous souhaitez utiliser par défaut
2. Cliquez sur **"Définir par défaut"**
3. Ce template sera automatiquement utilisé lors de la génération de documents de ce type

**Note :** Vous ne pouvez avoir qu'un seul template par défaut par type de document.

### Activer/Désactiver un Template

- **Activer** : Le template peut être utilisé pour générer des documents
- **Désactiver** : Le template est conservé mais ne sera pas utilisé

Pour changer le statut :
1. Cliquez sur le template concerné
2. Cliquez sur **"Activer"** ou **"Désactiver"**

### Supprimer un Template

1. Cliquez sur **"Supprimer"** pour le template concerné
2. Confirmez la suppression

**Attention :** La suppression est définitive. Les documents déjà générés avec ce template ne seront pas affectés, mais vous ne pourrez plus régénérer ces documents avec ce template.

## 🔄 Étape 4 : Utiliser vos Modèles

### Générer un Document depuis un Bail

1. Accédez à la page de détail d'un bail
2. Cliquez sur **"Générer le contrat"** ou **"Générer le document"**
3. Si vous avez plusieurs templates actifs, vous pouvez en sélectionner un
4. Le document est généré automatiquement avec les données du bail
5. Téléchargez le document généré

### Générer un Reçu de Paiement

1. Accédez à la page de détail d'un paiement
2. Cliquez sur **"Générer le reçu"**
3. Le reçu est généré avec les informations du paiement
4. Téléchargez le reçu

## 🎨 Personnalisation Avancée

### Ajouter votre Logo

1. Insérez votre logo dans le document Word
2. Positionnez-le où vous le souhaitez (en-tête, pied de page, etc.)
3. Le logo sera conservé dans tous les documents générés

### Utiliser des Tableaux

Vous pouvez utiliser des tableaux dans Word pour organiser les informations :

```
┌─────────────────────┬─────────────────────┐
│ Loyer mensuel       │ {{BAIL_LOYER_MENSUEL}} FCFA │
├─────────────────────┼─────────────────────┤
│ Charges             │ {{BAIL_CHARGES}} FCFA       │
├─────────────────────┼─────────────────────┤
│ Dépôt de garantie   │ {{BAIL_DEPOT_GARANTIE}} FCFA│
└─────────────────────┴─────────────────────┘
```

### Formatage Conditionnel

Les variables sont remplacées par du texte simple. Pour le formatage :
- Utilisez le formatage Word (gras, italique, couleurs) directement dans le template
- Les montants sont déjà formatés avec séparateurs de milliers
- Les dates sont au format DD/MM/YYYY

## ❓ Questions Fréquentes

### Puis-je modifier un template après l'avoir téléchargé ?

Non, vous ne pouvez pas modifier un template existant. Vous devez :
1. Modifier votre fichier Word
2. Télécharger une nouvelle version du template
3. Définir le nouveau template comme défaut si nécessaire

### Que se passe-t-il si j'utilise une variable qui n'existe pas ?

Si vous utilisez une variable qui n'est pas disponible (ex: `{{VARIABLE_INEXISTANTE}}`), elle sera remplacée par une chaîne vide dans le document généré.

### Puis-je utiliser mes propres variables personnalisées ?

Non, seules les variables listées dans ce guide sont disponibles. Si vous avez besoin de nouvelles variables, contactez le support technique.

### Combien de templates puis-je avoir ?

Vous pouvez avoir autant de templates que vous le souhaitez par type de document. Cependant, un seul template peut être défini comme "par défaut" à la fois.

### Les anciens documents seront-ils mis à jour si je change de template ?

Non. Les documents déjà générés conservent le template utilisé lors de leur génération. Seuls les nouveaux documents utiliseront le nouveau template.

### Puis-je voir quelles variables sont utilisées dans mon template ?

Oui, après le téléchargement, la liste des variables détectées est affichée dans les détails du template.

## 🆘 Dépannage

### Le template ne se télécharge pas

- Vérifiez que le fichier est bien au format .docx (pas .doc)
- Vérifiez que la taille du fichier ne dépasse pas 10 Mo
- Vérifiez votre connexion internet

### Les variables ne sont pas remplacées correctement

- Vérifiez l'orthographe exacte des variables (sensibles à la casse)
- Vérifiez que vous utilisez bien `{{VARIABLE}}` avec double accolades
- Vérifiez que les données existent dans le bail/paiement concerné

### Le document généré est vide ou incorrect

- Vérifiez que toutes les données nécessaires sont renseignées dans le bail
- Vérifiez que le locataire et le bailleur sont correctement liés au bail
- Contactez le support si le problème persiste

## 📞 Support

Si vous rencontrez des difficultés ou avez des questions :
- Consultez la documentation technique dans la section "Aide"
- Contactez votre administrateur système
- Ouvrez un ticket de support

---

**Dernière mise à jour :** Janvier 2025
