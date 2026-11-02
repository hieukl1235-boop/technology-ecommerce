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
              <RouterLink :to="`/product/${item.product_id}`">
                <h2 class="row-name">{{ item.product_name }}</h2>
              </RouterLink>
              
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
@import '../../assets/Cart.css'

</style>