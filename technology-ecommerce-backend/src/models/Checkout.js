const pool = require("../config/db");

const CheckoutModel = {
  async getItemsByVariantIds(variantIds) {
    const query = `
      SELECT 
        v.id AS variant_id,
        p.id AS product_id,
        p.category_id, 
        p.name AS product_name,
        v.sku,
        v.selling_price,
        v.sale_price,
        v.image
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      WHERE v.id = ANY($1::int[])
    `;
    const result = await pool.query(query, [variantIds]);
    return result.rows;
  },
};

module.exports = CheckoutModel;
