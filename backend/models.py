from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


# User Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PinLogin(BaseModel):
    email: str
    pin: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: str
    member_id: str
    created_at: datetime

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# Vehicle Models
class VehicleCreate(BaseModel):
    rego: str
    vin: str
    make: str
    model: str
    year: int
    body_type: Optional[str] = None
    color: Optional[str] = None
    odometer: Optional[int] = None
    image: Optional[str] = None  # base64
    purchase_date: Optional[datetime] = None
    purchase_price: Optional[float] = None
    dealer_id: Optional[str] = None

class VehicleUpdate(BaseModel):
    rego: Optional[str] = None
    vin: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    body_type: Optional[str] = None
    color: Optional[str] = None
    odometer: Optional[int] = None
    image: Optional[str] = None
    purchase_date: Optional[datetime] = None
    purchase_price: Optional[float] = None
    dealer_id: Optional[str] = None

class VehicleResponse(BaseModel):
    id: str
    user_id: str
    rego: str
    vin: str
    make: str
    model: str
    year: int
    body_type: Optional[str] = None
    color: Optional[str] = None
    odometer: Optional[int] = None
    image: Optional[str] = None
    purchase_date: Optional[datetime] = None
    purchase_price: Optional[float] = None
    dealer_id: Optional[str] = None
    created_at: datetime

class RegoScanRequest(BaseModel):
    image_base64: str


# Insurance Models
class InsurancePolicyCreate(BaseModel):
    vehicle_id: str
    policy_type: str  # CTP, Comprehensive, Third Party
    provider_id: str
    policy_number: str
    premium: float
    start_date: datetime
    end_date: datetime
    documents: Optional[List[str]] = []  # base64 documents

class InsurancePolicyUpdate(BaseModel):
    policy_type: Optional[str] = None
    provider_id: Optional[str] = None
    policy_number: Optional[str] = None
    premium: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    documents: Optional[List[str]] = None

class InsurancePolicyResponse(BaseModel):
    id: str
    user_id: str
    vehicle_id: str
    policy_type: str
    provider_id: str
    policy_number: str
    premium: float
    start_date: datetime
    end_date: datetime
    status: str  # Active, Expired
    documents: List[str]
    created_at: datetime


# Finance Models
class FinanceProductCreate(BaseModel):
    vehicle_id: str
    provider_id: str
    loan_amount: float
    interest_rate: float
    term_months: int
    monthly_payment: float
    start_date: datetime
    end_date: datetime
    documents: Optional[List[str]] = []

class FinanceProductUpdate(BaseModel):
    provider_id: Optional[str] = None
    loan_amount: Optional[float] = None
    interest_rate: Optional[float] = None
    term_months: Optional[int] = None
    monthly_payment: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    documents: Optional[List[str]] = None

class FinanceProductResponse(BaseModel):
    id: str
    user_id: str
    vehicle_id: str
    provider_id: str
    loan_amount: float
    interest_rate: float
    term_months: int
    monthly_payment: float
    start_date: datetime
    end_date: datetime
    outstanding_balance: float
    status: str  # Active, Paid Off
    documents: List[str]
    created_at: datetime


# Roadside Assistance Models
class RoadsideAssistanceCreate(BaseModel):
    vehicle_id: str
    provider_id: str
    membership_type: str
    membership_number: str
    start_date: datetime
    end_date: datetime
    emergency_contact: str
    coverage_details: Optional[str] = None
    membership_card: Optional[str] = None  # base64

class RoadsideAssistanceUpdate(BaseModel):
    provider_id: Optional[str] = None
    membership_type: Optional[str] = None
    membership_number: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    emergency_contact: Optional[str] = None
    coverage_details: Optional[str] = None
    membership_card: Optional[str] = None

class RoadsideAssistanceResponse(BaseModel):
    id: str
    user_id: str
    vehicle_id: str
    provider_id: str
    membership_type: str
    membership_number: str
    start_date: datetime
    end_date: datetime
    emergency_contact: str
    coverage_details: Optional[str] = None
    membership_card: Optional[str] = None
    status: str  # Active, Expired
    created_at: datetime


# Dealer Models
class DealerResponse(BaseModel):
    id: str
    name: str
    logo: Optional[str] = None  # base64
    address: str
    phone: str
    email: str
    website: Optional[str] = None
    dealer_type: str  # Service Center, Dealership, Both
    services_offered: List[str]
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    operating_hours: Optional[str] = None
    is_approved: bool


# Promotion Models
class PromotionResponse(BaseModel):
    id: str
    title: str
    description: str
    banner_image: Optional[str] = None  # base64
    discount_details: str
    category: str  # Finance, Insurance, Roadside, Service
    provider_id: Optional[str] = None
    start_date: datetime
    end_date: datetime
    terms: str
    redemption_link: Optional[str] = None
    status: str  # Active, Upcoming, Expired


# Service Booking Models
class ServiceBookingCreate(BaseModel):
    vehicle_id: str
    dealer_id: str
    service_type: str
    booking_date: datetime
    notes: Optional[str] = None
    issue_photos: Optional[List[str]] = []  # base64

class ServiceBookingUpdate(BaseModel):
    service_type: Optional[str] = None
    booking_date: Optional[datetime] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class ServiceBookingResponse(BaseModel):
    id: str
    user_id: str
    vehicle_id: str
    dealer_id: str
    service_type: str
    booking_date: datetime
    notes: Optional[str] = None
    issue_photos: List[str]
    status: str  # Pending, Confirmed, In Progress, Completed, Cancelled
    created_at: datetime


# Provider Models (Insurance, Finance, Roadside)
class ProviderResponse(BaseModel):
    id: str
    name: str
    logo: Optional[str] = None  # base64
    provider_type: str  # Insurance, Finance, Roadside
    contact: str
    website: Optional[str] = None
    ctp_renewal_link: Optional[str] = None
    comprehensive_renewal_link: Optional[str] = None
    third_party_renewal_link: Optional[str] = None


# Dashboard Stats
class DashboardStats(BaseModel):
    total_vehicles: int
    active_insurance_policies: int
    active_finance_products: int
    active_roadside_memberships: int
