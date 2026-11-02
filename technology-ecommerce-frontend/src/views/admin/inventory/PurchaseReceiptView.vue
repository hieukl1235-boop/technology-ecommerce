<template>
  <div class="receipt-page-wrapper">
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
        <div class="brand-tag">PURCHASE RECEIPTS</div>
        <h1 class="page-title">Quản Lý Phiếu Nhập Hàng</h1>
        <p class="page-sub">
          Tổng cộng <b>{{ receipts.length }}</b> phiếu •
          Đang hoạt động <b>{{ activeReceiptsCount }}</b>
        </p>
      </div>
      <button class="btn-refresh" @click="getAllReceipts" :disabled="isLoadingReceipts">
        <span v-if="isLoadingReceipts" class="spinner-xs"></span>
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
        :class="messageType === 'danger' ? 'alert-error' : 'alert-success'"
      >
        <svg v-if="messageType === 'danger'" xmlns="http://www.w3.org/2000/svg"
             width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16"
             viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>{{ message }}</span>
        <button type="button" class="btn-close-msg" @click="message = ''" aria-label="Đóng">✕</button>
      </div>
    </transition>

    <!-- LAYOUT 2 CỘT -->
    <div class="row g-4">
      <!-- CỘT 1: FORM TẠO PHIẾU -->
      <div class="col-lg-5">
        <div class="card-box sticky-form">
          <div class="card-box-header">
            <span class="header-icon">➕</span>
            <h5 class="mb-0 fw-bold text-dark">Tạo phiếu nhập mới</h5>
          </div>

          <div class="card-box-body">
            <form @submit.prevent="createReceipt">
              <!-- Nhà cung cấp -->
              <div class="mb-3">
                <label class="tech-label">
                  Nhà cung cấp <span class="text-danger">*</span>
                </label>
                <select
                  v-model="supplier_id"
                  class="tech-input tech-select"
                  :disabled="isSubmitting"
                  required
                >
                  <option value="" disabled>-- Chọn nhà cung cấp --</option>
                  <option v-for="supplier in supplierOptions" :key="supplier.id" :value="supplier.id">
                    {{ supplier.name }}
                  </option>
                </select>
              </div>

              <!-- Biến thể sản phẩm -->
              <div class="mb-3" v-if="supplier_id">
                <label class="tech-label">Chọn sản phẩm nhập kho</label>

                <div
                  v-if="isLoadingVariants"
                  class="loading-inline"
                >
                  <span class="spinner-xs"></span>
                  Đang tải biến thể...
                </div>

                <div
                  v-else-if="variantOptions.length === 0"
                  class="empty-inline"
                >
                  Không có biến thể nào từ nhà cung cấp này.
                </div>

                <div v-else class="variant-list-box">
                  <div
                    v-for="variant in variantOptions"
                    :key="variant.id"
                    class="variant-row"
                    :class="{ 'variant-row-active': variant_id.includes(variant.id) }"
                  >
                    <div class="variant-check-line">
                      <input
                        class="tech-checkbox"
                        type="checkbox"
                        :value="variant.id"
                        v-model="variant_id"
                        :id="'var-' + variant.id"
                        :disabled="isSubmitting"
                      />

                      <img
                        v-if="variant.image_url"
                        :src="`http://localhost:3000/uploads/variants/${variant.image_url}`"
                        alt="Variant"
                        class="variant-thumb"
                        loading="lazy"
                      />
                      <div v-else class="variant-thumb variant-thumb-empty">📦</div>

                      <label
                        class="variant-label"
                        :for="'var-' + variant.id"
                      >
                       <span class="variant-sku" style="color: blue;">{{ variant.name }}</span>
                        <span class="variant-sku">SKU: {{ variant.sku }}</span>
                        <span class="variant-price">
                          Giá bán: <b>{{ Number(variant.selling_price).toLocaleString('vi-VN') }}đ</b>
                        </span>
                      </label>
                    </div>

                    <div
                      v-if="variant_id.includes(variant.id)"
                      class="variant-inputs"
                    >
                      <div class="input-group-tech">
                        <label class="tech-label-xs">Số lượng</label>
                        <input
                          type="number"
                          class="tech-input tech-input-sm"
                          v-model.number="quantity[variant.id]"
                          placeholder="SL"
                          min="1"
                          :disabled="isSubmitting"
                          required
                        />
                      </div>
                      <div class="input-group-tech">
                        <label class="tech-label-xs">Giá nhập (đ)</label>
                        <input
                          type="number"
                          class="tech-input tech-input-sm"
                          v-model.number="purchase_price[variant.id]"
                          placeholder="Giá"
                          min="1"
                          :disabled="isSubmitting"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Tổng dự kiến -->
                <div v-if="estimatedTotal > 0" class="estimated-total">
                  <span>💰 Tổng dự kiến:</span>
                  <b>{{ estimatedTotal.toLocaleString('vi-VN') }}đ</b>
                </div>
              </div>

              <!-- Ghi chú -->
              <div class="mb-3">
                <label class="tech-label">Ghi chú</label>
                <textarea
                  v-model="note"
                  class="tech-input tech-textarea"
                  rows="2"
                  placeholder="Nhập ghi chú (nếu có)..."
                  :disabled="isSubmitting"
                ></textarea>
              </div>

              <!-- Submit -->
              <button
                type="submit"
                class="btn-primary-tech w-100"
                :disabled="isSubmitting"
              >
                <span v-if="isSubmitting" class="spinner-sm"></span>
                <span>{{ isSubmitting ? 'Đang tạo phiếu...' : 'Xác nhận tạo phiếu nhập' }}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- CỘT 2: BẢNG DANH SÁCH -->
      <div class="col-lg-7">
        <div class="card-box">
          <div class="card-box-header table-header">
            <div class="header-left">
              <span class="header-icon">📋</span>
              <h5 class="mb-0 fw-bold text-dark">Danh sách phiếu nhập</h5>
            </div>
            <span class="count-badge">Tổng: {{ receipts.length }}</span>
          </div>

          <div class="table-responsive">
            <!-- Loading -->
            <div v-if="isLoadingReceipts" class="loading-state">
              <div class="spinner"></div>
              <p>Đang tải danh sách phiếu nhập...</p>
            </div>

            <!-- Table -->
            <table v-else class="table custom-table align-middle mb-0">
              <thead>
                <tr>
                  <th class="ps-4" style="width: 80px">Mã</th>
                  <th>Nhân viên</th>
                  <th>Nhà cung cấp</th>
                  <th class="text-end" style="width: 130px">Tổng tiền</th>
                  <th class="text-center" style="width: 110px">Trạng thái</th>
                  <th class="text-center pe-4" style="width: 140px">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <!-- Empty -->
                <tr v-if="receipts.length === 0">
                  <td colspan="6" class="text-center py-5">
                    <div class="empty-state">
                      <div class="empty-icon">📦</div>
                      <p class="empty-title">Chưa có phiếu nhập nào</p>
                      <p class="empty-sub">
                        Bắt đầu bằng cách chọn nhà cung cấp và tạo phiếu nhập đầu tiên ở form bên trái.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Rows -->
                <tr v-for="receipt in receipts" :key="receipt.id">
                  <td class="ps-4 fw-bold text-primary">#{{ receipt.id }}</td>
                  <td>
                    <span class="cell-name">{{ receipt.employee_name || '—' }}</span>
                  </td>
                  <td>
                    <span class="cell-name">{{ receipt.supplier_name || '—' }}</span>
                  </td>
                  <td class="text-end fw-bold text-primary">
                    {{ Number(receipt.total_amount).toLocaleString('vi-VN') }}đ
                  </td>
                  <td class="text-center">
                    <span
                      class="status-pill"
                      :class="receipt.status === 0 ? 'status-locked' : 'status-active'"
                    >
                      <span class="status-indicator"></span>
                      {{ receipt.status === 0 ? 'Đã hủy' : 'Hoạt động' }}
                    </span>
                  </td>
                  <td class="text-center pe-4">
                    <div class="action-btn-group">
                      <button
                        class="btn-row-action btn-row-view"
                        title="Xem chi tiết"
                        @click="getReceiptById(receipt.id)"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                             viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>
                      <button
                        v-if="receipt.status !== 0"
                        class="btn-row-action btn-row-delete"
                        title="Hủy phiếu nhập"
                        :disabled="cancellingId === receipt.id"
                        @click="cancelReceipt(receipt.id)"
                      >
                        <span v-if="cancellingId === receipt.id" class="spinner-xs"></span>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                             viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="15" y1="9" x2="9" y2="15"></line>
                          <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- CHI TIẾT PHIẾU -->
    <div class="row mt-4" v-if="selectedReceipt">
      <div class="col-12">
        <div class="card-box receipt-detail-card">
          <div class="card-box-header detail-header">
            <div class="header-left">
              <span class="header-icon">📄</span>
              <h5 class="mb-0 fw-bold text-dark">
                Chi tiết phiếu nhập <span class="text-primary">#{{ selectedReceipt.id }}</span>
              </h5>
            </div>
            <button class="btn-close-circle" @click="selectedReceipt = null" title="Đóng">✕</button>
          </div>

          <div class="card-box-body">
            <!-- Info summary -->
            <div class="detail-info-grid">
              <div class="info-item">
                <span class="info-label">Nhân viên thực hiện</span>
                <b>{{ selectedReceipt.employee_name || '—' }}</b>
              </div>
              <div class="info-item">
                <span class="info-label">Nhà cung cấp</span>
                <b>{{ selectedReceipt.supplier_name || '—' }}</b>
              </div>
              <div class="info-item">
                <span class="info-label">Tổng tiền</span>
                <b class="text-primary">
                  {{ Number(selectedReceipt.total_amount).toLocaleString('vi-VN') }}đ
                </b>
              </div>
              <div class="info-item">
                <span class="info-label">Ghi chú</span>
                <span>{{ selectedReceipt.note || 'Không có' }}</span>
              </div>
            </div>

            <!-- Detail table -->
            <div class="table-responsive detail-table-wrap">
              <table class="table custom-table align-middle mb-0">
                <thead>
                  <tr>
                    <th class="ps-4" style="width: 70px">Ảnh</th>
                    <th style="width: 110px">Biến thể</th>
                    <th>Sản phẩm</th>
                    <th style="width: 100px">SKU</th>
                    <th class="text-center" style="width: 90px">SL</th>
                    <th class="text-end" style="width: 130px">Giá nhập</th>
                    <th class="text-end pe-4" style="width: 150px">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="detail in selectedReceipt.details" :key="detail.variant_id">
                    <td class="ps-4">
                      <img
                        v-if="detail.image_url"
                        :src="`http://localhost:3000/uploads/variants/${detail.image_url}`"
                        alt="Variant"
                        class="variant-thumb-lg"
                        loading="lazy"
                      />
                      <div v-else class="variant-thumb-lg variant-thumb-empty">📦</div>
                    </td>
                    <td class="text-muted">#{{ detail.variant_id }}</td>
                    <td class="fw-semibold text-dark">{{ detail.product_name }}</td>
                    <td>
                      <span class="sku-badge">{{ detail.sku }}</span>
                    </td>
                    <td class="text-center fw-bold">{{ detail.quantity }}</td>
                    <td class="text-end">
                      {{ Number(detail.purchase_price).toLocaleString('vi-VN') }}đ
                    </td>
                    <td class="text-end pe-4 fw-bold text-primary">
                      {{ Number(detail.total_price).toLocaleString('vi-VN') }}đ
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="detail-footer">
              <button class="btn-cancel-tech" @click="selectedReceipt = null">
                Đóng chi tiết
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'

