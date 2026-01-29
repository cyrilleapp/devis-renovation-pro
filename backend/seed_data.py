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

# Plan de travail cuisine (nouveau)
REF_PLANS_TRAVAIL = [
    {"id": generate_id(), "nom": "Stratifié", "pose_seule_min": 50, "pose_seule_max": 90, "fourniture_pose_min": 70, "fourniture_pose_max": 150, "unite": "m²"},
    {"id": generate_id(), "nom": "Bois", "pose_seule_min": 70, "pose_seule_max": 100, "fourniture_pose_min": 120, "fourniture_pose_max": 300, "unite": "m²"},
    {"id": generate_id(), "nom": "Granite", "pose_seule_min": 150, "pose_seule_max": 200, "fourniture_pose_min": 350, "fourniture_pose_max": 600, "unite": "m²"},
    {"id": generate_id(), "nom": "Quartz", "pose_seule_min": 150, "pose_seule_max": 200, "fourniture_pose_min": 400, "fourniture_pose_max": 650, "unite": "m²"},
    {"id": generate_id(), "nom": "Marbre", "pose_seule_min": 200, "pose_seule_max": 200, "fourniture_pose_min": 500, "fourniture_pose_max": 800, "unite": "m²"},
    {"id": generate_id(), "nom": "Céramique", "pose_seule_min": 200, "pose_seule_max": 200, "fourniture_pose_min": 600, "fourniture_pose_max": 1000, "unite": "m²"},
    {"id": generate_id(), "nom": "Résine", "pose_seule_min": 150, "pose_seule_max": 200, "fourniture_pose_min": 400, "fourniture_pose_max": 700, "unite": "m²"},
    {"id": generate_id(), "nom": "Carrelage", "pose_seule_min": 50, "pose_seule_max": 100, "fourniture_pose_min": 80, "fourniture_pose_max": 250, "unite": "m²"},
    {"id": generate_id(), "nom": "Béton", "pose_seule_min": 150, "pose_seule_max": 200, "fourniture_pose_min": 350, "fourniture_pose_max": 600, "unite": "m²"},
]

# ==================== CLOISON ====================
REF_CLOISONS = [
    {
        "id": generate_id(),
        "nom": "Plaque de plâtre",
        "fourniture_min": 10,
        "fourniture_max": 25,
        "pose_incluse_min": 30,
        "pose_incluse_max": 80,
        "pose_seule_min": 40,
        "pose_seule_max": 90,
        "unite": "m²"
    },
    {
        "id": generate_id(),
        "nom": "Cloison en bois",
        "fourniture_min": 25,
        "fourniture_max": 60,
        "pose_incluse_min": 60,
        "pose_incluse_max": 120,
        "pose_seule_min": 40,
        "pose_seule_max": 70,
        "unite": "m²"
    },
    {
        "id": generate_id(),
        "nom": "Béton cellulaire",
        "fourniture_min": 20,
        "fourniture_max": 45,
        "pose_incluse_min": 40,
        "pose_incluse_max": 90,
        "pose_seule_min": 80,
        "pose_seule_max": 160,
        "unite": "m²"
    },
    {
        "id": generate_id(),
        "nom": "Briques de verre",
        "fourniture_min": 40,
        "fourniture_max": 70,
        "pose_incluse_min": 70,
        "pose_incluse_max": 200,
        "pose_seule_min": 120,
        "pose_seule_max": 300,
        "unite": "m²"
    },
    {
        "id": generate_id(),
        "nom": "Cloison amovible",
        "fourniture_min": 50,
        "fourniture_max": 100,
        "pose_incluse_min": 150,
        "pose_incluse_max": 500,
        "pose_seule_min": 250,
        "pose_seule_max": 700,
        "unite": "m²"
    },
]

# Options cloison (visibles uniquement si Pose + Fourniture)
REF_CLOISON_OPTIONS = [
    {"id": generate_id(), "nom": "Supplément hydrofuge", "supplement_min": 5, "supplement_max": 5, "description": "Placo hydrofuge pour pièces humides", "unite": "m²"},
    {"id": generate_id(), "nom": "Supplément phonique", "supplement_min": 5, "supplement_max": 5, "description": "Placo acoustique pour réduction des bruits", "unite": "m²"},
    {"id": generate_id(), "nom": "Supplément coupe-feu", "supplement_min": 10, "supplement_max": 15, "description": "Placo ignifugé retardant la propagation du feu", "unite": "m²"},
    {"id": generate_id(), "nom": "Supplément isolation", "supplement_min": 15, "supplement_max": 20, "description": "Isolation intérieure (matériau + main d'œuvre)", "unite": "m²"},
    {"id": generate_id(), "nom": "Supplément doublage mur", "supplement_min": 3, "supplement_max": 10, "description": "Doublage mural avec isolant", "unite": "m²"},
    {"id": generate_id(), "nom": "Supplément double peau", "supplement_min": 20, "supplement_max": 25, "description": "Double épaisseur de placo", "unite": "m²"},
]

