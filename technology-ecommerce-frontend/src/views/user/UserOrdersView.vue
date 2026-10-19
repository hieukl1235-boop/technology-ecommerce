<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const token = localStorage.getItem('token')

const myOrders = ref([])
const isLoadingOrders = ref(false)

// Tab đang chọn
const activeTab = ref('all')

// Modal đánh giá
const showReviewModal = ref(false)
const reviewForm = ref({
  variant_id: null,
  product_name: '',
  rating: 5,
  title: '',
  content: '',
  images: [],
})
const isSubmittingReview = ref(false)

// Modal xem ảnh lớn
const showImageModal = ref(false)
const viewingImageUrl = ref(null)

// Modal xác nhận hủy đơn
const showCancelModal = ref(false)
const cancelTargetCode = ref(null)

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

// Tabs config
const tabs = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ xác nhận / Chuẩn bị' },
  { key: 'shipping', label: 'Đang giao' },
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'cancelled', label: 'Đã hủy / Thất bại' },
]
// Hiển thị tên trạng thái thanh toán
const getPaymentStatusName = (paymentStatus) => {
  switch (Number(paymentStatus)) {
    case 0:
      return 'Chưa thanh toán'
    case 1:
      return 'Đã thanh toán'
    case 2:
      return 'Đã hoàn tiền'
    default:
      return 'Không xác định'
  }
}

// Class màu cho badge thanh toán
const getPaymentStatusClass = (paymentStatus) => {
  switch (Number(paymentStatus)) {
    case 0:
      return 'payment-unpaid'
    case 1:
      return 'payment-paid'
    case 2:
      return 'payment-refunded'
    default:
      return 'payment-unpaid'
  }
}

// ============ API ============
const fetchMyOrders = async () => {
  try {
    isLoadingOrders.value = true
    const response = await axios.get('http://localhost:3000/api/user/account/orders', {
      headers: { Authorization: `Bearer ${token}` },
    })
    myOrders.value = response.data.orders || []
  } catch (error) {
    console.error('Lỗi tải danh sách đơn hàng:', error)
    showMessage('Không thể tải lịch sử đơn hàng lúc này.', 'error')
  } finally {
    isLoadingOrders.value = false
  }
}

// ============ HỦY ĐƠN ============
const handleCancelMyOrder = (orderCode) => {
  cancelTargetCode.value = orderCode
  showCancelModal.value = true
}

const confirmCancelOrder = async () => {
  if (!cancelTargetCode.value) return
  const orderCode = cancelTargetCode.value

  try {
    const response = await axios.patch(
      `http://localhost:3000/api/orders/${orderCode}/cancel`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (response.data.success) {
      showMessage('🚫 Hủy đơn hàng thành công!', 'success')
      showCancelModal.value = false
      cancelTargetCode.value = null
      fetchMyOrders()
    }
  } catch (error) {
    console.error(error)
    showMessage(error.response?.data?.message || '❌ Không thể hủy đơn hàng này!', 'error')
  }
}

// ============ ĐÁNH GIÁ ============
const openReviewModal = (item) => {
  reviewForm.value = {
    variant_id: item.variant_id,
    product_name: item.product_name,
    rating: 5,
    title: '',
    content: '',
    images: [],
  }
  showReviewModal.value = true
}

const handleFileChange = (e) => {
  reviewForm.value.images = e.target.files
}

const submitReview = async () => {
  if (isSubmittingReview.value) return

  if (!reviewForm.value.content.trim()) {
    showMessage('Vui lòng nhập nội dung đánh giá', 'error')
    return
  }

  isSubmittingReview.value = true
  try {
    const formData = new FormData()
    formData.append('variant_id', reviewForm.value.variant_id)
    formData.append('rating', reviewForm.value.rating)
    formData.append('title', reviewForm.value.title)
    formData.append('content', reviewForm.value.content)

    for (let i = 0; i < reviewForm.value.images.length; i++) {
      formData.append('images_review', reviewForm.value.images[i])
    }

    const response = await axios.post('http://localhost:3000/api/user/account/reviews', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    })

    if (response.data.success) {
      showMessage('⭐ Cảm ơn bạn đã đánh giá sản phẩm!', 'success')
      showReviewModal.value = false
      fetchMyOrders()
    }
  } catch (error) {
    console.error(error)
    showMessage(error.response?.data?.message || '❌ Không thể gửi đánh giá!', 'error')
  } finally {
    isSubmittingReview.value = false
  }
}

