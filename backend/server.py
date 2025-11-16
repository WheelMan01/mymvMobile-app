from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List
from datetime import datetime
from bson import ObjectId

from models import *
from auth_utils import *
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Helper functions
def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable format"""
    if doc:
        doc['id'] = str(doc['_id'])
        del doc['_id']
    return doc


def get_status(end_date: datetime) -> str:
    """Determine if something is active or expired"""
    return "Active" if end_date > datetime.utcnow() else "Expired"


# ===== AUTH ENDPOINTS =====

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_dict = {
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "full_name": user_data.full_name,
        "phone": user_data.phone,
        "member_id": generate_member_id(),
        "pin": generate_pin(),
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_dict)
    user_dict['id'] = str(result.inserted_id)
    
    # Create token
    token = create_access_token({"user_id": user_dict['id'], "email": user_dict['email']})
    
    user_response = UserResponse(
        id=user_dict['id'],
        email=user_dict['email'],
        full_name=user_dict['full_name'],
        phone=user_dict['phone'],
        member_id=user_dict['member_id'],
        created_at=user_dict['created_at']
    )
    
    return TokenResponse(access_token=token, user=user_response)


@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login with email and password"""
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"user_id": str(user['_id']), "email": user['email']})
    
    user_response = UserResponse(
        id=str(user['_id']),
        email=user['email'],
        full_name=user['full_name'],
        phone=user['phone'],
        member_id=user['member_id'],
        created_at=user['created_at']
    )
    
    return TokenResponse(access_token=token, user=user_response)


@api_router.post("/auth/pin-login", response_model=TokenResponse)
async def pin_login(credentials: PinLogin):
    """Login with member ID and PIN"""
    user = await db.users.find_one({"member_id": credentials.member_id})
    if not user or user.get('pin') != credentials.pin:
        raise HTTPException(status_code=401, detail="Invalid member ID or PIN")
    
    token = create_access_token({"user_id": str(user['_id']), "email": user['email']})
    
    user_response = UserResponse(
        id=str(user['_id']),
        email=user['email'],
        full_name=user['full_name'],
        phone=user['phone'],
        member_id=user['member_id'],
        created_at=user['created_at']
    )
    
    return TokenResponse(access_token=token, user=user_response)


