<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const token = localStorage.getItem('token')

const myOrders = ref([])
const isLoadingOrders = ref(false)

// Quản lý tab đang chọn ('all', 'pending', 'shipping', 'completed', 'cancelled')
const activeTab = ref('all')

// Quản lý Modal Đánh giá sản phẩm chi tiết
const showReviewModal = ref(false)
const reviewForm = ref({
  variant_id: null,
  product_name: '',
  rating: 5,
  title: '',
  content: '',
  images: []
})

// Quản lý Modal xem lớn ảnh minh chứng
const showImageModal = ref(false)
const viewingImageUrl = ref(null)

// Lấy danh sách đơn hàng
const fetchMyOrders = async () => {
  try {
    isLoadingOrders.value = true
    const response = await axios.get('http://localhost:3000/api/user/account/orders', {
      headers: { Authorization: `Bearer ${token}` },
    })
    myOrders.value = response.data.orders || []
  } catch (error) {
    console.error('Lỗi tải danh sách đơn hàng:', error)
    alert('Không thể tải lịch sử đơn hàng lúc này.')
  } finally {
    isLoadingOrders.value = false
  }
}

// Khách hàng tự hủy đơn
const handleCancelMyOrder = async (orderCode) => {
  if (!confirm(`Bạn có chắc chắn muốn hủy đơn hàng ${orderCode} không?`)) return

  try {     
    const response = await axios.patch(
      `http://localhost:3000/api/orders/${orderCode}/cancel`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (response.data.success) {
      alert('🚫 Hủy đơn hàng thành công!')
      fetchMyOrders()
    }
  } catch (error) {
    console.error(error)
    alert(error.response?.data?.message || '❌ Không thể hủy đơn hàng này!')
  }
}

// Mở Modal Đánh giá cho từng sản phẩm cụ thể trong đơn
const openReviewModal = (item) => {
  reviewForm.value = {
    variant_id: item.variant_id,
    product_name: item.product_name,
    rating: 5,
    title: '',
    content: '',
    images: []
  }
  showReviewModal.value = true
}

// Xử lý chọn nhiều ảnh đánh giá
const handleFileChange = (e) => {
  reviewForm.value.images = e.target.files
}

// Gửi đánh giá lên server bằng FormData
const submitReview = async () => {
  try {
    const formData = new FormData()
    formData.append('variant_id', reviewForm.value.variant_id)
    formData.append('rating', reviewForm.value.rating)
    formData.append('title', reviewForm.value.title)
    formData.append('content', reviewForm.value.content)

    for (let i = 0; i < reviewForm.value.images.length; i++) {
      formData.append('images_review', reviewForm.value.images[i])
    }

    const response = await axios.post(
      'http://localhost:3000/api/user/account/reviews', 
      formData, 
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
      }
    )

    if (response.data.success) {
      alert('⭐ Cảm ơn bạn đã đánh giá sản phẩm!')
      showReviewModal.value = false
      fetchMyOrders()
    }
  } catch (error) {
    console.error(error)
    alert(error.response?.data?.message || '❌ Không thể gửi đánh giá!')
  }
}

// Xem ảnh lớn
const openImageModal = (imageUrl, folder = 'proofs') => {
  viewingImageUrl.value = `http://localhost:3000/uploads/${folder}/${imageUrl}`
  showImageModal.value = true
}

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

// Computed lọc đơn hàng theo tab được chọn
const filteredOrders = computed(() => {
  if (activeTab.value === 'all') return myOrders.value
  if (activeTab.value === 'pending') {
    return myOrders.value.filter(o => o.order_status === 1 || o.order_status === 2)
  }
  if (activeTab.value === 'shipping') {
    return myOrders.value.filter(o => o.order_status === 3)
  }
  if (activeTab.value === 'completed') {
    return myOrders.value.filter(o => o.order_status === 4)
  }
  if (activeTab.value === 'cancelled') {
    return myOrders.value.filter(o => o.order_status === 5 || o.order_status === 6)
  }
  return myOrders.value
})

onMounted(() => {
  fetchMyOrders()
})
</script>

