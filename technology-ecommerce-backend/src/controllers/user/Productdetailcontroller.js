const fs = require("fs");
const path = require("path");
const pool = require("../../config/db");
const Review = require("../../models/Review ");

// =======================================================
// CHI TIẾT SẢN PHẨM (công khai)
// GET /api/products/:id/detail
// =======================================================
exports.getProductDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
          p.id,
          p.name,
          p.main_image,
          p.description,
          c.name AS category_name,
          b.name AS brand_name,

          COALESCE(
            (
              SELECT json_agg(
                json_build_object('id', pi.id, 'image_url', pi.image_url)
                ORDER BY pi.id
              )
              FROM product_images pi
              WHERE pi.product_id = p.id
            ),
            '[]'
          ) AS images,

          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', pv.id,
                  'sku', pv.sku,
                  'selling_price', pv.selling_price,
                  'sale_price', pv.sale_price,
                  'stock_quantity', pv.stock_quantity,
                  'image_url', pv.image_url,
                  'attributes',
                  COALESCE(
                    (
                      SELECT json_agg(
                        json_build_object(
                          'attribute_name', a.name,
                          'attribute_value', av.value
                        )
                      )
                      FROM variant_attributes va
                      JOIN attribute_values av ON va.attribute_value_id = av.id
                      JOIN attributes a ON av.attribute_id = a.id
                      WHERE va.variant_id = pv.id
                    ),
                    '[]'
                  )
                )
                ORDER BY pv.id
              )
              FROM product_variants pv
              WHERE pv.product_id = p.id
                AND pv.status = 1
            ),
            '[]'
          ) AS variants

       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.id = $1
         AND p.status = 1`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// =======================================================
// ĐÁNH GIÁ CỦA SẢN PHẨM (công khai)
// GET /api/products/:id/reviews
// =======================================================
exports.getProductReviews = async (req, res) => {
  try {
    const { id } = req.params;

    const [reviews, summary] = await Promise.all([
      Review.getByProductId(id),
      Review.getSummary(id),
    ]);

    res.json({ reviews, summary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// =======================================================
// XÓA ĐÁNH GIÁ - chỉ người viết mới được xóa
// DELETE /api/reviews/:id   (cần đăng nhập)
// =======================================================
exports.deleteReview = async (req, res) => {
  const client = await pool.connect();
  try {
    const reviewId = req.params.id;
    const userId = req.user.id; // ⚠️ lấy từ middleware xác thực JWT, đổi nếu bạn đặt tên khác

    await client.query("BEGIN");

    const review = await Review.findByIdForUpdate(client, reviewId);
    if (!review) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Không tìm thấy đánh giá" });
    }

    // Kiểm tra quyền ở backend (không tin vào việc frontend ẩn/hiện nút)
    if (Number(review.user_id) !== Number(userId)) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ message: "Bạn chỉ có thể xóa đánh giá của chính mình" });
    }

    const images = await Review.getImages(client, reviewId);
    await Review.delete(client, reviewId);

    await client.query("COMMIT");

    // Xóa file ảnh sau khi COMMIT thành công
    images.forEach((img) => {
      fs.unlink(
        path.join("src/uploads/images_review", img.image_url),
        () => {},
      );
    });

    res.json({ message: "Đã xóa đánh giá" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  } finally {
    client.release();
  }
};
