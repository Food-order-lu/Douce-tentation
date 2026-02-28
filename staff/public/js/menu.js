/**
 * Douce Tentation - Menu Data
 * Structured list of products, flavors, garnitures, and salgados.
 */

const MENU_DATA = {
    gateaux: {
        bases: [
            "Marbre", "Chocolat", "Génoise", "Orange", "Carotte", "Cerise",
            "Noix", "Amandes", "Fraise", "Nature", "Yaourt", "Cannelle",
            "Red Velvet", "Green Velvet", "Génoise au Chocolat", "Citron"
        ],
        garnitures: [
            "Oreo", "Kinder", "Nutella", "Crème Pâtissière", "Crème aux œufs",
            "Rafaello", "Caramel", "Brigadeiro", "Cacahuètes Salées"
        ],
        mousses: [
            "Fraise", "Fruits du bois", "Framboise", "Citron", "Ananas",
            "Fruit de la Passion", "Capuccino", "Tiramisu"
        ],
        finitions: [
            { name: "Chantilly", pricePerPers: 5.00 },
            { name: "Pâte à sucre", pricePerPers: 5.50 }
        ]
    },
    salgados: {
        rissois_8: [
            "Thon", "Mixte (Jambon/Fromage)", "Poulet", "Curry",
            "Saucisse", "Viande", "Alheira", "Nutella"
        ],
        rissois_9: [
            "Crevette", "Francesinha", "Cochon de lait", "Morue"
        ],
        autres: [
            { name: "Bolinhos de bacalhau", pricePerDozen: 8.00 },
            { name: "Coxinhas", pricePerPiece: 1.00 }
        ],
        extra: {
            frit_per_dozen: 1.00
        }
    },
    gateaux_extra: {
        plaque: 3.00
    }
};

window.MENU_DATA = MENU_DATA;
