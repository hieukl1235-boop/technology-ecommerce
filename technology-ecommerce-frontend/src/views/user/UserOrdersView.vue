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
const Item = ref([])
const buyAgain = async (orderCode) => {
  const res = await axios.get(`http://localhost:3000/api/orders/${orderCode}/getVariant`)
  Item.value = res.data.products

  localStorage.setItem('checkout_items',
  JSON.stringify(Item.value)
  )
    router.push('/checkout')

}
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
            <RouterLink :to="`/order/${order.order_code}`" style=" text-decoration: none;">
              <span class="order-code">#{{ order.order_code }}</span></RouterLink>
              
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
                <RouterLink :to="`/product/${item.product_id}`" style="text-decoration: none;">
                  <span class="product-name">{{ item.product_name }}</span>
                </RouterLink>
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
            <button
              v-if="order.order_status === 5"
              class="btn-cancel"
              @click="buyAgain(order.order_code)"
              type="button"
            >
              ❌ Mua lại
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
@import '../../assets/UserOrder.css';
</style>
