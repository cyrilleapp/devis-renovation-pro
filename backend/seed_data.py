# Données de référence à insérer dans MongoDB
import uuid

def generate_id():
    return str(uuid.uuid4())

# ==================== CUISINE ====================
REF_CUISINE_TYPES = [
    {
        "id": generate_id(),
        "nom": "Kit Semi-équipée",
        "cout_min": 5000,
        "cout_max": 14000,
        "pose_min": 250,
        "pose_max": 2000
    },
    {
        "id": generate_id(),
        "nom": "Équipée",
        "cout_min": 12000,
        "cout_max": 15000,
        "pose_min": 2500,
        "pose_max": 5000
    },
    {
        "id": generate_id(),
        "nom": "Sur mesure",
        "cout_min": 6000,
        "cout_max": 25000,
        "pose_min": 3000,
        "pose_max": 8000
    }
]

REF_CUISINE_ELEMENTS = [
    {"id": generate_id(), "nom": "Meuble haut (pose)", "tarif_min": 60, "tarif_max": 60, "unite": "€/unité"},
    {"id": generate_id(), "nom": "Meuble bas (pose)", "tarif_min": 35, "tarif_max": 85, "unite": "€/m linéaire"},
    {"id": generate_id(), "nom": "Évier + robinet (installation)", "tarif_min": 170, "tarif_max": 340, "unite": "€/pose"},
    {"id": generate_id(), "nom": "Plaque de cuisson (installation)", "tarif_min": 50, "tarif_max": 50, "unite": "€/pose"},
    {"id": generate_id(), "nom": "Hotte (installation)", "tarif_min": 70, "tarif_max": 300, "unite": "€/pose"},
    {"id": generate_id(), "nom": "Appareil électroménager (installation)", "tarif_min": 40, "tarif_max": 40, "unite": "€/appareil"},
    {"id": generate_id(), "nom": "Plan de travail (installation)", "tarif_min": 60, "tarif_max": 60, "unite": "€/m linéaire"},
]

REF_CUISINE_MATERIAUX = [
    {"id": generate_id(), "nom": "Stratifié", "cout_min": 150, "cout_max": 600, "unite": "€/m²"},
    {"id": generate_id(), "nom": "Bois", "cout_min": 300, "cout_max": 650, "unite": "€/m²"},
    {"id": generate_id(), "nom": "Granite", "cout_min": 600, "cout_max": 800, "unite": "€/m²"},
    {"id": generate_id(), "nom": "Quartz", "cout_min": 250, "cout_max": 450, "unite": "€/m²"},
    {"id": generate_id(), "nom": "Marbre", "cout_min": 300, "cout_max": 600, "unite": "€/m²"},
    {"id": generate_id(), "nom": "Céramique", "cout_min": 250, "cout_max": 600, "unite": "€/m²"},
    {"id": generate_id(), "nom": "Résine", "cout_min": 250, "cout_max": 500, "unite": "€/m²"},
    {"id": generate_id(), "nom": "Carrelage", "cout_min": 30, "cout_max": 150, "unite": "€/m²"},
    {"id": generate_id(), "nom": "Béton", "cout_min": 200, "cout_max": 400, "unite": "€/m²"},
]

# ==================== CLOISON ====================
REF_CLOISONS = [
    {
        "id": generate_id(),
        "nom": "Plaque de plâtre standard",
        "fourniture_min": 10,
        "fourniture_max": 15,
        "pose_incluse_min": 40,
        "pose_incluse_max": 80,
        "pose_seule_min": 30,
        "pose_seule_max": 65,
        "unite": "€/m²"
    },
    {
        "id": generate_id(),
        "nom": "Plaque hydrofuge",
        "fourniture_min": 12,
        "fourniture_max": 18,
        "pose_incluse_min": 42,
        "pose_incluse_max": 83,
        "pose_seule_min": 30,
        "pose_seule_max": 65,
        "unite": "€/m²"
    },
    {
        "id": generate_id(),
        "nom": "Plaque coupe-feu",
        "fourniture_min": 13,
        "fourniture_max": 20,
        "pose_incluse_min": 43,
        "pose_incluse_max": 85,
        "pose_seule_min": 30,
        "pose_seule_max": 65,
        "unite": "€/m²"
    },
    {
        "id": generate_id(),
        "nom": "Cloison en bois",
        "fourniture_min": 25,
        "fourniture_max": 120,
        "pose_incluse_min": 40,
        "pose_incluse_max": 200,
        "pose_seule_min": 20,
        "pose_seule_max": 120,
        "unite": "€/m²"
    },
    {
        "id": generate_id(),
        "nom": "Béton cellulaire",
        "fourniture_min": 60,
        "fourniture_max": 120,
        "pose_incluse_min": 80,
        "pose_incluse_max": 160,
        "pose_seule_min": 20,
        "pose_seule_max": 40,
        "unite": "€/m²"
    },
]

