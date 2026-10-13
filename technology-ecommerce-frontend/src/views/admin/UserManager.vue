<template>
  <div class="user-page-wrapper">
    <!-- Header: Tiêu đề & Nút thao tác -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div class="d-flex align-items-center gap-3">
        <button class="btn-back" @click="$router.back()" title="Quay lại">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Quay lại</span>
        </button>
        <div>
          <div class="brand-tag">CUSTOMER DIRECTORY</div>
          <h2 class="page-title mb-0">Quản Lý Người Dùng</h2>
        </div>
      </div>

      <!-- Nút Làm mới danh sách -->
      <button class="btn-reload-tech" @click="getUsers" title="Tải lại danh sách">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="me-1"
        >
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
          <path d="M3 3v5h5"></path>
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
          <path d="M16 21h5v-5"></path>
        </svg>
        <span>Làm mới dữ liệu</span>
      </button>
    </div>

    <!-- Card Bảng Danh Sách Người Dùng -->
    <div class="card-box shadow-sm">
      <!-- Thanh tìm kiếm & đếm số lượng -->
      <div class="table-search-bar">
        <div class="search-input-wrapper">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="search-icon"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            class="tech-search-input"
            placeholder="Tìm kiếm theo Tên, Email hoặc ID khách hàng..."
          />
        </div>
        <span class="count-badge">Tổng: {{ filteredUsers.length }} người dùng</span>
      </div>

      <div class="table-responsive">
        <table class="table custom-table align-middle mb-0">
          <thead>
            <tr>
              <th class="ps-4" style="width: 80px">ID</th>
              <th style="width: 25%">Khách hàng</th>
              <th style="width: 25%">Email</th>
              <th style="width: 14%">Ngày sinh</th>
              <th style="width: 12%">Giới tính</th>
              <th class="text-center" style="width: 130px">Trạng thái</th>
              <th class="text-center pe-4" style="width: 120px">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <!-- Khi không có dữ liệu -->
            <tr v-if="filteredUsers.length === 0">
              <td colspan="7" class="text-center py-5 text-muted">
                <div class="empty-state">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="44"
                    height="44"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="text-secondary mb-2"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <p class="mb-0 fw-semibold">
                    {{
                      searchQuery
                        ? 'Không tìm thấy người dùng phù hợp.'
                        : 'Chưa có dữ liệu người dùng.'
                    }}
                  </p>
                </div>
              </td>
            </tr>

            <!-- Lặp danh sách khách hàng -->
            <tr v-for="user in filteredUsers" :key="user.id">
              <td class="ps-4 fw-bold text-secondary">#{{ user.id }}</td>

              <!-- Họ tên & Avatar -->
              <td>
                <div class="d-flex align-items-center gap-2">
                  <div class="avatar-circle">
                    {{ user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U' }}
                  </div>
                  <div>
                    <span class="user-name">{{ user.full_name }}</span>
                    <span class="user-id-sub">Thành viên Tech Store</span>
                  </div>
                </div>
              </td>

              <!-- Email -->
              <td>
                <span class="email-text">✉️ {{ user.email }}</span>
              </td>

              <!-- Ngày sinh -->
              <td>
                <span class="dob-text">
                  {{ user.date_of_birth ? user.date_of_birth.substring(0, 10) : '---' }}
                </span>
              </td>

              <!-- Giới tính -->
              <td>
                <span class="gender-pill">
                  {{
                    user.gender == 1 || user.gender === 'Nam'
                      ? '👨 Nam'
                      : user.gender == 0 || user.gender === 'Nữ'
                        ? '👩 Nữ'
                        : '---'
                  }}
                </span>
              </td>

              <!-- Trạng thái -->
              <td class="text-center">
                <span
                  class="status-pill"
                  :class="user.status === 1 ? 'status-active' : 'status-locked'"
                >
                  <span class="status-indicator"></span>
                  {{ user.status === 1 ? 'Hoạt động' : 'Bị khóa' }}
                </span>
              </td>

              <!-- Thao tác -->
              <td class="text-center pe-4">
                <div class="d-inline-flex gap-2">
                  <!-- Nút Sửa -->
                  <button
                    class="btn-row-action btn-row-edit"
                    @click="getUserById(user.id)"
                    title="Chỉnh sửa thông tin"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                      <path d="m15 5 4 4"></path>
                    </svg>
                  </button>

                  <!-- Nút Khóa / Mở khóa -->
                  <button
                    class="btn-row-action"
                    :class="user.status === 1 ? 'btn-row-lock' : 'btn-row-unlock'"
                    @click="updateStatus(user)"
                    :title="user.status === 1 ? 'Khóa tài khoản' : 'Mở khóa tài khoản'"
                  >
                    <svg
                      v-if="user.status === 1"
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <svg
                      v-else
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
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
    <!-- MODAL POPUP CẬP NHẬT NGƯỜI DÙNG                   -->
    <!-- ================================================= -->
    <div v-if="selectedUser" class="modal-overlay">
      <div class="modal-card shadow-lg">
        <div class="modal-header">
          <div>
            <div class="badge-modal">USER EDIT PROFILE</div>
            <h4 class="mb-0 fw-bold text-dark mt-1">Cập Nhật Thông Tin Người Dùng</h4>
          </div>
          <button type="button" class="btn-close-modal" @click="selectedUser = null">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form @submit.prevent="updateUser">
          <div class="modal-body p-4">
            <div class="row g-3">
              <!-- Họ tên -->
              <div class="col-12">
                <label class="form-label tech-modal-label"
                  >Họ và tên <span class="text-danger">*</span></label
                >
                <input
                  v-model="form.full_name"
                  class="tech-modal-input"
                  placeholder="Nhập họ tên..."
                  required
                />
              </div>

              <!-- Email -->
              <div class="col-12">
                <label class="form-label tech-modal-label"
                  >Email <span class="text-danger">*</span></label
                >
                <input
                  v-model="form.email"
                  type="email"
                  class="tech-modal-input"
                  placeholder="Nhập email..."
                  required
                />
              </div>

              <!-- Ngày sinh -->
              <div class="col-md-6">
                <label class="form-label tech-modal-label">Ngày sinh</label>
                <input type="date" v-model="form.date_of_birth" class="tech-modal-input" />
              </div>

              <!-- Giới tính -->
              <div class="col-md-6">
                <label class="form-label tech-modal-label">Giới tính</label>
                <select v-model="form.gender" class="tech-modal-select">
                  <option value="">-- Chọn giới tính --</option>
                  <option :value="1">👨 Nam</option>
                  <option :value="0">👩 Nữ</option>
                </select>
              </div>
            </div>
          </div>

          <div class="modal-footer p-3 bg-light border-top d-flex justify-content-end gap-2">
            <button type="button" class="btn-cancel-modal" @click="selectedUser = null">
              Hủy bỏ
            </button>
            <button type="submit" class="btn-confirm-modal">Lưu thay đổi</button>
          </div>
        </form>
      </div>
    </div>
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
/* Full màn hình toàn trang */
.user-page-wrapper {
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

.brand-tag {
  font-size: 0.725rem;
  font-weight: 700;
  color: #0284c7;
  letter-spacing: 0.08em;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
}

/* Nút quay lại */
.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #475569;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-back:hover {
  background: #f1f5f9;
  color: #0284c7;
  border-color: #0284c7;
}

/* Nút làm mới dữ liệu */
.btn-reload-tech {
  display: inline-flex;
  align-items: center;
  padding: 9px 16px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.btn-reload-tech:hover {
  background: #f8fafc;
  color: #0284c7;
  border-color: #0284c7;
}

/* Card Box */
.card-box {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
}

/* Thanh tìm kiếm */
.table-search-bar {
  padding: 18px 24px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.search-input-wrapper {
  position: relative;
  width: 100%;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.tech-search-input {
  width: 100%;
  padding: 9px 14px 9px 42px;
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
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
  font-size: 0.8rem;
  font-weight: 700;
  color: #0284c7;
  background: #f0f9ff;
  padding: 5px 12px;
  border-radius: 50px;
  border: 1px solid #bae6fd;
}

/* Bảng dữ liệu */
.custom-table thead th {
  background-color: #f8fafc;
  color: #64748b;
  font-size: 0.775rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 14px 12px;
  border-bottom: 1px solid #e2e8f0;
}

.custom-table tbody tr:hover {
  background-color: #f8fafc;
}

.custom-table tbody td {
  padding: 14px 12px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

/* Avatar chữ cái đầu */
.avatar-circle {
  width: 36px;
  height: 36px;
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
}

.user-name {
  display: block;
  font-weight: 700;
  color: #0f172a;
  font-size: 0.95rem;
}

.user-id-sub {
  font-size: 0.75rem;
  color: #94a3b8;
}

.email-text {
  font-size: 0.875rem;
  color: #334155;
  font-weight: 500;
}

.dob-text {
  color: #64748b;
  font-size: 0.875rem;
}

.gender-pill {
  font-size: 0.85rem;
  color: #475569;
}

/* Status Pill */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 50px;
  font-size: 0.775rem;
  font-weight: 600;
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
}

.status-locked {
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}
.status-locked .status-indicator {
  background-color: #ef4444;
}

/* Nút thao tác */
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

.btn-row-edit {
  border-color: #cbd5e1;
  color: #0284c7;
}
.btn-row-edit:hover {
  background-color: #f0f9ff;
  border-color: #0284c7;
}

.btn-row-lock {
  border-color: #fecaca;
  color: #ef4444;
}
.btn-row-lock:hover {
  background-color: #fef2f2;
}

.btn-row-unlock {
  border-color: #a7f3d0;
  color: #10b981;
}
.btn-row-unlock:hover {
  background-color: #ecfdf5;
}

/* ========================================= */
/* MODAL POPUP                               */
/* ========================================= */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.6);
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
}

.modal-header {
  padding: 18px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
}

.badge-modal {
  font-size: 0.7rem;
  font-weight: 700;
  color: #0284c7;
  letter-spacing: 0.08em;
}

.btn-close-modal {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
}
.btn-close-modal:hover {
  color: #0f172a;
}

.tech-modal-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}

.tech-modal-input,
.tech-modal-select {
  width: 100%;
  padding: 10px 14px;
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.925rem;
  color: #0f172a;
  outline: none;
}
.tech-modal-input:focus,
.tech-modal-select:focus {
  background-color: #ffffff;
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
}

.btn-cancel-modal {
  padding: 8px 16px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
}
.btn-cancel-modal:hover {
  background: #f1f5f9;
}

.btn-confirm-modal {
  padding: 8px 20px;
  background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
}
.btn-confirm-modal:hover {
  background: linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%);
}
</style>
