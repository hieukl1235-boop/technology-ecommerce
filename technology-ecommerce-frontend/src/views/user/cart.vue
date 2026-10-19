<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const cartItems = ref([])
const variantSelected = ref([])
const token = localStorage.getItem('token')
const router = useRouter()

// ============ THÔNG BÁO ============
const message = ref('')
const messageType = ref('error')
let messageTimer = null

const showMessage = (msg, type = 'error') => {
  message.value = msg
  messageType.value = type
  if (messageTimer) clearTimeout(messageTimer)
  messageTimer = setTimeout(() => {
    message.value = ''
  }, 3000)
}

// ============ MODAL XÓA ============
const showDeleteModal = ref(false)
const deleteTarget = ref(null)

// ============ LẤY GIỎ HÀNG ============
const fetchCart = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/cart', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    cartItems.value = response.data
    variantSelected.value = variantSelected.value.filter((id) =>
      cartItems.value.some((item) => item.variant_id === id),
    )
  } catch (error) {
    console.error('Lỗi tải giỏ hàng:', error)
    showMessage('Không thể tải giỏ hàng. Vui lòng thử lại.')
  }
}

// ============ TÍNH TỔNG TIỀN ============
const totalPrice = computed(() => {
  return cartItems.value.reduce((total, item) => {
    if (variantSelected.value.length > 0 && variantSelected.value.includes(item.variant_id)) {
      const price = item.sale_price ? item.sale_price : item.selling_price
      return total + price * item.quantity
    }
    return total
  }, 0)
})

// ============ ĐỔI SỐ LƯỢNG ============
const changeQuantity = async (item) => {
  let quantity = Number(item.quantity)

  if (!Number.isInteger(quantity) || quantity < 1) {
    quantity = 1
    item.quantity = 1
  }

  try {
    await axios.patch(
      'http://localhost:3000/api/cart/updateQuantity',
      { cartId: item.cart_id, variantId: item.variant_id, quantity },
      { headers: { Authorization: `Bearer ${token}` } },
    )
  } catch (error) {
    console.error('Lỗi cập nhật số lượng:', error)
  } finally {
    fetchCart()
  }
}

// ============ XÓA SẢN PHẨM ============
const deleteItem = (cartId, variantId) => {
  deleteTarget.value = { cartId, variantId }
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!deleteTarget.value) return
  const { cartId, variantId } = deleteTarget.value
  try {
    await axios.delete('http://localhost:3000/api/cart/removeItem', {
      headers: { Authorization: `Bearer ${token}` },
      data: { cartId, variantId },
    })
    showDeleteModal.value = false
    deleteTarget.value = null
    fetchCart()
  } catch (error) {
    console.error('Lỗi xóa sản phẩm khỏi giỏ hàng:', error)
    showMessage('Không thể xóa sản phẩm. Vui lòng thử lại.')
  }
}

// ============ THANH TOÁN ============
const handleCheckout = () => {
  if (variantSelected.value.length === 0) {
    showMessage('Vui lòng chọn sản phẩm để thanh toán!')
    return
  }

  const checkoutPayload = cartItems.value.filter((item) =>
    variantSelected.value.includes(item.variant_id),
  )

  localStorage.setItem('checkout_items', JSON.stringify(checkoutPayload))
  router.push('/checkout')
}

// ============ HELPERS ============
const unitPrice = (item) => Number(item.sale_price || item.selling_price)
const formatMoney = (value) => Number(value).toLocaleString('vi-VN') + ' ₫'

const stepQuantity = (item, delta) => {
  const next = Number(item.quantity) + delta
  if (next < 1) return
  item.quantity = next
  changeQuantity(item)
}

const allSelected = computed(
  () => cartItems.value.length > 0 && variantSelected.value.length === cartItems.value.length,
)

const toggleAll = (e) => {
  variantSelected.value = e.target.checked ? cartItems.value.map((item) => item.variant_id) : []
}

onMounted(() => {
  fetchCart()
})

onBeforeUnmount(() => {
  if (messageTimer) clearTimeout(messageTimer)
})
</script>