# ==================== PEINTURE ====================
REF_PEINTURES = [
    # Support (pose) - tarifs mis à jour
    {"id": generate_id(), "nom": "Peinture mur", "type": "support", "prix_min": 20, "prix_max": 30, "unite": "m²"},
    {"id": generate_id(), "nom": "Peinture plafond", "type": "support", "prix_min": 25, "prix_max": 50, "unite": "m²"},
]

# ==================== PARQUET ====================
REF_PARQUETS = [
    # Stratifié AC1-AC5
    {
        "id": generate_id(),
        "nom": "Stratifié AC1",
        "type": "stratifie",
        "classe_ac": "AC1",
        "fourniture_min": 4,
        "fourniture_max": 6,
        "unite": "m²"
    },
    {
        "id": generate_id(),
        "nom": "Stratifié AC2",
        "type": "stratifie",
        "classe_ac": "AC2",
        "fourniture_min": 7,
        "fourniture_max": 13,
        "unite": "m²"
    },
    {
        "id": generate_id(),
        "nom": "Stratifié AC3",
        "type": "stratifie",
        "classe_ac": "AC3",
        "fourniture_min": 10,
        "fourniture_max": 20,
        "unite": "m²"
    },
    {
        "id": generate_id(),
        "nom": "Stratifié AC4",
        "type": "stratifie",
        "classe_ac": "AC4",
        "fourniture_min": 15,
        "fourniture_max": 30,
        "unite": "m²"
    },
    {
        "id": generate_id(),
        "nom": "Stratifié AC5",
        "type": "stratifie",
        "classe_ac": "AC5",
        "fourniture_min": 20,
        "fourniture_max": 45,
        "unite": "m²"
    },
    # Autres types
    {
        "id": generate_id(),
        "nom": "Contrecollé",
        "type": "contrecolle",
        "classe_ac": None,
        "fourniture_min": 20,
        "fourniture_max": 120,
        "unite": "m²"
    },
    {
        "id": generate_id(),
        "nom": "Massif",
        "type": "massif",
        "classe_ac": None,
        "fourniture_min": 30,
        "fourniture_max": 150,
        "unite": "m²"
    },
]

# Types de pose parquet (nouveau)
REF_PARQUET_POSES = [
    {"id": generate_id(), "nom": "Pose flottante", "prix_min": 20, "prix_max": 40, "unite": "m²"},
    {"id": generate_id(), "nom": "Pose collée", "prix_min": 30, "prix_max": 50, "unite": "m²"},
    {"id": generate_id(), "nom": "Pose clouée", "prix_min": 40, "prix_max": 60, "unite": "m²"},
]

