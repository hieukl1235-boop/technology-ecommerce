const pool = require("../config/db");

class ProductImage {
  static async create(client, product_id, image_url) {
    const result = await client.query(
      `INSERT INTO product_images (product_id, image_url)
       VALUES ($1, $2) RETURNING *`,
      [product_id, image_url],
    );
    return result.rows[0];
  }

  // Lấy ảnh cần xóa (kèm product_id để không xóa nhầm ảnh sản phẩm khác)
  static async findByIds(client, product_id, ids) {
    const result = await client.query(
      `SELECT id, image_url FROM product_images
       WHERE product_id = $1 AND id = ANY($2::int[])`,
      [product_id, ids],
    );
    return result.rows;
  }

  static async deleteByIds(client, product_id, ids) {
    await client.query(
      `DELETE FROM product_images
       WHERE product_id = $1 AND id = ANY($2::int[])`,
      [product_id, ids],
    );
  }

  static async getByProductId(product_id) {
    const result = await pool.query(
      `SELECT id, image_url FROM product_images
       WHERE product_id = $1 ORDER BY id ASC`,
      [product_id],
    );
    return result.rows;
  }
}

module.exports = ProductImage;
