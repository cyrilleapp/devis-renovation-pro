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
    FACTURE = "facture"


# ==================== ENTREPRISE (PROFIL) ====================
class Acompte(BaseModel):
    pourcentage: float  # Ex: 30
    delai_jours: int  # Ex: 0 (à la commande), 30 (à 30 jours), etc.
    description: Optional[str] = None  # Ex: "À la commande", "À la livraison"


class ConditionsPaiement(BaseModel):
    type: str = "jours"  # "jours" ou "acomptes"
    delai_jours: int = 30  # Pour type "jours" : paiement à X jours
    acomptes: List[Acompte] = []  # Pour type "acomptes" : liste des acomptes


class EntrepriseInfo(BaseModel):
    nom: str = ""
    adresse: str = ""
    code_postal: str = ""
    ville: str = ""
    telephone: str = ""
    email: str = ""
    siret: str = ""
    tva_intracom: str = ""
    logo_url: Optional[str] = None
    conditions_paiement: ConditionsPaiement = ConditionsPaiement()
    mentions_legales: str = """Les travaux seront réalisés selon les règles de l'art et conformément aux normes en vigueur.
Le présent devis est valable 30 jours à compter de sa date d'émission.
Tout retard de paiement entraînera l'application de pénalités de retard au taux légal en vigueur.
En cas de litige, le tribunal compétent sera celui du siège social de l'entreprise."""
    garantie: str = "Garantie décennale et responsabilité civile professionnelle."


class EntrepriseUpdate(BaseModel):
    nom: Optional[str] = None
    adresse: Optional[str] = None
    code_postal: Optional[str] = None
    ville: Optional[str] = None
    telephone: Optional[str] = None
    email: Optional[str] = None
    siret: Optional[str] = None
    tva_intracom: Optional[str] = None
    logo_url: Optional[str] = None
    conditions_paiement: Optional[ConditionsPaiement] = None
    mentions_legales: Optional[str] = None
    garantie: Optional[str] = None


# ==================== CLIENT ====================
class ClientInfo(BaseModel):
    nom: str
    prenom: Optional[str] = ""
    adresse: Optional[str] = ""
    code_postal: Optional[str] = ""
    ville: Optional[str] = ""
    telephone: Optional[str] = ""
    email: Optional[str] = ""


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
    entreprise: Optional[EntrepriseInfo] = None


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
    categorie: str  # Changed from CategoriePoste to str for flexibility
    reference_id: str
    reference_nom: str
    quantite: float
    unite: str
    prix_min: float
    prix_max: float
    prix_default: float
    prix_ajuste: Optional[float] = None
    options: Optional[PosteDevisOptions] = None
    offert: Optional[bool] = False  # Indique si le poste est offert (gratuit)


class PosteDevis(BaseModel):
    id: str
    devis_id: str
    categorie: str
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
    offert: bool = False  # Indique si le poste est offert (gratuit)


class DevisConditionsPaiement(BaseModel):
    type: str = "jours"  # "jours" ou "acomptes"
    delai_jours: int = 30
    acomptes: List[Acompte] = []


class DevisCreate(BaseModel):
    client: ClientInfo
    tva_taux: float = 20.0
    validite_jours: int = 30
    conditions_paiement: Optional[DevisConditionsPaiement] = None
    notes: Optional[str] = ""
    postes: List[PosteDevisCreate]


class DevisUpdate(BaseModel):
    client: Optional[ClientInfo] = None
    tva_taux: Optional[float] = None
    validite_jours: Optional[int] = None
    conditions_paiement: Optional[DevisConditionsPaiement] = None
    notes: Optional[str] = None
    statut: Optional[StatutDevis] = None
    postes: Optional[List[PosteDevisCreate]] = None


class Devis(BaseModel):
    id: str
    numero_devis: str
    user_id: str
    client: ClientInfo
    date_creation: datetime
    date_validite: datetime
    tva_taux: float
    total_ht: float
    total_tva: float
    total_ttc: float
    statut: StatutDevis
    conditions_paiement: DevisConditionsPaiement
    notes: Optional[str] = ""
    postes: List[PosteDevis]


class DevisListItem(BaseModel):
    id: str
    numero_devis: str
    client_nom: str
    date_creation: datetime
    total_ttc: float
    statut: StatutDevis
