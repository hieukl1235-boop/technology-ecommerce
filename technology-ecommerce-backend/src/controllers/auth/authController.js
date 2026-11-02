const pool = require("../../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../../models/User");
const crypto = require("crypto");
const { sendResetOtp } = require("../../utils/emailService");

// =========================
// ĐĂNG KÝ
// =========================
exports.register = async (req, res) => {
  try {
    const { full_name, email, password, date_of_birth, gender } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ thông tin",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Mật khẩu phải có ít nhất 8 ký tự",
      });
    }

    // Kiểm tra email đã có tài khoản chưa
    const user = await User.findByEmail(email);

    if (user) {
      return res.status(400).json({
        message: "Email đã tồn tại",
      });
    }

    // Mã hóa mật khẩu trước khi lưu tạm
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo OTP gồm 6 chữ số
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    // OTP có hiệu lực 5 phút
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Xóa OTP đăng ký cũ của email này
    await pool.query("DELETE FROM registration_otps WHERE email = $1", [email]);

    // Lưu thông tin đăng ký tạm thời
    // Lưu thông tin đăng ký tạm thời
    await pool.query(
      `INSERT INTO registration_otps
    (full_name, email, password_hash, date_of_birth,
     gender, otp_hash, expires_at)
   VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        full_name,
        email,
        hashedPassword,
        date_of_birth || null,
        gender || null,
        otpHash,
        expiresAt,
      ],
    );

    console.log("Đã lưu OTP đăng ký vào database");

    // Gửi OTP đến email
    console.log("Bắt đầu gửi OTP đăng ký đến:", email);
    await sendResetOtp(email, otp);
    console.log("Đã gửi OTP đăng ký thành công");

    // Gửi OTP đến email
    await sendResetOtp(email, otp);

    return res.json({
      message: "Mã OTP đã được gửi đến email của bạn",
    });
  } catch (error) {
    console.error("Register Error:", error);

    return res.status(500).json({
      message: "Không thể xử lý đăng ký lúc này",
    });
  }
};

exports.verifyRegistrationOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Vui lòng nhập email và mã OTP",
      });
    }

    const result = await pool.query(
      `SELECT *
       FROM registration_otps
       WHERE email = $1
       LIMIT 1`,
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Không tìm thấy yêu cầu đăng ký",
      });
    }

    const registration = result.rows[0];

    if (new Date(registration.expires_at) <= new Date()) {
      await pool.query("DELETE FROM registration_otps WHERE id = $1", [
        registration.id,
      ]);

      return res.status(400).json({
        message: "OTP đã hết hạn. Vui lòng đăng ký lại",
      });
    }

    if (registration.attempts >= 5) {
      return res.status(400).json({
        message: "Bạn đã nhập sai OTP quá số lần cho phép",
      });
    }

    const isMatch = await bcrypt.compare(String(otp), registration.otp_hash);

    if (!isMatch) {
      await pool.query(
        `UPDATE registration_otps
         SET attempts = attempts + 1
         WHERE id = $1`,
        [registration.id],
      );

      return res.status(400).json({
        message: "Mã OTP không chính xác",
      });
    }

    // Kiểm tra lại email trước khi tạo tài khoản
    const existingUser = await User.findByEmail(email);

    if (existingUser) {
      await pool.query("DELETE FROM registration_otps WHERE id = $1", [
        registration.id,
      ]);

      return res.status(400).json({
        message: "Email đã tồn tại",
      });
    }

    // Chỉ tạo tài khoản sau khi OTP hợp lệ
    const newUser = await User.create(
      registration.full_name,
      registration.email,
      registration.password_hash,
      registration.date_of_birth,
      registration.gender,
    );

    // Xóa dữ liệu đăng ký tạm sau khi thành công
    await pool.query("DELETE FROM registration_otps WHERE id = $1", [
      registration.id,
    ]);

    return res.json({
      message: "Xác minh email và đăng ký thành công",
      user: newUser,
    });
  } catch (error) {
    console.error("Verify Registration OTP Error:", error);

    return res.status(500).json({
      message: "Không thể xác minh OTP lúc này",
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
        avatar: user.avatar
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
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Google Login Error:", error);

    res.status(401).json({
      message: "Đăng nhập Google thất bại",
    });
  }
};

// =========================
// QUÊN MẬT KHẨU - GỬI OTP
// =========================

exports.forgotPassword = async (req, res) => {
  try {
    const email = req.body.email;

    if (!email) {
      return res.status(400).json({
        message: "Vui lòng nhập email",
      });
    }

    // Tìm tài khoản theo email
    const user = await User.findByEmail(email);

    // Không tiết lộ email có tồn tại hay không
    if (!user) {
      return res.json({
        message: "Nếu email đã đăng ký, mã xác minh sẽ được gửi đến email đó",
      });
    }

    // Tạo OTP gồm 6 chữ số
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Băm OTP trước khi lưu
    const otpHash = await bcrypt.hash(otp, 10);

    // OTP có hiệu lực trong 5 phút
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Lưu OTP vào database
    await pool.query(
      `INSERT INTO password_reset_otps
        (email, otp_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [email, otpHash, expiresAt],
    );

    // Gửi OTP qua email
    await sendResetOtp(email, otp);

    return res.json({
      message: "Nếu email đã đăng ký, mã xác minh sẽ được gửi đến email đó",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);

    return res.status(500).json({
      message: "Không thể xử lý yêu cầu lúc này",
    });
  }
};