// ============ ẢNH ============
const openImageModal = (imageUrl, folder = 'proofs') => {
  viewingImageUrl.value = `http://localhost:3000/uploads/${folder}/${imageUrl}`
  showImageModal.value = true
}

// ============ HELPERS ============
const getOrderStatusName = (statusId) => {
  switch (statusId) {
    case 1:
      return 'Chờ xác nhận'
    case 2:
      return 'Đang chuẩn bị'
    case 3:
      return 'Đang giao hàng'
    case 4:
      return 'Đã hoàn thành'
    case 5:
      return 'Đã hủy'
    case 6:
      return 'Giao thất bại'
    default:
      return 'Không xác định'
  }
}

const getStatusClass = (statusId) => {
  switch (statusId) {
    case 1:
      return 'status-pending'
    case 2:
      return 'status-preparing'
    case 3:
      return 'status-shipping'
    case 4:
      return 'status-completed'
    case 5:
      return 'status-cancelled'
    case 6:
      return 'status-failed'
    default:
      return 'status-pending'
  }
}

const filteredOrders = computed(() => {
  if (activeTab.value === 'all') return myOrders.value
  if (activeTab.value === 'pending') {
    return myOrders.value.filter((o) => o.order_status === 1 || o.order_status === 2)
  }
  if (activeTab.value === 'shipping') {
    return myOrders.value.filter((o) => o.order_status === 3)
  }
  if (activeTab.value === 'completed') {
    return myOrders.value.filter((o) => o.order_status === 4)
  }
  if (activeTab.value === 'cancelled') {
    return myOrders.value.filter((o) => o.order_status === 5 || o.order_status === 6)
  }
  return myOrders.value
})

// Đếm số đơn trong từng tab
const tabCounts = computed(() => {
  const counts = { all: myOrders.value.length }
  tabs.forEach((t) => {
    if (t.key === 'all') return
    counts[t.key] = filteredOrders.value.length // sẽ được override bên dưới
  })
  counts.pending = myOrders.value.filter((o) => o.order_status === 1 || o.order_status === 2).length
  counts.shipping = myOrders.value.filter((o) => o.order_status === 3).length
  counts.completed = myOrders.value.filter((o) => o.order_status === 4).length
  counts.cancelled = myOrders.value.filter(
    (o) => o.order_status === 5 || o.order_status === 6,
  ).length
  return counts
})

onMounted(() => {
  fetchMyOrders()
})

onBeforeUnmount(() => {
  if (messageTimer) clearTimeout(messageTimer)
})
</script>

