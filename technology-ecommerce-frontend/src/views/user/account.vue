<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'

// Các trường thông tin người dùng
const fullName = ref('')
const email = ref('')
const password = ref('')
const dateOfBirth = ref('')
const gender = ref('')
const status = ref('')
const isLoading = ref(false)
const isSubmitting = ref(false)

// Thông báo
const message = ref('')
const messageType = ref('success')
let messageTimer = null

// Modal đăng xuất
const showLogoutModal = ref(false)

const showMessage = (msg, type = 'success') => {
  message.value = msg
  messageType.value = type
  if (messageTimer) clearTimeout(messageTimer)
  messageTimer = setTimeout(() => {
    message.value = ''
  }, 3500)
}

// Lấy thông tin tài khoản
const fetchedUserData = async () => {
  try {
    isLoading.value = true
    const token = localStorage.getItem('token')
    const response = await axios.get('http://localhost:3000/api/user/account/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })

    const user = response.data.user
    fullName.value = user.full_name || ''
    email.value = user.email || ''
    dateOfBirth.value = user.date_of_birth ? user.date_of_birth.split('T')[0] : ''
    gender.value = user.gender !== undefined && user.gender !== null ? String(user.gender) : ''
    status.value = user.status || ''
  } catch (error) {
    console.error('Lỗi tải dữ liệu người dùng:', error)
    showMessage('Không thể tải thông tin tài khoản', 'error')
  } finally {
    isLoading.value = false
  }
}

const handleBack = () => {
  window.history.back()
}

// Đăng xuất qua modal
const handleLogout = () => {
  showLogoutModal.value = true
}

const confirmLogout = () => {
  localStorage.removeItem('token')
  window.location.href = '/login'
}

// Submit cập nhật
const handleSubmit = async () => {
  if (isSubmitting.value) return

  // Validate
  if (!fullName.value.trim()) {
    showMessage('Vui lòng nhập họ và tên', 'error')
    return
  }

  isSubmitting.value = true
  const formData = {
    full_name: fullName.value.trim(),
    date_of_birth: dateOfBirth.value,
    gender: gender.value,
    status: status.value,
  }

  try {
    const token = localStorage.getItem('token')
    await axios.post('http://localhost:3000/api/user/account/profile', formData, {
      headers: { Authorization: `Bearer ${token}` },
    })
    showMessage('Cập nhật thông tin thành công!', 'success')
  } catch (error) {
    console.error('Lỗi cập nhật:', error)
    showMessage(error.response?.data?.message || 'Cập nhật thất bại!', 'error')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchedUserData()
})

onBeforeUnmount(() => {
  if (messageTimer) clearTimeout(messageTimer)
})
</script>

<template>
  <div class="account-wrapper">
    <!-- HEADER -->
    <header class="account-top">
      <div class="account-top-inner">
        <RouterLink to="/home" class="brand" aria-label="TechStore - Trang chủ">
          Tech<span>Store</span>
        </RouterLink>
        <RouterLink to="/home" class="back-link">← Tiếp tục mua sắm</RouterLink>
      </div>
    </header>

    <main class="account-main">
      <!-- CARD -->
      <div class="account-card">
        <div class="card-header">
          <button @click="handleBack" class="btn-back" title="Quay lại" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Quay lại</span>
          </button>
          <div class="card-titles">
            <h1 class="card-title">Thông tin tài khoản</h1>
            <p class="card-sub">Quản lý thông tin cá nhân và bảo mật của bạn</p>
          </div>
        </div>

        <!-- ALERT -->
        <transition name="fade">
          <div
            v-if="message"
            class="account-alert"
            :class="messageType === 'error' ? 'account-alert-error' : 'account-alert-success'"
          >
            <span>{{ messageType === 'error' ? '⚠️' : '✅' }} {{ message }}</span>
            <button type="button" @click="message = ''" aria-label="Đóng">✕</button>
          </div>
        </transition>

        <!-- LOADING -->
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>

        <!-- FORM -->
        <form v-else @submit.prevent="handleSubmit" class="account-form">
          <div class="form-row">
            <div class="form-group">
              <label for="full_name">
                Họ và tên <span class="required">*</span>
              </label>
              <input
                type="text"
                id="full_name"
                v-model="fullName"
                placeholder="Nhập họ tên của bạn"
                :disabled="isSubmitting"
              />
            </div>

            <div class="form-group">
              <label for="email">
                Email <span class="badge-disabled">(Không thể đổi)</span>
              </label>
              <input type="email" id="email" v-model="email" disabled placeholder="Email của bạn" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="date_of_birth">Ngày sinh</label>
              <input
                type="date"
                id="date_of_birth"
                v-model="dateOfBirth"
                :disabled="isSubmitting"
              />
            </div>

            <div class="form-group">
              <label for="gender">Giới tính</label>
              <select id="gender" v-model="gender" :disabled="isSubmitting">
                <option value="" disabled>-- Chọn giới tính --</option>
                <option value="1">Nam</option>
                <option value="0">Nữ</option>
              </select>
            </div>
          </div>

          <!-- Link đơn hàng -->
          <RouterLink to="/user/orders" class="btn-orders-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            <span>Xem lịch sử đơn hàng đã đặt</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" class="arrow-icon">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </RouterLink>

          <!-- Actions -->
          <div class="form-actions">
            <button type="button" class="btn-danger" :disabled="isSubmitting" @click="handleLogout">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Đăng xuất</span>
            </button>
            <button type="submit" class="btn-primary" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner-sm"></span>
              <span>{{ isSubmitting ? 'Đang lưu...' : 'Cập nhật thông tin' }}</span>
            </button>
          </div>
        </form>
      </div>
    </main>

    <!-- MODAL ĐĂNG XUẤT -->
    <transition name="fade">
      <div v-if="showLogoutModal" class="modal-overlay" @click.self="showLogoutModal = false">
        <div class="modal-card">
          <div class="modal-icon">👋</div>
          <h3>Đăng xuất?</h3>
          <p>Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?</p>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="showLogoutModal = false">Hủy</button>
            <button type="button" class="btn-danger" @click="confirmLogout">Đăng xuất</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');

.account-wrapper {
  --ink: #0f1b2d;
  --muted: #5b6b7f;
  --line: #e3e8ef;
  --bg: #f5f7fa;
  --brand: #0a6cff;
  --price: #e5322d;

  font-family: 'Be Vietnam Pro', 'Segoe UI', system-ui, sans-serif;
  color: var(--ink);
  background: var(--bg);
  min-height: 100vh;
}
.account-wrapper *,
.account-wrapper *::before,
.account-wrapper *::after {
  box-sizing: border-box;
}

/* Header */
.account-top {
  background: #fff;
  border-bottom: 1px solid var(--line);
}
.account-top-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ink);
  text-decoration: none;
}
.brand span { color: var(--brand); }
.back-link {
  font-size: 14px;
  font-weight: 500;
  color: var(--muted);
  text-decoration: none;
}
.back-link:hover { color: var(--brand); }

