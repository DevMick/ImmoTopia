# Où Renseigner les Informations pour les Modèles de Documents

Ce document indique où renseigner toutes les informations nécessaires pour que les modèles de documents soient correctement remplis.

## 📋 Résumé des Informations Requises

### 1. Informations de l'Agence (Tenant)
- **AGENCE_NOM** : Nom de l'agence
- **AGENCE_ADRESSE** : Adresse complète
- **AGENCE_TELEPHONE** : Téléphone de contact
- **AGENCE_EMAIL** : Email de contact

### 2. Informations du Bien (Property)
- **BIEN_ADRESSE** : Adresse complète du bien
- **BIEN_PIECES** : Nombre de pièces
- **BIEN_CHAMBRES** : Nombre de chambres
- **BIEN_SURFACE** : Surface en m²

### 3. Informations des Clients (TenantClient)
- **LOCATAIRE_TELEPHONE** : Téléphone du locataire
- **BAILLEUR_TELEPHONE** : Téléphone du bailleur

---

## 🏢 1. Informations de l'Agence (Tenant)

### Page Actuelle

**Route** : `/tenant/:tenantId/settings`

**Statut** : ⚠️ **Page à implémenter** (actuellement vide)

La page `TenantSettings.tsx` existe mais n'affiche qu'un placeholder. Il faut créer le formulaire pour éditer :
- Adresse (`address`)
- Téléphone (`contactPhone`)
- Email (`contactEmail`)
- Ville (`city`)
- Pays (`country`)

### Solution Temporaire (Admin)

**Route Admin** : `/admin/tenants/:tenantId/edit`

**Accès** : Seuls les administrateurs platform peuvent y accéder

**Comment y accéder** :
1. Aller sur `/admin/tenants`
2. Cliquer sur un tenant
3. Cliquer sur le bouton "Modifier"

**Note** : Cette page permet de modifier les informations du tenant, mais elle est réservée aux administrateurs.

### API Disponible

**Endpoint** : `PATCH /api/tenants/:tenantId`

**Body** :
```json
{
  "address": "Adresse complète de l'agence",
  "contactPhone": "+225 XX XX XX XX XX",
  "contactEmail": "contact@agence.com",
  "city": "Abidjan",
  "country": "Côte d'Ivoire"
}
```

### ✅ Action Recommandée

**Créer/Compléter la page `/tenant/:tenantId/settings`** pour permettre aux tenants de modifier leurs propres informations.

---

## 🏠 2. Informations du Bien (Property)

### Page d'Édition

**Route** : `/tenant/:tenantId/properties/:id/edit`

**Accès** : Tous les utilisateurs avec accès au tenant

**Comment y accéder** :
1. Aller sur `/tenant/:tenantId/properties`
2. Cliquer sur une propriété
3. Cliquer sur le bouton "Modifier" ou "Éditer"

### Champs à Renseigner

Dans le formulaire de propriété, assurez-vous de remplir :

1. **Adresse** (`address`)
   - Section : "Identification" ou "Localisation"
   - Champ : "Adresse complète"

2. **Nombre de pièces** (`rooms`)
   - Section : "Caractéristiques physiques"
   - Champ : "Nombre de pièces"

3. **Nombre de chambres** (`bedrooms`)
   - Section : "Caractéristiques physiques"
   - Champ : "Nombre de chambres"

4. **Surface** (`surfaceArea`)
   - Section : "Caractéristiques physiques"
   - Champ : "Surface habitable (m²)"

### Composant Utilisé

Le formulaire utilise `PropertyForm.tsx` qui contient tous ces champs.

### ✅ Action

**Vérifier que toutes les propriétés ont ces informations renseignées** lors de leur création ou modification.

---

## 👥 3. Informations des Clients (Téléphones)

### Problème Actuel

⚠️ **Il n'existe pas de page UI dédiée** pour renseigner les téléphones dans `TenantClient.details`.

### Solution Actuelle : API Directe

**Endpoint** : `PATCH /api/tenants/:tenantId/client-details`

**Body** :
```json
{
  "details": {
    "phone": "+225 07 12 34 56 78",
    "telephone": "+225 07 12 34 56 78",
    "mobile": "+225 07 12 34 56 78",
    "address": "Adresse du client",
    "birthDate": "1990-01-01",
    "nationality": "Ivoirienne",
    "idNumber": "CI-123456789",
    "profession": "Ingénieur"
  }
}
```

### Où sont les Clients ?

Les clients peuvent être :
1. **Contacts CRM** : `/tenant/:tenantId/crm/contacts`
2. **Clients du Tenant** : `/clients` (si cette page existe)

### ✅ Action Recommandée

**Créer une page ou un formulaire** pour permettre de renseigner les détails des clients, notamment :
- Téléphone
- Adresse
- Date de naissance
- Nationalité
- Numéro de pièce d'identité
- Profession

