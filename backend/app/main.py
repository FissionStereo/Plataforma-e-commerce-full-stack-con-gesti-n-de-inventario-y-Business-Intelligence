from __future__ import annotations

import csv
import io
import os
import random
from collections import defaultdict
from contextlib import asynccontextmanager
from datetime import datetime
from decimal import Decimal

from fastapi import Depends, FastAPI, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from .auth import (
    create_access_token,
    create_customer_token,
    hash_password,
    require_admin,
    require_customer,
    verify_password,
)
from .database import Base, SessionLocal, engine, get_db
from .models import (
    AdminUser,
    Category,
    Customer,
    CustomerAccount,
    CustomerOrderLink,
    InventoryMovement,
    Order,
    OrderItem,
    Product,
    StoreSettings,
)
from .schemas import (
    CustomerLogin,
    CustomerProfileUpdate,
    CustomerRegister,
    InventoryAdjustment,
    LoginRequest,
    OrderCreate,
    OrderStatusUpdate,
    ProductCreate,
    ProductUpdate,
    StoreSettingsUpdate,
)
from .seed import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db)
    yield


app = FastAPI(
    title="NovaMarket API",
    version="1.0.0",
    description="API de e-commerce, inventario y Business Intelligence.",
    lifespan=lifespan,
)

cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def money(value: Decimal | float | int | None) -> float | None:
    return None if value is None else round(float(value), 2)


def product_dict(product: Product) -> dict:
    discount = 0
    if product.original_price and product.original_price > product.price:
        discount = round((1 - float(product.price / product.original_price)) * 100)
    return {
        "id": product.id,
        "sku": product.sku,
        "slug": product.slug,
        "name": product.name,
        "short_description": product.short_description,
        "description": product.description,
        "brand": product.brand,
        "price": money(product.price),
        "original_price": money(product.original_price),
        "cost": money(product.cost),
        "stock": product.stock,
        "min_stock": product.min_stock,
        "rating": float(product.rating),
        "reviews": product.reviews,
        "featured": product.featured,
        "active": product.active,
        "image": product.image,
        "discount": discount,
        "category": {
            "id": product.category.id,
            "name": product.category.name,
            "slug": product.category.slug,
            "accent": product.category.accent,
        },
    }


def order_dict(order: Order) -> dict:
    return {
        "id": order.id,
        "number": order.number,
        "status": order.status,
        "payment_method": order.payment_method,
        "subtotal": money(order.subtotal),
        "shipping": money(order.shipping),
        "total": money(order.total),
        "created_at": order.created_at.isoformat(),
        "customer": {
            "name": order.customer.name,
            "email": order.customer.email,
            "district": order.customer.district,
        },
        "items": [
            {
                "product_id": item.product_id,
                "name": item.product_name,
                "price": money(item.unit_price),
                "quantity": item.quantity,
                "subtotal": money(item.subtotal),
            }
            for item in order.items
        ],
    }


def customer_account_dict(account: CustomerAccount) -> dict:
    return {
        "id": account.id,
        "name": account.name,
        "email": account.email,
        "phone": account.phone,
        "address": account.address,
        "district": account.district,
        "created_at": account.created_at.isoformat(),
    }


def settings_dict(settings: StoreSettings) -> dict:
    return {
        "store_name": settings.store_name,
        "legal_name": settings.legal_name,
        "support_email": settings.support_email,
        "phone": settings.phone,
        "currency": settings.currency,
        "free_shipping_min": money(settings.free_shipping_min),
        "low_stock_notifications": settings.low_stock_notifications,
        "order_notifications": settings.order_notifications,
        "promotional_emails": settings.promotional_emails,
        "maintenance_mode": settings.maintenance_mode,
        "updated_at": settings.updated_at.isoformat(),
    }


@app.get("/api/health", tags=["system"])
def health() -> dict:
    return {"status": "ok", "service": "NovaMarket API", "time": datetime.now().isoformat()}


@app.get("/api/categories", tags=["store"])
def categories(db: Session = Depends(get_db)) -> list[dict]:
    rows = db.scalars(select(Category).order_by(Category.id)).all()
    return [
        {
            "id": category.id,
            "name": category.name,
            "slug": category.slug,
            "icon": category.icon,
            "accent": category.accent,
            "product_count": sum(1 for product in category.products if product.active),
        }
        for category in rows
    ]


