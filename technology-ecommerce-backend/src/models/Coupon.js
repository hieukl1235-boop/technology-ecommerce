const pool = require("../config/db");

class Coupon {
  // Lấy tất cả mã giảm giá
  // Lấy tất cả mã giảm giá kèm theo danh sách category_ids của từng mã
  static async getAll() {
    const result = await pool.query(
      `SELECT 
          c.*, 
          COALESCE(json_agg(cc.category_id) FILTER (WHERE cc.category_id IS NOT NULL), '[]') AS category_ids
       FROM coupons c
       LEFT JOIN coupon_categories cc ON c.id = cc.coupon_id
       GROUP BY c.id
       ORDER BY c.id DESC`,
    );

    return result.rows;
  }

  // Tìm mã giảm giá theo ID kèm theo danh sách category_ids
  static async findById(id) {
    const result = await pool.query(
      `SELECT 
          c.*, 
          COALESCE(json_agg(cc.category_id) FILTER (WHERE cc.category_id IS NOT NULL), '[]') AS category_ids
       FROM coupons c
       LEFT JOIN coupon_categories cc ON c.id = cc.coupon_id
       WHERE c.id = $1
       GROUP BY c.id`,
      [id],
    );

    return result.rows[0];
  }
  // Kiểm tra mã giảm giá đã tồn tại chưa
  static async findByCode(code) {
    const result = await pool.query(
      `SELECT *
             FROM coupons
             WHERE LOWER(code) = LOWER($1)`,
      [code],
    );

    return result.rows[0];
  }

  // Thêm mã giảm giá

  // Thêm mã giảm giá
  static async create(
    client,
    code,
    name,
    discount_type,
    discount_value,
    max_discount,
    min_order_value,
    quantity,
    start_date,
    end_date,
  ) {
    const result = await client.query(
      `INSERT INTO coupons (
        code,
        name,
        discount_type,
        discount_value,
        max_discount,
        min_order_value,
        quantity,
        used_quantity,
        start_date,
        end_date,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, 1)
      RETURNING *`,
      [
        code,
        name,
        discount_type,
        discount_value,
        max_discount,
        min_order_value,
        quantity,
        start_date,
        end_date,
      ],
    );

    return result.rows[0];
  }

  // Cập nhật mã giảm giá
  static async update(
    client,
    id,
    code,
    name,
    discount_type,
    discount_value,
    max_discount,
    min_order_value,
    quantity,
    start_date,
    end_date,
  ) {
    const result = await client.query(
      `UPDATE coupons
       SET code = $1,
           name = $2,
           discount_type = $3,
           discount_value = $4,
           max_discount = $5,
           min_order_value = $6,
           quantity = $7,
           start_date = $8,
           end_date = $9
       WHERE id = $10
       RETURNING *`,
      [
        code,
        name,
        discount_type,
        discount_value,
        max_discount,
        min_order_value,
        quantity,
        start_date,
        end_date,
        id,
      ],
    );

    return result.rows[0];
  }

  // Cập nhật trạng thái mã giảm giá
  static async updateStatus(id, status) {
    const result = await pool.query(
      `UPDATE coupons
             SET status = $1
             WHERE id = $2
             RETURNING *`,
      [status, id],
    );

    return result.rows[0];
  }

  // Lấy danh sách category_id thuộc mã giảm giá này
  static async getCategoryIds(couponId) {
    const result = await pool.query(
      `SELECT category_id FROM coupon_categories WHERE coupon_id = $1`,
      [couponId],
    );
    return result.rows.map((row) => row.category_id);
  }

  // Thêm các danh mục cho mã giảm giá (dùng trong transaction)
  static async addCategories(client, couponId, categoryIds) {
    if (!categoryIds || categoryIds.length === 0) return;
    for (const catId of categoryIds) {
      await client.query(
        `INSERT INTO coupon_categories (coupon_id, category_id) VALUES ($1, $2)`,
        [couponId, catId],
      );
    }
  }

  // Xóa cũ và thêm mới danh mục cho mã giảm giá (dùng khi update)
  static async updateCategories(client, couponId, categoryIds) {
    await client.query(`DELETE FROM coupon_categories WHERE coupon_id = $1`, [
      couponId,
    ]);
    if (categoryIds && categoryIds.length > 0) {
      await this.addCategories(client, couponId, categoryIds);
    }
  }
  // Kiểm tra mã giảm giá có hợp lệ, còn hạn và còn lượt dùng không
  static async getValidCoupon(code) {
    const query = `
      SELECT * FROM coupons 
      WHERE code = $1 
        AND status = 1
        AND start_date <= NOW() 
        AND end_date >= NOW() 
        AND used_quantity < quantity
    `;
    const result = await pool.query(query, [code]);
    return result.rows[0];
  }
  // Lấy danh sách category_id mà mã giảm giá này được phép áp dụng
  static async getCouponCategories(couponId) {
    const query = `
      SELECT category_id FROM coupon_categories 
      WHERE coupon_id = $1
    `;
    const result = await pool.query(query, [couponId]);
    return result.rows.map((row) => row.category_id);
  }

  static async getAvailableCoupons() {
    const query = `
    SELECT
      c.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', ca.id,
            'name', ca.name
          )
        ) FILTER (WHERE ca.id IS NOT NULL),
        '[]'
      ) AS categories
    FROM coupons c
    LEFT JOIN coupon_categories cc
      ON c.id = cc.coupon_id
    LEFT JOIN categories ca
      ON cc.category_id = ca.id
    WHERE c.status = 1
      AND c.start_date <= NOW()
      AND c.end_date >= NOW()
      AND c.used_quantity < c.quantity
    GROUP BY c.id
    ORDER BY c.end_date ASC, c.id DESC
  `;

    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = Coupon;
