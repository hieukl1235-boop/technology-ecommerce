const pool = require("../config/db");

class Attribute {

    // Lấy danh sách thuộc tính
    static async getAll() {
        const result = await pool.query(
            `SELECT *
             FROM attributes
             ORDER BY id DESC`
        );

        return result.rows;
    }

    // Tìm thuộc tính bằng tên
    static async findByName(name) {
        const result = await pool.query(
            `SELECT id
             FROM attributes
             WHERE name = $1`,
            [name]
        );

        return result.rows[0];
    }

    // Tìm thuộc tính bằng tên, trừ ID hiện tại
    static async findByNameExceptId(name, id) {
        const result = await pool.query(
            `SELECT id
             FROM attributes
             WHERE name = $1
             AND id <> $2`,
            [name, id]
        );

        return result.rows[0];
    }

    // Thêm thuộc tính
    static async create(name) {
        const result = await pool.query(
            `INSERT INTO attributes
                (name)
             VALUES
                ($1)
             RETURNING *`,
            [name]
        );

        return result.rows[0];
    }

    // Cập nhật thuộc tính
    static async update(id, name) {
        const result = await pool.query(
            `UPDATE attributes
             SET name = $1
             WHERE id = $2
             RETURNING *`,
            [name, id]
        );

        return result.rows[0];
    }

    // Khóa / mở khóa thuộc tính
    static async updateStatus(id) {
        const result = await pool.query(
            `UPDATE attributes
             SET status =
                CASE
                    WHEN status = 1 THEN 0
                    ELSE 1
                END
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        return result.rows[0];
    }
}

module.exports = Attribute;
