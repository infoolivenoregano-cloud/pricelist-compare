from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date, datetime


class DistributorCreate(BaseModel):
    name: str
    color: str = "#6B7280"
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None


class DistributorOut(BaseModel):
    id: int
    name: str
    color: str
    contact_name: Optional[str]
    contact_email: Optional[str]
    created_at: datetime
    has_mapping: bool = False
    latest_upload: Optional[date] = None

    class Config:
        from_attributes = True


class ColumnMappingCreate(BaseModel):
    distributor_id: int
    header_row: int = 0
    sheet_name: Optional[str] = None
    sku_column: Optional[str] = None
    name_column: str
    pack_size_column: Optional[str] = None
    unit_column: Optional[str] = None
    price_column: str
    notes_column: Optional[str] = None


class ColumnMappingOut(BaseModel):
    id: int
    distributor_id: int
    header_row: int
    sheet_name: Optional[str]
    sku_column: Optional[str]
    name_column: str
    pack_size_column: Optional[str]
    unit_column: Optional[str]
    price_column: str
    notes_column: Optional[str]

    class Config:
        from_attributes = True


class ExcelPreview(BaseModel):
    sheets: List[str]
    columns: List[str]
    rows: List[Dict[str, Any]]
    existing_mapping: Optional[ColumnMappingOut] = None


class UploadConfirm(BaseModel):
    distributor_id: int
    week_date: date
    mapping: ColumnMappingCreate


class UploadOut(BaseModel):
    id: int
    distributor_id: int
    distributor_name: str
    distributor_color: str
    filename: str
    week_date: date
    created_at: datetime
    item_count: int

    class Config:
        from_attributes = True


class CanonicalItemCreate(BaseModel):
    name: str
    category: Optional[str] = None
    menu_price: Optional[float] = None


class CanonicalItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    menu_price: Optional[float] = None


class CanonicalItemOut(BaseModel):
    id: int
    name: str
    category: Optional[str]
    menu_price: Optional[float]
    linked_count: int = 0

    class Config:
        from_attributes = True


class LinkItemRequest(BaseModel):
    upload_item_id: int
    canonical_id: int


class UnlinkedItem(BaseModel):
    id: int
    upload_item_id: int
    name: str
    sku: Optional[str]
    pack_size: Optional[str]
    unit: Optional[str]
    price: float
    distributor_id: int
    distributor_name: str
    distributor_color: str
    week_date: date
    suggestions: List[Dict] = []


class PriceEntry(BaseModel):
    upload_item_id: int
    price: float
    pack_size: Optional[str]
    unit: Optional[str]
    prev_price: Optional[float]
    change_pct: Optional[float]
    sku: Optional[str]


class CompareItem(BaseModel):
    canonical_id: int
    canonical_name: str
    category: Optional[str]
    menu_price: Optional[float]
    prices: Dict[int, PriceEntry]
    best_distributor_id: Optional[int]


class CompareResponse(BaseModel):
    week_date: date
    distributors: List[Dict]
    items: List[CompareItem]
    available_weeks: List[date]


class OrderLineCreate(BaseModel):
    upload_item_id: int
    quantity: float = 1.0
    unit_override: Optional[str] = None
    notes: Optional[str] = None


class OrderSessionCreate(BaseModel):
    name: Optional[str] = None
    week_date: date
    notes: Optional[str] = None
    lines: List[OrderLineCreate] = []


class OrderLineOut(BaseModel):
    id: int
    upload_item_id: int
    item_name: str
    item_sku: Optional[str]
    item_pack_size: Optional[str]
    item_unit: Optional[str]
    price: float
    distributor_id: int
    distributor_name: str
    distributor_color: str
    quantity: float
    unit_override: Optional[str]
    notes: Optional[str]
    line_total: float

    class Config:
        from_attributes = True


class OrderSessionOut(BaseModel):
    id: int
    name: Optional[str]
    week_date: date
    created_at: datetime
    notes: Optional[str]
    lines: List[OrderLineOut] = []
    grand_total: float = 0

    class Config:
        from_attributes = True
