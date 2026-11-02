const pool = require("../config/db");
const dateFormat = require("dateformat");

const OrderModel = {
  async getAllOrders() {
    const query = `
      SELECT 
        o.*,
        dp.image_url AS delivery_proof_id, -- 🟢 Lấy image_url từ bảng delivery_proofs và map đúng tên mà Frontend đang mong đợi
        json_agg(
          json_build_object(
            'product_name', p.name,
            'sku', pv.sku,
            'quantity', od.quantity,
            'unit_price', od.unit_price,
            'image', pv.image_url
          )
        ) AS items
      FROM orders o
      LEFT JOIN delivery_proofs dp ON o.delivery_proof_id = dp.id -- 🟢 JOIN sang bảng delivery_proofs
      LEFT JOIN order_details od ON o.order_code = od.order_code
      LEFT JOIN product_variants pv ON od.variant_id = pv.id
      LEFT JOIN products p ON pv.product_id = p.id
      GROUP BY o.order_code, dp.image_url -- 🟢 Gom nhóm thêm cột dp.image_url
      ORDER BY o.order_date DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
  },
  async getUserByOrderCode(orderCode) {
    const result = await pool.query(
      `SELECT o.user_id
     FROM orders o
     WHERE o.order_code = $1`,
      [orderCode],
    );

    return result.rows[0];
  },
  async createOrder(orderData) {
    const {
      user_id,
      payment_method_id,
      coupon_id,
      recipient_name,
      phone,
      shipping_address,
      shipping_fee, // 🟢 Nhận thêm shipping_fee từ controller
      total_amount,
      payment_status,
      order_status,
    } = orderData;

    const orderCode = "ORD-" + Date.now();

    // 🟢 Đảm bảo bảng orders của bạn có cột shipping_fee
    const query = `
      INSERT INTO orders (
        order_code, user_id, payment_method_id, coupon_id, recipient_name, phone, 
        shipping_address, shipping_fee, order_date, total_amount, payment_status, order_status
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, $11) 
      RETURNING order_code
    `;

    const values = [
      orderCode,
      user_id,
      payment_method_id,
      coupon_id || null,
      recipient_name,
      phone,
      shipping_address,
      shipping_fee || 0, // Lưu phí ship, mặc định là 0 nếu không truyền
      total_amount,
      payment_status !== undefined ? payment_status : 0,
      order_status !== undefined ? order_status : 1,
    ];

    const result = await pool.query(query, values);

    if (coupon_id) {
      await pool.query(
        "UPDATE coupons SET used_quantity = used_quantity + 1 WHERE id = $1",
        [coupon_id],
      );
    }

    return result.rows[0].order_code;
  },

  // Trong OrderModel
  async createOrderDetails(orderCode, items) {
    for (let item of items) {
      const unitPrice = item.sale_price
        ? Number(item.sale_price)
        : Number(item.selling_price);

      // 1. Lấy giá nhập (cost_price) hiện tại của biến thể sản phẩm từ database
      const variantQuery = `SELECT cost_price FROM product_variants WHERE id = $1`;
      const variantRes = await pool.query(variantQuery, [item.variant_id]);

      // Nếu bảng product_variants có cột cost_price, ta lấy ra. Nếu không có thì mặc định là 0.
      const costPrice =
        variantRes.rows.length > 0 && variantRes.rows[0].cost_price
          ? Number(variantRes.rows[0].cost_price)
          : 0;

      const totalPrice = unitPrice * item.quantity;

      // 2. Lưu đồng thời giá bán (unit_price) và giá vốn (cost_price) vào order_details
      const query = `
      INSERT INTO order_details (order_code, variant_id, quantity, unit_price, cost_price, total_price) 
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
      await pool.query(query, [
        orderCode,
        item.variant_id,
        item.quantity,
        unitPrice,
        costPrice,
        totalPrice,
      ]);
    }
    return true;
  },

  async updateOrderStatus(orderCode, newStatus) {
    const query = `UPDATE orders SET order_status = $1 WHERE order_code = $2 RETURNING *`;
    const result = await pool.query(query, [newStatus, orderCode]);
    return result.rows[0];
  },
  async assignShipperAndStatus(orderCode, newStatus, employeeId) {
    const query = `
      UPDATE orders 
      SET order_status = $1, employee_id = $2 
      WHERE order_code = $3 
      RETURNING *
    `;
    const result = await pool.query(query, [newStatus, employeeId, orderCode]);
    return result.rows[0];
  },

  async completeOrderWithProof(orderCode, proofImageFilename) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN"); // Bắt đầu transaction

      // Bước 1: Thêm ảnh vào bảng delivery_proofs và lấy về ID tự tăng vừa sinh ra
      const insertProofQuery = `
        INSERT INTO delivery_proofs (image_url, delivered_at) 
        VALUES ($1, NOW()) 
        RETURNING id, image_url, delivered_at
      `;
      const proofResult = await client.query(insertProofQuery, [
        proofImageFilename,
      ]);
      const proofId = proofResult.rows[0].id;

      // Bước 2: Cập nhật orders (trạng thái thành 4, và điền delivery_proof_id vào)
      const updateOrderQuery = `
        UPDATE orders 
        SET order_status = 4, 
            payment_status = 1, 
            delivery_proof_id = $1 
        WHERE order_code = $2 
        RETURNING *
      `;
      const orderResult = await client.query(updateOrderQuery, [
        proofId,
        orderCode,
      ]);

      await client.query("COMMIT"); // Hoàn tất thành công
      return {
        order: orderResult.rows[0],
        proof: proofResult.rows[0],
      };
    } catch (error) {
      await client.query("ROLLBACK"); // Hoàn tác nếu có lỗi
      throw error;
    } finally {
      client.release(); // Trả kết nối
    }
  },

  async cancelAndRestockOrder(orderCode) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Lấy thông tin đơn hàng hiện tại
      const checkQuery = `SELECT order_status, coupon_id,payment_status FROM orders WHERE order_code = $1   FOR UPDATE
`;
      const checkResult = await client.query(checkQuery, [orderCode]);
      const order = checkResult.rows[0];

      if (!order) {
        throw new Error("Không tìm thấy đơn hàng trong hệ thống.");
      }

      // Cho phép hủy ở trạng thái 1, 2 (chưa giao) hoặc 6 (giao thất bại cần hoàn kho)
      if (![1, 2, 6].includes(order.order_status)) {
        throw new Error("Đơn hàng không ở trạng thái cho phép hủy.");
      }

      if (order.coupon_id) {
        const coupon = `
    UPDATE coupons
    SET used_quantity = used_quantity - 1
    WHERE id = $1 AND used_quantity > 0
    RETURNING id, used_quantity
  `;

        const result = await client.query(coupon, [order.coupon_id]);

        console.log("coupon_id:", order.coupon_id);
        console.log("Kết quả cập nhật coupon:", result.rows);
      } else {
        console.log("Đơn hàng không có coupon_id:", order);
      }

      // 2. Lấy danh sách sản phẩm chi tiết trong đơn hàng (gồm variant_id, quantity, cost_price lúc bán)
      const itemsQuery = `SELECT variant_id, quantity, cost_price FROM order_details WHERE order_code = $1`;
      const itemsResult = await client.query(itemsQuery, [orderCode]);
      const orderItems = itemsResult.rows;

      // 3. Vòng lặp hoàn kho và tính lại giá gốc trung bình cho từng biến thể
      for (let item of orderItems) {
        const variantId = item.variant_id;
        const returnQty = Number(item.quantity);
        const itemCostPrice = Number(item.cost_price || 0);

        // 3.1. Lấy thông tin tồn kho và giá gốc hiện tại của biến thể trong kho
        const variantQuery = `SELECT stock_quantity, cost_price FROM product_variants WHERE id = $1`;
        const variantRes = await client.query(variantQuery, [variantId]);

        if (variantRes.rows.length > 0) {
          const currentStock = Number(variantRes.rows[0].stock_quantity || 0);
          const currentCost = Number(variantRes.rows[0].cost_price || 0);

          let newStock = currentStock + returnQty;
          let newCost = currentCost;

          // 3.2. Tính toán giá gốc trung bình gia quyền nếu tổng tồn kho mới > 0
          if (newStock > 0) {
            const totalOldValue = currentStock * currentCost;
            const totalReturnValue = returnQty * itemCostPrice;
            newCost = (totalOldValue + totalReturnValue) / newStock;
          }

          // 3.3. Cập nhật lại stock_quantity và cost_price mới vào product_variants
          const updateVariantQuery = `
            UPDATE product_variants 
            SET stock_quantity = $1, 
                cost_price = $2 
            WHERE id = $3
          `;
          await client.query(updateVariantQuery, [
            newStock,
            newCost,
            variantId,
          ]);
        }
      }

      // 4. Cập nhật trạng thái đơn hàng thành 5 (Đã hủy)
      const updateOrderQuery = `
        UPDATE orders 
        SET order_status = 5 
        WHERE order_code = $1 
        RETURNING *
      `;
      const updateResult = await client.query(updateOrderQuery, [orderCode]);

      await client.query("COMMIT");
      return {
        updatedOrder: updateResult.rows[0],
        needsRefund: order.payment_status === 1, // Báo cờ nếu cần hoàn tiền
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  // Lấy danh sách đơn hàng theo shipper_id
  async getShipperOrders(shipperId) {
    const query = `
      SELECT 
        o.*,
        dp.image_url AS delivery_proof_id,
        json_agg(
          json_build_object(
            'product_name', p.name,
            'sku', pv.sku,
            'quantity', od.quantity,
            'unit_price', od.unit_price,
            'image', pv.image_url
          )
        ) AS items
      FROM orders o
      LEFT JOIN delivery_proofs dp ON o.delivery_proof_id = dp.id
      LEFT JOIN order_details od ON o.order_code = od.order_code
      LEFT JOIN product_variants pv ON od.variant_id = pv.id
      LEFT JOIN products p ON pv.product_id = p.id
      WHERE o.employee_id = $1 -- 🟢 Lọc chính xác đơn hàng phân công cho shipper này
      GROUP BY o.order_code, dp.image_url
      ORDER BY o.order_date DESC;
    `;
    const result = await pool.query(query, [shipperId]);
    return result.rows;
  },

  // Xử lý giao thất bại (Trạng thái 6) kèm ảnh minh chứng lý do
  async failOrderWithReason(orderCode, reason) {
    const query = `
      UPDATE orders 
      SET order_status = 6, 
          note = $1 -- Hoặc đổi tên cột 'note' thành tên cột lưu lý do trong bảng orders của bạn
      WHERE order_code = $2 
      RETURNING *
    `;
    const result = await pool.query(query, [reason, orderCode]);
    return result.rows[0];
  },

  async refundOrder(orderCode, refundImageFilename) {
    const query = `
      UPDATE orders 
      SET payment_status = 2, -- Giả sử 2 là trạng thái "Đã hoàn tiền"
          refund_image_url = $1
      WHERE order_code = $2 
      RETURNING *
    `;
    const result = await pool.query(query, [refundImageFilename, orderCode]);
    return result.rows[0];
  },
  // Kiểm tra đơn hàng có thuộc về user hay không (tránh lỗ hổng bảo mật IDOR)
  async checkOrderBelongsToUser(orderCode, userId) {
    const query = `SELECT order_code FROM orders WHERE order_code = $1 AND user_id = $2`;
    const { rows } = await pool.query(query, [orderCode, userId]);
    return rows.length > 0;
  },

  async getOrderByCodeAndUserId(orderCode, userId) {
    const query = `
      SELECT 
       o.*, dp.image_url AS delivery_proof_image,
        COALESCE(
          json_agg(
            json_build_object(
              'variant_id', od.variant_id, 
              'product_name', p.name,
              'sku', v.sku,
              'quantity', od.quantity,
              'unit_price', od.unit_price,
              'image', v.image_url
            )
          ) FILTER (WHERE od.variant_id IS NOT NULL), '[]'
        ) as items
      FROM orders o
      LEFT JOIN order_details od ON o.order_code = od.order_code
      LEFT JOIN product_variants v ON od.variant_id = v.id
      LEFT JOIN products p ON v.product_id = p.id
      LEFT JOIN delivery_proofs dp ON o.delivery_proof_id = dp.id
      WHERE o.order_code = $1 AND o.user_id = $2
      GROUP BY o.order_code, dp.image_url;
    `;
    const { rows } = await pool.query(query, [orderCode, userId]);
    return rows[0]; // Trả về đúng 1 đối tượng đơn hàng kèm theo mảng items
  },
  async getVariantByOrder(orderCode) {
    const query = `
    SELECT od.variant_id, od.quantity, pv.selling_price,pv.sale_price,p.name as product_name,
    pv.image_url as image, pv.sku
    FROM orders o 
    JOIN order_details od
    ON o.order_code = od.order_code
    JOIN product_variants pv 
    ON pv.id = od.variant_id
    JOIN products p 
    ON p.id = pv.product_id
    WHERE o.order_code = $1
    `;
    const result = await pool.query(query, [orderCode]);
    return result.rows;
  },
};

module.exports = OrderModel;