<template>
  <div class="cart-page">
    <header class="cart-top">
      <div class="cart-top-inner">
        <RouterLink to="/home" class="brand" aria-label="TechStore - Trang chủ">
          Tech<span>Store</span>
        </RouterLink>
        <RouterLink to="/home" class="back-link">← Tiếp tục mua sắm</RouterLink>
      </div>
    </header>

    <main class="cart-main">
      <h1 class="cart-title">
        Giỏ hàng
        <span v-if="cartItems.length" class="cart-count">({{ cartItems.length }} sản phẩm)</span>
      </h1>

      <!-- BANNER CẢNH BÁO -->
      <transition name="fade">
        <div v-if="message" class="cart-alert" :class="messageType === 'success' ? 'cart-alert-success' : ''">
          <span>⚠️ {{ message }}</span>
          <button type="button" @click="message = ''" aria-label="Đóng">✕</button>
        </div>
      </transition>

      <!-- GIỎ HÀNG TRỐNG -->
      <div v-if="cartItems.length === 0" class="cart-empty">
        <p class="empty-title">Giỏ hàng của bạn đang trống</p>
        <p class="empty-hint">Chọn sản phẩm bạn thích ở trang chủ để thêm vào giỏ.</p>
        <RouterLink to="/home" class="btn-link-primary">Về trang chủ</RouterLink>
      </div>

      <div v-else class="cart-layout">
        <!-- DANH SÁCH SẢN PHẨM -->
        <section class="cart-list" aria-label="Sản phẩm trong giỏ">
          <label class="select-all">
            <input type="checkbox" :checked="allSelected" @change="toggleAll" />
            <span>Chọn tất cả ({{ cartItems.length }})</span>
          </label>

          <article v-for="item in cartItems" :key="item.cart_id" class="cart-row">
            <input
              v-model="variantSelected"
              type="checkbox"
              class="row-check"
              :value="item.variant_id"
              :aria-label="`Chọn ${item.product_name}`"
            />

            <img
              v-if="item.image"
              :src="`http://localhost:3000/uploads/variants/${item.image}`"
              :alt="item.product_name"
              class="row-img"
            />
            <div v-else class="row-img row-img-empty" aria-hidden="true">Chưa có ảnh</div>

            <div class="row-info">
              <h2 class="row-name">{{ item.product_name }}</h2>
              <p class="row-sku">SKU: {{ item.sku }}</p>
              <div class="row-price">
                <span class="price-sale">{{ formatMoney(unitPrice(item)) }}</span>
                <span v-if="item.sale_price" class="price-original">
                  {{ formatMoney(item.selling_price) }}
                </span>
              </div>
            </div>

            <div class="row-side">
              <div class="stepper">
                <button
                  type="button"
                  aria-label="Giảm số lượng"
                  :disabled="item.quantity <= 1"
                  @click="stepQuantity(item, -1)"
                >
                  −
                </button>
                <input
                  v-model.number="item.quantity"
                  type="number"
                  min="1"
                  step="1"
                  aria-label="Số lượng"
                  @change="changeQuantity(item)"
                />
                <button type="button" aria-label="Tăng số lượng" @click="stepQuantity(item, 1)">
                  +
                </button>
              </div>
              <p class="row-total">{{ formatMoney(unitPrice(item) * item.quantity) }}</p>
              <button type="button" class="row-remove" @click="deleteItem(item.cart_id, item.variant_id)">
                Xóa
              </button>
            </div>
          </article>
        </section>

        <!-- TÓM TẮT ĐƠN HÀNG -->
        <aside class="cart-summary" aria-label="Tóm tắt đơn hàng">
          <h2>Tóm tắt đơn hàng</h2>
          <dl>
            <div>
              <dt>Đã chọn</dt>
              <dd>{{ variantSelected.length }} sản phẩm</dd>
            </div>
            <div class="summary-total">
              <dt>Tổng tiền</dt>
              <dd>{{ formatMoney(totalPrice) }}</dd>
            </div>
          </dl>
          <button type="button" class="btn-checkout" @click="handleCheckout">
            Tiến hành thanh toán
          </button>
          <p v-if="variantSelected.length === 0" class="summary-hint">
            Tích chọn sản phẩm để thanh toán.
          </p>
        </aside>
      </div>
    </main>

    <!-- MODAL XÁC NHẬN XÓA -->
    <transition name="fade">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
        <div class="modal-card">
          <h3>Xóa sản phẩm?</h3>
          <p>Sản phẩm sẽ được xóa khỏi giỏ hàng của bạn.</p>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="showDeleteModal = false">Hủy</button>
            <button type="button" class="btn-danger" @click="confirmDelete">Xóa</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');

.cart-page {
  --ink: #0f1b2d;
  --muted: #5b6b7f;
  --line: #e3e8ef;
  --bg: #f5f7fa;
  --brand: #0a6cff;
  --price: #e5322d;

  font-family: 'Be Vietnam Pro', 'Segoe UI', system-ui, sans-serif;
  color: var(--ink);
  background: var(--bg);
  min-height: 100vh;
}
.cart-page *,
.cart-page *::before,
.cart-page *::after {
  box-sizing: border-box;
}
.cart-page a:focus-visible,
.cart-page button:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}

/* Header */
.cart-top {
  background: #fff;
  border-bottom: 1px solid var(--line);
}
.cart-top-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ink);
  text-decoration: none;
}
.brand span {
  color: var(--brand);
}
.back-link {
  font-size: 14px;
  font-weight: 500;
  color: var(--muted);
  text-decoration: none;
}
.back-link:hover {
  color: var(--brand);
}