/* Main */
.account-main {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 32px 20px 60px;
  min-height: calc(100vh - 60px);
}

.account-card {
  width: 100%;
  max-width: 640px;
  background: #ffffff;
  padding: 32px 36px;
  border-radius: 16px;
  border: 1px solid var(--line);
  box-shadow: 0 4px 20px rgba(15, 27, 45, 0.06);
}

/* Card header */
.card-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--line);
}
.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--muted);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  flex-shrink: 0;
  margin-top: 4px;
}
.btn-back:hover {
  background: #f0f9ff;
  color: var(--brand);
  border-color: var(--brand);
  transform: translateX(-2px);
}

.card-titles { flex: 1; min-width: 0; }
.card-title {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--ink);
}
.card-sub {
  margin: 0;
  font-size: 14px;
  color: var(--muted);
}

/* Alert */
.account-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 16px;
  margin-bottom: 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
}
.account-alert-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}
.account-alert-success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #15803d;
}
.account-alert button {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 14px;
  opacity: 0.6;
  padding: 2px 6px;
  border-radius: 4px;
}
.account-alert button:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.05);
}

/* Form */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.form-group { margin-bottom: 18px; }

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 14px;
  color: #34495e;
}

.required { color: var(--price); }

.badge-disabled {
  font-weight: 500;
  font-size: 12px;
  color: #94a3b8;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 11px 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  color: var(--ink);
  background: #ffffff;
  transition: all 0.2s;
}
.form-group input::placeholder {
  color: #b6c0cd;
}
.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(10, 108, 255, 0.12);
}
.form-group input:disabled {
  background-color: #f5f7fa;
  color: #94a3b8;
  cursor: not-allowed;
}

/* Orders link */
.btn-orders-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 14px 18px;
  margin: 8px 0 20px;
  background: #f0f9ff;
  border: 1px solid #bfdbfe;
  color: var(--brand);
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  transition: all 0.2s;
}
.btn-orders-link span { flex: 1; }
.btn-orders-link .arrow-icon { transition: transform 0.2s; }
.btn-orders-link:hover {
  background: var(--brand);
  color: #ffffff;
  border-color: var(--brand);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(10, 108, 255, 0.25);
}
.btn-orders-link:hover .arrow-icon {
  transform: translateX(4px);
}

/* Actions */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--line);
}

.btn-primary,
.btn-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 18px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-primary:disabled,
.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  flex: 2;
  background: var(--brand);
  color: white;
}
.btn-primary:hover:not(:disabled) {
  background: #0850c4;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(10, 108, 255, 0.25);
}

.btn-danger {
  flex: 1;
  background: #ffffff;
  color: var(--price);
  border: 1.5px solid #fecaca;
}
.btn-danger:hover:not(:disabled) {
  background: #fef2f2;
  border-color: var(--price);
  transform: translateY(-1px);
}

/* Loading */
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
  color: var(--muted);
  font-size: 14px;
}
.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--line);
  border-top-color: var(--brand);
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
@keyframes spin { to { transform: rotate(360deg); } }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 27, 45, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}
.modal-card {
  background: #fff;
  padding: 28px 24px;
  border-radius: 14px;
  width: 100%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.25);
}
.modal-icon {
  font-size: 42px;
  margin-bottom: 8px;
}
.modal-card h3 {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
}
.modal-card p {
  margin: 0 0 22px;
  font-size: 14px;
  color: var(--muted);
  line-height: 1.5;
}
.modal-actions {
  display: flex;
  gap: 10px;
}
.modal-actions button {
  flex: 1;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.modal-actions .btn-cancel {
  background: #fff;
  border: 1px solid var(--line);
  color: var(--muted);
}
.modal-actions .btn-cancel:hover {
  background: var(--bg);
}
.modal-actions .btn-danger {
  background: var(--price);
  color: #fff;
  border: none;
}
.modal-actions .btn-danger:hover {
  background: #c9231e;
}

/* Transition */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }

/* Responsive */
@media (max-width: 640px) {
  .account-main {
    padding: 20px 14px 40px;
  }
  .account-card {
    padding: 22px 18px;
    border-radius: 12px;
  }
  .card-header {
    flex-direction: column;
    gap: 12px;
  }
  .btn-back { margin-top: 0; }
  .card-title { font-size: 19px; }
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .form-actions {
    flex-direction: column-reverse;
  }
  .btn-primary,
  .btn-danger {
    width: 100%;
  }
}
</style>