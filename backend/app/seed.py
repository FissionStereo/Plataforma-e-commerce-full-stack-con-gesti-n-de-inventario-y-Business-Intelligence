from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from .auth import hash_password
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


CATEGORIES = [
    ("Tecnología", "tecnologia", "laptop", "#6c5ce7"),
    ("Hogar", "hogar", "sofa", "#ff8b66"),
    ("Moda", "moda", "shirt", "#ea4c89"),
    ("Deportes", "deportes", "dumbbell", "#18a999"),
    ("Belleza", "belleza", "sparkles", "#f3a712"),
]


PRODUCTS = [
    ("TEC-001", "laptop-orion-14-pro", "Laptop Orion 14 Pro", "Potencia ligera para crear sin límites.", "Pantalla 2.8K, 16 GB RAM, SSD de 1 TB y hasta 14 horas de batería.", "Orion", 3299, 3799, 2640, 12, 5, 4.9, 128, True, "laptop", "tecnologia"),
    ("TEC-002", "audifonos-pulse-max", "Audífonos Pulse Max", "Silencio premium. Sonido que envuelve.", "Cancelación activa de ruido, audio espacial y 38 horas de autonomía.", "Pulse", 349, 449, 235, 18, 6, 4.8, 284, True, "headphones", "tecnologia"),
    ("TEC-003", "smart-tv-vision-55", 'Smart TV Vision 55"', "Cine en casa con color cinematográfico.", "Panel 4K QLED, Dolby Vision, modo gaming y control por voz.", "Vision", 2299, 2799, 1780, 7, 4, 4.7, 96, True, "tv", "tecnologia"),
    ("TEC-004", "smartphone-aura-x", "Smartphone Aura X", "Fotografía nocturna y energía para todo el día.", "Cámara de 108 MP, pantalla AMOLED 120 Hz y carga ultrarrápida.", "Aura", 1899, 2199, 1420, 14, 5, 4.6, 172, False, "phone", "tecnologia"),
    ("HOG-001", "sofa-lino-cloud", "Sofá Lino Cloud", "Diseño sereno para vivir más cómodo.", "Tres cuerpos, tapiz antimanchas y estructura de madera certificada.", "Noma", 2399, 2899, 1550, 5, 4, 4.8, 43, True, "sofa", "hogar"),
    ("HOG-002", "lampara-nordica", "Lámpara Nórdica", "Luz cálida con presencia escultórica.", "Acabado mate, intensidad regulable y bombilla LED incluida.", "Noma", 219, 279, 118, 24, 8, 4.7, 71, False, "lamp", "hogar"),
    ("HOG-003", "cafetera-studio", "Cafetera Studio", "Tu ritual de café, afinado al detalle.", "15 bares de presión, vaporizador y doble salida para espresso.", "Mokka", 699, 849, 475, 3, 5, 4.5, 88, True, "coffee", "hogar"),
    ("HOG-004", "robot-clean-one", "Robot aspirador Clean One", "Un hogar limpio aunque tú no estés.", "Mapeo láser, control desde app y autonomía de 150 minutos.", "Cleanly", 1199, 1499, 790, 9, 4, 4.6, 110, False, "robot", "hogar"),
    ("MOD-001", "zapatillas-urban-flex", "Zapatillas Urban Flex", "Comodidad ligera para moverte todo el día.", "Tejido respirable, plantilla Memory Foam y suela de alto agarre.", "Atempo", 289, 349, 145, 21, 7, 4.8, 219, True, "shoes", "moda"),
    ("MOD-002", "mochila-terra", "Mochila Terra", "Organización inteligente para cada trayecto.", "Compartimento para laptop de 16 pulgadas y tejido repelente al agua.", "Atempo", 179, 229, 84, 30, 8, 4.7, 156, False, "backpack", "moda"),
    ("DEP-001", "smartwatch-active-go", "Smartwatch Active Go", "Tus métricas, tu ritmo, tu mejor versión.", "GPS, 100 modos deportivos, llamadas y resistencia al agua 5 ATM.", "Pulse", 499, 599, 310, 16, 6, 4.6, 132, True, "watch", "deportes"),
    ("BEL-001", "set-glow-routine", "Set Glow Routine", "Tres pasos para una piel luminosa.", "Limpiador suave, sérum de vitamina C y crema con ácido hialurónico.", "Luma", 159, 199, 72, 26, 8, 4.9, 301, False, "beauty", "belleza"),
]


