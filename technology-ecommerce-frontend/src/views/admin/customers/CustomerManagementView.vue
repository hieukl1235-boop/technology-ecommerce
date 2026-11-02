<template>
  <div class="user-page-wrapper">
    <!-- Header: Tiêu đề & Nút thao tác -->
    <div class="page-header">
      <div class="header-left">
        <button class="btn-back" @click="$router.back()" title="Quay lại">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Quay lại</span>
        </button>

        <div class="header-title">
          <div class="brand-tag">CUSTOMER DIRECTORY</div>
          <h2 class="page-title">Quản Lý Người Dùng</h2>
        </div>
      </div>

      <button class="btn-reload-tech" @click="getUsers" title="Tải lại danh sách">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1">
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
          <path d="M3 3v5h5"></path>
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
          <path d="M16 21h5v-5"></path>
        </svg>
        <span>Làm mới dữ liệu</span>
      </button>
    </div>

    <!-- Card Bảng Danh Sách Người Dùng -->
    <div class="card-box">
      <!-- Thanh tìm kiếm & đếm số lượng -->
      <div class="table-search-bar">
        <div class="search-input-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input v-model="searchQuery" type="text" class="tech-search-input"
            placeholder="Tìm kiếm theo Tên, Email hoặc ID khách hàng..." />
        </div>
        <span class="count-badge">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          {{ filteredUsers.length }} người dùng
        </span>
      </div>

      <div class="table-responsive">
        <table class="table custom-table align-middle mb-0">
          <thead>
            <tr>
              <th class="ps-4" style="width: 80px">ID</th>
              <th style="width: 26%">Khách hàng</th>
              <th style="width: 24%">Email</th>
              <th style="width: 13%">Ngày sinh</th>
              <th style="width: 11%">Giới tính</th>
              <th class="text-center" style="width: 120px">Trạng thái</th>
              <th class="text-center pe-4" style="width: 120px">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <!-- Empty state -->
            <tr v-if="filteredUsers.length === 0">
              <td colspan="7" class="text-center py-5">
                <div class="empty-state">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <p class="empty-title">
                    {{ searchQuery ? 'Không tìm thấy người dùng phù hợp' : 'Chưa có dữ liệu người dùng' }}
                  </p>
                  <p class="empty-sub">
                    {{ searchQuery ? 'Thử tìm với từ khóa khác nhé.' : 'Danh sách sẽ hiển thị khi có người dùng mới.' }}
                  </p>
                </div>
              </td>
            </tr>

            <!-- Row người dùng -->
            <tr v-for="user in filteredUsers" :key="user.id">
              <td class="ps-4">
                <span class="id-badge">#{{ user.id }}</span>
              </td>

              <!-- Họ tên & Avatar -->
              <td>
                <div class="user-cell">
                  <div class="avatar-circle">
                    <img v-if="user.avatar" :src="`http://localhost:3000/uploads/avatars/${user.avatar}`"
                      :alt="user.full_name" class="avatar-img" />
                    <span v-else>{{ user.full_name?.charAt(0).toUpperCase() || 'U' }}</span>
                  </div>
                  <div class="user-info">
                    <span class="user-name">{{ user.full_name }}</span>
                    <span class="user-id-sub">Thành viên Tech Store</span>
                  </div>
                </div>
              </td>

              <!-- Email -->
              <td>
                <span class="email-text">{{ user.email }}</span>
              </td>

              <!-- Ngày sinh -->
              <td>
                <span class="dob-text">
                  {{ user.date_of_birth ? user.date_of_birth.substring(0, 10) : '—' }}
                </span>
              </td>

              <!-- Giới tính -->
              <td>
                <span class="gender-pill">
                  {{ user.gender == 1 || user.gender === 'Nam' ? 'Nam'
                    : user.gender == 0 || user.gender === 'Nữ' ? 'Nữ' : '—' }}
                </span>
              </td>

              <!-- Trạng thái -->
              <td class="text-center">
                <span class="status-pill" :class="user.status === 1 ? 'status-active' : 'status-locked'">
                  <span class="status-indicator"></span>
                  {{ user.status === 1 ? 'Hoạt động' : 'Bị khóa' }}
                </span>
              </td>

              <!-- Thao tác -->
              <td class="text-center pe-4">
                <div class="action-group">
                  <button class="btn-row-action btn-row-edit" @click="getUserById(user.id)" title="Chỉnh sửa thông tin"
                    aria-label="Chỉnh sửa">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                      <path d="m15 5 4 4"></path>
                    </svg>
                  </button>

                  <button class="btn-row-action" :class="user.status === 1 ? 'btn-row-lock' : 'btn-row-unlock'"
                    @click="updateStatus(user)" :title="user.status === 1 ? 'Khóa tài khoản' : 'Mở khóa tài khoản'"
                    :aria-label="user.status === 1 ? 'Khóa tài khoản' : 'Mở khóa tài khoản'">
                    <svg v-if="user.status === 1" xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                      stroke-linejoin="round">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ================================================= -->
    <!-- MODAL CẬP NHẬT NGƯỜI DÙNG                         -->
    <!-- ================================================= -->
    <Transition name="modal-fade">
      <div v-if="selectedUser" class="modal-overlay" @click.self="selectedUser = null">
        <div class="modal-card" role="dialog" aria-modal="true">
          <div class="modal-header">
            <div>
              <div class="badge-modal">USER EDIT PROFILE</div>
              <h4 class="modal-title">Cập Nhật Thông Tin Người Dùng</h4>
            </div>
            <button type="button" class="btn-close-modal" @click="selectedUser = null" aria-label="Đóng">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <form @submit.prevent="updateUser">
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-12">
                  <label class="tech-modal-label">
                    Họ và tên <span class="required-mark">*</span>
                  </label>
                  <input v-model="form.full_name" class="tech-modal-input" placeholder="Nhập họ tên..." required />
                </div>

                <div class="col-12">
                  <label class="tech-modal-label">
                    Email <span class="required-mark">*</span>
                  </label>
                  <input v-model="form.email" type="email" class="tech-modal-input" placeholder="Nhập email..."
                    required />
                </div>

                <div class="col-md-6">
                  <label class="tech-modal-label">Ngày sinh</label>
                  <input type="date" v-model="form.date_of_birth" class="tech-modal-input" />
                </div>

                <div class="col-md-6">
                  <label class="tech-modal-label">Giới tính</label>
                  <select v-model="form.gender" class="tech-modal-select">
                    <option value="">-- Chọn giới tính --</option>
                    <option :value="1">Nam</option>
                    <option :value="0">Nữ</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-cancel-modal" @click="selectedUser = null">
                Hủy bỏ
              </button>
              <button type="submit" class="btn-confirm-modal">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Lưu thay đổi
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const users = ref([])
const selectedUser = ref(null)
const searchQuery = ref('')
const token = localStorage.getItem('token') // Lấy token từ localStorage
const form = ref({
  full_name: '',
  email: '',
  date_of_birth: '',
  gender: '',
})

