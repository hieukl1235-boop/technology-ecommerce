const jwt = require("jsonwebtoken");
const pool = require("../config/db");

exports.authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Chưa đăng nhập",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.employee = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token không hợp lệ",
    });
  }
};

exports.authenticateUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Gán vào req.user thay vì req.employee
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
};
exports.authorizePermission = (permission) => {
  return async (req, res, next) => {
    try {
      const result = await pool.query(
        `SELECT 1
                 FROM role_permissions rp
                 JOIN permissions p
                    ON rp.permission_id = p.id
                 WHERE rp.role_id = $1
                 AND p.name = $2`,
        [req.employee.role_id, permission],
      );

      if (result.rows.length === 0) {
        return res.status(403).json({
          message: "Bạn không có quyền thực hiện chức năng này",
        });
      }

      next();
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Lỗi server",
      });
    }
  };
};