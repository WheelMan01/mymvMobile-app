from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MarketplaceListingCreate(BaseModel):
    vehicle_id: str
    title: str
    price: float
    condition: str  # New, Used
    description: str
    contact_name: str
    contact_phone: str
    contact_email: Optional[str] = None

class MarketplaceListingResponse(BaseModel):
    id: str
    user_id: str
    vehicle_id: str
    dealer_id: Optional[str] = None
    title: str
    make: str
    model: str
    year: int
    price: float
    odometer: Optional[int] = None
    condition: str
    description: str
    images: List[str]
    contact_name: str
    contact_phone: str
    contact_email: Optional[str] = None
    listed_date: datetime
    status: str  # Active, Sold
