<template>
  <div>
    <!-- HEADER -->
    <div class="page-header">
      <div class="header-titles">
        <p class="page-sub">
          Tổng cộng <b>{{ banners.length }}</b> banner •
          Đang hiển thị <b>{{ activeCount }}</b>
        </p>
      </div>
    </div>

    <!-- ALERT -->
    <transition name="slide-fade">
      <div v-if="message" class="alert-banner" :class="messageType === 'error' ? 'alert-error' : 'alert-success'">
        <svg v-if="messageType === 'error'" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>{{ message }}</span>
        <button class="btn-close-msg" @click="message = ''" aria-label="Đóng">✕</button>
      </div>
    </transition>

    <!-- LAYOUT 2 CỘT -->
    <div class="row g-4">
      <!-- CỘT 1: FORM -->
      <div class="col-lg-4 col-md-5">
        <div class="card-box sticky-form">
          <div class="card-box-header">
            <span class="header-icon">{{ isEditing ? '✏️' : '➕' }}</span>
            <h5 class="mb-0 fw-bold text-dark">
              {{ isEditing ? 'Cập nhật banner' : 'Thêm banner mới' }}
            </h5>
          </div>

          <div class="card-box-body">
            <!-- Tiêu đề -->
            <div class="mb-3">
              <label class="tech-label">
                Tiêu đề <span class="text-danger">*</span>
              </label>
              <input v-model="form.title" type="text" class="tech-input" placeholder="Ví dụ: Sale mùa thu 50%..."
                :disabled="isSubmitting" />
            </div>

            <!-- Mô tả -->
            <div class="mb-3">
              <label class="tech-label">Mô tả</label>
              <textarea v-model="form.description" class="tech-input tech-textarea" rows="3"
                placeholder="Mô tả ngắn gọn về banner..." :disabled="isSubmitting"></textarea>
            </div>

            <!-- Ảnh -->
            <div class="mb-3">
              <label class="tech-label">Hình ảnh banner</label>

              <!-- Ảnh mới chọn (preview) -->
              <div v-if="previewUrl" class="img-preview">
                <img :src="previewUrl" alt="Preview" class="preview-img" />
                <button type="button" class="btn-remove-img" @click="clearImage" title="Bỏ ảnh này">
                  ✕
                </button>
                <span class="img-label new-label">✨ Ảnh mới chọn</span>
              </div>

              <!-- Ảnh hiện tại (khi đang sửa) -->
              <div v-else-if="isEditing && currentImageUrl" class="img-preview">
                <img :src="currentImageUrl" alt="Current" class="preview-img" />
                <span class="img-label current-label">Ảnh hiện tại</span>
              </div>

              <!-- Nút chọn file -->
              <label class="file-upload">
                <input ref="fileInputRef" type="file" accept="image/*" @change="handleFileUpload"
                  :disabled="isSubmitting" />
                <span class="file-upload-btn">
                  📁 {{ previewUrl ? 'Đổi ảnh khác' : 'Chọn ảnh' }}
                </span>
              </label>
            </div>

            <!-- Trạng thái -->
            <div class="mb-3">
              <label class="tech-label">Trạng thái</label>
              <div class="status-toggle">
                <button type="button" class="status-option" :class="{ active: form.status === 1 }"
                  @click="form.status = 1" :disabled="isSubmitting">
                  🟢 Hiển thị
                </button>
                <button type="button" class="status-option" :class="{ active: form.status === 0 }"
                  @click="form.status = 0" :disabled="isSubmitting">
                  🟡 Ẩn
                </button>
              </div>
            </div>

            <!-- Actions -->
            <div class="action-buttons">
              <button class="btn-primary-tech" :disabled="isSubmitting" @click="saveBanner">
                <span v-if="isSubmitting" class="spinner-sm"></span>
                <span>
                  {{ isSubmitting
                    ? (isEditing ? 'Đang lưu...' : 'Đang tải lên...')
                    : (isEditing ? 'Lưu thay đổi' : 'Tải lên Banner') }}
                </span>
              </button>
              <button v-if="isEditing" class="btn-cancel-tech" :disabled="isSubmitting" @click="resetForm">
                Hủy
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- CỘT 2: BẢNG -->
      <div class="col-lg-8 col-md-7">
        <div class="card-box">
          <div class="card-box-header table-header">
            <div class="header-left">
              <h5 class="mb-0 fw-bold text-dark">Danh sách banner</h5>
              <span class="count-badge">Tổng: {{ banners.length }}</span>
            </div>
          </div>

          <div class="table-responsive">
            <!-- Loading -->
            <div v-if="isLoading" class="loading-state">
              <div class="spinner"></div>
              <p>Đang tải banner...</p>
            </div>

            <!-- Table -->
            <table v-else class="table custom-table align-middle mb-0">
              <thead>
                <tr>
                  <th class="ps-4" style="width: 70px">ID</th>
                  <th style="width: 130px">Hình ảnh</th>
                  <th>Tiêu đề &amp; Mô tả</th>
                  <th class="text-center" style="width: 130px">Trạng thái</th>
                  <th class="text-center pe-4" style="width: 120px">Hành động</th>
                </tr>
              </thead>
              <tbody>
                <!-- Empty -->
                <tr v-if="banners.length === 0">
                  <td colspan="5" class="text-center py-5">
                    <div class="empty-state">
                      <div class="empty-icon">🖼️</div>
                      <p class="empty-title">Chưa có banner nào</p>
                      <p class="empty-sub">Bắt đầu bằng cách tải lên banner đầu tiên ở form bên trái.</p>
                    </div>
                  </td>
                </tr>

                <!-- Rows -->
                <tr v-for="b in banners" :key="b.id" :class="{ 'row-editing': editId === b.id }">
                  <td class="ps-4 fw-bold text-secondary">#{{ b.id }}</td>

                  <td>
                    <div class="banner-thumb-wrap">
                      <img v-if="b.image_url" :src="`http://localhost:3000/uploads/banners/${b.image_url}`" alt="Banner"
                        class="banner-thumb" loading="lazy" />
                      <div v-else class="banner-thumb banner-thumb-empty">🖼️</div>
                    </div>
                  </td>

                  <td>
                    <span class="banner-title">{{ b.title || '(Chưa có tiêu đề)' }}</span>
                    <span v-if="b.description" class="banner-desc">{{ b.description }}</span>
                  </td>

                  <td class="text-center">
                    <button class="status-pill" :class="b.status === 1 ? 'status-active' : 'status-locked'"
                      :disabled="statusChangingId === b.id" @click="toggleStatus(b)"
                      :title="b.status === 1 ? 'Bấm để ẩn' : 'Bấm để hiển thị'">
                      <span v-if="statusChangingId === b.id" class="spinner-xs"></span>
                      <template v-else>
                        <span class="status-indicator"></span>
                        {{ b.status === 1 ? 'Hiển thị' : 'Đã ẩn' }}
                      </template>
                    </button>
                  </td>

                  <td class="text-center pe-4">
                    <div class="action-btn-group">
                      <button class="btn-row-action btn-row-edit" title="Chỉnh sửa" @click="editBanner(b)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                          <path d="m15 5 4 4"></path>
                        </svg>
                      </button>
                      <button class="btn-row-action btn-row-delete" title="Xóa banner" :disabled="deletingId === b.id"
                        @click="deleteBanner(b.id)">
                        <span v-if="deletingId === b.id" class="spinner-xs"></span>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                          stroke-linejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2">
                          </path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'

