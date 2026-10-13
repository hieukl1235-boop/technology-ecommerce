const pool = require("../config/db");

class VariantAttribute {
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

  static async getByVariantId(variant_id) {
    const result = await pool.query(
      `SELECT *
             FROM variant_attributes
             WHERE variant_id = $1`,
      [variant_id],
    );

    return result.rows;
  }

  static async deleteByVariantId(client, variant_id) {
    await client.query(
      `DELETE FROM variant_attributes
             WHERE variant_id = $1`,
      [variant_id],
    );
  }
}

module.exports = VariantAttribute;
