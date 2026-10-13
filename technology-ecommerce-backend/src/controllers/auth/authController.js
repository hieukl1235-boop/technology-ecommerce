const pool = require("../../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../../models/User");

// =========================
// ĐĂNG KÝ
// =========================
exports.register = async (req, res) => {
  try {
    const full_name = req.body.full_name;
    const email = req.body.email;
    const password = req.body.password;
    const date_of_birth = req.body.date_of_birth;
    const gender = req.body.gender;

    // Kiểm tra dữ liệu
    if (!full_name || !email || !password) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ thông tin",
      });
    }

    // Kiểm tra email đã tồn tại
    const user = await User.findByEmail(email);

    if (user) {
      return res.status(400).json({
        message: "Email đã tồn tại",
      });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user
    const newUser = await User.create(
      full_name,
      email,
      hashedPassword,
      date_of_birth,
      gender,
    );

    res.status(201).json({
      message: "Đăng ký thành công",
      user: newUser,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Lỗi server",
    });
  }
};

// =========================
// ĐĂNG NHẬP
// =========================
exports.login = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    // Kiểm tra dữ liệu
    if (!email || !password) {
      return res.status(400).json({
        message: "Vui lòng nhập email và mật khẩu",
      });
    }

    // Tìm user
    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(401).json({
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    // Kiểm tra trạng thái tài khoản
    if (user.status !== 1) {
      return res.status(403).json({
        message: "Tài khoản đã bị khóa",
      });
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    // Tạo JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        account_type: "user",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    res.json({
      message: "Đăng nhập thành công",
      token: token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        date_of_birth: user.date_of_birth,
        gender: user.gender,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Lỗi server",
    });
  }
};

// ĐĂNG NHẬP TÀI KHOẢN BẰNG GOOGLE

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
  try {
    const credential = req.body.credential;

    // Kiểm tra credential
    if (!credential) {
      return res.status(400).json({
        message: "Thiếu Google credential",
      });
    }

    // Xác thực token Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    // Lấy thông tin từ Google
    const payload = ticket.getPayload();

    const googleId = payload.sub;
    const email = payload.email;
    const fullName = payload.name;

    // Tìm bằng Google ID
    let user = await User.findByGoogleId(googleId);

    // Nếu đã từng đăng nhập Google
    if (!user) {
      // Tìm bằng email
      user = await User.findByEmail(email);

      if (user) {
        // Email đã tồn tại
        // Liên kết tài khoản với Google

        user = await User.updateGoogleId(user.id, googleId);
      } else {
        // Chưa có tài khoản
        // Tạo tài khoản mới

        const hashedPassword = await bcrypt.hash(googleId, 10);

        user = await User.createWithGoogle(
          fullName,
          email,
          hashedPassword,
          googleId,
        );
      }
    }

    // Tạo JWT của website
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        account_type: "user",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    // Trả kết quả về Vue
    res.json({
      message: "Đăng nhập Google thành công",

      token: token,

      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        date_of_birth: user.date_of_birth,
        gender: user.gender,
      },
    });
  } catch (error) {
    console.error("Google Login Error:", error);

    res.status(401).json({
      message: "Đăng nhập Google thất bại",
    });
  }
};
