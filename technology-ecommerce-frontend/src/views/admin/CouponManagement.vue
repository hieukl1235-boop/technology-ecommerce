<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'

const API_URL = 'http://localhost:3000/api/admin/coupons'
const CATEGORY_API_URL = 'http://localhost:3000/api/admin/categories'

const coupons = ref([])
const categories = ref([])
const message = ref('')
const messageType = ref('success')
const editingId = ref(null)

const form = ref({
  code: '',
  name: '',
  discount_type: 1,
  discount_value: 10,
  max_discount: '',
  min_order_value: 0,
  quantity: 100,
  start_date: '',
  end_date: '',
  category_ids: [],
})

// UI state
const isLoading = ref(false)
const isSubmitting = ref(false)
const statusChangingId = ref(null)
const searchQuery = ref('')
let messageTimer = null

const getConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
})

const showMessage = (msg, type = 'success') => {
  message.value = msg
  messageType.value = type
  if (messageTimer) clearTimeout(messageTimer)
  messageTimer = setTimeout(() => {
    message.value = ''
  }, 3500)
}

const isEditing = computed(() => editingId.value !== null)

const filteredCoupons = computed(() => {
  if (!searchQuery.value.trim()) return coupons.value
  const q = searchQuery.value.toLowerCase().trim()
  return coupons.value.filter(
    (c) =>
      (c.code || '').toLowerCase().includes(q) ||
      (c.name || '').toLowerCase().includes(q),
  )
})

// ============ API ============
const getAllCoupons = async () => {
  isLoading.value = true
  try {
    const response = await axios.get(API_URL, getConfig())
    coupons.value = response.data
  } catch (error) {
    showMessage(error.response?.data?.message || 'Lỗi lấy danh sách mã giảm giá', 'error')
  } finally {
    isLoading.value = false
  }
}