const API_URL = 'http://localhost:3000/api/admin/purchase-receipts'

// ========================================
// STATE (GIỮ NGUYÊN)
// ========================================
const receipts = ref([])

const supplier_id = ref('')
const note = ref('')

const variant_id = ref([])
const variantOptions = ref([])
const quantity = ref([])
const purchase_price = ref([])
const supplierOptions = ref([])

const message = ref('')
const messageType = ref('success')

const selectedReceipt = ref(null)

// ========================================
// UI STATE (thêm mới, không ảnh hưởng logic)
// ========================================
const isLoadingReceipts = ref(false)
const isLoadingVariants = ref(false)
const isSubmitting = ref(false)
const cancellingId = ref(null)

let messageTimer = null

// ========================================
// COMPUTED
// ========================================
const activeReceiptsCount = computed(
  () => receipts.value.filter((r) => Number(r.status) !== 0).length
)

// Tổng dự kiến dựa trên variant đã chọn
const estimatedTotal = computed(() => {
  let total = 0
  variant_id.value.forEach((id) => {
    const q = Number(quantity.value[id] || 0)
    const p = Number(purchase_price.value[id] || 0)
    if (q > 0 && p > 0) total += q * p
  })
  return total
})

// ========================================
// HELPERS
// ========================================
const getToken = () => localStorage.getItem('token')