def ensure_accounts_and_settings(db: Session) -> None:
    account = db.scalar(select(CustomerAccount).where(CustomerAccount.email == "ana@example.com"))
    if not account:
        account = CustomerAccount(
            name="Ana Torres",
            email="ana@example.com",
            password_hash=hash_password("Cliente2026!"),
            phone="987654321",
            address="Av. Demo 123",
            district="Miraflores",
        )
        db.add(account)
        db.flush()

    if not db.get(StoreSettings, 1):
        db.add(StoreSettings(id=1))
        db.flush()

    linked_ids = set(db.scalars(select(CustomerOrderLink.order_id).where(CustomerOrderLink.account_id == account.id)).all())
    matching_orders = db.scalars(
        select(Order).join(Order.customer).where(Customer.email == account.email)
    ).all()
    for order in matching_orders:
        if order.id not in linked_ids:
            db.add(CustomerOrderLink(account_id=account.id, order_id=order.id))


def seed_database(db: Session) -> None:
    if db.scalar(select(Category.id).limit(1)):
        existing_admin = db.scalar(select(AdminUser).where(AdminUser.email == "admin@novamarket.pe"))
        if existing_admin and existing_admin.name != "Fernando Nova":
            existing_admin.name = "Fernando Nova"
        ensure_accounts_and_settings(db)
        db.commit()
        return

    categories = {}
    for name, slug, icon, accent in CATEGORIES:
        category = Category(name=name, slug=slug, icon=icon, accent=accent)
        db.add(category)
        categories[slug] = category
    db.flush()

    products = []
    for row in PRODUCTS:
        sku, slug, name, short, description, brand, price, original, cost, stock, minimum, rating, reviews, featured, image, category_slug = row
        product = Product(
            sku=sku, slug=slug, name=name, short_description=short, description=description,
            brand=brand, price=Decimal(str(price)), original_price=Decimal(str(original)),
            cost=Decimal(str(cost)), stock=stock, min_stock=minimum,
            rating=Decimal(str(rating)), reviews=reviews, featured=featured,
            image=image, category=categories[category_slug],
        )
        db.add(product)
        products.append(product)
    db.flush()

    admin = AdminUser(
        name="Fernando Nova",
        email="admin@novamarket.pe",
        password_hash=hash_password("Nova2026!"),
        role="admin",
    )
    db.add(admin)

    customer_names = [
        ("Ana Torres", "ana@example.com", "Miraflores"),
        ("Diego Rojas", "diego@example.com", "San Miguel"),
        ("Camila Flores", "camila@example.com", "Surco"),
        ("Luis Mendoza", "luis@example.com", "Lince"),
        ("Valeria Cruz", "valeria@example.com", "Barranco"),
    ]
    customers = []
    for name, email, district in customer_names:
        customer = Customer(name=name, email=email, phone="987654321", address="Av. Demo 123", district=district)
        db.add(customer)
        customers.append(customer)
    db.flush()

    order_specs = [
        (154, 0, "delivered", "card", [(0, 1), (1, 1)]),
        (137, 1, "delivered", "yape", [(8, 2), (9, 1)]),
        (119, 2, "delivered", "card", [(2, 1)]),
        (98, 3, "delivered", "card", [(4, 1), (5, 2)]),
        (82, 4, "delivered", "cash", [(6, 1), (11, 2)]),
        (67, 0, "delivered", "card", [(3, 1), (10, 1)]),
        (51, 1, "delivered", "yape", [(7, 1), (1, 2)]),
        (36, 2, "delivered", "card", [(0, 1), (9, 2)]),
        (22, 3, "shipped", "card", [(2, 1), (8, 1)]),
        (12, 4, "preparing", "yape", [(4, 1), (11, 1)]),
        (5, 0, "confirmed", "card", [(10, 1), (5, 1)]),
        (1, 1, "confirmed", "card", [(1, 1), (6, 1)]),
    ]

    now = datetime.now()
    for index, (days_ago, customer_index, status, payment, items) in enumerate(order_specs, start=1):
        created_at = now - timedelta(days=days_ago)
        subtotal = sum(products[p].price * qty for p, qty in items)
        shipping = Decimal("0") if subtotal >= 149 else Decimal("14.90")
        order = Order(
            number=f"NM-{created_at.strftime('%y%m')}-{1000 + index}",
            customer=customers[customer_index], status=status, payment_method=payment,
            subtotal=subtotal, shipping=shipping, total=subtotal + shipping, created_at=created_at,
        )
        db.add(order)
        db.flush()
        for product_index, quantity in items:
            product = products[product_index]
            db.add(OrderItem(
                order=order, product_id=product.id, product_name=product.name,
                unit_price=product.price, quantity=quantity, subtotal=product.price * quantity,
            ))

    for product in products:
        db.add(InventoryMovement(
            product=product, movement_type="initial", quantity=product.stock,
            previous_stock=0, new_stock=product.stock, note="Inventario inicial de demostración",
            created_at=now - timedelta(days=180),
        ))

    db.flush()
    ensure_accounts_and_settings(db)
    db.commit()
