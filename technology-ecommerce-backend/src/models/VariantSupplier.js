// src/models/VariantSupplierModel.js
const pool = require("../config/db");

class VariantSupplier {
  // 1. Lấy danh sách nhà cung cấp của một biến thể
  static async getSuppliers(variant_id) {
    const { rows } = await pool.query(
      `SELECT s.id, s.name, s.phone
       FROM variant_suppliers vs
       JOIN suppliers s ON vs.supplier_id = s.id
       WHERE vs.variant_id = $1
       ORDER BY s.name ASC`,
      [variant_id],
    );

    return rows;
  }

  // 2. Thêm nhà cung cấp cho biến thể
  static async addSupplier(variant_id, supplier_id) {
    const { rows } = await pool.query(
      `INSERT INTO variant_suppliers (variant_id, supplier_id)
       VALUES ($1, $2)
       ON CONFLICT (variant_id, supplier_id) DO NOTHING
       RETURNING *`,
      [variant_id, supplier_id],
    );

    return rows[0];
  }

  // 3. Xóa nhà cung cấp khỏi biến thể (Hard delete)
  static async removeSupplier(variant_id, supplier_id) {
    const { rowCount } = await pool.query(
      `DELETE FROM variant_suppliers 
       WHERE variant_id = $1 AND supplier_id = $2`,
      [variant_id, supplier_id],
    );

    return rowCount > 0;
  }

  static async removeAllBySupplier(supplier_id) {
    const { rowCount } = await pool.query(
      `DELETE FROM variant_suppliers 
       WHERE supplier_id = $1`,
      [supplier_id],
    );
  }
}

module.exports = VariantSupplier;