@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    user = await db.users.find_one({"_id": ObjectId(current_user['user_id'])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=str(user['_id']),
        email=user['email'],
        full_name=user['full_name'],
        phone=user['phone'],
        member_id=user['member_id'],
        created_at=user['created_at']
    )


@api_router.put("/auth/update-profile", response_model=UserResponse)
async def update_profile(update_data: UserUpdate, current_user: dict = Depends(get_current_user)):
    """Update user profile"""
    update_dict = {}
    if update_data.full_name:
        update_dict['full_name'] = update_data.full_name
    if update_data.phone:
        update_dict['phone'] = update_data.phone
    if update_data.password:
        update_dict['password'] = hash_password(update_data.password)
    
    if update_dict:
        await db.users.update_one(
            {"_id": ObjectId(current_user['user_id'])},
            {"$set": update_dict}
        )
    
    user = await db.users.find_one({"_id": ObjectId(current_user['user_id'])})
    return UserResponse(
        id=str(user['_id']),
        email=user['email'],
        full_name=user['full_name'],
        phone=user['phone'],
        member_id=user['member_id'],
        created_at=user['created_at']
    )


# ===== DASHBOARD =====

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Get dashboard statistics"""
    user_id = current_user['user_id']
    
    total_vehicles = await db.vehicles.count_documents({"user_id": user_id})
    
    active_insurance = await db.insurance_policies.count_documents({
        "user_id": user_id,
        "end_date": {"$gt": datetime.utcnow()}
    })
    
    active_finance = await db.finance_products.count_documents({
        "user_id": user_id,
        "end_date": {"$gt": datetime.utcnow()}
    })
    
    active_roadside = await db.roadside_assistance.count_documents({
        "user_id": user_id,
        "end_date": {"$gt": datetime.utcnow()}
    })
    
    return DashboardStats(
        total_vehicles=total_vehicles,
        active_insurance_policies=active_insurance,
        active_finance_products=active_finance,
        active_roadside_memberships=active_roadside
    )


# ===== VEHICLE ENDPOINTS =====

@api_router.post("/vehicles/extract-rego-data")
async def extract_rego_data(scan_data: RegoScanRequest, current_user: dict = Depends(get_current_user)):
    """Extract vehicle data from registration paper using AI"""
    try:
        # Initialize LLM with Emergent key
        chat = LlmChat(
            api_key=os.getenv("EMERGENT_LLM_KEY"),
            session_id=f"rego_scan_{current_user['user_id']}_{int(datetime.utcnow().timestamp())}",
            system_message="You are an AI assistant that extracts vehicle information from registration documents. Return data in JSON format only."
        ).with_model("openai", "gpt-4o")
        
        # Create image content
        image_content = ImageContent(image_base64=scan_data.image_base64)
        
        # Send message with image
        message = UserMessage(
            text="""Extract the following information from this vehicle registration document and return ONLY a JSON object with these exact keys:
            {
                "rego": "registration number",
                "vin": "VIN number",
                "make": "vehicle make",
                "model": "vehicle model",
                "year": year as integer,
                "body_type": "body type",
                "expiry_date": "expiry date in YYYY-MM-DD format"
            }
            If any field is not found, use null. Return only the JSON, no other text.""",
            file_contents=[image_content]
        )
        
        response = await chat.send_message(message)
        
        # Parse the response
        import json
        try:
            # Clean response (remove markdown if present)
            cleaned = response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
            
            extracted_data = json.loads(cleaned)
            return extracted_data
        except json.JSONDecodeError:
            logger.error(f"Failed to parse AI response: {response}")
            raise HTTPException(status_code=500, detail="Failed to parse AI response")
        
    except Exception as e:
        logger.error(f"Error extracting rego data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


@api_router.get("/vehicles", response_model=List[VehicleResponse])
async def get_vehicles(current_user: dict = Depends(get_current_user)):
    """Get all user vehicles"""
    vehicles = await db.vehicles.find({"user_id": current_user['user_id']}).to_list(100)
    return [VehicleResponse(**serialize_doc(v)) for v in vehicles]


@api_router.post("/vehicles", response_model=VehicleResponse)
async def create_vehicle(vehicle_data: VehicleCreate, current_user: dict = Depends(get_current_user)):
    """Create a new vehicle"""
    vehicle_dict = vehicle_data.dict()
    vehicle_dict['user_id'] = current_user['user_id']
    vehicle_dict['created_at'] = datetime.utcnow()
    
    result = await db.vehicles.insert_one(vehicle_dict)
    vehicle_dict['id'] = str(result.inserted_id)
    
    return VehicleResponse(**vehicle_dict)


@api_router.get("/vehicles/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(vehicle_id: str, current_user: dict = Depends(get_current_user)):
    """Get specific vehicle"""
    vehicle = await db.vehicles.find_one({"_id": ObjectId(vehicle_id), "user_id": current_user['user_id']})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    return VehicleResponse(**serialize_doc(vehicle))


@api_router.put("/vehicles/{vehicle_id}", response_model=VehicleResponse)
async def update_vehicle(vehicle_id: str, update_data: VehicleUpdate, current_user: dict = Depends(get_current_user)):
    """Update vehicle"""
    update_dict = {k: v for k, v in update_data.dict(exclude_unset=True).items() if v is not None}
    
    if update_dict:
        await db.vehicles.update_one(
            {"_id": ObjectId(vehicle_id), "user_id": current_user['user_id']},
            {"$set": update_dict}
        )
    
    vehicle = await db.vehicles.find_one({"_id": ObjectId(vehicle_id)})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    return VehicleResponse(**serialize_doc(vehicle))


@api_router.delete("/vehicles/{vehicle_id}")
async def delete_vehicle(vehicle_id: str, current_user: dict = Depends(get_current_user)):
    """Delete vehicle"""
    result = await db.vehicles.delete_one({"_id": ObjectId(vehicle_id), "user_id": current_user['user_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    return {"message": "Vehicle deleted successfully"}


# ===== INSURANCE ENDPOINTS =====

@api_router.get("/insurance-policies", response_model=List[InsurancePolicyResponse])
async def get_insurance_policies(current_user: dict = Depends(get_current_user)):
    """Get all insurance policies"""
    policies = await db.insurance_policies.find({"user_id": current_user['user_id']}).to_list(100)
    result = []
    for p in policies:
        p = serialize_doc(p)
        p['status'] = get_status(p['end_date'])
        result.append(InsurancePolicyResponse(**p))
    return result


@api_router.post("/insurance-policies", response_model=InsurancePolicyResponse)
async def create_insurance_policy(policy_data: InsurancePolicyCreate, current_user: dict = Depends(get_current_user)):
    """Create insurance policy"""
    policy_dict = policy_data.dict()
    policy_dict['user_id'] = current_user['user_id']
    policy_dict['created_at'] = datetime.utcnow()
    policy_dict['status'] = get_status(policy_data.end_date)
    
    result = await db.insurance_policies.insert_one(policy_dict)
    policy_dict['id'] = str(result.inserted_id)
    
    return InsurancePolicyResponse(**policy_dict)


@api_router.get("/insurance-policies/{policy_id}", response_model=InsurancePolicyResponse)
async def get_insurance_policy(policy_id: str, current_user: dict = Depends(get_current_user)):
    """Get specific policy"""
    policy = await db.insurance_policies.find_one({"_id": ObjectId(policy_id), "user_id": current_user['user_id']})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    policy = serialize_doc(policy)
    policy['status'] = get_status(policy['end_date'])
    return InsurancePolicyResponse(**policy)


@api_router.put("/insurance-policies/{policy_id}", response_model=InsurancePolicyResponse)
async def update_insurance_policy(policy_id: str, update_data: InsurancePolicyUpdate, current_user: dict = Depends(get_current_user)):
    """Update policy"""
    update_dict = {k: v for k, v in update_data.dict(exclude_unset=True).items() if v is not None}
    
    if update_dict:
        await db.insurance_policies.update_one(
            {"_id": ObjectId(policy_id), "user_id": current_user['user_id']},
            {"$set": update_dict}
        )
    
    policy = await db.insurance_policies.find_one({"_id": ObjectId(policy_id)})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    policy = serialize_doc(policy)
    policy['status'] = get_status(policy['end_date'])
    return InsurancePolicyResponse(**policy)


@api_router.delete("/insurance-policies/{policy_id}")
async def delete_insurance_policy(policy_id: str, current_user: dict = Depends(get_current_user)):
    """Delete policy"""
    result = await db.insurance_policies.delete_one({"_id": ObjectId(policy_id), "user_id": current_user['user_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    return {"message": "Policy deleted successfully"}


# ===== FINANCE ENDPOINTS =====

@api_router.get("/finance-products", response_model=List[FinanceProductResponse])
async def get_finance_products(current_user: dict = Depends(get_current_user)):
    """Get all finance products"""
    products = await db.finance_products.find({"user_id": current_user['user_id']}).to_list(100)
    result = []
    for p in products:
        p = serialize_doc(p)
        p['status'] = get_status(p['end_date'])
        p['outstanding_balance'] = p.get('outstanding_balance', p['loan_amount'])
        result.append(FinanceProductResponse(**p))
    return result


@api_router.post("/finance-products", response_model=FinanceProductResponse)
async def create_finance_product(product_data: FinanceProductCreate, current_user: dict = Depends(get_current_user)):
    """Create finance product"""
    product_dict = product_data.dict()
    product_dict['user_id'] = current_user['user_id']
    product_dict['created_at'] = datetime.utcnow()
    product_dict['status'] = get_status(product_data.end_date)
    product_dict['outstanding_balance'] = product_data.loan_amount
    
    result = await db.finance_products.insert_one(product_dict)
    product_dict['id'] = str(result.inserted_id)
    
    return FinanceProductResponse(**product_dict)


# ===== ROADSIDE ASSISTANCE ENDPOINTS =====

@api_router.get("/roadside-assistance", response_model=List[RoadsideAssistanceResponse])
async def get_roadside_assistance(current_user: dict = Depends(get_current_user)):
    """Get all roadside memberships"""
    memberships = await db.roadside_assistance.find({"user_id": current_user['user_id']}).to_list(100)
    result = []
    for m in memberships:
        m = serialize_doc(m)
        m['status'] = get_status(m['end_date'])
        result.append(RoadsideAssistanceResponse(**m))
    return result


@api_router.post("/roadside-assistance", response_model=RoadsideAssistanceResponse)
async def create_roadside_assistance(membership_data: RoadsideAssistanceCreate, current_user: dict = Depends(get_current_user)):
    """Create roadside membership"""
    membership_dict = membership_data.dict()
    membership_dict['user_id'] = current_user['user_id']
    membership_dict['created_at'] = datetime.utcnow()
    membership_dict['status'] = get_status(membership_data.end_date)
    
    result = await db.roadside_assistance.insert_one(membership_dict)
    membership_dict['id'] = str(result.inserted_id)
    
    return RoadsideAssistanceResponse(**membership_dict)


# ===== DEALERS ENDPOINTS =====

@api_router.get("/dealers", response_model=List[DealerResponse])
async def get_dealers(is_approved: bool = True):
    """Get all approved dealers"""
    dealers = await db.dealers.find({"is_approved": is_approved}).to_list(100)
    return [DealerResponse(**serialize_doc(d)) for d in dealers]


@api_router.get("/dealers/{dealer_id}", response_model=DealerResponse)
async def get_dealer(dealer_id: str):
    """Get specific dealer"""
    dealer = await db.dealers.find_one({"_id": ObjectId(dealer_id)})
    if not dealer:
        raise HTTPException(status_code=404, detail="Dealer not found")
    
    return DealerResponse(**serialize_doc(dealer))


# ===== PROMOTIONS ENDPOINTS =====

@api_router.get("/promotions", response_model=List[PromotionResponse])
async def get_promotions(status: str = "active"):
    """Get promotions"""
    query = {}
    if status == "active":
        query = {
            "start_date": {"$lte": datetime.utcnow()},
            "end_date": {"$gte": datetime.utcnow()}
        }
    
    promotions = await db.promotions.find(query).to_list(100)
    result = []
    for p in promotions:
        p = serialize_doc(p)
        # Determine status
        now = datetime.utcnow()
        if now < p['start_date']:
            p['status'] = "Upcoming"
        elif now > p['end_date']:
            p['status'] = "Expired"
        else:
            p['status'] = "Active"
        result.append(PromotionResponse(**p))
    return result


@api_router.get("/promotions/{promotion_id}", response_model=PromotionResponse)
async def get_promotion(promotion_id: str):
    """Get specific promotion"""
    promotion = await db.promotions.find_one({"_id": ObjectId(promotion_id)})
    if not promotion:
        raise HTTPException(status_code=404, detail="Promotion not found")
    
    promotion = serialize_doc(promotion)
    now = datetime.utcnow()
    if now < promotion['start_date']:
        promotion['status'] = "Upcoming"
    elif now > promotion['end_date']:
        promotion['status'] = "Expired"
    else:
        promotion['status'] = "Active"
    
    return PromotionResponse(**promotion)


# ===== SERVICE BOOKING ENDPOINTS =====

@api_router.get("/service-bookings", response_model=List[ServiceBookingResponse])
async def get_service_bookings(current_user: dict = Depends(get_current_user)):
    """Get all service bookings"""
    bookings = await db.service_bookings.find({"user_id": current_user['user_id']}).to_list(100)
    return [ServiceBookingResponse(**serialize_doc(b)) for b in bookings]


@api_router.post("/service-bookings", response_model=ServiceBookingResponse)
async def create_service_booking(booking_data: ServiceBookingCreate, current_user: dict = Depends(get_current_user)):
    """Create service booking"""
    booking_dict = booking_data.dict()
    booking_dict['user_id'] = current_user['user_id']
    booking_dict['created_at'] = datetime.utcnow()
    booking_dict['status'] = "Pending"
    
    result = await db.service_bookings.insert_one(booking_dict)
    booking_dict['id'] = str(result.inserted_id)
    
    return ServiceBookingResponse(**booking_dict)


# ===== PROVIDERS ENDPOINTS =====

@api_router.get("/providers", response_model=List[ProviderResponse])
async def get_providers(provider_type: Optional[str] = None):
    """Get providers"""
    query = {}
    if provider_type:
        query['provider_type'] = provider_type
    
    providers = await db.providers.find(query).to_list(100)
    return [ProviderResponse(**serialize_doc(p)) for p in providers]


# ===== MARKETPLACE ENDPOINTS =====

@api_router.get("/marketplace-listings")
async def get_marketplace_listings():
    """Get all marketplace listings"""
    try:
        # Get vehicles that are listed for sale
        vehicles = await db.vehicles.find().to_list(100)
        listings = []
        
        for v in vehicles:
            listing = {
                "id": str(v['_id']),
                "user_id": v.get('user_id', ''),
                "vehicle_id": str(v['_id']),
                "dealer_id": v.get('dealer_id'),
                "title": f"{v['make']} {v['model']} {v['year']}",
                "make": v['make'],
                "model": v['model'],
                "year": v['year'],
                "price": v.get('purchase_price', 25000),  # Default price
                "odometer": v.get('odometer'),
                "condition": "Used",
                "description": f"{v['year']} {v['make']} {v['model']} in excellent condition",
                "images": [v['image']] if v.get('image') else [],
                "contact_name": "Dealer Sales",
                "contact_phone": "1800 123 456",
                "contact_email": "sales@dealer.com",
                "listed_date": v.get('created_at', datetime.utcnow()),
                "status": "Active"
            }
            listings.append(listing)
        
        return listings
    except Exception as e:
        logger.error(f"Error fetching marketplace listings: {str(e)}")
        return []


@api_router.get("/marketplace-listings/{listing_id}")
async def get_marketplace_listing(listing_id: str):
    """Get specific marketplace listing"""
    try:
        vehicle = await db.vehicles.find_one({"_id": ObjectId(listing_id)})
        if not vehicle:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        listing = {
            "id": str(vehicle['_id']),
            "user_id": vehicle.get('user_id', ''),
            "vehicle_id": str(vehicle['_id']),
            "dealer_id": vehicle.get('dealer_id'),
            "title": f"{vehicle['make']} {vehicle['model']} {vehicle['year']}",
            "make": vehicle['make'],
            "model": vehicle['model'],
            "year": vehicle['year'],
            "price": vehicle.get('purchase_price', 25000),
            "odometer": vehicle.get('odometer'),
            "condition": "Used",
            "description": f"{vehicle['year']} {vehicle['make']} {vehicle['model']} in excellent condition. Well maintained with full service history.",
            "images": [vehicle['image']] if vehicle.get('image') else [],
            "contact_name": "Dealer Sales",
            "contact_phone": "1800 123 456",
            "contact_email": "sales@dealer.com",
            "listed_date": vehicle.get('created_at', datetime.utcnow()),
            "status": "Active",
            "features": [
                "Air Conditioning",
                "Power Windows",
                "Bluetooth",
                "Backup Camera",
                "Cruise Control"
            ]
        }
        
        return listing
    except Exception as e:
        logger.error(f"Error fetching marketplace listing: {str(e)}")
        raise HTTPException(status_code=404, detail="Listing not found")


@api_router.post("/marketplace-listings")
async def create_marketplace_listing(listing_data: dict, current_user: dict = Depends(get_current_user)):
    """Create a new marketplace listing"""
    try:
        # Verify the vehicle belongs to the user
        vehicle = await db.vehicles.find_one({
            "_id": ObjectId(listing_data['vehicle_id']),
            "user_id": current_user['user_id']
        })
        
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found or doesn't belong to you")
        
        # Create listing document
        listing = {
            "user_id": current_user['user_id'],
            "vehicle_id": listing_data['vehicle_id'],
            "title": listing_data.get('title', f"{vehicle['make']} {vehicle['model']} {vehicle['year']}"),
            "price": listing_data['price'],
            "condition": listing_data['condition'],
            "description": listing_data['description'],
            "contact_name": listing_data['contact_name'],
            "contact_phone": listing_data['contact_phone'],
            "contact_email": listing_data.get('contact_email'),
            "status": "Active",
            "listed_date": datetime.utcnow(),
            "created_at": datetime.utcnow()
        }
        
        result = await db.marketplace_listings.insert_one(listing)
        listing['id'] = str(result.inserted_id)
        
        return {"message": "Listing created successfully", "listing_id": str(result.inserted_id)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating marketplace listing: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create listing")


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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
