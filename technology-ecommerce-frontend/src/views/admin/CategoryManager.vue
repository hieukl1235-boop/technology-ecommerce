<template>
  <div class="category-page-wrapper">
    <!-- Header: Nút quay lại & Tiêu đề -->
    <div class="d-flex align-items-center gap-3 mb-4">
      <button class="btn-back" @click="$router.back()" title="Quay lại">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Quay lại</span>
      </button>
      <div>
        <div class="brand-tag">PRODUCT CATEGORIES</div>
        <h2 class="page-title mb-0">Quản Lý Danh Mục</h2>
      </div>
    </div>

    <!-- Thông báo nếu có -->
    <div v-if="message" class="alert-banner mb-3 shadow-sm">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
      <span>{{ message }}</span>
      <button class="btn-close-msg ms-auto" @click="message = ''">✕</button>
    </div>

    <!-- BỐ CỤC 2 CỘT -->
    <div class="row g-4">
      <!-- CỘT 1: FORM THÊM / SỬA -->
      <div class="col-lg-4 col-md-5">
        <div class="card-box shadow-sm sticky-form">
          <div class="card-box-header">
            <span class="header-icon">
              {{ editingId !== null ? '✏️' : '➕' }}
            </span>
            <h5 class="mb-0 fw-bold text-dark">
              {{ editingId !== null ? 'Cập nhật danh mục' : 'Thêm danh mục mới' }}
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
                @keyup.enter="editingId === null ? createCategory() : updateCategory()"
              />
              <span class="input-hint">Nhấn Enter để lưu nhanh</span>
            </div>

            <div class="action-buttons">
              <!-- Nút Thêm -->
              <button
                v-if="editingId === null"
                class="btn-primary-tech"
                @click="createCategory"
              >
                + Thêm danh mục
              </button>

              <!-- Cụm nút khi đang Sửa -->
              <template v-else>
                <button class="btn-primary-tech" @click="updateCategory">
                  Lưu thay đổi
                </button>
                <button class="btn-cancel-tech" @click="cancelEdit">
                  Hủy bỏ
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- CỘT 2: BẢNG DANH SÁCH -->
      <div class="col-lg-8 col-md-7">
        <div class="card-box shadow-sm">
          <div class="card-box-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0 fw-bold text-dark">Danh sách danh mục hiện có</h5>
            <span class="count-badge">Tổng: {{ categories.length }}</span>
          </div>

          <div class="table-responsive">
            <table class="table custom-table align-middle mb-0">
              <thead>
                <tr>
                  <th class="ps-4" style="width: 80px">ID</th>
                  <th>Tên danh mục</th>
                  <th class="text-center" style="width: 160px">Trạng thái</th>
                  <th class="text-center pe-4" style="width: 140px">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <!-- Trống -->
                <tr v-if="categories.length === 0">
                  <td colspan="4" class="text-center py-5 text-muted">
                    Chưa có danh mục nào.
                  </td>
                </tr>

                <!-- Danh sách -->
                <tr v-for="category in categories" :key="category.id">
                  <td class="ps-4 fw-bold text-secondary">
                    #{{ category.id }}
                  </td>

                  <td>
                    <span class="category-name">{{ category.name }}</span>
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
                    <div class="d-inline-flex gap-2">
                      <!-- Nút Sửa -->
                      <button
                        class="btn-row-action btn-row-edit"
                        title="Chỉnh sửa"
                        @click="editCategory(category)"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                          <path d="m15 5 4 4"></path>
                        </svg>
                      </button>

                      <!-- Nút Khóa / Mở -->
                      <button
                        class="btn-row-action"
                        :class="category.status === 1 ? 'btn-row-lock' : 'btn-row-unlock'"
                        :title="category.status === 1 ? 'Khóa danh mục' : 'Mở khóa danh mục'"
                        @click="changeStatus(category.id)"
                      >
                        <svg v-if="category.status === 1" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

// ========================================
// DỮ LIỆU & TOKEN (GIỮ NGUYÊN 100%)
// ========================================
const categories = ref([]);
const name = ref("");
const editingId = ref(null);
const message = ref("");

const token = localStorage.getItem("token");
const config = {
  headers: {
    Authorization: `Bearer ${token}`
  }
};

// ========================================
// HÀM XỬ LÝ (GIỮ NGUYÊN 100%)
// ========================================
const getCategories = async () => {
  try {
    const response = await axios.get(
      "http://localhost:3000/api/admin/categories",
      config
    );
    categories.value = response.data;
  } catch (error) {
    message.value =
      error.response?.data?.message || "Không thể lấy danh sách danh mục";
  }
};

const createCategory = async () => {
  try {
    if (!name.value.trim()) {
      message.value = "Vui lòng nhập tên danh mục";
      return;
    }

    const response = await axios.post(
      "http://localhost:3000/api/admin/categories",
      { name: name.value.trim() },
      config
    );

    message.value = response.data.message;
    name.value = "";
    getCategories();
  } catch (error) {
    message.value =
      error.response?.data?.message || "Không thể thêm danh mục";
  }
};

const editCategory = (category) => {
  editingId.value = category.id;
  name.value = category.name;
};

const updateCategory = async () => {
  try {
    if (!name.value.trim()) {
      message.value = "Vui lòng nhập tên danh mục";
      return;
    }

    const response = await axios.put(
      `http://localhost:3000/api/admin/categories/${editingId.value}`,
      { name: name.value.trim() },
      config
    );

    message.value = response.data.message;
    name.value = "";
    editingId.value = null;
    getCategories();
  } catch (error) {
    message.value =
      error.response?.data?.message || "Không thể cập nhật danh mục";
  }
};

const cancelEdit = () => {
  name.value = "";
  editingId.value = null;
  message.value = "";
};

const changeStatus = async (id) => {
  try {
    const response = await axios.patch(
      `http://localhost:3000/api/admin/categories/${id}/status`,
      {},
      config
    );

    message.value = response.data.message;
    getCategories();
  } catch (error) {
    message.value =
      error.response?.data?.message || "Không thể cập nhật trạng thái";
  }
};

onMounted(() => {
  getCategories();
});
</script>

<style scoped>
/* Bao phủ full màn hình */
.category-page-wrapper {
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

/* Thẻ khung bao */
.card-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
}

.card-box-header {
  padding: 18px 24px;
  border-bottom: 1px solid #f1f5f9;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-box-body {
  padding: 24px;
}

.sticky-form {
  position: sticky;
  top: 30px;
}

.tech-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
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
}
.tech-input:focus {
  background-color: #ffffff;
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
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
}
.btn-primary-tech:hover {
  background: linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%);
  transform: translateY(-1px);
}

.btn-cancel-tech {
  padding: 10px 16px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.btn-cancel-tech:hover {
  background: #f1f5f9;
}

.count-badge {
  font-size: 0.775rem;
  font-weight: 700;
  color: #0284c7;
  background: #f0f9ff;
  padding: 4px 10px;
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

.custom-table tbody td {
  padding: 14px 12px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.category-name {
  font-weight: 700;
  color: #0f172a;
  font-size: 0.95rem;
}

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
</style>