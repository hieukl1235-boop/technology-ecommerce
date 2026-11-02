const pool = require("../config/db");

class User {
  // Tìm user bằng email
  static async findByEmail(email) {
    const result = await pool.query(
      `SELECT *
       FROM users
       WHERE email = $1`,
      [email],
    );

    return result.rows[0];
  }

  // Tìm user bằng Google ID
  static async findByGoogleId(googleId) {
    const result = await pool.query(
      `SELECT *
       FROM users
       WHERE google_id = $1`,
      [googleId],
    );

    return result.rows[0];
  }

  // Tạo user mới
  static async create(full_name, email, password, date_of_birth, gender) {
    const result = await pool.query(
      `INSERT INTO users
        (
          full_name,
          email,
          password,
          date_of_birth,
          gender
        )
       VALUES
        ($1, $2, $3, $4, $5)
       RETURNING
        id,
        full_name,
        email,
        date_of_birth,
        gender`,
      [full_name, email, password, date_of_birth, gender],
    );

    return result.rows[0];
  }

  // Liên kết Google ID với tài khoản
  static async updateGoogleId(id, googleId) {
    const result = await pool.query(
      `UPDATE users
       SET google_id = $1
       WHERE id = $2
       RETURNING *`,
      [googleId, id],
    );

    return result.rows[0];
  }

  // Tạo user bằng Google
  static async createWithGoogle(full_name, email, password, google_id) {
    const result = await pool.query(
      `INSERT INTO users
        (
          full_name,
          email,
          password,
          google_id
        )
       VALUES
        ($1, $2, $3, $4)
       RETURNING
        id,
        full_name,
        email,
        date_of_birth,
        gender`,
      [full_name, email, password, google_id],
    );

    return result.rows[0];
  }

  // =================================
  // QUẢN LÝ NGƯỜI DÙNG
  // =================================

  // Lấy tất cả người dùng
  static async getAll() {
    const { rows } = await pool.query(`
      SELECT
        id,
        full_name,
        email,
        date_of_birth,
        gender,
        status,
        created_at,
        updated_at,
        avatar
      FROM users
      ORDER BY id DESC
    `);

    return rows;
  }

  // Lấy người dùng theo ID
  static async getById(id) {
    const { rows } = await pool.query(
      `
      SELECT
        id,
        full_name,
        email,
        date_of_birth,
        gender,
        status,
        created_at,
        updated_at
      FROM users
      WHERE id = $1
      `,
      [id],
    );

    return rows[0];
  }

  // Cập nhật thông tin người dùng
  static async update(id, data) {
    const { full_name, email, date_of_birth, gender } = data;

    const { rows } = await pool.query(
      `
      UPDATE users
      SET
        full_name = $1,
        email = $2,
        date_of_birth = $3,
        gender = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING
        id,
        full_name,
        email,
        date_of_birth,
        gender,
        status
      `,
      [full_name, email, date_of_birth, gender, id],
    );

    return rows[0];
  }

  // Khóa / mở tài khoản
  static async updateStatus(id, status) {
    const { rows } = await pool.query(
      `
      UPDATE users
      SET
        status = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING
        id,
        full_name,
        email,
        status
      `,
      [status, id],
    );

    return rows[0];
  }

  static async getUserByUserId(userId) {
    const result = await pool.query(
      `SELECT *
       FROM users
       WHERE id = $1`,
      [userId],
    );
    return result.rows[0];
  }

  static async updateUserProfile(userId, full_name, date_of_birth, gender) {
    const result = await pool.query(
      `UPDATE users
        SET full_name = $1, date_of_birth = $2, gender = $3
        WHERE id = $4
        RETURNING *`,
      [full_name, date_of_birth, gender, userId],
    );
    return result.rows[0];
  }
  static async getOrdersByUserId(userId) {
    const query = `
      SELECT 
        o.order_code, o.order_date, o.total_amount, o.order_status,
        o.payment_status, o.shipping_address, o.phone, o.recipient_name, 
        o.refund_image_url, dp.image_url AS delivery_proof_image,
        c.code as sale_code,c.name as sale_name,
        COALESCE(
          json_agg(
            json_build_object(
              'variant_id', od.variant_id, 
              'product_name', p.name,
              'product_id',p.id,
              'sku', v.sku,
              'quantity', od.quantity,
              'unit_price', od.unit_price,
              'image', v.image_url
            )
          ) FILTER (WHERE od.variant_id IS NOT NULL), '[]'
        ) as items
      FROM orders o
      LEFT JOIN order_details od ON o.order_code = od.order_code
      LEFT JOIN product_variants v ON od.variant_id = v.id
      LEFT JOIN products p ON v.product_id = p.id
      LEFT JOIN delivery_proofs dp ON o.delivery_proof_id = dp.id
      LEFT JOIN coupons c ON c.id = o.coupon_id
      WHERE o.user_id = $1
      GROUP BY o.order_code, dp.image_url,c.code,c.name
      ORDER BY o.order_date DESC;
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows;
  }

  // Lưu đánh giá sản phẩm của user
  static async createReview(
    userId,
    variantId,
    rating,
    title,
    content,
    imageUrls,
  ) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Thêm đánh giá vào bảng reviews
      const reviewQuery = `
        INSERT INTO reviews (user_id, variant_id, rating, title, content, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 1, NOW(), NOW())
        RETURNING id;
      `;
      const reviewRes = await client.query(reviewQuery, [
        userId,
        variantId,
        rating,
        title,
        content,
      ]);
      const reviewId = reviewRes.rows[0].id;

      // 2. Nếu có ảnh đính kèm, thêm vào bảng review_images
      if (imageUrls && imageUrls.length > 0) {
        for (const imgUrl of imageUrls) {
          const imageQuery = `
            INSERT INTO review_images (review_id, image_url)
            VALUES ($1, $2);
          `;
          await client.query(imageQuery, [reviewId, imgUrl]);
        }
      }

      await client.query("COMMIT");
      return { reviewId };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateAvatar(avatarFile, userId) {
    const query = `
    UPDATE users 
    SET avatar = $1 
    WHERE id = $2
    RETURNING id, avatar
  `;

    const result = await pool.query(query, [avatarFile, userId]);

    return result.rows[0];
  }
}

module.exports = User;
