<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const orders = ref([])
const currentTab = ref(3) // Mặc định hiển thị tab "Đang giao hàng" (3)
const token = localStorage.getItem('token')

// Quản lý Modal Hoàn thành đơn hàng
const showCompleteModal = ref(false)
const orderCodeToComplete = ref(null)
const completeFile = ref(null)
const completePreviewUrl = ref(null)

// Quản lý Modal Giao thất bại (Chỉ dùng nhập lý do văn bản)
const showFailModal = ref(false)
const orderCodeToFail = ref(null)
const failReason = ref('')

// Hàm dịch phương thức thanh toán
const getPaymentMethodName = (id) => {
  if (id === 1) return 'Thanh toán online (VNPay)'
  if (id === 2) return 'Tiền mặt khi nhận hàng (COD)'
  return 'Khác'
}

// Lấy danh sách đơn hàng được phân cho shipper này
const fetchShipperOrders = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/shipper/orders', {
      headers: { Authorization: `Bearer ${token}` },
    })
    orders.value = response.data.orders || []
  } catch (error) {
    console.error('Lỗi tải danh sách đơn hàng của shipper:', error)
  }
}

// Lọc đơn hàng theo tab trạng thái
const filteredOrders = computed(() => {
  return orders.value.filter((order) => order.order_status === currentTab.value)
})

// Mở modal Hoàn thành đơn
const openCompleteModal = (orderCode) => {
  orderCodeToComplete.value = orderCode
  completeFile.value = null
  completePreviewUrl.value = null
  showCompleteModal.value = true
}

const handleCompleteFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    completeFile.value = file
    completePreviewUrl.value = URL.createObjectURL(file)
  }
}

// Gửi dữ liệu hoàn thành đơn lên server
const submitCompleteOrder = async () => {
  if (!completeFile.value) {
    alert('Vui lòng chụp hoặc chọn ảnh minh chứng giao hàng!')
    return
  }

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
      alert('🎉 Giao hàng thành công! Đã lưu ảnh minh chứng.')
      showCompleteModal.value = false
      fetchShipperOrders()
    }
  } catch (error) {
    console.error(error)
    alert('❌ Xử lý thất bại!')
  }
}

// Mở modal Giao thất bại
const openFailModal = (orderCode) => {
  orderCodeToFail.value = orderCode
  failReason.value = ''
  showFailModal.value = true
}

