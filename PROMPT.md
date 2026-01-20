# Prompt de Génération pour l'IA

Tu es un Développeur Fullstack Senior et un Expert UX/UI. Ta mission est de concevoir et développer la plateforme numérique pour la boulangerie "Douce Tentation".

## Instructions de Design (Aesthetics)
*   **Style** : Premium, Appétissant, Artisanal mais Moderne. Utilise des couleurs chaudes (tons de pain, dorés, chocolat) avec des contrastes élégants.
*   **UX** : Fluide, avec des micro-animations lors des interactions. Le site doit donner envie de manger.
*   **Responsive** : Totalement adapté aux mobiles et tablettes.

## Instructions Fonctionnelles

### 1. Le Site Vitrine
*   Une "Hero Section" immersive avec une vidéo ou des photos haute qualité des produits.
*   Une présentation de la boutique à Diekirch.
*   **Deux Boutons d'Appel à l'Action (CTA)** distincts :
    1.  "Commander Déjeuner" (GloriaFood Snacking).
    2.  "Créer mon Gâteau" (GloriaFood Pâtisserie).

### 2. Le Dashboard "Calendrier" (L'outil central)
C'est le cœur de la demande. Il s'agit d'une interface web sécurisée pour le personnel.

*   **Vue Principale** : Un calendrier (Vue Semaine / Vue Mois) affichant les commandes à produire.
*   **Intégration Double GloriaFood** : Distinction visuelle entre les commandes "Snack" et les commandes "Gâteaux" importées.
*   **Créateur de Commande (Custom Cake Builder)** :
    *   Bouton "Nouvelle Commande Spéciale".
    *   Formulaire interactif par étapes (Wizard) :
        1.  **Base** : Choix du gâteau (Forêt Noire, Tarte aux Fraises, Mousses...).
        2.  **Taille** : Nombre de personnes/parts.
        3.  **Personnalisation** : Message en chocolat, bougies, allergènes.
        4.  **Client** : Nom, Téléphone, Heure de retrait.
    *   Une fois validée, la commande s'affiche visuellement sur le calendrier (ex: une carte de couleur différente selon le type de commande).

## Contraintes Techniques
*   Code propre et modulaire.
*   Pour le calendrier, utilise des librairies robustes ou une implémentation CSS Grid/Flexbox solide.
*   Les données peuvent être stockées localement (LocalStorage) ou dans un fichier JSON pour ce prototype.

## Livrables attendus
Génère le code complet pour :
1.  `index.html` (Landing page).
2.  `dashboard.html` (Application Calendrier).
3.  `style.css` (Design system global).
4.  `app.js` (Logique du calendrier et formulaire dynamique).
