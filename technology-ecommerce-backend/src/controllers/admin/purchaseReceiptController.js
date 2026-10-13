const pool = require("../../config/db");
const PurchaseReceipt = require("../../models/PurchaseReceipt");
const Variant = require("../../models/ProductVariant")

// [GET] /api/admin/purchase-receipts
// Lấy danh sách phiếu nhập
const getAllPurchaseReceipts = async (req, res) => {
  try {
    const receipts = await PurchaseReceipt.getAll();

    res.status(200).json(receipts);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Lỗi server",
    });
  }
};

// [GET] /api/admin/purchase-receipts/:id
// Lấy chi tiết phiếu nhập
const getPurchaseReceiptById = async (req, res) => {
  try {
    const id = req.params.id;

    const receipt = await PurchaseReceipt.findById(id);

    if (!receipt) {
      return res.status(404).json({
        message: "Không tìm thấy phiếu nhập",
      });
    }

    const details = await PurchaseReceipt.getDetails(id);

    res.status(200).json({
      ...receipt,
      details: details,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Lỗi server",
    });
  }
};

// [POST] /api/admin/purchase-receipts
// Tạo phiếu nhập hàng
const createPurchaseReceipt = async (req, res) => {
  const client = await pool.connect();

  try {
    const supplier_id = Number(req.body.supplier_id);
    const note = req.body.note;
    const details = req.body.details;

    // Lấy ID nhân viên từ JWT
    const employee_id = req.employee.id;

    // 1. Kiểm tra dữ liệu đầu vào cơ bản
    if (!Number.isInteger(supplier_id) || supplier_id <= 0) {
      return res.status(400).json({ message: "Nhà cung cấp không hợp lệ" });
    }

    if (!Array.isArray(details) || details.length === 0) {
      return res
        .status(400)
        .json({ message: "Phiếu nhập phải có ít nhất một biến thể" });
    }

    // 2. Kiểm tra nhà cung cấp có tồn tại và đang hoạt động không
    const supplier = await PurchaseReceipt.findSupplier(supplier_id);
    if (!supplier) {
      return res
        .status(404)
        .json({
          message: "Nhà cung cấp không tồn tại hoặc đã ngừng hoạt động",
        });
    }

    // 3. Kiểm tra chi tiết phiếu nhập & tính tổng tiền
    let total_amount = 0;
    const variantIds = [];

    for (let i = 0; i < details.length; i++) {
      const variant_id = Number(details[i].variant_id);
      const quantity = Number(details[i].quantity);
      const purchase_price = Number(details[i].purchase_price);

      if (!Number.isInteger(variant_id) || variant_id <= 0) {
        return res.status(400).json({ message: "ID biến thể không hợp lệ" });
      }

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res
          .status(400)
          .json({ message: "Số lượng nhập phải là số nguyên lớn hơn 0" });
      }

      if (!Number.isFinite(purchase_price) || purchase_price < 0) {
        return res.status(400).json({ message: "Giá nhập không hợp lệ" });
      }

      // Không cho nhập trùng biến thể trong cùng 1 phiếu
      if (variantIds.includes(variant_id)) {
        return res
          .status(400)
          .json({
            message:
              "Một biến thể không được xuất hiện nhiều lần trong phiếu nhập",
          });
      }

      variantIds.push(variant_id);

      details[i].variant_id = variant_id;
      details[i].quantity = quantity;
      details[i].purchase_price = purchase_price;
      details[i].total_price = quantity * purchase_price;

      total_amount += details[i].total_price;
    }

    // 4. Bắt đầu transaction
    await client.query("BEGIN");

    // 5. Kiểm tra các biến thể có thuộc nhà cung cấp đã chọn không
    for (let i = 0; i < details.length; i++) {
      const variant_id = details[i].variant_id;
      const variantSupplier = await PurchaseReceipt.checkVariantSupplier(
        client,
        variant_id,
        supplier_id,
      );

      if (!variantSupplier) {
        throw new Error(
          `Biến thể ID ${variant_id} không thuộc nhà cung cấp đã chọn hoặc đã ngừng hoạt động`,
        );
      }
    }

    // 6. Tạo phiếu nhập chính (`purchase_receipts`)
    const receipt = await PurchaseReceipt.create(
      client,
      employee_id,
      supplier_id,
      total_amount,
      note,
    );

    // 7. Thêm chi tiết phiếu nhập và tính lại giá bình quân gia quyền cho từng sản phẩm
    for (let i = 0; i < details.length; i++) {
      const variant_id = details[i].variant_id;
      const quantity = details[i].quantity;
      const purchase_price = details[i].purchase_price;
      const total_price = details[i].total_price;

      // Thêm dòng chi tiết
      await PurchaseReceipt.createDetail(
        client,
        receipt.id,
        variant_id,
        quantity,
        purchase_price,
        total_price,
      );

      // CẬP NHẬT TỒN KHO & GIÁ VỐN THEO BÌNH QUÂN GIA QUYỀN
      await PurchaseReceipt.updateStockAndMovingAverageCost(
        client,
        variant_id,
        quantity,
        purchase_price,
      );
    }

    // 8. Hoàn tất transaction
    await client.query("COMMIT");

    res.status(201).json({
      message: "Tạo phiếu nhập thành công",
      receipt: receipt,
      details: details,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(400).json({
      message: error.message,
    });
  } finally {
    client.release();
  }
};

const getVariantsBySupplierId = async(req, res)=>{
    try{
        const supplier_id = req.params.id;
        const variants = await Variant.getVariantsBySupplierId(supplier_id);
        res.status(200).json(variants);

    }
    catch (err){
        console.error(err);
        res.status(500).json({ message: "lỗi server" });

    }
};


const cancelPurchaseReceipt = async (req, res) => {
  const client = await pool.connect();

  try {
    const receipt_id = Number(req.params.id);

    if (!Number.isInteger(receipt_id) || receipt_id <= 0) {
      return res.status(400).json({ message: "ID phiếu nhập không hợp lệ" });
    }

    await client.query("BEGIN");

    // Lấy thông tin phiếu nhập
    const receipt = await PurchaseReceipt.findById(receipt_id);
    if (!receipt) {
      return res.status(404).json({ message: "Không tìm thấy phiếu nhập" });
    }

    if (receipt.status === 0) {
      return res
        .status(400)
        .json({ message: "Phiếu nhập này đã bị hủy trước đó rồi" });
    }

    // Lấy chi tiết phiếu nhập
    const details = await PurchaseReceipt.getDetails(receipt_id);

    // Kiểm tra an toàn: Tồn kho hiện tại có đủ để trừ không (tránh bị bán mất không cho hủy)
    for (const item of details) {
      const currentVariant = await PurchaseReceipt.findVariantById(
        client,
        item.variant_id,
      );

      if (!currentVariant) {
        throw new Error(`Không tìm thấy biến thể ID ${item.variant_id}`);
      }

      if (currentVariant.stock_quantity < item.quantity) {
        throw new Error(
          `Không thể hủy phiếu! Biến thể SKU [${currentVariant.sku}] đã được bán một phần, tồn kho hiện tại (${currentVariant.stock_quantity}) không đủ để thu hồi lượng nhập (${item.quantity}).`,
        );
      }
    }

    // Cập nhật trạng thái phiếu thành Đã hủy (status = 0)
    await client.query(
      `UPDATE purchase_receipts SET status = 0 WHERE id = $1`,
      [receipt_id],
    );

    // Trừ tồn kho và khôi phục lại giá vốn từ phiếu nhập gần nhất trước đó
    for (const item of details) {
      await PurchaseReceipt.rollbackStockAndRecalculateCost(
        client,
        item.variant_id,
        item.quantity,
        receipt_id, // Truyền thêm ID phiếu hiện tại để loại trừ khi tìm phiếu trước đó
      );
    }

    await client.query("COMMIT");
    res
      .status(200)
      .json({ message: "Hủy phiếu nhập và khôi phục giá vốn thành công!" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(400).json({ message: error.message });
  } finally {
    client.release();
  }
};
module.exports = {
  getAllPurchaseReceipts,
  getPurchaseReceiptById,
  createPurchaseReceipt,
  getVariantsBySupplierId,
  cancelPurchaseReceipt,
};
