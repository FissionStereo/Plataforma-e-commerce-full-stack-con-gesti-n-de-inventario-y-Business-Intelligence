# Modelo de Business Intelligence

El panel web consume indicadores calculados por la API. Para construir un informe adicional en Power BI:

1. Inicia la API una vez para crear y poblar la base de datos.
2. Desde `backend`, activa el entorno virtual.
3. Ejecuta `python ../analytics/etl.py`.
4. Importa los CSV generados en `analytics/output`.
5. Relaciona `fact_sales` con `dim_product`, `dim_customer` y `dim_date`.
6. Copia las medidas de `measures.dax`.

El modelo usa una tabla de hechos de ventas, tres dimensiones y una instantánea de inventario.

