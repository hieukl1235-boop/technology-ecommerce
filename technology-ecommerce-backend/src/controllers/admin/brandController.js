const Brand = require("../../models/Brand");

// ========================================
// LẤY DANH SÁCH THƯƠNG HIỆU
// ========================================


exports.getBrands = async (req, res) => {
  try {
    const status = req.query.status ?? null;

    const brands = await Brand.getAll(status);

    res.json(brands);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Lỗi server",
    });
  }
};



// ========================================
// THÊM THƯƠNG HIỆU
// ========================================

exports.createBrand = async (req, res) => {
    try {

        const name = req.body.name;

        if (!name) {
            return res.status(400).json({
                message: "Vui lòng nhập tên thương hiệu"
            });
        }

        const check = await Brand.findByName(
            name
        );

        if (check) {
            return res.status(400).json({
                message: "Thương hiệu đã tồn tại"
            });
        }

        const brand = await Brand.create(
            name
        );

        res.status(201).json({
            message: "Thêm thương hiệu thành công",
            brand: brand
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Lỗi server"
        });
    }
};


// ========================================
// CẬP NHẬT THƯƠNG HIỆU
// ========================================

exports.updateBrand = async (req, res) => {
    try {

        const id = req.params.id;
        const name = req.body.name;

        if (!name) {
            return res.status(400).json({
                message: "Vui lòng nhập tên thương hiệu"
            });
        }

        const check =
            await Brand.findByNameExceptId(
                name,
                id
            );

        if (check) {
            return res.status(400).json({
                message: "Tên thương hiệu đã tồn tại"
            });
        }

        const brand = await Brand.update(
            id,
            name
        );

        if (!brand) {
            return res.status(404).json({
                message: "Không tìm thấy thương hiệu"
            });
        }

        res.json({
            message: "Cập nhật thương hiệu thành công",
            brand: brand
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Lỗi server"
        });
    }
};


// ========================================
// KHÓA / MỞ KHÓA THƯƠNG HIỆU
// ========================================

exports.updateStatus = async (req, res) => {
    try {

        const id = req.params.id;

        const brand =
            await Brand.updateStatus(id);

        if (!brand) {
            return res.status(404).json({
                message: "Không tìm thấy thương hiệu"
            });
        }

        res.json({
            message: "Cập nhật trạng thái thành công",
            brand: brand
        });
    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Lỗi server"
        });
    }
};