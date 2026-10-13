const Coupon = require("../../models/Coupon");
const pool = require("../../config/db");

// [GET] /api/admin/coupons
// Lấy danh sách mã giảm giá
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.getAll();

    res.status(200).json(coupons);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Lỗi lấy danh sách mã giảm giá",
    });
  }
};

// [GET] /api/admin/coupons/:id
// Lấy chi tiết mã giảm giá
exports.getCouponById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "ID không hợp lệ",
      });
    }

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({
        message: "Không tìm thấy mã giảm giá",
      });
    }

    res.status(200).json(coupon);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Lỗi lấy chi tiết mã giảm giá",
    });
  }
};

// [POST] /api/admin/coupons
// Thêm mã giảm giá
exports.createCoupon = async (req, res) => {
  const client = await pool.connect();
  try {
    const code = req.body.code?.trim().toUpperCase();
    const name = req.body.name?.trim();

    const discount_type = Number(req.body.discount_type);
    const discount_value = Number(req.body.discount_value);

    const max_discount =
      req.body.max_discount === "" || req.body.max_discount == null
        ? null
        : Number(req.body.max_discount);

    const quantity = Number(req.body.quantity);
    const start_date = req.body.start_date;
    const end_date = req.body.end_date;

    // Lấy danh sách category_ids từ request body (ví dụ: [1, 2, 3])
    const category_ids = req.body.category_ids;

    // Kiểm tra dữ liệu bắt buộc
    if (!code || !name || !start_date || !end_date) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ thông tin",
      });
    }

    // Kiểm tra danh mục áp dụng
    if (!Array.isArray(category_ids) || category_ids.length === 0) {
      return res.status(400).json({
        message: "Vui lòng chọn ít nhất một loại sản phẩm/danh mục áp dụng",
      });
    }

    // Kiểm tra loại giảm giá
    if (![1, 2].includes(discount_type)) {
      return res.status(400).json({
        message: "Loại giảm giá không hợp lệ",
      });
    }

    // Kiểm tra giá trị giảm
    if (!Number.isFinite(discount_value) || discount_value <= 0) {
      return res.status(400).json({
        message: "Giá trị giảm phải lớn hơn 0",
      });
    }

    // Giảm theo phần trăm
    if (discount_type === 1 && discount_value > 100) {
      return res.status(400).json({
        message: "Phần trăm giảm không được vượt quá 100",
      });
    }

    // Kiểm tra mức giảm tối đa
    if (
      max_discount !== null &&
      (!Number.isFinite(max_discount) || max_discount <= 0)
    ) {
      return res.status(400).json({
        message: "Mức giảm tối đa phải lớn hơn 0",
      });
    }

    if (discount_type === 2 && max_discount !== null) {
      return res.status(400).json({
        message: "Mã giảm cố định không cần mức giảm tối đa",
      });
    }

    // Kiểm tra số lượng
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        message: "Số lượng phải là số nguyên lớn hơn 0",
      });
    }

    // Kiểm tra ngày
    const start = new Date(start_date);
    const end = new Date(end_date);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      return res.status(400).json({
        message: "Ngày kết thúc phải sau ngày bắt đầu",
      });
    }

    // Bắt đầu Transaction
    await client.query("BEGIN");

    // Kiểm tra mã trùng
    const existingCoupon = await Coupon.findByCode(code);
    if (existingCoupon) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Mã giảm giá đã tồn tại",
      });
    }

    // Tạo mã giảm giá chính
    const coupon = await Coupon.create(
      code,
      name,
      discount_type,
      discount_value,
      max_discount,
      quantity,
      start_date,
      end_date,
    );

    // Thêm các danh mục vào bảng trung gian coupon_categories
    await Coupon.addCategories(client, coupon.id, category_ids);

    await client.query("COMMIT");

    res.status(201).json({
      message: "Tạo mã giảm giá thành công",
      coupon: {
        ...coupon,
        category_ids,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);

    res.status(500).json({
      message: "Lỗi tạo mã giảm giá",
    });
  } finally {
    client.release();
  }
};

