const pool = require("../config/db");

class PurchaseReceipt {
  // Lấy danh sách phiếu nhập
  static async getAll() {
    const result = await pool.query(
      `SELECT
                pr.id,
                pr.employee_id,
                pr.supplier_id,
                pr.received_at,
                pr.total_amount,
                pr.note,
                pr.status,

                e.full_name AS employee_name,
                s.name AS supplier_name

             FROM purchase_receipts pr

             LEFT JOIN employees e
                ON pr.employee_id = e.id

             LEFT JOIN suppliers s
                ON pr.supplier_id = s.id

             ORDER BY pr.id DESC`,
    );

    return result.rows;
  }
  static async findVariantById(client, variant_id) {
    const result = await client.query(
      `SELECT * FROM product_variants WHERE id = $1`,
      [variant_id],
    );
    return result.rows[0];
  }

  // Tìm phiếu nhập theo ID
  static async findById(id) {
    const result = await pool.query(
      `SELECT
                pr.*,
                e.full_name AS employee_name,
                s.name AS supplier_name

             FROM purchase_receipts pr

             LEFT JOIN employees e
                ON pr.employee_id = e.id

             LEFT JOIN suppliers s
                ON pr.supplier_id = s.id

             WHERE pr.id = $1`,
      [id],
    );

    return result.rows[0];
  }

  // Lấy chi tiết các biến thể trong phiếu nhập
  static async getDetails(id) {
    const result = await pool.query(
      `SELECT
                prd.purchase_receipt_id,
                prd.variant_id,
                prd.quantity,
                prd.purchase_price,
                prd.total_price,

                pv.sku,
                p.name AS product_name,
                pv.image_url

             FROM purchase_receipt_details prd

             JOIN product_variants pv
                ON prd.variant_id = pv.id

             JOIN products p
                ON pv.product_id = p.id

             WHERE prd.purchase_receipt_id = $1`,
      [id],
    );

    return result.rows;
  }

  // Kiểm tra nhà cung cấp có tồn tại
  static async findSupplier(id) {
    const result = await pool.query(
      `SELECT id
             FROM suppliers
             WHERE id = $1
             AND status = 1`,
      [id],
    );

    return result.rows[0];
  }

  // Kiểm tra biến thể có thuộc nhà cung cấp không
  static async checkVariantSupplier(client, variant_id, supplier_id) {
    const result = await client.query(
      `SELECT vs.variant_id
             FROM variant_suppliers vs

             JOIN product_variants pv
                ON vs.variant_id = pv.id

             WHERE vs.variant_id = $1
             AND vs.supplier_id = $2
             AND pv.status = 1`,
      [variant_id, supplier_id],
    );

    return result.rows[0];
  }

  // Tạo phiếu nhập
  static async create(client, employee_id, supplier_id, total_amount, note) {
    const result = await client.query(
      `INSERT INTO purchase_receipts
                (
                    employee_id,
                    supplier_id,
                    total_amount,
                    note
                )
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
      [employee_id, supplier_id, total_amount, note],
    );

    return result.rows[0];
  }

  // Thêm chi tiết phiếu nhập
  static async createDetail(
    client,
    purchase_receipt_id,
    variant_id,
    quantity,
    purchase_price,
    total_price,
  ) {
    const result = await client.query(
      `INSERT INTO purchase_receipt_details
                (
                    purchase_receipt_id,
                    variant_id,
                    quantity,
                    purchase_price,
                    total_price
                )
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
      [purchase_receipt_id, variant_id, quantity, purchase_price, total_price],
    );

    return result.rows[0];
  }

  // Cộng tồn kho biến thể
  // Cập nhật tồn kho và tính lại giá vốn theo phương pháp Bình quân gia quyền
  static async updateStockAndMovingAverageCost(
    client,
    variant_id,
    new_quantity,
    new_purchase_price,
  ) {
    const result = await client.query(
      `UPDATE product_variants
       SET 
         cost_price = CASE 
           -- Nếu tồn kho hiện tại + số lượng mới > 0, tính bình quân
           WHEN (stock_quantity + $1) > 0 
           THEN ((stock_quantity * cost_price) + ($1 * $2)) / (stock_quantity + $1)
           ELSE $2 
         END,
         stock_quantity = stock_quantity + $1
       WHERE id = $3
       RETURNING *`,
      [new_quantity, new_purchase_price, variant_id],
    );

    return result.rows[0];
  }

  // [LÚC HỦY PHIẾU]: Trừ tồn kho và tính lại giá vốn bình quân từ các phiếu còn sống (status = 1)
  // [LÚC HỦY PHIẾU]: Trừ tồn kho và khôi phục giá vốn về phiếu nhập gần nhất trước đó (còn hiệu lực)
  static async rollbackStockAndRecalculateCost(
    client,
    variant_id,
    cancelled_quantity,
    current_receipt_id,
  ) {
    const result = await client.query(
      `UPDATE product_variants pv
       SET 
         stock_quantity = stock_quantity - $1,
         
         -- Lấy giá nhập của phiếu nhập gần nhất TRƯỚC ĐÓ (status = 1 và khác phiếu đang hủy)
         cost_price = COALESCE((
           SELECT prd.purchase_price
           FROM purchase_receipt_details prd
           JOIN purchase_receipts pr ON prd.purchase_receipt_id = pr.id
           WHERE prd.variant_id = pv.id 
             AND pr.status = 1 
             AND pr.id != $2
           ORDER BY pr.received_at DESC, pr.id DESC
           LIMIT 1
         ), 0) -- Nếu không còn phiếu nào trước đó, giá vốn về 0
         
       WHERE pv.id = $3
       RETURNING *`,
      [cancelled_quantity, current_receipt_id, variant_id],
    );
    return result.rows[0];
  }
}


module.exports = PurchaseReceipt;
