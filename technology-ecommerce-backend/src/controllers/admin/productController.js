const pool = require("../../config/db");

const Product = require("../../models/Product");

const ProductVariant = require("../../models/ProductVariant");

const VariantAttribute = require("../../models/VariantAttribute");
const {
  parseVariants,
  validateProductInput,
} = require("../../utils/productHelper");
const fs = require("fs");
const path = require("path");
const ProductImage = require("../../models/ProductImage");
// =======================================================
// LẤY DANH SÁCH SẢN PHẨM
// =======================================================

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.getAll();
    console.log(products);

    res.json(products);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Lỗi server",
    });
  }
};

// =======================================================
// THÊM SẢN PHẨM + BIẾN THỂ + ATTRIBUTE
// =======================================================

exports.createProduct = async (req, res) => {
  const client = await pool.connect();
  try {
    // 1. Kiểm tra thông tin cơ bản
    const errorMsg = validateProductInput(req.body);
    if (errorMsg) return res.status(400).json({ message: errorMsg });

    // 2. Xử lý Variants bằng helper
    const variants = parseVariants(
      req.body.variants,
      req.files?.variant_images,
    );
    if (variants.length === 0) {
      return res
        .status(400)
        .json({ message: "Sản phẩm phải có ít nhất một biến thể" });
    }

    // 3. Kiểm tra tên sản phẩm trùng
    const checkName = await Product.findByName(req.body.name);
    if (checkName)
      return res.status(400).json({ message: "Tên sản phẩm đã tồn tại" });

    const main_image = req.files?.main_image?.[0]?.filename || null;

    // 4. Bắt đầu Transaction lưu vào DB
    await client.query("BEGIN");

    const product = await Product.create(
      client,
      req.body.category_id,
      req.body.brand_id,
      req.body.name,
      main_image,
      req.body.description,
    );
    for (const file of req.files?.gallery_images || []) {
      await ProductImage.create(client, product.id, file.filename);
    }

    for (const v of variants) {
      // Kiểm tra SKU trùng
      const checkSku = await ProductVariant.findBySku(v.sku);
      if (checkSku) throw new Error(`SKU ${v.sku} đã tồn tại`);

      const createdVariant = await ProductVariant.create(
        client,
        product.id,
        v.sku,
        v.selling_price,
        v.sale_price, // 🟢 Thêm sale_price vào đây để đúng vị trí $4
        v.image_url, // 🟢 image_url sẽ nằm ở vị trí $5 chuẩn xác
      );

      for (const attr_val_id of v.attributes) {
        await VariantAttribute.create(client, createdVariant.id, attr_val_id);
      }
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Thêm sản phẩm thành công", product });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};

exports.updateProduct = async (req, res) => {
  const client = await pool.connect();
  try {
    const id = req.params.id;
    const oldProduct = await Product.findById(id);
    if (!oldProduct)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    const errorMsg = validateProductInput(req.body);
    if (errorMsg) return res.status(400).json({ message: errorMsg });

    const variants = parseVariants(
      req.body.variants,
      req.files?.variant_images,
    );
    if (variants.length === 0)
      return res
        .status(400)
        .json({ message: "Sản phẩm phải có ít nhất một biến thể" });

    // Kiểm tra trùng tên sản phẩm (trừ chính nó)
    const checkName = await client.query(
      `SELECT id FROM products WHERE name = $1 AND id <> $2`,
      [req.body.name, id],
    );
    if (checkName.rows.length > 0)
      return res.status(400).json({ message: "Tên sản phẩm đã tồn tại" });

    const main_image =
      req.files?.main_image?.[0]?.filename || oldProduct.main_image;

    await client.query("BEGIN");
    // Xóa ảnh phụ mà admin đã bấm xóa
    const removedIds = JSON.parse(req.body.removed_image_ids || "[]").map(
      Number,
    );
    let filesToDelete = [];
    if (removedIds.length > 0) {
      filesToDelete = await ProductImage.findByIds(client, id, removedIds);
      await ProductImage.deleteByIds(client, id, removedIds);
    }

    // Thêm ảnh phụ mới
    for (const file of req.files?.gallery_images || []) {
      await ProductImage.create(client, id, file.filename);
    }

    // Cập nhật thông tin chung
    const product = await Product.update(
      client,
      id,
      req.body.category_id,
      req.body.brand_id,
      req.body.name,
      main_image,
      req.body.description,
    );

    // Lấy danh sách ID variant cũ trong DB
    const oldVariants = (
      await client.query(
        `SELECT id FROM product_variants WHERE product_id = $1`,
        [id],
      )
    ).rows.map((r) => r.id);
    const keepVariantIds = [];

    for (const v of variants) {
      let image_url = v.image_url;

      if (v.id) {
        // Trường hợp Variant cũ: Cập nhật
        const oldVariant = await ProductVariant.findByIdAndProductId(
          client,
          v.id,
          id,
        );
        if (!oldVariant) throw new Error(`Không tìm thấy variant ${v.id}`);

        if (!image_url) image_url = oldVariant.image_url; // Giữ ảnh cũ nếu không up ảnh mới

        await ProductVariant.update(
          client,
          v.id,
          v.sku,
          v.selling_price,
          v.sale_price, // 🟢 Đã bổ sung sale_price
          image_url,
        );
        await ProductVariant.updateStatus(client, v.id, v.status);

        // Cập nhật lại thuộc tính
        await VariantAttribute.deleteByVariantId(client, v.id);
        for (const attr_val_id of v.attributes) {
          await VariantAttribute.create(client, v.id, attr_val_id);
        }
        keepVariantIds.push(v.id);
      } else {
        // Trường hợp Variant mới thêm vào
        const newVariant = await ProductVariant.create(
          client,
          id,
          v.sku,
          v.selling_price,
          v.sale_price, // 🟢 Đã bổ sung sale_price
          image_url,
        );
        await ProductVariant.updateStatus(client, newVariant.id, v.status);

        for (const attr_val_id of v.attributes) {
          await VariantAttribute.create(client, newVariant.id, attr_val_id);
        }
        keepVariantIds.push(newVariant.id);
      }
    }

    // Các variant cũ không có trong danh sách giữ lại -> Chuyển status thành 0 (Ẩn)
    for (const oldId of oldVariants) {
      if (!keepVariantIds.includes(oldId)) {
        await ProductVariant.updateStatus(client, oldId, 0);
      }
    }

    await client.query("COMMIT");
    filesToDelete.forEach((img) => {
      fs.unlink(path.join("src/uploads/products", img.image_url), () => {});
    });
    res.json({ message: "Cập nhật sản phẩm thành công", product });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Kiểm tra xem status có được truyền lên không
    if (status === undefined) {
      return res.status(400).json({ message: "Thiếu thông tin trạng thái" });
    }

    const updatedProduct = await Product.updateStatus(id, status);

    if (!updatedProduct) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    res.json({
      message: "Cập nhật trạng thái thành công",
      product: updatedProduct,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Lấy thông tin chung sản phẩm
    const productResult = await pool.query(
      `SELECT * FROM products WHERE id = $1`,
      [id],
    );
    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
    const product = productResult.rows[0];

    // 2. Lấy TOÀN BỘ danh sách biến thể (Bỏ điều kiện status = 1 để form sửa thấy được cả biến thể đang ẩn)
    // 2. Lấy TOÀN BỘ danh sách biến thể và xử lý sale_price nếu bị null
    // 2. Lấy danh sách biến thể (Phải có mặt sale_price ở đây)
    const variantsResult = await pool.query(
      `SELECT id, product_id, sku, selling_price, sale_price, image_url, status 
       FROM product_variants 
       WHERE product_id = $1 
       ORDER BY id ASC`,
      [id],
    );
    const variants = variantsResult.rows;

    // 3. Lấy thêm thuộc tính cho từng biến thể
    for (let variant of variants) {
      const attrResult = await pool.query(
        `SELECT attribute_id, attribute_value_id 
         FROM variant_attributes 
         JOIN attribute_values ON variant_attributes.attribute_value_id = attribute_values.id 
         WHERE variant_id = $1`,
        [variant.id],
      );
      variant.attributes = attrResult.rows;
    }

    // Trả về kết quả hoàn chỉnh cho Vue (bao gồm cả selling_price, sale_price, status...)
    const images = await ProductImage.getByProductId(id);
    res.json({ ...product, variants, images });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