<template>
  <div class="orders-page">
    <!-- HEADER -->
    <header class="orders-top">
      <div class="orders-top-inner">
        <RouterLink to="/home" class="brand" aria-label="TechStore - Trang chủ">
          Tech<span>Store</span>
        </RouterLink>
        <RouterLink to="/home" class="back-link">← Tiếp tục mua sắm</RouterLink>
      </div>
    </header>

    <main class="orders-main">
      <div class="page-head">
        <button class="btn-back" @click="router.back()" type="button" title="Quay lại">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Quay lại</span>
        </button>
        <div class="page-titles">
          <h1 class="page-title">Lịch sử đơn hàng</h1>
          <p class="page-sub">Theo dõi và quản lý các đơn hàng bạn đã đặt</p>
        </div>
      </div>

      <!-- ALERT -->
      <transition name="fade">
        <div
          v-if="message"
          class="orders-alert"
          :class="messageType === 'error' ? 'orders-alert-error' : 'orders-alert-success'"
        >
          <span>{{ message }}</span>
          <button type="button" @click="message = ''" aria-label="Đóng">✕</button>
        </div>
      </transition>

      <!-- TABS -->
      <div class="tabs-bar">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <span>{{ tab.label }}</span>
          <span class="tab-count">{{ tabCounts[tab.key] || 0 }}</span>
        </button>
      </div>

      <!-- LOADING -->
      <div v-if="isLoadingOrders" class="state-box">
        <div class="spinner"></div>
        <p>Đang tải danh sách đơn hàng...</p>
      </div>

      <!-- EMPTY -->
      <div v-else-if="filteredOrders.length === 0" class="state-box">
        <div class="state-icon">📭</div>
        <p class="state-title">Không có đơn hàng nào</p>
        <p class="state-sub">Hiện không có đơn hàng nào trong mục này.</p>
      </div>

      <!-- ORDERS LIST -->
      <div v-else class="orders-list">
        <article v-for="order in filteredOrders" :key="order.order_code" class="order-card">
          <!-- Card header -->
          <div class="order-head">
            <div class="order-head-left">
              <span class="order-code">#{{ order.order_code }}</span>
              <span class="order-date">{{
                new Date(order.order_date).toLocaleString('vi-VN')
              }}</span>
            </div>
            <div class="order-head-right">
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

          <!-- Products -->
          <div class="products-box">
            <div v-for="(item, idx) in order.items" :key="idx" class="product-row">
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
                  SKU: {{ item.sku }} · SL: <b>{{ item.quantity }}</b> ×
                  {{ Number(item.unit_price).toLocaleString('vi-VN') }}đ
                </span>
              </div>

              <button
                v-if="order.order_status === 4"
                class="btn-review"
                @click="openReviewModal(item)"
                type="button"
              >
                ⭐ Đánh giá
              </button>
            </div>
          </div>

          <!-- Proof ảnh giao hàng thành công -->
          <div
            v-if="order.order_status === 4 && order.delivery_proof_image"
            class="proof-block proof-success"
          >
            <span class="proof-label">✨ Ảnh giao hàng thành công:</span>
            <img
              :src="`http://localhost:3000/uploads/proofs/${order.delivery_proof_image}`"
              class="proof-thumb"
              @click="openImageModal(order.delivery_proof_image, 'proofs')"
              title="Bấm để xem lớn"
            />
          </div>

          <!-- Biên lai hoàn tiền -->
          <div
            v-if="order.order_status === 5 && order.refund_image_url"
            class="proof-block proof-refund"
          >
            <span class="proof-label">✅ Đã hoàn tiền - Biên lai:</span>
            <img
              :src="`http://localhost:3000/uploads/refunds/${order.refund_image_url}`"
              class="proof-thumb"
              @click="openImageModal(order.refund_image_url, 'refunds')"
              title="Bấm để xem lớn"
            />
          </div>

          <!-- Card footer -->
          <div class="order-foot">
            <div class="order-total">
              <span class="total-label">Tổng tiền:</span>
              <span class="total-value"
                >{{ Number(order.total_amount).toLocaleString('vi-VN') }}đ</span
              >
            </div>

            <button
              v-if="order.order_status === 1 || order.order_status === 2"
              class="btn-cancel"
              @click="handleCancelMyOrder(order.order_code)"
              type="button"
            >
              ❌ Hủy đơn
            </button>
          </div>
        </article>
      </div>
    </main>

    <!-- MODAL ĐÁNH GIÁ -->
    <transition name="fade">
      <div v-if="showReviewModal" class="modal-overlay" @click.self="showReviewModal = false">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">⭐ Đánh giá sản phẩm</h3>
            <button class="btn-close-circle" @click="showReviewModal = false" type="button">
              ✕
            </button>
          </div>

          <div class="modal-body">
            <p class="modal-product-name">{{ reviewForm.product_name }}</p>

            <div class="form-group">
              <label class="form-label">Mức độ hài lòng</label>
              <select v-model.number="reviewForm.rating" class="form-input">
                <option :value="5">⭐⭐⭐⭐⭐ (5/5 - Tuyệt vời)</option>
                <option :value="4">⭐⭐⭐⭐ (4/5 - Hài lòng)</option>
                <option :value="3">⭐⭐⭐ (3/5 - Bình thường)</option>
                <option :value="2">⭐⭐ (2/5 - Không hài lòng)</option>
                <option :value="1">⭐ (1/5 - Tệ)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Tiêu đề đánh giá</label>
              <input
                type="text"
                v-model="reviewForm.title"
                class="form-input"
                placeholder="Ví dụ: Sản phẩm cực kỳ chất lượng..."
                :disabled="isSubmittingReview"
              />
            </div>

            <div class="form-group">
              <label class="form-label"> Nội dung chi tiết <span class="required">*</span> </label>
              <textarea
                v-model="reviewForm.content"
                rows="3"
                class="form-input form-textarea"
                placeholder="Cảm nhận của bạn về sản phẩm, đóng gói, giao hàng..."
                :disabled="isSubmittingReview"
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Đính kèm hình ảnh thực tế</label>
              <label class="file-upload">
                <input
                  type="file"
                  @change="handleFileChange"
                  multiple
                  accept="image/*"
                  :disabled="isSubmittingReview"
                />
                <span class="file-upload-btn">📁 Chọn ảnh (có thể chọn nhiều)</span>
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button
              class="btn-cancel-tech"
              type="button"
              :disabled="isSubmittingReview"
              @click="showReviewModal = false"
            >
              Hủy
            </button>
            <button
              class="btn-primary-tech"
              type="button"
              :disabled="isSubmittingReview"
              @click="submitReview"
            >
              <span v-if="isSubmittingReview" class="spinner-sm"></span>
              <span>{{ isSubmittingReview ? 'Đang gửi...' : 'Gửi đánh giá' }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- MODAL XÁC NHẬN HỦY ĐƠN -->
    <transition name="fade">
      <div v-if="showCancelModal" class="modal-overlay" @click.self="showCancelModal = false">
        <div class="modal-card modal-confirm">
          <div class="confirm-icon">⚠️</div>
          <h3>Hủy đơn hàng?</h3>
          <p>
            Bạn có chắc muốn hủy đơn hàng <b>{{ cancelTargetCode }}</b> không? Hành động này không
            thể hoàn tác.
          </p>
          <div class="modal-actions">
            <button class="btn-cancel-tech" type="button" @click="showCancelModal = false">
              Không
            </button>
            <button class="btn-danger-tech" type="button" @click="confirmCancelOrder">
              Hủy đơn
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- MODAL XEM ẢNH LỚN -->
    <transition name="fade">
      <div v-if="showImageModal" class="modal-overlay" @click.self="showImageModal = false">
        <div class="modal-card modal-image">
          <div class="modal-header">
            <h3 class="modal-title">📸 Ảnh</h3>
            <button class="btn-close-circle" @click="showImageModal = false" type="button">
              ✕
            </button>
          </div>
          <div class="modal-body image-body">
            <img :src="viewingImageUrl" alt="Enlarged" class="img-enlarged" />
          </div>
          <div class="modal-footer">
            <button class="btn-cancel-tech" type="button" @click="showImageModal = false">
              Đóng
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');

.orders-page {
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
.orders-page *,
.orders-page *::before,
.orders-page *::after {
  box-sizing: border-box;
}

/* Header */
.orders-top {
  background: #fff;
  border-bottom: 1px solid var(--line);
}
.orders-top-inner {
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

/* Main */
.orders-main {
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
.page-titles {
  flex: 1;
  min-width: 0;
}
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
.orders-alert {
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
.orders-alert-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}
.orders-alert-success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #15803d;
}
.orders-alert button {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 14px;
  opacity: 0.6;
  padding: 2px 6px;
  border-radius: 4px;
}
.orders-alert button:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.05);
}

/* Tabs */
.tabs-bar {
  display: flex;
  gap: 6px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding: 8px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
  scrollbar-width: thin;
}
.tabs-bar::-webkit-scrollbar {
  height: 4px;
}
.tabs-bar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  font-family: inherit;
  font-weight: 600;
  font-size: 13px;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.tab-btn:hover {
  background: #f1f5f9;
  color: var(--ink);
}
.tab-btn.active {
  background: var(--brand);
  color: #fff;
  box-shadow: 0 4px 12px rgba(10, 108, 255, 0.25);
}
.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: #e2e8f0;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
}
.tab-btn.active .tab-count {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
}

