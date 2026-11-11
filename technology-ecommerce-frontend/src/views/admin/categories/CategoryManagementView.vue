<template>
  <div class="category-page">
    <!-- ALERT BANNER (success / error) -->
    <transition name="slide-fade">
      <div v-if="message" class="alert-banner" :class="messageType === 'error' ? 'alert-error' : 'alert-success'">
        <svg v-if="messageType === 'error'" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
             viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
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
        <button class="btn-close-msg" @click="message = ''" aria-label="Đóng">✕</button>
      </div>
    </transition>

    <!-- BỐ CỤC 2 CỘT -->
    <div class="row g-4">
      <!-- CỘT 1: FORM THÊM / SỬA -->
      <div class="col-lg-4 col-md-5">
        <div class="card-box sticky-form">
          <div class="card-box-header">
            <span class="header-icon">
              {{ isEditing ? '✏️' : '➕' }}
            </span>
            <h5 class="mb-0 fw-bold text-dark">
              {{ isEditing ? 'Cập nhật danh mục' : 'Thêm danh mục mới' }}
            </h5>
          </div>

          <div class="card-box-body">
            <div class="mb-3">
              <label class="form-label tech-label">
                Tên danh mục <span class="text-danger">*</span>
              </label>
              <input
                v-model="name"
                type="text"
                class="tech-input"
                placeholder="Ví dụ: Laptop, Chuột Gaming..."
                :disabled="isSubmitting"
                @keyup.enter="isEditing ? updateCategory() : createCategory()"
              />
              <span class="input-hint">
                {{ isEditing ? `Đang sửa danh mục #${editingId}` : 'Nhấn Enter để lưu nhanh' }}
              </span>
            </div>

            <div class="action-buttons">
              <!-- Nút Thêm -->
              <button
                v-if="!isEditing"
                class="btn-primary-tech"
                :disabled="isSubmitting"
                @click="createCategory"
              >
                <span v-if="isSubmitting" class="spinner-sm"></span>
                <span>{{ isSubmitting ? 'Đang thêm...' : '+ Thêm danh mục' }}</span>
              </button>

              <!-- Cụm nút khi đang Sửa -->
              <template v-else>
                <button
                  class="btn-primary-tech"
                  :disabled="isSubmitting"
                  @click="updateCategory"
                >
                  <span v-if="isSubmitting" class="spinner-sm"></span>
                  <span>{{ isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi' }}</span>
                </button>
                <button
                  class="btn-cancel-tech"
                  :disabled="isSubmitting"
                  @click="cancelEdit"
                >
                  Hủy bỏ
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- CỘT 2: BẢNG DANH SÁCH -->
      <div class="col-lg-8 col-md-7">
        <div class="card-box">
          <div class="card-box-header table-header">
            <div class="header-left">
              <h5 class="mb-0 fw-bold text-dark">Danh sách danh mục hiện có</h5>
              <span class="count-badge">Tổng: {{ categories.length }}</span>
            </div>

            <!-- Search trong bảng -->
            <div class="table-search">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round" class="table-search-icon">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                v-model="searchQuery"
                type="text"
                class="table-search-input"
                placeholder="Tìm danh mục..."
              />
              <button
                v-if="searchQuery"
                class="table-search-clear"
                @click="searchQuery = ''"
                title="Xóa tìm kiếm"
              >
                ✕
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <!-- Loading -->
            <div v-if="isLoading" class="loading-state">
              <div class="spinner"></div>
              <p>Đang tải danh mục...</p>
            </div>

            <!-- Table -->
            <table v-else class="table custom-table align-middle mb-0">
              <thead>
                <tr>
                  <th class="ps-4" style="width: 80px">ID</th>
                  <th>Tên danh mục</th>
                  <th class="text-center" style="width: 160px">Trạng thái</th>
                  <th class="text-center pe-4" style="width: 140px">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <!-- Empty -->
                <tr v-if="filteredCategories.length === 0">
                  <td colspan="4" class="text-center py-5">
                    <div class="empty-state">
                      <div class="empty-icon">📂</div>
                      <p class="empty-title">
                        {{ searchQuery ? 'Không tìm thấy danh mục phù hợp' : 'Chưa có danh mục nào' }}
                      </p>
                      <p class="empty-sub">
                        {{ searchQuery
                          ? 'Thử từ khóa khác hoặc xóa tìm kiếm.'
                          : 'Bắt đầu bằng cách thêm danh mục đầu tiên ở form bên trái.' }}
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- List -->
                <tr
                  v-for="category in filteredCategories"
                  :key="category.id"
                  :class="{ 'row-editing': editingId === category.id }"
                >
                  <td class="ps-4 fw-bold text-secondary">
                    #{{ category.id }}
                  </td>

                  <td>
                    <span class="category-name">{{ category.name }}</span>
                    <span v-if="editingId === category.id" class="editing-tag">Đang sửa</span>
                  </td>

                  <td class="text-center">
                    <span
                      class="status-pill"
                      :class="category.status === 1 ? 'status-active' : 'status-locked'"
                    >
                      <span class="status-indicator"></span>
                      {{ category.status === 1 ? 'Đang hoạt động' : 'Đã khóa' }}
                    </span>
                  </td>

                  <td class="text-center pe-4">
                    <div class="action-btn-group">
                      <!-- Sửa -->
                      <button
                        class="btn-row-action btn-row-edit"
                        title="Chỉnh sửa"
                        @click="editCategory(category)"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                             fill="none" stroke="currentColor" stroke-width="2"
                             stroke-linecap="round" stroke-linejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                          <path d="m15 5 4 4"></path>
                        </svg>
                      </button>

                      <!-- Khóa / Mở -->
                      <button
                        class="btn-row-action"
                        :class="category.status === 1 ? 'btn-row-lock' : 'btn-row-unlock'"
                        :title="category.status === 1 ? 'Khóa danh mục' : 'Mở khóa danh mục'"
                        :disabled="statusChangingId === category.id"
                        @click="changeStatus(category)"
                      >
                        <span v-if="statusChangingId === category.id" class="spinner-xs"></span>
                        <template v-else>
                          <svg v-if="category.status === 1" xmlns="http://www.w3.org/2000/svg"
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

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

// ========================================
// DỮ LIỆU & TOKEN (GIỮ NGUYÊN)
// ========================================
const categories = ref([])
const name = ref('')
const editingId = ref(null)
const message = ref('')
const messageType = ref('success') // 'success' | 'error'

// UI state
const isLoading = ref(false)
const isSubmitting = ref(false)
const statusChangingId = ref(null)
const searchQuery = ref('')

let messageTimer = null

const token = localStorage.getItem('token')
const config = {
  headers: {
    Authorization: `Bearer ${token}`
  }
}

// ========================================
// HELPERS
// ========================================
const isEditing = computed(() => editingId.value !== null)

const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) return categories.value
  const q = searchQuery.value.toLowerCase().trim()
  return categories.value.filter((c) => (c.name || '').toLowerCase().includes(q))
})

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
const getCategories = async () => {
  isLoading.value = true
  try {
    const response = await axios.get(
      'http://localhost:3000/api/admin/categories',
      config
    )
    categories.value = response.data
  } catch (error) {
    showMessage(
      error.response?.data?.message || 'Không thể lấy danh sách danh mục',
      'error'
    )
    categories.value = []
  } finally {
    isLoading.value = false
  }
}