const getConfig = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
})

const showMessage = (msg, type = 'success') => {
  message.value = msg
  messageType.value = type
  if (messageTimer) clearTimeout(messageTimer)
  messageTimer = setTimeout(() => {
    message.value = ''
  }, 4000)
}

// ========================================
// API HANDLERS (GIỮ NGUYÊN ENDPOINT)
// ========================================
const getAllReceipts = async () => {
  isLoadingReceipts.value = true
  try {
    const response = await axios.get(API_URL, getConfig())
    receipts.value = response.data
  } catch (error) {
    showMessage(error.response?.data?.message || 'Lỗi lấy danh sách phiếu nhập', 'danger')
  } finally {
    isLoadingReceipts.value = false
  }
}

const cancelReceipt = async (id) => {
  if (cancellingId.value) return
  if (!confirm(`Bạn có chắc chắn muốn hủy phiếu nhập #${id} này không?`)) return

  cancellingId.value = id
  try {
    const response = await axios.patch(
      `http://localhost:3000/api/admin/purchase-receipts/${id}/cancel`,
      {},
      getConfig()
    )
    showMessage(response.data.message || 'Hủy phiếu thành công!')

    const receipt = receipts.value.find((r) => r.id === id)
    if (receipt) receipt.status = 0
  } catch (error) {
    showMessage(error.response?.data?.message || 'Đã xảy ra lỗi khi hủy phiếu', 'danger')
  } finally {
    cancellingId.value = null
  }
}