/* States */
.state-box {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 60px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.state-icon {
  font-size: 48px;
  opacity: 0.5;
}
.state-title {
  margin: 0;
  font-weight: 700;
  color: var(--ink);
  font-size: 16px;
}
.state-sub {
  margin: 0;
  font-size: 14px;
  color: var(--muted);
}
.state-box p {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--line);
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Orders list */
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.order-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.2s;
}
.order-card:hover {
  box-shadow: 0 4px 16px rgba(15, 27, 45, 0.06);
}

.order-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--line);
  background: #fbfcfe;
  flex-wrap: wrap;
}
.order-head-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.order-code {
  font-weight: 800;
  color: var(--brand);
  font-size: 15px;
}
.order-date {
  font-size: 12px;
  color: var(--muted);
}

/* Status badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.status-pending {
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
}
.status-pending .status-dot {
  background: #f59e0b;
}

.status-preparing {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}
.status-preparing .status-dot {
  background: #3b82f6;
}

.status-shipping {
  background: #f0f9ff;
  color: #0369a1;
  border: 1px solid #bae6fd;
}
.status-shipping .status-dot {
  background: #0ea5e9;
}

.status-completed {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}
.status-completed .status-dot {
  background: #10b981;
}

.status-cancelled {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}
.status-cancelled .status-dot {
  background: #ef4444;
}

.status-failed {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}
.status-failed .status-dot {
  background: #dc2626;
}

/* Products */
.products-box {
  padding: 12px 18px;
}
.product-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px dashed #eef2f7;
}
.product-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.product-row:first-child {
  padding-top: 0;
}

