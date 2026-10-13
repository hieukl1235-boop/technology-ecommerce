require("dotenv").config();

const bcrypt = require("bcryptjs");
const pool = require("./src/config/db");

async function createEmployee() {
    try {
        const password = await bcrypt.hash("123456", 10);

        const result = await pool.query(
            `INSERT INTO employees
            (role_id, full_name, email, password)
            VALUES ($1, $2, $3, $4)
            RETURNING id, role_id, full_name, email`,
            [
                2,
                "Nguyen Van A",
                "nhanvien@gmail.com",
                password
            ]
        );

        console.log("Tạo nhân viên thành công:");
        console.log(result.rows[0]);

    } catch (error) {
        console.error("Lỗi:", error);

    } finally {
        await pool.end();
    }
}

createEmployee();
