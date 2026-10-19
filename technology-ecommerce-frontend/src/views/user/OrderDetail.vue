<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const token = localStorage.getItem('token')

// Lấy orderCode từ params URL
const orderCode = route.params.orderCode

const order = ref(null)
const isLoading = ref(false)

// Modal hủy đơn
const showCancelModal = ref(false)
const isCancelling = ref(false)

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
  try {
    isLoading.value = true
    const response = await axios.get(`http://localhost:3000/api/orders/${orderCode}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    order.value = response.data.order || null
  } catch (error) {
    console.error('Lỗi tải chi tiết đơn hàng:', error)
    showMessage('Không thể tải thông tin chi tiết đơn hàng.', 'error')
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
      fetchOrderDetail()
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

// Map payment_status (0/1/2) → tên + class
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

onMounted(() => {
  fetchOrderDetail()
})

onBeforeUnmount(() => {
  if (messageTimer) clearTimeout(messageTimer)
})
</script>

<template>
  <div class="order-detail-page">
    <!-- HEADER -->
    <header class="detail-top">
      <div class="detail-top-inner">
        <RouterLink to="/home" class="brand" aria-label="TechStore - Trang chủ">
          Tech<span>Store</span>
        </RouterLink>
        <RouterLink to="/home" class="back-link">← Tiếp tục mua sắm</RouterLink>
      </div>
    </header>

    <main class="detail-main">
      <!-- HEAD ACTIONS -->
      <div class="page-head">
        <button class="btn-back" @click="router.back()" type="button" title="Quay lại">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Quay lại</span>
        </button>
        <div class="page-titles">
          <h1 class="page-title">Chi tiết đơn hàng</h1>
          <p class="page-sub">Mã đơn: <b>#{{ orderCode }}</b></p>
        </div>
      </div>

      <!-- ALERT -->
      <transition name="fade">
        <div
          v-if="message"
          class="detail-alert"
          :class="messageType === 'error' ? 'detail-alert-error' : 'detail-alert-success'"
        >
          <span>{{ message }}</span>
          <button type="button" @click="message = ''" aria-label="Đóng">✕</button>
        </div>
      </transition>

      <!-- LOADING -->
      <div v-if="isLoading" class="state-box">
        <div class="spinner"></div>
        <p>Đang tải chi tiết đơn hàng...</p>
      </div>

      <!-- NOT FOUND -->
      <div v-else-if="!order" class="state-box">
        <div class="state-icon">📭</div>
        <p class="state-title">Không tìm thấy đơn hàng</p>
        <p class="state-sub">Đơn hàng này có thể không tồn tại hoặc bạn không có quyền xem.</p>
      </div>

      <!-- ORDER DETAIL -->
      <div v-else class="detail-card">
        <!-- Card header -->
        <div class="detail-header">
          <div class="detail-header-left">
            <span class="order-code">#{{ order.order_code }}</span>
            <span class="order-date">
              Đặt lúc {{ new Date(order.order_date).toLocaleString('vi-VN') }}
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

        <!-- Info grid: address + payment -->
        <div class="info-grid">
          <div class="info-block">
            <h3 class="info-title">
              <span class="info-icon">📍</span>
              Địa chỉ nhận hàng
            </h3>
            <div class="info-row">
              <span class="info-label">Người nhận</span>
              <span class="info-value">{{ order.receiver_name || order.recipient_name || order.shipping_name || '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Điện thoại</span>
              <span class="info-value">{{ order.receiver_phone || order.phone || order.shipping_phone || '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Địa chỉ</span>
              <span class="info-value">{{ order.shipping_address || order.address || '—' }}</span>
            </div>
          </div>

          <div class="info-block">
            <h3 class="info-title">
              <span class="info-icon">💳</span>
              Thanh toán &amp; Vận chuyển
            </h3>
            <div class="info-row">
              <span class="info-label">Phương thức</span>
              <span class="info-value">
                {{ order.payment_method_name
                  || (order.payment_method_id === 1 ? 'Thanh toán online (VNPay)'
                    : order.payment_method_id === 2 ? 'Tiền mặt khi nhận hàng (COD)'
                    : order.payment_method || 'Thanh toán khi nhận hàng (COD)') }}
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">Trạng thái</span>
              <span class="info-value">
                <span
                  class="mini-badge"
                  :class="getPaymentStatusClass(order.payment_status)"
                >
                  {{ getPaymentStatusName(order.payment_status) }}
                </span>
              </span>
            </div>
          </div>
        </div>

        <!-- Products -->
        <h2 class="section-title">
          <span>📦</span> Sản phẩm trong đơn
        </h2>

        <div class="products-box">
          <div
            v-for="(item, idx) in order.items"
            :key="idx"
            class="product-row"
          >
            <img
              v-if="item.image || item.image_url"
              :src="`http://localhost:3000/uploads/variants/${item.image || item.image_url}`"
              :alt="item.product_name"
              class="product-thumb"
              loading="lazy"
            />
            <div v-else class="product-thumb product-thumb-empty">📦</div>

            <div class="product-info">
              <span class="product-name">{{ item.product_name }}</span>
              <span class="product-meta">
                SKU: {{ item.sku }} · SL: <b>{{ item.quantity }}</b> × {{ Number(item.unit_price).toLocaleString('vi-VN') }}đ
              </span>
            </div>

            <span class="product-total">
              {{ Number(item.unit_price * item.quantity).toLocaleString('vi-VN') }}đ
            </span>
          </div>
        </div>

        <!-- Summary -->
        <div class="summary-box">
          <div class="summary-row">
            <span>Tạm tính</span>
            <span>{{ Number(order.total_amount).toLocaleString('vi-VN') }}đ</span>
          </div>
          <div class="summary-row summary-row-final">
            <span>Tổng thanh toán</span>
            <span class="summary-total">{{ Number(order.total_amount).toLocaleString('vi-VN') }}đ</span>
          </div>
        </div>

        <!-- Actions -->
        <div
          v-if="order.order_status === 1 || order.order_status === 2"
          class="detail-actions"
        >
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
            <button
              class="btn-cancel-tech"
              type="button"
              :disabled="isCancelling"
              @click="showCancelModal = false"
            >
              Không
            </button>
            <button
              class="btn-danger-tech"
              type="button"
              :disabled="isCancelling"
              @click="confirmCancelOrder"
            >
              <span v-if="isCancelling" class="spinner-sm"></span>
              <span>{{ isCancelling ? 'Đang hủy...' : 'Hủy đơn' }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');

.order-detail-page {
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
.order-detail-page *,
.order-detail-page *::before,
.order-detail-page *::after {
  box-sizing: border-box;
}

/* Header */
.detail-top {
  background: #fff;
  border-bottom: 1px solid var(--line);
}
.detail-top-inner {
  max-width: 900px;
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
.brand span { color: var(--brand); }
.back-link {
  font-size: 14px;
  font-weight: 500;
  color: var(--muted);
  text-decoration: none;
}
.back-link:hover { color: var(--brand); }

/* Main */
.detail-main {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 20px 60px;
}

/* Page head */
.page-head {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}
.page-titles { flex: 1; min-width: 0; }
.page-title {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--ink);
}
.page-sub {
  margin: 0;
  font-size: 14px;
  color: var(--muted);
}
.page-sub b { color: var(--brand); }
.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--muted);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  flex-shrink: 0;
}
.btn-back:hover {
  background: #f0f9ff;
  color: var(--brand);
  border-color: var(--brand);
  transform: translateX(-2px);
}

/* Alert */
.detail-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 16px;
  margin-bottom: 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
}
.detail-alert-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}
.detail-alert-success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #15803d;
}
.detail-alert button {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 14px;
  opacity: 0.6;
  padding: 2px 6px;
  border-radius: 4px;
}
.detail-alert button:hover { opacity: 1; background: rgba(0, 0, 0, 0.05); }