<template>
  <div class="orders-page-container">
    <div class="container py-4" style="max-width: 800px">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <button class="btn btn-outline-secondary btn-sm" @click="router.back()">⬅ Quay lại</button>
        <h2 class="fw-bold mb-0">📦 Lịch sử đơn hàng của tôi</h2>
      </div>

      <!-- 🟢 THANH TAB PHÂN LOẠI ĐƠN HÀNG -->
      <div class="order-tabs mb-4 d-flex overflow-auto bg-white p-2 rounded shadow-sm border">
        <button 
          class="tab-btn" :class="{ active: activeTab === 'all' }" 
          @click="activeTab = 'all'"
        >
          Tất cả
        </button>
        <button 
          class="tab-btn" :class="{ active: activeTab === 'pending' }" 
          @click="activeTab = 'pending'"
        >
          Chờ xác nhận / Chuẩn bị
        </button>
        <button 
          class="tab-btn" :class="{ active: activeTab === 'shipping' }" 
          @click="activeTab = 'shipping'"
        >
          Đang giao
        </button>
        <button 
          class="tab-btn" :class="{ active: activeTab === 'completed' }" 
          @click="activeTab = 'completed'"
        >
          Hoàn thành
        </button>
        <button 
          class="tab-btn" :class="{ active: activeTab === 'cancelled' }" 
          @click="activeTab = 'cancelled'"
        >
          Đã hủy / Thất bại
        </button>
      </div>

      <div v-if="isLoadingOrders" class="text-center py-5 text-muted">
        Đang tải danh sách đơn hàng...
      </div>

      <div
        v-else-if="filteredOrders.length === 0"
        class="text-center py-5 text-muted bg-white rounded shadow-sm border"
      >
        Không có đơn hàng nào trong mục này.
      </div>

      <div v-else class="orders-list">
        <div
          v-for="order in filteredOrders"
          :key="order.order_code"
          class="order-card shadow-sm mb-3 p-3 bg-white rounded border"
        >
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="fw-bold text-primary">Mã đơn: {{ order.order_code }}</span>
            <span class="badge bg-success-subtle text-success border border-success px-2 py-1">{{
              getOrderStatusName(order.order_status)
            }}</span>
          </div>
          <small class="text-muted d-block mb-2"
            >Ngày đặt: {{ new Date(order.order_date).toLocaleString('vi-VN') }}</small
          >

          <!-- Danh sách sản phẩm kèm nút đánh giá từng sản phẩm khi đơn hoàn thành (Trạng thái 4) -->
          <div class="products-box mb-3 bg-light p-2 rounded">
            <div
              v-for="(item, idx) in order.items"
              :key="idx"
              class="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom last-no-border"
            >
              <div class="d-flex align-items-center gap-2">
                <img
                  v-if="item.image || item.image_url"
                  :src="`http://localhost:3000/uploads/variants/${item.image || item.image_url}`"
                  alt="Product"
                  class="product-thumb rounded border"
                  style="width: 45px; height: 45px; object-fit: cover"
                />
                <div>
                  <div class="fw-semibold text-dark small">{{ item.product_name }}</div>
                  <small class="text-muted"
                    >SKU: {{ item.sku }} | SL: <b>{{ item.quantity }}</b> x
                    {{ Number(item.unit_price).toLocaleString('vi-VN') }}đ</small
                  >
                </div>
              </div>

              <!-- Nút Đánh giá riêng cho từng sản phẩm -->
              <button
                v-if="order.order_status === 4"
                @click="openReviewModal(item)"
                class="btn btn-warning btn-sm text-white fw-semibold"
              >
                ⭐ Đánh giá
              </button>
            </div>
          </div>

          <!-- Ảnh giao hàng thành công (Trạng thái 4) -->
          <div
            v-if="order.order_status === 4 && order.delivery_proof_image"
            class="mb-3 p-2 bg-light rounded border"
          >
            <small class="text-success fw-bold d-block mb-1">✨ Ảnh giao hàng thành công:</small>
            <img
              :src="`http://localhost:3000/uploads/proofs/${order.delivery_proof_image}`"
              class="proof-thumbnail rounded border"
              style="width: 50px; height: 50px; object-fit: cover; cursor: pointer"
              @click="openImageModal(order.delivery_proof_image, 'proofs')"
              title="Xem ảnh giao hàng"
            />
          </div>

          <!-- Thông tin hoàn tiền (nếu có) -->
          <div
            v-if="order.order_status === 5 && order.refund_image_url"
            class="mb-3 p-2 bg-light rounded border"
          >
            <small class="text-success fw-bold d-block mb-1">✅ Đã hoàn tiền - Biên lai:</small>
            <img
              :src="`http://localhost:3000/uploads/refunds/${order.refund_image_url}`"
              class="proof-thumbnail rounded border"
              style="width: 50px; height: 50px; object-fit: cover; cursor: pointer"
              @click="openImageModal(order.refund_image_url, 'refunds')"
              title="Xem biên lai"
            />
          </div>

          <div class="d-flex justify-content-between align-items-center pt-2 border-top">
            <div class="fw-bold text-danger">
              Tổng tiền: {{ Number(order.total_amount).toLocaleString('vi-VN') }} đ
            </div>

            <!-- Nút hủy đơn (Trạng thái 1 hoặc 2) -->
            <button
              v-if="order.order_status === 1 || order.order_status === 2"
              @click="handleCancelMyOrder(order.order_code)"
              class="btn btn-danger btn-sm"
            >
              ❌ Hủy đơn
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL ĐÁNH GIÁ SẢN PHẨM CHI TIẾT -->
    <div v-if="showReviewModal" class="modal-overlay">
      <div class="modal-content bg-white p-4 rounded shadow">
        <h3 class="mb-1">⭐ Đánh giá sản phẩm</h3>
        <p class="text-muted small mb-3"><b>{{ reviewForm.product_name }}</b></p>
        
        <div class="mb-3">
          <label class="form-label fw-semibold">Mức độ hài lòng (Số sao):</label>
          <select v-model.number="reviewForm.rating" class="form-select">
            <option value="5">⭐⭐⭐⭐⭐ (5/5 - Tuyệt vời)</option>
            <option value="4">⭐⭐⭐⭐ (4/5 - Hài lòng)</option>
            <option value="3">⭐⭐⭐ (3/5 - Bình thường)</option>
            <option value="2">⭐⭐ (2/5 - Không hài lòng)</option>
            <option value="1">⭐ (1/5 - Tệ)</option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label fw-semibold">Tiêu đề đánh giá:</label>
          <input type="text" v-model="reviewForm.title" class="form-control" placeholder="Ví dụ: Sản phẩm cực kỳ chất lượng..." />
        </div>

        <div class="mb-3">
          <label class="form-label fw-semibold">Nội dung chi tiết:</label>
          <textarea
            v-model="reviewForm.content"
            rows="3"
            class="form-control"
            placeholder="Cảm nhận của bạn về sản phẩm, đóng gói, giao hàng..."
          ></textarea>
        </div>

        <div class="mb-3">
          <label class="form-label fw-semibold">Đính kèm hình ảnh thực tế:</label>
          <input type="file" @change="handleFileChange" class="form-control" multiple accept="image/*" />
          <small class="text-muted">Có thể chọn nhiều ảnh cùng lúc.</small>
        </div>

        <div class="text-end">
          <button @click="showReviewModal = false" class="btn btn-secondary btn-sm me-2">
            Hủy
          </button>
          <button @click="submitReview" class="btn btn-primary btn-sm">Gửi đánh giá</button>
        </div>
      </div>
    </div>

    <!-- MODAL XEM ẢNH LỚN -->
    <div v-if="showImageModal" class="modal-overlay" @click="showImageModal = false">
      <div class="modal-content bg-white p-3 text-center" @click.stop>
        <img :src="viewingImageUrl" class="img-fluid rounded mb-3" style="max-height: 400px" />
        <br />
        <button @click="showImageModal = false" class="btn btn-secondary btn-sm px-4">Đóng</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orders-page-container {
  min-height: 100vh;
  background-color: #f8fafc;
}
.order-tabs {
  gap: 8px;
  white-space: nowrap;
}
.tab-btn {
  background: transparent;
  border: none;
  padding: 8px 16px;
  font-weight: 600;
  color: #64748b;
  border-radius: 6px;
  transition: all 0.2s;
  cursor: pointer;
}
.tab-btn:hover {
  background-color: #f1f5f9;
  color: #334155;
}
.tab-btn.active {
  background-color: #0d6efd;
  color: white;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}
.modal-content {
  width: 90%;
  max-width: 480px;
}
</style>