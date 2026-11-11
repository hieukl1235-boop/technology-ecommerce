<template>
  <div >
    <!-- ALERT -->
    <transition name="slide-fade">
      <div
        v-if="message"
        class="alert-banner"
        :class="isSuccess ? 'alert-success' : 'alert-error'"
      >
        <svg v-if="!isSuccess" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
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
        <button type="button" class="btn-close-msg" @click="message = ''">✕</button>
      </div>
    </transition>

    <!-- LAYOUT 2 CỘT -->
    <div class="row g-4">
      <!-- CỘT 1: FORM -->
      <div class="col-lg-7">
        <div class="card-box">
          <div class="card-box-header">
            <span class="header-icon">📢</span>
            <h5 class="mb-0 fw-bold text-dark">Soạn thông báo</h5>
          </div>

          <div class="card-box-body">
            <form @submit.prevent="handleSubmit">
              <!-- Đối tượng nhận -->
              <div class="form-group">
                <label class="tech-label">
                  Đối tượng nhận <span class="text-danger">*</span>
                </label>
                <div class="target-options">
                  <label
                    class="target-option"
                    :class="{ 'target-active': form.targetType === 'all' }"
                  >
                    <input
                      type="radio"
                      value="all"
                      v-model="form.targetType"
                      @change="handleTargetChange"
                      :disabled="loading"
                    />
                    <div class="target-content">
                      <span class="target-title">🌐 Toàn hệ thống</span>
                      <span class="target-desc">Gửi thông báo đến tất cả người dùng</span>
                    </div>
                  </label>

                  <label
                    class="target-option"
                    :class="{ 'target-active': form.targetType === 'specific' }"
                  >
                    <input
                      type="radio"
                      value="specific"
                      v-model="form.targetType"
                      @change="handleTargetChange"
                      :disabled="loading"
                    />
                    <div class="target-content">
                      <span class="target-title">👤 Một khách hàng</span>
                      <span class="target-desc">Gửi cho một User ID cụ thể</span>
                    </div>
                  </label>
                </div>
              </div>

              <!-- User ID -->
              <transition name="slide-fade">
                <div class="form-group" v-if="form.targetType === 'specific'">
                  <label class="tech-label">
                    ID Khách hàng <span class="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    v-model.number="form.user_id"
                    class="tech-input"
                    placeholder="Nhập User ID (VD: 6)"
                    min="1"
                    :disabled="loading"
                    required
                  />
                  <span class="input-hint">Nhập đúng User ID của khách hàng cần gửi</span>
                </div>
              </transition>

              <!-- Tiêu đề -->
              <div class="form-group">
                <label class="tech-label">
                  Tiêu đề thông báo <span class="text-danger">*</span>
                </label>
                <input
                  type="text"
                  v-model="form.title"
                  class="tech-input"
                  placeholder="VD: Thông báo khuyến mãi tháng 10"
                  maxlength="150"
                  :disabled="loading"
                  required
                />
                <span class="input-hint">{{ form.title.length }}/150 ký tự</span>
              </div>

              <!-- Loại -->
              <div class="form-group">
                <label class="tech-label">Loại thông báo</label>
                <select v-model="form.type" class="tech-input tech-select" :disabled="loading">
                  <option value="system">⚙️ Hệ thống / Chung</option>
                  <option value="order">📦 Đơn hàng</option>
                  <option value="promotion">🎁 Khuyến mãi / Ưu đãi</option>
                </select>
              </div>

              <!-- Nội dung -->
              <div class="form-group">
                <label class="tech-label">
                  Nội dung chi tiết <span class="text-danger">*</span>
                </label>
                <textarea
                  v-model="form.content"
                  class="tech-input tech-textarea"
                  rows="5"
                  placeholder="Nhập nội dung thông báo gửi đến người dùng..."
                  maxlength="1000"
                  :disabled="loading"
                  required
                ></textarea>
                <span class="input-hint">{{ form.content.length }}/1000 ký tự</span>
              </div>

              <!-- Reference ID -->
              <div class="form-group">
                <label class="tech-label">
                  Mã tham chiếu liên kết
                  <span class="optional-tag">Tùy chọn</span>
                </label>
                <input
                  type="text"
                  v-model="form.reference_id"
                  class="tech-input"
                  placeholder="VD: ORD-1792048373654 — để trống nếu không cần"
                  :disabled="loading"
                />
                <span class="input-hint">
                  Dùng để link thông báo tới đơn hàng cụ thể (chỉ áp dụng với loại Đơn hàng)
                </span>
              </div>

              <!-- Actions -->
              <div class="form-actions">
                <button
                  type="button"
                  class="btn-cancel-tech"
                  :disabled="loading"
                  @click="handleReset"
                >
                  Xóa form
                </button>
                <button
                  type="submit"
                  class="btn-primary-tech"
                  :disabled="loading"
                >
                  <span v-if="loading" class="spinner-sm"></span>
                  <span>{{ loading ? 'Đang gửi...' : '📤 Gửi Thông Báo Ngay' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- CỘT 2: PREVIEW -->
      <div class="col-lg-5">
        <div class="card-box sticky-preview">
          <div class="card-box-header">
            <span class="header-icon">👁️</span>
            <h5 class="mb-0 fw-bold text-dark">Xem trước</h5>
          </div>

          <div class="card-box-body">
            <p class="preview-label">Thông báo sẽ hiển thị như thế này:</p>

            <div class="preview-card">
              <div class="preview-icon" :class="previewIconClass">
                <span>{{ previewIcon }}</span>
              </div>

              <div class="preview-content">
                <div class="preview-head">
                  <span class="preview-title">
                    {{ form.title || 'Tiêu đề thông báo' }}
                  </span>
                  <span class="preview-time">Vừa xong</span>
                </div>
                <p class="preview-body">
                  {{ form.content || 'Nội dung chi tiết của thông báo sẽ hiển thị ở đây...' }}
                </p>
                <span
                  v-if="form.type === 'order' && form.reference_id"
                  class="preview-cta"
                >
                  Xem đơn hàng →
                </span>
              </div>

              <div class="preview-dot"></div>
            </div>

            <div class="preview-meta">
              <div class="meta-row">
                <span class="meta-label">Đối tượng</span>
                <span class="meta-value">
                  {{ form.targetType === 'all'
                    ? '🌐 Toàn hệ thống'
                    : `👤 User #${form.user_id || '?'}` }}
                </span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Loại</span>
                <span class="meta-value">
                  {{ typeLabels[form.type] || '—' }}
                </span>
              </div>
              <div class="meta-row" v-if="form.reference_id">
                <span class="meta-label">Tham chiếu</span>
                <span class="meta-value mono">{{ form.reference_id }}</span>
              </div>
            </div>

            <div class="preview-note">
              💡 Đây chỉ là bản xem trước. Thông báo thực tế sẽ có định dạng theo giao diện người dùng.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onBeforeUnmount } from 'vue'
import axios from 'axios'

// Dữ liệu form (giữ nguyên structure gốc)
const form = reactive({
  targetType: 'all',
  user_id: 0,
  title: '',
  content: '',
  type: 'system',
  reference_id: '',
})

const loading = ref(false)
const message = ref('')
const isSuccess = ref(false)

let messageTimer = null

const typeLabels = {
  system: '⚙️ Hệ thống / Chung',
  order: '📦 Đơn hàng',
  promotion: '🎁 Khuyến mãi / Ưu đãi',
}

const previewIcon = computed(() => {
  if (form.type === 'order') return '📦'
  if (form.type === 'promotion') return '🎁'
  if (form.type === 'system') return '⚙️'
  return '📢'
})

const previewIconClass = computed(() => {
  if (form.type === 'order') return 'icon-order'
  if (form.type === 'promotion') return 'icon-promotion'
  if (form.type === 'system') return 'icon-system'
  return 'icon-default'
})

const showMessage = (msg, success = true) => {
  message.value = msg
  isSuccess.value = success
  if (messageTimer) clearTimeout(messageTimer)
  messageTimer = setTimeout(() => {
    message.value = ''
  }, 4000)
}

// Xử lý khi thay đổi loại đối tượng nhận
const handleTargetChange = () => {
  if (form.targetType === 'all') {
    form.user_id = 0
  } else {
    form.user_id = ''
  }
}

// Reset form
const handleReset = () => {
  form.title = ''
  form.content = ''
  form.reference_id = ''
  form.type = 'system'
  form.targetType = 'all'
  form.user_id = 0
  message.value = ''
}

// Gửi request lên backend
const handleSubmit = async () => {
  if (loading.value) return

  // Validate
  if (!form.title.trim()) {
    showMessage('Vui lòng nhập tiêu đề thông báo', false)
    return
  }
  if (!form.content.trim()) {
    showMessage('Vui lòng nhập nội dung thông báo', false)
    return
  }
  if (form.targetType === 'specific' && (!form.user_id || form.user_id <= 0)) {
    showMessage('Vui lòng nhập User ID hợp lệ', false)
    return
  }

  loading.value = true
  message.value = ''

  try {
    const payload = {
      user_id: form.targetType === 'all' ? 0 : form.user_id,
      title: form.title.trim(),
      content: form.content.trim(),
      type: form.type,
      reference_id: form.reference_id ? form.reference_id.trim() : null,
    }

    const response = await axios.post(
      'http://localhost:3000/api/notifications/manual',
      payload,
    )

    if (response.data.success) {
      showMessage('Tạo và gửi thông báo thành công!', true)

      form.title = ''
      form.content = ''
      form.reference_id = ''
      if (form.targetType === 'specific') {
        form.user_id = ''
      }
    }
  } catch (err) {
    showMessage(
      err.response?.data?.message || 'Có lỗi xảy ra khi gửi thông báo.',
      false,
    )
  } finally {
    loading.value = false
  }
}

onBeforeUnmount(() => {
  if (messageTimer) clearTimeout(messageTimer)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');

/* ============ WRAPPER ============ */
.admin-notif-wrapper {
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
.page-sub {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #475569;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
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
.alert-success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #15803d;
}
.alert-error {
  background: #fef2f2;
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
.slide-fade-leave-active { transition: all 0.3s ease; }
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ============ CARD ============ */
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
  background: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
}
.header-icon { font-size: 18px; }
.card-box-body { padding: 24px; }
.sticky-preview {
  position: sticky;
  top: 30px;
}

/* ============ FORM ============ */
.form-group { margin-bottom: 18px; }

.tech-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;
}

.optional-tag {
  display: inline-block;
  padding: 1px 8px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #94a3b8;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.tech-input {
  width: 100%;
  padding: 11px 14px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.925rem;
  color: #0f172a;
  font-family: inherit;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
}
.tech-input:focus {
  background: #fff;
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
}
.tech-input:disabled {
  background: #f1f5f9;
  color: #94a3b8;
  cursor: not-allowed;
}
.tech-input::placeholder { color: #94a3b8; }
.tech-select { cursor: pointer; }
.tech-textarea {
  resize: vertical;
  min-height: 100px;
}

.input-hint {
  display: block;
  margin-top: 6px;
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
}

/* ============ TARGET OPTIONS ============ */
.target-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.target-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.target-option:hover { border-color: #94a3b8; }
.target-option input[type="radio"] {
  accent-color: #0284c7;
  cursor: pointer;
  flex-shrink: 0;
}
.target-active {
  background: #f0f9ff;
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);
}

.target-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.target-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f172a;
}
.target-desc {
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1.4;
}
.target-active .target-title { color: #0284c7; }

/* ============ ACTIONS ============ */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
}

.btn-primary-tech {
  flex: 1;
  padding: 12px 20px;
  background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
  transition: all 0.2s;
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
  padding: 12px 20px;
  background: #fff;
  border: 1px solid #cbd5e1;
  color: #475569;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  font-family: inherit;
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

/* Spinner */
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

/* ============ PREVIEW ============ */
.preview-label {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0 0 14px;
  font-weight: 500;
}

.preview-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: #f0f7ff;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  margin-bottom: 18px;
  position: relative;
}

.preview-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.icon-order { background: #eff6ff; }
.icon-promotion { background: #fef3c7; }
.icon-system { background: #f1f5f9; }
.icon-default { background: #f0f9ff; }

.preview-content { flex: 1; min-width: 0; }
.preview-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 4px;
}
.preview-title {
  font-weight: 700;
  font-size: 0.875rem;
  color: #0f172a;
  flex: 1;
  min-width: 0;
  word-break: break-word;
}
.preview-time {
  font-size: 0.7rem;
  color: #94a3b8;
  white-space: nowrap;
  flex-shrink: 0;
}
.preview-body {
  margin: 0;
  font-size: 0.8rem;
  color: #475569;
  line-height: 1.5;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.preview-cta {
  display: inline-block;
  margin-top: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #0284c7;
}
.preview-dot {
  width: 9px;
  height: 9px;
  background: #0284c7;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 6px;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
}

.preview-meta {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 14px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  margin-bottom: 16px;
}
.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  font-size: 0.85rem;
}
.meta-row:not(:last-child) {
  border-bottom: 1px dashed #e2e8f0;
}
.meta-label {
  color: #64748b;
  font-weight: 600;
}
.meta-value {
  color: #0f172a;
  font-weight: 600;
  text-align: right;
  word-break: break-word;
}
.meta-value.mono {
  font-family: 'Courier New', monospace;
  color: #0284c7;
  font-size: 0.8rem;
}

.preview-note {
  padding: 12px 14px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 10px;
  font-size: 0.8rem;
  color: #92400e;
  line-height: 1.55;
}

/* ============ RESPONSIVE ============ */
@media (max-width: 992px) {
  .admin-notif-wrapper { padding: 22px 20px; }
  .sticky-preview { position: static; }
}
@media (max-width: 640px) {
  .admin-notif-wrapper { padding: 16px 12px; }
  .page-title { font-size: 1.4rem; }
  .page-header { flex-direction: column; align-items: stretch; }
  .target-options { grid-template-columns: 1fr; }
  .form-actions { flex-direction: column-reverse; }
  .btn-primary-tech, .btn-cancel-tech { width: 100%; }
}
</style>