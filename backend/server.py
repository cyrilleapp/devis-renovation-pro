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
    CategoriePoste, StatutDevis
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
    
    return User(
        id=user_doc["id"],
        email=user_doc["email"],
        nom=user_doc["nom"],
        created_at=user_doc["created_at"]
    )


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


@api_router.post("/devis", response_model=Devis)
async def create_devis(
    devis_data: DevisCreate,
    user_id: str = Depends(get_current_user_id)
):
    # Create devis
    devis_id = str(uuid.uuid4())
    numero_devis = generate_numero_devis()
    
    # Create postes
    postes = []
    total_ht = 0
    
    for poste_data in devis_data.postes:
        poste_id = str(uuid.uuid4())
        prix_ajuste = poste_data.prix_ajuste or poste_data.prix_default
        
        # Validate price is within range
        if prix_ajuste < poste_data.prix_min or prix_ajuste > poste_data.prix_max:
            prix_ajuste = poste_data.prix_default
        
        sous_total = poste_data.quantite * prix_ajuste
        total_ht += sous_total
        
        poste = PosteDevis(
            id=poste_id,
            devis_id=devis_id,
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
            options=poste_data.options
        )
        postes.append(poste)
    
    # Calculate totals
    total_ttc = total_ht * (1 + devis_data.tva_taux / 100)
    
    devis = Devis(
        id=devis_id,
        numero_devis=numero_devis,
        user_id=user_id,
        client_nom=devis_data.client_nom,
        date_creation=datetime.utcnow(),
        tva_taux=devis_data.tva_taux,
        total_ht=round(total_ht, 2),
        total_ttc=round(total_ttc, 2),
        statut=StatutDevis.BROUILLON,
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
    
    return [
        DevisListItem(
            id=d["id"],
            numero_devis=d["numero_devis"],
            client_nom=d["client_nom"],
            date_creation=d["date_creation"],
            total_ttc=d["total_ttc"],
            statut=d["statut"]
        )
        for d in devis_list
    ]


@api_router.get("/devis/{devis_id}", response_model=Devis)
async def get_devis(
    devis_id: str,
    user_id: str = Depends(get_current_user_id)
):
    devis_doc = await db.devis.find_one({"id": devis_id, "user_id": user_id})
    if not devis_doc:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    return Devis(**devis_doc)


@api_router.patch("/devis/{devis_id}", response_model=Devis)
async def update_devis(
    devis_id: str,
    update_data: DevisUpdate,
    user_id: str = Depends(get_current_user_id)
):
    devis_doc = await db.devis.find_one({"id": devis_id, "user_id": user_id})
    if not devis_doc:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    # Update fields
    update_dict = update_data.dict(exclude_unset=True)
    if update_dict:
        await db.devis.update_one(
            {"id": devis_id},
            {"$set": update_dict}
        )
        devis_doc.update(update_dict)
    
    return Devis(**devis_doc)


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
    """Generate PDF for a quote"""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_RIGHT
    import io
    
    # Get devis
    devis_doc = await db.devis.find_one({"id": devis_id, "user_id": user_id})
    if not devis_doc:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    devis = Devis(**devis_doc)
    
    # Create PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#2c3e50'),
        alignment=TA_CENTER,
        spaceAfter=30
    )
    
    elements = []
    
    # Title
    elements.append(Paragraph(f"DEVIS N° {devis.numero_devis}", title_style))
    elements.append(Spacer(1, 0.5*cm))
    
    # Client info
    client_data = [
        ["Client:", devis.client_nom],
        ["Date:", devis.date_creation.strftime("%d/%m/%Y")],
        ["Statut:", devis.statut.value.capitalize()]
    ]
    client_table = Table(client_data, colWidths=[4*cm, 12*cm])
    client_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(client_table)
    elements.append(Spacer(1, 1*cm))
    
    # Postes table
    table_data = [["Description", "Quantité", "Unité", "Prix Unit.", "Total"]]
    
    for poste in devis.postes:
        description = f"{poste.categorie.value.capitalize()} - {poste.reference_nom}"
        table_data.append([
            description,
            f"{poste.quantite:.2f}",
            poste.unite,
            f"{poste.prix_ajuste:.2f} €",
            f"{poste.sous_total:.2f} €"
        ])
    
    postes_table = Table(table_data, colWidths=[8*cm, 2*cm, 3*cm, 2.5*cm, 2.5*cm])
    postes_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3498db')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#ecf0f1')])
    ]))
    elements.append(postes_table)
    elements.append(Spacer(1, 1*cm))
    
    # Totals
    totals_data = [
        ["Total HT:", f"{devis.total_ht:.2f} €"],
        [f"TVA ({devis.tva_taux}%):", f"{(devis.total_ttc - devis.total_ht):.2f} €"],
        ["Total TTC:", f"{devis.total_ttc:.2f} €"]
    ]
    totals_table = Table(totals_data, colWidths=[14*cm, 4*cm])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('LINEABOVE', (0, -1), (-1, -1), 2, colors.black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(totals_table)
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    
    # Save to temp file and return
    temp_path = f"/tmp/devis_{devis_id}.pdf"
    with open(temp_path, "wb") as f:
        f.write(buffer.getvalue())
    
    return FileResponse(
        temp_path,
        media_type="application/pdf",
        filename=f"Devis_{devis.numero_devis}.pdf"
    )


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