/* States */
.state-box {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 60px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.state-icon { font-size: 48px; opacity: 0.5; }
.state-title { margin: 0; font-weight: 700; color: var(--ink); font-size: 16px; }
.state-sub { margin: 0; font-size: 14px; color: var(--muted); max-width: 340px; line-height: 1.5; }
.state-box p { margin: 0; color: var(--muted); font-size: 14px; }

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--line);
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.spinner-sm {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Detail card */
.detail-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(15, 27, 45, 0.06);
}

/* Card header */
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--line);
  background: #fbfcfe;
  flex-wrap: wrap;
}
.detail-header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.order-code {
  font-size: 18px;
  font-weight: 800;
  color: var(--brand);
  letter-spacing: -0.01em;
}
.order-date {
  font-size: 13px;
  color: var(--muted);
}

.detail-header-right {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Status badge */
.status-badge,
.payment-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 700;
  white-space: nowrap;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-pending {
  background: #fffbeb; color: #b45309; border: 1px solid #fde68a;
}
.status-pending .status-dot { background: #f59e0b; }

.status-preparing {
  background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;
}
.status-preparing .status-dot { background: #3b82f6; }

.status-shipping {
  background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd;
}
.status-shipping .status-dot { background: #0ea5e9; }

.status-completed {
  background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0;
}
.status-completed .status-dot { background: #10b981; }

.status-cancelled {
  background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;
}
.status-cancelled .status-dot { background: #ef4444; }

.status-failed {
  background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;
}
.status-failed .status-dot { background: #dc2626; }

/* Payment badge */
.payment-unpaid {
  background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;
}
.payment-paid {
  background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0;
}
.payment-refunded {
  background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;
}

/* Info grid */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--line);
}

.info-block {
  background: #f8fafc;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 16px;
}

.info-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
}
.info-icon { font-size: 16px; }

.info-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 0;
}
.info-row:not(:last-child) {
  border-bottom: 1px dashed #e2e8f0;
}

.info-label {
  font-size: 11.5px;
  color: var(--muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.info-value {
  font-size: 14px;
  color: var(--ink);
  font-weight: 500;
  line-height: 1.5;
  word-break: break-word;
}

.mini-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

/* Section title */
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 20px 24px 12px;
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
}

/* Products */
.products-box {
  padding: 0 24px 16px;
}

.product-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px dashed #eef2f7;
}
.product-row:last-child { border-bottom: none; padding-bottom: 0; }
.product-row:first-child { padding-top: 0; }

.product-thumb {
  width: 58px;
  height: 58px;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid var(--line);
  background: #fff;
  flex-shrink: 0;
}
.product-thumb-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e1;
  font-size: 22px;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.product-name {
  font-weight: 700;
  color: var(--ink);
  font-size: 14.5px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.product-meta {
  font-size: 12.5px;
  color: var(--muted);
}
.product-meta b { color: var(--ink); }

.product-total {
  font-weight: 800;
  font-size: 14.5px;
  color: var(--ink);
  white-space: nowrap;
  flex-shrink: 0;
}

/* Summary */
.summary-box {
  padding: 16px 24px 20px;
  background: #f8fafc;
  border-top: 1px solid var(--line);
}
.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
  font-size: 14px;
  color: var(--muted);
}
.summary-row-final {
  margin-top: 6px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
  font-size: 15px;
  color: var(--ink);
  font-weight: 700;
}
.summary-total {
  font-size: 22px;
  font-weight: 800;
  color: var(--price);
}

/* Actions */
.detail-actions {
  padding: 16px 24px 22px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid var(--line);
}

.btn-cancel-order {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 22px;
  background: #fff;
  color: var(--price);
  border: 1.5px solid #fecaca;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-cancel-order:hover {
  background: #fef2f2;
  border-color: var(--price);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(229, 50, 45, 0.15);
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
  z-index: 1050;
  padding: 20px;
}
.modal-card {
  background: #fff;
  padding: 28px 24px;
  border-radius: 14px;
  width: 100%;
  max-width: 420px;
  text-align: center;
  box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.25s ease-out;
}
@keyframes slideUp {
  from { transform: translateY(16px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.confirm-icon {
  font-size: 42px;
  margin-bottom: 8px;
}
.modal-card h3 {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
}
.modal-card p {
  margin: 0 0 22px;
  font-size: 14px;
  color: var(--muted);
  line-height: 1.5;
}
.modal-card p b { color: var(--brand); }

.modal-actions {
  display: flex;
  gap: 10px;
}
.modal-actions button { flex: 1; }

.btn-cancel-tech {
  padding: 11px 20px;
  background: #fff;
  border: 1px solid var(--line);
  color: var(--muted);
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.btn-cancel-tech:hover:not(:disabled) { background: var(--bg); }
.btn-cancel-tech:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-danger-tech {
  padding: 11px 20px;
  background: var(--price);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-danger-tech:hover:not(:disabled) {
  background: #c9231e;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(229, 50, 45, 0.25);
}
.btn-danger-tech:disabled { opacity: 0.6; cursor: not-allowed; }

/* Transition */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }

/* Responsive */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 640px) {
  .detail-main { padding: 16px 12px 40px; }
  .page-head { flex-direction: column; gap: 12px; }
  .page-title { font-size: 20px; }
  .detail-header { flex-direction: column; align-items: flex-start; gap: 12px; padding: 16px 18px; }
  .info-grid { padding: 16px 18px; }
  .section-title { padding: 16px 18px 10px; }
  .products-box { padding: 0 18px 14px; }
  .summary-box { padding: 14px 18px 16px; }
  .detail-actions { padding: 14px 18px 18px; }
  .btn-cancel-order { width: 100%; justify-content: center; }
  .product-row { flex-wrap: wrap; }
  .modal-actions { flex-direction: column-reverse; }
}
</style>