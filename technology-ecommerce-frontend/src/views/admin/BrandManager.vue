<template>
  <div class="brand-page-wrapper">
    <!-- ================================================= -->
    <!-- MÀN HÌNH 1: DANH SÁCH THƯƠNG HIỆU                    -->
    <!-- ================================================= -->
    <div v-if="currentView === 'list'">
      <!-- Header: Tiêu đề & Nút thao tác -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <!-- BÊN TRÁI: Nút quay lại + Tiêu đề -->
        <div class="d-flex align-items-center gap-3">
          <button class="btn-back" @click="goBackPage" title="Quay lại">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Quay lại</span>
          </button>
          <div>
            <div class="brand-tag">BRAND DIRECTORY</div>
            <h2 class="page-title mb-0">Quản Lý Thương Hiệu</h2>
          </div>
        </div>
        
        <!-- BÊN PHẢI: Nút thêm mới -->
        <button class="btn-add-tech" @click="openCreateForm">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-1">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Thêm thương hiệu mới</span>
        </button>
      </div>

      <!-- Thông báo -->
      <div v-if="message" class="alert-banner mb-4 shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <span>{{ message }}</span>
        <button type="button" class="btn-close-msg ms-auto" @click="message = ''">✕</button>
      </div>

      <!-- Card Bảng Dữ Liệu Full Màn Hình -->
      <div class="card-box shadow-sm">
        <!-- THANH TÌM KIẾM CÔNG NGHỆ -->
        <div class="table-search-bar">
          <div class="search-input-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              v-model="searchQuery" 
              type="text" 
              class="tech-search-input" 
              placeholder="Tìm kiếm theo Tên hoặc ID thương hiệu..." 
            />
          </div>
          <span class="count-badge">Tổng: {{ filteredBrands.length }} thương hiệu</span>
        </div>

        <div class="table-responsive">
          <table class="table custom-table align-middle mb-0">
            <thead>
              <tr>
                <th class="ps-4" style="width: 120px;">ID</th>
                <th>Tên thương hiệu</th>
                <th class="text-center" style="width: 180px;">Trạng thái</th>
                <th class="text-center pe-4" style="width: 140px;">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <!-- Khi không có dữ liệu -->
              <tr v-if="filteredBrands.length === 0">
                <td colspan="4" class="text-center py-5 text-muted">
                  <div class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-secondary mb-2">
                      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
                    </svg>
                    <p class="mb-0 fw-semibold">
                      {{ searchQuery ? 'Không tìm thấy kết quả nào phù hợp.' : 'Chưa có thương hiệu nào trong hệ thống.' }}
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Lặp qua danh sách thương hiệu đã lọc -->
              <tr v-for="brand in filteredBrands" :key="brand.id">
                <td class="ps-4 fw-bold text-secondary">
                  #{{ brand.id }}
                </td>
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
                  <div class="d-inline-flex gap-2">
                    <!-- Nút Sửa -->
                    <button
                      class="btn-row-action btn-row-edit"
                      @click="openEditForm(brand)"
                      title="Chỉnh sửa"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                        <path d="m15 5 4 4"></path>
                      </svg>
                    </button>

                    <!-- Nút Khóa / Mở -->
                    <button
                      class="btn-row-action"
                      :class="brand.status === 1 ? 'btn-row-lock' : 'btn-row-unlock'"
                      :title="brand.status === 1 ? 'Khóa thương hiệu' : 'Mở khóa thương hiệu'"
                      @click="changeStatus(brand.id)"
                    >
                      <svg v-if="brand.status === 1" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
    <!-- MÀN HÌNH 2: FORM THÊM / SỬA (GỌN GÀNG, SANG TRỌNG)    -->
    <!-- ================================================= -->
    <div v-else class="form-view-container">
      <div class="d-flex align-items-center gap-3 mb-4">
        <button class="btn-back" @click="goBackToList">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Quay lại danh sách</span>
        </button>
        <div>
          <div class="brand-tag">{{ editingId === null ? 'CREATE' : 'UPDATE' }}</div>
          <h2 class="page-title mb-0">
            {{ editingId === null ? 'Thêm Thương Hiệu Mới' : 'Cập Nhật Thương Hiệu' }}
          </h2>
        </div>
      </div>

      <div class="card-box shadow-sm form-card">
        <div class="card-box-body p-4 p-md-5">
          <div v-if="message" class="alert alert-warning border-0 rounded-3 small py-2 mb-4">
            {{ message }}
          </div>

          <div class="mb-4">
            <label class="form-label tech-label">
              Tên thương hiệu <span class="text-danger">*</span>
            </label>
            <input
              v-model="name"
              type="text"
              class="tech-input form-control-lg"
              placeholder="Ví dụ: ASUS ROG, Apple, Sony, Logitech..."
              @keyup.enter="editingId === null ? createBrand() : updateBrand()"
              autofocus
            />
            <span class="input-hint">Nhấn phím Enter để lưu nhanh</span>
          </div>

          <div class="d-flex justify-content-end gap-3 mt-4 pt-2 border-top">
            <button class="btn-cancel-tech" @click="goBackToList">
              Hủy bỏ
            </button>
            <button
              class="btn-primary-tech px-4"
              @click="editingId === null ? createBrand() : updateBrand()"
            >
              {{ editingId === null ? 'Lưu thương hiệu' : 'Cập nhật thay đổi' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";

const brands = ref([]);
const name = ref("");
const editingId = ref(null);
const message = ref("");
const currentView = ref('list');
const searchQuery = ref("");

const token = localStorage.getItem("token");
const config = {
  headers: {
    Authorization: `Bearer ${token}`
  }
};

// Hàm tính toán danh sách đã lọc (Lọc theo Tên hoặc ID)
const filteredBrands = computed(() => {
  if (!searchQuery.value) return brands.value;
  
  const lowerCaseQuery = searchQuery.value.toLowerCase().trim();
  return brands.value.filter(brand => 
    brand.name.toLowerCase().includes(lowerCaseQuery) || 
    brand.id.toString().includes(lowerCaseQuery)    
  );
});

const getBrands = async () => {
  try {
    const response = await axios.get(
      "http://localhost:3000/api/admin/brands",
      config
    );
    brands.value = response.data;
  } catch (error) {
    message.value = error.response?.data?.message || "Không thể lấy danh sách thương hiệu";
  }
};

const openCreateForm = () => {
  name.value = "";
  editingId.value = null;
  message.value = "";
  currentView.value = 'form';
};

const openEditForm = (brand) => {
  editingId.value = brand.id;
  name.value = brand.name;
  message.value = "";
  currentView.value = 'form';
};

const goBackToList = () => {
  currentView.value = 'list';
  name.value = "";
  editingId.value = null;
  message.value = "";
};

const goBackPage = () => {
  window.history.back(); 
};

const createBrand = async () => {
  try {
    if (!name.value.trim()) {
      message.value = "Vui lòng nhập tên thương hiệu";
      return;
    }
    const response = await axios.post(
      "http://localhost:3000/api/admin/brands",
      { name: name.value.trim() },
      config
    );
    message.value = response.data.message || "Thêm thành công!";
    getBrands();
    goBackToList();
  } catch (error) {
    message.value = error.response?.data?.message || "Không thể thêm thương hiệu";
  }
};

const updateBrand = async () => {
  try {
    if (!name.value.trim()) {
      message.value = "Vui lòng nhập tên thương hiệu";
      return;
    }
    const response = await axios.put(
      `http://localhost:3000/api/admin/brands/${editingId.value}`,
      { name: name.value.trim() },
      config
    );
    message.value = response.data.message || "Cập nhật thành công!";
    getBrands();
    goBackToList();
  } catch (error) {
    message.value = error.response?.data?.message || "Không thể cập nhật thương hiệu";
  }
};

const changeStatus = async (id) => {
  try {
    const response = await axios.patch(
      `http://localhost:3000/api/admin/brands/${id}/status`,
      {},
      config
    );
    message.value = response.data.message;
    getBrands();
  } catch (error) {
    message.value = error.response?.data?.message || "Không thể cập nhật trạng thái";
  }
};

onMounted(() => {
  getBrands();
});
</script>

<style scoped>
/* Toàn màn hình full width với background tech */
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

/* Banner thông báo */
.alert-banner {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  color: #0369a1;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
}
.btn-close-msg {
  background: transparent;
  border: none;
  color: #0369a1;
  cursor: pointer;
  font-size: 0.9rem;
}

/* Card bao quanh bảng và form */
.card-box {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
}

/* Thanh tìm kiếm bảng */
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
  max-width: 380px;
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
  padding: 6px 12px;
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
.status-active .status-indicator { background-color: #10b981; }

.status-locked {
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}
.status-locked .status-indicator { background-color: #ef4444; }

/* Nút thao tác trên dòng */
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
.form-view-container {
  max-width: 700px;
  margin: 0 auto;
}

.tech-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
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
}
.tech-input:focus {
  background-color: #ffffff;
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
}

.input-hint {
  display: block;
  font-size: 0.775rem;
  color: #94a3b8;
  margin-top: 6px;
}

.btn-cancel-tech {
  padding: 10px 18px;
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
  padding: 10px 22px;
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
}
</style>