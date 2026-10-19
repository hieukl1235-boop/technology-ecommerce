<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'

const orders = ref([])
const currentTab = ref(3)
const token = localStorage.getItem('token')

// Modal hoàn thành
const showCompleteModal = ref(false)
const orderCodeToComplete = ref(null)
const completeFile = ref(null)
const completePreviewUrl = ref(null)
const isSubmittingComplete = ref(false)

// Modal giao thất bại
const showFailModal = ref(false)
const orderCodeToFail = ref(null)
const failReason = ref('')
const isSubmittingFail = ref(false)

// Modal xem ảnh proof
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

// Tab config
const tabs = [
  { key: 3, label: 'Đang giao hàng', icon: '🛵' },
  { key: 4, label: 'Đã giao thành công', icon: '✅' },
  { key: 6, label: 'Giao thất bại', icon: '⚠️' },
]

const tabCounts = computed(() => {
  const counts = {}
  tabs.forEach((t) => {
    counts[t.key] = orders.value.filter((o) => o.order_status === t.key).length
  })
  return counts
})

const getPaymentMethodName = (id) => {
  if (id === 1) return 'Thanh toán online (VNPay)'
  if (id === 2) return 'Tiền mặt khi nhận hàng (COD)'
  return 'Khác'
}

// ============ API ============
const fetchShipperOrders = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/shipper/orders', {
      headers: { Authorization: `Bearer ${token}` },
    })
    orders.value = response.data.orders || []
  } catch (error) {
    console.error('Lỗi tải danh sách đơn hàng của shipper:', error)
    showMessage('Không thể tải danh sách đơn hàng', 'error')
  }
}

const filteredOrders = computed(() => {
  return orders.value.filter((order) => order.order_status === currentTab.value)
})

// ============ HOÀN THÀNH ============
const openCompleteModal = (orderCode) => {
  orderCodeToComplete.value = orderCode
  completeFile.value = null
  if (completePreviewUrl.value) URL.revokeObjectURL(completePreviewUrl.value)
  completePreviewUrl.value = null
  showCompleteModal.value = true
}

const handleCompleteFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (completePreviewUrl.value) URL.revokeObjectURL(completePreviewUrl.value)
    completeFile.value = file
    completePreviewUrl.value = URL.createObjectURL(file)
  }
}

const submitCompleteOrder = async () => {
  if (isSubmittingComplete.value) return

  if (!completeFile.value) {
    showMessage('Vui lòng chụp hoặc chọn ảnh minh chứng giao hàng!', 'error')
    return
  }

  isSubmittingComplete.value = true
  try {
    const formData = new FormData()
    formData.append('proof_image', completeFile.value)

    const response = await axios.patch(
      `http://localhost:3000/api/shipper/orders/${orderCodeToComplete.value}/complete`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      },
    )

    if (response.data.success) {
      showMessage('🎉 Giao hàng thành công! Đã lưu ảnh minh chứng.', 'success')
      showCompleteModal.value = false
      await fetchShipperOrders()
    }
  } catch (error) {
    console.error(error)
    showMessage('❌ Xử lý thất bại!', 'error')
  } finally {
    isSubmittingComplete.value = false
  }
}

// ============ THẤT BẠI ============
const openFailModal = (orderCode) => {
  orderCodeToFail.value = orderCode
  failReason.value = ''
  showFailModal.value = true
}

const submitFailOrder = async () => {
  if (isSubmittingFail.value) return

  if (!failReason.value.trim()) {
    showMessage('Vui lòng nhập lý do giao thất bại!', 'error')
    return
  }

  isSubmittingFail.value = true
  try {
    const response = await axios.patch(
      `http://localhost:3000/api/shipper/orders/${orderCodeToFail.value}/fail`,
      { reason: failReason.value },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )

    if (response.data.success) {
      showMessage('⚠️ Đã cập nhật trạng thái giao không thành công.', 'success')
      showFailModal.value = false
      await fetchShipperOrders()
    }
  } catch (error) {
    console.error(error)
    showMessage('❌ Xử lý thất bại!', 'error')
  } finally {
    isSubmittingFail.value = false
  }
}