@app.get("/api/products", tags=["store"])
def products(
    q: str | None = None,
    category: str | None = None,
    featured: bool | None = None,
    sort: str = Query(default="featured", pattern="^(featured|price_asc|price_desc|rating|newest)$"),
    db: Session = Depends(get_db),
) -> list[dict]:
    statement = select(Product).options(joinedload(Product.category)).where(Product.active.is_(True))
    if q:
        term = f"%{q.strip()}%"
        statement = statement.where(or_(Product.name.ilike(term), Product.brand.ilike(term), Product.description.ilike(term)))
    if category:
        statement = statement.join(Product.category).where(Category.slug == category)
    if featured is not None:
        statement = statement.where(Product.featured.is_(featured))
    order_map = {
        "featured": (Product.featured.desc(), Product.id.asc()),
        "price_asc": (Product.price.asc(),),
        "price_desc": (Product.price.desc(),),
        "rating": (Product.rating.desc(), Product.reviews.desc()),
        "newest": (Product.created_at.desc(),),
    }
    statement = statement.order_by(*order_map[sort])
    return [product_dict(product) for product in db.scalars(statement).unique().all()]


@app.get("/api/products/{slug}", tags=["store"])
def product_detail(slug: str, db: Session = Depends(get_db)) -> dict:
    product = db.scalar(
        select(Product).options(joinedload(Product.category)).where(Product.slug == slug, Product.active.is_(True))
    )
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product_dict(product)


@app.post("/api/orders", tags=["checkout"], status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)) -> dict:
    settings = db.get(StoreSettings, 1)
    if settings and settings.maintenance_mode:
        raise HTTPException(status_code=503, detail="La tienda está en mantenimiento. Intenta nuevamente en unos minutos")
    requested_ids = {item.product_id for item in payload.items}
    products_by_id = {
        product.id: product
        for product in db.scalars(
            select(Product).options(joinedload(Product.category)).where(Product.id.in_(requested_ids), Product.active.is_(True))
        ).all()
    }
    if len(products_by_id) != len(requested_ids):
        raise HTTPException(status_code=400, detail="Uno o más productos ya no están disponibles")

    subtotal = Decimal("0")
    for item in payload.items:
        product = products_by_id[item.product_id]
        if product.stock < item.quantity:
            raise HTTPException(status_code=409, detail=f"Stock insuficiente para {product.name}")
        subtotal += product.price * item.quantity

    free_shipping_min = settings.free_shipping_min if settings else Decimal("149")
    shipping = Decimal("0") if subtotal >= free_shipping_min else Decimal("14.90")
    customer = Customer(**payload.customer.model_dump())
    order = Order(
        number=f"NM-{datetime.now().strftime('%y%m%d')}-{random.randint(1000, 9999)}",
        customer=customer,
        status="confirmed",
        payment_method=payload.payment_method,
        subtotal=subtotal,
        shipping=shipping,
        total=subtotal + shipping,
    )
    db.add(order)
    db.flush()

    account = db.scalar(
        select(CustomerAccount).where(func.lower(CustomerAccount.email) == payload.customer.email.lower())
    )
    if account:
        db.add(CustomerOrderLink(account_id=account.id, order_id=order.id))

    for item in payload.items:
        product = products_by_id[item.product_id]
        previous = product.stock
        product.stock -= item.quantity
        db.add(OrderItem(
            order=order,
            product_id=product.id,
            product_name=product.name,
            unit_price=product.price,
            quantity=item.quantity,
            subtotal=product.price * item.quantity,
        ))
        db.add(InventoryMovement(
            product=product,
            movement_type="sale",
            quantity=-item.quantity,
            previous_stock=previous,
            new_stock=product.stock,
            note=f"Venta {order.number}",
        ))
    db.commit()

    saved = db.scalar(
        select(Order)
        .options(joinedload(Order.customer), joinedload(Order.items))
        .where(Order.id == order.id)
    )
    return order_dict(saved)