// ========================================
// STATE (GIỮ NGUYÊN TÊN BIẾN GỐC)
// ========================================
const banners = ref([])
const isEditing = ref(false)
const editId = ref(null)

const form = ref({
  title: '',
  description: '',
  image: null,
  status: 1
})

// UI state (thêm mới, không ảnh hưởng logic)
const isLoading = ref(false)
const isSubmitting = ref(false)
const statusChangingId = ref(null)
const deletingId = ref(null)
const previewUrl = ref('')
const currentImageUrl = ref('')
const fileInputRef = ref(null)

const message = ref('')
const messageType = ref('success')
let messageTimer = null

const activeCount = computed(
  () => banners.value.filter((b) => Number(b.status) === 1).length
)

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

const revokePreview = () => {
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
}
const token = localStorage.getItem('token')
const config = {
  headers: {
    Authorization: `Bearer ${token}`
  }
}
// ========================================
// API (GIỮ NGUYÊN ENDPOINT)
// ========================================
const fetchAdminBanners = async () => {
  isLoading.value = true
  try {
    const res = await axios.get('http://localhost:3000/api/admin/banners/all', config)
    banners.value = res.data.data || []
  } catch (err) {
    console.error('Lỗi tải banner admin:', err)
    showMessage('Không thể tải danh sách banner', 'error')
  } finally {
    isLoading.value = false
  }
}

const handleFileUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return

  // Validate loại file
  if (!file.type.startsWith('image/')) {
    showMessage('Vui lòng chọn file hình ảnh', 'error')
    e.target.value = ''
    return
  }

  revokePreview()
  form.value.image = file
  previewUrl.value = URL.createObjectURL(file)
}

const clearImage = () => {
  revokePreview()
  form.value.image = null
  previewUrl.value = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}

// Reset form về trạng thái Thêm mới
const resetForm = () => {
  form.value = { title: '', description: '', image: null, status: 1 }
  isEditing.value = false
  editId.value = null
  currentImageUrl.value = ''
  clearImage()
}

// Đưa dữ liệu banner lên form khi bấm nút Sửa
const editBanner = (b) => {
  isEditing.value = true
  editId.value = b.id
  form.value.title = b.title || ''
  form.value.description = b.description || ''
  form.value.status = b.status
  form.value.image = null
  currentImageUrl.value = b.image_url
    ? `http://localhost:3000/uploads/banners/${b.image_url}`
    : ''
  clearImage()
}

// Xử lý chung cho Thêm mới hoặc Cập nhật
const saveBanner = async () => {
  if (isSubmitting.value) return

  if (!form.value.title.trim()) {
    showMessage('Vui lòng nhập tiêu đề banner', 'error')
    return
  }

  if (!isEditing.value && !form.value.image) {
    showMessage('Vui lòng chọn hình ảnh cho banner', 'error')
    return
  }

  isSubmitting.value = true
  try {
    const formData = new FormData()
    formData.append('title', form.value.title.trim())
    formData.append('description', form.value.description.trim())
    formData.append('status', form.value.status)
    if (form.value.image) {
      formData.append('image', form.value.image)
    }

    if (isEditing.value) {
      await axios.put(
        `http://localhost:3000/api/admin/banners/${editId.value}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } }
      )
      showMessage('Cập nhật banner thành công!', 'success')
    } else {
      await axios.post(
        'http://localhost:3000/api/admin/banners',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } }
      )
      showMessage('Thêm banner thành công!', 'success')
    }

    await fetchAdminBanners()
    resetForm()
  } catch (err) {
    showMessage(
      isEditing.value ? 'Cập nhật thất bại!' : 'Thêm banner thất bại!',
      'error'
    )
  } finally {
    isSubmitting.value = false
  }
}

// Đổi nhanh trạng thái Hiển thị / Ẩn
const toggleStatus = async (b) => {
  if (statusChangingId.value) return

  const newStatus = b.status === 1 ? 0 : 1
  statusChangingId.value = b.id
  try {
    await axios.patch(
      `http://localhost:3000/api/admin/banners/${b.id}/status`,
      { status: newStatus }, config
    )
    b.status = newStatus
    showMessage(newStatus === 1 ? 'Đã hiển thị banner' : 'Đã ẩn banner', 'success')
  } catch (err) {
    showMessage('Thay đổi trạng thái thất bại!', 'error')
  } finally {
    statusChangingId.value = null
  }
}

const deleteBanner = async (id) => {
  if (!confirm('Bạn có chắc muốn xóa banner này?')) return
  if (deletingId.value) return

  deletingId.value = id
  try {
    await axios.delete(`http://localhost:3000/api/admin/banners/${id}`)
    await fetchAdminBanners()
    showMessage('Đã xóa banner thành công!', 'success')
  } catch (err) {
    showMessage('Xóa thất bại!', 'error')
  } finally {
    deletingId.value = null
  }
}

onMounted(() => {
  fetchAdminBanners()
})

onBeforeUnmount(() => {
  revokePreview()
  if (messageTimer) clearTimeout(messageTimer)
})
</script>

<style scoped>
/* =========================================================
   WRAPPER
   ========================================================= */
.banner-page-wrapper {
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
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* =========================================================
   CARD
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

.tech-textarea {
  resize: vertical;
  min-height: 70px;
}

/* IMAGE PREVIEW */
.img-preview {
  position: relative;
  display: inline-block;
  margin-bottom: 10px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.preview-img {
  display: block;
  width: 100%;
  max-width: 260px;
  height: 120px;
  object-fit: cover;
}

.img-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 4px 10px;
  font-size: 0.7rem;
  font-weight: 700;
  text-align: center;
  letter-spacing: 0.03em;
}

.new-label {
  background: rgba(16, 185, 129, 0.9);
  color: #fff;
}

.current-label {
  background: rgba(100, 116, 139, 0.85);
  color: #fff;
}

.btn-remove-img {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.9);
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-remove-img:hover {
  background: #dc2626;
  transform: scale(1.1);
}

/* FILE UPLOAD */
.file-upload {
  display: block;
  cursor: pointer;
  margin-top: 6px;
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

/* STATUS TOGGLE */
.status-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.status-option {
  padding: 9px 12px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  color: #64748b;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.status-option:hover:not(:disabled) {
  border-color: #94a3b8;
}

.status-option.active {
  background: #f0f9ff;
  border-color: #0284c7;
  color: #0284c7;
}

.status-option:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ACTION BUTTONS */
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

/* SPINNERS */
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

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e2e8f0;
  border-top-color: #0284c7;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* COUNT BADGE */
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

.banner-thumb-wrap {
  width: 110px;
  height: 55px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.banner-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-thumb-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e1;
  font-size: 20px;
}

.banner-title {
  display: block;
  font-weight: 700;
  color: #0f172a;
  font-size: 0.92rem;
  margin-bottom: 2px;
}

.banner-desc {
  display: block;
  font-size: 0.8rem;
  color: #64748b;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
}

/* STATUS PILL (clickable) */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 50px;
  font-size: 0.775rem;
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.status-pill:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.status-pill:hover:not(:disabled) {
  transform: translateY(-1px);
}

.status-active {
  background-color: #ecfdf5;
  color: #059669;
  border-color: #a7f3d0;
}

.status-active:hover:not(:disabled) {
  background-color: #d1fae5;
}

.status-active .status-indicator {
  background-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
}

.status-locked {
  background-color: #fffbeb;
  color: #b45309;
  border-color: #fde68a;
}

.status-locked:hover:not(:disabled) {
  background-color: #fef3c7;
}

.status-locked .status-indicator {
  background-color: #f59e0b;
}

.status-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

/* ACTION BUTTONS */
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

.btn-row-delete {
  border-color: #fecaca;
  color: #ef4444;
}

.btn-row-delete:hover:not(:disabled) {
  background-color: #fef2f2;
  border-color: #dc2626;
  transform: translateY(-1px);
}

/* LOADING & EMPTY */
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
   RESPONSIVE
   ========================================================= */
@media (max-width: 992px) {
  .banner-page-wrapper {
    padding: 22px 20px;
  }

  .sticky-form {
    position: static;
  }
}

@media (max-width: 640px) {
  .banner-page-wrapper {
    padding: 16px 12px;
  }

  .page-title {
    font-size: 1.4rem;
  }

  .table-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>