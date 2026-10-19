const Statistics = require("../../models/Statistics");

exports.getAllStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const overview = await Statistics.getOverview(startDate, endDate);
    const monthlyRevenue = await Statistics.getMonthlyRevenue();
    const profitByProduct = await Statistics.getProfitByProduct(
      startDate,
      endDate,
    );
    const monthlyProfit = await Statistics.getMonthlyProfit();
    const ordersStatus = await Statistics.getOrdersStatusCount();
    const topProducts = await Statistics.getTopSellingProducts();
    const revenueByCategory = await Statistics.getRevenueByCategory();
    const topCustomers = await Statistics.getTopCustomers();
    const revenueByPayment = await Statistics.getRevenueByPaymentMethod();
    const leastProducts = await Statistics.getLeastSellingProducts();
    const orderFulfillment = await Statistics.getOrderFulfillmentMetrics(
      startDate,
      endDate,
    );
    const aovMetrics = await Statistics.getAverageOrderValue(
      startDate,
      endDate,
    );
    const employeePerformance = await Statistics.getEmployeePerformance(
      startDate,
      endDate,
    );
    const ordersByHour = await Statistics.getOrdersHeatmapByHour(
      startDate,
      endDate,
    );

    res.json({
      success: true,
      data: {
        overview,
        monthlyRevenue,
        profitByProduct,
        monthlyProfit,
        ordersStatus,
        topProducts,
        revenueByCategory,
        topCustomers,
        revenueByPayment,
        leastProducts,
        orderFulfillment,
        aovMetrics,
        employeePerformance,
        ordersByHour,
      },
    });
  } catch (error) {
    console.error("Lỗi lấy dữ liệu thống kê:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi lấy dữ liệu thống kê" });
  }
};
