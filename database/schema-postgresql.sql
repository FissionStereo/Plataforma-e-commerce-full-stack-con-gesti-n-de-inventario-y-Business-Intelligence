-- NovaMarket - estructuras analíticas complementarias para PostgreSQL
-- Las tablas transaccionales se crean mediante SQLAlchemy al iniciar la API.

CREATE INDEX IF NOT EXISTS ix_products_category_active
    ON products (category_id, active);

CREATE INDEX IF NOT EXISTS ix_orders_status_created_at
    ON orders (status, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_inventory_movements_product_created
    ON inventory_movements (product_id, created_at DESC);

CREATE OR REPLACE VIEW vw_sales_detail AS
SELECT
    o.id AS order_id,
    o.number AS order_number,
    o.created_at::date AS sale_date,
    o.status,
    o.payment_method,
    c.id AS customer_id,
    c.name AS customer_name,
    c.district,
    p.id AS product_id,
    p.sku,
    p.name AS product_name,
    p.brand,
    cat.name AS category,
    oi.quantity,
    oi.unit_price,
    oi.subtotal,
    p.cost * oi.quantity AS total_cost,
    oi.subtotal - (p.cost * oi.quantity) AS gross_profit
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
JOIN categories cat ON cat.id = p.category_id;

CREATE OR REPLACE VIEW vw_inventory_status AS
SELECT
    p.id,
    p.sku,
    p.name,
    p.brand,
    c.name AS category,
    p.stock,
    p.min_stock,
    p.cost,
    p.stock * p.cost AS stock_value,
    CASE WHEN p.stock <= p.min_stock THEN 'LOW_STOCK' ELSE 'AVAILABLE' END AS stock_status
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.active = TRUE;

