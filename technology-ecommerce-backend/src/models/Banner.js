const pool = require("../config/db");

class Banner {
  // Lấy danh sách banner hiển thị ngoài trang chủ
  static async getActiveBanners() {
    const query = "SELECT * FROM banners WHERE status = 1 ORDER BY id DESC";
    const result = await pool.query(query);
    return result.rows;
  }

  // Lấy toàn bộ banner cho trang Admin (Hàm này đang bị thiếu hoặc chưa có static)
  static async getAllBannersForAdmin() {
    const query = "SELECT * FROM banners ORDER BY id DESC";
    const result = await pool.query(query);
    return result.rows;
  }

  static async createBanner(data) {
    const { title, description, image_url, status } = data;
    const query = `
        INSERT INTO banners (title, description, image_url, status)
        VALUES ($1, $2, $3, $4) RETURNING *;
    `;
    const values = [title, description, image_url, status ?? 1];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updateBanner(id, data) {
    const { title, description, image_url, status } = data;
    let query, values;
    if (image_url) {
      query = `UPDATE banners SET title = $1, description = $2, image_url = $3, status = $4 WHERE id = $5 RETURNING *;`;
      values = [title, description, image_url, status, id];
    } else {
      query = `UPDATE banners SET title = $1, description = $2, status = $3 WHERE id = $4 RETURNING *;`;
      values = [title, description, status, id];
    }
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const query = "UPDATE banners SET status = $1 WHERE id = $2 RETURNING *";
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  static async deleteBanner(id) {
    const query = "DELETE FROM banners WHERE id = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Banner;