const createCategory = async () => {
  if (isSubmitting.value) return

  if (!name.value.trim()) {
    showMessage('Vui lòng nhập tên danh mục', 'error')
    return
  }

  isSubmitting.value = true
  try {
    const response = await axios.post(
      'http://localhost:3000/api/admin/categories',
      { name: name.value.trim() },
      config
    )

    showMessage(response.data.message || 'Thêm danh mục thành công!', 'success')
    name.value = ''
    getCategories()
  } catch (error) {
    showMessage(
      error.response?.data?.message || 'Không thể thêm danh mục',
      'error'
    )
  } finally {
    isSubmitting.value = false
  }
}

const editCategory = (category) => {
  editingId.value = category.id
  name.value = category.name
  message.value = ''
}

const updateCategory = async () => {
  if (isSubmitting.value) return

  if (!name.value.trim()) {
    showMessage('Vui lòng nhập tên danh mục', 'error')
    return
  }

  isSubmitting.value = true
  try {
    const response = await axios.put(
      `http://localhost:3000/api/admin/categories/${editingId.value}`,
      { name: name.value.trim() },
      config
    )

    showMessage(response.data.message || 'Cập nhật danh mục thành công!', 'success')
    name.value = ''
    editingId.value = null
    getCategories()
  } catch (error) {
    showMessage(
      error.response?.data?.message || 'Không thể cập nhật danh mục',
      'error'
    )
  } finally {
    isSubmitting.value = false
  }
}

