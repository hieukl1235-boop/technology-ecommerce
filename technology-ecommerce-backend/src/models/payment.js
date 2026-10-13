const pool = require("../config/db");

const PaymentModel = {
  async getAllMethods() {
    const query = "SELECT * FROM payment_methods ORDER BY id ASC";
    const result = await pool.query(query);
    return result.rows;
  },
};

module.exports = PaymentModel;
