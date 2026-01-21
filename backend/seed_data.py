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
    {"id": generate_id(), "nom": "Meuble haut", "tarif_min": 60, "tarif_max": 60, "unite": "€/unité"},
    {"id": generate_id(), "nom": "Meuble bas", "tarif_min": 35, "tarif_max": 70, "unite": "€/unité"},
    {"id": generate_id(), "nom": "Évier + robinet", "tarif_min": 170, "tarif_max": 340, "unite": "€/pose"},
    {"id": generate_id(), "nom": "Plaque de cuisson", "tarif_min": 50, "tarif_max": 150, "unite": "€/pose"},
    {"id": generate_id(), "nom": "Hotte", "tarif_min": 70, "tarif_max": 300, "unite": "€/pose"},
    {"id": generate_id(), "nom": "Gros appareil électroménager", "tarif_min": 100, "tarif_max": 120, "unite": "€/appareil"},
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
        "nom": "Plaque de plâtre",
        "fourniture_min": 25,
        "fourniture_max": 60,
        "pose_incluse_min": 80,
        "pose_incluse_max": 160,
        "pose_seule_min": 40,
        "pose_seule_max": 80,
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
        "pose_seule_min": 70,
        "pose_seule_max": 100,
        "unite": "€/m²"
    },
    {
        "id": generate_id(),
        "nom": "Briques de verre",
        "fourniture_min": 20,
        "fourniture_max": 40,
        "pose_incluse_min": 90,
        "pose_incluse_max": 300,
        "pose_seule_min": 50,
        "pose_seule_max": 100,
        "unite": "€/m²"
    },
    {
        "id": generate_id(),
        "nom": "Cloison amovible",
        "fourniture_min": 45,
        "fourniture_max": 70,
        "pose_incluse_min": 250,
        "pose_incluse_max": 700,
        "pose_seule_min": 50,
        "pose_seule_max": 100,
        "unite": "€/m²"
    },
]

# ==================== PEINTURE ====================
REF_PEINTURES = [
    # Types de plaque
    {"id": generate_id(), "nom": "Plaque Standard", "type": "plaque", "prix_min": 10, "prix_max": 15, "unite": "€/m²"},
    {"id": generate_id(), "nom": "Plaque Acoustique", "type": "plaque", "prix_min": 18, "prix_max": 20, "unite": "€/m²"},
    {"id": generate_id(), "nom": "Plaque Hydrofuge", "type": "plaque", "prix_min": 12, "prix_max": 18, "unite": "€/m²"},
    {"id": generate_id(), "nom": "Plaque Coupe-feu", "type": "plaque", "prix_min": 13, "prix_max": 20, "unite": "€/m²"},
    # Support (pose)
    {"id": generate_id(), "nom": "Peinture mur", "type": "support", "prix_min": 40, "prix_max": 50, "unite": "€/m²"},
    {"id": generate_id(), "nom": "Peinture plafond", "type": "support", "prix_min": 25, "prix_max": 50, "unite": "€/m²"},
    # Types de peinture (fourniture)
    {"id": generate_id(), "nom": "Peinture velours", "type": "peinture", "prix_min": 20, "prix_max": 20, "unite": "€/L"},
    {"id": generate_id(), "nom": "Peinture satin/brillante", "type": "peinture", "prix_min": 13, "prix_max": 13, "unite": "€/L"},
    {"id": generate_id(), "nom": "Peinture plafond", "type": "peinture", "prix_min": 18, "prix_max": 18, "unite": "€/L"},
    {"id": generate_id(), "nom": "Peinture extérieure", "type": "peinture", "prix_min": 35, "prix_max": 35, "unite": "€/L"},
    {"id": generate_id(), "nom": "Peinture sol", "type": "peinture", "prix_min": 15, "prix_max": 35, "unite": "€/L"},
    {"id": generate_id(), "nom": "Peinture radiateur", "type": "peinture", "prix_min": 30, "prix_max": 30, "unite": "€/L"},
]

# ==================== PARQUET ====================
REF_PARQUETS = [
    # Stratifié AC1-AC5
    {"id": generate_id(), "nom": "Stratifié AC1", "type": "stratifie", "classe_ac": "AC1", "fourniture_min": 4, "fourniture_max": 6, "pose_incluse_min": 24, "pose_incluse_max": 46, "unite": "€/m²"},
    {"id": generate_id(), "nom": "Stratifié AC2", "type": "stratifie", "classe_ac": "AC2", "fourniture_min": 7, "fourniture_max": 13, "pose_incluse_min": 27, "pose_incluse_max": 53, "unite": "€/m²"},
    {"id": generate_id(), "nom": "Stratifié AC3", "type": "stratifie", "classe_ac": "AC3", "fourniture_min": 10, "fourniture_max": 20, "pose_incluse_min": 30, "pose_incluse_max": 60, "unite": "€/m²"},
    {"id": generate_id(), "nom": "Stratifié AC4", "type": "stratifie", "classe_ac": "AC4", "fourniture_min": 15, "fourniture_max": 30, "pose_incluse_min": 35, "pose_incluse_max": 70, "unite": "€/m²"},
    {"id": generate_id(), "nom": "Stratifié AC5", "type": "stratifie", "classe_ac": "AC5", "fourniture_min": 20, "fourniture_max": 45, "pose_incluse_min": 40, "pose_incluse_max": 85, "unite": "€/m²"},
    # Autres types
    {"id": generate_id(), "nom": "Contrecollé", "type": "contrecolle", "classe_ac": None, "fourniture_min": 20, "fourniture_max": 120, "pose_incluse_min": 52, "pose_incluse_max": 215, "unite": "€/m²"},
    {"id": generate_id(), "nom": "Massif", "type": "massif", "classe_ac": None, "fourniture_min": 30, "fourniture_max": 150, "pose_incluse_min": 69, "pose_incluse_max": 340, "unite": "€/m²"},
]

