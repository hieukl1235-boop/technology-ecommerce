<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'

// ================= STATE (GIỮ NGUYÊN) =================
const orders = ref([])
const shippers = ref([])
const currentTab = ref(1)
const token = localStorage.getItem('token')

const showModal = ref(false)
const selectedOrderCode = ref(null)
const selectedShipperId = ref('')

const showImageModal = ref(false)
const viewingImageUrl = ref(null)

const showRefundModal = ref(false)
const orderCodeToRefund = ref(null)
const refundFile = ref(null)
const refundPreviewUrl = ref(null)

// ================= UI STATE (mới) =================
const isLoading = ref(false)
const actionLoadingCode = ref(null)
const isSubmittingRefund = ref(false)
const refundFileInputRef = ref(null)
const message = ref('')
const messageType = ref('success')
let messageTimer = null

// Tab config (giữ nguyên order_status mapping)
const tabs = [
  { key: 1, label: 'Chờ xác nhận' },
  { key: 2, label: 'Đang chuẩn bị' },
  { key: 3, label: 'Đang giao hàng' },
  { key: 4, label: 'Đã hoàn thành' },
  { key: 6, label: 'Giao thất bại' },
  { key: 5, label: 'Đã hủy' },
]

const tabCounts = computed(() => {
  const counts = {}
  tabs.forEach((t) => {
    counts[t.key] = orders.value.filter((o) => o.order_status === t.key).length
  })
  return counts
})

// ================= HELPERS =================
const showMessage = (msg, type = 'success') => {
  message.value = msg
  messageType.value = type
  if (messageTimer) clearTimeout(messageTimer)
  messageTimer = setTimeout(() => {
    message.value = ''
  }, 3500)
}

const getPaymentMethodName = (id) => {
  if (id === 1) return 'Tiền mặt khi nhận hàng (COD)'
  if (id === 2) return 'Thanh toán online (VNPay)'
  return 'Khác'
}

// ================= API (GIỮ NGUYÊN ENDPOINT) =================
const fetchOrders = async () => {
  isLoading.value = true
  try {
    const response = await axios.get('http://localhost:3000/api/admin/orders', {
      headers: { Authorization: `Bearer ${token}` },
    })
    orders.value = response.data.orders || []
  } catch (error) {
    console.error('Lỗi tải danh sách đơn hàng:', error)
    showMessage('Không thể tải danh sách đơn hàng', 'error')
  } finally {
    isLoading.value = false
  }
}

const fetchShippers = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/admin/employees/ship', {
      headers: { Authorization: `Bearer ${token}` },
    })
    shippers.value = response.data.shippers || []
  } catch (error) {
    console.error('Lỗi tải danh sách shipper:', error)
  }
}

const filteredOrders = computed(() => {
  return orders.value.filter((order) => order.order_status === currentTab.value)
})