**Alternative** : Ajouter ces champs dans le formulaire de contact CRM existant (`ContactForm.tsx`).

---

## 📍 Guide Pratique : Par Où Commencer

### Étape 1 : Renseigner les Informations de l'Agence

**Option A - Via Admin (si vous êtes admin)** :
1. Aller sur `/admin/tenants`
2. Trouver votre tenant
3. Cliquer sur "Modifier"
4. Remplir : Adresse, Téléphone, Email
5. Sauvegarder

**Option B - Via API (temporaire)** :
```bash
PATCH /api/tenants/:tenantId
{
  "address": "Votre adresse",
  "contactPhone": "Votre téléphone",
  "contactEmail": "Votre email"
}
```

### Étape 2 : Vérifier les Propriétés

1. Aller sur `/tenant/:tenantId/properties`
2. Pour chaque propriété utilisée dans un bail :
   - Cliquer sur la propriété
   - Cliquer sur "Modifier"
   - Vérifier/Remplir :
     - ✅ Adresse complète
     - ✅ Nombre de pièces
     - ✅ Nombre de chambres
     - ✅ Surface (m²)

### Étape 3 : Renseigner les Téléphones des Clients

**Option A - Via Contacts CRM** :
1. Aller sur `/tenant/:tenantId/crm/contacts`
2. Trouver le locataire ou le bailleur
3. Cliquer sur "Modifier"
4. Remplir le champ "Téléphone principal"
5. Sauvegarder

**Option B - Via API** :
```bash
PATCH /api/tenants/:tenantId/client-details
{
  "details": {
    "phone": "+225 XX XX XX XX XX"
  }
}
```

**Note** : Il faut que le contact CRM soit lié à un `TenantClient` pour que le téléphone soit récupéré.

---

## 🔧 Améliorations à Implémenter

### Priorité 1 : Page de Paramètres Tenant

**Fichier** : `apps/web/src/pages/tenant/TenantSettings.tsx`

**À créer** :
- Formulaire pour éditer les informations du tenant
- Champs : address, contactPhone, contactEmail, city, country
- Bouton de sauvegarde
- Appel à l'API `PATCH /api/tenants/:tenantId`

### Priorité 2 : Formulaire Client Details

**Nouveau composant** : `apps/web/src/components/clients/ClientDetailsForm.tsx`

**Fonctionnalités** :
- Formulaire pour renseigner `TenantClient.details`
- Champs : phone, address, birthDate, nationality, idNumber, profession
- Appel à l'API `PATCH /api/tenants/:tenantId/client-details`

**Intégration** :
- Ajouter dans la page de détail d'un client
- Ou créer une page dédiée `/tenant/:tenantId/clients/:clientId/details`

### Priorité 3 : Synchronisation CRM Contact ↔ TenantClient

**Problème** : Les contacts CRM ont un téléphone, mais il n'est pas automatiquement synchronisé avec `TenantClient.details`.

**Solution** : 
- Lors de la création/modification d'un contact CRM qui est aussi un TenantClient, synchroniser le téléphone dans `details.phone`
- Ou créer un service de synchronisation

---

## 📝 Checklist de Vérification

Avant de générer un document, vérifiez :

### ✅ Informations de l'Agence
- [ ] Adresse renseignée dans le tenant
- [ ] Téléphone renseigné dans le tenant
- [ ] Email renseigné dans le tenant

### ✅ Informations du Bien
- [ ] Adresse complète renseignée
- [ ] Nombre de pièces renseigné
- [ ] Nombre de chambres renseigné
- [ ] Surface renseignée

### ✅ Informations des Clients
- [ ] Téléphone du locataire dans `TenantClient.details.phone`
- [ ] Téléphone du bailleur dans `TenantClient.details.phone`

---

## 🆘 En Cas de Problème

### Les champs sont toujours vides après avoir renseigné les informations

1. **Vérifier que les données sont bien sauvegardées** :
   - Vérifier dans la base de données directement
   - Ou utiliser l'API GET pour récupérer les données

2. **Vérifier que le bail est bien lié** :
   - Le bail doit être lié à la bonne propriété
   - Le bail doit avoir un `primaryRenter` (locataire)
   - Le bail doit avoir un `ownerClient` (bailleur) si nécessaire

3. **Vérifier les permissions** :
   - Vous devez avoir accès au tenant
   - Vous devez avoir les permissions pour voir les données

### Je ne trouve pas la page pour renseigner les informations

- **Pour l'agence** : Utiliser temporairement l'API ou demander à un admin
- **Pour les propriétés** : Utiliser `/tenant/:tenantId/properties/:id/edit`
- **Pour les clients** : Utiliser temporairement l'API ou le formulaire CRM

---

**Dernière mise à jour** : Janvier 2025
