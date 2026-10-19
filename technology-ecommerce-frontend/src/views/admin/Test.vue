<template>
  <div class="supplier-page-wrapper">
    <!-- ================================================= -->
    <!-- MÀN HÌNH 1: DANH SÁCH NHÀ CUNG CẤP                -->
    <!-- ================================================= -->
    <div v-if="!showForm">
      <!-- Header: Tiêu đề & Nút thao tác -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div class="d-flex align-items-center gap-3">
          <button class="btn-back" @click="$router.back()" title="Quay lại">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Quay lại</span>
          </button>
          <div>
            <div class="brand-tag">SUPPLY CHAIN & PARTNERS</div>
            <h2 class="page-title mb-0">Quản Lý Nhà Cung Cấp</h2>
          </div>
        </div>

        <button class="btn-add-tech" @click="openAddForm">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-1">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Thêm nhà cung cấp mới</span>
        </button>
      </div>

      <!-- Card Bảng Dữ Liệu -->
      <div class="card-box shadow-sm">
        <div class="card-box-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0 fw-bold text-dark">Danh sách đối tác cung ứng</h5>
          <span class="count-badge">Tổng: {{ suppliers.length }} nhà cung cấp</span>
        </div>

        <div class="table-responsive">
          <table class="table custom-table align-middle mb-0">
            <thead>
              <tr>
                <th class="ps-4" style="width: 80px">ID</th>
                <th style="width: 20%">Tên nhà cung cấp</th>
                <th style="width: 15%">Người đại diện</th>
                <th style="width: 20%">Thông tin liên hệ</th>
                <th style="width: 20%">Địa chỉ</th>
                <th class="text-center" style="width: 140px">Trạng thái</th>
                <th class="text-center pe-4" style="width: 120px">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <!-- Khi không có dữ liệu -->
              <tr v-if="suppliers.length === 0">
                <td colspan="7" class="text-center py-5 text-muted">
                  <div class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-secondary mb-2">
                      <rect width="20" height="14" x="2" y="7" rx="2" ry="2"></rect>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                    <p class="mb-0 fw-semibold">Chưa có nhà cung cấp nào trong hệ thống.</p>
                  </div>
                </td>
              </tr>

              <!-- Lặp danh sách nhà cung cấp -->
              <tr v-for="supplier in suppliers" :key="supplier.id">
                <td class="ps-4 fw-bold text-secondary">
                  #{{ supplier.id }}
                </td>

                <td>
                  <span class="supplier-name">{{ supplier.name }}</span>
                </td>

                <td>
                  <span class="rep-name">
                    {{ supplier.representative || '---' }}
                  </span>
                </td>

                <!-- Liên hệ: SĐT & Email gộp tinh tế -->
                <td>
                  <div class="contact-box">
                    <span v-if="supplier.phone" class="phone-link">
                      📞 {{ supplier.phone }}
                    </span>
                    <span v-if="supplier.email" class="email-link">
                      ✉️ {{ supplier.email }}
                    </span>
                    <span v-if="!supplier.phone && !supplier.email" class="text-muted small">---</span>
                  </div>
                </td>

                <td>
                  <span class="address-text" :title="supplier.address">
                    {{ supplier.address || '---' }}
                  </span>
                </td>

                <!-- Trạng thái -->
                <td class="text-center">
                  <span 
                    class="status-pill"
                    :class="supplier.status === 1 ? 'status-active' : 'status-locked'"
                  >
                    <span class="status-indicator"></span>
                    {{ supplier.status === 1 ? 'Đang hoạt động' : 'Đã khóa' }}
                  </span>
                </td>

                <!-- Thao tác -->
                <td class="text-center pe-4">
                  <div class="d-inline-flex gap-2">
                    <button
                      class="btn-row-action btn-row-edit"
                      @click="openEditForm(supplier)"
                      title="Chỉnh sửa thông tin"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                        <path d="m15 5 4 4"></path>
                      </svg>
                    </button>

                    <button
                      class="btn-row-action"
                      :class="supplier.status === 1 ? 'btn-row-lock' : 'btn-row-unlock'"
                      @click="toggleStatus(supplier.id, supplier.status)"
                      :title="supplier.status === 1 ? 'Khóa nhà cung cấp' : 'Mở khóa'"
                    >
                      <svg v-if="supplier.status === 1" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
    <!-- MÀN HÌNH 2: FORM THÊM / SỬA NHÀ CUNG CẤP         -->
    <!-- ================================================= -->
    <div v-else class="form-wrapper-view">
      <div class="d-flex align-items-center gap-3 mb-4">
        <button class="btn-back" @click="closeForm">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Quay lại danh sách</span>
        </button>
        <div>
          <div class="brand-tag">{{ isEdit ? 'UPDATE PARTNER' : 'NEW PARTNER' }}</div>
          <h2 class="page-title mb-0">
            {{ isEdit ? 'Cập Nhật Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp Mới' }}
          </h2>
        </div>
      </div>

      <div class="card-box shadow-sm mb-4">
        <form @submit.prevent="saveSupplier" class="p-4 p-md-5">
          <!-- PHẦN 1: THÔNG TIN DOANH NGHIỆP -->
          <div class="tech-section-title">
            <span>01. THÔNG TIN DOANH NGHIỆP / ĐỐI TÁC</span>
          </div>

          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label class="form-label tech-label">
                Tên nhà cung cấp <span class="text-danger">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                class="tech-input"
                placeholder="Ví dụ: Công ty TNHH Phân Phối Synnex FPT"
                required
              />
            </div>

            <div class="col-md-6">
              <label class="form-label tech-label">Người đại diện liên hệ</label>
              <input
                v-model="form.representative"
                type="text"
                class="tech-input"
                placeholder="Ví dụ: Nguyễn Văn Quản Lý"
              />
            </div>

            <div class="col-md-6">
              <label class="form-label tech-label">Số điện thoại</label>
              <input
                v-model="form.phone"
                type="text"
                class="tech-input"
                placeholder="Ví dụ: 0988 123 456"
              />
            </div>

            <div class="col-md-6">
              <label class="form-label tech-label">Email liên hệ</label>
              <input
                v-model="form.email"
                type="email"
                class="tech-input"
                placeholder="contact@synnex.com.vn"
              />
            </div>

            <div class="col-12">
              <label class="form-label tech-label">Địa chỉ trụ sở / Kho hàng</label>
              <textarea
                v-model="form.address"
                rows="2"
                class="tech-input"
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
              ></textarea>
            </div>
          </div>

          <!-- PHẦN 2: CHỌN BIẾN THỂ CUNG ỨNG -->
          <div class="tech-section-title mt-4 pt-3 border-top d-flex justify-content-between align-items-center">
            <span>02. BIẾN THỂ DO NHÀ CUNG CẤP CUNG CẤP</span>
            <span class="count-badge">Đã chọn: {{ form.variant_ids.length }} biến thể</span>
          </div>

          <p class="text-muted small mb-3">
            Tích chọn những biến thể linh kiện/sản phẩm mà đối tác này cung ứng cho cửa hàng:
          </p>

          <div v-if="variants.length === 0" class="text-muted fst-italic p-3 bg-light rounded">
            Chưa có biến thể sản phẩm nào trên hệ thống.
          </div>

          <!-- Lưới chọn Biến thể dạng Card cao cấp -->
          <div class="variant-select-grid">
            <label
              v-for="variant in variants"
              :key="variant.id"
              class="variant-select-card"
              :class="{ 'card-selected': form.variant_ids.includes(variant.id) }"
            >
              <input
                type="checkbox"
                :value="variant.id"
                v-model="form.variant_ids"
                class="d-none"
              />

              <!-- Checkmark icon khi được chọn -->
              <div class="checkbox-indicator">
                <svg v-if="form.variant_ids.includes(variant.id)" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>

              <!-- Ảnh biến thể -->
              <img
                :src="`http://localhost:3000/uploads/variants/${variant.image_url}`"
                alt="Ảnh biến thể"
                class="variant-img"
              />

              <!-- Thông tin biến thể -->
              <div class="variant-details">
                <span class="var-name" :title="variant.name">{{ variant.name }}</span>
                <span class="var-sku">SKU: {{ variant.sku || 'N/A' }}</span>
              </div>
            </label>
          </div>

          <!-- FOOTER NÚT BẤM -->
          <div class="d-flex justify-content-end gap-3 mt-5 pt-3 border-top">
            <button type="button" class="btn-cancel-tech" @click="closeForm">
              Hủy bỏ
            </button>
            <button type="submit" class="btn-primary-tech px-4">
              {{ isEdit ? 'Lưu thay đổi nhà cung cấp' : 'Xác nhận thêm nhà cung cấp' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'

const suppliers = ref([])
const variants = ref([])
const showForm = ref(false)
const isEdit = ref(false)

const form = reactive({
  id: null,
  name: '',
  representative: '',
  phone: '',
  email: '',
  address: '',
  variant_ids: [],
})

onMounted(() => {
  fetchSuppliers()
  fetchVariants()
})
const token = localStorage.getItem('token') // Lấy token từ localStorage

const fetchSuppliers = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/admin/suppliers'
      , {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    suppliers.value = response.data
  } catch (error) {
    console.error('Lỗi lấy danh sách nhà cung cấp:', error)
  }
}

const fetchVariants = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/admin/products/variants', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    variants.value = response.data
  } catch (error) {
    console.error('Lỗi lấy danh sách biến thể:', error)
  }
}

