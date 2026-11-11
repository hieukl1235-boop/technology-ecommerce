const express = require("express");
const cors = require("cors");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io"); // thêm
const authRoutes = require("./src/routes/auth/authRoutes");
const employeeAuthRoutes = require("./src/routes/auth/employeeAuthRoutes");
const pool = require("./src/config/db");
const categoryRoutes = require("./src/routes/admin/categoryRoutes");
const brandRoutes = require("./src/routes/admin/brandRoutes");
const attributeRoutes = require("./src/routes/admin/attributeRoutes");
const attributeValueRoutes = require("./src/routes/admin/attributeValueRoutes");
const productRoutes = require("./src/routes/admin/productRoutes");
const supplierRoutes = require("./src/routes/admin/supplierRoutes");
const variantSupplierRoutes = require("./src/routes/admin/variantSupplierRoutes");
const employeeRoutes = require("./src/routes/admin/employeeRoutes");
const userRoutes = require("./src/routes/admin/userRoutes");
const purchaseReceiptRoutes = require("./src/routes/admin/purchaseReceiptRoutes");
const couponRoutes = require("./src/routes/admin/couponRoutes");
const productHomeRoutes = require("./src/routes/user/productRoutes");
const cartRoutes = require("./src/routes/user/cartRoutes");
const productVariantRoutes = require("./src/routes/user/productVarianRouter");
const bannerRoutes = require("./src/routes/admin/bannerRoutes");
const accountRoutes = require("./src/routes/user/accountRoutes");
const chatRoutes = require("./src/routes/user/chatRoutes");
const NotificationRoutes = require("./src/routes/admin/notificationRoutes")
const statisticsRoutes = require("./src/routes/admin/statisticsRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("src/uploads"));
app.use("/api/auth", authRoutes);
app.use("/api/employee/auth", employeeAuthRoutes);
app.use("/api/employee/auth", employeeAuthRoutes);
app.use("/api/admin/categories", categoryRoutes);
app.use("/api/admin/brands", brandRoutes);
app.use("/api/admin/attributes", attributeRoutes);
app.use("/api/admin/attribute-values", attributeValueRoutes);
app.use("/api/admin/products", productRoutes);
app.use("/api/admin/suppliers", supplierRoutes);
app.use("/api/admin/variants", variantSupplierRoutes);
app.use("/api/admin/users", userRoutes);
app.use("/api/admin/employees", employeeRoutes);
app.use("/api/admin/purchase-receipts", purchaseReceiptRoutes);
app.use("/api/admin/coupons", couponRoutes);
app.use("/api/payment-methods", require("./src/routes/user/paymentRoutes"));
app.use("/api/products", productHomeRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/admin/banners", bannerRoutes);
app.use("/api/product-variants", productVariantRoutes);
app.use("/api/user/account", accountRoutes);
app.use("/api/user/addresses", require("./src/routes/user/addressRoutes"));
const checkoutRoutes = require("./src/routes/user/checkoutRoutes");
app.use("/api/checkout", checkoutRoutes);
app.use("/api/coupons", require("./src/routes/user/couponRoutes"));
app.use("/api/orders", require("./src/routes/user/orderRoutes"));
app.use("/api/admin/orders", require("./src/routes/admin/orderRoutes"));
app.use("/api/shipper/orders", require("./src/routes/shipper/orderRoutes"));
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", NotificationRoutes);
app.use("/api/admin/statistics", statisticsRoutes);
app.use("/api/admin/reviews", require("./src/routes/admin/reviewRoutes"));
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  // console.log("Socket kết nối thành công:", socket.id);

  socket.on("disconnect", (reason) => {
    // console.log("Socket ngắt kết nối:", socket.id, reason);
  });
});

require("./src/sockets/chatSocket")(io);

server.listen(3000, () => {
  console.log("Server chạy tại http://localhost:3000");
});
