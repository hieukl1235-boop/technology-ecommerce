<template>
  <div >
    <!-- ================================================= -->
    <!-- MÀN HÌNH 1: DANH SÁCH THƯƠNG HIỆU                  -->
    <!-- ================================================= -->
    <div v-if="currentView === 'list'">
      <!-- HEADER -->
      <div class="page-header">
        <button class="btn-add-tech" @click="openCreateForm">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Thêm thương hiệu mới</span>
        </button>
      </div>

      <!-- ALERT -->
      <transition name="slide-fade">
        <div
          v-if="message"
          class="alert-banner"
          :class="messageType === 'error' ? 'alert-error' : 'alert-success'"
        >
          <svg v-if="messageType === 'error'" xmlns="http://www.w3.org/2000/svg"
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

      <!-- CARD -->
      <div class="card-box">
        <!-- SEARCH BAR -->
        <div class="table-search-bar">
          <div class="search-input-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" class="search-icon">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              class="tech-search-input"
              placeholder="Tìm kiếm theo Tên hoặc ID thương hiệu..."
            />
            <button
              v-if="searchQuery"
              type="button"
              class="search-clear-btn"
              @click="searchQuery = ''"
              title="Xóa tìm kiếm"
            >
              ✕
            </button>
          </div>
          <span class="count-badge">Tổng: {{ filteredBrands.length }} thương hiệu</span>
        </div>

        <div class="table-responsive">
          <!-- Loading -->
          <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            <p>Đang tải thương hiệu...</p>
          </div>

          <!-- Table -->
          <table v-else class="table custom-table align-middle mb-0">
            <thead>
              <tr>
                <th class="ps-4" style="width: 120px;">ID</th>
                <th>Tên thương hiệu</th>
                <th class="text-center" style="width: 180px;">Trạng thái</th>
                <th class="text-center pe-4" style="width: 140px;">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <!-- Empty -->
              <tr v-if="filteredBrands.length === 0">
                <td colspan="4" class="text-center py-5">
                  <div class="empty-state">
                    <div class="empty-icon">
                      {{ searchQuery ? '🔍' : '📁' }}
                    </div>
                    <p class="empty-title">
                      {{ searchQuery
                        ? 'Không tìm thấy kết quả nào phù hợp'
                        : 'Chưa có thương hiệu nào trong hệ thống' }}
                    </p>
                    <p class="empty-sub">
                      {{ searchQuery
                        ? 'Thử từ khóa khác hoặc xóa tìm kiếm.'
                        : 'Bắt đầu bằng cách thêm thương hiệu đầu tiên.' }}
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Rows -->
              <tr v-for="brand in filteredBrands" :key="brand.id">
                <td class="ps-4 fw-bold text-secondary">#{{ brand.id }}</td>

                <td>
                  <span class="brand-name">{{ brand.name }}</span>
                </td>

                <td class="text-center">
                  <span
                    class="status-pill"
                    :class="brand.status === 1 ? 'status-active' : 'status-locked'"
                  >
                    <span class="status-indicator"></span>
                    {{ brand.status === 1 ? 'Đang hoạt động' : 'Đã khóa' }}
                  </span>
                </td>

                <td class="text-center pe-4">
                  <div class="action-btn-group">
                    <button
                      class="btn-row-action btn-row-edit"
                      @click="openEditForm(brand)"
                      title="Chỉnh sửa"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                           viewBox="0 0 24 24" fill="none" stroke="currentColor"
                           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                        <path d="m15 5 4 4"></path>
                      </svg>
                    </button>

                    <button
                      class="btn-row-action"
                      :class="brand.status === 1 ? 'btn-row-lock' : 'btn-row-unlock'"
                      :title="brand.status === 1 ? 'Khóa thương hiệu' : 'Mở khóa thương hiệu'"
                      :disabled="statusChangingId === brand.id"
                      @click="changeStatus(brand)"
                    >
                      <span v-if="statusChangingId === brand.id" class="spinner-xs"></span>
                      <template v-else>
                        <svg v-if="brand.status === 1" xmlns="http://www.w3.org/2000/svg"
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

    <!-- ================================================= -->
    <!-- MÀN HÌNH 2: FORM THÊM / SỬA                        -->
    <!-- ================================================= -->
    <div v-else class="form-view-container">
      <div class="page-header">
        <div class="header-titles">
          <h1 class="page-title">
            {{ isEditing ? 'Cập Nhật Thương Hiệu' : 'Thêm Thương Hiệu Mới' }}
          </h1>
        </div>
      </div>

      <div class="card-box form-card">
        <div class="card-box-body">
          <!-- Alert trong form -->
          <transition name="slide-fade">
            <div
              v-if="message"
              class="alert-banner"
              :class="messageType === 'error' ? 'alert-error' : 'alert-success'"
              style="margin-bottom: 20px;"
            >
              <span>{{ message }}</span>
              <button type="button" class="btn-close-msg" @click="message = ''" aria-label="Đóng">✕</button>
            </div>
          </transition>

          <div class="mb-4">
            <label class="form-label tech-label">
              Tên thương hiệu <span class="text-danger">*</span>
            </label>
            <input
              ref="nameInputRef"
              v-model="name"
              type="text"
              class="tech-input"
              placeholder="Ví dụ: ASUS ROG, Apple, Sony, Logitech..."
              :disabled="isSubmitting"
              @keyup.enter="isEditing ? updateBrand() : createBrand()"
            />
            <span class="input-hint">
              {{ isEditing ? `Đang sửa thương hiệu #${editingId}` : 'Nhấn phím Enter để lưu nhanh' }}
            </span>
          </div>

          <div class="form-actions">
            <button
              class="btn-cancel-tech"
              :disabled="isSubmitting"
              @click="goBackToList"
            >
              Hủy bỏ
            </button>
            <button
              class="btn-primary-tech"
              :disabled="isSubmitting"
              @click="isEditing ? updateBrand() : createBrand()"
            >
              <span v-if="isSubmitting" class="spinner-sm"></span>
              <span>
                {{ isSubmitting
                  ? 'Đang lưu...'
                  : (isEditing ? 'Cập nhật thay đổi' : 'Lưu thương hiệu') }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import axios from 'axios'

// ========================================
// STATE (GIỮ NGUYÊN)
// ========================================
const brands = ref([])
const name = ref('')
const editingId = ref(null)
const message = ref('')
const currentView = ref('list')
const searchQuery = ref('')

// UI state (mới)
const messageType = ref('success')
const isLoading = ref(false)
const isSubmitting = ref(false)
const statusChangingId = ref(null)
const nameInputRef = ref(null)

let messageTimer = null

const token = localStorage.getItem('token')
const config = {
  headers: {
    Authorization: `Bearer ${token}`
  }
}

// ========================================
// COMPUTED
// ========================================
const isEditing = computed(() => editingId.value !== null)

const filteredBrands = computed(() => {
  if (!searchQuery.value) return brands.value

  const lowerCaseQuery = searchQuery.value.toLowerCase().trim()
  return brands.value.filter((brand) =>
    brand.name.toLowerCase().includes(lowerCaseQuery) ||
    brand.id.toString().includes(lowerCaseQuery)
  )
})

// ========================================
// HELPERS
// ========================================
const showMessage = (msg, type = 'success') => {
  message.value = msg
  messageType.value = type
  if (messageTimer) clearTimeout(messageTimer)
  messageTimer = setTimeout(() => {
    message.value = ''
  }, 3500)
}

// ========================================
// API HANDLERS (GIỮ NGUYÊN ENDPOINT)
// ========================================
const getBrands = async () => {
  isLoading.value = true
  try {
    const response = await axios.get(
      'http://localhost:3000/api/admin/brands',
      config
    )
    brands.value = response.data
  } catch (error) {
    showMessage(
      error.response?.data?.message || 'Không thể lấy danh sách thương hiệu',
      'error'
    )
    brands.value = []
  } finally {
    isLoading.value = false
  }
}

const openCreateForm = () => {
  name.value = ''
  editingId.value = null
  message.value = ''
  currentView.value = 'form'
  nextTick(() => {
    nameInputRef.value?.focus()
  })
}

const openEditForm = (brand) => {
  editingId.value = brand.id
  name.value = brand.name
  message.value = ''
  currentView.value = 'form'
  nextTick(() => {
    nameInputRef.value?.focus()
  })
}

const goBackToList = () => {
  currentView.value = 'list'
  name.value = ''
  editingId.value = null
  // Không xóa message ngay để user kịp thấy thông báo thành công
}

const goBackPage = () => {
  // Nếu có history thì back, không thì về list
  if (window.history.length > 1) {
    window.history.back()
  } else {
    goBackToList()
  }
}

const createBrand = async () => {
  if (isSubmitting.value) return

  if (!name.value.trim()) {
    showMessage('Vui lòng nhập tên thương hiệu', 'error')
    return
  }

  isSubmitting.value = true
  try {
    const response = await axios.post(
      'http://localhost:3000/api/admin/brands',
      { name: name.value.trim() },
      config
    )
    showMessage(response.data.message || 'Thêm thương hiệu thành công!', 'success')
    await getBrands()
    goBackToList()
  } catch (error) {
    showMessage(
      error.response?.data?.message || 'Không thể thêm thương hiệu',
      'error'
    )
  } finally {
    isSubmitting.value = false
  }
}

const updateBrand = async () => {
  if (isSubmitting.value) return

  if (!name.value.trim()) {
    showMessage('Vui lòng nhập tên thương hiệu', 'error')
    return
  }

  isSubmitting.value = true
  try {
    const response = await axios.put(
      `http://localhost:3000/api/admin/brands/${editingId.value}`,
      { name: name.value.trim() },
      config
    )
    showMessage(response.data.message || 'Cập nhật thương hiệu thành công!', 'success')
    await getBrands()
    goBackToList()
  } catch (error) {
    showMessage(
      error.response?.data?.message || 'Không thể cập nhật thương hiệu',
      'error'
    )
  } finally {
    isSubmitting.value = false
  }
}

const changeStatus = async (brand) => {
  const isLocking = brand.status === 1
  const actionText = isLocking ? 'khóa' : 'mở khóa'

  if (!confirm(`Bạn có chắc muốn ${actionText} thương hiệu "${brand.name}"?`)) {
    return
  }

  statusChangingId.value = brand.id
  try {
    const response = await axios.patch(
      `http://localhost:3000/api/admin/brands/${brand.id}/status`,
      {},
      config
    )
    showMessage(response.data.message || `Đã ${actionText} thương hiệu thành công!`, 'success')
    await getBrands()
  } catch (error) {
    showMessage(
      error.response?.data?.message || 'Không thể cập nhật trạng thái',
      'error'
    )
  } finally {
    statusChangingId.value = null
  }
}

onMounted(() => {
  getBrands()
})
</script>

<style scoped>
/* =========================================================
   WRAPPER
   ========================================================= */
.brand-page-wrapper {
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
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  min-width: 0;
}

.header-titles { min-width: 0; }

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

/* =========================================================
   BUTTON ADD
   ========================================================= */
.btn-add-tech {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.925rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
  transition: all 0.2s ease;
  white-space: nowrap;
}
.btn-add-tech:hover {
  background: linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%);
  box-shadow: 0 6px 16px rgba(2, 132, 199, 0.35);
  transform: translateY(-1px);
}
.btn-add-tech:active { transform: translateY(0); }

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
   CARD
   ========================================================= */
