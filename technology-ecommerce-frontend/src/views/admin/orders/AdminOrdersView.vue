<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'

// ================= STATE =================
const orders = ref([])
const shippers = ref([])
const currentTab = ref(1)
const token = localStorage.getItem('token')

// Bộ lọc thanh toán
const paymentFilter = ref('all') // 'all' | 'unpaid' | 'paid' | 'refunded'

// Modal shipper
const showModal = ref(false)
const selectedOrderCode = ref(null)
const selectedShipperId = ref('')
const assignMode = ref('assign') // 'assign' | 'change'
const currentShipperId = ref(null)

// Custom select shipper (có avatar)
const showShipperDropdown = ref(false)
const shipperSelectRef = ref(null)
const dropdownDirection = ref('down') // 'down' | 'up'

// Modal ảnh
const showImageModal = ref(false)
const viewingImageUrl = ref(null)

// Modal hoàn tiền
const showRefundModal = ref(false)
const orderCodeToRefund = ref(null)
const refundFile = ref(null)
const refundPreviewUrl = ref(null)

// UI state
const isLoading = ref(false)
const actionLoadingCode = ref(null)
const isSubmittingRefund = ref(false)
const refundFileInputRef = ref(null)
const message = ref('')
const messageType = ref('success')
let messageTimer = null

// Tab config
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

const getShipperName = (order) => {
  if (order.shipper_name) return order.shipper_name
  if (order.shipper_id) {
    const s = shippers.value.find((x) => x.id === order.shipper_id)
    if (s) return s.full_name || s.username
  }
  return 'Chưa phân công'
}

const getShipperPhone = (order) => {
  if (order.shipper_phone) return order.shipper_phone
  if (order.shipper_id) {
    const s = shippers.value.find((x) => x.id === order.shipper_id)
    if (s) return s.phone
  }
  return ''
}

// Lấy avatar của shipper theo order
// Lấy avatar của shipper theo order
const getShipperAvatar = (order) => {
  // 1. Ưu tiên field API trả kèm trong order (nếu có)
  if (order.shipper_avatar) return order.shipper_avatar

  // 2. Nếu không có, tìm trong danh sách shippers theo shipper_id
  if (order.shipper_id) {
    const s = shippers.value.find((x) => x.id === order.shipper_id)
    if (s && s.avatar) return s.avatar
  }

  // 3. Không có avatar → trả rỗng để fallback chữ cái đầu
  return ''
}

// Lấy chữ cái đầu của shipper (fallback khi không có avatar)
const getShipperInitial = (order) => {
  const name = getShipperName(order)
  if (!name || name === 'Chưa phân công') return 'S'
  return name.charAt(0).toUpperCase()
}

// ================= CUSTOM SELECT SHIPPER =================
const selectedShipperInfo = computed(
  () => shippers.value.find((s) => s.id === selectedShipperId.value) || null,
)

const getInitial = (shipper) => {
  const name = shipper?.full_name || shipper?.username || 'S'
  return name.charAt(0).toUpperCase()
}

const selectShipper = (shipper) => {
  selectedShipperId.value = shipper.id
  showShipperDropdown.value = false
}

// Toggle dropdown + tự xác định hướng mở (lên/xuống)
const toggleShipperDropdown = () => {
  if (!showShipperDropdown.value) {
    const trigger = shipperSelectRef.value?.querySelector('.custom-select-trigger')
    if (trigger) {
      const rect = trigger.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      dropdownDirection.value =
        spaceBelow < 260 && spaceAbove > spaceBelow ? 'up' : 'down'
    }
  }
  showShipperDropdown.value = !showShipperDropdown.value
}

const handleClickOutsideShipper = (e) => {
  if (shipperSelectRef.value && !shipperSelectRef.value.contains(e.target)) {
    showShipperDropdown.value = false
  }
}

// ================= API =================
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