// 1 -> 2
const handlePrepareOrder = async (orderCode) => {
  if (actionLoadingCode.value) return
  actionLoadingCode.value = orderCode
  try {
    const response = await axios.patch(
      `http://localhost:3000/api/admin/orders/${orderCode}/status`,
      { newStatus: 2 },
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (response.data.success) {
      showMessage('✅ Đã chuyển sang trạng thái: Đang chuẩn bị hàng!', 'success')
      await fetchOrders()
    }
  } catch (error) {
    showMessage('❌ Cập nhật thất bại!', 'error')
  } finally {
    actionLoadingCode.value = null
  }
}

const openAssignShipperModal = (orderCode) => {
  selectedOrderCode.value = orderCode
  selectedShipperId.value = ''
  showModal.value = true
}

const handleAssignShipper = async () => {
  if (!selectedShipperId.value) {
    showMessage('Vui lòng chọn một shipper!', 'error')
    return
  }
  if (actionLoadingCode.value) return
  actionLoadingCode.value = selectedOrderCode.value
  try {
    const response = await axios.patch(
      `http://localhost:3000/api/admin/orders/${selectedOrderCode.value}/assign-shipper`,
      { newStatus: 3, shipperId: selectedShipperId.value },
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (response.data.success) {
      showMessage('🚚 Đã phân công shipper và chuyển sang trạng thái Đang giao hàng!', 'success')
      showModal.value = false
      await fetchOrders()
    }
  } catch (error) {
    console.error(error)
    showMessage('❌ Phân công shipper thất bại!', 'error')
  } finally {
    actionLoadingCode.value = null
  }
}

const handleCancelOrder = async (orderCode) => {
  if (!confirm(`Bạn có chắc chắn muốn hủy đơn hàng ${orderCode} không?`)) return
  if (actionLoadingCode.value) return
  actionLoadingCode.value = orderCode
  try {
    const response = await axios.patch(
      `http://localhost:3000/api/admin/orders/${orderCode}/cancel`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (response.data.success) {
      showMessage('🚫 Đã hủy đơn hàng thành công!', 'success')
      await fetchOrders()
    }
  } catch (error) {
    console.error(error)
    showMessage(error.response?.data?.message || '❌ Hủy đơn hàng thất bại!', 'error')
  } finally {
    actionLoadingCode.value = null
  }
}

const handleRetryOrder = async (orderCode) => {
  if (!confirm(`Bạn có muốn đưa đơn hàng ${orderCode} về trạng thái chuẩn bị để giao lại không?`)) return
  if (actionLoadingCode.value) return
  actionLoadingCode.value = orderCode
  try {
    await axios.patch(
      `http://localhost:3000/api/admin/orders/${orderCode}/status`,
      { newStatus: 2 },
      { headers: { Authorization: `Bearer ${token}` } },
    )
    showMessage('🔄 Đã chuyển đơn hàng về trạng thái chuẩn bị để giao lại!', 'success')
    await fetchOrders()
  } catch (err) {
    showMessage('❌ Thao tác thất bại!', 'error')
  } finally {
    actionLoadingCode.value = null
  }
}

const openRefundModal = (orderCode) => {
  orderCodeToRefund.value = orderCode
  refundFile.value = null
  if (refundPreviewUrl.value) URL.revokeObjectURL(refundPreviewUrl.value)
  refundPreviewUrl.value = null
  showRefundModal.value = true
}

const handleRefundFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (refundPreviewUrl.value) URL.revokeObjectURL(refundPreviewUrl.value)
    refundFile.value = file
    refundPreviewUrl.value = URL.createObjectURL(file)
  }
}

const submitRefundOrder = async () => {
  if (isSubmittingRefund.value) return
  if (!refundFile.value) {
    showMessage('Vui lòng chọn ảnh biên lai hoàn tiền!', 'error')
    return
  }
  isSubmittingRefund.value = true
  try {
    const formData = new FormData()
    formData.append('refund_image', refundFile.value)
    const response = await axios.patch(
      `http://localhost:3000/api/admin/orders/${orderCodeToRefund.value}/refund`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      },
    )
    if (response.data.success) {
      showMessage('💸 Đã xác nhận hoàn tiền và lưu biên lai thành công!', 'success')
      showRefundModal.value = false
      await fetchOrders()
    }
  } catch (error) {
    console.error(error)
    showMessage('❌ Xử lý hoàn tiền thất bại!', 'error')
  } finally {
    isSubmittingRefund.value = false
  }
}

const openImageModal = (imageUrl) => {
  // Giữ đúng logic cũ: proofs vs refunds đều dùng chung nguồn URL
  // (giống code cũ: modal dùng /uploads/refunds/, nhưng ảnh minh chứng gọi /proofs/)
  viewingImageUrl.value = `http://localhost:3000/uploads/refunds/${imageUrl}`
  showImageModal.value = true
}

// Overload cho ảnh proof từ tab 4/6 → dùng đúng folder proofs
const openProofImage = (proofId) => {
  viewingImageUrl.value = `http://localhost:3000/uploads/proofs/${proofId}`
  showImageModal.value = true
}

onMounted(() => {
  fetchOrders()
  fetchShippers()
})

onBeforeUnmount(() => {
  if (messageTimer) clearTimeout(messageTimer)
  if (refundPreviewUrl.value) URL.revokeObjectURL(refundPreviewUrl.value)
})
</script>

