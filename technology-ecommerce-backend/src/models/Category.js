const pool = require("../config/db");

class Category {

    // Lấy danh sách danh mục
    static async getAll() {
        const result = await pool.query(
            `SELECT *
             FROM categories
             ORDER BY id DESC`
        );

        return result.rows;
    }


    // Tìm danh mục bằng tên
    static async findByName(name) {
        const result = await pool.query(
            `SELECT id
             FROM categories
             WHERE name = $1`,
            [name]
        );

        return result.rows[0];
    }


    // Tìm danh mục bằng tên, trừ ID hiện tại
    static async findByNameExceptId(name, id) {
        const result = await pool.query(
            `SELECT id
             FROM categories
             WHERE name = $1
             AND id <> $2`,
            [name, id]
        );

        return result.rows[0];
    }


    // Thêm danh mục
    static async create(name) {
        const result = await pool.query(
            `INSERT INTO categories
                (name)
             VALUES
                ($1)
             RETURNING *`,
            [name]
        );

        return result.rows[0];
    }


    // Cập nhật danh mục
    static async update(id, name) {
        const result = await pool.query(
            `UPDATE categories
             SET name = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [name, id]
        );

        return result.rows[0];
    }


    // Khóa / mở khóa danh mục
    static async updateStatus(id) {
        const result = await pool.query(
            `UPDATE categories
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

module.exports = Category;
