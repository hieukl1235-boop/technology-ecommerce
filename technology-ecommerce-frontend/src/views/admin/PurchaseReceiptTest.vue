<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'

const API_URL = 'http://localhost:3000/api/admin/purchase-receipts'

// Danh sách phiếu nhập
const receipts = ref([])

// Dữ liệu tạo phiếu nhập
const supplier_id = ref('')
const note = ref('')

const variant_id = ref([])
const variantOptions = ref([])
const quantity = ref([])
const purchase_price = ref([])
const supplierOptions = ref([]) 

// Thông báo
const message = ref('')
const messageType = ref('success') // 'success' hoặc 'danger'

// Chi tiết phiếu nhập đang xem
const selectedReceipt = ref(null)

// Lấy token nhân viên đã đăng nhập
const getToken = () => localStorage.getItem('token')

// Cấu hình gửi token
const getConfig = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
})

// Hiển thị thông báo tạm thời
const showMessage = (msg, type = 'success') => {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 4000)
}

// Lấy danh sách phiếu nhập
const getAllReceipts = async () => {
  try {
    const response = await axios.get(API_URL, getConfig())
    receipts.value = response.data
  } catch (error) {
    showMessage(error.response?.data?.message || 'Lỗi lấy danh sách phiếu nhập', 'danger')
  }
}

// Hàm gọi API hủy phiếu
const cancelReceipt = async (id) => {
  if (!confirm(`Bạn có chắc chắn muốn hủy phiếu nhập #${id} này không?`)) {
    return
  }

  try {
    const response = await axios.patch(`http://localhost:3000/api/admin/purchase-receipts/${id}/cancel`, {}, getConfig())
    showMessage(response.data.message || "Hủy phiếu thành công!")
    
    const receipt = receipts.value.find(r => r.id === id)
    if (receipt) {
      receipt.status = 0
    }
  } catch (error) {
    showMessage(error.response?.data?.message || "Đã xảy ra lỗi khi hủy phiếu", 'danger')
  }
}

// Tạo phiếu nhập
const createReceipt = async () => {
  try {
    const details = variant_id.value.map(id => ({
      variant_id: Number(id),
      quantity: Number(quantity.value[id] || 0),        
      purchase_price: Number(purchase_price.value[id] || 0) 
    }))

    const data = {
      supplier_id: Number(supplier_id.value),
      note: note.value,
      details: details 
    }

    const response = await axios.post(API_URL, data, getConfig())
    showMessage(response.data.message || 'Tạo phiếu nhập thành công')
    
    // Reset form
    supplier_id.value = ''
    note.value = ''
    variant_id.value = []
    quantity.value = []
    purchase_price.value = []

    await getAllReceipts()
  } catch (error) {
    console.error(error)
    showMessage(error.response?.data?.message || 'Lỗi tạo phiếu nhập', 'danger')
  }
}

// Xem chi tiết phiếu nhập
const getReceiptById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, getConfig())
    selectedReceipt.value = response.data
  } catch (error) {
    showMessage(error.response?.data?.message || 'Lỗi lấy chi tiết phiếu nhập', 'danger')
  }
}

const getAllSuppliers = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/admin/suppliers', getConfig())
    supplierOptions.value = response.data
  } catch (error) {
    showMessage(error.response?.data?.message || 'Lỗi lấy danh sách nhà cung cấp', 'danger')
  }
}

const getVarinatsBySupplier = async (id) => {
  try {
    const res = await axios.get(`http://localhost:3000/api/admin/purchase-receipts/${id}/variants`, getConfig())
    variantOptions.value = res.data
  } catch (err) {
    console.error(err)
  }
}

watch(supplier_id, (newValue) => {
  if (newValue) {
    getVarinatsBySupplier(newValue)
  } else {
    variantOptions.value = []
    variant_id.value = []
  }
})

onMounted(() => {
  getAllReceipts()
  getAllSuppliers()
})
</script>