.cart-main {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}
.cart-title {
  margin: 0 0 20px;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.cart-count {
  font-size: 15px;
  font-weight: 500;
  color: var(--muted);
}

/* Banner cảnh báo */
.cart-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
}
.cart-alert-success {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #15803d;
}
.cart-alert button {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 14px;
  opacity: 0.6;
  padding: 2px 6px;
  border-radius: 4px;
}
.cart-alert button:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.05);
}

/* Giỏ trống */
.cart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 64px 20px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
  text-align: center;
}
.empty-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.empty-hint {
  margin: 0 0 14px;
  font-size: 14px;
  color: var(--muted);
}
.btn-link-primary {
  padding: 10px 22px;
  border-radius: 8px;
  background: var(--brand);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}
.btn-link-primary:hover {
  background: #0850c4;
}

/* Bố cục */
.cart-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
  align-items: start;
}
.cart-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.select-all {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.select-all input,
.row-check {
  width: 18px;
  height: 18px;
  accent-color: var(--brand);
  cursor: pointer;
  flex-shrink: 0;
}

/* Dòng sản phẩm */
.cart-row {
  display: grid;
  grid-template-columns: auto 88px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
}
.row-img {
  width: 88px;
  height: 88px;
  border-radius: 8px;
  border: 1px solid var(--line);
  object-fit: cover;
  background: var(--bg);
}
.row-img-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  font-size: 12px;
  color: var(--muted);
  text-align: center;
}
.row-name {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
}
.row-sku {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--muted);
}
.row-price {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 8px;
}
.price-sale {
  font-size: 16px;
  font-weight: 700;
  color: var(--price);
}
.price-original {
  font-size: 13px;
  color: var(--muted);
  text-decoration: line-through;
}

.row-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.stepper {
  display: flex;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
}
.stepper button {
  width: 32px;
  height: 34px;
  border: 0;
  background: #fff;
  font-size: 16px;
  color: var(--ink);
  cursor: pointer;
}
.stepper button:hover:not(:disabled) {
  background: var(--bg);
}
.stepper button:disabled {
  color: #b6c0cd;
  cursor: not-allowed;
}
.stepper input {
  width: 52px;
  height: 34px;
  border: 0;
  border-left: 1px solid var(--line);
  border-right: 1px solid var(--line);
  text-align: center;
  font: inherit;
  font-size: 14px;
  color: var(--ink);
  -moz-appearance: textfield;
}
.stepper input::-webkit-outer-spin-button,
.stepper input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.stepper input:focus {
  outline: none;
  background: #eef4ff;
}
.row-total {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
}
.row-remove {
  padding: 2px 0;
  border: 0;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-size: 13px;
  text-decoration: underline;
  cursor: pointer;
}
.row-remove:hover {
  color: var(--price);
}

/* Tóm tắt */
.cart-summary {
  position: sticky;
  top: 20px;
  padding: 20px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
}
.cart-summary h2 {
  margin: 0 0 16px;
  font-size: 17px;
  font-weight: 600;
}
.cart-summary dl {
  margin: 0 0 16px;
}
.cart-summary dl > div {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 8px 0;
  font-size: 14px;
}
.cart-summary dt {
  color: var(--muted);
}
.cart-summary dd {
  margin: 0;
  font-weight: 500;
}
.summary-total {
  margin-top: 4px;
  border-top: 1px solid var(--line);
  padding-top: 14px !important;
}
.summary-total dt {
  color: var(--ink);
  font-weight: 600;
}
.summary-total dd {
  font-size: 20px;
  font-weight: 700;
  color: var(--price);
}
.btn-checkout {
  width: 100%;
  height: 46px;
  border: 0;
  border-radius: 10px;
  background: var(--price);
  color: #fff;
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-checkout:hover {
  background: #c9231e;
}
.summary-hint {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--muted);
  text-align: center;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 27, 45, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}
.modal-card {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.25);
}
.modal-card h3 {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
}
.modal-card p {
  margin: 0 0 20px;
  font-size: 14px;
  color: var(--muted);
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.modal-actions button {
  padding: 9px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-family: inherit;
}
.btn-cancel {
  background: #fff;
  border: 1px solid var(--line) !important;
  color: var(--muted);
}
.btn-cancel:hover {
  background: var(--bg);
}
.btn-danger {
  background: var(--price);
  color: #fff;
}
.btn-danger:hover {
  background: #c9231e;
}

/* Transition fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 900px) {
  .cart-layout {
    grid-template-columns: 1fr;
  }
  .cart-summary {
    position: sticky;
    top: auto;
    bottom: 0;
    z-index: 5;
    border-radius: 12px 12px 0 0;
    box-shadow: 0 -6px 18px rgba(15, 27, 45, 0.08);
  }
}
@media (max-width: 600px) {
  .cart-main {
    padding: 16px 14px 24px;
  }
  .cart-row {
    grid-template-columns: auto 72px minmax(0, 1fr);
    gap: 12px;
    padding: 12px;
  }
  .row-img {
    width: 72px;
    height: 72px;
  }
  .row-side {
    grid-column: 1 / -1;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }
}
</style>