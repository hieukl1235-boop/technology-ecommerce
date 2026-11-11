const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Employee = require("../../models/Employee");


exports.login = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        // 1. Kiểm tra dữ liệu
        if (!email || !password) {
            return res.status(400).json({
                message: "Vui lòng nhập email và mật khẩu"
            });
        }


        // 2. Tìm nhân viên
        const employee = await Employee.findByEmail(
            email
        );


        // 3. Không tìm thấy nhân viên
        if (!employee) {
            return res.status(401).json({
                message: "Email hoặc mật khẩu không đúng"
            });
        }


        // 4. Kiểm tra trạng thái tài khoản
        if (employee.status !== 1) {
            return res.status(403).json({
                message: "Tài khoản đã bị khóa"
            });
        }


        // 5. Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(
            password,
            employee.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Email hoặc mật khẩu không đúng"
            });
        }


        // 6. Tạo JWT
        const token = jwt.sign(
            {
                id: employee.id,
                email: employee.email,
                role_id: employee.role_id,
                  account_type: "employee"

            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );


        // 7. Lấy danh sách quyền
        const permissions =
            await Employee.getPermissions(
                employee.role_id
            );


        // 8. Trả kết quả
        res.json({
            message: "Đăng nhập thành công",

            token: token,

            employee: {
                id: employee.id,
                full_name: employee.full_name,
                email: employee.email,
                avatar: employee.avatar,
                role_id: employee.role_id,
                role_name: employee.role_name,
                permissions: permissions
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Lỗi server"
        });
    }
};