# ==================== PEINTURE ====================
REF_PEINTURES = [
    # Support (pose)
    {"id": generate_id(), "nom": "Peinture mur", "type": "support", "prix_min": 40, "prix_max": 50, "unite": "€/m²"},
    {"id": generate_id(), "nom": "Peinture plafond", "type": "support", "prix_min": 25, "prix_max": 50, "unite": "€/m²"},
    # Types de peinture (fourniture)
    {"id": generate_id(), "nom": "Peinture velours", "type": "peinture", "prix_min": 20, "prix_max": 20, "unite": "€/L"},
    {"id": generate_id(), "nom": "Peinture satin/brillante", "type": "peinture", "prix_min": 13, "prix_max": 13, "unite": "€/L"},
    {"id": generate_id(), "nom": "Peinture plafond (fourniture)", "type": "peinture", "prix_min": 18, "prix_max": 18, "unite": "€/L"},
    {"id": generate_id(), "nom": "Peinture extérieure", "type": "peinture", "prix_min": 35, "prix_max": 35, "unite": "€/L"},
    {"id": generate_id(), "nom": "Peinture sol", "type": "peinture", "prix_min": 15, "prix_max": 35, "unite": "€/L"},
    {"id": generate_id(), "nom": "Peinture radiateur", "type": "peinture", "prix_min": 30, "prix_max": 30, "unite": "€/L"},
]

# ==================== PARQUET ====================
REF_PARQUETS = [
    # Stratifié AC1-AC5 avec fourniture ET pose séparées
    {
        "id": generate_id(),
        "nom": "Stratifié AC1",
        "type": "stratifie",
        "classe_ac": "AC1",
        "fourniture_min": 4,
        "fourniture_max": 6,
        "pose_incluse_min": 24,
        "pose_incluse_max": 46,
        "unite": "€/m²"
    },
    {
        "id": generate_id(),
        "nom": "Stratifié AC2",
        "type": "stratifie",
        "classe_ac": "AC2",
        "fourniture_min": 7,
        "fourniture_max": 13,
        "pose_incluse_min": 27,
        "pose_incluse_max": 53,
        "unite": "€/m²"
    },
    {
        "id": generate_id(),
        "nom": "Stratifié AC3",
        "type": "stratifie",
        "classe_ac": "AC3",
        "fourniture_min": 10,
        "fourniture_max": 20,
        "pose_incluse_min": 30,
        "pose_incluse_max": 60,
        "unite": "€/m²"
    },
    {
        "id": generate_id(),
        "nom": "Stratifié AC4",
        "type": "stratifie",
        "classe_ac": "AC4",
        "fourniture_min": 15,
        "fourniture_max": 30,
        "pose_incluse_min": 35,
        "pose_incluse_max": 70,
        "unite": "€/m²"
    },
    {
        "id": generate_id(),
        "nom": "Stratifié AC5",
        "type": "stratifie",
        "classe_ac": "AC5",
        "fourniture_min": 20,
        "fourniture_max": 45,
        "pose_incluse_min": 40,
        "pose_incluse_max": 85,
        "unite": "€/m²"
    },
    # Autres types
    {
        "id": generate_id(),
        "nom": "Contrecollé",
        "type": "contrecolle",
        "classe_ac": None,
        "fourniture_min": 20,
        "fourniture_max": 120,
        "pose_incluse_min": 52,
        "pose_incluse_max": 215,
        "unite": "€/m²"
    },
    {
        "id": generate_id(),
        "nom": "Massif",
        "type": "massif",
        "classe_ac": None,
        "fourniture_min": 30,
        "fourniture_max": 150,
        "pose_incluse_min": 69,
        "pose_incluse_max": 340,
        "unite": "€/m²"
    },
]

