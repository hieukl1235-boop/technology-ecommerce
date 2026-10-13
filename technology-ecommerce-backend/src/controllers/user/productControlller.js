const ProductModel = require("../../models/Product");
// exports.filterProducts = async (req, res) => {
//     try {
//         const { keyword, category_id, brand_id, min_price, max_price, sort } = req.query;

//         const products = await ProductModel.getFilteredProducts({
//             keyword,
//             category_id: category_id ? Number(category_id) : null,
//             brand_id: brand_id ? Number(brand_id) : null,
//             min_price: min_price ? Number(min_price) : null,
//             max_price: max_price ? Number(max_price) : null,
//             sort
//         });

//         res.json(products);
//     } catch (error) {
//         console.error("Lỗi lọc sản phẩm:", error);
//         res.status(500).json({ message: "Lỗi server khi lọc sản phẩm" ,
//             error: error.message
//         });
//     }
// }

exports.filterProducts = async (req, res) => {
  try {
    const {
      keyword,
      category_id,
      brand_id,
      min_price,
      max_price,
      sort,
      page,
      limit,
    } = req.query;

    // Xử lý phân trang
    const parsedLimit = limit ? Number(limit) : 10; // Mặc định mỗi trang 10 sản phẩm
    const parsedPage = page ? Number(page) : 1; // Mặc định trang 1
    const offset = (parsedPage - 1) * parsedLimit;

    const products = await ProductModel.getFilteredProducts({
      keyword,
      category_id: category_id ? Number(category_id) : null,
      brand_id: brand_id ? Number(brand_id) : null,
      min_price: min_price ? Number(min_price) : null,
      max_price: max_price ? Number(max_price) : null,
      sort,
      limit: parsedLimit,
      offset: offset,
    });

    res.json({
      success: true,
      page: parsedPage,
      limit: parsedLimit,
      data: products,
    });
  } catch (error) {
    console.error("Lỗi lọc sản phẩm:", error);
    res.status(500).json({
      message: "Lỗi server khi lọc sản phẩm",
      error: error.message,
    });
  }
};