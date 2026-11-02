const pool = require("../config/db");

class ProductVariant {
  static async getAll() {
    const result = await pool.query(
      `SELECT pv.*, p.name
             FROM product_variants pv
             JOIN products p ON pv.product_id = p.id
             ORDER BY id DESC`,
    );

    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT *
             FROM product_variants
             WHERE id = $1`,
      [id],
    );

    return result.rows[0];
  }

  static async findByIdAndProductId(client, id, product_id) {
    const result = await client.query(
      `SELECT *
             FROM product_variants
             WHERE id = $1
             AND product_id = $2`,
      [id, product_id],
    );

    return result.rows[0];
  }

  static async findBySku(sku) {
    const result = await pool.query(
      `SELECT id
             FROM product_variants
             WHERE sku = $1`,
      [sku],
    );

    return result.rows[0];
  }

  // 🟢 Thêm sale_price vào hàm create
  static async create(
    client,
    product_id,
    sku,
    selling_price,
    sale_price,
    image_url,
  ) {
    const result = await client.query(
      `INSERT INTO product_variants
                (
                    product_id,
                    sku,
                    selling_price,
                    sale_price,
                    image_url
                )
             VALUES
                ($1, $2, $3, $4, $5)
             RETURNING *`,
      [product_id, sku, selling_price, sale_price, image_url],
    );

    return result.rows[0];
  }

  // 🟢 Thêm sale_price vào hàm update
  static async update(client, id, sku, selling_price, sale_price, image_url) {
    const result = await client.query(
      `UPDATE product_variants
             SET sku = $1,
                 selling_price = $2,
                 sale_price = $3,
                 image_url = $4
             WHERE id = $5
             RETURNING *`,
      [sku, selling_price, sale_price, image_url, id],
    );

    return result.rows[0];
  }

  static async updateStatus(client, id, status) {
    const result = await client.query(
      `UPDATE product_variants
             SET status = $1
             WHERE id = $2
             RETURNING *`,
      [status, id],
    );

    return result.rows[0];
  }

  static async getVariantsBySupplierId(supplier_id) {
    const result = await pool.query(
      `SELECT pv.*,p.name
      FROM product_variants pv
      JOIN variant_suppliers vs
      ON vs.variant_id = pv.id
      JOIN products p
      ON p.id = pv.product_id
      WHERE pv.status = 1 
      AND vs.supplier_id = $1
      `,
      [supplier_id],
    );
    return result.rows;
  }

  static async getVariantsByProductId(product_id) {
    const result = await pool.query(
      `select pv.*
        from product_variants pv
        where pv.product_id = $1
        and pv.status = 1
      `,
      [product_id],
    );
    return result.rows;
  }

  static async getVariantById(id) {
    const result = await pool.query(
      `SELECT pv.*, p.name FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE pv.id = $1`,
      [id],
    );
    return result.rows[0];
  }
}

module.exports = ProductVariant;