const createReceipt = async () => {
  if (isSubmitting.value) return

  // Validate
  if (!supplier_id.value) {
    showMessage('Vui lòng chọn nhà cung cấp', 'danger')
    return
  }
  if (variant_id.value.length === 0) {
    showMessage('Vui lòng chọn ít nhất một sản phẩm nhập kho', 'danger')
    return
  }
  for (const id of variant_id.value) {
    const q = Number(quantity.value[id] || 0)
    const p = Number(purchase_price.value[id] || 0)
    if (q <= 0 || p <= 0) {
      showMessage('Số lượng và giá nhập phải lớn hơn 0', 'danger')
      return
    }
  }

  isSubmitting.value = true
  try {
    const details = variant_id.value.map((id) => ({
      variant_id: Number(id),
      quantity: Number(quantity.value[id] || 0),
      purchase_price: Number(purchase_price.value[id] || 0),
    }))

    const data = {
      supplier_id: Number(supplier_id.value),
      note: note.value,
      details,
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
  } finally {
    isSubmitting.value = false
  }
}

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
  isLoadingVariants.value = true
  try {
    const res = await axios.get(
      `http://localhost:3000/api/admin/purchase-receipts/${id}/variants`,
      getConfig()
    )
    variantOptions.value = res.data
  } catch (err) {
    console.error(err)
  } finally {
    isLoadingVariants.value = false
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

<style scoped>
/* =========================================================
   WRAPPER
   ========================================================= */
.receipt-page-wrapper {
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

/* =========================================================
   HEADER
   ========================================================= */
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
.page-sub b { color: #0284c7; }

.btn-back {
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
.btn-back:hover {
  background: #f1f5f9;
  color: #0284c7;
  border-color: #0284c7;
  transform: translateX(-2px);
}

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
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-top: 4px;
}
.btn-refresh:hover:not(:disabled) {
  background: #f0f9ff;
  color: #0284c7;
  border-color: #0284c7;
}
.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* =========================================================
   ALERT
   ========================================================= */
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
  transition: opacity 0.15s;
  padding: 4px 8px;
  border-radius: 4px;
}
.btn-close-msg:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.05);
}

.slide-fade-enter-active,
.slide-fade-leave-active { transition: all 0.3s ease; }
.slide-fade-enter-from,
.slide-fade-leave-to { opacity: 0; transform: translateY(-10px); }

/* =========================================================
   CARD BOX
   ========================================================= */
.card-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.card-box-header {
  padding: 18px 24px;
  border-bottom: 1px solid #f1f5f9;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 18px;
}

.table-header {
  justify-content: space-between;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-box-body { padding: 24px; }

.sticky-form {
  position: sticky;
  top: 30px;
}

/* =========================================================
   FORM INPUTS
   ========================================================= */
.tech-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
  display: block;
}
.tech-label-xs {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 4px;
  display: block;
}

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

.tech-input:disabled {
  background-color: #f1f5f9;
  color: #94a3b8;
  cursor: not-allowed;
}

.tech-input-sm {
  padding: 7px 10px;
  font-size: 0.85rem;
}

.tech-select {
  cursor: pointer;
}

.tech-textarea {
  resize: vertical;
  min-height: 60px;
}

/* =========================================================
   VARIANT LIST
   ========================================================= */
.variant-list-box {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  padding: 12px;
  max-height: 320px;
  overflow-y: auto;
}

.variant-list-box::-webkit-scrollbar { width: 6px; }
.variant-list-box::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }

.variant-row {
  padding: 10px 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.15s;
}

.variant-row:last-child { margin-bottom: 0; }

.variant-row:hover { border-color: #94a3b8; }

.variant-row-active {
  border-color: #0284c7;
  background: #f0f9ff;
}

.variant-check-line {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tech-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #0284c7;
  cursor: pointer;
  flex-shrink: 0;
}

.variant-thumb {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  flex-shrink: 0;
}

.variant-thumb-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e1;
  font-size: 18px;
}

.variant-thumb-lg {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
  background: #ffffff;
}

.variant-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  cursor: pointer;
  flex: 1;
  min-width: 0;
}

.variant-sku {
  font-weight: 700;
  color: #0f172a;
  font-size: 0.875rem;
}

.variant-price {
  font-size: 0.75rem;
  color: #64748b;
}
.variant-price b { color: #0284c7; }

.variant-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 12px;
  padding-left: 26px;
}

.input-group-tech {
  display: flex;
  flex-direction: column;
}

/* Estimated total */
.estimated-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding: 10px 14px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #1e40af;
}
.estimated-total b {
  font-size: 1.05rem;
  color: #1d4ed8;
}

/* Inline loading / empty */
.loading-inline,
.empty-inline {
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.loading-inline {
  color: #64748b;
  background: #f8fafc;
  border: 1px dashed #e2e8f0;
}
.empty-inline {
  color: #94a3b8;
  background: #f8fafc;
  border: 1px dashed #e2e8f0;
  font-style: italic;
}

/* =========================================================
   BUTTONS
   ========================================================= */
.btn-primary-tech {
  padding: 11px 20px;
  background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.925rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-primary-tech:hover:not(:disabled) {
  background: linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(2, 132, 199, 0.35);
}
.btn-primary-tech:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

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
.btn-cancel-tech:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
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
  transition: all 0.2s;
  font-weight: bold;
}
.btn-close-circle:hover {
  background: #ef4444;
  color: #ffffff;
  transform: rotate(90deg);
}

/* =========================================================
   SPINNERS
   ========================================================= */
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
@keyframes spin { to { transform: rotate(360deg); } }

/* =========================================================
   TABLE
   ========================================================= */
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
  vertical-align: middle;
}