# ==================== EXTRAS ====================
REF_EXTRAS = [
    # Cuisine
    {"id": generate_id(), "categorie": "cuisine", "nom": "Dépose ancienne cuisine", "description": "Retrait de l'ancienne cuisine", "cout_min": 200, "cout_max": 500, "unite": "€/prestation"},
    {"id": generate_id(), "categorie": "cuisine", "nom": "Pose crédence", "description": "Installation crédence", "cout_min": 16, "cout_max": 115, "unite": "€/m²"},
    {"id": generate_id(), "categorie": "cuisine", "nom": "Raccordements électricité/plomberie (ajustements)", "description": "Ajustements simples", "cout_min": 80, "cout_max": 140, "unite": "€/m linéaire"},
    {"id": generate_id(), "categorie": "cuisine", "nom": "Raccordements électricité/plomberie (complets)", "description": "Installation complète", "cout_min": 200, "cout_max": 300, "unite": "€/prestation"},
    # Cloison
    {"id": generate_id(), "categorie": "cloison", "nom": "Modification électrique", "description": "Prise, interrupteur", "cout_min": 300, "cout_max": 400, "unite": "€/point"},
    {"id": generate_id(), "categorie": "cloison", "nom": "Bloc-porte intérieur", "description": "Fourniture bloc-porte", "cout_min": 150, "cout_max": 350, "unite": "€/pièce"},
    {"id": generate_id(), "categorie": "cloison", "nom": "Pose chassis porte coulissante", "description": "Installation chassis", "cout_min": 400, "cout_max": 800, "unite": "€/pièce"},
    # Peinture
    {"id": generate_id(), "categorie": "peinture", "nom": "Travaux de préparation", "description": "Dépose, ragréage, réparation", "cout_min": 30, "cout_max": 120, "unite": "€/m²"},
    {"id": generate_id(), "categorie": "peinture", "nom": "Enduits/joints et finitions", "description": "Bandes, ponçage", "cout_min": 15, "cout_max": 35, "unite": "€/m²"},
    {"id": generate_id(), "categorie": "peinture", "nom": "Protection et nettoyage", "description": "Nettoyage du chantier", "cout_min": 6, "cout_max": 30, "unite": "€/m²"},
    {"id": generate_id(), "categorie": "peinture", "nom": "Finition peinture sur cloison", "description": "Finitions décoratives", "cout_min": 15, "cout_max": 35, "unite": "€/m²"},
    {"id": generate_id(), "categorie": "peinture", "nom": "Pose de papier peint", "description": "Pose des rouleaux", "cout_min": 25, "cout_max": 35, "unite": "€/m²"},
    {"id": generate_id(), "categorie": "peinture", "nom": "Pose parement décoratif", "description": "Pierre, brique, PVC", "cout_min": 30, "cout_max": 80, "unite": "€/m²"},
    # Parquet
    {"id": generate_id(), "categorie": "parquet", "nom": "Dépose parquet existant", "description": "Retrait ancien parquet", "cout_min": 10, "cout_max": 35, "unite": "€/m²"},
    {"id": generate_id(), "categorie": "parquet", "nom": "Ragréage", "description": "Préparation sol", "cout_min": 15, "cout_max": 25, "unite": "€/m²"},
    {"id": generate_id(), "categorie": "parquet", "nom": "Sous-couche isolante", "description": "Pour stratifié", "cout_min": 0.5, "cout_max": 9, "unite": "€/m²"},
    {"id": generate_id(), "categorie": "parquet", "nom": "Plinthes en bois massif", "description": "Finition périmètre", "cout_min": 20, "cout_max": 50, "unite": "€/m linéaire"},
    {"id": generate_id(), "categorie": "parquet", "nom": "Ponçage préalable", "description": "Rénovation", "cout_min": 15, "cout_max": 35, "unite": "€/m²"},
    {"id": generate_id(), "categorie": "parquet", "nom": "Teinte avant finition", "description": "Coloration bois", "cout_min": 12, "cout_max": 20, "unite": "€/m²"},
    {"id": generate_id(), "categorie": "parquet", "nom": "Finition vitrifiée", "description": "Protection vernis", "cout_min": 25, "cout_max": 50, "unite": "€/m²"},
    {"id": generate_id(), "categorie": "parquet", "nom": "Finition huilée", "description": "Protection huile", "cout_min": 20, "cout_max": 50, "unite": "€/m²"},
    {"id": generate_id(), "categorie": "parquet", "nom": "Finition cirée", "description": "Protection cire", "cout_min": 30, "cout_max": 60, "unite": "€/m²"},
]
