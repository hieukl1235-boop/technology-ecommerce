const pool = require("../config/db");

// order_status:
// 1: Chờ xử lý
// 2: Đã xác nhận
// 3: Đang giao hàng
// 4: Đã giao hàng (Đã hoàn thành)
// 5: Đã hủy
//
// payment_status = 1: Đã thanh toán

class Statistics {
  // Hàm hỗ trợ lọc ngày, bao gồm toàn bộ ngày kết thúc.
  // Dùng cho các truy vấn có bí danh bảng orders là o.
  static getOrderDateCondition(startDate, endDate, alias = "o") {
    if (!startDate || !endDate) {
      return { condition: "", params: [] };
    }

    return {
      condition: `
        AND ${alias}.order_date >= $1::date
        AND ${alias}.order_date < ($2::date + INTERVAL '1 day')
      `,
      params: [startDate, endDate],
    };
  }

  // 1. Thống kê tổng quan
  static async getOverview(startDate = null, endDate = null) {
    const { condition, params } = this.getOrderDateCondition(
      startDate,
      endDate,
      "o",
    );

    const query = `
      SELECT
        (
          SELECT COUNT(*)
          FROM orders o
          WHERE o.order_status <> 5 ${condition}
        ) AS total_orders,

        (
          SELECT COALESCE(SUM(o.total_amount), 0)
          FROM orders o
          WHERE o.order_status = 4
            AND o.payment_status = 1
            ${condition}
        ) AS total_revenue,

        (
          SELECT COUNT(*)
          FROM products
          WHERE status = 1
        ) AS total_products,

        (
          SELECT COUNT(*)
          FROM users
          WHERE status = 1
        ) AS total_users;
    `;

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  // 2. Doanh thu 12 tháng trong năm hiện tại
  static async getMonthlyRevenue() {
    const result = await pool.query(`
      SELECT
        TO_CHAR(months.month, 'MM/YYYY') AS month,
        COALESCE(SUM(o.total_amount), 0) AS revenue
      FROM generate_series(
        DATE_TRUNC('year', CURRENT_DATE),
        DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '11 months',
        INTERVAL '1 month'
      ) AS months(month)
      LEFT JOIN orders o
        ON DATE_TRUNC('month', o.order_date) = months.month
        AND o.order_status = 4
        AND o.payment_status = 1
      GROUP BY months.month
      ORDER BY months.month;
    `);

    return result.rows;
  }

  // 3. Lợi nhuận theo sản phẩm
  static async getProfitByProduct(startDate = null, endDate = null) {
    const { condition, params } = this.getOrderDateCondition(
      startDate,
      endDate,
      "o",
    );

    const result = await pool.query(
      `
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        p.main_image,
        v.sku AS variant_sku,
        SUM(od.quantity) AS total_sold_quantity,
        SUM(od.quantity * od.unit_price) AS total_revenue,
        SUM(od.quantity * od.cost_price) AS total_cost,
        SUM(
          od.quantity * (od.unit_price - od.cost_price)
        ) AS total_profit
      FROM order_details od
      JOIN orders o ON od.order_code = o.order_code
      JOIN product_variants v ON od.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      WHERE o.order_status = 4
        AND o.payment_status = 1
        ${condition}
      GROUP BY
        p.id, p.name, p.main_image, v.sku
      ORDER BY total_profit DESC;
      `,
      params,
    );

    return result.rows;
  }

  // 4. Lợi nhuận 12 tháng trong năm hiện tại
  static async getMonthlyProfit() {
    const result = await pool.query(`
      SELECT
        TO_CHAR(months.month, 'MM/YYYY') AS month,
        COALESCE(
          SUM(
            od.quantity * (od.unit_price - od.cost_price)
          ),
          0
        ) AS profit
      FROM generate_series(
        DATE_TRUNC('year', CURRENT_DATE),
        DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '11 months',
        INTERVAL '1 month'
      ) AS months(month)
      LEFT JOIN orders o
        ON DATE_TRUNC('month', o.order_date) = months.month
        AND o.order_status = 4
        AND o.payment_status = 1
      LEFT JOIN order_details od
        ON o.order_code = od.order_code
      GROUP BY months.month
      ORDER BY months.month;
    `);

    return result.rows;
  }

  // 5. Thống kê số lượng đơn theo trạng thái
  static async getOrdersStatusCount() {
    const result = await pool.query(`
      SELECT
        order_status,
        COUNT(*) AS count
      FROM orders
      GROUP BY order_status
      ORDER BY order_status;
    `);

    return result.rows;
  }

  // 6. Top 5 sản phẩm bán chạy
  static async getTopSellingProducts() {
    const result = await pool.query(`
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        p.main_image,
        SUM(od.quantity) AS total_sold
      FROM order_details od
      JOIN orders o ON od.order_code = o.order_code
      JOIN product_variants v ON od.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      WHERE o.order_status = 4
        AND o.payment_status = 1
      GROUP BY p.id, p.name, p.main_image
      ORDER BY total_sold DESC
      LIMIT 5;
    `);

    return result.rows;
  }

  // 7. Doanh thu theo danh mục sản phẩm
  static async getRevenueByCategory() {
    const result = await pool.query(`
      SELECT
        c.id AS category_id,
        c.name AS category_name,
        COALESCE(
          SUM(od.quantity * od.unit_price),
          0
        ) AS revenue,
        COALESCE(SUM(od.quantity), 0) AS total_items_sold
      FROM order_details od
      JOIN orders o ON od.order_code = o.order_code
      JOIN product_variants v ON od.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE o.order_status = 4
        AND o.payment_status = 1
      GROUP BY c.id, c.name
      ORDER BY revenue DESC;
    `);

    return result.rows;
  }

  // 8. Top 5 khách hàng mua nhiều nhất
  static async getTopCustomers() {
    const result = await pool.query(`
      SELECT
        u.id AS user_id,
        u.full_name,
        u.email,
        COUNT(o.order_code) AS total_orders,
        SUM(o.total_amount) AS total_spent
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.order_status = 4
        AND o.payment_status = 1
      GROUP BY u.id, u.full_name, u.email
      ORDER BY total_spent DESC
      LIMIT 5;
    `);

    return result.rows;
  }

  // 9. Doanh thu theo phương thức thanh toán
  static async getRevenueByPaymentMethod() {
    const result = await pool.query(`
      SELECT
        pm.id AS payment_method_id,
        pm.name AS payment_method_name,
        COUNT(o.order_code) AS total_orders,
        COALESCE(SUM(o.total_amount), 0) AS total_revenue
      FROM orders o
      JOIN payment_methods pm
        ON o.payment_method_id = pm.id
      WHERE o.order_status = 4
        AND o.payment_status = 1
      GROUP BY pm.id, pm.name
      ORDER BY total_revenue DESC;
    `);

    return result.rows;
  }

  // 10. Top 5 sản phẩm bán ít nhất
  // Chỉ tính số lượng của đơn đã giao thành công.
  static async getLeastSellingProducts() {
    const result = await pool.query(`
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        p.main_image,
        COALESCE(
          SUM(
            CASE
              WHEN o.order_status = 4
              THEN od.quantity
              ELSE 0
            END
          ),
          0
        ) AS total_sold
      FROM products p
      LEFT JOIN product_variants v
        ON p.id = v.product_id
      LEFT JOIN order_details od
        ON v.id = od.variant_id
      LEFT JOIN orders o
        ON od.order_code = o.order_code
      WHERE p.status = 1
      GROUP BY p.id, p.name, p.main_image
      ORDER BY total_sold ASC, p.id ASC
      LIMIT 5;
    `);

    return result.rows;
  }

  // 11. Số lượng và tỷ lệ đơn theo trạng thái
  static async getOrderFulfillmentMetrics(startDate = null, endDate = null) {
    const { condition, params } = this.getOrderDateCondition(
      startDate,
      endDate,
      "o",
    );

    const result = await pool.query(
      `
      SELECT
        o.order_status,
        COUNT(*) AS count,
        ROUND(
          COUNT(*) * 100.0 /
          NULLIF(
            (
              SELECT COUNT(*)
              FROM orders o2
              WHERE 1 = 1
              ${
                startDate && endDate
                  ? `AND o2.order_date >= $1::date
                     AND o2.order_date < ($2::date + INTERVAL '1 day')`
                  : ""
              }
            ),
            0
          ),
          2
        ) AS percentage
      FROM orders o
      WHERE 1 = 1 ${condition}
      GROUP BY o.order_status
      ORDER BY o.order_status;
      `,
      params,
    );

    return result.rows;
  }

  // 12. Giá trị đơn hàng trung bình (AOV)
  static async getAverageOrderValue(startDate = null, endDate = null) {
    const { condition, params } = this.getOrderDateCondition(
      startDate,
      endDate,
      "o",
    );

    const result = await pool.query(
      `
      SELECT
        COALESCE(AVG(o.total_amount), 0) AS avg_order_value,
        COALESCE(MAX(o.total_amount), 0) AS max_order_value,
        COALESCE(MIN(o.total_amount), 0) AS min_order_value
      FROM orders o
      WHERE o.order_status = 4
        AND o.payment_status = 1
        ${condition};
      `,
      params,
    );

    return result.rows[0];
  }

  // 13. Hiệu suất nhân viên xử lý đơn
  static async getEmployeePerformance(startDate = null, endDate = null) {
    const { condition, params } = this.getOrderDateCondition(
      startDate,
      endDate,
      "o",
    );

    const result = await pool.query(
      `
      SELECT
        e.id AS employee_id,
        e.full_name AS employee_name,
        COUNT(o.order_code) AS total_orders_handled,
        COALESCE(SUM(o.total_amount), 0)
          AS total_revenue_generated
      FROM orders o
      JOIN employees e ON o.employee_id = e.id
      WHERE o.order_status = 4
        AND o.payment_status = 1
        ${condition}
      GROUP BY e.id, e.full_name
      ORDER BY total_revenue_generated DESC;
      `,
      params,
    );

    return result.rows;
  }

  // 14. Khung giờ đặt hàng cao điểm
  static async getOrdersHeatmapByHour(startDate = null, endDate = null) {
    const { condition, params } = this.getOrderDateCondition(
      startDate,
      endDate,
      "o",
    );

    const result = await pool.query(
      `
      SELECT
        EXTRACT(HOUR FROM o.order_date) AS hour_of_day,
        COUNT(*) AS total_orders
      FROM orders o
      WHERE o.order_status <> 5
        ${condition}
      GROUP BY hour_of_day
      ORDER BY hour_of_day ASC;
      `,
      params,
    );

    return result.rows;
  }
}

module.exports = Statistics;
