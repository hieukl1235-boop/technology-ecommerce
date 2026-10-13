const pool = require("../config/db");

class Review {
  // Danh sách đánh giá của TẤT CẢ biến thể thuộc một sản phẩm
  static async getByProductId(productId) {
    const result = await pool.query(
      `SELECT
          r.id,
          r.user_id,
          r.variant_id,
          r.rating,
          r.title,
          r.content,
          r.reply,
          r.created_at,
          r.updated_at,

          u.full_name AS user_name,   -- ⚠️ đổi theo tên cột thật trong bảng users
          pv.sku,

          COALESCE(
            (
              SELECT json_agg(ri.image_url ORDER BY ri.id)
              FROM review_images ri
              WHERE ri.review_id = r.id
            ),
            '[]'
          ) AS images

       FROM reviews r
       JOIN product_variants pv ON pv.id = r.variant_id
       JOIN users u ON u.id = r.user_id

       WHERE pv.product_id = $1
         AND r.status = 1            -- ⚠️ 1 = đang hiển thị, đổi nếu bạn quy ước khác
       ORDER BY r.created_at DESC`,
      [productId],
    );

    return result.rows;
  }

  // Điểm trung bình + số lượng theo từng mức sao
  static async getSummary(productId) {
    const result = await pool.query(
      `SELECT
          COUNT(*)::int AS total,
          COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0)::float AS average,
          COUNT(*) FILTER (WHERE r.rating = 1)::int AS star1,
          COUNT(*) FILTER (WHERE r.rating = 2)::int AS star2,
          COUNT(*) FILTER (WHERE r.rating = 3)::int AS star3,
          COUNT(*) FILTER (WHERE r.rating = 4)::int AS star4,
          COUNT(*) FILTER (WHERE r.rating = 5)::int AS star5
       FROM reviews r
       JOIN product_variants pv ON pv.id = r.variant_id
       WHERE pv.product_id = $1
         AND r.status = 1`,
      [productId],
    );

    return result.rows[0];
  }

  // Khóa dòng review để kiểm tra chủ sở hữu trong transaction
  static async findByIdForUpdate(client, id) {
    const result = await client.query(
      `SELECT id, user_id FROM reviews WHERE id = $1 FOR UPDATE`,
      [id],
    );
    return result.rows[0];
  }

  static async getImages(client, reviewId) {
    const result = await client.query(
      `SELECT image_url FROM review_images WHERE review_id = $1`,
      [reviewId],
    );
    return result.rows;
  }

  static async delete(client, id) {
    await client.query(`DELETE FROM review_images WHERE review_id = $1`, [id]);
    await client.query(`DELETE FROM reviews WHERE id = $1`, [id]);
  }
}

module.exports = Review;