@app.get("/api/orders/{number}", tags=["checkout"])
def track_order(number: str, email: str, db: Session = Depends(get_db)) -> dict:
    order = db.scalar(
        select(Order)
        .options(joinedload(Order.customer), joinedload(Order.items))
        .join(Order.customer)
        .where(Order.number == number, func.lower(Customer.email) == email.lower())
    )
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return order_dict(order)


@app.post("/api/auth/login", tags=["admin"])
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> dict:
    user = db.scalar(select(AdminUser).where(func.lower(AdminUser.email) == payload.email.lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
    return {
        "access_token": create_access_token(user),
        "token_type": "bearer",
        "user": {"name": user.name, "email": user.email, "role": user.role},
    }


@app.post("/api/customer/register", tags=["customer"], status_code=201)
def register_customer(payload: CustomerRegister, db: Session = Depends(get_db)) -> dict:
    existing = db.scalar(
        select(CustomerAccount).where(func.lower(CustomerAccount.email) == payload.email.lower())
    )
    if existing:
        raise HTTPException(status_code=409, detail="Ya existe una cuenta con ese correo")
    account = CustomerAccount(
        name=payload.name,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        phone=payload.phone,
        address=payload.address,
        district=payload.district,
    )
    db.add(account)
    db.flush()

    previous_orders = db.scalars(
        select(Order).join(Order.customer).where(func.lower(Customer.email) == payload.email.lower())
    ).all()
    for order in previous_orders:
        db.add(CustomerOrderLink(account_id=account.id, order_id=order.id))
    db.commit()
    db.refresh(account)
    return {
        "access_token": create_customer_token(account),
        "token_type": "bearer",
        "user": customer_account_dict(account),
    }


@app.post("/api/customer/login", tags=["customer"])
def login_customer(payload: CustomerLogin, db: Session = Depends(get_db)) -> dict:
    account = db.scalar(
        select(CustomerAccount).where(func.lower(CustomerAccount.email) == payload.email.lower())
    )
    if not account or not verify_password(payload.password, account.password_hash):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
    if not account.active:
        raise HTTPException(status_code=403, detail="Esta cuenta se encuentra desactivada")
    return {
        "access_token": create_customer_token(account),
        "token_type": "bearer",
        "user": customer_account_dict(account),
    }


@app.get("/api/customer/me", tags=["customer"])
def customer_profile(account: CustomerAccount = Depends(require_customer)) -> dict:
    return customer_account_dict(account)


@app.patch("/api/customer/me", tags=["customer"])
def update_customer_profile(
    payload: CustomerProfileUpdate,
    account: CustomerAccount = Depends(require_customer),
    db: Session = Depends(get_db),
) -> dict:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(account, field, value)
    db.commit()
    db.refresh(account)
    return customer_account_dict(account)


@app.get("/api/customer/orders", tags=["customer"])
def customer_order_history(
    account: CustomerAccount = Depends(require_customer),
    db: Session = Depends(get_db),
) -> list[dict]:
    rows = db.scalars(
        select(Order)
        .options(joinedload(Order.customer), joinedload(Order.items))
        .join(CustomerOrderLink, CustomerOrderLink.order_id == Order.id)
        .where(CustomerOrderLink.account_id == account.id)
        .order_by(Order.created_at.desc())
    ).unique().all()
    return [order_dict(order) for order in rows]


def month_slots(count: int = 6) -> list[tuple[int, int, str]]:
    names = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    now = datetime.now()
    slots = []
    for offset in range(count - 1, -1, -1):
        absolute = now.year * 12 + (now.month - 1) - offset
        year, month_zero = divmod(absolute, 12)
        slots.append((year, month_zero + 1, f"{names[month_zero]} {str(year)[2:]}"))
    return slots


@app.get("/api/admin/dashboard", tags=["admin"])
def dashboard(_: AdminUser = Depends(require_admin), db: Session = Depends(get_db)) -> dict:
    orders = db.scalars(
        select(Order)
        .options(joinedload(Order.customer), joinedload(Order.items))
        .order_by(Order.created_at.desc())
    ).unique().all()
    products = db.scalars(select(Product).options(joinedload(Product.category))).unique().all()
    product_map = {product.id: product for product in products}
    valid_orders = [order for order in orders if order.status != "cancelled"]

    revenue = sum((order.total for order in valid_orders), Decimal("0"))
    average_ticket = revenue / len(valid_orders) if valid_orders else Decimal("0")
    gross_profit = Decimal("0")
    units = 0
    category_totals: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    product_totals: dict[int, dict] = defaultdict(lambda: {"units": 0, "sales": Decimal("0")})
    for order in valid_orders:
        for item in order.items:
            product = product_map.get(item.product_id)
            if not product:
                continue
            units += item.quantity
            gross_profit += (item.unit_price - product.cost) * item.quantity
            category_totals[product.category.name] += item.subtotal
            product_totals[product.id]["units"] += item.quantity
            product_totals[product.id]["sales"] += item.subtotal

    sales_by_month = []
    for year, month, label in month_slots():
        month_orders = [order for order in valid_orders if order.created_at.year == year and order.created_at.month == month]
        sales_by_month.append({
            "month": label,
            "sales": money(sum((order.total for order in month_orders), Decimal("0"))),
            "orders": len(month_orders),
        })

    current = sales_by_month[-1]["sales"] or 0
    previous = sales_by_month[-2]["sales"] or 0
    growth = round(((current - previous) / previous) * 100, 1) if previous else 100.0
    low_stock = [product for product in products if product.active and product.stock <= product.min_stock]
    top_rows = sorted(product_totals.items(), key=lambda pair: pair[1]["sales"], reverse=True)[:5]

    return {
        "metrics": {
            "revenue": money(revenue),
            "orders": len(valid_orders),
            "average_ticket": money(average_ticket),
            "gross_profit": money(gross_profit),
            "growth": growth,
            "units": units,
            "stock_value": money(sum((product.cost * product.stock for product in products), Decimal("0"))),
            "low_stock_count": len(low_stock),
        },
        "sales_by_month": sales_by_month,
        "category_sales": [
            {"name": name, "value": money(total)}
            for name, total in sorted(category_totals.items(), key=lambda pair: pair[1], reverse=True)
        ],
        "top_products": [
            {
                "id": product_id,
                "name": product_map[product_id].name,
                "image": product_map[product_id].image,
                "units": values["units"],
                "sales": money(values["sales"]),
            }
            for product_id, values in top_rows
        ],
        "low_stock": [product_dict(product) for product in sorted(low_stock, key=lambda item: item.stock)],
        "recent_orders": [order_dict(order) for order in orders[:6]],
    }


@app.get("/api/admin/products", tags=["admin"])
def admin_products(_: AdminUser = Depends(require_admin), db: Session = Depends(get_db)) -> list[dict]:
    rows = db.scalars(
        select(Product).options(joinedload(Product.category)).order_by(Product.stock.asc(), Product.name.asc())
    ).unique().all()
    return [product_dict(product) for product in rows]


@app.post("/api/admin/products", tags=["admin"], status_code=201)
def add_product(payload: ProductCreate, _: AdminUser = Depends(require_admin), db: Session = Depends(get_db)) -> dict:
    category = db.get(Category, payload.category_id)
    if not category:
        raise HTTPException(status_code=400, detail="Categoría inválida")
    if db.scalar(select(Product.id).where(or_(Product.sku == payload.sku, Product.slug == payload.slug))):
        raise HTTPException(status_code=409, detail="El SKU o slug ya existe")
    data = payload.model_dump()
    product = Product(**data)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product_dict(product)


@app.patch("/api/admin/products/{product_id}", tags=["admin"])
def update_product(
    product_id: int,
    payload: ProductUpdate,
    _: AdminUser = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    product = db.scalar(select(Product).options(joinedload(Product.category)).where(Product.id == product_id))
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product_dict(product)


@app.post("/api/admin/inventory/adjust", tags=["admin"])
def adjust_inventory(
    payload: InventoryAdjustment,
    _: AdminUser = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    product = db.scalar(select(Product).options(joinedload(Product.category)).where(Product.id == payload.product_id))
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if product.stock + payload.quantity < 0:
        raise HTTPException(status_code=409, detail="El ajuste dejaría el stock en negativo")
    previous = product.stock
    product.stock += payload.quantity
    db.add(InventoryMovement(
        product=product,
        movement_type="adjustment",
        quantity=payload.quantity,
        previous_stock=previous,
        new_stock=product.stock,
        note=payload.note,
    ))
    db.commit()
    db.refresh(product)
    return product_dict(product)


@app.get("/api/admin/orders", tags=["admin"])
def admin_orders(_: AdminUser = Depends(require_admin), db: Session = Depends(get_db)) -> list[dict]:
    rows = db.scalars(
        select(Order)
        .options(joinedload(Order.customer), joinedload(Order.items))
        .order_by(Order.created_at.desc())
    ).unique().all()
    return [order_dict(order) for order in rows]


@app.patch("/api/admin/orders/{order_id}/status", tags=["admin"])
def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    _: AdminUser = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    order = db.scalar(
        select(Order).options(joinedload(Order.customer), joinedload(Order.items)).where(Order.id == order_id)
    )
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    order.status = payload.status
    db.commit()
    db.refresh(order)
    return order_dict(order)


@app.get("/api/admin/customers", tags=["admin"])
def admin_customers(_: AdminUser = Depends(require_admin), db: Session = Depends(get_db)) -> list[dict]:
    orders = db.scalars(
        select(Order).options(joinedload(Order.customer)).order_by(Order.created_at.desc())
    ).unique().all()
    accounts = db.scalars(select(CustomerAccount)).all()
    account_map = {account.email.lower(): account for account in accounts}
    grouped: dict[str, dict] = {}
    for order in orders:
        email = order.customer.email.lower()
        row = grouped.setdefault(email, {
            "name": order.customer.name,
            "email": email,
            "phone": order.customer.phone,
            "district": order.customer.district,
            "orders": 0,
            "total_spent": Decimal("0"),
            "last_order": order.created_at,
        })
        row["orders"] += 1
        if order.status != "cancelled":
            row["total_spent"] += order.total
        if order.created_at > row["last_order"]:
            row["last_order"] = order.created_at

    for email, account in account_map.items():
        grouped.setdefault(email, {
            "name": account.name,
            "email": email,
            "phone": account.phone,
            "district": account.district,
            "orders": 0,
            "total_spent": Decimal("0"),
            "last_order": account.created_at,
        })

    return [
        {
            **{key: value for key, value in row.items() if key not in {"total_spent", "last_order"}},
            "total_spent": money(row["total_spent"]),
            "last_order": row["last_order"].isoformat(),
            "registered": email in account_map,
            "segment": "VIP" if row["total_spent"] >= Decimal("4000") else "Frecuente" if row["orders"] >= 2 else "Nuevo",
        }
        for email, row in sorted(grouped.items(), key=lambda pair: pair[1]["total_spent"], reverse=True)
    ]


@app.get("/api/admin/settings", tags=["admin"])
def get_store_settings(_: AdminUser = Depends(require_admin), db: Session = Depends(get_db)) -> dict:
    settings = db.get(StoreSettings, 1)
    if not settings:
        settings = StoreSettings(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings_dict(settings)


@app.put("/api/admin/settings", tags=["admin"])
def update_store_settings(
    payload: StoreSettingsUpdate,
    _: AdminUser = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    settings = db.get(StoreSettings, 1) or StoreSettings(id=1)
    for field, value in payload.model_dump().items():
        setattr(settings, field, value)
    settings.updated_at = datetime.now()
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings_dict(settings)


@app.get("/api/admin/bi/export", tags=["admin"])
def export_sales(_: AdminUser = Depends(require_admin), db: Session = Depends(get_db)) -> Response:
    orders = db.scalars(
        select(Order)
        .options(joinedload(Order.customer), joinedload(Order.items))
        .order_by(Order.created_at.desc())
    ).unique().all()
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["pedido", "fecha", "estado", "cliente", "distrito", "producto", "cantidad", "precio_unitario", "subtotal"])
    for order in orders:
        for item in order.items:
            writer.writerow([
                order.number,
                order.created_at.date().isoformat(),
                order.status,
                order.customer.name,
                order.customer.district,
                item.product_name,
                item.quantity,
                money(item.unit_price),
                money(item.subtotal),
            ])
    buffer.seek(0)
    headers = {"Content-Disposition": 'attachment; filename="novamarket_ventas.csv"'}
    return StreamingResponse(iter([buffer.getvalue()]), media_type="text/csv; charset=utf-8", headers=headers)