// =========================
// XÁC MINH OTP QUÊN MẬT KHẨU
// =========================
exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Vui lòng nhập email và mã OTP",
      });
    }

    const result = await pool.query(
      `SELECT *
       FROM password_reset_otps
       WHERE email = $1
         AND is_used = FALSE
       ORDER BY created_at DESC, id DESC
       LIMIT 1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Mã OTP không hợp lệ hoặc đã hết hạn",
      });
    }

    const resetOtp = result.rows[0];

    if (new Date(resetOtp.expires_at) <= new Date()) {
      return res.status(400).json({
        message: "Mã OTP đã hết hạn",
      });
    }

    if (resetOtp.attempts >= 5) {
      return res.status(400).json({
        message: "Bạn đã nhập sai OTP quá số lần cho phép",
      });
    }

    const isMatch = await bcrypt.compare(
      String(otp),
      resetOtp.otp_hash
    );

    if (!isMatch) {
      await pool.query(
        `UPDATE password_reset_otps
         SET attempts = attempts + 1
         WHERE id = $1`,
        [resetOtp.id]
      );

      return res.status(400).json({
        message: "Mã OTP không chính xác",
      });
    }

    return res.json({
      message: "Xác minh OTP thành công",
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);

    return res.status(500).json({
      message: "Không thể xác minh OTP lúc này",
    });
  }
};

// =========================
// ĐẶT LẠI MẬT KHẨU
// =========================
exports.resetPassword = async (req, res) => {
  const client = await pool.connect();

  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ thông tin",
      });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({
        message: "Mật khẩu mới phải có ít nhất 8 ký tự",
      });
    }

    await client.query("BEGIN");

    const result = await client.query(
      `SELECT *
       FROM password_reset_otps
       WHERE email = $1
         AND is_used = FALSE
       ORDER BY created_at DESC, id DESC
       LIMIT 1
       FOR UPDATE`,
      [email]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "OTP không hợp lệ hoặc đã được sử dụng",
      });
    }

    const resetOtp = result.rows[0];

    if (
      new Date(resetOtp.expires_at) <= new Date() ||
      resetOtp.attempts >= 5
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "OTP đã hết hạn hoặc vượt quá số lần thử",
      });
    }

    const isMatch = await bcrypt.compare(
      String(otp),
      resetOtp.otp_hash
    );

    if (!isMatch) {
      await client.query(
        `UPDATE password_reset_otps
         SET attempts = attempts + 1
         WHERE id = $1`,
        [resetOtp.id]
      );

      await client.query("COMMIT");

      return res.status(400).json({
        message: "Mã OTP không chính xác",
      });
    }

    const userResult = await client.query(
      `SELECT id
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Không thể đặt lại mật khẩu",
      });
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    await client.query(
      `UPDATE users
       SET password = $1
       WHERE email = $2`,
      [hashedPassword, email]
    );

    await client.query(
      `UPDATE password_reset_otps
       SET is_used = TRUE
       WHERE id = $1`,
      [resetOtp.id]
    );

    await client.query("COMMIT");

    return res.json({
      message: "Đặt lại mật khẩu thành công",
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Reset Password Error:", error);

    return res.status(500).json({
      message: "Không thể đặt lại mật khẩu lúc này",
    });
  } finally {
    client.release();
  }
};