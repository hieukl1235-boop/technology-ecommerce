<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const orders = ref([])
const shippers = ref([])
const currentTab = ref(1) // Mặc định hiển thị tab "Chờ xác nhận" (1)
const token = localStorage.getItem('token')

// Quản lý Modal chọn Shipper
const showModal = ref(false)
const selectedOrderCode = ref(null)
const selectedShipperId = ref('')

// Quản lý Modal xem lớn ảnh minh chứng
const showImageModal = ref(false)
const viewingImageUrl = ref(null)

// Quản lý Modal Hoàn tiền kèm biên lai
const showRefundModal = ref(false)
const orderCodeToRefund = ref(null)
const refundFile = ref(null)
const refundPreviewUrl = ref(null)

// Hàm dịch payment_method_id sang tên tiếng Việt
const getPaymentMethodName = (id) => {
  if (id === 1) return 'Thanh toán online (VNPay)'
  if (id === 2) return 'Tiền mặt khi nhận hàng (COD)'
  return 'Khác'
}

// 1. Lấy danh sách đơn hàng
const fetchOrders = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/admin/orders', {
      headers: { Authorization: `Bearer ${token}` },
    })
    orders.value = response.data.orders || []
  } catch (error) {
    console.error('Lỗi tải danh sách đơn hàng:', error)
  }
}

// 2. Lấy danh sách Shipper
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

// Lọc đơn hàng theo tab trạng thái đang chọn
const filteredOrders = computed(() => {
  return orders.value.filter((order) => order.order_status === currentTab.value)
})

// Chuyển trạng thái 1 -> 2 (Chờ xác nhận sang Đang chuẩn bị hàng)
const handlePrepareOrder = async (orderCode) => {
  try {
    const response = await axios.patch(
      `http://localhost:3000/api/admin/orders/${orderCode}/status`,
      { newStatus: 2 },
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (response.data.success) {
      alert('✅ Đã chuyển sang trạng thái: Đang chuẩn bị hàng!')
      fetchOrders()
    }
  } catch (error) {
    alert('❌ Cập nhật thất bại!')
  }
}

// Mở Modal chọn Shipper khi đơn đang ở trạng thái 2 muốn chuyển lên 3
const openAssignShipperModal = (orderCode) => {
  selectedOrderCode.value = orderCode
  selectedShipperId.value = ''
  showModal.value = true
}

// Xác nhận gán Shipper và chuyển đơn sang trạng thái 3 (Đang giao hàng)
const handleAssignShipper = async () => {
  if (!selectedShipperId.value) {
    alert('Vui lòng chọn một shipper!')
    return
  }

  try {
    const response = await axios.patch(
      `http://localhost:3000/api/admin/orders/${selectedOrderCode.value}/assign-shipper`,
      {
        newStatus: 3,
        shipperId: selectedShipperId.value,
      },
      { headers: { Authorization: `Bearer ${token}` } },
    )

    if (response.data.success) {
      alert('🚚 Đã phân công shipper và chuyển sang trạng thái Đang giao hàng!')
      showModal.value = false
      fetchOrders()
    }
  } catch (error) {
    console.error(error)
    alert('❌ Phân công shipper thất bại!')
  }
}

// Xử lý Hủy đơn hàng (Chỉ cho phép ở trạng thái 1 và 2)
const handleCancelOrder = async (orderCode) => {
  if (!confirm(`Bạn có chắc chắn muốn hủy đơn hàng ${orderCode} không?`)) {
    return
  }

  try {
    const response = await axios.patch(
      `http://localhost:3000/api/admin/orders/${orderCode}/cancel`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    )

    if (response.data.success) {
      alert('🚫 Đã hủy đơn hàng thành công!')
      fetchOrders()
    }
  } catch (error) {
    console.error(error)
    alert(error.response?.data?.message || '❌ Hủy đơn hàng thất bại!')
  }
}

// Xử lý đưa đơn hàng giao thất bại về lại trạng thái chuẩn bị (để giao lại)
const handleRetryOrder = async (orderCode) => {
  if (!confirm(`Bạn có muốn đưa đơn hàng ${orderCode} về trạng thái chuẩn bị để giao lại không?`)) return
  try {
    await axios.patch(`http://localhost:3000/api/admin/orders/${orderCode}/status`, { newStatus: 2 }, { headers: { Authorization: `Bearer ${token}` } })
    alert('🔄 Đã chuyển đơn hàng về trạng thái chuẩn bị để giao lại!')
    fetchOrders()
  } catch (err) {
    alert('❌ Thao tác thất bại!')
  }
}

// Mở Modal Hoàn tiền
const openRefundModal = (orderCode) => {
  orderCodeToRefund.value = orderCode
  refundFile.value = null
  refundPreviewUrl.value = null
  showRefundModal.value = true
}

const handleRefundFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    refundFile.value = file
    refundPreviewUrl.value = URL.createObjectURL(file)
  }
}

