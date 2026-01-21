from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class CategoriePoste(str, Enum):
    CUISINE = "cuisine"
    CLOISON = "cloison"
    PEINTURE = "peinture"
    PARQUET = "parquet"


class StatutDevis(str, Enum):
    BROUILLON = "brouillon"
    VALIDE = "valide"
    ENVOYE = "envoye"
    ACCEPTE = "accepte"
    REFUSE = "refuse"


# ==================== USER MODELS ====================
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    nom: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(BaseModel):
    id: str
    email: str
    nom: str
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User


# ==================== REFERENCE DATA MODELS ====================
class RefCuisineType(BaseModel):
    id: str
    nom: str  # Kit Semi-équipée, Équipée, Sur mesure
    cout_min: float
    cout_max: float
    pose_min: float
    pose_max: float


class RefCuisineElement(BaseModel):
    id: str
    nom: str  # Meuble haut, Meuble bas, etc.
    tarif_min: float
    tarif_max: float
    unite: str  # €/unité, €/m linéaire, etc.


class RefCuisineMateriau(BaseModel):
    id: str
    nom: str  # Stratifié, Bois, Granite, etc.
    cout_min: float
    cout_max: float
    unite: str = "€/m²"


class RefCloison(BaseModel):
    id: str
    nom: str  # Plaque de plâtre, Bois, etc.
    fourniture_min: float
    fourniture_max: float
    pose_incluse_min: float
    pose_incluse_max: float
    pose_seule_min: float
    pose_seule_max: float
    unite: str = "€/m²"


class RefPeinture(BaseModel):
    id: str
    nom: str
    type: str  # support, peinture, plaque
    prix_min: float
    prix_max: float
    unite: str  # €/m², €/L


class RefParquet(BaseModel):
    id: str
    nom: str
    type: str  # stratifie, contrecolle, massif
    classe_ac: Optional[str] = None  # AC1-AC5 pour stratifié
    fourniture_min: float
    fourniture_max: float
    pose_incluse_min: float
    pose_incluse_max: float
    unite: str = "€/m²"


class RefExtra(BaseModel):
    id: str
    categorie: str  # cuisine, cloison, peinture, parquet, general
    nom: str
    description: str
    cout_min: float
    cout_max: float
    unite: str


# ==================== DEVIS MODELS ====================
class PosteDevisOptions(BaseModel):
    # Options spécifiques selon la catégorie
    classe_ac: Optional[str] = None
    sous_couche: Optional[bool] = False
    materiau_plan_travail: Optional[str] = None
    nb_meubles_haut: Optional[int] = 0
    nb_meubles_bas: Optional[int] = 0
    nb_appareils: Optional[int] = 0
    type_finition: Optional[str] = None
    extras: Optional[List[str]] = []


class PosteDevisCreate(BaseModel):
    categorie: CategoriePoste
    reference_id: str
    reference_nom: str
    quantite: float
    unite: str
    prix_min: float
    prix_max: float
    prix_default: float
    prix_ajuste: Optional[float] = None
    options: Optional[PosteDevisOptions] = None


class PosteDevis(BaseModel):
    id: str
    devis_id: str
    categorie: CategoriePoste
    reference_id: str
    reference_nom: str
    quantite: float
    unite: str
    prix_min: float
    prix_max: float
    prix_default: float
    prix_ajuste: float
    sous_total: float
    options: Optional[PosteDevisOptions] = None


class DevisCreate(BaseModel):
    client_nom: str
    tva_taux: float = 20.0
    postes: List[PosteDevisCreate]


class DevisUpdate(BaseModel):
    client_nom: Optional[str] = None
    tva_taux: Optional[float] = None
    statut: Optional[StatutDevis] = None


class Devis(BaseModel):
    id: str
    numero_devis: str
    user_id: str
    client_nom: str
    date_creation: datetime
    tva_taux: float
    total_ht: float
    total_ttc: float
    statut: StatutDevis
    postes: List[PosteDevis]


class DevisListItem(BaseModel):
    id: str
    numero_devis: str
    client_nom: str
    date_creation: datetime
    total_ttc: float
    statut: StatutDevis
