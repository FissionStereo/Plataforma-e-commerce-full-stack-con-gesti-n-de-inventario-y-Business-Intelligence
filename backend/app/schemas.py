from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class CustomerRegister(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone: str = Field(min_length=7, max_length=30)
    address: str = Field(default="", max_length=220)
    district: str = Field(default="", max_length=100)


class CustomerLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class CustomerProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=3, max_length=120)
    phone: str | None = Field(default=None, min_length=7, max_length=30)
    address: str | None = Field(default=None, max_length=220)
    district: str | None = Field(default=None, max_length=100)


class CustomerInput(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=30)
    address: str = Field(min_length=5, max_length=220)
    district: str = Field(min_length=2, max_length=100)


class OrderItemInput(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=20)


class OrderCreate(BaseModel):
    customer: CustomerInput
    items: list[OrderItemInput] = Field(min_length=1)
    payment_method: Literal["card", "yape", "cash"] = "card"


class InventoryAdjustment(BaseModel):
    product_id: int
    quantity: int = Field(ge=-999, le=999)
    note: str = Field(min_length=3, max_length=220)


class ProductCreate(BaseModel):
    sku: str = Field(min_length=3, max_length=30)
    slug: str = Field(min_length=3, max_length=140)
    name: str = Field(min_length=3, max_length=140)
    short_description: str = Field(min_length=8, max_length=220)
    description: str = Field(min_length=8)
    brand: str = Field(min_length=2, max_length=80)
    price: float = Field(gt=0)
    original_price: float | None = Field(default=None, gt=0)
    cost: float = Field(gt=0)
    stock: int = Field(ge=0)
    min_stock: int = Field(default=5, ge=0)
    category_id: int
    image: str = "package"
    featured: bool = False


class ProductUpdate(BaseModel):
    price: float | None = Field(default=None, gt=0)
    original_price: float | None = Field(default=None, gt=0)
    stock: int | None = Field(default=None, ge=0)
    min_stock: int | None = Field(default=None, ge=0)
    active: bool | None = None
    featured: bool | None = None


class OrderStatusUpdate(BaseModel):
    status: Literal["confirmed", "preparing", "shipped", "delivered", "cancelled"]


class StoreSettingsUpdate(BaseModel):
    store_name: str = Field(min_length=3, max_length=120)
    legal_name: str = Field(min_length=3, max_length=160)
    support_email: EmailStr
    phone: str = Field(min_length=7, max_length=30)
    currency: Literal["PEN", "USD"] = "PEN"
    free_shipping_min: float = Field(ge=0, le=10000)
    low_stock_notifications: bool = True
    order_notifications: bool = True
    promotional_emails: bool = False
    maintenance_mode: bool = False
