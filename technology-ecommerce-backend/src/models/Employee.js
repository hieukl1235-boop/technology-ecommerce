const pool = require("../config/db");
const bcrypt = require("bcryptjs");

class Employee {
  // Tìm nhân viên bằng email
  static async findByEmail(email) {
    const result = await pool.query(
      `SELECT
        e.id,
        e.full_name,
        e.email,
        e.password,
        e.role_id,
        e.status,
        r.name AS role_name
      FROM employees e
      JOIN roles r
        ON e.role_id = r.id
      WHERE e.email = $1`,
      [email],
    );

    return result.rows[0];
  }

  // Lấy danh sách quyền của nhân viên
  static async getPermissions(role_id) {
    const result = await pool.query(
      `SELECT p.name
      FROM role_permissions rp
      JOIN permissions p
        ON rp.permission_id = p.id
      WHERE rp.role_id = $1`,
      [role_id],
    );

    return result.rows.map((row) => row.name);
  }

  // Lấy tất cả nhân viên
  static async getAll() {
    const { rows } = await pool.query(`
      SELECT
        e.id,
        e.full_name,
        e.gender,
        e.email,
        e.date_of_birth,
        e.address,
        e.phone,
        e.status,
        e.role_id,
        r.name AS role_name
      FROM employees e
      JOIN roles r
        ON e.role_id = r.id
      ORDER BY e.id DESC
    `);

    return rows;
  }

  // Lấy nhân viên theo ID
  static async getById(id) {
    const { rows } = await pool.query(
      `
      SELECT
        e.id,
        e.full_name,
        e.gender,
        e.email,
        e.date_of_birth,
        e.address,
        e.phone,
        e.status,
        e.role_id,
        r.name AS role_name
      FROM employees e
      JOIN roles r
        ON e.role_id = r.id
      WHERE e.id = $1
      `,
      [id],
    );

    return rows[0];
  }

  // Kiểm tra email đã tồn tại chưa
  static async existsByEmail(email) {
    const { rows } = await pool.query(
      `SELECT id FROM employees WHERE email = $1`,
      [email],
    );

    return rows.length > 0;
  }

  // Tạo nhân viên và cấp tài khoản
  static async create(data) {
    const {
      full_name,
      gender,
      email,
      password,
      date_of_birth,
      address,
      phone,
      role_id,
    } = data;

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `
      INSERT INTO employees (
        full_name,
        gender,
        email,
        password,
        date_of_birth,
        address,
        phone,
        role_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        id,
        full_name,
        gender,
        email,
        date_of_birth,
        address,
        phone,
        role_id,
        status
      `,
      [
        full_name,
        gender,
        email,
        hashedPassword,
        date_of_birth,
        address,
        phone,
        role_id,
      ],
    );

    return rows[0];
  }

  // Cập nhật thông tin nhân viên và role
  static async update(id, data) {
    const { full_name, gender, email, date_of_birth, address, phone, role_id } =
      data;

    const { rows } = await pool.query(
      `
      UPDATE employees
      SET
        full_name = $1,
        gender = $2,
        email = $3,
        date_of_birth = $4,
        address = $5,
        phone = $6,
        role_id = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING
        id,
        full_name,
        gender,
        email,
        date_of_birth,
        address,
        phone,
        role_id,
        status
      `,
      [full_name, gender, email, date_of_birth, address, phone, role_id, id],
    );

    return rows[0];
  }

  // Khóa / mở tài khoản nhân viên
  static async updateStatus(id, status) {
    const { rows } = await pool.query(
      `
      UPDATE employees
      SET
        status = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, status
      `,
      [status, id],
    );

    return rows[0];
  }

  static async getShippers() {
    // Thay số 3 bằng đúng ID của role Shipper trong cơ sở dữ liệu của bạn
    const shipperRoleId = 3; 
    const query = `
      SELECT id, full_name, phone 
      FROM employees 
      WHERE role_id = $1 AND status = 1
    `;
    const result = await pool.query(query, [shipperRoleId]);
    return result.rows;
  }
}

module.exports = Employee;
