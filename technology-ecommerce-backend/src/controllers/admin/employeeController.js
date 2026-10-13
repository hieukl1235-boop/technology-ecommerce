const Employee = require("../../models/Employee");
const Role = require("../../models/Role");

// [GET] /api/admin/employees
// Lấy danh sách nhân viên
const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.getAll();

    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy danh sách nhân viên",
      error: error.message,
    });
  }
};

// [GET] /api/admin/employees/:id
// Lấy thông tin một nhân viên
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.getById(id);

    if (!employee) {
      return res.status(404).json({
        message: "Không tìm thấy nhân viên",
      });
    }

    res.status(200).json(employee);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy thông tin nhân viên",
      error: error.message,
    });
  }
};

// [POST] /api/admin/employees
// Tạo nhân viên + cấp tài khoản
const createEmployee = async (req, res) => {
  try {
    const {
      full_name,
      gender,
      email,
      password,
      date_of_birth,
      address,
      phone,
      role_id,
    } = req.body;

    // Kiểm tra dữ liệu bắt buộc
    if (!full_name || !email || !password || !role_id) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ thông tin bắt buộc",
      });
    }

    // Kiểm tra email đã tồn tại
    const emailExists = await Employee.existsByEmail(email);

    if (emailExists) {
      return res.status(400).json({
        message: "Email đã tồn tại",
      });
    }

    // Tạo nhân viên
    const employee = await Employee.create({
      full_name,
      gender,
      email,
      password,
      date_of_birth,
      address,
      phone,
      role_id,
    });

    res.status(201).json({
      message: "Tạo tài khoản nhân viên thành công",
      employee,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi tạo tài khoản nhân viên",
      error: error.message,
    });
  }
};

// [PUT] /api/admin/employees/:id
// Cập nhật thông tin nhân viên
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const { full_name, gender, email, date_of_birth, address, phone, role_id } =
      req.body;

    // Kiểm tra nhân viên có tồn tại không
    const employee = await Employee.getById(id);

    if (!employee) {
      return res.status(404).json({
        message: "Không tìm thấy nhân viên",
      });
    }

    // Nếu đổi email thì kiểm tra email mới
    if (email && email !== employee.email) {
      const emailExists = await Employee.existsByEmail(email);

      if (emailExists) {
        return res.status(400).json({
          message: "Email đã tồn tại",
        });
      }
    }

    const updatedEmployee = await Employee.update(id, {
      full_name,
      gender,
      email,
      date_of_birth,
      address,
      phone,
      role_id,
    });

    res.status(200).json({
      message: "Cập nhật nhân viên thành công",
      employee: updatedEmployee,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi cập nhật nhân viên",
      error: error.message,
    });
  }
};

// [PATCH] /api/admin/employees/:id/status
// Khóa / mở tài khoản
const updateEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (status !== 0 && status !== 1) {
      return res.status(400).json({
        message: "Trạng thái không hợp lệ",
      });
    }

    const employee = await Employee.getById(id);

    if (!employee) {
      return res.status(404).json({
        message: "Không tìm thấy nhân viên",
      });
    }

    const updatedEmployee = await Employee.updateStatus(id, status);

    res.status(200).json({
      message:
        status === 1
          ? "Đã mở tài khoản nhân viên"
          : "Đã khóa tài khoản nhân viên",
      employee: updatedEmployee,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi cập nhật trạng thái nhân viên",
      error: error.message,
    });
  }
};

// [GET] /api/admin/employees/roles
// Lấy danh sách role
const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.getAll();

    res.status(200).json(roles);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy danh sách role",
      error: error.message,
    });
  }
};

  const getShippers = async (req, res) =>{
    try {
      const shippers = await Employee.getShippers();
      return res.status(200).json({
        success: true,
        shippers: shippers,
      });
    } catch (error) {
      console.error("Lỗi lấy danh sách shipper:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách shipper",
      });
    }
  };


module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  getAllRoles,
  getShippers,
};