# ==================== TAUX HORAIRES PROFESSIONNELS ====================
REF_PROFESSIONNELS = [
    # Parquet
    {"id": generate_id(), "categorie": "parquet", "nom": "Parqueteur / Menuisier", "tarif_min": 20, "tarif_max": 30, "unite": "€/h"},
    # Peinture
    {"id": generate_id(), "categorie": "peinture", "nom": "Peintre", "tarif_min": 20, "tarif_max": 70, "unite": "€/h"},
    # Cuisine
    {"id": generate_id(), "categorie": "cuisine", "nom": "Artisan indépendant (horaire)", "tarif_min": 30, "tarif_max": 50, "unite": "€/h"},
    {"id": generate_id(), "categorie": "cuisine", "nom": "Artisan indépendant (pose complète)", "tarif_min": 1000, "tarif_max": 4000, "unite": "€/prestation"},
    {"id": generate_id(), "categorie": "cuisine", "nom": "Enseigne d'ameublement", "tarif_min": 400, "tarif_max": 650, "unite": "€/prestation"},
    {"id": generate_id(), "categorie": "cuisine", "nom": "Cuisiniste", "tarif_min": 500, "tarif_max": 750, "unite": "€/prestation"},
    {"id": generate_id(), "categorie": "cuisine", "nom": "Entreprise spécialisée", "tarif_min": 3000, "tarif_max": 8000, "unite": "€/prestation"},
]

