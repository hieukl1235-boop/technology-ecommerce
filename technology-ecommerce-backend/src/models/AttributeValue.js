const pool = require("../config/db");

class AttributeValue {
  // Lấy danh sách giá trị thuộc tính
  static async getAll() {
    const result = await pool.query(
      `SELECT *
             FROM attribute_values
             ORDER BY id DESC`,
    );

    return result.rows;
  }

  // Kiểm tra attribute có tồn tại
  static async findAttribute(attribute_id) {
    const result = await pool.query(
      `SELECT id
             FROM attributes
             WHERE id = $1`,
      [attribute_id],
    );

    return result.rows[0];
  }

  // Tìm value trong một attribute
  static async findByAttributeAndValue(attribute_id, value) {
    const result = await pool.query(
      `SELECT id
             FROM attribute_values
             WHERE attribute_id = $1
             AND value = $2`,
      [attribute_id, value],
    );

    return result.rows[0];
  }

  // Tìm value, trừ ID hiện tại
  static async findByAttributeAndValueExceptId(attribute_id, value, id) {
    const result = await pool.query(
      `SELECT id
             FROM attribute_values
             WHERE attribute_id = $1
             AND value = $2
             AND id <> $3`,
      [attribute_id, value, id],
    );

    return result.rows[0];
  }

  // Thêm giá trị thuộc tính
  static async create(client, variant_id, attribute_value_id) {
    const result = await client.query(
      `INSERT INTO variant_attributes
            (
                variant_id,
                attribute_value_id
            )
         VALUES
            ($1, $2)
         RETURNING *`,
      [variant_id, attribute_value_id],
    );

    return result.rows[0];
  }

  // Cập nhật giá trị thuộc tính
  static async update(id, attribute_id, value) {
    const result = await pool.query(
      `UPDATE attribute_values
             SET attribute_id = $1,
                 value = $2
             WHERE id = $3
             RETURNING *`,
      [attribute_id, value, id],
    );

    return result.rows[0];
  }

  // Khóa / mở khóa giá trị thuộc tính
  static async updateStatus(id) {
    const result = await pool.query(
      `UPDATE attribute_values
             SET status =
                CASE
                    WHEN status = 1 THEN 0
                    ELSE 1
                END
             WHERE id = $1
             RETURNING *`,
      [id],
    );

    return result.rows[0];
  }
}

module.exports = AttributeValue;
