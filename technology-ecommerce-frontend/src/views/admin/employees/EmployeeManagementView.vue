<template>
  <div >
    <!-- ================================================= -->
    <!-- MÀN HÌNH 1: DANH SÁCH NHÂN VIÊN                   -->
    <!-- ================================================= -->
    <div v-if="!showForm">
      <!-- Header: Nút quay lại & Tiêu đề -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        

        <!-- Nút Thêm mới -->
        <button class="btn-add-tech" @click="openAddForm">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-1">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Thêm nhân viên mới</span>
        </button>
      </div>
      <!-- Card Bảng Nhân Sự -->
      <div class="card-box shadow-sm">
        <!-- Thanh công cụ & Tìm kiếm -->
        <div class="table-search-bar">
          <div class="search-input-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input v-model="searchQuery" type="text" class="tech-search-input"
              placeholder="Tìm kiếm theo Tên, Email hoặc Số điện thoại..." />
          </div>
          <span class="count-badge">Tổng: {{ filteredEmployees.length }} nhân sự</span>
        </div>

        <!-- Bảng dữ liệu -->
        <div class="table-responsive">
          <table class="table custom-table align-middle mb-0">
            <thead>
              <tr>
                <th class="ps-4" style="width: 70px">ID</th>
                <th style="width: 20%">Họ và tên</th>
                <th style="width: 10%">Giới tính</th>
                <th style="width: 22%">Liên hệ (Email & SĐT)</th>
                <th style="width: 12%">Ngày sinh</th>
                <th style="width: 12%">Vai trò</th>
                <th class="text-center" style="width: 130px">Trạng thái</th>
                <th class="text-center pe-4" style="width: 110px">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <!-- Khi không có dữ liệu -->
              <tr v-if="filteredEmployees.length === 0">
                <td colspan="8" class="text-center py-5 text-muted">
                  <div class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
                      class="text-secondary mb-2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <line x1="18" y1="8" x2="23" y2="13"></line>
                      <line x1="23" y1="8" x2="18" y2="13"></line>
                    </svg>
                    <p class="mb-0 fw-semibold">
                      {{ searchQuery ? 'Không tìm thấy nhân viên phù hợp.' : 'Chưa có dữ liệu nhân viên.' }}
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Lặp danh sách nhân viên -->
              <tr v-for="employee in filteredEmployees" :key="employee.id">
                <td class="ps-4 fw-bold text-secondary">
                  #{{ employee.id }}
                </td>

                <!-- Họ tên + Avatar -->
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <div class="avatar-circle">
                      <img v-if="employee.avatar" :src="`http://localhost:3000/uploads/avatars/${employee.avatar}`"
                        :alt="employee.full_name" class="avatar-img" />
                      <span v-else>
                        {{ employee.full_name ? employee.full_name.charAt(0).toUpperCase() : 'U' }}
                      </span>
                    </div>
                    <div>
                      <span class="emp-name">{{ employee.full_name }}</span>
                      <span class="emp-address-sub" :title="employee.address">
                        {{ employee.address || 'Chưa cập nhật địa chỉ' }}
                      </span>
                    </div>
                  </div>
                </td>

                <!-- Giới tính -->
                <td>
                  <span class="gender-tag">
                    {{ (employee.gender == 1 || employee.gender === 'Nam') ? '👨 Nam' : '👩 Nữ' }}
                  </span>
                </td>
                <!-- Liên hệ (Email & SĐT) -->
                <td>
                  <div class="contact-box">
                    <span class="email-text">✉️ {{ employee.email }}</span>
                    <span class="phone-text">📞 {{ employee.phone || 'Chưa có SĐT' }}</span>
                  </div>
                </td>

                <!-- Ngày sinh -->
                <td>
                  <span class="dob-text">
                    {{ employee.date_of_birth ? employee.date_of_birth.substring(0, 10) : '---' }}
                  </span>
                </td>

                <!-- Vai trò (Role) -->
                <td>
                  <span class="role-badge">
                    {{ employee.role_name || 'Nhân viên' }}
                  </span>
                </td>

                <!-- Trạng thái -->
                <td class="text-center">
                  <span class="status-pill" :class="employee.status === 1 ? 'status-active' : 'status-locked'">
                    <span class="status-indicator"></span>
                    {{ employee.status === 1 ? 'Hoạt động' : 'Đã khóa' }}
                  </span>
                </td>

                <!-- Nút thao tác -->
                <td class="text-center pe-4">
                  <div class="d-inline-flex gap-2">
                    <!-- Nút Sửa -->
                    <button class="btn-row-action btn-row-edit" @click="handleEdit(employee)"
                      title="Chỉnh sửa thông tin">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                        <path d="m15 5 4 4"></path>
                      </svg>
                    </button>

                    <!-- Nút Khóa / Mở -->
                    <button class="btn-row-action" :class="employee.status === 1 ? 'btn-row-lock' : 'btn-row-unlock'"
                      @click="toggleStatus(employee)"
                      :title="employee.status === 1 ? 'Khóa tài khoản' : 'Mở khóa tài khoản'">
                      <svg v-if="employee.status === 1" xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round">
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
    </div>

    <!-- ================================================= -->
    <!-- MÀN HÌNH 2: FORM THÊM / SỬA NHÂN VIÊN            -->
    <!-- ================================================= -->
    <div v-else class="form-wrapper-view">
      <div class="d-flex align-items-center gap-3 mb-4">
        <button class="btn-back" @click="handleCancel">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Quay lại danh sách</span>
        </button>
        <div>
          <div class="brand-tag">{{ editingId ? 'UPDATE PROFILE' : 'NEW ONBOARDING' }}</div>
          <h2 class="page-title mb-0">
            {{ editingId ? 'Cập Nhật Hồ Sơ Nhân Viên' : 'Thêm Nhân Viên Mới' }}
          </h2>
        </div>
      </div>

      <div class="card-box shadow-sm">
        <form @submit.prevent="handleSubmit" class="p-4 p-md-5">
          <div class="tech-section-title mb-4">
            <span>THÔNG TIN TÀI KHOẢN & HỒ SƠ NHÂN VIÊN</span>
          </div>

          <div class="row g-3">
            <!-- Họ tên -->
            <div class="col-md-6">
              <label class="form-label tech-label">Họ và tên <span class="text-danger">*</span></label>
              <input v-model="form.full_name" type="text" class="tech-input" placeholder="Ví dụ: Nguyễn Văn A"
                required />
            </div>

            <!-- Giới tính (Segmented Pill) -->
            <div class="col-md-6">
              <label class="form-label tech-label">Giới tính</label>
              <div class="gender-toggle-group">
                <label class="gender-option" :class="{ active: form.gender == 1 || form.gender === 'Nam' }">
                  <input v-model="form.gender" type="radio" :value="1" class="d-none">
                  <span>👨 Nam</span>
                </label>
                <label class="gender-option" :class="{ active: form.gender == 0 || form.gender === 'Nữ' }">
                  <input v-model="form.gender" type="radio" :value="0" class="d-none">
                  <span>👩 Nữ</span>
                </label>
              </div>
            </div>

            <!-- Email -->
            <div class="col-md-6">
              <label class="form-label tech-label">Email đăng nhập <span class="text-danger">*</span></label>
              <input v-model="form.email" type="email" class="tech-input" placeholder="nhanvien@congty.com" required />
            </div>

            <!-- Mật khẩu (Chỉ hiện khi tạo mới) -->
            <div v-if="!editingId" class="col-md-6">
              <label class="form-label tech-label">Mật khẩu khởi tạo <span class="text-danger">*</span></label>
              <input v-model="form.password" type="password" class="tech-input" placeholder="Tối thiểu 6 ký tự..."
                required />
            </div>

            <!-- Vai trò (Role) -->
            <div class="col-md-6">
              <label class="form-label tech-label">Vai trò / Phân quyền <span class="text-danger">*</span></label>
              <select v-model="form.role_id" class="tech-select" required>
                <option value="">-- Chọn vai trò quản trị --</option>
                <option v-for="role in roles" :key="role.id" :value="role.id">
                  {{ role.name }}
                </option>
              </select>
            </div>

            <!-- Ngày sinh -->
            <div class="col-md-6">
              <label class="form-label tech-label">Ngày sinh</label>
              <input v-model="form.date_of_birth" type="date" class="tech-input" />
            </div>

            <!-- Số điện thoại -->
            <div class="col-md-6">
              <label class="form-label tech-label">Số điện thoại liên hệ</label>
              <input v-model="form.phone" type="text" class="tech-input" placeholder="Ví dụ: 0912 345 678" />
            </div>

            <!-- Địa chỉ -->
            <div class="col-12">
              <label class="form-label tech-label">Địa chỉ cư trú</label>
              <input v-model="form.address" type="text" class="tech-input"
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện..." />
            </div>
          </div>

          <!-- Nút hành động -->
          <div class="d-flex justify-content-end gap-3 mt-5 pt-3 border-top">
            <button type="button" class="btn-cancel-tech" @click="handleCancel">
              Hủy bỏ
            </button>
            <button type="submit" class="btn-primary-tech px-4">
              {{ editingId ? 'Lưu thay đổi hồ sơ' : 'Xác nhận tạo tài khoản' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";

const employees = ref([]);
const roles = ref([]);
const showForm = ref(false);
const searchQuery = ref("");

const form = ref({
  full_name: "",
  gender: 1,
  email: "",
  password: "",
  date_of_birth: "",
  address: "",
  phone: "",
  role_id: "",
});

const editingId = ref(null);

// Lọc nhân viên theo Tên, Email hoặc Số điện thoại
const filteredEmployees = computed(() => {
  if (!searchQuery.value) return employees.value;
  const q = searchQuery.value.toLowerCase().trim();
  return employees.value.filter(emp =>
    emp.full_name?.toLowerCase().includes(q) ||
    emp.email?.toLowerCase().includes(q) ||
    emp.phone?.includes(q)
  );
});
const token = localStorage.getItem('token')
const config = {
  headers: {
    Authorization: `Bearer ${token}`
  }
}

// ====================
// LẤY DANH SÁCH NHÂN VIÊN
// ====================
const fetchEmployees = async () => {
  try {
    const response = await axios.get(
      "http://localhost:3000/api/admin/employees", config
    );
    employees.value = response.data;
  } catch (error) {
    console.error("Lỗi lấy nhân viên:", error);
  }
};

// ====================
// LẤY DANH SÁCH ROLE
// ====================
const fetchRoles = async () => {
  try {
    const response = await axios.get(
      "http://localhost:3000/api/admin/employees/roles", config
    );
    roles.value = response.data;
  } catch (error) {
    console.error("Lỗi lấy role:", error);
  }
};

// ====================
// MỞ FORM THÊM
// ====================
const openAddForm = () => {
  resetForm();
  showForm.value = true;
};

// ====================
// CHỌN NHÂN VIÊN ĐỂ SỬA
// ====================
const handleEdit = (employee) => {
  editEmployee(employee);
  showForm.value = true;
};

const editEmployee = (employee) => {
  editingId.value = employee.id;
  form.value = {
    full_name: employee.full_name,
    gender: employee.gender,
    email: employee.email,
    password: "",
    date_of_birth: employee.date_of_birth
      ? employee.date_of_birth.substring(0, 10)
      : "",
    address: employee.address || "",
    phone: employee.phone || "",
    role_id: employee.role_id,
  };
};

// ====================
// SUBMIT FORM
// ====================
const handleSubmit = async () => {
  if (editingId.value) {
    await updateEmployee();
  } else {
    await createEmployee();
  }
};

// ====================
// THÊM NHÂN VIÊN
// ====================
const createEmployee = async () => {
  try {
    await axios.post(
      "http://localhost:3000/api/admin/employees",
      form.value, config
    );
    alert("Tạo nhân viên thành công");
    resetForm();
    showForm.value = false;
    await fetchEmployees();
  } catch (error) {
    console.error("Lỗi tạo nhân viên:", error);
    alert(error.response?.data?.message || "Có lỗi xảy ra");
  }
};

// ====================
// CẬP NHẬT NHÂN VIÊN
// ====================
const updateEmployee = async () => {
  try {
    await axios.put(
      `http://localhost:3000/api/admin/employees/${editingId.value}`,
      {
        full_name: form.value.full_name,
        gender: form.value.gender,
        email: form.value.email,
        date_of_birth: form.value.date_of_birth,
        address: form.value.address,
        phone: form.value.phone,
        role_id: form.value.role_id,
      }, config
    );
    alert("Cập nhật thành công");
    resetForm();
    showForm.value = false;
    await fetchEmployees();
  } catch (error) {
    console.error("Lỗi cập nhật:", error);
    alert(error.response?.data?.message || "Có lỗi xảy ra");
  }
};

// ====================
// KHÓA / MỞ TÀI KHOẢN
// ====================
const toggleStatus = async (employee) => {
  const newStatus = employee.status === 1 ? 0 : 1;
  const message =
    employee.status === 1
      ? "Bạn muốn khóa tài khoản này?"
      : "Bạn muốn mở tài khoản này?";

  if (!confirm(message)) return;

  try {
    await axios.patch(
      `http://localhost:3000/api/admin/employees/${employee.id}/status`,
      { status: newStatus }, config
    );
    await fetchEmployees();
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái:", error);
    alert(error.response?.data?.message || "Có lỗi xảy ra");
  }
};

// ====================
// RESET / HỦY FORM
// ====================
const resetForm = () => {
  editingId.value = null;
  form.value = {
    full_name: "",
    gender: 1,
    email: "",
    password: "",
    date_of_birth: "",
    address: "",
    phone: "",
    role_id: "",
  };
};

const handleCancel = () => {
  resetForm();
  showForm.value = false;
};

onMounted(() => {
  fetchEmployees();
  fetchRoles();
});
</script>

<style scoped>
/* Full màn hình với background tech */
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

/* Nút thêm mới Gradient */
.btn-add-tech {
  display: inline-flex;
  align-items: center;
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
}

.btn-add-tech:hover {
  background: linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%);
  box-shadow: 0 6px 16px rgba(2, 132, 199, 0.35);
  transform: translateY(-1px);
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

/* Bảng nhân sự */
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

/* Avatar (ảnh hoặc chữ cái đầu) */
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
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.emp-name {
  display: block;
  font-weight: 700;
  color: #0f172a;
  font-size: 0.95rem;
}

.emp-address-sub {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gender-tag {
  font-size: 0.85rem;
  color: #475569;
  font-weight: 500;
}

.contact-box {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.825rem;
}

.email-text {
  color: #0f172a;
  font-weight: 600;
}

.phone-text {
  color: #64748b;
}

.dob-text {
  color: #64748b;
  font-size: 0.875rem;
}

/* Badge Vai trò (Role) */
.role-badge {
  display: inline-block;
  padding: 4px 10px;
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #334155;
  border-radius: 6px;
  font-size: 0.775rem;
  font-weight: 700;
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
/* FORM VIEW STYLING                         */
/* ========================================= */
.form-wrapper-view {
  max-width: 900px;
  margin: 0 auto;
}

.tech-section-title {
  font-size: 0.8rem;
  font-weight: 800;
  color: #0284c7;
  letter-spacing: 0.06em;
}

.tech-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}

.tech-input,
.tech-select {
  width: 100%;
  padding: 10px 14px;
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.925rem;
  color: #0f172a;
  outline: none;
  transition: all 0.2s;
}

.tech-input:focus,
.tech-select:focus {
  background-color: #ffffff;
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
}

/* Giới tính Pill Selector */
.gender-toggle-group {
  display: flex;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 3px;
  gap: 3px;
  height: 44px;
}

.gender-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  transition: all 0.2s ease;
  margin: 0;
  user-select: none;
}

.gender-option.active {
  background: #ffffff;
  color: #0284c7;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

/* Nút bấm Form */
.btn-cancel-tech {
  padding: 10px 20px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
}

.btn-cancel-tech:hover {
  background: #f1f5f9;
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
}

.btn-primary-tech:hover {
  background: linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%);
  transform: translateY(-1px);
}
</style>