# ==================== EXTRAS ====================
REF_EXTRAS = [
    # === CUISINE ===
    {
        "id": generate_id(),
        "categorie": "cuisine",
        "nom": "Dépose ancienne cuisine",
        "description": "Retrait de l'ancienne cuisine",
        "cout_min": 200,
        "cout_max": 500,
        "unite": "€/prestation"
    },
    {
        "id": generate_id(),
        "categorie": "cuisine",
        "nom": "Pose crédence",
        "description": "Installation crédence (hors fourniture)",
        "cout_min": 16,
        "cout_max": 115,
        "unite": "€/m²"
    },
    {
        "id": generate_id(),
        "categorie": "cuisine",
        "nom": "Raccordements électricité/plomberie (ajustements)",
        "description": "Déplacement arrivées d'eau/prises",
        "cout_min": 80,
        "cout_max": 140,
        "unite": "€/m linéaire"
    },
    {
        "id": generate_id(),
        "categorie": "cuisine",
        "nom": "Raccordements électricité/plomberie (complets)",
        "description": "Installation complète électricité + plomberie",
        "cout_min": 200,
        "cout_max": 300,
        "unite": "€/prestation"
    },
    {
        "id": generate_id(),
        "categorie": "cuisine",
        "nom": "Meuble haut supplémentaire",
        "description": "Pose unitaire meuble haut",
        "cout_min": 60,
        "cout_max": 60,
        "unite": "€/unité"
    },
    {
        "id": generate_id(),
        "categorie": "cuisine",
        "nom": "Évier + robinet (installation)",
        "description": "Mise en service évier et robinetterie",
        "cout_min": 170,
        "cout_max": 340,
        "unite": "€/pose"
    },
    {
        "id": generate_id(),
        "categorie": "cuisine",
        "nom": "Plaque de cuisson (installation)",
        "description": "Installation plaque de cuisson",
        "cout_min": 50,
        "cout_max": 50,
        "unite": "€/pose"
    },
    {
        "id": generate_id(),
        "categorie": "cuisine",
        "nom": "Hotte (installation)",
        "description": "Installation hotte aspirante",
        "cout_min": 70,
        "cout_max": 300,
        "unite": "€/pose"
    },
    {
        "id": generate_id(),
        "categorie": "cuisine",
        "nom": "Électroménager (installation)",
        "description": "Mise en service appareil électroménager",
        "cout_min": 40,
        "cout_max": 40,
        "unite": "€/appareil"
    },
    
    # === CLOISON ===
    {
        "id": generate_id(),
        "categorie": "cloison",
        "nom": "Modification électrique",
        "description": "Ajout prise ou interrupteur",
        "cout_min": 300,
        "cout_max": 400,
        "unite": "€/point"
    },
    {
        "id": generate_id(),
        "categorie": "cloison",
        "nom": "Bloc-porte intérieur",
        "description": "Fourniture + pose bloc-porte",
        "cout_min": 150,
        "cout_max": 350,
        "unite": "€/pièce"
    },
    {
        "id": generate_id(),
        "categorie": "cloison",
        "nom": "Pose chassis porte coulissante",
        "description": "Installation chassis à galandage",
        "cout_min": 400,
        "cout_max": 800,
        "unite": "€/pièce"
    },
    
    # === PEINTURE ===
    {
        "id": generate_id(),
        "categorie": "peinture",
        "nom": "Travaux de préparation",
        "description": "Dépose, ragréage, réparation",
        "cout_min": 30,
        "cout_max": 120,
        "unite": "€/m²"
    },
    {
        "id": generate_id(),
        "categorie": "peinture",
        "nom": "Enduits/joints et finitions",
        "description": "Bandes, ponçage",
        "cout_min": 15,
        "cout_max": 35,
        "unite": "€/m²"
    },
    {
        "id": generate_id(),
        "categorie": "peinture",
        "nom": "Protection et nettoyage",
        "description": "Nettoyage du chantier",
        "cout_min": 10,
        "cout_max": 30,
        "unite": "€/m²"
    },
    {
        "id": generate_id(),
        "categorie": "peinture",
        "nom": "Finition peinture sur cloison",
        "description": "Finitions décoratives",
        "cout_min": 15,
        "cout_max": 35,
        "unite": "€/m²"
    },
    {
        "id": generate_id(),
        "categorie": "peinture",
        "nom": "Pose de papier peint",
        "description": "Pose des rouleaux (main d'œuvre)",
        "cout_min": 25,
        "cout_max": 35,
        "unite": "€/m²"
    },
    {
        "id": generate_id(),
        "categorie": "peinture",
        "nom": "Pose parement décoratif",
        "description": "Pierre, brique, PVC",
        "cout_min": 30,
        "cout_max": 80,
        "unite": "€/m²"
    },
    
    # === PARQUET ===
    {
        "id": generate_id(),
        "categorie": "parquet",
        "nom": "Dépose parquet existant",
        "description": "Retrait ancien parquet",
        "cout_min": 10,
        "cout_max": 35,
        "unite": "€/m²"
    },
    {
        "id": generate_id(),
        "categorie": "parquet",
        "nom": "Ragréage",
        "description": "Préparation et nivellement du sol",
        "cout_min": 15,
        "cout_max": 25,
        "unite": "€/m²"
    },
    {
        "id": generate_id(),
        "categorie": "parquet",
        "nom": "Sous-couche isolante",
        "description": "Pour stratifié uniquement",
        "cout_min": 0.5,
        "cout_max": 9,
        "unite": "€/m²"
    },
    {
        "id": generate_id(),
        "categorie": "parquet",
        "nom": "Plinthes / Quarts-de-rond",
        "description": "Finition périmètre",
        "cout_min": 3,
        "cout_max": 4,
        "unite": "€/m linéaire"
    },
    {
        "id": generate_id(),
        "categorie": "parquet",
        "nom": "Ponçage préalable",
        "description": "Rénovation parquet existant",
        "cout_min": 15,
        "cout_max": 35,
        "unite": "€/m²"
    },
    {
        "id": generate_id(),
        "categorie": "parquet",
        "nom": "Teinte avant finition",
        "description": "Coloration du bois",
        "cout_min": 12,
        "cout_max": 20,
        "unite": "€/m²"
    },
    {
        "id": generate_id(),
        "categorie": "parquet",
        "nom": "Vieillissement de parquet",
        "description": "Effet vieilli/patiné",
        "cout_min": 60,
        "cout_max": 80,
        "unite": "€/m²"
    },
    {
        "id": generate_id(),
        "categorie": "parquet",
        "nom": "Finition vitrifiée",
        "description": "Protection par vitrification",
        "cout_min": 25,
        "cout_max": 50,
        "unite": "€/m²"
    },
    {
        "id": generate_id(),
        "categorie": "parquet",
        "nom": "Finition huilée",
        "description": "Protection par huile",
        "cout_min": 20,
        "cout_max": 50,
        "unite": "€/m²"
    },
    {
        "id": generate_id(),
        "categorie": "parquet",
        "nom": "Finition cirée",
        "description": "Protection par cire",
        "cout_min": 30,
        "cout_max": 60,
        "unite": "€/m²"
    },
    {
        "id": generate_id(),
        "categorie": "parquet",
        "nom": "Pose flottante (main d'œuvre)",
        "description": "Installation pose flottante",
        "cout_min": 20,
        "cout_max": 40,
        "unite": "€/m²"
    },
    {
        "id": generate_id(),
        "categorie": "parquet",
        "nom": "Pose collée (main d'œuvre)",
        "description": "Installation pose collée",
        "cout_min": 30,
        "cout_max": 50,
        "unite": "€/m²"
    },
    {
        "id": generate_id(),
        "categorie": "parquet",
        "nom": "Pose clouée (main d'œuvre)",
        "description": "Installation pose clouée",
        "cout_min": 40,
        "cout_max": 60,
        "unite": "€/m²"
    },
]