const cancelEdit = () => {
  name.value = ''
  editingId.value = null
  message.value = ''
}

const changeStatus = async (category) => {
  const isLocking = category.status === 1
  const actionText = isLocking ? 'khóa' : 'mở khóa'

  if (!confirm(`Bạn có chắc muốn ${actionText} danh mục "${category.name}"?`)) {
    return
  }

  statusChangingId.value = category.id
  try {
    const response = await axios.patch(
      `http://localhost:3000/api/admin/categories/${category.id}/status`,
      {},
      config
    )

    showMessage(response.data.message || `Đã ${actionText} danh mục thành công!`, 'success')
    getCategories()
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
  getCategories()
})
</script>

<style scoped>
/* =========================================================
   WRAPPER
   ========================================================= */


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
   ALERT BANNER
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

/* Slide-fade animation */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

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

.table-header {
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-box-body {
  padding: 24px;
}

.sticky-form {
  position: sticky;
  top: 30px;
}

/* =========================================================
   FORM
   ========================================================= */
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
}
.category-page {
  width: 100%;
  box-sizing: border-box;
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
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 4px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}

.btn-primary-tech {
  flex: 1;
  padding: 10px 16px;
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
  padding: 10px 16px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  border-radius: 8px;
  font-weight: 600;
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

/* Spinner trong button */
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

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* =========================================================
   TABLE HEADER
   ========================================================= */
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

.table-search {
  position: relative;
  min-width: 220px;
  max-width: 280px;
}

.table-search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
}

.table-search-input {
  width: 100%;
  padding: 8px 32px 8px 36px;
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #0f172a;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
}

.table-search-input:focus {
  background-color: #ffffff;
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);
}

.table-search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: #e2e8f0;
  border: none;
  color: #64748b;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.table-search-clear:hover {
  background: #cbd5e1;
  color: #0f172a;
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

.custom-table tbody td {
  padding: 14px 12px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.custom-table tbody tr {
  transition: background-color 0.15s ease;
}

.custom-table tbody tr:hover {
  background-color: #f8fafc;
}

.custom-table tbody tr.row-editing {
  background-color: #eff6ff;
}

.custom-table tbody tr.row-editing:hover {
  background-color: #dbeafe;
}

.category-name {
  font-weight: 700;
  color: #0f172a;
  font-size: 0.95rem;
}

.editing-tag {
  display: inline-block;
  margin-left: 8px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #0284c7;
  background: #dbeafe;
  padding: 2px 8px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
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
   LOADING & EMPTY STATES
   ========================================================= */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 14px;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e2e8f0;
  border-top-color: #0284c7;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
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
   RESPONSIVE
   ========================================================= */
@media (max-width: 992px) {
 
  .sticky-form {
    position: static;
  }
}

@media (max-width: 640px) {
 
  .page-title {
    font-size: 1.4rem;
  }
  .table-search {
    width: 100%;
    max-width: 100%;
  }
  .table-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>