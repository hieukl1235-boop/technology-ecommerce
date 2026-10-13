const Cart = require("../../models/Cart");

const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const { variant_id, quantity } = req.body;

    // Kiểm tra dữ liệu
    if (!variant_id || !quantity) {
      return res.status(400).json({
        message: "Thiếu variant_id hoặc quantity",
      });
    }

    // Tìm giỏ hàng của user
    let cart = await Cart.findByUserId(userId);

    // Nếu chưa có giỏ hàng thì tạo
    if (!cart) {
      cart = await Cart.create(userId);
    }

    // Kiểm tra sản phẩm đã có trong giỏ chưa
    const existingItem = await Cart.findItem(cart.id, variant_id);

    // Nếu đã có
    if (existingItem) {
      const item = await Cart.increaseQuantity(
        existingItem.cart_id,
        existingItem.variant_id,
        quantity,
      );

      return res.status(200).json({
        message: "Đã tăng số lượng sản phẩm trong giỏ hàng",
        item: item,
      });
    }

    // Nếu chưa có
    const item = await Cart.addItem(cart.id, variant_id, quantity);

    return res.status(201).json({
      message: "Thêm sản phẩm vào giỏ hàng thành công",
      item: item,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Lỗi server",
    });
  }
};

const getCartByUserId = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findByUserId(userId);
    const items = await Cart.getAllItems(cart.id);

    return res.status(200).json(items);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const updateQuantityByCartItem = async (req, res) => {
  try {
    const { cartId, variantId, quantity } = req.body;
    console.log("body nhận được:", req.body);
    const qty = Number(quantity);

    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ message: "Số lượng không hợp lệ" });
    }

    const updated = await Cart.updateQuantity(cartId, variantId, qty); // ← có await

    if (!updated) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy sản phẩm trong giỏ" });
    }

    res.status(200).json({ message: "Thành công", data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
  
};

// Hàm xóa sản phẩm khỏi giỏ hàng
const removeCartItem = async (req, res) => {
  try {
    // Lấy cartId và variantId từ request params hoặc request body (tùy theo cách bạn định nghĩa route)
    // Ví dụ ở đây dùng req.params: /api/cart/:cartId/item/:variantId
    // Hoặc nếu bạn truyền qua req.body thì đổi thành const { cartId, variantId } = req.body;
    const { cartId, variantId } = req.body;

    // Kiểm tra xem dữ liệu truyền lên có đầy đủ không
    if (!cartId || !variantId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin cartId hoặc variantId!",
      });
    }

    // Gọi hàm từ Model để thực hiện xóa trong Database
    const deletedItem = await Cart.removeItem(cartId, variantId);

    // Kiểm tra xem sản phẩm đó có tồn tại trong giỏ hàng để xóa hay không
    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm trong giỏ hàng để xóa!",
      });
    }

    // Trả về kết quả thành công cho Frontend
    return res.status(200).json({
      success: true,
      message: "Đã xóa sản phẩm khỏi giỏ hàng thành công!",
      data: deletedItem,
    });
  } catch (error) {
    console.error("Lỗi khi xóa sản phẩm khỏi giỏ hàng:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ!",
    });
  }
};


module.exports = {
  addToCart,
  getCartByUserId,
  updateQuantityByCartItem,
  removeCartItem,
};