// Lọc theo tab + thanh toán
const filteredOrders = computed(() => {
  return orders.value.filter((order) => {
    if (order.order_status !== currentTab.value) return false
    if (paymentFilter.value === 'paid' && order.payment_status !== 1) return false
    if (paymentFilter.value === 'unpaid' && order.payment_status !== 0) return false
    if (paymentFilter.value === 'refunded' && order.payment_status !== 2) return false
    return true
  })
})

// ================= ACTIONS =================
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

const openAssignShipperModal = (orderCode, mode = 'assign', shipperId = null) => {
  selectedOrderCode.value = orderCode
  assignMode.value = mode
  currentShipperId.value = shipperId
  selectedShipperId.value = shipperId || ''
  showShipperDropdown.value = false
  dropdownDirection.value = 'down'
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
    const payload = { newStatus: 3, shipperId: selectedShipperId.value }

    const response = await axios.patch(
      `http://localhost:3000/api/admin/orders/${selectedOrderCode.value}/assign-shipper`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (response.data.success) {
      showMessage(
        assignMode.value === 'assign'
          ? '🚚 Đã phân công shipper và chuyển sang Đang giao hàng!'
          : '🔄 Đã đổi shipper thành công!',
        'success',
      )
      showModal.value = false
      await fetchOrders()
    }
  } catch (error) {
    console.error(error)
    showMessage(
      error.response?.data?.message ||
      (assignMode.value === 'assign'
        ? '❌ Phân công shipper thất bại!'
        : '❌ Đổi shipper thất bại!'),
      'error',
    )
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

// ================= HOÀN TIỀN =================
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

// ================= ẢNH =================
const openImageModal = (imageUrl) => {
  viewingImageUrl.value = `http://localhost:3000/uploads/refunds/${imageUrl}`
  showImageModal.value = true
}

const openProofImage = (proofId) => {
  viewingImageUrl.value = `http://localhost:3000/uploads/proofs/${proofId}`
  showImageModal.value = true
}

// ================= LIFECYCLE =================
onMounted(() => {
  fetchOrders()
  fetchShippers()
  document.addEventListener('click', handleClickOutsideShipper)
})

onBeforeUnmount(() => {
  if (messageTimer) clearTimeout(messageTimer)
  if (refundPreviewUrl.value) URL.revokeObjectURL(refundPreviewUrl.value)
  document.removeEventListener('click', handleClickOutsideShipper)
})
</script>

<template>
  <div >
    <!-- HEADER -->
    <div class="page-header">
      <div class="header-titles">

        <p class="page-sub">
          Tổng cộng <b>{{ orders.length }}</b> đơn • Đang xem <b>{{ filteredOrders.length }}</b> đơn
        </p>
      </div>
      <button class="btn-refresh" @click="fetchOrders" :disabled="isLoading">
        <span v-if="isLoading" class="spinner-xs"></span>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 1 1-3-6.7L21 8"></path>
          <polyline points="21 3 21 8 16 8"></polyline>
        </svg>
        <span>Tải lại</span>
      </button>
    </div>

    <!-- ALERT -->
    <transition name="slide-fade">
      <div v-if="message" class="alert-banner" :class="messageType === 'error' ? 'alert-error' : 'alert-success'">
        <span>{{ message }}</span>
        <button type="button" class="btn-close-msg" @click="message = ''">✕</button>
      </div>
    </transition>

    <!-- TABS -->
    <div class="tabs-bar">
      <button v-for="tab in tabs" :key="tab.key" class="tab-btn" :class="{ active: currentTab === tab.key }"
        @click="currentTab = tab.key">
        <span>{{ tab.label }}</span>
        <span class="tab-count">{{ tabCounts[tab.key] || 0 }}</span>
      </button>
    </div>

    <!-- FILTER THANH TOÁN -->
    <div class="filter-bar">
      <span class="filter-label">💰 Thanh toán:</span>
      <button v-for="opt in [
        { key: 'all', label: 'Tất cả' },
        { key: 'unpaid', label: 'Chưa thanh toán' },
        { key: 'paid', label: 'Đã thanh toán' },
        { key: 'refunded', label: 'Đã hoàn tiền' },
      ]" :key="opt.key" class="filter-chip" :class="{ active: paymentFilter === opt.key }"
        @click="paymentFilter = opt.key">
        {{ opt.label }}
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
        <p class="empty-sub">Hiện không có đơn hàng nào phù hợp bộ lọc.</p>
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
                  <img v-if="item.image" :src="`http://localhost:3000/uploads/variants/${item.image}`"
                    class="product-img" loading="lazy" />
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
                  <button class="btn-action btn-primary-action" :disabled="actionLoadingCode === order.order_code"
                    @click="handlePrepareOrder(order.order_code)">
                    <span v-if="actionLoadingCode === order.order_code" class="spinner-xs"></span>
                    <span>🚀 Xác nhận &amp; Chuẩn bị</span>
                  </button>
                  <button class="btn-action btn-danger-action" :disabled="actionLoadingCode === order.order_code"
                    @click="handleCancelOrder(order.order_code)">
                    ❌ Hủy đơn
                  </button>
                </div>

                <!-- TAB 2 -->
                <div v-else-if="order.order_status === 2" class="action-group">
                  <button class="btn-action btn-warning-action" @click="openAssignShipperModal(order.order_code)">
                    🛵 Giao Shipper
                  </button>
                  <button class="btn-action btn-danger-action" :disabled="actionLoadingCode === order.order_code"
                    @click="handleCancelOrder(order.order_code)">
                    ❌ Hủy đơn
                  </button>
                </div>

                <!-- TAB 3 -->
                <div v-else-if="order.order_status === 3" class="action-group">
                  <div class="shipper-card">
                    <div class="shipper-avatar">
                      <img v-if="getShipperAvatar(order)"
                        :src="`http://localhost:3000/uploads/avatars/${getShipperAvatar(order)}`" alt="Shipper"
                        class="shipper-avatar-img" />
                      <span v-else>{{ getShipperInitial(order) }}</span>
                    </div>
                    <div class="shipper-info">
                      <span class="shipper-name">{{ getShipperName(order) }}</span>
                      <span v-if="getShipperPhone(order)" class="shipper-phone">
                        📞 {{ getShipperPhone(order) }}
                      </span>
                    </div>
                  </div>

                  <span class="info-inline info-warning">⏳ Đang giao hàng</span>

                  <button class="btn-action btn-change-shipper" :disabled="actionLoadingCode === order.order_code"
                    @click="openAssignShipperModal(order.order_code, 'change', order.shipper_id)">
                    <span v-if="actionLoadingCode === order.order_code" class="spinner-xs"></span>
                    <span v-else>🔄 Đổi shipper</span>
                  </button>
                </div>

                <!-- TAB 4 -->
                <div v-else-if="order.order_status === 4" class="action-group">
                  <span class="info-inline info-success">✨ Đã giao thành công</span>

                  <!-- Shipper đã giao đơn này -->
                  <div class="shipper-card shipper-card-success">
                    <div class="shipper-avatar">
                      <img v-if="getShipperAvatar(order)"
                        :src="`http://localhost:3000/uploads/avatars/${getShipperAvatar(order)}`" alt="Shipper"
                        class="shipper-avatar-img" />
                      <span v-else>{{ getShipperInitial(order) }}</span>
                    </div>
                    <div class="shipper-info">
                      <span class="shipper-name">{{ getShipperName(order) }}</span>
                      <span v-if="getShipperPhone(order)" class="shipper-phone">
                        📞 {{ getShipperPhone(order) }}
                      </span>
                    </div>
                  </div>

                  <div v-if="order.delivery_proof_id" class="proof-wrap">
                    <span class="proof-label">Ảnh minh chứng:</span>
                    <img :src="`http://localhost:3000/uploads/proofs/${order.delivery_proof_id}`" alt="Proof"
                      class="proof-thumbnail" @click="openProofImage(order.delivery_proof_id)" title="Bấm để xem lớn" />
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
                    <img :src="`http://localhost:3000/uploads/proofs/${order.delivery_proof_id}`" alt="Failed Proof"
                      class="proof-thumbnail" @click="openProofImage(order.delivery_proof_id)" />
                  </div>
                  <button class="btn-action btn-primary-action" :disabled="actionLoadingCode === order.order_code"
                    @click="handleRetryOrder(order.order_code)">
                    🔄 Giao lại đơn
                  </button>
                  <button class="btn-action btn-danger-action" :disabled="actionLoadingCode === order.order_code"
                    @click="handleCancelOrder(order.order_code)">
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
                      <img :src="`http://localhost:3000/uploads/refunds/${order.refund_image_url}`" alt="Refund Proof"
                        class="proof-thumbnail" @click="openImageModal(order.refund_image_url)" />
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
          <h3 class="modal-title">
            {{ assignMode === 'assign' ? '🚚 Phân công Shipper' : '🔄 Đổi Shipper' }}
          </h3>
          <button class="btn-close-circle" @click="showModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-sub">
            {{ assignMode === 'assign' ? 'Chọn nhân viên giao hàng cho đơn' : 'Chọn shipper mới cho đơn' }}
            <b>{{ selectedOrderCode }}</b>
          </p>

          <p v-if="assignMode === 'change' && currentShipperId" class="modal-current">
            Shipper hiện tại:
            <b>{{shippers.find((s) => s.id === currentShipperId)?.full_name || '—'}}</b>
          </p>

          <!-- Custom dropdown shipper có avatar -->
          <div class="custom-select" ref="shipperSelectRef">
            <!-- Trigger -->
            <div class="custom-select-trigger tech-input" :class="{ 'is-open': showShipperDropdown }"
              @click="toggleShipperDropdown">
              <div v-if="selectedShipperInfo" class="d-flex align-items-center gap-2 flex-grow-1">
                <div class="shipper-avatar-xs">
                  <img v-if="selectedShipperInfo.avatar"
                    :src="`http://localhost:3000/uploads/avatars/${selectedShipperInfo.avatar}`" alt="avatar" />
                  <span v-else>{{ getInitial(selectedShipperInfo) }}</span>
                </div>
                <div class="shipper-select-text">
                  <span class="shipper-select-name">
                    {{ selectedShipperInfo.full_name || selectedShipperInfo.username }}
                  </span>
                  <span class="shipper-select-phone">📞 {{ selectedShipperInfo.phone }}</span>
                </div>
              </div>
              <span v-else class="text-muted flex-grow-1">-- Chọn Shipper --</span>

              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="dropdown-arrow" :class="{ rotated: showShipperDropdown }">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>

            <!-- Menu -->
            <ul v-if="showShipperDropdown" class="custom-select-menu"
              :class="{ 'drop-up': dropdownDirection === 'up' }">
              <li v-for="shipper in shippers" :key="shipper.id" class="custom-select-item"
                :class="{ active: selectedShipperId === shipper.id }" @click="selectShipper(shipper)">
                <div class="shipper-avatar-xs">
                  <img v-if="shipper.avatar" :src="`http://localhost:3000/uploads/avatars/${shipper.avatar}`"
                    alt="avatar" />
                  <span v-else>{{ getInitial(shipper) }}</span>
                </div>
                <div class="flex-grow-1">
                  <div class="fw-semibold">{{ shipper.full_name || shipper.username }}</div>
                  <small class="text-muted">SĐT: {{ shipper.phone }}</small>
                </div>
                <span v-if="selectedShipperId === shipper.id" class="check-mark">✓</span>
              </li>
            </ul>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel-tech" @click="showModal = false">Đóng</button>
          <button class="btn-primary-tech" :disabled="!selectedShipperId || actionLoadingCode === selectedOrderCode"
            @click="handleAssignShipper">
            <span v-if="actionLoadingCode === selectedOrderCode" class="spinner-sm"></span>
            <span>{{ assignMode === 'assign' ? 'Xác nhận giao' : 'Xác nhận đổi' }}</span>
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
            <input ref="refundFileInputRef" type="file" accept="image/*" @change="handleRefundFileChange"
              :disabled="isSubmittingRefund" />
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

.header-titles {
  flex: 1;
  min-width: 0;
}

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

.page-sub {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
}

.page-sub b {
  color: #0284c7;
}

.btn-back,
.btn-refresh {
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

.btn-back:hover,
.btn-refresh:hover:not(:disabled) {
  background: #f0f9ff;
  color: #0284c7;
  border-color: #0284c7;
}

.btn-back:hover {
  transform: translateX(-2px);
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.alert-success {
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #15803d;
}

.alert-error {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

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

.btn-close-msg:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.05);
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ============ TABS ============ */
.tabs-bar {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
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

.tab-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

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

/* ============ FILTER BAR ============ */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 12px 14px;
  margin-bottom: 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.filter-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #475569;
  margin-right: 4px;
}

.filter-chip {
  padding: 7px 14px;
  background: #f1f5f9;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.filter-chip:hover {
  background: #e2e8f0;
}

.filter-chip.active {
  background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(2, 132, 199, 0.3);
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

.custom-table tbody tr {
  transition: background-color 0.15s ease;
}

.custom-table tbody tr:hover {
  background-color: #f8fafc;
}

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

.order-date {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
}

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

.pay-label {
  color: #94a3b8;
  font-weight: 600;
}

.paid-tag {
  color: #059669;
  font-weight: 700;
}

.unpaid-tag {
  color: #dc2626;
  font-weight: 700;
}

/* ============ PRODUCT ITEMS ============ */
.product-item-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px dashed #f1f5f9;
}

.product-item-row:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

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

.product-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.product-name {
  font-weight: 700;
  color: #0f172a;
  font-size: 0.85rem;
}

.product-sku {
  color: #94a3b8;
  font-size: 0.72rem;
}

.product-qty {
  color: #475569;
  font-size: 0.78rem;
}

.product-qty b {
  color: #0284c7;
}

.total-amount {
  color: #dc2626;
  font-weight: 800;
  font-size: 0.95rem;
  white-space: nowrap;
}

/* ============ ACTION GROUPS ============ */
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
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

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

.btn-refund-action:hover {
  transform: translateY(-1px);
}

.btn-change-shipper {
  background: #ffffff;
  color: #0284c7;
  border: 1.5px solid #bae6fd;
}

.btn-change-shipper:hover:not(:disabled) {
  background: #f0f9ff;
  border-color: #0284c7;
  transform: translateY(-1px);
}

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

.info-warning {
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
}

.info-success {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.info-danger {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

/* ============ SHIPPER CARD (tab 3 + tab 4) ============ */
.shipper-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 10px;
}

.shipper-card-success {
  background: #ecfdf5;
  border-color: #a7f3d0;
}

.shipper-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  color: #0284c7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid #bae6fd;
  box-shadow: 0 2px 6px rgba(2, 132, 199, 0.2);
}

.shipper-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.shipper-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.shipper-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shipper-phone {
  font-size: 0.75rem;
  color: #0369a1;
  font-weight: 600;
}

.note-box {
  background: #fef2f2;
  border-left: 3px solid #dc2626;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  color: #991b1b;
  word-break: break-word;
}

.refund-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.refund-warning {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #dc2626;
}

/* ============ PROOF IMAGE ============ */
.proof-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.proof-label {
  font-size: 0.72rem;
  color: #94a3b8;
  font-weight: 600;
}

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

.loading-state p {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

.empty-state-big {
  text-align: center;
  padding: 70px 20px;
}

.empty-icon {
  font-size: 52px;
  opacity: 0.5;
  margin-bottom: 10px;
}

.empty-title {
  margin: 0 0 4px 0;
  font-weight: 700;
  color: #475569;
  font-size: 1.05rem;
}

.empty-sub {
  margin: 0;
  font-size: 0.85rem;
  color: #94a3b8;
}

/* ============ SPINNERS ============ */
.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e2e8f0;
  border-top-color: #0284c7;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-sm {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

.spinner-xs {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(2, 132, 199, 0.25);
  border-top-color: #0284c7;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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
  background: #ffffff;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  border-radius: 14px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: visible;
  animation: slideUp 0.3s ease-out;
}

.modal-image {
  max-width: 640px;
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
  padding: 18px 22px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: 14px 14px 0 0;
  background: #ffffff;
}

.modal-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
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
  color: #ffffff;
  transform: rotate(90deg);
}

.modal-body {
  padding: 20px 22px;
  overflow-y: auto;
  max-height: calc(90vh - 130px);
}

.modal-sub {
  margin: 0 0 12px 0;
  font-size: 0.88rem;
  color: #64748b;
}

.modal-sub b {
  color: #0284c7;
}

.modal-current {
  margin: 0 0 12px 0;
  padding: 8px 12px;
  background: #f0f9ff;
  border-left: 3px solid #0284c7;
  border-radius: 6px;
  font-size: 0.82rem;
  color: #0369a1;
}

.modal-current b {
  color: #0f172a;
}

.modal-footer {
  padding: 14px 22px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-radius: 0 0 14px 14px;
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

/* ============ CUSTOM SELECT SHIPPER (có avatar) ============ */
.custom-select {
  position: relative;
  width: 100%;
}

.custom-select-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  min-height: 44px;
}

.custom-select-trigger.is-open {
  border-color: #0284c7;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
}

.dropdown-arrow {
  color: #94a3b8;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
  color: #0284c7;
}

.custom-select-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 220px;
  overflow-y: auto;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  list-style: none;
  padding: 6px;
  margin: 0;
  z-index: 100;
  animation: dropdownIn 0.15s ease-out;
}

.custom-select-menu.drop-up {
  top: auto;
  bottom: calc(100% + 4px);
  animation: dropdownUp 0.15s ease-out;
}

@keyframes dropdownIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes dropdownUp {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.custom-select-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.custom-select-item:hover {
  background: #f0f9ff;
}

.custom-select-item.active {
  background: #e0f2fe;
}

.custom-select-item.active .fw-semibold {
  color: #0284c7;
}

.check-mark {
  color: #0284c7;
  font-weight: 800;
  margin-left: auto;
}

/* Avatar nhỏ trong dropdown */
.shipper-avatar-xs {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  color: #0284c7;
  font-weight: 700;
  font-size: 0.78rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid #bae6fd;
}

.shipper-avatar-xs img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

/* Text trong trigger */
.shipper-select-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  min-width: 0;
}

.shipper-select-name {
  font-weight: 700;
  font-size: 0.88rem;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shipper-select-phone {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

/* Scrollbar đẹp cho dropdown */
.custom-select-menu::-webkit-scrollbar {
  width: 6px;
}

.custom-select-menu::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.custom-select-menu::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.custom-select-menu::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* ============ FILE UPLOAD ============ */
.file-upload {
  display: block;
  cursor: pointer;
  margin-bottom: 12px;
}

.file-upload input[type="file"] {
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
  padding: 10px;
}

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

.btn-cancel-tech:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

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

.btn-primary-tech:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

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
  .order-page-wrapper {
    padding: 22px 20px;
  }
}

@media (max-width: 640px) {
  .order-page-wrapper {
    padding: 16px 12px;
  }

  .page-title {
    font-size: 1.4rem;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-back,
  .btn-refresh {
    justify-content: center;
  }

  .tabs-bar {
    overflow-x: auto;
    flex-wrap: nowrap;
  }
}
</style>