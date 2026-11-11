<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const token = localStorage.getItem('token')

const orderCode = route.params.orderCode

const order = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

// Modal hủy đơn
const showCancelModal = ref(false)
const isCancelling = ref(false)

// Modal xem ảnh
const showImageModal = ref(false)
const viewingImageUrl = ref(null)

// Thông báo
const message = ref('')
const messageType = ref('success')
let messageTimer = null

const showMessage = (msg, type = 'success') => {
  message.value = msg
  messageType.value = type
  if (messageTimer) clearTimeout(messageTimer)
  messageTimer = setTimeout(() => {
    message.value = ''
  }, 3500)
}

// ============ API ============
const fetchOrderDetail = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const res = await axios.get(`http://localhost:3000/api/orders/${orderCode}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    order.value = res.data.order || null
    if (!order.value) {
      errorMessage.value = 'Không tìm thấy đơn hàng này.'
    }
  } catch (error) {
    console.error('Lỗi tải chi tiết đơn hàng:', error)
    errorMessage.value =
      error.response?.data?.message || 'Không thể tải thông tin chi tiết đơn hàng.'
  } finally {
    isLoading.value = false
  }
}

// ============ HỦY ĐƠN ============
const handleCancelOrder = () => {
  showCancelModal.value = true
}

const confirmCancelOrder = async () => {
  if (isCancelling.value) return
  isCancelling.value = true
  try {
    const response = await axios.patch(
      `http://localhost:3000/api/orders/${orderCode}/cancel`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (response.data.success) {
      showMessage('🚫 Hủy đơn hàng thành công!', 'success')
      showCancelModal.value = false
      await fetchOrderDetail()
    }
  } catch (error) {
    console.error(error)
    showMessage(error.response?.data?.message || '❌ Không thể hủy đơn hàng này!', 'error')
  } finally {
    isCancelling.value = false
  }
}

// ============ HELPERS ============
const getOrderStatusName = (statusId) => {
  switch (statusId) {
    case 1: return 'Chờ xác nhận'
    case 2: return 'Đang chuẩn bị'
    case 3: return 'Đang giao hàng'
    case 4: return 'Đã hoàn thành'
    case 5: return 'Đã hủy'
    case 6: return 'Giao thất bại'
    default: return 'Không xác định'
  }
}

const getStatusClass = (statusId) => {
  switch (statusId) {
    case 1: return 'status-pending'
    case 2: return 'status-preparing'
    case 3: return 'status-shipping'
    case 4: return 'status-completed'
    case 5: return 'status-cancelled'
    case 6: return 'status-failed'
    default: return 'status-pending'
  }
}

const getPaymentStatusName = (status) => {
  switch (Number(status)) {
    case 0: return 'Chưa thanh toán'
    case 1: return 'Đã thanh toán'
    case 2: return 'Đã hoàn tiền'
    default: return 'Chưa thanh toán'
  }
}

const getPaymentStatusClass = (status) => {
  switch (Number(status)) {
    case 1: return 'payment-paid'
    case 2: return 'payment-refunded'
    default: return 'payment-unpaid'
  }
}

const getPaymentMethodName = (id) => {
  if (Number(id) === 1) return 'Thanh toán online (VNPay)'
  if (Number(id) === 2) return 'Tiền mặt khi nhận hàng (COD)'
  return 'Khác'
}

const getPaymentMethodIcon = (id) => {
  if (Number(id) === 1) return '💳'
  if (Number(id) === 2) return '💵'
  return '💰'
}

const formatMoney = (n) => Number(n || 0).toLocaleString('vi-VN') + '₫'

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ============ COMPUTED ============
// Tạm tính từ items
const subtotal = computed(() => {
  if (!order.value?.items) return 0
  return order.value.items.reduce((sum, item) => {
    return sum + Number(item.unit_price) * Number(item.quantity)
  }, 0)
})

// Tổng thanh toán từ backend
const totalAmount = computed(() => Number(order.value?.total_amount || 0))

// Phí ship
const shippingFee = computed(() => Number(order.value?.shipping_fee || 0))

// Tiền giảm giá — backend có discount_amount thì dùng, không thì suy ra
const discountAmount = computed(() => {
  if (!order.value) return 0
  // Nếu backend đã trả discount_amount (sau khi sửa)
  if (order.value.discount_amount !== undefined && order.value.discount_amount !== null) {
    const val = Number(order.value.discount_amount)
    if (val > 0) return val
  }
  // Fallback: tạm tính + ship - tổng
  const calc = subtotal.value + shippingFee.value - totalAmount.value
  return calc > 0 ? Math.round(calc) : 0
})

// Có hiển thị khối voucher không
const hasVoucher = computed(() => {
  return !!order.value?.coupon_id || !!order.value?.sale_code || discountAmount.value > 0
})

