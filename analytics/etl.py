"""Construye un pequeño modelo estrella para Power BI desde la base transaccional."""

from pathlib import Path
import sys

import pandas as pd
from sqlalchemy import text


ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
OUTPUT = Path(__file__).resolve().parent / "output"
sys.path.insert(0, str(BACKEND))

from app.database import engine  # noqa: E402


def extract() -> dict[str, pd.DataFrame]:
    queries = {
        "products": """
            SELECT p.id, p.sku, p.name, p.brand, p.price, p.cost, p.stock,
                   p.min_stock, p.active, c.name AS category
            FROM products p JOIN categories c ON c.id = p.category_id
        """,
        "customers": "SELECT id, name, email, district, created_at FROM customers",
        "orders": "SELECT id, number, customer_id, status, payment_method, shipping, total, created_at FROM orders",
        "items": "SELECT order_id, product_id, quantity, unit_price, subtotal FROM order_items",
    }
    with engine.connect() as connection:
        return {name: pd.read_sql(text(query), connection) for name, query in queries.items()}


def transform(tables: dict[str, pd.DataFrame]) -> dict[str, pd.DataFrame]:
    products = tables["products"]
    customers = tables["customers"]
    orders = tables["orders"]
    items = tables["items"]

    orders["created_at"] = pd.to_datetime(orders["created_at"])
    customers["created_at"] = pd.to_datetime(customers["created_at"])
    fact = items.merge(orders, left_on="order_id", right_on="id", suffixes=("", "_order"))
    fact = fact.merge(products[["id", "cost"]], left_on="product_id", right_on="id", suffixes=("", "_product"))
    fact["date_key"] = fact["created_at"].dt.strftime("%Y%m%d").astype(int)
    fact["total_cost"] = fact["cost"] * fact["quantity"]
    fact["gross_profit"] = fact["subtotal"] - fact["total_cost"]
    fact = fact[[
        "order_id", "number", "date_key", "customer_id", "product_id", "status",
        "payment_method", "quantity", "unit_price", "subtotal", "total_cost", "gross_profit",
    ]]

    start = orders["created_at"].min().normalize()
    end = max(pd.Timestamp.today().normalize(), orders["created_at"].max().normalize())
    dates = pd.DataFrame({"date": pd.date_range(start, end)})
    dates["date_key"] = dates["date"].dt.strftime("%Y%m%d").astype(int)
    dates["year"] = dates["date"].dt.year
    dates["month_number"] = dates["date"].dt.month
    month_names = {1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril", 5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto", 9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre"}
    dates["month"] = dates["date"].dt.month.map(month_names)
    dates["year_month"] = dates["date"].dt.strftime("%Y-%m")
    dates["quarter"] = "T" + dates["date"].dt.quarter.astype(str)

    inventory = products[["id", "sku", "name", "category", "stock", "min_stock", "cost"]].copy()
    inventory["stock_value"] = inventory["stock"] * inventory["cost"]
    inventory["status"] = inventory.apply(lambda row: "Stock bajo" if row.stock <= row.min_stock else "Disponible", axis=1)

    return {
        "fact_sales": fact,
        "dim_product": products.rename(columns={"id": "product_id"}),
        "dim_customer": customers.rename(columns={"id": "customer_id"}),
        "dim_date": dates,
        "inventory_snapshot": inventory,
    }


def load(model: dict[str, pd.DataFrame]) -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, dataframe in model.items():
        dataframe.to_csv(OUTPUT / f"{name}.csv", index=False, encoding="utf-8-sig")
        print(f"[OK] {name}: {len(dataframe)} filas")


if __name__ == "__main__":
    load(transform(extract()))
    print(f"Modelo BI exportado en: {OUTPUT}")