.product-thumb {
  width: 52px;
  height: 52px;
  border-radius: 8px;
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
  font-size: 20px;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.product-name {
  font-weight: 600;
  color: var(--ink);
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.product-meta {
  font-size: 12px;
  color: var(--muted);
}
.product-meta b {
  color: var(--ink);
}

.btn-review {
  padding: 7px 14px;
  background: #fff;
  color: #d97706;
  border: 1.5px solid #d97706;
  border-radius: 8px;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}
.btn-review:hover {
  background: #d97706;
  color: #fff;
  transform: translateY(-1px);
}

/* Proof blocks */
.proof-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 14px;
  margin: 0 18px 12px;
  border-radius: 10px;
}
.proof-success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}
.proof-refund {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}

.proof-label {
  font-size: 12px;
  font-weight: 700;
  color: #15803d;
}
.proof-refund .proof-label {
  color: #1d4ed8;
}

.proof-thumb {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid var(--line);
  cursor: pointer;
  transition: all 0.2s;
}
.proof-thumb:hover {
  transform: scale(1.06);
  border-color: var(--brand);
  box-shadow: 0 4px 12px rgba(10, 108, 255, 0.2);
}

/* Order footer */
.order-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-top: 1px solid var(--line);
  background: #fbfcfe;
  flex-wrap: wrap;
}
.order-total {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.total-label {
  font-size: 13px;
  color: var(--muted);
}
.total-value {
  font-size: 17px;
  font-weight: 800;
  color: var(--price);
}

.btn-cancel {
  padding: 8px 16px;
  background: #fff;
  color: var(--price);
  border: 1.5px solid #fecaca;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.btn-cancel:hover {
  background: #fef2f2;
  border-color: var(--price);
  transform: translateY(-1px);
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
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  border-radius: 14px;
  box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.25s ease-out;
}
.modal-image {
  max-width: 680px;
}
.modal-confirm {
  max-width: 420px;
  text-align: center;
  padding: 28px 24px;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  padding: 16px 22px;
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.modal-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: var(--ink);
}
.btn-close-circle {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #f1f5f9;
  border: none;
  color: var(--muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: all 0.2s;
}
.btn-close-circle:hover {
  background: var(--price);
  color: #fff;
  transform: rotate(90deg);
}

.modal-body {
  padding: 20px 22px;
  overflow-y: auto;
}

.modal-product-name {
  margin: 0 0 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--brand);
  padding: 10px 14px;
  background: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 16px;
}
.form-label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  font-size: 13px;
  color: #34495e;
}
.required {
  color: var(--price);
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  color: var(--ink);
  background: #fff;
  transition: all 0.2s;
}
.form-input::placeholder {
  color: #b6c0cd;
}
.form-input:focus {
  outline: none;
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(10, 108, 255, 0.12);
}
.form-input:disabled {
  background: #f5f7fa;
  color: #94a3b8;
  cursor: not-allowed;
}
.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.file-upload {
  display: block;
  cursor: pointer;
}
.file-upload input[type='file'] {
  display: none;
}
.file-upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  background: #f1f5f9;
  border: 1.5px dashed #cbd5e1;
  border-radius: 8px;
  color: var(--muted);
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s;
}
.file-upload:hover .file-upload-btn {
  background: #f0f9ff;
  border-color: var(--brand);
  color: var(--brand);
}