// [PUT] /api/admin/coupons/:id
// Cập nhật mã giảm giá
exports.updateCoupon = async (req, res) => {
  const client = await pool.connect();
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "ID không hợp lệ",
      });
    }

    const oldCoupon = await Coupon.findById(id);

    if (!oldCoupon) {
      return res.status(404).json({
        message: "Không tìm thấy mã giảm giá",
      });
    }

    const code = req.body.code?.trim().toUpperCase();
    const name = req.body.name?.trim();

    const discount_type = Number(req.body.discount_type);
    const discount_value = Number(req.body.discount_value);

    const max_discount =
      req.body.max_discount === "" || req.body.max_discount == null
        ? null
        : Number(req.body.max_discount);

    const quantity = Number(req.body.quantity);
    const start_date = req.body.start_date;
    const end_date = req.body.end_date;

    // Lấy danh sách category_ids mới từ client gửi lên
    const category_ids = req.body.category_ids;

    if (!code || !name || !start_date || !end_date) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ thông tin",
      });
    }

    // Kiểm tra danh mục áp dụng khi cập nhật
    if (!Array.isArray(category_ids) || category_ids.length === 0) {
      return res.status(400).json({
        message: "Vui lòng chọn ít nhất một loại sản phẩm/danh mục áp dụng",
      });
    }

    if (![1, 2].includes(discount_type)) {
      return res.status(400).json({
        message: "Loại giảm giá không hợp lệ",
      });
    }

    if (
      !Number.isFinite(discount_value) ||
      discount_value <= 0 ||
      (discount_type === 1 && discount_value > 100)
    ) {
      return res.status(400).json({
        message: "Giá trị giảm không hợp lệ",
      });
    }

    if (
      max_discount !== null &&
      (!Number.isFinite(max_discount) || max_discount <= 0)
    ) {
      return res.status(400).json({
        message: "Mức giảm tối đa không hợp lệ",
      });
    }

    if (discount_type === 2 && max_discount !== null) {
      return res.status(400).json({
        message: "Mã giảm cố định không cần mức giảm tối đa",
      });
    }

    if (!Number.isInteger(quantity) || quantity < oldCoupon.used_quantity) {
      return res.status(400).json({
        message: "Số lượng không được nhỏ hơn số lượt đã sử dụng",
      });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      return res.status(400).json({
        message: "Ngày kết thúc phải sau ngày bắt đầu",
      });
    }

    // Bắt đầu Transaction
    await client.query("BEGIN");

    const existingCoupon = await Coupon.findByCode(code);

    if (existingCoupon && existingCoupon.id !== id) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Mã giảm giá đã tồn tại",
      });
    }

    // Cập nhật thông tin mã giảm giá chính
    const coupon = await Coupon.update(
      id,
      code,
      name,
      discount_type,
      discount_value,
      max_discount,
      quantity,
      start_date,
      end_date,
    );

    // Cập nhật lại các danh mục áp dụng trong bảng coupon_categories
    await Coupon.updateCategories(client, id, category_ids);

    await client.query("COMMIT");

    res.status(200).json({
      message: "Cập nhật mã giảm giá thành công",
      coupon: {
        ...coupon,
        category_ids,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);

    res.status(500).json({
      message: "Lỗi cập nhật mã giảm giá",
    });
  } finally {
    client.release();
  }
};

// [PATCH] /api/admin/coupons/:id/status
// Bật hoặc tắt mã giảm giá
exports.updateCouponStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const status = Number(req.body.status);

    if (!Number.isInteger(id) || id <= 0 || ![0, 1].includes(status)) {
      return res.status(400).json({
        message: "Dữ liệu không hợp lệ",
      });
    }

    const oldCoupon = await Coupon.findById(id);

    if (!oldCoupon) {
      return res.status(404).json({
        message: "Không tìm thấy mã giảm giá",
      });
    }

    const coupon = await Coupon.updateStatus(id, status);

    res.status(200).json({
      message: "Cập nhật trạng thái thành công",
      coupon,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Lỗi cập nhật trạng thái",
    });
  }
};