// Lọc người dùng theo Tên, Email hoặc ID
const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  const q = searchQuery.value.toLowerCase().trim()
  return users.value.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      user.id?.toString().includes(q),
  )
})

// =========================
// GET - Lấy danh sách
// =========================
const getUsers = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` },
    })
    users.value = response.data
  } catch (error) {
    console.error(error)
  }
}

// =========================
// GET - Lấy user theo ID
// =========================
const getUserById = async (id) => {
  try {
    const response = await axios.get(`http://localhost:3000/api/admin/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    selectedUser.value = response.data

    form.value = {
      full_name: response.data.full_name,
      email: response.data.email,
      date_of_birth: response.data.date_of_birth
        ? response.data.date_of_birth.substring(0, 10)
        : '',
      gender: response.data.gender !== undefined ? response.data.gender : '',
    }
  } catch (error) {
    console.error(error)
  }
}

// =========================
// PUT - Cập nhật user
// =========================
const updateUser = async () => {
  if (!selectedUser.value) {
    alert('Hãy chọn người dùng cần sửa')
    return
  }

  try {
    const response = await axios.put(
      `http://localhost:3000/api/admin/users/${selectedUser.value.id}`,
      {
        full_name: form.value.full_name,
        email: form.value.email,
        date_of_birth: form.value.date_of_birth || null,
        gender: form.value.gender,
      },
      { headers: { Authorization: `Bearer ${token}` } },
    )

    alert(response.data.message)
    await getUsers()
    selectedUser.value = null // Đóng modal sau khi cập nhật thành công
  } catch (error) {
    console.error(error)
    alert(error.response?.data?.message || 'Có lỗi xảy ra')
  }
}

// =========================
// PATCH - Khóa / mở tài khoản
// =========================
const updateStatus = async (user) => {
  try {
    const newStatus = user.status === 1 ? 0 : 1

    const response = await axios.patch(
      `http://localhost:3000/api/admin/users/${user.id}/status`,

      {
        status: newStatus,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )

    alert(response.data.message)
    await getUsers()
  } catch (error) {
    console.error(error)
    alert(error.response?.data?.message || 'Có lỗi xảy ra')
  }
}

onMounted(() => {
  getUsers()
})
</script>

<style scoped>
/* ============ PAGE LAYOUT ============ */
.user-page-wrapper {
  min-height: 100vh;
  width: 100%;
  background-color: #f8fafc;
  background-image:
    linear-gradient(rgba(226, 232, 240, 0.55) 1px, transparent 1px),
    linear-gradient(90deg, rgba(226, 232, 240, 0.55) 1px, transparent 1px);
  background-size: 32px 32px;
  padding: 28px 40px;
  box-sizing: border-box;
}

/* ============ HEADER ============ */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-tag {
  font-size: 0.7rem;
  font-weight: 700;
  color: #0284c7;
  letter-spacing: 0.1em;
}

.page-title {
  font-size: 1.65rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  line-height: 1.2;
}

/* ============ BUTTONS ============ */
.btn-back,
.btn-reload-tech {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 15px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  color: #475569;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.btn-back:hover,
.btn-reload-tech:hover {
  color: #0284c7;
  border-color: #0284c7;
  background: #f0f9ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(2, 132, 199, 0.12);
}

/* ============ CARD ============ */
.card-box {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
}

/* ============ SEARCH BAR ============ */
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
  padding: 10px 14px 10px 42px;
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  font-size: 0.9rem;
  color: #0f172a;
  outline: none;
  transition: all 0.2s;
}

.tech-search-input:focus {
  background-color: #ffffff;
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
}

.count-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #0284c7;
  background: #f0f9ff;
  padding: 6px 14px;
  border-radius: 50px;
  border: 1px solid #bae6fd;
  white-space: nowrap;
}