// Gửi dữ liệu hoàn tiền lên server
const submitRefundOrder = async () => {
  if (!refundFile.value) {
    alert('Vui lòng chọn ảnh biên lai hoàn tiền!')
    return
  }

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
      alert('💸 Đã xác nhận hoàn tiền và lưu biên lai thành công!')
      showRefundModal.value = false
      fetchOrders()
    }
  } catch (error) {
    console.error(error)
    alert('❌ Xử lý hoàn tiền thất bại!')
  }
}

// Mở modal xem ảnh minh chứng lớn
const openImageModal = (imageUrl) => {
  viewingImageUrl.value = `http://localhost:3000/uploads/refunds/${imageUrl}`
  showImageModal.value = true
}

onMounted(() => {
  fetchOrders()
  fetchShippers()
})
</script>

<template>
  <div class="admin-orders-container">
    <h2>📦 Quản lý Đơn hàng</h2>

    <!-- THANH TAB CHUYỂN TRẠNG THÁI -->
    <div class="tabs-container">
      <button :class="{ active: currentTab === 1 }" @click="currentTab = 1">
        Chờ xác nhận 
      </button>
      <button :class="{ active: currentTab === 2 }" @click="currentTab = 2">
        Đang chuẩn bị 
      </button>
      <button :class="{ active: currentTab === 3 }" @click="currentTab = 3">
        Đang giao hàng 
      </button>
      <button :class="{ active: currentTab === 4 }" @click="currentTab = 4">
        Đã hoàn thành 
      </button>
      <button :class="{ active: currentTab === 6 }" @click="currentTab = 6">
        Giao thất bại 
      </button>
      <button :class="{ active: currentTab === 5 }" @click="currentTab = 5">Đã hủy </button>
    </div>

    <!-- DANH SÁCH ĐƠN HÀNG THEO TAB -->
    <div v-if="filteredOrders.length === 0" class="empty-orders">
      Không có đơn hàng nào ở trạng thái này.
    </div>

    <table v-else class="orders-table">
      <thead>
        <tr>
          <th>Mã đơn hàng</th>
          <th>Khách hàng & Thanh toán</th>
          <th>Sản phẩm đặt mua</th>
          <th>Tổng tiền</th>
          <th>Hành động / Trạng thái</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in filteredOrders" :key="order.order_code">
          <!-- Mã đơn và ngày đặt -->
          <td>
            <b>{{ order.order_code }}</b><br />
            <small class="order-date">{{
              new Date(order.order_date).toLocaleString('vi-VN')
            }}</small>
          </td>

          <!-- Thông tin khách hàng & PTTT -->
          <td>
            <b>{{ order.recipient_name }}</b><br />
            <span class="phone-text">{{ order.phone }}</span><br />
            <small class="address-text">{{ order.shipping_address }}</small>

            <div class="payment-info">
              💳 <b>PTTT:</b> {{ getPaymentMethodName(order.payment_method_id) }} <br />
              💰 <b>Thanh toán:</b>
              <span v-if="order.payment_status === 1" class="paid-text">Đã thanh toán</span>
              <span v-else-if="order.payment_status === 2" class="paid-text">Đã hoàn tiền</span>
              <span v-else class="unpaid-text">Chưa thanh toán</span>
            </div>
          </td>

          <!-- Danh sách sản phẩm chi tiết -->
          <td>
            <div v-for="(item, index) in order.items" :key="index" class="product-item-row">
              <img
                v-if="item.image"
                :src="`http://localhost:3000/uploads/variants/${item.image}`"
                class="product-img"
              />
              <div>
                <b>{{ item.product_name }}</b> <span class="sku-text">(SKU: {{ item.sku }})</span><br />
                <span class="qty-price"
                  >SL: <b>{{ item.quantity }}</b> x
                  {{ Number(item.unit_price).toLocaleString('vi-VN') }} đ</span
                >
              </div>
            </div>
          </td>

          <!-- Tổng tiền -->
          <td class="total-amount">{{ Number(order.total_amount).toLocaleString('vi-VN') }} đ</td>

          <!-- Hành động tương ứng theo từng Tab -->
          <td>
            <!-- Tab 1: Xác nhận & Hủy -->
            <div v-if="order.order_status === 1" class="action-group">
              <button @click="handlePrepareOrder(order.order_code)" class="btn-action btn-prepare">
                🚀 Xác nhận & Chuẩn bị
              </button>
              <button
                @click="handleCancelOrder(order.order_code)"
                class="btn-action btn-cancel-order"
              >
                ❌ Hủy đơn
              </button>
            </div>

            <!-- Tab 2: Giao shipper & Hủy -->
            <div v-else-if="order.order_status === 2" class="action-group">
              <button
                @click="openAssignShipperModal(order.order_code)"
                class="btn-action btn-shipping"
              >
                🛵 Giao Shipper
              </button>
              <button
                @click="handleCancelOrder(order.order_code)"
                class="btn-action btn-cancel-order"
              >
                ❌ Hủy đơn
              </button>
            </div>

            <!-- Tab 3: Đang giao hàng -->
            <div v-else-if="order.order_status === 3" class="waiting-shipper-text">
              ⏳ Shipper đang thực hiện giao hàng...
            </div>

            <!-- Tab 4: Đã hoàn thành -->
            <div v-else-if="order.order_status === 4" class="completed-info">
              <span class="success-text">✨ Đã giao thành công</span>
              <div v-if="order.delivery_proof_id" class="mt-2">
                <small class="text-muted d-block mb-1">Ảnh minh chứng:</small>
                <img 
                  :src="`http://localhost:3000/uploads/proofs/${order.delivery_proof_id}`" 
                  alt="Proof" 
                  class="proof-thumbnail"
                  @click="openImageModal(order.delivery_proof_id)"
                  title="Bấm để xem lớn"
                />
              </div>
            </div>

            <!-- Tab 6: Giao thất bại -->
            <div v-else-if="order.order_status === 6" class="action-group">
              <span class="text-danger fw-bold small">⚠️ Giao không thành công</span>
              
              <div v-if="order.note" class="note-box my-1">
                <small><b>Lý do:</b> {{ order.note }}</small>
              </div>

              <div v-if="order.delivery_proof_id" class="mt-1 mb-2">
                <small class="text-muted d-block mb-1">Ảnh lý do/Hoàn trả:</small>
                <img 
                  :src="`http://localhost:3000/uploads/proofs/${order.delivery_proof_id}`" 
                  alt="Failed Proof" 
                  class="proof-thumbnail"
                  @click="openImageModal(order.delivery_proof_id)"
                  title="Bấm để xem lớn"
                />
              </div>
              <button @click="handleRetryOrder(order.order_code)" class="btn-action btn-retry">
                🔄 Giao lại đơn
              </button>
              <button @click="handleCancelOrder(order.order_code)" class="btn-action btn-cancel-order">
                ❌ Hủy đơn hoàn kho
              </button>
            </div>

            <!-- Tab 5: Đã hủy -->
            <div v-else-if="order.order_status === 5" class="cancelled-info">
              <span class="cancelled-text">🚫 Đã hủy</span> 
              
              <!-- Trường hợp đã thanh toán online nhưng chưa hoàn tiền -->
              <div v-if="order.payment_status === 1" class="mt-2">
                <span class="text-danger small d-block mb-1 font-weight-bold">⚠️ Cần hoàn tiền cho khách</span>
                <button @click="openRefundModal(order.order_code)" class="btn-action btn-refund">
                  💸 Xác nhận hoàn tiền
                </button>
              </div>

              <!-- Trường hợp đã hoàn tiền kèm ảnh biên lai -->
              <div v-else-if="order.payment_status === 2" class="mt-2">
                <span class="success-text small">✅ Đã hoàn tiền</span>
                <div v-if="order.refund_image_url" class="mt-1">
                  <small class="text-muted d-block mb-1">Biên lai:</small>
                  <img 
                    :src="`http://localhost:3000/uploads/refunds/${order.refund_image_url}`" 
                     alt="Refund Proof" 
                    class="proof-thumbnail"
                    @click="openImageModal(order.refund_image_url)"
                    title="Bấm để xem lớn"
                  />
                </div>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- MODAL CHỌN SHIPPER -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h3>🚚 Phân công Shipper giao hàng</h3>
        <p>
          Chọn nhân viên giao hàng cho đơn: <b>{{ selectedOrderCode }}</b>
        </p>

        <select v-model="selectedShipperId" class="shipper-select">
          <option disabled value="">-- Chọn Shipper --</option>
          <option v-for="shipper in shippers" :key="shipper.id" :value="shipper.id">
            {{ shipper.full_name || shipper.username }} (SĐT: {{ shipper.phone }})
          </option>
        </select>

        <div class="modal-actions">
          <button @click="showModal = false" class="btn-cancel">Đóng</button>
          <button @click="handleAssignShipper" class="btn-confirm">Xác nhận giao</button>
        </div>
      </div>
    </div>

    <!-- MODAL XÁC NHẬN HOÀN TIỀN KÈM BIÊN LAI -->
    <div v-if="showRefundModal" class="modal-overlay">
      <div class="modal-content">
        <h3>💸 Tải lên biên lai hoàn tiền</h3>
        <p>Đơn hàng: <b>{{ orderCodeToRefund }}</b></p>
        <input type="file" @change="handleRefundFileChange" accept="image/*" class="file-input" />
        
        <div v-if="refundPreviewUrl" class="preview-container">
          <img :src="refundPreviewUrl" class="preview-img" />
        </div>

        <div class="modal-actions">
          <button @click="showRefundModal = false" class="btn-cancel">Hủy</button>
          <button @click="submitRefundOrder" class="btn-confirm">Xác nhận hoàn tất</button>
        </div>
      </div>
    </div>

    <!-- MODAL XEM ẢNH MINH CHỨNG PHÓNG TO -->
    <div v-if="showImageModal" class="modal-overlay" @click="showImageModal = false">
      <div class="modal-content text-center" @click.stop>
        <h3>📸 Ảnh minh chứng / Hình ảnh thực tế</h3>
        <div class="my-3">
          <img :src="viewingImageUrl" alt="Enlarged Proof" class="img-fluid rounded border" style="max-height: 400px; object-fit: contain;" />
        </div>
        <button @click="showImageModal = false" class="btn btn-secondary btn-sm px-4">Đóng</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-orders-container {
  padding: 25px;
  font-family: sans-serif;
  max-width: 1300px;
  margin: 0 auto;
  background: #f9fbff;
  min-height: 100vh;
}
.tabs-container {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.tabs-container button {
  padding: 10px 16px;
  border: none;
  background: #e2e8f0;
  cursor: pointer;
  border-radius: 6px;
  font-weight: bold;
  color: #4a5568;
  transition: 0.2s;
}
.tabs-container button.active {
  background: #3182ce;
  color: white;
}
.empty-orders {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 8px;
  color: #7f8c8d;
}
.orders-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.orders-table th {
  background-color: #2c3e50;
  color: white;
  text-align: left;
  padding: 14px;
  font-size: 14px;
}
.orders-table td {
  padding: 14px;
  border-bottom: 1px solid #edf2f7;
  font-size: 14px;
  vertical-align: top;
}
.order-date {
  color: #95a5a6;
}
.phone-text {
  color: #e67e22;
  font-weight: 600;
}
.address-text {
  color: #7f8c8d;
  display: block;
  max-width: 220px;
  line-height: 1.4;
  margin-bottom: 6px;
}
.payment-info {
  margin-top: 6px;
  font-size: 13px;
  border-top: 1px dashed #eee;
  padding-top: 4px;
  color: #4a5568;
}
.paid-text {
  color: #38a169;
  font-weight: bold;
}
.unpaid-text {
  color: #e53e3e;
  font-weight: bold;
}
.product-item-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  border-bottom: 1px dashed #f1f5f9;
  padding-bottom: 6px;
}
.product-item-row:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}
.product-img {
  width: 40px;
  height: 40px;
  object-fit: contain;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
}
.sku-text {
  color: #718096;
  font-size: 12px;
}
.qty-price {
  color: #4a5568;
  font-size: 13px;
}
.total-amount {
  color: #e53e3e;
  font-weight: bold;
  white-space: nowrap;
}
.action-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.btn-action {
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;
}
.btn-prepare {
  background: #3182ce;
  color: white;
}
.btn-shipping {
  background: #d69e2e;
  color: white;
}
.btn-retry {
  background: #3182ce;
  color: white;
}
.btn-cancel-order {
  background: #e53e3e;
  color: white;
}
.btn-refund {
  background: #2b6cb0;
  color: white;
}
.waiting-shipper-text {
  color: #d69e2e;
  font-style: italic;
  font-size: 13px;
}
.success-text {
  color: #38a169;
  font-weight: bold;
  font-size: 13px;
  display: block;
}
.cancelled-text {
  color: #e53e3e;
  font-weight: bold;
  font-size: 13px;
  display: block;
}
.proof-thumbnail {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  cursor: pointer;
  transition: 0.2s;
}
.proof-thumbnail:hover {
  transform: scale(1.05);
  border-color: #3182ce;
}

/* Modal CSS chung */
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
  z-index: 1000;
}
.modal-content {
  background: white;
  padding: 25px;
  border-radius: 8px;
  width: 450px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}
.shipper-select {
  width: 100%;
  padding: 10px;
  margin: 15px 0;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
}
.file-input {
  margin: 15px 0;
  width: 100%;
}
.preview-container {
  text-align: center;
  margin-bottom: 15px;
}
.preview-img {
  max-width: 100%;
  max-height: 180px;
  object-fit: contain;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 15px;
}
.btn-cancel {
  background: #cbd5e0;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
}
.btn-confirm {
  background: #38a169;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
}
.note-box {
  background: #fff5f5;
  border-left: 3px solid #e53e3e;
  padding: 6px 8px;
  color: #c53030;
  font-size: 12px;
  border-radius: 4px;
  max-width: 220px;
  word-break: break-word;
}
</style>