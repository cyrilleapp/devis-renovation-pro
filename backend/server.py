from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime
import uuid

from models import (
    UserCreate, UserLogin, User, TokenResponse,
    RefCuisineType, RefCuisineElement, RefCuisineMateriau,
    RefCloison, RefPeinture, RefParquet, RefExtra,
    DevisCreate, Devis, DevisListItem, DevisUpdate, PosteDevis,
    CategoriePoste, StatutDevis, EntrepriseInfo, EntrepriseUpdate,
    ClientInfo, DevisConditionsPaiement, Acompte,
    FactureCreate, Facture, FactureListItem, StatutFacture
)
from auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_user_id
)
from seed_data import (
    REF_CUISINE_TYPES, REF_PLANS_TRAVAIL,
    REF_CLOISONS, REF_CLOISON_OPTIONS, REF_PEINTURES, 
    REF_PARQUETS, REF_PARQUET_POSES, REF_EXTRAS, REF_PROFESSIONNELS
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="API Devis Rénovation")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ==================== SEED DATABASE ====================
async def seed_database():
    """Populate reference data if not exists"""
    try:
        # Check if already seeded
        count = await db.ref_cuisine_types.count_documents({})
        if count > 0:
            logger.info("Database already seeded")
            return
        
        logger.info("Seeding database with reference data...")
        
        # Insert all reference data
        await db.ref_cuisine_types.insert_many(REF_CUISINE_TYPES)
        await db.ref_plans_travail.insert_many(REF_PLANS_TRAVAIL)
        await db.ref_cloisons.insert_many(REF_CLOISONS)
        await db.ref_cloison_options.insert_many(REF_CLOISON_OPTIONS)
        await db.ref_peintures.insert_many(REF_PEINTURES)
        await db.ref_parquets.insert_many(REF_PARQUETS)
        await db.ref_parquet_poses.insert_many(REF_PARQUET_POSES)
        await db.ref_extras.insert_many(REF_EXTRAS)
        
        logger.info("Database seeded successfully!")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")


@app.on_event("startup")
async def startup_event():
    await seed_database()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# ==================== AUTH ROUTES ====================
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un utilisateur avec cet email existe déjà"
        )
    
    # Create new user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "nom": user_data.nom,
        "password": hashed_password,
        "created_at": datetime.utcnow()
    }
    await db.users.insert_one(user_doc)
    
    # Create token
    access_token = create_access_token(data={"sub": user_id})
    
    user = User(
        id=user_id,
        email=user_data.email,
        nom=user_data.nom,
        created_at=user_doc["created_at"]
    )
    
    return TokenResponse(access_token=access_token, user=user)