<template>
  <div class="container py-4">
    <!-- Tiêu đề trang -->
    <div class="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
      <div>
        <h2 class="fw-bold text-dark mb-1">Quản lý Phiếu Nhập Hàng</h2>
        <p class="text-muted small mb-0">Theo dõi, tạo mới và quản lý các phiếu nhập kho từ nhà cung cấp.</p>
      </div>
      <button class="btn btn-outline-secondary btn-sm" @click="getAllReceipts">
        <i class="bi bi-arrow-clockwise me-1"></i> Tải lại danh sách
      </button>
    </div>

    <!-- Thông báo Alert -->
    <div v-if="message" :class="`alert alert-${messageType} alert-dismissible fade show`" role="alert">
      {{ message }}
      <button type="button" class="btn-close" @click="message = ''" aria-label="Close"></button>
    </div>

    <div class="row g-4">
      <!-- Cột trái: Form tạo phiếu nhập -->
      <div class="col-lg-5">
        <div class="card shadow-sm border-0 rounded-4">
          <div class="card-header bg-primary text-white py-3 rounded-top-4">
            <h5 class="card-title mb-0 fw-semibold"><i class="bi bi-plus-circle me-2"></i>Tạo phiếu nhập mới</h5>
          </div>
          <div class="card-body p-4">
            <form @submit.prevent="createReceipt">
              <!-- Chọn nhà cung cấp -->
              <div class="mb-3">
                <label class="form-label fw-semibold small">Nhà cung cấp <span class="text-danger">*</span></label>
                <select v-model="supplier_id" class="form-select" required>
                  <option value="" disabled>-- Chọn nhà cung cấp --</option>
                  <option v-for="supplier in supplierOptions" :key="supplier.id" :value="supplier.id">
                    {{ supplier.name }}
                  </option>
                </select>
              </div>

              <!-- Danh sách biến thể sản phẩm -->
              <!-- Danh sách biến thể sản phẩm -->
              <div class="mb-3" v-if="supplier_id">
                <label class="form-label fw-semibold small">Chọn sản phẩm nhập kho</label>
                <div v-if="variantOptions.length === 0" class="text-muted small fst-italic p-3 bg-light rounded text-center">
                  Không có biến thể nào từ nhà cung cấp này.
                </div>
                
                <div class="border rounded p-3 bg-light overflow-auto" style="max-height: 280px;">
                  <div v-for="variant in variantOptions" :key="variant.id" class="mb-3 pb-3 border-bottom last:border-bottom-0">
                    <div class="form-check d-flex align-items-center gap-2">
                      <input class="form-check-input mt-0" type="checkbox" :value="variant.id" v-model="variant_id" :id="'var-' + variant.id" />
                      
                      <!-- 🟢 Hiển thị ảnh nhỏ của biến thể -->
                      <img
                        v-if="variant.image_url"
                        :src="`http://localhost:3000/uploads/variants/${variant.image_url}`"
                        alt="Variant Image"
                        class="rounded border"
                        style="width: 36px; height: 36px; object-fit: cover; background: #fff;"
                      />

                      <label class="form-check-label fw-bold text-dark mb-0" :for="'var-' + variant.id">
                        SKU: {{ variant.sku }} 
                        <span class="text-muted fw-normal small ms-1">(Giá bán: {{ Number(variant.selling_price).toLocaleString('vi-VN') }}đ)</span>
                      </label>
                    </div>

                    <!-- Input số lượng và giá khi checkbox được chọn -->
                    <div v-if="variant_id.includes(variant.id)" class="row g-2 mt-2 ps-4">
                      <div class="col-6">
                        <label class="form-label small text-muted mb-1">Số lượng</label>
                        <input type="number" class="form-control form-control-sm" v-model.number="quantity[variant.id]" placeholder="SL" min="1" required />
                      </div>
                      <div class="col-6">
                        <label class="form-label small text-muted mb-1">Giá nhập (đ)</label>
                        <input type="number" class="form-control form-control-sm" v-model.number="purchase_price[variant.id]" placeholder="Giá" min="1" required />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Ghi chú -->
              <div class="mb-3">
                <label class="form-label fw-semibold small">Ghi chú</label>
                <textarea class="form-control" v-model="note" rows="2" placeholder="Nhập ghi chú (nếu có)..."></textarea>
              </div>

              <button type="submit" class="w-100 btn btn-primary fw-semibold py-2">
                Xác nhận tạo phiếu nhập
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- Cột phải: Danh sách phiếu nhập -->
      <div class="col-lg-7">
        <div class="card shadow-sm border-0 rounded-4">
          <div class="card-header bg-white py-3 border-bottom">
            <h5 class="card-title mb-0 fw-semibold text-dark"><i class="bi bi-list-ul me-2"></i>Danh sách phiếu nhập</h5>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light text-uppercase fs-7">
                  <tr>
                    <th class="py-3 ps-3">Mã</th>
                    <th class="py-3">Nhân viên</th>
                    <th class="py-3">Nhà cung cấp</th>
                    <th class="py-3">Tổng tiền</th>
                    <th class="py-3">Trạng thái</th>
                    <th class="py-3 text-end pe-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="receipts.length === 0">
                    <td colspan="6" class="text-center py-4 text-muted fst-italic">Chưa có dữ liệu phiếu nhập.</td>
                  </tr>
                  <tr v-for="receipt in receipts" :key="receipt.id">
                    <td class="ps-3 fw-bold text-primary">#{{ receipt.id }}</td>
                    <td>{{ receipt.employee_name }}</td>
                    <td>{{ receipt.supplier_name }}</td>
                    <td class="fw-semibold">{{ Number(receipt.total_amount).toLocaleString('vi-VN') }} đ</td>
                    <td>
                      <span :class="`badge bg-${receipt.status === 0 ? 'danger' : 'success'}-subtle text-${receipt.status === 0 ? 'danger' : 'success'} border border-${receipt.status === 0 ? 'danger' : 'success'}`">
                        {{ receipt.status === 0 ? 'Đã hủy' : 'Hoạt động' }}
                      </span>
                    </td>
                    <td class="text-end pe-3">
                      <button class="btn btn-sm btn-outline-primary me-1" @click="getReceiptById(receipt.id)">
                        Xem
                      </button>
                      <button v-if="receipt.status !== 0" class="btn btn-sm btn-outline-danger" @click="cancelReceipt(receipt.id)">
                        Hủy
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- KHU VỰC HIỂN THỊ CHI TIẾT PHIẾU NHẬP (Hiển thị dạng Card bên dưới khi bấm Xem) -->
    <div class="row mt-4" v-if="selectedReceipt">
      <div class="col-12">
        <div class="card shadow-sm border-0 rounded-4 bg-light">
          <div class="card-header bg-dark text-white py-3 rounded-top-4 d-flex justify-content-between align-items-center">
            <h5 class="mb-0 fw-semibold">Chi tiết phiếu nhập #{{ selectedReceipt.id }}</h5>
            <button class="btn-close btn-close-white" @click="selectedReceipt = null"></button>
          </div>
          <div class="card-body p-4">
            <div class="row mb-4 bg-white p-3 rounded border">
              <div class="col-md-3">
                <span class="text-muted small d-block">Nhân viên thực hiện:</span>
                <strong class="text-dark">{{ selectedReceipt.employee_name }}</strong>
              </div>
              <div class="col-md-3">
                <span class="text-muted small d-block">Nhà cung cấp:</span>
                <strong class="text-dark">{{ selectedReceipt.supplier_name }}</strong>
              </div>
              <div class="col-md-3">
                <span class="text-muted small d-block">Tổng tiền:</span>
                <strong class="text-primary">{{ Number(selectedReceipt.total_amount).toLocaleString('vi-VN') }} đ</strong>
              </div>
              <div class="col-md-3">
                <span class="text-muted small d-block">Ghi chú:</span>
                <span class="text-dark">{{ selectedReceipt.note || 'Không có' }}</span>
              </div>
            </div>

            <div class="table-responsive bg-white rounded border">
              <table class="table mb-0 align-middle">
                <thead class="table-light">
                  <tr>
                    <th class="ps-3" style="width: 70px">Ảnh</th>
                    <th>Mã biến thể</th>
                    <th>Sản phẩm</th>
                    <th>SKU</th>
                    <th class="text-center">Số lượng</th>
                    <th class="text-end">Giá nhập</th>
                    <th class="text-end pe-3">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="detail in selectedReceipt.details" :key="detail.variant_id">
                    <!-- 🟢 Hiển thị ảnh biến thể trong chi tiết phiếu nhập -->
                    <td class="ps-3">
                      <img
                        v-if="detail.image_url"
                        :src="`http://localhost:3000/uploads/variants/${detail.image_url}`"
                        alt="Variant"
                        class="rounded border"
                        style="width: 38px; height: 38px; object-fit: cover; background: #fff;"
                      />
                      <span v-else class="text-muted small">---</span>
                    </td>
                    <td class="text-muted">#{{ detail.variant_id }}</td>
                    <td class="fw-semibold text-dark">{{ detail.product_name }}</td>
                    <td><span class="badge bg-secondary-subtle text-secondary">{{ detail.sku }}</span></td>
                    <td class="text-center fw-bold">{{ detail.quantity }}</td>
                    <td class="text-end">{{ Number(detail.purchase_price).toLocaleString('vi-VN') }} đ</td>
                    <td class="text-end pe-3 fw-bold text-primary">{{ Number(detail.total_price).toLocaleString('vi-VN') }} đ</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="mt-3 text-end">
              <button class="btn btn-secondary btn-sm" @click="selectedReceipt = null">Đóng chi tiết</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>