const AttributeValue = require("../../models/AttributeValue");


// ========================================
// LẤY DANH SÁCH GIÁ TRỊ THUỘC TÍNH
// ========================================

exports.getAttributeValues = async (req, res) => {
    try {

        const attributeValues =
            await AttributeValue.getAll();

        res.json(attributeValues);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Lỗi server"
        });
    }
};


// ========================================
// THÊM GIÁ TRỊ THUỘC TÍNH
// ========================================

exports.createAttributeValue = async (req, res) => {
    try {

        const attribute_id =
            req.body.attribute_id;

        const value =
            req.body.value;

        if (!attribute_id || !value) {
            return res.status(400).json({
                message: "Vui lòng nhập đầy đủ thông tin"
            });
        }

        // Kiểm tra attribute có tồn tại không
        const attribute =
            await AttributeValue.findAttribute(
                attribute_id
            );

        if (!attribute) {
            return res.status(404).json({
                message: "Không tìm thấy thuộc tính"
            });
        }

        // Kiểm tra value đã tồn tại chưa
        const check =
            await AttributeValue.findByAttributeAndValue(
                attribute_id,
                value
            );

        if (check) {
            return res.status(400).json({
                message: "Giá trị này đã tồn tại"
            });
        }

        const attributeValue =
            await AttributeValue.create(
                attribute_id,
                value
            );

        res.status(201).json({
            message: "Thêm giá trị thuộc tính thành công",
            attributeValue: attributeValue
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Lỗi server"
        });
    }
};


// ========================================
// CẬP NHẬT GIÁ TRỊ THUỘC TÍNH
// ========================================

exports.updateAttributeValue = async (req, res) => {
    try {

        const id = req.params.id;

        const attribute_id =
            req.body.attribute_id;

        const value =
            req.body.value;

        if (!attribute_id || !value) {
            return res.status(400).json({
                message: "Vui lòng nhập đầy đủ thông tin"
            });
        }

        // Kiểm tra attribute tồn tại
        const attribute =
            await AttributeValue.findAttribute(
                attribute_id
            );

        if (!attribute) {
            return res.status(404).json({
                message: "Không tìm thấy thuộc tính"
            });
        }

        // Kiểm tra trùng value
        const check =
            await AttributeValue.findByAttributeAndValueExceptId(
                attribute_id,
                value,
                id
            );

        if (check) {
            return res.status(400).json({
                message: "Giá trị này đã tồn tại"
            });
        }

        const attributeValue =
            await AttributeValue.update(
                id,
                attribute_id,
                value
            );

        if (!attributeValue) {
            return res.status(404).json({
                message: "Không tìm thấy giá trị thuộc tính"
            });
        }

        res.json({
            message: "Cập nhật giá trị thành công",
            attributeValue: attributeValue
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Lỗi server"
        });
    }
};


// ========================================
// KHÓA / MỞ KHÓA
// ========================================

exports.updateStatus = async (req, res) => {
    try {

        const id = req.params.id;

        const attributeValue =
            await AttributeValue.updateStatus(id);

        if (!attributeValue) {
            return res.status(404).json({
                message: "Không tìm thấy giá trị thuộc tính"
            });
        }

        res.json({
            message: "Cập nhật trạng thái thành công",
            attributeValue: attributeValue
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Lỗi server"
        });
    }
};