const getAllCategories = async () => {
  try {
    const response = await axios.get(`${CATEGORY_API_URL}?status=1`, getConfig())
    categories.value = response.data
  } catch (error) {
    console.error('Lỗi lấy danh mục sản phẩm', error)
  }
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hour}:${minute}`
}

// Hiển thị ngày giờ đẹp trong bảng
const formatDateTimeVN = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ============ CRUD ============
const createCoupon = async () => {
  if (isSubmitting.value) return
  if (!validateForm()) return

  isSubmitting.value = true
  try {
    await axios.post(API_URL, form.value, getConfig())
    showMessage('Tạo mã giảm giá thành công', 'success')
    resetForm()
    await getAllCoupons()
  } catch (error) {
    showMessage(error.response?.data?.message || 'Lỗi tạo mã giảm giá', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const editCoupon = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, getConfig())
    const coupon = response.data

    editingId.value = coupon.id

    form.value = {
      code: coupon.code,
      name: coupon.name,
      discount_type: coupon.discount_type,
      discount_value: Number(coupon.discount_value),
      max_discount: coupon.max_discount ?? '',
      min_order_value: Number(coupon.min_order_value ?? 0),
      quantity: coupon.quantity,
      start_date: formatDate(coupon.start_date),
      end_date: formatDate(coupon.end_date),
      category_ids: coupon.category_ids.map((cid) => Number(cid)),
    }
    message.value = ''
  } catch (error) {
    showMessage(error.response?.data?.message || 'Lỗi lấy thông tin mã giảm giá', 'error')
  }
}

const updateCoupon = async () => {
  if (isSubmitting.value) return
  if (!validateForm()) return

  isSubmitting.value = true
  try {
    await axios.put(`${API_URL}/${editingId.value}`, form.value, getConfig())
    showMessage('Cập nhật mã giảm giá thành công', 'success')
    resetForm()
    await getAllCoupons()
  } catch (error) {
    showMessage(error.response?.data?.message || 'Lỗi cập nhật mã giảm giá', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const changeStatus = async (coupon) => {
  if (statusChangingId.value) return
  const newStatus = coupon.status === 1 ? 0 : 1
  const actionText = newStatus === 1 ? 'bật' : 'tắt'

  if (!confirm(`Bạn có chắc muốn ${actionText} mã "${coupon.code}"?`)) return

  statusChangingId.value = coupon.id
  try {
    await axios.patch(`${API_URL}/${coupon.id}/status`, { status: newStatus }, getConfig())
    showMessage(`Đã ${actionText} mã giảm giá thành công`, 'success')
    await getAllCoupons()
  } catch (error) {
    showMessage(error.response?.data?.message || 'Lỗi cập nhật trạng thái', 'error')
  } finally {
    statusChangingId.value = null
  }
}

const resetForm = () => {
  editingId.value = null
  form.value = {
    code: '',
    name: '',
    discount_type: 1,
    discount_value: 10,
    max_discount: '',
    min_order_value: 0,
    quantity: 100,
    start_date: '',
    end_date: '',
    category_ids: [],
  }
}

const validateForm = () => {
  if (!form.value.code.trim()) {
    showMessage('Vui lòng nhập mã giảm giá', 'error')
    return false
  }
  if (!form.value.name.trim()) {
    showMessage('Vui lòng nhập tên chương trình', 'error')
    return false
  }
  if (!form.value.discount_value || form.value.discount_value < 1) {
    showMessage('Giá trị giảm phải lớn hơn 0', 'error')
    return false
  }
  if (!form.value.start_date || !form.value.end_date) {
    showMessage('Vui lòng chọn ngày bắt đầu và kết thúc', 'error')
    return false
  }
  if (new Date(form.value.start_date) >= new Date(form.value.end_date)) {
    showMessage('Ngày kết thúc phải sau ngày bắt đầu', 'error')
    return false
  }
  return true
}

onMounted(() => {
  getAllCoupons()
  getAllCategories()
})

onBeforeUnmount(() => {
  if (messageTimer) clearTimeout(messageTimer)
})
</script>

<template>
  <div class="coupon-page-wrapper">
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
        <div class="brand-tag">COUPON SYSTEM</div>
        <h1 class="page-title">Quản Lý Mã Giảm Giá</h1>
        <p class="page-sub">
          Tổng cộng <b>{{ coupons.length }}</b> mã • Đang hoạt động <b>{{ activeCount }}</b>
        </p>
      </div>
    </div>

    <!-- ALERT -->
    <transition name="slide-fade">
      <div v-if="message" class="alert-banner" :class="messageType === 'error' ? 'alert-error' : 'alert-success'">
        <span>{{ message }}</span>
        <button type="button" class="btn-close-msg" @click="message = ''">✕</button>
      </div>
    </transition>

    <!-- LAYOUT 2 CỘT -->
    <div class="row g-4">
      <!-- FORM -->
      <div class="col-lg-5">
        <div class="card-box sticky-form">
          <div class="card-box-header">
            <span class="header-icon">{{ isEditing ? '✏️' : '➕' }}</span>
            <h5 class="mb-0 fw-bold text-dark">
              {{ isEditing ? 'Cập nhật mã giảm giá' : 'Thêm mã giảm giá' }}
            </h5>
          </div>

          <div class="card-box-body">
            <form @submit.prevent="isEditing ? updateCoupon() : createCoupon()">
              <!-- Mã code + Tên -->
              <div class="form-row">
                <div class="form-group">
                  <label class="tech-label">Mã giảm giá <span class="text-danger">*</span></label>
                  <input v-model="form.code" class="tech-input tech-input-code"
                         placeholder="VD: SALE50" :disabled="isSubmitting" required />
                </div>
                <div class="form-group">
                  <label class="tech-label">Tên chương trình <span class="text-danger">*</span></label>
                  <input v-model="form.name" class="tech-input"
                         placeholder="VD: Sale mùa thu" :disabled="isSubmitting" required />
                </div>
              </div>

              <!-- Danh mục áp dụng -->
              <div class="form-group">
                <label class="tech-label">Áp dụng cho danh mục</label>
                <div class="category-box">
                  <div v-if="categories.length === 0" class="empty-inline">
                    Đang tải danh mục...
                  </div>
                  <label
                    v-for="cat in categories"
                    :key="cat.id"
                    class="category-item"
                    :class="{ 'category-item-active': form.category_ids.includes(Number(cat.id)) }"
                  >
                    <input
                      type="checkbox"
                      class="tech-checkbox"
                      :value="Number(cat.id)"
                      v-model="form.category_ids"
                      :disabled="isSubmitting"
                    />
                    <span>{{ cat.name }}</span>
                  </label>
                </div>
              </div>

              <!-- Loại giảm + Giá trị -->
              <div class="form-row">
                <div class="form-group">
                  <label class="tech-label">Loại giảm giá</label>
                  <select v-model.number="form.discount_type" class="tech-input tech-select"
                          :disabled="isSubmitting">
                    <option :value="1">Giảm theo phần trăm</option>
                    <option :value="2">Giảm số tiền cố định</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="tech-label">
                    {{ form.discount_type === 1 ? 'Phần trăm giảm (%)' : 'Số tiền giảm (VNĐ)' }}
                    <span class="text-danger">*</span>
                  </label>
                  <input type="number" v-model.number="form.discount_value"
                         class="tech-input" min="1" :disabled="isSubmitting" required />
                </div>
              </div>

              <!-- Mức giảm tối đa (chỉ khi %) -->
              <div class="form-group" v-if="form.discount_type === 1">
                <label class="tech-label">Mức giảm tối đa (VNĐ)</label>
                <input type="number" v-model="form.max_discount" class="tech-input"
                       min="1" placeholder="Không giới hạn nếu để trống"
                       :disabled="isSubmitting" />
              </div>

              <!-- Đơn tối thiểu + Số lượt -->
              <div class="form-row">
                <div class="form-group">
                  <label class="tech-label">Đơn tối thiểu (VNĐ)</label>
                  <input type="number" v-model.number="form.min_order_value" class="tech-input"
                         min="0" :disabled="isSubmitting" required />
                </div>
                <div class="form-group">
                  <label class="tech-label">Số lượt sử dụng <span class="text-danger">*</span></label>
                  <input type="number" v-model.number="form.quantity" class="tech-input"
                         min="1" :disabled="isSubmitting" required />
                </div>
              </div>

              <!-- Ngày -->
              <div class="form-row">
                <div class="form-group">
                  <label class="tech-label">Bắt đầu <span class="text-danger">*</span></label>
                  <input type="datetime-local" v-model="form.start_date" class="tech-input"
                         :disabled="isSubmitting" required />
                </div>
                <div class="form-group">
                  <label class="tech-label">Kết thúc <span class="text-danger">*</span></label>
                  <input type="datetime-local" v-model="form.end_date" class="tech-input"
                         :disabled="isSubmitting" required />
                </div>
              </div>

              <!-- Actions -->
              <div class="action-buttons">
                <button type="submit" class="btn-primary-tech" :disabled="isSubmitting">
                  <span v-if="isSubmitting" class="spinner-sm"></span>
                  <span>
                    {{ isSubmitting
                      ? 'Đang lưu...'
                      : (isEditing ? 'Cập nhật' : 'Tạo mã giảm giá') }}
                  </span>
                </button>
                <button v-if="isEditing" type="button" class="btn-cancel-tech"
                        :disabled="isSubmitting" @click="resetForm">
                  Hủy sửa
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- BẢNG -->
      <div class="col-lg-7">
        <div class="card-box">
          <div class="card-box-header table-header">
            <div class="header-left">
              <span class="header-icon">🎟️</span>
              <h5 class="mb-0 fw-bold text-dark">Danh sách mã giảm giá</h5>
            </div>
            <span class="count-badge">Tổng: {{ filteredCoupons.length }}</span>
          </div>

          <div class="table-search-bar">
            <div class="search-input-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round" class="search-icon">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input v-model="searchQuery" type="text" class="tech-search-input"
                     placeholder="Tìm theo mã hoặc tên chương trình..." />
              <button v-if="searchQuery" class="search-clear-btn" @click="searchQuery = ''">✕</button>
            </div>
          </div>

          <div class="table-responsive">
            <!-- Loading -->
            <div v-if="isLoading" class="loading-state">
              <div class="spinner"></div>
              <p>Đang tải mã giảm giá...</p>
            </div>

            <!-- Table -->
            <table v-else class="table custom-table align-middle mb-0">
              <thead>
                <tr>
                  <th class="ps-4" style="width: 70px">ID</th>
                  <th style="width: 140px">Mã / Chương trình</th>
                  <th style="width: 120px">Giảm giá</th>
                  <th style="width: 120px">Điều kiện</th>
                  <th style="width: 130px">Thời gian</th>
                  <th style="width: 90px" class="text-center">Đã dùng</th>
                  <th class="text-center" style="width: 100px">Trạng thái</th>
                  <th class="text-center pe-4" style="width: 110px">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredCoupons.length === 0">
                  <td colspan="8" class="text-center py-5">
                    <div class="empty-state">
                      <div class="empty-icon">{{ searchQuery ? '🔍' : '🎟️' }}</div>
                      <p class="empty-title">
                        {{ searchQuery ? 'Không tìm thấy mã phù hợp' : 'Chưa có mã giảm giá nào' }}
                      </p>
                      <p class="empty-sub">
                        {{ searchQuery
                          ? 'Thử từ khóa khác hoặc xóa tìm kiếm.'
                          : 'Bắt đầu bằng cách thêm mã giảm giá đầu tiên.' }}
                      </p>
                    </div>
                  </td>
                </tr>

                <tr v-for="coupon in filteredCoupons" :key="coupon.id">
                  <td class="ps-4 fw-bold text-secondary">#{{ coupon.id }}</td>

                  <td>
                    <span class="coupon-code">{{ coupon.code }}</span>
                    <span class="coupon-name">{{ coupon.name }}</span>
                  </td>

                  <td>
                    <span class="discount-value">
                     {{
  coupon.discount_type === 1
    ? Number(coupon.discount_value) + '%'
    : Number(coupon.discount_value).toLocaleString('vi-VN') + ' ₫'
}}
                    </span>
                    <span v-if="coupon.discount_type === 1 && Number(coupon.max_discount) > 0" class="discount-sub">
                      Tối đa {{ Number(coupon.max_discount).toLocaleString('vi-VN') }}đ
                    </span>
                    <span v-else-if="coupon.discount_type === 2" class="discount-sub">
                      Giảm tiền
                    </span>
                  </td>

                  <td>
                    <span class="condition-value">
                      {{ Number(coupon.min_order_value || 0).toLocaleString('vi-VN') }}đ
                    </span>
                    <span class="condition-sub">đơn tối thiểu</span>
                  </td>

                  <td>
                    <span class="time-range">{{ formatDateTimeVN(coupon.start_date) }}</span>
                    <span class="time-range">→ {{ formatDateTimeVN(coupon.end_date) }}</span>
                  </td>

                  <td class="text-center">
                    <span class="used-badge">
                      {{ coupon.used_quantity }}<span class="used-sep">/</span>{{ coupon.quantity }}
                    </span>
                  </td>

                  <td class="text-center">
                    <span
                      class="status-pill"
                      :class="coupon.status === 1 ? 'status-active' : 'status-locked'"
                    >
                      <span class="status-indicator"></span>
                      {{ coupon.status === 1 ? 'Hoạt động' : 'Đã tắt' }}
                    </span>
                  </td>

                  <td class="text-center pe-4">
                    <div class="action-btn-group">
                      <button class="btn-row-action btn-row-edit" @click="editCoupon(coupon.id)" title="Chỉnh sửa">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                             viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                          <path d="m15 5 4 4"></path>
                        </svg>
                      </button>

                      <button
                        class="btn-row-action"
                        :class="coupon.status === 1 ? 'btn-row-lock' : 'btn-row-unlock'"
                        :title="coupon.status === 1 ? 'Tắt mã' : 'Bật mã'"
                        :disabled="statusChangingId === coupon.id"
                        @click="changeStatus(coupon)"
                      >
                        <span v-if="statusChangingId === coupon.id" class="spinner-xs"></span>
                        <template v-else>
                          <svg v-if="coupon.status === 1" xmlns="http://www.w3.org/2000/svg"
                               width="14" height="14" viewBox="0 0 24 24" fill="none"
                               stroke="currentColor" stroke-width="2"
                               stroke-linecap="round" stroke-linejoin="round">
                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                          <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                               viewBox="0 0 24 24" fill="none" stroke="currentColor"
                               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                          </svg>
                        </template>
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
  </div>
</template>

<style scoped>
/* ============ WRAPPER ============ */
.coupon-page-wrapper {
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
  background: #f0f9ff;
  color: #0284c7;
  border-color: #0284c7;
  transform: translateX(-2px);
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

/* ============ CARD BOX ============ */
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
.header-icon { font-size: 18px; }
.header-left { display: flex; align-items: center; gap: 10px; }
.table-header { justify-content: space-between; flex-wrap: wrap; }
.card-box-body { padding: 24px; }
.sticky-form { position: sticky; top: 30px; }

/* ============ FORM ============ */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.form-group { margin-bottom: 16px; }

.tech-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
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
.tech-input-code {
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #0284c7;
}
.tech-select { cursor: pointer; }

/* ============ CATEGORY CHECKBOXES ============ */
.category-box {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  padding: 10px;
  max-height: 180px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.category-box::-webkit-scrollbar { width: 6px; }
.category-box::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }

.category-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  color: #334155;
  font-weight: 500;
  transition: all 0.15s;
}
.category-item:hover { border-color: #94a3b8; }
.category-item-active {
  border-color: #0284c7;
  background: #f0f9ff;
  color: #0284c7;
  font-weight: 600;
}
.tech-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #0284c7;
  cursor: pointer;
  flex-shrink: 0;
}

.empty-inline {
  padding: 12px;
  text-align: center;
  font-size: 0.85rem;
  color: #94a3b8;
  font-style: italic;
}

/* ============ BUTTONS ============ */
.action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
}
.btn-primary-tech {
  flex: 1;
  padding: 11px 16px;
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
.btn-primary-tech:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

.btn-cancel-tech {
  padding: 11px 18px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-cancel-tech:hover:not(:disabled) { background: #f1f5f9; border-color: #94a3b8; }
.btn-cancel-tech:disabled { opacity: 0.6; cursor: not-allowed; }

/* ============ TABLE ============ */
.table-search-bar {
  padding: 14px 24px;
  border-bottom: 1px solid #f1f5f9;
}
.search-input-wrapper {
  position: relative;
  width: 100%;
  max-width: 420px;
}
.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
}
.tech-search-input {
  width: 100%;
  padding: 9px 36px 9px 42px;
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #0f172a;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
}
.tech-search-input:focus {
  background-color: #ffffff;
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
}
.search-clear-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: #e2e8f0;
  border: none;
  color: #64748b;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.search-clear-btn:hover { background: #cbd5e1; color: #0f172a; }

.custom-table thead th {
  background-color: #f8fafc;
  color: #64748b;
  font-size: 0.75rem;
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
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.coupon-code {
  display: block;
  font-weight: 800;
  color: #0284c7;
  font-size: 0.9rem;
  letter-spacing: 0.03em;
}
.coupon-name {
  display: block;
  font-size: 0.78rem;
  color: #64748b;
  margin-top: 2px;
}

.discount-value {
  display: block;
  font-weight: 800;
  color: #dc2626;
  font-size: 0.95rem;
}
.discount-sub {
  display: block;
  font-size: 0.72rem;
  color: #94a3b8;
  margin-top: 2px;
}

.condition-value {
  display: block;
  font-weight: 700;
  color: #0f172a;
  font-size: 0.85rem;
}
.condition-sub {
  display: block;
  font-size: 0.72rem;
  color: #94a3b8;
  margin-top: 2px;
}

.time-range {
  display: block;
  font-size: 0.78rem;
  color: #475569;
}

.used-badge {
  display: inline-block;
  padding: 3px 10px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  color: #0369a1;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
}
.used-sep { color: #94a3b8; margin: 0 2px; font-weight: 500; }

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}
.status-indicator { width: 6px; height: 6px; border-radius: 50%; }
.status-active {
  background-color: #ecfdf5; color: #059669; border: 1px solid #a7f3d0;
}
.status-active .status-indicator {
  background-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
}
.status-locked {
  background-color: #fef2f2; color: #dc2626; border: 1px solid #fecaca;
}
.status-locked .status-indicator { background-color: #ef4444; }

.action-btn-group { display: inline-flex; gap: 6px; }
.btn-row-action {
  width: 32px; height: 32px;
  border-radius: 6px;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #ffffff;
  transition: all 0.2s;
}
.btn-row-action:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-row-edit {
  border-color: #cbd5e1; color: #0284c7;
}
.btn-row-edit:hover:not(:disabled) {
  background-color: #f0f9ff;
  border-color: #0284c7;
  transform: translateY(-1px);
}
.btn-row-lock {
  border-color: #fecaca; color: #ef4444;
}
.btn-row-lock:hover:not(:disabled) {
  background-color: #fef2f2;
  border-color: #dc2626;
  transform: translateY(-1px);
}
.btn-row-unlock {
  border-color: #a7f3d0; color: #10b981;
}
.btn-row-unlock:hover:not(:disabled) {
  background-color: #ecfdf5;
  border-color: #059669;
  transform: translateY(-1px);
}

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
}
.spinner-xs {
  width: 12px; height: 12px;
  border: 2px solid rgba(2, 132, 199, 0.25);
  border-top-color: #0284c7;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ============ LOADING & EMPTY ============ */
.loading-state {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 60px 20px; gap: 14px;
}
.loading-state p { margin: 0; color: #64748b; font-size: 0.9rem; }

.empty-state {
  display: flex; flex-direction: column;
  align-items: center; gap: 8px; padding: 20px;
}
.empty-icon { font-size: 42px; opacity: 0.55; margin-bottom: 6px; }
.empty-title { margin: 0; font-weight: 700; color: #475569; font-size: 1rem; }
.empty-sub { margin: 0; font-size: 0.85rem; color: #94a3b8; max-width: 340px; }

/* ============ RESPONSIVE ============ */
@media (max-width: 992px) {
  .coupon-page-wrapper { padding: 22px 20px; }
  .sticky-form { position: static; }
}
@media (max-width: 640px) {
  .coupon-page-wrapper { padding: 16px 12px; }
  .page-title { font-size: 1.4rem; }
  .page-header { flex-direction: column; align-items: stretch; }
  .form-row { grid-template-columns: 1fr; }
  .search-input-wrapper { max-width: 100%; }
}
</style>