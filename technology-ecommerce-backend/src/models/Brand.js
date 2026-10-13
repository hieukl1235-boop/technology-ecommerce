const pool = require("../config/db");

class Brand {

    // Lấy danh sách thương hiệu
    static async getAll() {
        const result = await pool.query(
            `SELECT *
             FROM brands
             ORDER BY id DESC`
        );

        return result.rows;
    }

    // Tìm thương hiệu bằng tên
    static async findByName(name) {
        const result = await pool.query(
            `SELECT id
             FROM brands
             WHERE name = $1`,
            [name]
        );

        return result.rows[0];
    }

    // Tìm thương hiệu bằng tên, trừ ID hiện tại
    static async findByNameExceptId(name, id) {
        const result = await pool.query(
            `SELECT id
             FROM brands
             WHERE name = $1
             AND id <> $2`,
            [name, id]
        );

        return result.rows[0];
    }

    // Thêm thương hiệu
    static async create(name) {
        const result = await pool.query(
            `INSERT INTO brands
                (name)
             VALUES
                ($1)
             RETURNING *`,
            [name]
        );

        return result.rows[0];
    }

    // Cập nhật thương hiệu
    static async update(id, name) {
        const result = await pool.query(
            `UPDATE brands
             SET name = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [name, id]
        );

        return result.rows[0];
    }

    // Khóa / mở khóa thương hiệu
    static async updateStatus(id) {
        const result = await pool.query(
            `UPDATE brands
             SET status =
                CASE
                    WHEN status = 1 THEN 0
                    ELSE 1
                END,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        return result.rows[0];
    }
}

module.exports = Brand;
