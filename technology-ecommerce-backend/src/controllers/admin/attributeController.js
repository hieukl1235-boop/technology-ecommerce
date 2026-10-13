const Attribute = require("../../models/Attribute");

// ========================================
// LẤY DANH SÁCH THUỘC TÍNH
// ========================================

exports.getAttributes = async (req, res) => {
    try {

        const attributes =
            await Attribute.getAll();

        res.json(attributes);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Lỗi server"
        });
    }
};


// ========================================
// THÊM THUỘC TÍNH
// ========================================

exports.createAttribute = async (req, res) => {
    try {

        const name = req.body.name;

        if (!name) {
            return res.status(400).json({
                message: "Vui lòng nhập tên thuộc tính"
            });
        }

        const check =
            await Attribute.findByName(name);

        if (check) {
            return res.status(400).json({
                message: "Tên thuộc tính đã tồn tại"
            });
        }

        const attribute =
            await Attribute.create(name);

        res.status(201).json({
            message: "Thêm thuộc tính thành công",
            attribute: attribute
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Lỗi server"
        });
    }
};


// ========================================
// CẬP NHẬT THUỘC TÍNH
// ========================================

exports.updateAttribute = async (req, res) => {
    try {

        const id = req.params.id;
        const name = req.body.name;

        if (!name) {
            return res.status(400).json({
                message: "Vui lòng nhập tên thuộc tính"
            });
        }

        const check =
            await Attribute.findByNameExceptId(
                name,
                id
            );

        if (check) {
            return res.status(400).json({
                message: "Tên thuộc tính đã tồn tại"
            });
        }

        const attribute =
            await Attribute.update(
                id,
                name
            );

        if (!attribute) {
            return res.status(404).json({
                message: "Không tìm thấy thuộc tính"
            });
        }

        res.json({
            message: "Cập nhật thuộc tính thành công",
            attribute: attribute
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Lỗi server"
        });
    }
};


// ========================================
// KHÓA / MỞ KHÓA THUỘC TÍNH
// ========================================

exports.updateStatus = async (req, res) => {
    try {

        const id = req.params.id;

        const attribute =
            await Attribute.updateStatus(id);

        if (!attribute) {
            return res.status(404).json({
                message: "Không tìm thấy thuộc tính"
            });
        }

        res.json({
            message: "Cập nhật trạng thái thành công",
            attribute: attribute
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Lỗi server"
        });
    }
};