.cell-name {
  font-weight: 600;
  color: #0f172a;
  font-size: 0.9rem;
}

.sku-badge {
  display: inline-block;
  padding: 3px 8px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #475569;
  border-radius: 5px;
  font-size: 0.775rem;
  font-weight: 600;
}

/* =========================================================
   STATUS PILL
   ========================================================= */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 50px;
  font-size: 0.775rem;
  font-weight: 600;
  white-space: nowrap;
}
.status-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.status-active {
  background-color: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}
.status-active .status-indicator {
  background-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
}
.status-locked {
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}
.status-locked .status-indicator { background-color: #ef4444; }

/* =========================================================
   ROW ACTIONS
   ========================================================= */
.action-btn-group {
  display: inline-flex;
  gap: 6px;
}
.btn-row-action {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #ffffff;
  transition: all 0.2s;
}
.btn-row-action:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.btn-row-view {
  border-color: #cbd5e1;
  color: #0284c7;
}
.btn-row-view:hover:not(:disabled) {
  background-color: #f0f9ff;
  border-color: #0284c7;
  transform: translateY(-1px);
}
.btn-row-delete {
  border-color: #fecaca;
  color: #ef4444;
}
.btn-row-delete:hover:not(:disabled) {
  background-color: #fef2f2;
  border-color: #dc2626;
  transform: translateY(-1px);
}

/* =========================================================
   LOADING & EMPTY
   ========================================================= */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 14px;
}
.loading-state p {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
}
.empty-icon {
  font-size: 42px;
  opacity: 0.55;
  margin-bottom: 6px;
}
.empty-title {
  margin: 0;
  font-weight: 700;
  color: #475569;
  font-size: 1rem;
}
.empty-sub {
  margin: 0;
  font-size: 0.85rem;
  color: #94a3b8;
  max-width: 340px;
}

/* =========================================================
   RECEIPT DETAIL
   ========================================================= */
.receipt-detail-card {
  animation: slideUp 0.3s ease-out;
}
@keyframes slideUp {
  from { transform: translateY(12px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.detail-header {
  justify-content: space-between;
}

.detail-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  padding: 18px 20px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.info-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.info-item b,
.info-item span {
  font-size: 0.9rem;
  color: #0f172a;
}

.detail-table-wrap {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}

.detail-footer {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.count-badge {
  font-size: 0.775rem;
  font-weight: 700;
  color: #0284c7;
  background: #f0f9ff;
  padding: 4px 10px;
  border-radius: 50px;
  border: 1px solid #bae6fd;
  white-space: nowrap;
}

/* =========================================================
   RESPONSIVE
   ========================================================= */
@media (max-width: 992px) {
  .receipt-page-wrapper {
    padding: 22px 20px;
  }
  .sticky-form {
    position: static;
  }
}

@media (max-width: 640px) {
  .receipt-page-wrapper {
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
  .variant-inputs {
    grid-template-columns: 1fr;
    padding-left: 0;
  }
  .detail-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>