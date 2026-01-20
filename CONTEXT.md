# Contexte du Projet : Douce Tentation

## Vue d'ensemble
"Douce Tentation" est une boulangerie artisanale située à Diekirch, au Luxembourg. Le projet consiste à développer une présence numérique complète et un outil de gestion interne optimisé pour leur flux de production.

## Objectifs Principaux
1.  **Site Web Vitrine** : Présenter la boulangerie, ses produits et son histoire avec un design moderne et attrayant ("Wow effect").
2.  **Système de Commande en Ligne (Double Flux)** :
    *   **GloriaFood "Boulangerie/Snacking"** : Pour les commandes quotidiennes (pains, viennoiseries, sandwichs).
    *   **GloriaFood "Pâtisserie/Événementiel"** : Pour les commandes de gâteaux personnalisés et traiteur.
3.  **Système de Gestion "Calendrier" (Dashboard)** : Une application web sur mesure pour centraliser toutes les commandes (des **deux** canaux GloriaFood et celles prises sur place) sur une interface unique.

## Flux de Travail (Workflow)
1.  **Client** :
    *   Visite le site web.
    *   Dispose de **deux options de commande distinctes** :
        *   "Commander Déjeuner/Pain" (Vers GloriaFood Standard).
        *   "Commander Gâteaux & Traiteur" (Vers GloriaFood Pâtisserie).
2.  **Boulangerie (Réception)** :
    *   Les commandes des deux canaux remontent.
    *   Les données sont centralisées dans le **Calendrier**.
3.  **Boulangerie (Production)** :
    *   Visualisation distincte (code couleur) selon la source (Snacking vs Gâteau vs Commande Manuelle).
    *   Pour les commandes complexes (ex: gâteaux d'anniversaire, pièces montées) prises par téléphone ou en boutique, le personnel utilise le calendrier pour créer une **Nouvelle Commande Manuelle**.
    *   Cette interface manuelle doit être simple : choix du type de gâteau, nombre de parts, parfums, finitions, etc.

## Stack Technologique Envisagée
*   **Frontend** : HTML/CSS/JS (ou Framework type React/Next.js si nécessaire pour le calendrier).
*   **Commande** : GloriaFood (Externe).
*   **Logique Calendrier** : Interface interactive permettant le CRUD (Create, Read, Update, Delete) de commandes.

## Points Clés
*   L'interface doit être extrêmement simple et visuelle pour le personnel en cuisine/boutique.
*   L'intégration des données GloriaFood est cruciale pour éviter la double saisie.
*   Le module de création de gâteau doit guider le vendeur (Type -> Taille -> Parfum -> Déco).
