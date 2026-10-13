const pool = require("../config/db");

class Role {
  // Lấy tất cả role
  static async getAll() {
    const { rows } = await pool.query(`
      SELECT
        id,
        name,
        description
      FROM roles
      ORDER BY id
    `);

    return rows;
  }
}

module.exports = Role;