@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    # Find user
    user_doc = await db.users.find_one({"email": credentials.email})
    if not user_doc or not verify_password(credentials.password, user_doc["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect"
        )
    
    # Create token
    access_token = create_access_token(data={"sub": user_doc["id"]})
    
    user = User(
        id=user_doc["id"],
        email=user_doc["email"],
        nom=user_doc["nom"],
        created_at=user_doc["created_at"]
    )
    
    return TokenResponse(access_token=access_token, user=user)


@api_router.get("/auth/me", response_model=User)
async def get_current_user(user_id: str = Depends(get_current_user_id)):
    user_doc = await db.users.find_one({"id": user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    entreprise = user_doc.get("entreprise")
    if entreprise:
        entreprise = EntrepriseInfo(**entreprise)
    
    return User(
        id=user_doc["id"],
        email=user_doc["email"],
        nom=user_doc["nom"],
        created_at=user_doc["created_at"],
        entreprise=entreprise
    )


# ==================== ENTREPRISE (PROFIL) ROUTES ====================
@api_router.get("/entreprise")
async def get_entreprise(user_id: str = Depends(get_current_user_id)):
    user_doc = await db.users.find_one({"id": user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    entreprise = user_doc.get("entreprise", {})
    return EntrepriseInfo(**entreprise) if entreprise else EntrepriseInfo()


@api_router.put("/entreprise")
async def update_entreprise(
    entreprise_data: EntrepriseUpdate,
    user_id: str = Depends(get_current_user_id)
):
    user_doc = await db.users.find_one({"id": user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    # Get current entreprise or create new one
    current_entreprise = user_doc.get("entreprise", {})
    
    # Update only provided fields
    update_dict = entreprise_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        if value is not None:
            if isinstance(value, dict):
                # For nested objects like conditions_paiement
                current_entreprise[key] = value
            else:
                current_entreprise[key] = value
    
    # Save to database
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"entreprise": current_entreprise}}
    )
    
    return EntrepriseInfo(**current_entreprise)


# ==================== REFERENCE DATA ROUTES ====================
@api_router.get("/references/cuisine/types")
async def get_cuisine_types():
    items = await db.ref_cuisine_types.find({}, {"_id": 0}).to_list(100)
    return items


@api_router.get("/references/cuisine/plans-travail")
async def get_plans_travail():
    items = await db.ref_plans_travail.find({}, {"_id": 0}).to_list(100)
    return items


@api_router.get("/references/cloisons")
async def get_cloisons():
    items = await db.ref_cloisons.find({}, {"_id": 0}).to_list(100)
    return items


@api_router.get("/references/cloisons/options")
async def get_cloison_options():
    items = await db.ref_cloison_options.find({}, {"_id": 0}).to_list(100)
    return items


@api_router.get("/references/peintures")
async def get_peintures():
    items = await db.ref_peintures.find({}, {"_id": 0}).to_list(100)
    return items


@api_router.get("/references/parquets")
async def get_parquets():
    items = await db.ref_parquets.find({}, {"_id": 0}).to_list(100)
    return items


@api_router.get("/references/parquets/poses")
async def get_parquet_poses():
    items = await db.ref_parquet_poses.find({}, {"_id": 0}).to_list(100)
    return items


@api_router.get("/references/extras")
async def get_extras(categorie: Optional[str] = None):
    query = {"categorie": categorie} if categorie else {}
    items = await db.ref_extras.find(query, {"_id": 0}).to_list(100)
    return items


# ==================== DEVIS ROUTES ====================
def generate_numero_devis():
    """Generate unique quote number"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"DEV-{timestamp}"


def calculate_devis_totals(postes_data: list, tva_taux: float):
    """Helper function to calculate devis totals"""
    postes = []
    total_ht = 0
    
    for poste_data in postes_data:
        poste_id = str(uuid.uuid4())
        prix_ajuste = poste_data.prix_ajuste or poste_data.prix_default
        
        # Validate price is within range
        if prix_ajuste < poste_data.prix_min or prix_ajuste > poste_data.prix_max:
            prix_ajuste = poste_data.prix_default
        
        sous_total = poste_data.quantite * prix_ajuste
        
        # Récupérer le flag offert (False par défaut)
        is_offert = getattr(poste_data, 'offert', False) or False
        
        # Ne pas comptabiliser les postes offerts dans le total
        if not is_offert:
            total_ht += sous_total
        
        poste = PosteDevis(
            id=poste_id,
            devis_id="",  # Will be set later
            categorie=poste_data.categorie,
            reference_id=poste_data.reference_id,
            reference_nom=poste_data.reference_nom,
            quantite=poste_data.quantite,
            unite=poste_data.unite,
            prix_min=poste_data.prix_min,
            prix_max=poste_data.prix_max,
            prix_default=poste_data.prix_default,
            prix_ajuste=prix_ajuste,
            sous_total=sous_total,
            options=poste_data.options,
            offert=is_offert  # Préserver le flag offert
        )
        postes.append(poste)
    
    total_tva = total_ht * (tva_taux / 100)
    total_ttc = total_ht + total_tva
    
    return postes, round(total_ht, 2), round(total_tva, 2), round(total_ttc, 2)


@api_router.post("/devis", response_model=Devis)
async def create_devis(
    devis_data: DevisCreate,
    user_id: str = Depends(get_current_user_id)
):
    # Create devis
    devis_id = str(uuid.uuid4())
    numero_devis = generate_numero_devis()
    
    # Get user's default conditions if not provided
    if not devis_data.conditions_paiement:
        user_doc = await db.users.find_one({"id": user_id})
        if user_doc and user_doc.get("entreprise"):
            entreprise = user_doc["entreprise"]
            if "conditions_paiement" in entreprise:
                devis_data.conditions_paiement = DevisConditionsPaiement(**entreprise["conditions_paiement"])
    
    if not devis_data.conditions_paiement:
        devis_data.conditions_paiement = DevisConditionsPaiement()
    
    # Calculate postes and totals
    postes, total_ht, total_tva, total_ttc = calculate_devis_totals(devis_data.postes, devis_data.tva_taux)
    
    # Update devis_id in postes
    for poste in postes:
        poste.devis_id = devis_id
    
    # Calculate validity date
    from datetime import timedelta
    date_creation = datetime.utcnow()
    date_validite = date_creation + timedelta(days=devis_data.validite_jours)
    
    devis = Devis(
        id=devis_id,
        numero_devis=numero_devis,
        user_id=user_id,
        client=devis_data.client,
        date_creation=date_creation,
        date_validite=date_validite,
        tva_taux=devis_data.tva_taux,
        total_ht=total_ht,
        total_tva=total_tva,
        total_ttc=total_ttc,
        statut=StatutDevis.BROUILLON,
        conditions_paiement=devis_data.conditions_paiement,
        notes=devis_data.notes or "",
        postes=postes
    )
    
    # Save to database
    devis_dict = devis.dict()
    await db.devis.insert_one(devis_dict)
    
    return devis


@api_router.get("/devis", response_model=List[DevisListItem])
async def list_devis(
    user_id: str = Depends(get_current_user_id),
    statut: Optional[StatutDevis] = None
):
    query = {"user_id": user_id}
    if statut:
        query["statut"] = statut
    
    devis_list = await db.devis.find(query).sort("date_creation", -1).to_list(100)
    
    result = []
    for d in devis_list:
        # Handle both old format (client_nom) and new format (client object)
        if isinstance(d.get("client"), dict):
            client_nom = d["client"].get("nom", "Client inconnu")
        else:
            client_nom = d.get("client_nom", "Client inconnu")
        
        result.append(DevisListItem(
            id=d["id"],
            numero_devis=d["numero_devis"],
            client_nom=client_nom,
            date_creation=d["date_creation"],
            total_ttc=d["total_ttc"],
            statut=d["statut"]
        ))
    
    return result


@api_router.get("/devis/{devis_id}", response_model=Devis)
async def get_devis(
    devis_id: str,
    user_id: str = Depends(get_current_user_id)
):
    devis_doc = await db.devis.find_one({"id": devis_id, "user_id": user_id})
    if not devis_doc:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    # Handle backward compatibility - convert old format to new
    if "client" not in devis_doc or not isinstance(devis_doc["client"], dict):
        client_nom = devis_doc.get("client_nom", "Client")
        devis_doc["client"] = {
            "nom": client_nom,
            "prenom": "",
            "adresse": "",
            "code_postal": "",
            "ville": "",
            "telephone": "",
            "email": ""
        }
    
    # Ensure all required fields exist
    if "date_validite" not in devis_doc:
        from datetime import timedelta
        devis_doc["date_validite"] = devis_doc["date_creation"] + timedelta(days=30)
    
    if "total_tva" not in devis_doc:
        devis_doc["total_tva"] = devis_doc["total_ttc"] - devis_doc["total_ht"]
    
    if "conditions_paiement" not in devis_doc:
        devis_doc["conditions_paiement"] = {"type": "jours", "delai_jours": 30, "acomptes": []}
    
    if "notes" not in devis_doc:
        devis_doc["notes"] = ""
    
    return Devis(**devis_doc)


@api_router.put("/devis/{devis_id}", response_model=Devis)
async def update_devis_full(
    devis_id: str,
    update_data: DevisUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Full update of a quote - allows modification of all fields including postes"""
    devis_doc = await db.devis.find_one({"id": devis_id, "user_id": user_id})
    if not devis_doc:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    update_dict = {}
    
    # Update client info
    if update_data.client is not None:
        update_dict["client"] = update_data.client.dict()
    
    # Update TVA
    if update_data.tva_taux is not None:
        update_dict["tva_taux"] = update_data.tva_taux
    
    # Update validity
    if update_data.validite_jours is not None:
        from datetime import timedelta
        update_dict["validite_jours"] = update_data.validite_jours
        update_dict["date_validite"] = devis_doc["date_creation"] + timedelta(days=update_data.validite_jours)
    
    # Update payment conditions
    if update_data.conditions_paiement is not None:
        update_dict["conditions_paiement"] = update_data.conditions_paiement.dict()
    
    # Update notes
    if update_data.notes is not None:
        update_dict["notes"] = update_data.notes
    
    # Update status
    if update_data.statut is not None:
        update_dict["statut"] = update_data.statut.value
    
    # Update postes if provided
    if update_data.postes is not None:
        tva_taux = update_data.tva_taux if update_data.tva_taux is not None else devis_doc["tva_taux"]
        postes, total_ht, total_tva, total_ttc = calculate_devis_totals(update_data.postes, tva_taux)
        
        # Update devis_id in postes
        postes_dicts = []
        for poste in postes:
            poste.devis_id = devis_id
            postes_dicts.append(poste.dict())
        
        update_dict["postes"] = postes_dicts
        update_dict["total_ht"] = total_ht
        update_dict["total_tva"] = total_tva
        update_dict["total_ttc"] = total_ttc
    
    # Update the document
    if update_dict:
        await db.devis.update_one(
            {"id": devis_id},
            {"$set": update_dict}
        )
        devis_doc.update(update_dict)
    
    # Handle backward compatibility
    if "client" not in devis_doc or not isinstance(devis_doc["client"], dict):
        client_nom = devis_doc.get("client_nom", "Client")
        devis_doc["client"] = {
            "nom": client_nom, "prenom": "", "adresse": "", 
            "code_postal": "", "ville": "", "telephone": "", "email": ""
        }
    
    if "date_validite" not in devis_doc:
        from datetime import timedelta
        devis_doc["date_validite"] = devis_doc["date_creation"] + timedelta(days=30)
    
    if "total_tva" not in devis_doc:
        devis_doc["total_tva"] = devis_doc["total_ttc"] - devis_doc["total_ht"]
    
    if "conditions_paiement" not in devis_doc:
        devis_doc["conditions_paiement"] = {"type": "jours", "delai_jours": 30, "acomptes": []}
    
    if "notes" not in devis_doc:
        devis_doc["notes"] = ""
    
    return Devis(**devis_doc)


@api_router.patch("/devis/{devis_id}", response_model=Devis)
async def update_devis_partial(
    devis_id: str,
    update_data: DevisUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Partial update - mainly for status changes"""
    return await update_devis_full(devis_id, update_data, user_id)


@api_router.delete("/devis/{devis_id}")
async def delete_devis(
    devis_id: str,
    user_id: str = Depends(get_current_user_id)
):
    result = await db.devis.delete_one({"id": devis_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    return {"message": "Devis supprimé avec succès"}


@api_router.get("/devis/{devis_id}/pdf")
async def generate_pdf(
    devis_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Generate professional PDF for a quote"""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import cm, mm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, KeepTogether, PageBreak
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
    import io
    import base64
    
    # Get devis
    devis_doc = await db.devis.find_one({"id": devis_id, "user_id": user_id})
    if not devis_doc:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    # Get user's entreprise info
    user_doc = await db.users.find_one({"id": user_id})
    entreprise = user_doc.get("entreprise", {}) if user_doc else {}
    
    # Handle backward compatibility for client
    if isinstance(devis_doc.get("client"), dict):
        client = devis_doc["client"]
    else:
        client = {"nom": devis_doc.get("client_nom", "Client"), "prenom": "", "adresse": "", "code_postal": "", "ville": "", "telephone": "", "email": ""}
    
    # Get date validité
    from datetime import timedelta
    date_validite = devis_doc.get("date_validite", devis_doc["date_creation"] + timedelta(days=30))
    
    # Calculate totals - les prix sont en TTC, recalculer le HT
    tva_taux = devis_doc["tva_taux"]
    
    # Calculer le total TTC en excluant les postes offerts
    total_ttc = sum(
        poste.get("sous_total", 0) 
        for poste in devis_doc["postes"] 
        if not poste.get("offert", False)
    )
    # Recalculer le HT à partir du TTC
    total_ht = total_ttc / (1 + tva_taux / 100)
    total_tva = total_ttc - total_ht
    
    # Create PDF with page numbering
    buffer = io.BytesIO()
    
    # Page numbering function
    def add_page_number(canvas, doc):
        page_num = canvas.getPageNumber()
        text = f"Page {page_num}"
        canvas.saveState()
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(colors.HexColor('#7f8c8d'))
        canvas.drawCentredString(A4[0]/2, 1*cm, text)
        canvas.restoreState()
    
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4,
        leftMargin=1.5*cm,
        rightMargin=1.5*cm,
        topMargin=1.5*cm,
        bottomMargin=2*cm
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=colors.HexColor('#1a5276'),
        alignment=TA_CENTER,
        spaceAfter=10
    )
    
    header_style = ParagraphStyle(
        'Header',
        fontSize=10,
        textColor=colors.HexColor('#2c3e50'),
        leading=14
    )
    
    small_style = ParagraphStyle(
        'Small',
        fontSize=8,
        textColor=colors.HexColor('#7f8c8d'),
        leading=10
    )
    
    section_title_style = ParagraphStyle(
        'SectionTitle',
        fontSize=11,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#1a5276'),
        spaceBefore=10,
        spaceAfter=5
    )
    
    # Style pour les descriptions dans le tableau (avec retour à la ligne)
    desc_style = ParagraphStyle(
        'Description',
        fontSize=9,
        textColor=colors.HexColor('#2c3e50'),
        leading=11,
        wordWrap='CJK'  # Permet le retour à la ligne sans coupure de mot
    )
    
    # Style pour les entêtes de catégorie
    category_header_style = ParagraphStyle(
        'CategoryHeader',
        fontSize=10,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#1a5276'),
        leading=12
    )
    
    elements = []
    
    # ==== HEADER: Entreprise + Devis Info ====
    entreprise_nom = entreprise.get("nom", "Votre Entreprise")
    entreprise_adresse = entreprise.get("adresse", "")
    entreprise_cp = entreprise.get("code_postal", "")
    entreprise_ville = entreprise.get("ville", "")
    entreprise_tel = entreprise.get("telephone", "")
    entreprise_email = entreprise.get("email", "")
    entreprise_siret = entreprise.get("siret", "")
    entreprise_tva = entreprise.get("tva_intracom", "")
    
    # Entreprise info (left side)
    entreprise_text = f"""<b>{entreprise_nom}</b><br/>
{entreprise_adresse}<br/>
{entreprise_cp} {entreprise_ville}<br/>
{f'Tél: {entreprise_tel}' if entreprise_tel else ''}<br/>
{f'Email: {entreprise_email}' if entreprise_email else ''}<br/>
{f'SIRET: {entreprise_siret}' if entreprise_siret else ''}<br/>
{f'TVA: {entreprise_tva}' if entreprise_tva else ''}"""
    
    # Devis info (right side)
    devis_info_text = f"""<b>DEVIS N° {devis_doc['numero_devis']}</b><br/>
Date: {devis_doc['date_creation'].strftime('%d/%m/%Y')}<br/>
Validité: {date_validite.strftime('%d/%m/%Y')}"""
    
    header_table_data = [[
        Paragraph(entreprise_text, header_style),
        Paragraph(devis_info_text, header_style)
    ]]
    header_table = Table(header_table_data, colWidths=[10*cm, 7*cm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 1*cm))
    
    # ==== CLIENT INFO ====
    elements.append(Paragraph("CLIENT", section_title_style))
    
    client_nom_complet = f"{client.get('prenom', '')} {client.get('nom', '')}".strip()
    client_adresse = client.get('adresse', '')
    client_cp = client.get('code_postal', '')
    client_ville = client.get('ville', '')
    client_tel = client.get('telephone', '')
    client_email = client.get('email', '')
    
    client_text = f"""<b>{client_nom_complet}</b><br/>
{client_adresse}<br/>
{client_cp} {client_ville}<br/>
{f'Tél: {client_tel}' if client_tel else ''}<br/>
{f'Email: {client_email}' if client_email else ''}"""
    
    client_box = Table([[Paragraph(client_text, header_style)]], colWidths=[9*cm])
    client_box.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#bdc3c7')),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8f9fa')),
        ('PADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(client_box)
    elements.append(Spacer(1, 0.8*cm))
    
    # ==== POSTES TABLE - Groupés par catégorie avec sous-totaux ====
    elements.append(Paragraph("DÉTAIL DES PRESTATIONS", section_title_style))
    
    # Grouper les postes par catégorie
    postes_by_category = {}
    category_order = ['cuisine', 'cloison', 'peinture', 'parquet', 'service']
    category_labels = {
        'cuisine': 'CUISINE',
        'cloison': 'CLOISON',
        'peinture': 'PEINTURE',
        'parquet': 'PARQUET',
        'service': 'SERVICES'
    }
    
    for poste in devis_doc["postes"]:
        cat = poste.get("categorie", "autre").lower()
        if cat not in postes_by_category:
            postes_by_category[cat] = []
        postes_by_category[cat].append(poste)
    
    # Construire le tableau avec groupement par catégorie
    table_data = [["Description", "Qté", "Unité", "P.U. TTC", "Total TTC"]]
    
    # Style des lignes (pour alterner les couleurs et marquer les entêtes)
    row_styles = []
    current_row = 1  # Commence à 1 car row 0 = header
    
    for cat in category_order:
        if cat not in postes_by_category:
            continue
        
        postes = postes_by_category[cat]
        cat_label = category_labels.get(cat, cat.upper())
        
        # Ligne d'entête de catégorie
        table_data.append([
            Paragraph(f"<b>{cat_label}</b>", category_header_style),
            "", "", "", ""
        ])
        row_styles.append(('BACKGROUND', (0, current_row), (-1, current_row), colors.HexColor('#e8f4f8')))
        row_styles.append(('SPAN', (0, current_row), (-1, current_row)))
        current_row += 1
        
        # Sous-total de la catégorie
        cat_subtotal = 0
        
        # Lignes des postes
        for poste in postes:
            is_offert = poste.get("offert", False)
            # Description sans préfixe de catégorie
            description = poste['reference_nom']
            
            # Utiliser Paragraph pour le retour à la ligne automatique
            desc_para = Paragraph(description, desc_style)
            
            sous_total = poste.get('sous_total', 0)
            if not is_offert:
                cat_subtotal += sous_total
            
            table_data.append([
                desc_para,
                f"{poste['quantite']:.2f}",
                poste['unite'],
                f"{poste['prix_ajuste']:.2f} €",
                "OFFERT" if is_offert else f"{sous_total:.2f} €"
            ])
            current_row += 1
        
        # Ligne de sous-total de la catégorie
        table_data.append([
            Paragraph(f"<i>Sous-total {cat_label}</i>", desc_style),
            "", "", "",
            f"{cat_subtotal:.2f} €"
        ])
        row_styles.append(('BACKGROUND', (0, current_row), (-1, current_row), colors.HexColor('#f5f5f5')))
        row_styles.append(('FONTNAME', (4, current_row), (4, current_row), 'Helvetica-Bold'))
        current_row += 1
    
    # Créer le tableau
    postes_table = Table(table_data, colWidths=[8*cm, 1.8*cm, 2.2*cm, 2.5*cm, 3*cm])
    
    # Styles de base
    base_styles = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a5276')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (3, 1), (-1, -1), 'RIGHT'),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#bdc3c7')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]
    
    # Ajouter les styles spécifiques aux lignes
    all_styles = base_styles + row_styles
    postes_table.setStyle(TableStyle(all_styles))
    
    elements.append(postes_table)
    elements.append(Spacer(1, 0.5*cm))
    
    # ==== TOTALS ====
    totals_data = [
        ["", "Total HT:", f"{total_ht:.2f} €"],
        ["", f"TVA ({tva_taux}%):", f"{total_tva:.2f} €"],
        ["", "TOTAL TTC:", f"{total_ttc:.2f} €"]
    ]
    totals_table = Table(totals_data, colWidths=[11*cm, 3.5*cm, 3*cm])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
        ('FONTNAME', (1, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTSIZE', (1, -1), (-1, -1), 12),
        ('TEXTCOLOR', (1, -1), (-1, -1), colors.HexColor('#1a5276')),
        ('LINEABOVE', (1, -1), (-1, -1), 1.5, colors.HexColor('#1a5276')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 0.8*cm))
    
    # ==== CONDITIONS DE PAIEMENT (bloc non coupé) ====
    conditions = devis_doc.get("conditions_paiement", {})
    if conditions:
        conditions_elements = []
        conditions_elements.append(Paragraph("CONDITIONS DE PAIEMENT", section_title_style))
        
        if conditions.get("type") == "acomptes" and conditions.get("acomptes"):
            acomptes_text = "Règlement en plusieurs versements :<br/>"
            for i, acompte in enumerate(conditions["acomptes"]):
                desc = acompte.get("description", f"Versement {i+1}")
                pourcentage = acompte.get("pourcentage", 0)
                montant = total_ttc * (pourcentage / 100)
                acomptes_text += f"• {desc}: {pourcentage}% soit {montant:.2f} € TTC<br/>"
            conditions_elements.append(Paragraph(acomptes_text, header_style))
        else:
            delai = conditions.get("delai_jours", 30)
            conditions_elements.append(Paragraph(f"Paiement à {delai} jours à réception de facture.", header_style))
        
        conditions_elements.append(Spacer(1, 0.5*cm))
        
        # KeepTogether pour éviter la coupure
        elements.append(KeepTogether(conditions_elements))
    
    # ==== NOTES ====
    notes = devis_doc.get("notes", "")
    if notes:
        elements.append(Paragraph("REMARQUES", section_title_style))
        elements.append(Paragraph(notes, header_style))
        elements.append(Spacer(1, 0.5*cm))
    
    # ==== MENTIONS LÉGALES + GARANTIE + SIGNATURE (bloc non coupé) ====
    mentions = entreprise.get("mentions_legales", """Les travaux seront réalisés selon les règles de l'art et conformément aux normes en vigueur.
Le présent devis est valable 30 jours à compter de sa date d'émission.
Tout retard de paiement entraînera l'application de pénalités de retard au taux légal en vigueur.""")
    
    garantie = entreprise.get("garantie", "Garantie décennale et responsabilité civile professionnelle.")
    afficher_garantie = entreprise.get("afficher_garantie", True)
    
    # Créer le bloc mentions + garantie + signature
    footer_elements = []
    
    footer_elements.append(Spacer(1, 0.3*cm))
    footer_elements.append(Paragraph("MENTIONS LÉGALES", section_title_style))
    footer_elements.append(Paragraph(mentions.replace("\n", "<br/>"), small_style))
    
    if afficher_garantie and garantie:
        footer_elements.append(Spacer(1, 0.3*cm))
        footer_elements.append(Paragraph(f"<b>Garantie:</b> {garantie}", small_style))
    
    # Signature
    footer_elements.append(Spacer(1, 0.8*cm))
    
    signature_data = [
        [
            Paragraph("<b>Bon pour accord</b><br/>Date et signature du client:", header_style),
            Paragraph(f"<b>{entreprise_nom}</b><br/>Signature:", header_style)
        ],
        [
            "",
            ""
        ]
    ]
    signature_table = Table(signature_data, colWidths=[8.5*cm, 8.5*cm], rowHeights=[1*cm, 2.5*cm])
    signature_table.setStyle(TableStyle([
        ('BOX', (0, 0), (0, -1), 0.5, colors.HexColor('#bdc3c7')),
        ('BOX', (1, 0), (1, -1), 0.5, colors.HexColor('#bdc3c7')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    footer_elements.append(signature_table)
    
    # KeepTogether pour éviter la coupure du bloc footer
    elements.append(KeepTogether(footer_elements))
    
    # Build PDF with page numbering
    doc.build(elements, onFirstPage=add_page_number, onLaterPages=add_page_number)
    buffer.seek(0)
    
    # Save to temp file and return
    temp_path = f"/tmp/devis_{devis_id}.pdf"
    with open(temp_path, "wb") as f:
        f.write(buffer.getvalue())
    
    return FileResponse(
        temp_path,
        media_type="application/pdf",
        filename=f"Devis_{devis_doc['numero_devis']}.pdf"
    )


# ==================== FACTURES ====================

@api_router.post("/factures", response_model=Facture)
async def create_facture(
    facture_data: FactureCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Créer une facture à partir d'un devis"""
    # Vérifier que le devis existe et appartient à l'utilisateur
    devis_doc = await db.devis.find_one({"id": facture_data.devis_id, "user_id": user_id})
    if not devis_doc:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    # Vérifier qu'une facture n'existe pas déjà pour ce devis
    existing_facture = await db.factures.find_one({"devis_id": facture_data.devis_id})
    if existing_facture:
        raise HTTPException(status_code=400, detail="Une facture existe déjà pour ce devis")
    
    # Générer le numéro de facture
    now = datetime.utcnow()
    count = await db.factures.count_documents({"user_id": user_id})
    numero_facture = f"FAC-{now.strftime('%Y%m%d%H%M%S')}"
    
    # Recalculer les totaux en excluant les postes offerts
    total_ttc = sum(
        poste.get("sous_total", 0) 
        for poste in devis_doc["postes"] 
        if not poste.get("offert", False)
    )
    tva_taux = devis_doc["tva_taux"]
    total_ht = total_ttc / (1 + tva_taux / 100)
    total_tva = total_ttc - total_ht
    
    # Créer la facture
    facture_id = str(uuid.uuid4())
    facture = {
        "id": facture_id,
        "numero_facture": numero_facture,
        "devis_id": facture_data.devis_id,
        "devis_numero": devis_doc["numero_devis"],
        "user_id": user_id,
        "client": devis_doc.get("client", {}),
        "date_creation": now,
        "date_paiement": None,
        "tva_taux": tva_taux,
        "total_ht": round(total_ht, 2),
        "total_tva": round(total_tva, 2),
        "total_ttc": round(total_ttc, 2),
        "statut": StatutFacture.EN_ATTENTE,
        "postes": devis_doc["postes"],
        "conditions_paiement": devis_doc.get("conditions_paiement"),
        "notes": devis_doc.get("notes", "")
    }
    
    await db.factures.insert_one(facture)
    
    # Mettre à jour le statut du devis
    await db.devis.update_one(
        {"id": facture_data.devis_id},
        {"$set": {"statut": StatutDevis.FACTURE}}
    )
    
    return Facture(**facture)


@api_router.get("/factures", response_model=List[FactureListItem])
async def list_factures(user_id: str = Depends(get_current_user_id)):
    """Liste des factures de l'utilisateur"""
    factures = []
    cursor = db.factures.find({"user_id": user_id}).sort("date_creation", -1)
    
    async for f in cursor:
        client = f.get("client", {})
        client_nom = f"{client.get('prenom', '')} {client.get('nom', '')}".strip() if isinstance(client, dict) else str(client)
        factures.append(FactureListItem(
            id=f["id"],
            numero_facture=f["numero_facture"],
            devis_numero=f.get("devis_numero", ""),
            client_nom=client_nom,
            date_creation=f["date_creation"],
            date_paiement=f.get("date_paiement"),
            total_ttc=f["total_ttc"],
            statut=f["statut"]
        ))
    
    return factures


@api_router.get("/factures/{facture_id}", response_model=Facture)
async def get_facture(
    facture_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Récupérer une facture"""
    facture_doc = await db.factures.find_one({"id": facture_id, "user_id": user_id})
    if not facture_doc:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    return Facture(**facture_doc)


@api_router.put("/factures/{facture_id}/statut")
async def update_facture_statut(
    facture_id: str,
    statut: StatutFacture,
    user_id: str = Depends(get_current_user_id)
):
    """Mettre à jour le statut d'une facture (marquer comme payée)"""
    facture_doc = await db.factures.find_one({"id": facture_id, "user_id": user_id})
    if not facture_doc:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    
    update_data = {"statut": statut}
    if statut == StatutFacture.PAYEE:
        update_data["date_paiement"] = datetime.utcnow()
    
    await db.factures.update_one(
        {"id": facture_id},
        {"$set": update_data}
    )
    
    return {"message": "Statut mis à jour", "statut": statut}


@api_router.get("/factures/{facture_id}/pdf")
async def generate_facture_pdf(
    facture_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Générer le PDF d'une facture"""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import cm, mm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, KeepTogether
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
    import io
    
    # Get facture
    facture_doc = await db.factures.find_one({"id": facture_id, "user_id": user_id})
    if not facture_doc:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    
    # Get user's entreprise info
    user_doc = await db.users.find_one({"id": user_id})
    entreprise = user_doc.get("entreprise", {}) if user_doc else {}
    
    # Client info
    client = facture_doc.get("client", {})
    if not isinstance(client, dict):
        client = {"nom": str(client), "prenom": "", "adresse": "", "code_postal": "", "ville": "", "telephone": "", "email": ""}
    
    # Totals
    tva_taux = facture_doc["tva_taux"]
    total_ttc = facture_doc["total_ttc"]
    total_ht = facture_doc["total_ht"]
    total_tva = facture_doc["total_tva"]
    
    # Create PDF
    buffer = io.BytesIO()
    
    def add_page_number(canvas, doc):
        page_num = canvas.getPageNumber()
        text = f"Page {page_num}"
        canvas.saveState()
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(colors.HexColor('#7f8c8d'))
        canvas.drawCentredString(A4[0]/2, 1*cm, text)
        canvas.restoreState()
    
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4,
        leftMargin=1.5*cm,
        rightMargin=1.5*cm,
        topMargin=1.5*cm,
        bottomMargin=2*cm
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    header_style = ParagraphStyle('Header', fontSize=10, textColor=colors.HexColor('#2c3e50'), leading=14)
    small_style = ParagraphStyle('Small', fontSize=8, textColor=colors.HexColor('#7f8c8d'), leading=10)
    section_title_style = ParagraphStyle('SectionTitle', fontSize=11, fontName='Helvetica-Bold', textColor=colors.HexColor('#1a5276'), spaceBefore=10, spaceAfter=5)
    desc_style = ParagraphStyle('Description', fontSize=9, textColor=colors.HexColor('#2c3e50'), leading=11, wordWrap='CJK')
    category_header_style = ParagraphStyle('CategoryHeader', fontSize=10, fontName='Helvetica-Bold', textColor=colors.HexColor('#1a5276'), leading=12)
    
    elements = []
    
    # ==== HEADER ====
    entreprise_nom = entreprise.get("nom", "Votre Entreprise")
    entreprise_text = f"""<b>{entreprise_nom}</b><br/>
{entreprise.get("adresse", "")}<br/>
{entreprise.get("code_postal", "")} {entreprise.get("ville", "")}<br/>
{f'Tél: {entreprise.get("telephone", "")}' if entreprise.get("telephone") else ''}<br/>
{f'Email: {entreprise.get("email", "")}' if entreprise.get("email") else ''}<br/>
{f'SIRET: {entreprise.get("siret", "")}' if entreprise.get("siret") else ''}<br/>
{f'TVA: {entreprise.get("tva_intracom", "")}' if entreprise.get("tva_intracom") else ''}"""
    
    # FACTURE au lieu de DEVIS
    facture_info_text = f"""<b>FACTURE N° {facture_doc['numero_facture']}</b><br/>
Date: {facture_doc['date_creation'].strftime('%d/%m/%Y')}<br/>
Devis associé: {facture_doc.get('devis_numero', 'N/A')}"""
    
    if facture_doc.get("statut") == StatutFacture.PAYEE and facture_doc.get("date_paiement"):
        facture_info_text += f"<br/>Payée le: {facture_doc['date_paiement'].strftime('%d/%m/%Y')}"
    
    header_table = Table([[
        Paragraph(entreprise_text, header_style),
        Paragraph(facture_info_text, header_style)
    ]], colWidths=[10*cm, 7*cm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 1*cm))
    
    # ==== CLIENT ====
    elements.append(Paragraph("CLIENT", section_title_style))
    client_nom_complet = f"{client.get('prenom', '')} {client.get('nom', '')}".strip()
    client_text = f"""<b>{client_nom_complet}</b><br/>
{client.get('adresse', '')}<br/>
{client.get('code_postal', '')} {client.get('ville', '')}<br/>
{f"Tél: {client.get('telephone', '')}" if client.get('telephone') else ''}<br/>
{f"Email: {client.get('email', '')}" if client.get('email') else ''}"""
    
    client_box = Table([[Paragraph(client_text, header_style)]], colWidths=[9*cm])
    client_box.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#bdc3c7')),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8f9fa')),
        ('PADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(client_box)
    elements.append(Spacer(1, 0.8*cm))
    
    # ==== POSTES - Même structure que le devis ====
    elements.append(Paragraph("DÉTAIL DES PRESTATIONS", section_title_style))
    
    # Grouper par catégorie
    postes_by_category = {}
    category_order = ['cuisine', 'cloison', 'peinture', 'parquet', 'service']
    category_labels = {'cuisine': 'CUISINE', 'cloison': 'CLOISON', 'peinture': 'PEINTURE', 'parquet': 'PARQUET', 'service': 'SERVICES'}
    
    for poste in facture_doc["postes"]:
        cat = poste.get("categorie", "autre").lower()
        if cat not in postes_by_category:
            postes_by_category[cat] = []
        postes_by_category[cat].append(poste)
    
    table_data = [["Description", "Qté", "Unité", "P.U. TTC", "Total TTC"]]
    row_styles = []
    current_row = 1
    
    for cat in category_order:
        if cat not in postes_by_category:
            continue
        
        postes = postes_by_category[cat]
        cat_label = category_labels.get(cat, cat.upper())
        
        table_data.append([Paragraph(f"<b>{cat_label}</b>", category_header_style), "", "", "", ""])
        row_styles.append(('BACKGROUND', (0, current_row), (-1, current_row), colors.HexColor('#e8f4f8')))
        row_styles.append(('SPAN', (0, current_row), (-1, current_row)))
        current_row += 1
        
        cat_subtotal = 0
        for poste in postes:
            is_offert = poste.get("offert", False)
            description = poste['reference_nom']
            sous_total = poste.get('sous_total', 0)
            if not is_offert:
                cat_subtotal += sous_total
            
            table_data.append([
                Paragraph(description, desc_style),
                f"{poste['quantite']:.2f}",
                poste['unite'],
                f"{poste['prix_ajuste']:.2f} €",
                "OFFERT" if is_offert else f"{sous_total:.2f} €"
            ])
            current_row += 1
        
        table_data.append([Paragraph(f"<i>Sous-total {cat_label}</i>", desc_style), "", "", "", f"{cat_subtotal:.2f} €"])
        row_styles.append(('BACKGROUND', (0, current_row), (-1, current_row), colors.HexColor('#f5f5f5')))
        row_styles.append(('FONTNAME', (4, current_row), (4, current_row), 'Helvetica-Bold'))
        current_row += 1
    
    postes_table = Table(table_data, colWidths=[8*cm, 1.8*cm, 2.2*cm, 2.5*cm, 3*cm])
    base_styles = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a5276')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (3, 1), (-1, -1), 'RIGHT'),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#bdc3c7')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]
    postes_table.setStyle(TableStyle(base_styles + row_styles))
    elements.append(postes_table)
    elements.append(Spacer(1, 0.5*cm))
    
    # ==== TOTALS ====
    totals_data = [
        ["", "Total HT:", f"{total_ht:.2f} €"],
        ["", f"TVA ({tva_taux}%):", f"{total_tva:.2f} €"],
        ["", "TOTAL TTC:", f"{total_ttc:.2f} €"]
    ]
    totals_table = Table(totals_data, colWidths=[11*cm, 3.5*cm, 3*cm])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
        ('FONTNAME', (1, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTSIZE', (1, -1), (-1, -1), 12),
        ('TEXTCOLOR', (1, -1), (-1, -1), colors.HexColor('#1a5276')),
        ('LINEABOVE', (1, -1), (-1, -1), 1.5, colors.HexColor('#1a5276')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 0.8*cm))
    
    # ==== CONDITIONS DE PAIEMENT ====
    conditions = facture_doc.get("conditions_paiement", {})
    if conditions:
        conditions_elements = []
        conditions_elements.append(Paragraph("CONDITIONS DE PAIEMENT", section_title_style))
        
        if conditions.get("type") == "acomptes" and conditions.get("acomptes"):
            acomptes_text = "Règlement en plusieurs versements :<br/>"
            for i, acompte in enumerate(conditions["acomptes"]):
                desc = acompte.get("description", f"Versement {i+1}")
                pourcentage = acompte.get("pourcentage", 0)
                montant = total_ttc * (pourcentage / 100)
                acomptes_text += f"• {desc}: {pourcentage}% soit {montant:.2f} € TTC<br/>"
            conditions_elements.append(Paragraph(acomptes_text, header_style))
        else:
            delai = conditions.get("delai_jours", 30)
            conditions_elements.append(Paragraph(f"Paiement à {delai} jours à réception de facture.", header_style))
        
        conditions_elements.append(Spacer(1, 0.5*cm))
        elements.append(KeepTogether(conditions_elements))
    
    # ==== MENTIONS LÉGALES ====
    footer_elements = []
    mentions = entreprise.get("mentions_legales", "")
    if mentions:
        footer_elements.append(Spacer(1, 0.3*cm))
        footer_elements.append(Paragraph("MENTIONS LÉGALES", section_title_style))
        footer_elements.append(Paragraph(mentions.replace("\n", "<br/>"), small_style))
    
    if footer_elements:
        elements.append(KeepTogether(footer_elements))
    
    # Build PDF
    doc.build(elements, onFirstPage=add_page_number, onLaterPages=add_page_number)
    buffer.seek(0)
    
    temp_path = f"/tmp/facture_{facture_id}.pdf"
    with open(temp_path, "wb") as f:
        f.write(buffer.getvalue())
    
    return FileResponse(
        temp_path,
        media_type="application/pdf",
        filename=f"Facture_{facture_doc['numero_facture']}.pdf"
    )


@api_router.delete("/factures/{facture_id}")
async def delete_facture(
    facture_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Supprimer une facture"""
    facture_doc = await db.factures.find_one({"id": facture_id, "user_id": user_id})
    if not facture_doc:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    
    # Remettre le devis au statut ACCEPTE
    await db.devis.update_one(
        {"id": facture_doc["devis_id"]},
        {"$set": {"statut": StatutDevis.ACCEPTE}}
    )
    
    await db.factures.delete_one({"id": facture_id})
    return {"message": "Facture supprimée"}


# Root route
@api_router.get("/")
async def root():
    return {
        "message": "API Devis Rénovation",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/api/auth/*",
            "references": "/api/references/*",
            "devis": "/api/devis/*"
        }
    }


# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