// ============ XEM ẢNH ============
const openImageModal = (imageName) => {
  viewingImageUrl.value = `http://localhost:3000/uploads/proofs/${imageName}`
  showImageModal.value = true
}

onMounted(() => {
  fetchShipperOrders()
})

onBeforeUnmount(() => {
  if (messageTimer) clearTimeout(messageTimer)
  if (completePreviewUrl.value) URL.revokeObjectURL(completePreviewUrl.value)
})
</script>

<template>
  <div class="shipper-page">
    <!-- HEADER -->
    <div class="page-header">
      <div class="header-left">
        <div class="brand-tag">SHIPPER PORTAL</div>
        <h1 class="page-title">Đơn Hàng Của Tôi</h1>
        <p class="page-sub">
          Tổng cộng <b>{{ orders.length }}</b> đơn • Đang xem <b>{{ filteredOrders.length }}</b> đơn
        </p>
      </div>
      <button class="btn-refresh" @click="fetchShipperOrders" title="Tải lại">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2"
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
        <span>{{ tab.icon }}</span>
        <span>{{ tab.label }}</span>
        <span class="tab-count">{{ tabCounts[tab.key] || 0 }}</span>
      </button>
    </div>

    <!-- CONTENT -->
    <div class="card-box">
      <!-- EMPTY -->
      <div v-if="filteredOrders.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p class="empty-title">Không có đơn hàng nào</p>
        <p class="empty-sub">Hiện không có đơn hàng nào trong mục này.</p>
      </div>

      <!-- TABLE -->
      <div v-else class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th style="width: 150px">Mã đơn &amp; Thời gian</th>
              <th style="width: 240px">Khách hàng &amp; Địa chỉ</th>
              <th>Sản phẩm</th>
              <th style="width: 200px">Thanh toán</th>
              <th class="pe-4" style="width: 200px">Thao tác</th>
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
                <span class="address-text">📍 {{ order.shipping_address }}</span>
              </td>

              <!-- Sản phẩm -->
              <td>
                <div v-for="(item, idx) in order.items" :key="idx" class="product-item">
                  <img
                    :src="`http://localhost:3000/uploads/variants/${item.image}`"
                    :alt="item.product_name"
                    class="product-img"
                    loading="lazy"
                  />
                  <div class="product-info">
                    <span class="product-name">{{ item.product_name }}</span>
                    <span class="product-meta">SL: <b>{{ item.quantity }}</b> · SKU: {{ item.sku }}</span>
                  </div>
                </div>
              </td>

              <!-- Thanh toán -->
              <td>
                <span class="total-amount">{{ Number(order.total_amount).toLocaleString('vi-VN') }}đ</span>
                <span class="payment-method">💳 {{ getPaymentMethodName(order.payment_method_id) }}</span>
                <div class="payment-badge-wrap">
                  <span v-if="order.payment_status === 1" class="payment-badge payment-paid">
                    ✅ Đã thanh toán
                  </span>
                  <span v-else class="payment-badge payment-unpaid">
                    💵 Chưa thanh toán (COD)
                  </span>
                </div>
              </td>

              <!-- Actions -->
              <td class="pe-4">
                <!-- Tab 3: Đang giao -->
                <div v-if="order.order_status === 3" class="action-group">
                  <button class="btn-action btn-complete" @click="openCompleteModal(order.order_code)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" stroke-width="2.5"
                         stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Giao thành công</span>
                  </button>
                  <button class="btn-action btn-fail" @click="openFailModal(order.order_code)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" stroke-width="2.5"
                         stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    <span>Giao thất bại</span>
                  </button>
                </div>

                <!-- Tab 4: Đã giao thành công -->
                <div v-else-if="order.order_status === 4" class="success-block">
                  <span class="status-tag status-success">✨ Hoàn tất giao hàng</span>
                  <div v-if="order.delivery_proof_id" class="proof-wrap">
                    <span class="proof-label">📸 Ảnh minh chứng:</span>
                    <img
                      :src="`http://localhost:3000/uploads/proofs/${order.delivery_proof_id}`"
                      alt="Proof"
                      class="proof-thumb"
                      @click="openImageModal(order.delivery_proof_id)"
                      title="Bấm để xem lớn"
                    />
                  </div>
                </div>

                <!-- Tab 6: Giao thất bại -->
                <div v-else-if="order.order_status === 6" class="fail-block">
                  <span class="status-tag status-fail">⚠️ Giao thất bại</span>
                  <div v-if="order.note" class="note-box">
                    <b>Lý do:</b> {{ order.note }}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL HOÀN THÀNH -->
    <transition name="fade">
      <div v-if="showCompleteModal" class="modal-overlay" @click.self="showCompleteModal = false">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">📸 Ảnh minh chứng giao hàng</h3>
            <button class="btn-close-circle" @click="showCompleteModal = false">✕</button>
          </div>
          <div class="modal-body">
            <p class="modal-sub">Đơn hàng: <b>#{{ orderCodeToComplete }}</b></p>

            <label class="file-upload">
              <input
                type="file"
                accept="image/*"
                @change="handleCompleteFileChange"
                :disabled="isSubmittingComplete"
              />
              <span class="file-upload-btn">
                📁 {{ completeFile ? 'Đổi ảnh khác' : 'Chọn ảnh minh chứng' }}
              </span>
            </label>

            <div v-if="completePreviewUrl" class="preview-container">
              <img :src="completePreviewUrl" alt="Preview" class="preview-img" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel-tech" :disabled="isSubmittingComplete" @click="showCompleteModal = false">
              Hủy
            </button>
            <button class="btn-success-tech" :disabled="isSubmittingComplete" @click="submitCompleteOrder">
              <span v-if="isSubmittingComplete" class="spinner-sm"></span>
              <span>{{ isSubmittingComplete ? 'Đang gửi...' : 'Xác nhận hoàn thành' }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- MODAL THẤT BẠI -->
    <transition name="fade">
      <div v-if="showFailModal" class="modal-overlay" @click.self="showFailModal = false">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">⚠️ Lý do giao thất bại</h3>
            <button class="btn-close-circle" @click="showFailModal = false">✕</button>
          </div>
          <div class="modal-body">
            <p class="modal-sub">Đơn hàng: <b>#{{ orderCodeToFail }}</b></p>
            <textarea
              v-model="failReason"
              class="tech-textarea"
              placeholder="Nhập lý do cụ thể (VD: Khách hẹn giao lại ngày mai, thuê bao không liên lạc được...)"
              rows="4"
              :disabled="isSubmittingFail"
            ></textarea>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel-tech" :disabled="isSubmittingFail" @click="showFailModal = false">
              Hủy
            </button>
            <button class="btn-danger-tech" :disabled="isSubmittingFail" @click="submitFailOrder">
              <span v-if="isSubmittingFail" class="spinner-sm"></span>
              <span>{{ isSubmittingFail ? 'Đang gửi...' : 'Xác nhận thất bại' }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- MODAL XEM ẢNH PROOF -->
    <transition name="fade">
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
    </transition>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap');

/* ============ WRAPPER ============ */
.shipper-page {
  min-height: 100vh;
  width: 100%;
  background-color: #f8fafc;
  background-image:
    linear-gradient(rgba(226, 232, 240, 0.6) 1px, transparent 1px),
    linear-gradient(90deg, rgba(226, 232, 240, 0.6) 1px, transparent 1px);
  background-size: 32px 32px;
  padding: 30px 40px;
  box-sizing: border-box;
  font-family: 'Be Vietnam Pro', 'Segoe UI', system-ui, sans-serif;
  color: #0f172a;
}
.shipper-page *,
.shipper-page *::before,
.shipper-page *::after { box-sizing: border-box; }

/* ============ HEADER ============ */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.header-left { flex: 1; min-width: 0; }
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
  margin: 0 0 4px;
  letter-spacing: -0.02em;
}
.page-sub {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
}
.page-sub b { color: #0284c7; }

.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #475569;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  flex-shrink: 0;
  margin-top: 4px;
}
.btn-refresh:hover {
  background: #f0f9ff;
  color: #0284c7;
  border-color: #0284c7;
  transform: translateY(-1px);
}

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
.alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }
.alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }
.btn-close-msg {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 0.9rem;
  margin-left: auto;
  opacity: 0.6;
  padding: 4px 8px;
  border-radius: 4px;
}
.btn-close-msg:hover { opacity: 1; background: rgba(0, 0, 0, 0.05); }
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.3s ease; }
.slide-fade-enter-from, .slide-fade-leave-to { opacity: 0; transform: translateY(-10px); }

