const pool = require("../config/db");

class Supplier {
  // 1. Lấy danh sách tất cả nhà cung cấp (chỉ lấy người đang hợp tác)
  static async getAll() {
    const { rows } = await pool.query(
      `SELECT s.*,  json_agg(vs.variant_id) AS variant_ids
       FROM suppliers s
      LEFT  JOIN variant_suppliers vs ON s.id = vs.supplier_id  
        GROUP BY s.id
       ORDER BY id DESC`,
      [],
    );
    return rows;
  }

  // 2. Lấy chi tiết 1 nhà cung cấp
  static async getById(id) {
    const { rows } = await pool.query(
      `SELECT * 
       FROM suppliers 
       WHERE id = $1`,
      [id],
    );
    return rows[0];
  }

  // 3. Thêm mới nhà cung cấp
  static async create(name, phone, address, email) {
    const { rows } = await pool.query(
      `INSERT INTO suppliers (name, phone, address, email)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, phone, address, email],
    );
    return rows[0];
  }

  // 4. Sửa thông tin nhà cung cấp
  static async update(id, name, phone, address, email) {
    const { rows } = await pool.query(
      `UPDATE suppliers 
       SET name = $1, phone = $2, address = $3, email = $4 
       WHERE id = $5
       RETURNING *`,
      [name, phone, address, email, id],
    );
    return rows[0];
  }

  // 5. Cập nhật trạng thái (Dùng để Xóa mềm / Khóa nhà cung cấp)
  static async updateStatus(id, status) {
    const { rows } = await pool.query(
      `UPDATE suppliers 
       SET status = $1 
       WHERE id = $2 
       RETURNING *`,
      [status, id],
    );
    return rows[0];
  }
}

module.exports = Supplier;