<template>
  <div class="order-page-wrapper">
    <!-- HEADER -->
    <div class="page-header">
      <button class="btn-back" @click="$router.back()" title="Quay lại">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Quay lại</span>
      </button>
      <div class="header-titles">
        <div class="brand-tag">ORDER MANAGEMENT</div>
        <h1 class="page-title">Quản Lý Đơn Hàng</h1>
        <p class="page-sub">
          Tổng cộng <b>{{ orders.length }}</b> đơn • Đang xem <b>{{ filteredOrders.length }}</b> đơn
        </p>
      </div>
      <button class="btn-refresh" @click="fetchOrders" :disabled="isLoading">
        <span v-if="isLoading" class="spinner-xs"></span>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16"
             viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 1 1-3-6.7L21 8"></path>
          <polyline points="21 3 21 8 16 8"></polyline>
        </svg>
        <span>Tải lại</span>
      </button>
    </div>

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

    <!-- TABS -->
    <div class="tabs-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: currentTab === tab.key }"
        @click="currentTab = tab.key"
      >
        <span>{{ tab.label }}</span>
        <span class="tab-count">{{ tabCounts[tab.key] || 0 }}</span>
      </button>
    </div>

    <!-- CONTENT -->
    <div class="card-box">
      <!-- Loading -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Đang tải danh sách đơn hàng...</p>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredOrders.length === 0" class="empty-state-big">
        <div class="empty-icon">📭</div>
        <p class="empty-title">Không có đơn hàng nào</p>
        <p class="empty-sub">Hiện không có đơn hàng nào ở trạng thái này.</p>
      </div>

      <!-- Table -->
      <div v-else class="table-responsive">
        <table class="table custom-table align-middle mb-0">
          <thead>
            <tr>
              <th class="ps-4" style="width: 150px">Mã đơn hàng</th>
              <th style="width: 240px">Khách hàng &amp; Thanh toán</th>
              <th>Sản phẩm đặt mua</th>
              <th class="text-end" style="width: 130px">Tổng tiền</th>
              <th class="pe-4" style="width: 240px">Hành động / Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in filteredOrders" :key="order.order_code">
              <!-- Mã đơn -->
              <td class="ps-4">
                <span class="order-code">#{{ order.order_code }}</span>
                <span class="order-date">{{ new Date(order.order_date).toLocaleString('vi-VN') }}</span>
              </td>

              <!-- Khách hàng -->
              <td>
                <span class="customer-name">{{ order.recipient_name }}</span>
                <span class="phone-text">📞 {{ order.phone }}</span>
                <span class="address-text">{{ order.shipping_address }}</span>

                <div class="payment-box">
                  <div class="pay-row">
                    <span class="pay-label">💳 PTTT:</span>
                    <span>{{ getPaymentMethodName(order.payment_method_id) }}</span>
                  </div>
                  <div class="pay-row">
                    <span class="pay-label">💰 Trạng thái:</span>
                    <span v-if="order.payment_status === 1" class="paid-tag">Đã thanh toán</span>
                    <span v-else-if="order.payment_status === 2" class="paid-tag">Đã hoàn tiền</span>
                    <span v-else class="unpaid-tag">Chưa thanh toán</span>
                  </div>
                </div>
              </td>

              <!-- Sản phẩm -->
              <td>
                <div v-for="(item, index) in order.items" :key="index" class="product-item-row">
                  <img
                    v-if="item.image"
                    :src="`http://localhost:3000/uploads/variants/${item.image}`"
                    class="product-img"
                    loading="lazy"
                  />
                  <div v-else class="product-img product-img-empty">📦</div>
                  <div class="product-detail">
                    <span class="product-name">{{ item.product_name }}</span>
                    <span class="product-sku">SKU: {{ item.sku }}</span>
                    <span class="product-qty">
                      SL: <b>{{ item.quantity }}</b> × {{ Number(item.unit_price).toLocaleString('vi-VN') }}đ
                    </span>
                  </div>
                </div>
              </td>

              <!-- Tổng tiền -->
              <td class="text-end">
                <span class="total-amount">{{ Number(order.total_amount).toLocaleString('vi-VN') }}đ</span>
              </td>

              <!-- Hành động -->
              <td class="pe-4">
                <!-- TAB 1 -->
                <div v-if="order.order_status === 1" class="action-group">
                  <button
                    class="btn-action btn-primary-action"
                    :disabled="actionLoadingCode === order.order_code"
                    @click="handlePrepareOrder(order.order_code)"
                  >
                    <span v-if="actionLoadingCode === order.order_code" class="spinner-xs"></span>
                    <span>🚀 Xác nhận &amp; Chuẩn bị</span>
                  </button>
                  <button
                    class="btn-action btn-danger-action"
                    :disabled="actionLoadingCode === order.order_code"
                    @click="handleCancelOrder(order.order_code)"
                  >
                    ❌ Hủy đơn
                  </button>
                </div>

                <!-- TAB 2 -->
                <div v-else-if="order.order_status === 2" class="action-group">
                  <button
                    class="btn-action btn-warning-action"
                    @click="openAssignShipperModal(order.order_code)"
                  >
                    🛵 Giao Shipper
                  </button>
                  <button
                    class="btn-action btn-danger-action"
                    :disabled="actionLoadingCode === order.order_code"
                    @click="handleCancelOrder(order.order_code)"
                  >
                    ❌ Hủy đơn
                  </button>
                </div>

                <!-- TAB 3 -->
                <div v-else-if="order.order_status === 3" class="info-inline info-warning">
                  ⏳ Shipper đang giao hàng...
                </div>

                <!-- TAB 4 -->
                <div v-else-if="order.order_status === 4" class="action-group">
                  <span class="info-inline info-success">✨ Đã giao thành công</span>
                  <div v-if="order.delivery_proof_id" class="proof-wrap">
                    <span class="proof-label">Ảnh minh chứng:</span>
                    <img
                      :src="`http://localhost:3000/uploads/proofs/${order.delivery_proof_id}`"
                      alt="Proof"
                      class="proof-thumbnail"
                      @click="openProofImage(order.delivery_proof_id)"
                      title="Bấm để xem lớn"
                    />
                  </div>
                </div>

                <!-- TAB 6 -->
                <div v-else-if="order.order_status === 6" class="action-group">
                  <span class="info-inline info-danger">⚠️ Giao không thành công</span>
                  <div v-if="order.note" class="note-box">
                    <b>Lý do:</b> {{ order.note }}
                  </div>
                  <div v-if="order.delivery_proof_id" class="proof-wrap">
                    <span class="proof-label">Ảnh minh chứng:</span>
                    <img
                      :src="`http://localhost:3000/uploads/proofs/${order.delivery_proof_id}`"
                      alt="Failed Proof"
                      class="proof-thumbnail"
                      @click="openProofImage(order.delivery_proof_id)"
                    />
                  </div>
                  <button
                    class="btn-action btn-primary-action"
                    :disabled="actionLoadingCode === order.order_code"
                    @click="handleRetryOrder(order.order_code)"
                  >
                    🔄 Giao lại đơn
                  </button>
                  <button
                    class="btn-action btn-danger-action"
                    :disabled="actionLoadingCode === order.order_code"
                    @click="handleCancelOrder(order.order_code)"
                  >
                    ❌ Hủy đơn hoàn kho
                  </button>
                </div>

                <!-- TAB 5 -->
                <div v-else-if="order.order_status === 5" class="action-group">
                  <span class="info-inline info-danger">🚫 Đã hủy</span>

                  <div v-if="order.payment_status === 1" class="refund-block">
                    <span class="refund-warning">⚠️ Cần hoàn tiền cho khách</span>
                    <button class="btn-action btn-refund-action" @click="openRefundModal(order.order_code)">
                      💸 Xác nhận hoàn tiền
                    </button>
                  </div>

                  <div v-else-if="order.payment_status === 2" class="refund-block">
                    <span class="info-inline info-success">✅ Đã hoàn tiền</span>
                    <div v-if="order.refund_image_url" class="proof-wrap">
                      <span class="proof-label">Biên lai:</span>
                      <img
                        :src="`http://localhost:3000/uploads/refunds/${order.refund_image_url}`"
                        alt="Refund Proof"
                        class="proof-thumbnail"
                        @click="openImageModal(order.refund_image_url)"
                      />
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL SHIPPER -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">🚚 Phân công Shipper</h3>
          <button class="btn-close-circle" @click="showModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-sub">Chọn nhân viên giao hàng cho đơn <b>{{ selectedOrderCode }}</b></p>
          <select v-model="selectedShipperId" class="tech-input">
            <option disabled value="">-- Chọn Shipper --</option>
            <option v-for="shipper in shippers" :key="shipper.id" :value="shipper.id">
              {{ shipper.full_name || shipper.username }} (SĐT: {{ shipper.phone }})
            </option>
          </select>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel-tech" @click="showModal = false">Đóng</button>
          <button
            class="btn-primary-tech"
            :disabled="!selectedShipperId || actionLoadingCode === selectedOrderCode"
            @click="handleAssignShipper"
          >
            <span v-if="actionLoadingCode === selectedOrderCode" class="spinner-sm"></span>
            <span>Xác nhận giao</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL REFUND -->
    <div v-if="showRefundModal" class="modal-overlay" @click.self="showRefundModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">💸 Biên lai hoàn tiền</h3>
          <button class="btn-close-circle" @click="showRefundModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-sub">Đơn hàng: <b>{{ orderCodeToRefund }}</b></p>
          <label class="file-upload">
            <input
              ref="refundFileInputRef"
              type="file"
              accept="image/*"
              @change="handleRefundFileChange"
              :disabled="isSubmittingRefund"
            />
            <span class="file-upload-btn">
              📁 {{ refundFile ? 'Đổi ảnh khác' : 'Chọn ảnh biên lai' }}
            </span>
          </label>

          <div v-if="refundPreviewUrl" class="preview-container">
            <img :src="refundPreviewUrl" class="preview-img" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel-tech" :disabled="isSubmittingRefund" @click="showRefundModal = false">
            Hủy
          </button>
          <button class="btn-primary-tech" :disabled="isSubmittingRefund" @click="submitRefundOrder">
            <span v-if="isSubmittingRefund" class="spinner-sm"></span>
            <span>{{ isSubmittingRefund ? 'Đang gửi...' : 'Xác nhận hoàn tất' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL XEM ẢNH -->
    <div v-if="showImageModal" class="modal-overlay" @click.self="showImageModal = false">
      <div class="modal-card modal-image">
        <div class="modal-header">
          <h3 class="modal-title">📸 Ảnh minh chứng</h3>
          <button class="btn-close-circle" @click="showImageModal = false">✕</button>
        </div>
        <div class="modal-body text-center">
          <img :src="viewingImageUrl" alt="Proof" class="img-enlarged" />
        </div>
        <div class="modal-footer">
          <button class="btn-cancel-tech" @click="showImageModal = false">Đóng</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============ WRAPPER ============ */
.order-page-wrapper {
  min-height: 100vh;
  width: 100%;
  background-color: #f8fafc;
  background-image:
    linear-gradient(rgba(226, 232, 240, 0.6) 1px, transparent 1px),
    linear-gradient(90deg, rgba(226, 232, 240, 0.6) 1px, transparent 1px);
  background-size: 32px 32px;
  padding: 30px 40px;
  box-sizing: border-box;
}

/* ============ HEADER ============ */
.page-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.header-titles { flex: 1; min-width: 0; }
.brand-tag {
  font-size: 0.725rem;
  font-weight: 700;
  color: #0284c7;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}
.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px 0;
  letter-spacing: -0.02em;
}
.page-sub { margin: 0; font-size: 0.85rem; color: #64748b; }
.page-sub b { color: #0284c7; }

.btn-back, .btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #475569;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-top: 4px;
}
.btn-back:hover, .btn-refresh:hover:not(:disabled) {
  background: #f0f9ff;
  color: #0284c7;
  border-color: #0284c7;
}
.btn-back:hover { transform: translateX(-2px); }
.btn-refresh:disabled { opacity: 0.6; cursor: not-allowed; }

/* ============ ALERT ============ */
.alert-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.alert-success { background-color: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }
.alert-error { background-color: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }
.btn-close-msg {
  background: transparent; border: none; color: inherit;
  cursor: pointer; font-size: 0.9rem; margin-left: auto;
  opacity: 0.6; padding: 4px 8px; border-radius: 4px;
}
.btn-close-msg:hover { opacity: 1; background: rgba(0, 0, 0, 0.05); }
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.3s ease; }
.slide-fade-enter-from, .slide-fade-leave-to { opacity: 0; transform: translateY(-10px); }

/* ============ TABS ============ */
.tabs-bar {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  background: #ffffff;
  padding: 8px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.tab-btn:hover { background: #f1f5f9; color: #0f172a; }
.tab-btn.active {
  background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
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
  font-size: 0.72rem;
  font-weight: 700;
}
.tab-btn.active .tab-count {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

/* ============ CARD BOX ============ */
.card-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

/* ============ TABLE ============ */
.custom-table thead th {
  background-color: #f8fafc;
  color: #64748b;
  font-size: 0.775rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 14px 12px;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}
.custom-table tbody tr { transition: background-color 0.15s ease; }
.custom-table tbody tr:hover { background-color: #f8fafc; }
.custom-table tbody td {
  padding: 14px 12px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: top;
}

/* ============ ORDER CELLS ============ */
.order-code {
  display: block;
  font-weight: 800;
  color: #0284c7;
  font-size: 0.95rem;
  margin-bottom: 3px;
}
.order-date { display: block; font-size: 0.75rem; color: #94a3b8; }

.customer-name {
  display: block;
  font-weight: 700;
  color: #0f172a;
  font-size: 0.9rem;
}
.phone-text {
  display: block;
  color: #d97706;
  font-weight: 600;
  font-size: 0.82rem;
  margin-top: 2px;
}
.address-text {
  display: block;
  color: #64748b;
  font-size: 0.78rem;
  line-height: 1.4;
  margin-top: 4px;
}

.payment-box {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e2e8f0;
  font-size: 0.78rem;
  color: #475569;
}
.pay-row {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 2px;
  flex-wrap: wrap;
}
.pay-label { color: #94a3b8; font-weight: 600; }
.paid-tag { color: #059669; font-weight: 700; }
.unpaid-tag { color: #dc2626; font-weight: 700; }

/* ============ PRODUCT ITEMS ============ */
.product-item-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px dashed #f1f5f9;
}
.product-item-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }

.product-img {
  width: 44px;
  height: 44px;
  object-fit: contain;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #ffffff;
  flex-shrink: 0;
}
.product-img-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e1;
  font-size: 18px;
}
.product-detail { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.product-name { font-weight: 700; color: #0f172a; font-size: 0.85rem; }
.product-sku { color: #94a3b8; font-size: 0.72rem; }
.product-qty { color: #475569; font-size: 0.78rem; }
.product-qty b { color: #0284c7; }

.total-amount {
  color: #dc2626;
  font-weight: 800;
  font-size: 0.95rem;
  white-space: nowrap;
}

/* ============ ACTION GROUPS ============ */
.action-group { display: flex; flex-direction: column; gap: 6px; }

.btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-action:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-primary-action {
  background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(2, 132, 199, 0.25);
}
.btn-primary-action:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);
}

.btn-warning-action {
  background: linear-gradient(135deg, #d97706 0%, #ea580c 100%);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.25);
}
.btn-warning-action:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.35);
}

.btn-danger-action {
  background: #ffffff;
  color: #dc2626;
  border: 1.5px solid #fecaca;
}
.btn-danger-action:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #dc2626;
  transform: translateY(-1px);
}

.btn-refund-action {
  background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(2, 132, 199, 0.25);
}
.btn-refund-action:hover { transform: translateY(-1px); }

.info-inline {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  width: fit-content;
}
.info-warning { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
.info-success { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
.info-danger { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

.note-box {
  background: #fef2f2;
  border-left: 3px solid #dc2626;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  color: #991b1b;
  word-break: break-word;
}

.refund-block { display: flex; flex-direction: column; gap: 6px; }
.refund-warning {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #dc2626;
}

/* ============ PROOF IMAGE ============ */
.proof-wrap { display: flex; flex-direction: column; gap: 4px; }
.proof-label { font-size: 0.72rem; color: #94a3b8; font-weight: 600; }
.proof-thumbnail {
  width: 54px;
  height: 54px;
  object-fit: cover;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.proof-thumbnail:hover {
  transform: scale(1.06);
  border-color: #0284c7;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.2);
}

/* ============ LOADING & EMPTY ============ */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 14px;
}
.loading-state p { margin: 0; color: #64748b; font-size: 0.9rem; }

.empty-state-big {
  text-align: center;
  padding: 70px 20px;
}
.empty-icon { font-size: 52px; opacity: 0.5; margin-bottom: 10px; }
.empty-title { margin: 0 0 4px 0; font-weight: 700; color: #475569; font-size: 1.05rem; }
.empty-sub { margin: 0; font-size: 0.85rem; color: #94a3b8; }

/* ============ SPINNERS ============ */
.spinner {
  width: 36px; height: 36px;
  border: 3px solid #e2e8f0;
  border-top-color: #0284c7;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.spinner-sm {
  width: 14px; height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
.spinner-xs {
  width: 12px; height: 12px;
  border: 2px solid rgba(2, 132, 199, 0.25);
  border-top-color: #0284c7;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ============ MODAL ============ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-card {
  background: #ffffff;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  border-radius: 14px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
}
.modal-image { max-width: 640px; }

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  padding: 18px 22px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.modal-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
}
.btn-close-circle {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: #f1f5f9;
  border: none;
  color: #475569;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-weight: bold;
  transition: all 0.2s;
}
.btn-close-circle:hover {
  background: #ef4444; color: #ffffff;
  transform: rotate(90deg);
}

.modal-body { padding: 20px 22px; }
.modal-sub { margin: 0 0 12px 0; font-size: 0.88rem; color: #64748b; }
.modal-sub b { color: #0284c7; }

.modal-footer {
  padding: 14px 22px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* ============ INPUTS ============ */
.tech-input {
  width: 100%;
  padding: 10px 14px;
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.925rem;
  color: #0f172a;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
  font-family: inherit;
}
.tech-input:focus {
  background-color: #ffffff;
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
}

.file-upload { display: block; cursor: pointer; margin-bottom: 12px; }
.file-upload input[type="file"] { display: none; }
.file-upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  background: #f1f5f9;
  border: 1.5px dashed #cbd5e1;
  border-radius: 8px;
  color: #475569;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.file-upload:hover .file-upload-btn {
  background: #f0f9ff;
  border-color: #0284c7;
  color: #0284c7;
}

.preview-container { text-align: center; padding: 10px; }
.preview-img {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

/* ============ MODAL BUTTONS ============ */
.btn-cancel-tech {
  padding: 9px 18px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-cancel-tech:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #94a3b8;
}
.btn-cancel-tech:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-primary-tech {
  padding: 9px 20px;
  background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-primary-tech:hover:not(:disabled) {
  background: linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%);
  transform: translateY(-1px);
}
.btn-primary-tech:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.img-enlarged {
  max-width: 100%;
  max-height: 520px;
  object-fit: contain;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
}

/* ============ RESPONSIVE ============ */
@media (max-width: 992px) {
  .order-page-wrapper { padding: 22px 20px; }
}
@media (max-width: 640px) {
  .order-page-wrapper { padding: 16px 12px; }
  .page-title { font-size: 1.4rem; }
  .page-header { flex-direction: column; align-items: stretch; }
  .btn-back, .btn-refresh { justify-content: center; }
  .tabs-bar { overflow-x: auto; flex-wrap: nowrap; }
}
</style>