/* ============ TABLE ============ */
.custom-table thead th {
  background-color: #f8fafc;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 14px 12px;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.custom-table tbody tr {
  transition: background-color 0.15s;
}

.custom-table tbody tr:hover {
  background-color: #f8fafc;
}

.custom-table tbody td {
  padding: 14px 12px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.custom-table tbody tr:last-child td {
  border-bottom: none;
}

/* ============ CELL STYLES ============ */
.id-badge {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  background: #f1f5f9;
  padding: 3px 8px;
  border-radius: 6px;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  color: #0284c7;
  font-weight: 700;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid #bae6fd;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.user-name {
  font-weight: 700;
  color: #0f172a;
  font-size: 0.92rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-id-sub {
  font-size: 0.73rem;
  color: #94a3b8;
}

.email-text {
  font-size: 0.875rem;
  color: #334155;
  font-weight: 500;
  word-break: break-all;
}

.dob-text {
  color: #64748b;
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
}

.gender-pill {
  font-size: 0.85rem;
  color: #475569;
  font-weight: 500;
}

/* ============ STATUS ============ */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
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
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

/* ============ ACTION BUTTONS ============ */
.action-group {
  display: inline-flex;
  gap: 6px;
}

.btn-row-action {
  width: 32px;
  height: 32px;
  border-radius: 7px;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #ffffff;
  transition: all 0.18s ease;
}

.btn-row-edit {
  border-color: #cbd5e1;
  color: #0284c7;
}

.btn-row-edit:hover {
  background-color: #f0f9ff;
  border-color: #0284c7;
  transform: translateY(-1px);
}

.btn-row-lock {
  border-color: #fecaca;
  color: #ef4444;
}

.btn-row-lock:hover {
  background-color: #fef2f2;
  transform: translateY(-1px);
}

.btn-row-unlock {
  border-color: #a7f3d0;
  color: #10b981;
}

.btn-row-unlock:hover {
  background-color: #ecfdf5;
  transform: translateY(-1px);
}

/* ============ EMPTY STATE ============ */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  color: #94a3b8;
}

.empty-title {
  margin: 12px 0 4px;
  font-weight: 700;
  color: #475569;
  font-size: 0.95rem;
}

.empty-sub {
  margin: 0;
  font-size: 0.85rem;
  color: #94a3b8;
}

/* ============ MODAL ============ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(6px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
  padding: 20px;
}

.modal-card {
  background: #ffffff;
  width: 100%;
  max-width: 540px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 25px 60px rgba(15, 23, 42, 0.25);
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: #f8fafc;
}

.badge-modal {
  font-size: 0.68rem;
  font-weight: 700;
  color: #0284c7;
  letter-spacing: 0.1em;
}

.modal-title {
  margin: 4px 0 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
}

.btn-close-modal {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  transition: all 0.15s;
}

.btn-close-modal:hover {
  color: #0f172a;
  background: #e2e8f0;
}

.modal-body {
  padding: 22px 24px;
}

.tech-modal-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}

.required-mark {
  color: #dc2626;
}

.tech-modal-input,
.tech-modal-select {
  width: 100%;
  padding: 10px 14px;
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  font-size: 0.92rem;
  color: #0f172a;
  outline: none;
  transition: all 0.2s;
}

.tech-modal-input:focus,
.tech-modal-select:focus {
  background-color: #ffffff;
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
}

.modal-footer {
  padding: 16px 24px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel-modal {
  padding: 9px 18px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  border-radius: 9px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-cancel-modal:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.btn-confirm-modal {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
  color: #ffffff;
  border: none;
  border-radius: 9px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(2, 132, 199, 0.3);
  transition: all 0.18s;
}

.btn-confirm-modal:hover {
  background: linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(2, 132, 199, 0.4);
}

/* ============ MODAL TRANSITION ============ */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.22s ease;
}

.modal-fade-enter-active .modal-card,
.modal-fade-leave-active .modal-card {
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-card,
.modal-fade-leave-to .modal-card {
  transform: scale(0.94) translateY(10px);
}

/* ============ RESPONSIVE ============ */
@media (max-width: 768px) {
  .user-page-wrapper {
    padding: 20px 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    width: 100%;
  }

  .btn-reload-tech {
    align-self: flex-end;
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
}
</style>