// Số tiền kiểm tra hợp lệ
const isTotalConsistent = computed(() => {
  const expected = subtotal.value + shippingFee.value - discountAmount.value
  return Math.abs(expected - totalAmount.value) < 1
})

const canCancel = computed(() => {
  return order.value && (order.value.order_status === 1 || order.value.order_status === 2)
})

const openImage = (url) => {
  viewingImageUrl.value = url
  showImageModal.value = true
}

onMounted(() => {
  fetchOrderDetail()
})

onBeforeUnmount(() => {
  if (messageTimer) clearTimeout(messageTimer)
})

watch(
  () => route.params.orderCode,
  (code) => {
    if (!code) return
    fetchOrderDetail()
  },
)
</script>

<template>
  <div class="detail-page">
    <!-- HEADER -->


    <main class="detail-main">
      <!-- BACK BUTTON -->
      <button class="btn-back" @click="router.back()" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Quay lại</span>
      </button>

      <!-- ALERT -->
      <transition name="slide-fade">
        <div
          v-if="message"
          class="alert-banner"
          :class="messageType === 'error' ? 'alert-error' : 'alert-success'"
        >
          <span>{{ message }}</span>
          <button type="button" class="btn-close-msg" @click="message = ''">✕</button>
        </div>
      </transition>

      <!-- LOADING -->
      <div v-if="isLoading" class="state-box">
        <div class="spinner"></div>
        <p>Đang tải chi tiết đơn hàng...</p>
      </div>

      <!-- ERROR / NOT FOUND -->
      <div v-else-if="errorMessage || !order" class="state-box">
        <div class="state-icon">📭</div>
        <p class="state-title">Không tìm thấy đơn hàng</p>
        <p class="state-sub">
          {{ errorMessage || 'Đơn hàng không tồn tại hoặc bạn không có quyền xem.' }}
        </p>
        <RouterLink to="/user/orders" class="btn-primary-tech">
          Về lịch sử đơn hàng
        </RouterLink>
      </div>

      <!-- ORDER DETAIL -->
      <div v-else class="detail-card">
        <!-- CARD HEADER -->
        <div class="detail-header">
          <div class="detail-header-left">
            <span class="order-code">#{{ order.order_code }}</span>
            <span class="order-date">
              Đặt lúc {{ formatDate(order.order_date) }}
            </span>
          </div>
          <div class="detail-header-right">
            <span class="status-badge" :class="getStatusClass(order.order_status)">
              <span class="status-dot"></span>
              {{ getOrderStatusName(order.order_status) }}
            </span>
            <span class="payment-badge" :class="getPaymentStatusClass(order.payment_status)">
              <span>💳</span>
              {{ getPaymentStatusName(order.payment_status) }}
            </span>
          </div>
        </div>

        <!-- INFO GRID -->
        <div class="info-grid">
          <!-- Địa chỉ giao hàng -->
          <div class="info-block">
            <h3 class="info-title">
              <span class="info-icon">📍</span>
              Địa chỉ nhận hàng
            </h3>
            <div class="info-row">
              <span class="info-label">Người nhận</span>
              <span class="info-value">{{ order.recipient_name || '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Điện thoại</span>
              <span class="info-value">{{ order.phone || '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Địa chỉ</span>
              <span class="info-value">{{ order.shipping_address || '—' }}</span>
            </div>
          </div>

          <!-- Thanh toán -->
          <div class="info-block">
            <h3 class="info-title">
              <span class="info-icon">💳</span>
              Thanh toán
            </h3>
            <div class="info-row">
              <span class="info-label">Phương thức</span>
              <span class="info-value">
                {{ getPaymentMethodIcon(order.payment_method_id) }}
                {{ getPaymentMethodName(order.payment_method_id) }}
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">Trạng thái thanh toán</span>
              <span class="info-value">
                <span class="mini-badge" :class="getPaymentStatusClass(order.payment_status)">
                  {{ getPaymentStatusName(order.payment_status) }}
                </span>
              </span>
            </div>
          </div>
        </div>

        <!-- KHỐI VOUCHER (hiện nếu có coupon hoặc giảm giá) -->
        <div v-if="hasVoucher" class="voucher-block">
          <div class="voucher-icon">🎟️</div>
          <div class="voucher-content">
            <span class="voucher-label">Mã giảm giá đã áp dụng</span>
            <span class="voucher-code">
              {{ order.sale_code || (order.coupon_id ? `#COUPON-${order.coupon_id}` : '—') }}
            </span>
            <span v-if="order.sale_name" class="voucher-name">{{ order.sale_name }}</span>
          </div>
          <div v-if="discountAmount > 0" class="voucher-amount">
            − {{ formatMoney(discountAmount) }}
          </div>
        </div>

        <!-- SẢN PHẨM -->
        <h2 class="section-title">
          <span>📦</span> Sản phẩm trong đơn
          <span class="item-count">{{ order.items?.length || 0 }} sản phẩm</span>
        </h2>

        <div class="products-box">
          <div
            v-for="(item, idx) in order.items"
            :key="idx"
            class="product-row"
          >
            <img
              v-if="item.image"
              :src="`http://localhost:3000/uploads/variants/${item.image}`"
              :alt="item.product_name"
              class="product-thumb"
              loading="lazy"
            />
            <div v-else class="product-thumb product-thumb-empty">📦</div>

            <div class="product-info">
              <span class="product-name">{{ item.product_name }}</span>
              <span class="product-meta">
                SKU: <b>{{ item.sku }}</b> · SL: <b>{{ item.quantity }}</b>
                × {{ formatMoney(item.unit_price) }}
              </span>
            </div>

            <span class="product-total">
              {{ formatMoney(Number(item.unit_price) * Number(item.quantity)) }}
            </span>
          </div>
        </div>

        <!-- TỔNG KẾT -->
        <div class="summary-box">
          <div class="summary-row">
            <span>Tạm tính ({{ order.items?.length || 0 }} sản phẩm)</span>
            <span>{{ formatMoney(subtotal) }}</span>
          </div>

          <!-- Phí ship -->
          <div class="summary-row">
            <span>Phí vận chuyển</span>
            <span v-if="shippingFee > 0" class="fee-value">{{ formatMoney(shippingFee) }}</span>
            <span v-else class="fee-free">Miễn phí</span>
          </div>

          <!-- Giảm giá -->
          <div class="summary-row" v-if="discountAmount > 0">
            <span class="discount-label">🎟️ Giảm giá</span>
            <span class="discount-value">− {{ formatMoney(discountAmount) }}</span>
          </div>

          <!-- Tổng -->
          <div class="summary-row summary-row-final">
            <span>Tổng thanh toán</span>
            <span class="summary-total">{{ formatMoney(totalAmount) }}</span>
          </div>
        </div>

        <!-- GHI CHÚ -->
        <div v-if="order.note" class="note-block">
          <div class="note-label">📝 Ghi chú</div>
          <div class="note-content">{{ order.note }}</div>
        </div>

        <!-- ẢNH MINH CHỨNG GIAO HÀNG -->
        <div v-if="order.delivery_proof_image" class="proof-block">
          <div class="proof-label">📸 Ảnh giao hàng thành công</div>
          <img
            :src="`http://localhost:3000/uploads/proofs/${order.delivery_proof_image}`"
            alt="Ảnh giao hàng"
            class="proof-img"
            @click="openImage(`http://localhost:3000/uploads/proofs/${order.delivery_proof_image}`)"
          />
        </div>

        <!-- ẢNH HOÀN TIỀN -->
        <div v-if="order.refund_image_url" class="proof-block proof-refund">
          <div class="proof-label">💰 Biên lai hoàn tiền</div>
          <img
            :src="`http://localhost:3000/uploads/refunds/${order.refund_image_url}`"
            alt="Biên lai hoàn tiền"
            class="proof-img"
            @click="openImage(`http://localhost:3000/uploads/refunds/${order.refund_image_url}`)"
          />
        </div>

        <!-- ACTIONS -->
        <div v-if="canCancel" class="detail-actions">
          <button class="btn-cancel-order" @click="handleCancelOrder" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <span>Hủy đơn hàng</span>
          </button>
        </div>
      </div>
    </main>

    <!-- MODAL HỦY ĐƠN -->
    <transition name="fade">
      <div v-if="showCancelModal" class="modal-overlay" @click.self="showCancelModal = false">
        <div class="modal-card">
          <div class="confirm-icon">⚠️</div>
          <h3>Hủy đơn hàng?</h3>
          <p>
            Bạn có chắc muốn hủy đơn hàng <b>#{{ orderCode }}</b> không?
            Hành động này không thể hoàn tác.
          </p>
          <div class="modal-actions">
            <button class="btn-cancel-tech" type="button" :disabled="isCancelling"
                    @click="showCancelModal = false">
              Không
            </button>
            <button class="btn-danger-tech" type="button" :disabled="isCancelling"
                    @click="confirmCancelOrder">
              <span v-if="isCancelling" class="spinner-sm"></span>
              <span>{{ isCancelling ? 'Đang hủy...' : 'Hủy đơn' }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- MODAL XEM ẢNH -->
    <transition name="fade">
      <div v-if="showImageModal" class="modal-overlay" @click.self="showImageModal = false">
        <div class="modal-card modal-image">
          <div class="modal-header-img">
            <h3>📸 Ảnh</h3>
            <button class="btn-close-circle" @click="showImageModal = false">✕</button>
          </div>
          <div class="modal-body-img">
            <img :src="viewingImageUrl" alt="Enlarged" class="img-enlarged" />
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap');

@import '../../assets/UserOrderDetail.css'
</style>