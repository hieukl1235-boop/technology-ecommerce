require("dotenv").config();

const bcrypt = require("bcryptjs");
const pool = require("./src/config/db");

async function createAdmin() {
  try {
    const password = await bcrypt.hash("123456", 10);

    const result = await pool.query(
      `INSERT INTO employees
            (role_id, full_name, email, password)
            VALUES ($1, $2, $3, $4)
            RETURNING id, role_id, full_name, email`,
      [1, "Admin", "admin@gmail.com", password],
    );

    console.log("Tạo Admin thành công:");
    console.log(result.rows[0]);
  } catch (error) {
    console.error("Lỗi:", error);
  } finally {
    await pool.end();
  }
}

createAdmin();
