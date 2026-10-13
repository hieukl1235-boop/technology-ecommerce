const Category = require("../../models/Category");


// ========================================
// LẤY DANH SÁCH DANH MỤC
// ========================================

exports.getCategories = async (req, res) => {
    try {

        const categories = await Category.getAll();

        res.json(categories);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Lỗi server"
        });
    }
};


// ========================================
// THÊM DANH MỤC
// ========================================

exports.createCategory = async (req, res) => {
    try {

        const name = req.body.name;

        if (!name) {
            return res.status(400).json({
                message: "Vui lòng nhập tên danh mục"
            });
        }


        const check = await Category.findByName(
            name
        );

        if (check) {
            return res.status(400).json({
                message: "Danh mục đã tồn tại"
            });
        }


        const category = await Category.create(
            name
        );


        res.status(201).json({
            message: "Thêm danh mục thành công",
            category: category
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Lỗi server"
        });
    }
};


// ========================================
// SỬA DANH MỤC
// ========================================

exports.updateCategory = async (req, res) => {
    try {

        const id = req.params.id;
        const name = req.body.name;

        if (!name) {
            return res.status(400).json({
                message: "Vui lòng nhập tên danh mục"
            });
        }


        const check =
            await Category.findByNameExceptId(
                name,
                id
            );

        if (check) {
            return res.status(400).json({
                message: "Tên danh mục đã tồn tại"
            });
        }


        const category = await Category.update(
            id,
            name
        );


        if (!category) {
            return res.status(404).json({
                message: "Không tìm thấy danh mục"
            });
        }


        res.json({
            message: "Cập nhật danh mục thành công",
            category: category
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Lỗi server"
        });
    }
};


// ========================================
// KHÓA / MỞ KHÓA DANH MỤC
// ========================================

exports.updateStatus = async (req, res) => {
    try {

        const id = req.params.id;


        const category =
            await Category.updateStatus(id);


        if (!category) {
            return res.status(404).json({
                message: "Không tìm thấy danh mục"
            });
        }


        res.json({
            message: "Cập nhật trạng thái thành công",
            category: category
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Lỗi server"
        });
    }
};