.modal-footer {
  padding: 14px 22px;
  border-top: 1px solid var(--line);
  background: #fbfcfe;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
.modal-actions button {
  flex: 1;
}

/* Modal confirm */
.confirm-icon {
  font-size: 42px;
  margin-bottom: 8px;
}
.modal-confirm h3 {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
}
.modal-confirm p {
  margin: 0;
  font-size: 14px;
  color: var(--muted);
  line-height: 1.5;
}
.modal-confirm p b {
  color: var(--brand);
}

/* Modal buttons */
.btn-primary-tech {
  padding: 10px 20px;
  background: var(--brand);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 4px 12px rgba(10, 108, 255, 0.25);
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-primary-tech:hover:not(:disabled) {
  background: #0850c4;
  transform: translateY(-1px);
}
.btn-primary-tech:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-cancel-tech {
  padding: 10px 20px;
  background: #fff;
  border: 1px solid var(--line);
  color: var(--muted);
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.btn-cancel-tech:hover:not(:disabled) {
  background: var(--bg);
}
.btn-cancel-tech:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-danger-tech {
  padding: 10px 20px;
  background: var(--price);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.btn-danger-tech:hover {
  background: #c9231e;
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

/* Image modal */
.image-body {
  text-align: center;
  padding: 12px 20px;
}
.img-enlarged {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--bg);
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
/* Đẩy 2 badge sát nhau bên phải */
.order-head-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* Badge thanh toán */
.payment-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.payment-unpaid {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.payment-paid {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.payment-refunded {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

/* Responsive */
@media (max-width: 640px) {
  .orders-main {
    padding: 16px 12px 40px;
  }
  .page-head {
    flex-direction: column;
    gap: 12px;
  }
  .page-title {
    font-size: 20px;
  }
  .order-head {
    flex-direction: column;
    align-items: flex-start;
  }
  .order-foot {
    flex-direction: column;
    align-items: stretch;
  }
  .btn-cancel {
    width: 100%;
  }
  .product-row {
    flex-wrap: wrap;
  }
  .btn-review {
    width: 100%;
    margin-top: 8px;
  }
  .modal-actions {
    flex-direction: column;
  }
}
</style>
