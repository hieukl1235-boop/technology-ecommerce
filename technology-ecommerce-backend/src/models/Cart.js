const pool = require("../config/db");

class Cart {
  // Tìm giỏ hàng của user
  static async findByUserId(userId) {
    const result = await pool.query(
      `
            SELECT *
            FROM carts
            WHERE user_id = $1
            `,
      [userId],
    );

    return result.rows[0];
  }

  // Tạo giỏ hàng cho user
  static async create(userId) {
    const result = await pool.query(
      `
            INSERT INTO carts (user_id)
            VALUES ($1)
            RETURNING *
            `,
      [userId],
    );

    return result.rows[0];
  }

  // Tìm sản phẩm trong giỏ
  static async findItem(cartId, variantId) {
    const result = await pool.query(
      `
            SELECT *
            FROM cart_items
            WHERE cart_id = $1
              AND variant_id = $2
            `,
      [cartId, variantId],
    );

    return result.rows[0];
  }
  static async getAllItems(cartId) {
    const result = await pool.query(
      `  SELECT ci.*, p.name AS product_name, pv.sku AS sku, pv.selling_price AS selling_price, pv.sale_price AS sale_price, pv.image_url AS image
            FROM cart_items ci
            JOIN product_variants pv ON ci.variant_id = pv.id
            JOIN products p ON pv.product_id = p.id
            WHERE cart_id = $1
            `,
      [cartId],
    );
    return result.rows;
  }

  // Thêm sản phẩm vào giỏ
  static async addItem(cartId, variantId, quantity) {
    const result = await pool.query(
      `
            INSERT INTO cart_items
                (cart_id, variant_id, quantity)
            VALUES
                ($1, $2, $3)
            RETURNING *
            `,
      [cartId, variantId, quantity],
    );

    return result.rows[0];
  }

  // Tăng số lượng sản phẩm
  static async increaseQuantity(cart_id, variant_id, quantity) {
    const result = await pool.query(
      `
            UPDATE cart_items
            SET
                quantity = quantity + $1
            WHERE cart_id = $2
            and variant_id = $3
            RETURNING *
            `,
      [quantity, cart_id, variant_id],
    );

    return result.rows[0];
  }
  // cập nhật số lượng sản phẩm trong giỏ hàng
  static async updateQuantity(cartId, variantId, quantity) {
    const result = await pool.query(
      `UPDATE cart_items
      SET quantity = $1
      WHERE cart_id = $2
      AND variant_id = $3
      RETURNING *`,
      [quantity, cartId, variantId],
    );
    return result.rows[0]; // ← thêm dòng này
  }
  static async removeItem(cartId, variantId) {
    const result = await pool.query(
      `
            DELETE FROM cart_items
            WHERE cart_id = $1
            AND variant_id = $2
            RETURNING *
            `,
      [cartId, variantId],
    );
    return result.rows[0];
  }
}

module.exports = Cart;
