"""
Chargement des tarifs depuis le fichier de configuration JSON.
Pour modifier les tarifs : éditez /app/backend/config/tarifs.json et redéployez.
"""
import json
import os
import uuid

CONFIG_FILE = os.path.join(os.path.dirname(__file__), 'config', 'tarifs.json')

def load_tarifs():
    """Charge les tarifs depuis le fichier JSON"""
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_id():
    return str(uuid.uuid4())

def get_reference_data():
    """Génère les données de référence à partir du fichier de configuration"""
    tarifs = load_tarifs()
    
    # Types de cuisine
    cuisine_types = []
    for item in tarifs.get('cuisine_types', []):
        cuisine_types.append({
            "id": generate_id(),
            "nom": item['nom'],
            "cout_min": item['cout_min'],
            "cout_max": item['cout_max'],
            "pose_min": item['pose_min'],
            "pose_max": item['pose_max']
        })
    
    # Plans de travail
    plans_travail = []
    for item in tarifs.get('plans_travail', []):
        plans_travail.append({
            "id": generate_id(),
            "nom": item['nom'],
            "pose_seule_min": item['pose_seule_min'],
            "pose_seule_max": item['pose_seule_max'],
            "fourniture_pose_min": item['fourniture_pose_min'],
            "fourniture_pose_max": item['fourniture_pose_max'],
            "unite": item.get('unite', 'm²')
        })
    
    # Cloisons
    cloisons = []
    for item in tarifs.get('cloisons', []):
        cloisons.append({
            "id": generate_id(),
            "nom": item['nom'],
            "fourniture_min": item['fourniture_min'],
            "fourniture_max": item['fourniture_max'],
            "pose_incluse_min": item['pose_incluse_min'],
            "pose_incluse_max": item['pose_incluse_max'],
            "pose_seule_min": item['pose_seule_min'],
            "pose_seule_max": item['pose_seule_max'],
            "unite": item.get('unite', 'm²')
        })
    
    # Options cloison
    cloison_options = []
    for item in tarifs.get('cloison_options', []):
        cloison_options.append({
            "id": generate_id(),
            "nom": item['nom'],
            "supplement_min": item['supplement_min'],
            "supplement_max": item['supplement_max'],
            "description": item.get('description', ''),
            "unite": item.get('unite', 'm²')
        })
    
    # Peintures
    peintures = []
    for item in tarifs.get('peintures', []):
        peintures.append({
            "id": generate_id(),
            "nom": item['nom'],
            "type": item.get('type', 'support'),
            "prix_min": item['prix_min'],
            "prix_max": item['prix_max'],
            "unite": item.get('unite', 'm²')
        })
    
    # Parquets
    parquets = []
    for item in tarifs.get('parquets', []):
        parquets.append({
            "id": generate_id(),
            "nom": item['nom'],
            "type": item.get('type', ''),
            "classe_ac": item.get('classe_ac'),
            "fourniture_min": item['fourniture_min'],
            "fourniture_max": item['fourniture_max'],
            "unite": item.get('unite', 'm²')
        })
    
    # Poses parquet
    parquet_poses = []
    for item in tarifs.get('parquet_poses', []):
        parquet_poses.append({
            "id": generate_id(),
            "nom": item['nom'],
            "prix_min": item['prix_min'],
            "prix_max": item['prix_max'],
            "unite": item.get('unite', 'm²')
        })
    
    # Extras
    extras = []
    extras_config = tarifs.get('extras', {})
    for categorie, items in extras_config.items():
        for item in items:
            extras.append({
                "id": generate_id(),
                "categorie": categorie,
                "nom": item['nom'],
                "description": item.get('description', ''),
                "cout_min": item['cout_min'],
                "cout_max": item['cout_max'],
                "unite": item.get('unite', 'unité')
            })
    
    return {
        'cuisine_types': cuisine_types,
        'plans_travail': plans_travail,
        'cloisons': cloisons,
        'cloison_options': cloison_options,
        'peintures': peintures,
        'parquets': parquets,
        'parquet_poses': parquet_poses,
        'extras': extras
    }


# Fonction pour obtenir les tarifs des services
def get_services_tarifs():
    """Retourne les tarifs des services depuis la config"""
    tarifs = load_tarifs()
    return tarifs.get('services', {
        'livraison': {'tarif_km': 0.55},
        'deplacement': {'tarif_km': 0.55},
        'debarras': {
            'depot': {'tarif_m3': 30},
            'gravats': {'tarif_m3': 75},
            'encombrants': {'tarif_m3': 60}
        }
    })