.card-box {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.card-box-body {
  padding: 28px;
}

/* =========================================================
   SEARCH BAR
   ========================================================= */
.table-search-bar {
  padding: 18px 24px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
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
  transition: all 0.15s;
}
.search-clear-btn:hover {
  background: #cbd5e1;
  color: #0f172a;
}

.count-badge {
  font-size: 0.8rem;
  font-weight: 700;
  color: #0284c7;
  background: #f0f9ff;
  padding: 6px 12px;
  border-radius: 50px;
  border: 1px solid #bae6fd;
  white-space: nowrap;
}

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

.brand-name {
  font-weight: 700;
  color: #0f172a;
  font-size: 0.95rem;
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
.status-locked .status-indicator {
  background-color: #ef4444;
}

/* =========================================================
   ACTION BUTTONS
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

.btn-row-edit {
  border-color: #cbd5e1;
  color: #0284c7;
}
.btn-row-edit:hover:not(:disabled) {
  background-color: #f0f9ff;
  border-color: #0284c7;
  transform: translateY(-1px);
}

.btn-row-lock {
  border-color: #fecaca;
  color: #ef4444;
}
.btn-row-lock:hover:not(:disabled) {
  background-color: #fef2f2;
  border-color: #dc2626;
  transform: translateY(-1px);
}

.btn-row-unlock {
  border-color: #a7f3d0;
  color: #10b981;
}
.btn-row-unlock:hover:not(:disabled) {
  background-color: #ecfdf5;
  border-color: #059669;
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
}
@keyframes spin { to { transform: rotate(360deg); } }

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
   FORM VIEW
   ========================================================= */
.form-view-container {
  max-width: 700px;
  margin: 0 auto;
}

.form-card .card-box-body {
  padding: 32px 36px;
}

.tech-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
  display: block;
}

.tech-input {
  width: 100%;
  padding: 12px 16px;
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
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

.input-hint {
  display: block;
  font-size: 0.775rem;
  color: #94a3b8;
  margin-top: 6px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
}

.btn-cancel-tech {
  padding: 10px 20px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
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
  padding: 10px 24px;
  background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
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

/* =========================================================
   RESPONSIVE
   ========================================================= */
@media (max-width: 992px) {
  .brand-page-wrapper {
    padding: 22px 20px;
  }
}

@media (max-width: 640px) {
  .brand-page-wrapper {
    padding: 16px 12px;
  }
  .page-title {
    font-size: 1.4rem;
  }
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  .header-left {
    flex-direction: column;
    gap: 12px;
  }
  .btn-add-tech {
    width: 100%;
    justify-content: center;
  }
  .table-search-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .search-input-wrapper {
    max-width: 100%;
  }
  .count-badge {
    align-self: flex-start;
  }
  .form-card .card-box-body {
    padding: 22px 20px;
  }
  .form-actions {
    flex-direction: column-reverse;
  }
  .btn-cancel-tech,
  .btn-primary-tech {
    width: 100%;
    justify-content: center;
  }
}
</style>