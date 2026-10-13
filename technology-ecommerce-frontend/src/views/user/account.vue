<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

// Các trường thông tin người dùng theo yêu cầu
const fullName = ref('')
const email = ref('')
const password = ref('')
const dateOfBirth = ref('')
const gender = ref('')
const status = ref('')
const isLoading = ref(false)

// Lấy thông tin tài khoản hiện tại từ Backend
const fetchedUserData = async () => {
  try {
    isLoading.value = true
    const token = localStorage.getItem('token')
    const response = await axios.get('http://localhost:3000/api/user/account/profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    const user = response.data.user
    fullName.value = user.full_name || ''
    email.value = user.email || ''
    dateOfBirth.value = user.date_of_birth ? user.date_of_birth.split('T')[0] : ''
    gender.value = user.gender !== undefined && user.gender !== null ? String(user.gender) : ''
    status.value = user.status || ''
  } catch (error) {
    console.error('Lỗi tải dữ liệu người dùng:', error)
  } finally {
    isLoading.value = false
  }
}

// Xử lý quay lại trang trước
const handleBack = () => {
  window.history.back()
}

const handleLogout = () => {
  if (confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }
}

onMounted(() => {
  fetchedUserData()
})

// Hàm xử lý khi submit form cập nhật thông tin
const handleSubmit = async () => {
  const formData = {
    full_name: fullName.value,
    date_of_birth: dateOfBirth.value,
    gender: gender.value,
    status: status.value
  }

  try {
    const token = localStorage.getItem('token')
    await axios.post('http://localhost:3000/api/user/account/profile', formData, {
      headers: { Authorization: `Bearer ${token}` }
    })
    alert('Cập nhật thông tin thành công!')
  } catch (error) {
    console.error('Lỗi cập nhật:', error)
    alert('Cập nhật thất bại!')
  }
}
</script>

<template>
  <div class="account-wrapper">
    <div class="account-card">
      <!-- Header với Nút Quay lại -->
      <div class="card-header">
        <button @click="handleBack" class="btn-back" title="Quay lại">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Quay lại
        </button>
        <h2>Thông tin tài khoản</h2>
      </div>

      <!-- Trạng thái Loading -->
      <div v-if="isLoading" class="loading-state">
        Đang tải dữ liệu...
      </div>

      <form v-else @submit.prevent="handleSubmit" class="account-form">
        <!-- Họ tên -->
        <div class="form-group">
          <label for="full_name">Họ và tên</label>
          <input type="text" id="full_name" v-model="fullName" placeholder="Nhập họ tên của bạn" />
        </div>

        <!-- Email -->
        <div class="form-group">
          <label for="email">Email <span class="badge-disabled">(Không thể đổi)</span></label>
          <input type="email" id="email" v-model="email" disabled placeholder="Email của bạn" />
        </div>

        <!-- Ngày sinh -->
        <div class="form-group">
          <label for="date_of_birth">Ngày sinh</label>
          <input type="date" id="date_of_birth" v-model="dateOfBirth" />
        </div>

        <!-- Giới tính -->
        <div class="form-group">
          <label for="gender">Giới tính</label>
          <select id="gender" v-model="gender">
            <option value="" disabled>-- Chọn giới tính --</option>
            <option value="1">Nam</option>
            <option value="0">Nữ</option>
          </select>
        </div>

        <!-- 🟢 Nút router-link chuyển sang trang lịch sử đơn hàng riêng biệt -->
        <div class="form-group mb-3">
          <router-link to="/user/orders" class="btn-orders-link text-decoration-none text-center d-block">
            📦 Xem lịch sử đơn hàng đã đặt
          </router-link>
        </div>

        <!-- Nhóm nút hành động -->
        <div class="form-actions">
          <button type="submit" class="btn-primary">Cập nhật thông tin</button>
          <button type="button" @click="handleLogout" class="btn-danger">Đăng xuất</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.account-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f4f6f8;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  padding: 20px;
}

.account-card {
  width: 100%;
  max-width: 550px;
  background: #ffffff;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 25px;
  position: relative;
}

.card-header h2 {
  flex: 1;
  text-align: center;
  margin: 0;
  font-size: 22px;
  color: #333;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 5px;
  background: transparent;
  border: 1px solid #dcdfe6;
  color: #606266;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  position: absolute;
  left: 0;
}

.btn-back:hover {
  background-color: #f5f7fa;
  color: #409eff;
  border-color: #c0c4cc;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 14px;
  color: #34495e;
}

.badge-disabled {
  font-weight: normal;
  font-size: 12px;
  color: #909399;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}

.form-group input:disabled {
  background-color: #f5f7fa;
  color: #c0c4cc;
  cursor: not-allowed;
}

.btn-orders-link {
  width: 100%;
  padding: 10px;
  background-color: #ecf5ff;
  border: 1px solid #b3d8ff;
  color: #409eff;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
  box-sizing: border-box;
}

.btn-orders-link:hover {
  background-color: #409eff;
  color: white;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 30px;
}

.btn-primary {
  flex: 2;
  padding: 12px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #66b1ff;
}

.btn-danger {
  flex: 1;
  padding: 12px;
  background-color: #f56c6c;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-danger:hover {
  background-color: #f78989;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #909399;
  font-size: 15px;
}
</style>