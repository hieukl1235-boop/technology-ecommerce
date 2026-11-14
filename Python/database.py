import psycopg2
import pandas as pd
def get_connection():
    return psycopg2.connect(
        host="localhost",
        port=5432,
        database="TechShop",
        user="postgres",
        password="1111"
    )
def fetch_dataframe(query):
    conn = get_connection()

    try:
        with conn.cursor() as cursor:
            cursor.execute(query)
            rows = cursor.fetchall()
            columns = [column[0] for column in cursor.description]

        return pd.DataFrame(rows, columns=columns)
    finally:
        conn.close()
def load_products():
    query = """
        SELECT
            p.id AS product_id,
            p.name,
            p.description,
            p.category_id,
            c.name AS category_name,
            p.brand_id,
            b.name AS brand_name
        FROM products AS p
        LEFT JOIN categories AS c
            ON p.category_id = c.id
        LEFT JOIN brands AS b
            ON p.brand_id = b.id
        WHERE p.status = 1
        ORDER BY p.id
    """

    return fetch_dataframe(query)
def load_order_statuses():
    query = """
        SELECT DISTINCT order_status, payment_status
        FROM orders
        ORDER BY order_status, payment_status
    """

    return fetch_dataframe(query)
def load_interactions():
    query = """
        SELECT
            o.user_id,
            pv.product_id,
            p.name,
            SUM(od.quantity) AS quantity
        FROM orders AS o
        JOIN order_details AS od
            ON od.order_code = o.order_code
        JOIN product_variants AS pv
            ON pv.id = od.variant_id
        JOIN products AS p
            ON p.id = pv.product_id
        WHERE o.user_id IS NOT NULL
            AND o.order_status = 4
            AND o.payment_status = 1
            AND p.status = 1
        GROUP BY
            o.user_id,
            pv.product_id,
            p.name
        ORDER BY
            o.user_id,
            pv.product_id
    """

    return fetch_dataframe(query)