/* ============ TABS ============ */
.tabs-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  background: #fff;
  padding: 8px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  font-family: inherit;
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
  color: #fff;
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
  color: #fff;
}

/* ============ CARD BOX ============ */
.card-box {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

/* ============ EMPTY ============ */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 70px 20px;
  gap: 8px;
  text-align: center;
}
.empty-icon { font-size: 52px; opacity: 0.5; margin-bottom: 8px; }
.empty-title { margin: 0; font-weight: 700; color: #475569; font-size: 1.05rem; }
.empty-sub { margin: 0; font-size: 0.85rem; color: #94a3b8; }

/* ============ TABLE ============ */
.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.custom-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 960px;
}

.custom-table thead th {
  background: #f8fafc;
  color: #64748b;
  font-size: 0.775rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 14px 12px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  white-space: nowrap;
}
.custom-table thead th.ps-4 { padding-left: 24px; }
.custom-table thead th.pe-4 { padding-right: 24px; }

.custom-table tbody tr {
  transition: background 0.15s;
}
.custom-table tbody tr:hover { background: #f8fafc; }
.custom-table tbody tr:not(:last-child) td {
  border-bottom: 1px solid #f1f5f9;
}
.custom-table tbody td {
  padding: 14px 12px;
  vertical-align: top;
  font-size: 0.875rem;
}
.custom-table tbody td.ps-4 { padding-left: 24px; }
.custom-table tbody td.pe-4 { padding-right: 24px; }

/* Order code cell */
.order-code {
  display: block;
  font-weight: 800;
  color: #0284c7;
  font-size: 0.9rem;
  margin-bottom: 3px;
}
.order-date {
  display: block;
  font-size: 0.72rem;
  color: #94a3b8;
}

/* Customer cell */
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
  max-width: 220px;
}

/* Product cell */
.product-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 6px 0;
}
.product-item:not(:last-child) {
  border-bottom: 1px dashed #f1f5f9;
  padding-bottom: 10px;
  margin-bottom: 4px;
}
.product-img {
  width: 44px;
  height: 44px;
  object-fit: contain;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  flex-shrink: 0;
}
.product-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.product-name {
  font-weight: 700;
  color: #0f172a;
  font-size: 0.85rem;
  line-height: 1.3;
}
.product-meta { font-size: 0.75rem; color: #64748b; }
.product-meta b { color: #0284c7; }

/* Payment cell */
.total-amount {
  display: block;
  font-weight: 800;
  color: #dc2626;
  font-size: 0.95rem;
  margin-bottom: 4px;
}
.payment-method {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 6px;
}
.payment-badge-wrap { margin-top: 4px; }
.payment-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 700;
}
.payment-paid {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}
.payment-unpaid {
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
}

/* ============ ACTION BUTTONS ============ */
.action-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  font-family: inherit;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-action:hover { transform: translateY(-1px); }
.btn-complete {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
}
.btn-complete:hover {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
}
.btn-fail {
  background: #fff;
  color: #dc2626;
  border: 1.5px solid #fecaca;
}
.btn-fail:hover {
  background: #fef2f2;
  border-color: #dc2626;
}

/* ============ STATUS BLOCKS ============ */
.success-block,
.fail-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.status-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  width: fit-content;
}
.status-success {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}
.status-fail {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

/* Ảnh minh chứng */
.proof-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.proof-label {
  font-size: 0.72rem;
  color: #64748b;
  font-weight: 600;
}
.proof-thumb {
  width: 54px;
  height: 54px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  cursor: pointer;
  transition: all 0.2s;
}
.proof-thumb:hover {
  transform: scale(1.06);
  border-color: #0284c7;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.2);
}

.note-box {
  background: #fef2f2;
  border-left: 3px solid #dc2626;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  color: #991b1b;
  max-width: 240px;
  word-break: break-word;
  line-height: 1.4;
}

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
  background: #fff;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  border-radius: 14px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.25s ease-out;
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
  font-weight: 700;
  color: #0f172a;
}
.btn-close-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f1f5f9;
  border: none;
  color: #475569;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: all 0.2s;
}
.btn-close-circle:hover {
  background: #ef4444;
  color: #fff;
  transform: rotate(90deg);
}