// Gửi dữ liệu giao thất bại lên server (Dạng lý do text)
const submitFailOrder = async () => {
  if (!failReason.value.trim()) {
    alert('Vui lòng nhập lý do giao thất bại!')
    return
  }

  try {
    const response = await axios.patch(
      `http://localhost:3000/api/shipper/orders/${orderCodeToFail.value}/fail`,
      { reason: failReason.value },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    if (response.data.success) {
      alert('⚠️ Đã cập nhật trạng thái giao không thành công.')
      showFailModal.value = false
      fetchShipperOrders()
    }
  } catch (error) {
    console.error(error)
    alert('❌ Xử lý thất bại!')
  }
}

onMounted(() => {
  fetchShipperOrders()
})
</script>

<template>
  <div class="shipper-orders-container">
    <h2>🛵 Cổng thông tin Shipper</h2>

    <!-- THANH TAB TRẠNG THÁI CHO SHIPPER -->
    <div class="tabs-container">
      <button :class="{ active: currentTab === 3 }" @click="currentTab = 3">
        Đang giao hàng (Cần xử lý)
      </button>
      <button :class="{ active: currentTab === 4 }" @click="currentTab = 4">
        Đã giao thành công
      </button>
      <button :class="{ active: currentTab === 6 }" @click="currentTab = 6">
        Giao thất bại
      </button>
    </div>

    <!-- DANH SÁCH ĐƠN HÀNG -->
    <div v-if="filteredOrders.length === 0" class="empty-orders">
      Không có đơn hàng nào trong mục này.
    </div>

    <table v-else class="orders-table">
      <thead>
        <tr>
          <th>Mã đơn & Thời gian</th>
          <th>Khách hàng & Địa chỉ</th>
          <th>Sản phẩm</th>
          <th>Thanh toán & Tổng tiền</th>
          <th>Thao tác của Shipper</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in filteredOrders" :key="order.order_code">
          <td>
            <b>{{ order.order_code }}</b><br />
            <small class="text-muted">{{ new Date(order.order_date).toLocaleString('vi-VN') }}</small>
          </td>
          <td>
            <b>{{ order.recipient_name }}</b> <br />
            <span class="phone-text">{{ order.phone }}</span> <br />
            <small class="address-text">{{ order.shipping_address }}</small>
          </td>
          <td>
            <div v-for="(item, idx) in order.items" :key="idx" class="product-item-row">
              <img :src="`http://localhost:3000/uploads/variants/${item.image}`" class="product-img" />
              <div>
                <b>{{ item.product_name }}</b> (SL: {{ item.quantity }})<br />
                <small class="sku-text">SKU: {{ item.sku }}</small>
              </div>
            </div>
          </td>
          <td>
            <b class="total-amount">{{ Number(order.total_amount).toLocaleString('vi-VN') }} đ</b><br />
            <small class="d-block mt-1">💳 {{ getPaymentMethodName(order.payment_method_id) }}</small>
            <div class="mt-1">
              <span v-if="order.payment_status === 1" class="paid-badge">Đã thanh toán</span>
              <span v-else class="unpaid-badge">Chưa thanh toán (COD)</span>
            </div>
          </td>
          <td>
            <!-- Nếu ở Tab 3: Hiển thị nút Hoàn thành hoặc Giao thất bại -->
            <div v-if="order.order_status === 3" class="action-group">
              <button @click="openCompleteModal(order.order_code)" class="btn-action btn-complete">
                ✅ Giao thành công
              </button>
              <button @click="openFailModal(order.order_code)" class="btn-action btn-fail">
                ❌ Giao thất bại
              </button>
            </div>

            <!-- Tab 4: Đã giao thành công -->
            <span v-else-if="order.order_status === 4" class="success-text">
              ✨ Hoàn tất giao hàng
            </span>

            <!-- Tab 6: Giao thất bại (Hiển thị trạng thái kèm theo note lý do) -->
            <div v-else-if="order.order_status === 6" class="fail-container">
              <span class="fail-text">⚠️ Đã báo cáo giao thất bại</span>
              <div v-if="order.note" class="note-box mt-1">
                <small><b>Lý do:</b> {{ order.note }}</small>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- MODAL XÁC NHẬN GIAO THÀNH CÔNG -->
    <div v-if="showCompleteModal" class="modal-overlay">
      <div class="modal-content">
        <h3>📸 Tải lên ảnh minh chứng giao thành công</h3>
        <p>Đơn hàng: <b>{{ orderCodeToComplete }}</b></p>
        <input type="file" @change="handleCompleteFileChange" accept="image/*" class="file-input" />
        
        <div v-if="completePreviewUrl" class="preview-container">
          <img :src="completePreviewUrl" class="preview-img" />
        </div>

        <div class="modal-actions">
          <button @click="showCompleteModal = false" class="btn-cancel">Hủy</button>
          <button @click="submitCompleteOrder" class="btn-confirm">Xác nhận hoàn thành</button>
        </div>
      </div>
    </div>

    <!-- MODAL BÁO CÁO GIAO THẤT BẠI (NHẬP LÝ DO) -->
    <div v-if="showFailModal" class="modal-overlay">
      <div class="modal-content">
        <h3>⚠️ Nhập lý do giao thất bại</h3>
        <p>Đơn hàng: <b>{{ orderCodeToFail }}</b></p>
        
        <textarea 
          v-model="failReason" 
          placeholder="Nhập lý do cụ thể (Ví dụ: Khách hẹn giao lại ngày mai, thuê bao không liên lạc được...)" 
          rows="4" 
          class="reason-textarea"
        ></textarea>

        <div class="modal-actions">
          <button @click="showFailModal = false" class="btn-cancel">Hủy</button>
          <button @click="submitFailOrder" class="btn-confirm-fail">Xác nhận giao thất bại</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shipper-orders-container {
  padding: 25px;
  font-family: sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  background: #f4f7f6;
  min-height: 100vh;
}
.tabs-container {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
.tabs-container button {
  padding: 10px 16px;
  border: none;
  background: #e2e8f0;
  cursor: pointer;
  border-radius: 6px;
  font-weight: bold;
  color: #4a5568;
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
}
.orders-table td {
  padding: 14px;
  border-bottom: 1px solid #edf2f7;
  vertical-align: top;
}
.phone-text {
  color: #e67e22;
  font-weight: bold;
}
.address-text {
  color: #7f8c8d;
  font-size: 13px;
  display: block;
  max-width: 200px;
}
.product-item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.product-img {
  width: 35px;
  height: 35px;
  object-fit: contain;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.sku-text {
  color: #718096;
  font-size: 11px;
}
.total-amount {
  color: #e53e3e;
}
.paid-badge {
  display: inline-block;
  background: #c6f6d5;
  color: #22543d;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}
.unpaid-badge {
  display: inline-block;
  background: #fed7d7;
  color: #742a2a;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}
.action-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.btn-action {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;
}
.btn-complete {
  background: #38a169;
  color: white;
}
.btn-fail {
  background: #e53e3e;
  color: white;
}
.success-text {
  color: #38a169;
  font-weight: bold;
}
.fail-text {
  color: #e53e3e;
  font-weight: bold;
  display: block;
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

/* Modal Styling */
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
  width: 420px;
}
.file-input {
  margin: 15px 0;
  width: 100%;
}
.reason-textarea {
  width: 100%;
  padding: 10px;
  margin: 15px 0;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  resize: vertical;
  font-family: inherit;
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
.btn-confirm-fail {
  background: #e53e3e;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
}
</style>