const openAddForm = () => {
  isEdit.value = false
  showForm.value = true
  form.id = null
  form.name = ''
  form.representative = ''
  form.phone = ''
  form.email = ''
  form.address = ''
  form.variant_ids = []
}

const openEditForm = async (supplier) => {
  isEdit.value = true
  showForm.value = true
  form.id = supplier.id
  form.name = supplier.name
  form.representative = supplier.representative || ''
  form.phone = supplier.phone || ''
  form.email = supplier.email || ''
  form.address = supplier.address || ''
  form.variant_ids = supplier.variant_ids || []
}

const closeForm = () => {
  showForm.value = false
}

const saveSupplier = async () => {
  try {
    let supplierId

    if (!isEdit.value) {
      const response = await axios.post('http://localhost:3000/api/admin/suppliers', {
        name: form.name,
        representative: form.representative,
        phone: form.phone,
        email: form.email,
        address: form.address,
        variant_ids: form.variant_ids,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
      )
      supplierId = response.data.id
    } else {
      await axios.put(`http://localhost:3000/api/admin/suppliers/${form.id}`, {
        name: form.name,
        representative: form.representative,
        phone: form.phone,
        email: form.email,
        address: form.address,
        variant_ids: form.variant_ids,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
      )
      supplierId = form.id
    }

    alert(isEdit.value ? 'Cập nhật nhà cung cấp thành công' : 'Thêm nhà cung cấp thành công')
    showForm.value = false
    await fetchSuppliers()
  } catch (error) {
    console.error('Lỗi lưu nhà cung cấp:', error)
    alert(error.response?.data?.message || 'Có lỗi xảy ra')
  }
}

const toggleStatus = async (id, currentStatus) => {
  const newStatus = currentStatus === 1 ? 0 : 1
  const message =
    currentStatus === 1 ? 'Bạn muốn khóa nhà cung cấp này?' : 'Bạn muốn mở nhà cung cấp này?'

  if (!confirm(message)) return

  try {
    await axios.patch(`http://localhost:3000/api/admin/suppliers/${id}/status`, {
      status: newStatus,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
    )
    await fetchSuppliers()
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái:', error)
  }
}
</script>

<style scoped>
/* Tràn full toàn màn hình máy tính với background tech */
.supplier-page-wrapper {
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

/* Card Box */
.card-box {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
}

.card-box-header {
  padding: 18px 24px;
  border-bottom: 1px solid #f1f5f9;
  background-color: #ffffff;
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

.supplier-name {
  font-weight: 700;
  color: #0f172a;
  font-size: 0.95rem;
}

.rep-name {
  color: #334155;
  font-weight: 500;
  font-size: 0.9rem;
}

.contact-box {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 0.825rem;
}
.phone-link {
  color: #0284c7;
  font-weight: 600;
}
.email-link {
  color: #64748b;
}

.address-text {
  display: block;
  max-width: 250px;
  font-size: 0.85rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  max-width: 950px;
  margin: 0 auto;
}

.tech-section-title {
  font-size: 0.8rem;
  font-weight: 800;
  color: #0284c7;
  letter-spacing: 0.06em;
  margin-bottom: 16px;
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

/* Lưới chọn Biến thể dạng Card */
.variant-select-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  max-height: 380px;
  overflow-y: auto;
  padding: 4px;
}

.variant-select-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  position: relative;
}

.variant-select-card:hover {
  background: #ffffff;
  border-color: #93c5fd;
}

.card-selected {
  background: #ffffff;
  border-color: #0284c7 !important;
  box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.2);
}

.checkbox-indicator {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 2px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  flex-shrink: 0;
  color: #ffffff;
}

.card-selected .checkbox-indicator {
  background: #0284c7;
  border-color: #0284c7;
}

.variant-img {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  flex-shrink: 0;
}

.variant-details {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.var-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.var-sku {
  font-size: 0.75rem;
  color: #0284c7;
  font-weight: 600;
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