.modal-body { padding: 20px 22px; overflow-y: auto; }
.modal-sub {
  margin: 0 0 14px;
  font-size: 0.875rem;
  color: #64748b;
}
.modal-sub b { color: #0284c7; }

.modal-footer {
  padding: 14px 22px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* File upload */
.file-upload {
  display: block;
  cursor: pointer;
  margin-bottom: 12px;
}
.file-upload input[type="file"] { display: none; }
.file-upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 11px 16px;
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

.preview-container {
  text-align: center;
  padding: 12px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}
.preview-img {
  max-width: 100%;
  max-height: 220px;
  object-fit: contain;
  border-radius: 8px;
}

.tech-textarea {
  width: 100%;
  padding: 11px 14px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  color: #0f172a;
  outline: none;
  transition: all 0.2s;
  resize: vertical;
  min-height: 100px;
  box-sizing: border-box;
}
.tech-textarea:focus {
  background: #fff;
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
}
.tech-textarea:disabled {
  background: #f1f5f9;
  color: #94a3b8;
  cursor: not-allowed;
}

/* Buttons in modal */
.btn-cancel-tech {
  padding: 10px 20px;
  background: #fff;
  border: 1px solid #cbd5e1;
  color: #475569;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.btn-cancel-tech:hover:not(:disabled) { background: #f1f5f9; }
.btn-cancel-tech:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-success-tech {
  padding: 10px 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
}
.btn-success-tech:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.35);
}
.btn-success-tech:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.btn-danger-tech {
  padding: 10px 20px;
  background: #dc2626;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
}
.btn-danger-tech:hover:not(:disabled) {
  background: #b91c1c;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.35);
}
.btn-danger-tech:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

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

/* Image modal */
.text-center { text-align: center; }
.img-enlarged {
  max-width: 100%;
  max-height: 560px;
  object-fit: contain;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
}

/* Transition */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ============ RESPONSIVE ============ */
@media (max-width: 992px) {
  .shipper-page { padding: 22px 20px; }
}
@media (max-width: 640px) {
  .shipper-page { padding: 16px 12px; }
  .page-title { font-size: 1.4rem; }
  .page-header { flex-direction: column; align-items: stretch; }
  .btn-refresh { justify-content: center; }
  .tabs-bar { overflow-x: auto; flex-wrap: nowrap; }
  .tab-btn { padding: 9px 14px; font-size: 0.8rem; }
  .modal-footer { flex-direction: column-reverse; }
  .modal-footer button { width: 100%; justify-content: center; }
}
</style>