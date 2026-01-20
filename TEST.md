# Plan de Test (TEST.md)

Ce document décrit les scénarios de test pour valider le bon fonctionnement du site et de l'outil de gestion Douce Tentation.

## 1. Test de l'Interface Utilisateur (Site Vitrine)
*   [ ] **Chargement** : Ouvrir `index.html`. Vérifier que les animations se lancent et que le design est "Premium".
*   [ ] **Responsive** : Redimensionner la fenêtre en version mobile. Le menu et les images doivent s'adapter correctement.
*   [ ] **Navigation GloriaFood** : Cliquer sur le bouton "Commander". Vérifier qu'il redirige vers l'interface GloriaFood (ou une modale de simulation).

## 2. Test du Dashboard Calendrier
*   [ ] **Accès** : Ouvrir `dashboard.html`. Le calendrier doit s'afficher avec la date du jour.
*   [ ] **Visualisation** : Vérifier que des commandes "exemples" sont bien présentes sur le calendrier.

## 3. Scénario : Création d'une Commande Spéciale
*   [ ] **Action** : Cliquer sur une case vide du calendrier ou sur le bouton "+ Nouvelle Commande".
*   [ ] **Formulaire** :
    *   Sélectionner un type de gâteau (ex: "Fraisier").
    *   Choisir une taille (ex: "6 personnes").
    *   Ajouter une note (ex: "Joyeux Anniversaire Tom").
    *   Saisir les infos client.
*   [ ] **Validation** : Cliquer sur "Enregistrer".
*   [ ] **Résultat** : La modale se ferme. Une nouvelle "carte" apparaît sur le calendrier au bon créneau avec les détails (Fraisier / 6 pers / Tom).

## 4. Scénario : Intégration GloriaFood (Simulation)
*   [ ] **Injection** : Simuler l'arrivée d'une commande JSON (via console JS ou bouton de debug "Importer GloriaFood").
*   [ ] **Vérification** : La commande doit apparaître automatiquement sur le calendrier sans intervention manuelle.

## 5. Gestion des Commandes
*   [ ] **Détails** : Cliquer sur une commande existante dans le calendrier. Une vue détaillée doit s'ouvrir.
*   [ ] **Modification** : Changer l'heure de retrait ou le statut (ex: "À faire" -> "Prêt").
*   [ ] **Suppression** : Supprimer une commande annulée et vérifier sa disparition du calendrier.