# ==================== TAUX HORAIRES PROFESSIONNELS ====================
REF_PROFESSIONNELS = [
    # Parquet
    {"id": generate_id(), "categorie": "parquet", "nom": "Parqueteur / Menuisier", "tarif_min": 20, "tarif_max": 30, "unite": "€/h"},
    # Peinture
    {"id": generate_id(), "categorie": "peinture", "nom": "Peintre", "tarif_min": 20, "tarif_max": 70, "unite": "€/h"},
    # Cloison
    {"id": generate_id(), "categorie": "cloison", "nom": "Plaquiste", "tarif_min": 30, "tarif_max": 60, "unite": "€/h"},
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
        "unite": "prestation"
    },
    {
        "id": generate_id(),
        "categorie": "cuisine",
        "nom": "Pose crédence",
        "description": "Installation crédence (hors fourniture)",
        "cout_min": 16,
        "cout_max": 115,
        "unite": "m²"
    },
    {
        "id": generate_id(),
        "categorie": "cuisine",
        "nom": "Raccordements électricité/plomberie (ajustements)",
        "description": "Déplacement arrivées d'eau/prises",
        "cout_min": 80,
        "cout_max": 140,
        "unite": "m linéaire"
    },
    {
        "id": generate_id(),
        "categorie": "cuisine",
        "nom": "Raccordements électricité/plomberie (complets)",
        "description": "Installation complète électricité + plomberie",
        "cout_min": 200,
        "cout_max": 300,
        "unite": "prestation"
    },
    {
        "id": generate_id(),
        "categorie": "cuisine",
        "nom": "Meuble haut supplémentaire",
        "description": "Pose unitaire meuble haut",
        "cout_min": 60,
        "cout_max": 60,
        "unite": "unité"
    },
    {
        "id": generate_id(),
        "categorie": "cuisine",
        "nom": "Évier + robinet (installation)",
        "description": "Mise en service évier et robinetterie",
        "cout_min": 170,
        "cout_max": 340,
        "unite": "pose"
    },
    {
        "id": generate_id(),
        "categorie": "cuisine",
        "nom": "Plaque de cuisson (installation)",
        "description": "Installation plaque de cuisson",
        "cout_min": 50,
        "cout_max": 50,
        "unite": "pose"
    },
    {
        "id": generate_id(),
        "categorie": "cuisine",
        "nom": "Hotte (installation)",
        "description": "Installation hotte aspirante",
        "cout_min": 70,
        "cout_max": 300,
        "unite": "pose"
    },
    {
        "id": generate_id(),
        "categorie": "cuisine",
        "nom": "Électroménager (installation)",
        "description": "Mise en service appareil électroménager (hors hotte et plaque)",
        "cout_min": 40,
        "cout_max": 40,
        "unite": "appareil"
    },
    
    # === CLOISON ===
    {
        "id": generate_id(),
        "categorie": "cloison",
        "nom": "Modification électrique",
        "description": "Ajout prise ou interrupteur",
        "cout_min": 60,
        "cout_max": 120,
        "unite": "point"
    },
    {
        "id": generate_id(),
        "categorie": "cloison",
        "nom": "Bloc-porte intérieur",
        "description": "Fourniture + pose bloc-porte",
        "cout_min": 80,
        "cout_max": 300,
        "unite": "unité"
    },
    {
        "id": generate_id(),
        "categorie": "cloison",
        "nom": "Pose chassis porte coulissante",
        "description": "Installation chassis à galandage",
        "cout_min": 15,
        "cout_max": 35,
        "unite": "pièce"
    },
    {
        "id": generate_id(),
        "categorie": "cloison",
        "nom": "Enduits/joints et finitions",
        "description": "Bandes, ponçage pour cloison",
        "cout_min": 10,
        "cout_max": 30,
        "unite": "m²"
    },
    
    # === PEINTURE ===
    {
        "id": generate_id(),
        "categorie": "peinture",
        "nom": "Supplément préparation murs à rénover",
        "description": "Travaux lourds de préparation pour murs abîmés",
        "cout_min": 10,
        "cout_max": 30,
        "unite": "m²"
    },
    {
        "id": generate_id(),
        "categorie": "peinture",
        "nom": "Pose de papier peint",
        "description": "Pose des rouleaux (main d'œuvre)",
        "cout_min": 6,
        "cout_max": 6,
        "unite": "m²"
    },
    {
        "id": generate_id(),
        "categorie": "peinture",
        "nom": "Pose parement décoratif",
        "description": "Pierre, brique, PVC",
        "cout_min": 5,
        "cout_max": 15,
        "unite": "m²"
    },
    
    # === PARQUET ===
    {
        "id": generate_id(),
        "categorie": "parquet",
        "nom": "Dépose parquet existant",
        "description": "Retrait ancien parquet",
        "cout_min": 10,
        "cout_max": 35,
        "unite": "m²"
    },
    {
        "id": generate_id(),
        "categorie": "parquet",
        "nom": "Ragréage",
        "description": "Préparation et nivellement du sol",
        "cout_min": 15,
        "cout_max": 25,
        "unite": "m²"
    },
    {
        "id": generate_id(),
        "categorie": "parquet",
        "nom": "Plinthes / Quarts-de-rond",
        "description": "Finition périmètre (calcul auto)",
        "cout_min": 3,
        "cout_max": 4,
        "unite": "m linéaire"
    },
    {
        "id": generate_id(),
        "categorie": "parquet",
        "nom": "Ponçage préalable",
        "description": "Rénovation parquet existant",
        "cout_min": 15,
        "cout_max": 35,
        "unite": "m²"
    },
    {
        "id": generate_id(),
        "categorie": "parquet",
        "nom": "Teinte avant finition",
        "description": "Coloration du bois",
        "cout_min": 12,
        "cout_max": 20,
        "unite": "m²"
    },
    {
        "id": generate_id(),
        "categorie": "parquet",
        "nom": "Vieillissement de parquet",
        "description": "Effet vieilli/patiné",
        "cout_min": 60,
        "cout_max": 80,
        "unite": "m²"
    },
    {
        "id": generate_id(),
        "categorie": "parquet",
        "nom": "Finition vitrifiée",
        "description": "Protection par vitrification",
        "cout_min": 25,
        "cout_max": 50,
        "unite": "m²"
    },
    {
        "id": generate_id(),
        "categorie": "parquet",
        "nom": "Finition huilée",
        "description": "Protection par huile",
        "cout_min": 20,
        "cout_max": 50,
        "unite": "m²"
    },
    {
        "id": generate_id(),
        "categorie": "parquet",
        "nom": "Finition cirée",
        "description": "Protection par cire",
        "cout_min": 30,
        "cout_max": 60,
        "unite": "m²"
    },
]
