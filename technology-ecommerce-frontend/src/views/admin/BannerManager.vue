<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const banners = ref([])
const isEditing = ref(false) // Biến cờ kiểm tra đang ở chế độ Thêm mới hay Sửa
const editId = ref(null)    // Lưu ID của banner đang được sửa

const form = ref({
  title: '',
  description: '',
  image: null,
  status: 1
})

const fetchAdminBanners = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/admin/banners/all')
    banners.value = res.data.data
  } catch (err) {
    console.error('Lỗi tải banner admin:', err)
  }
}

const handleFileUpload = (e) => {
  form.value.image = e.target.files[0]
}

// Xém form về trạng thái Thêm mới
const resetForm = () => {
  form.value = { title: '', description: '', image: null, status: 1 }
  isEditing.value = false
  editId.value = null
  // Reset input file (nếu có)
  const fileInput = document.querySelector('input[type="file"]')
  if (fileInput) fileInput.value = ''
}

// Đưa dữ liệu banner lên form khi bấm nút Sửa
const editBanner = (b) => {
  isEditing.value = true
  editId.value = b.id
  form.value.title = b.title || ''
  form.value.description = b.description || ''
  form.value.status = b.status
  form.value.image = null // Ảnh mới tùy chọn
}

// Xử lý chung cho Thêm mới hoặc Cập nhật
const saveBanner = async () => {
  try {
    const formData = new FormData()
    formData.append('title', form.value.title)
    formData.append('description', form.value.description)
    formData.append('status', form.value.status)
    if (form.value.image) {
      formData.append('image', form.value.image)
    }

    if (isEditing.value) {
      // Gọi API Sửa
      await axios.put(`http://localhost:3000/api/admin/banners/${editId.value}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      alert('Cập nhật banner thành công!')
    } else {
      // Gọi API Thêm mới
      await axios.post('http://localhost:3000/api/admin/banners', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      alert('Thêm banner thành công!')
    }

    fetchAdminBanners()
    resetForm()
  } catch (err) {
    alert(isEditing.value ? 'Cập nhật thất bại!' : 'Thêm banner thất bại!')
  }
}

// Đổi nhanh trạng thái Hiển thị / Ẩn
const toggleStatus = async (b) => {
  const newStatus = b.status === 1 ? 0 : 1
  try {
    await axios.patch(`http://localhost:3000/api/admin/banners/${b.id}/status`, {
      status: newStatus
    })
    b.status = newStatus // Cập nhật trực tiếp trên giao diện
  } catch (err) {
    alert('Thay đổi trạng thái thất bại!')
  }
}

const deleteBanner = async (id) => {
  if (confirm('Bạn có chắc muốn xóa banner này?')) {
    try {
      await axios.delete(`http://localhost:3000/api/admin/banners/${id}`)
      fetchAdminBanners()
    } catch (err) {
      alert('Xóa thất bại!')
    }
  }
}

onMounted(() => {
  fetchAdminBanners()
})
</script>

<template>
  <div style="padding: 20px;">
    <h2>Quản lý Banner Trang Chủ</h2>

    <!-- Form Thêm / Sửa -->
    <div style="background: #f9f9f9; padding: 15px; margin-bottom: 20px; border-radius: 6px;">
      <h3>{{ isEditing ? 'Cập Nhật Banner' : 'Thêm Banner Mới' }}</h3>
      
      <input type="text" v-model="form.title" placeholder="Tiêu đề banner" style="display: block; margin-bottom: 10px; padding: 6px; width: 300px;" />
      <textarea v-model="form.description" placeholder="Mô tả..." style="display: block; margin-bottom: 10px; padding: 6px; width: 300px;"></textarea>
      
      <div style="margin-bottom: 10px;">
        <label style="font-size: 13px; display: block; margin-bottom: 3px;">Chọn hình ảnh mới (nếu muốn thay đổi):</label>
        <input type="file" @change="handleFileUpload" />
      </div>

      <div style="display: flex; gap: 10px;">
        <button @click="saveBanner" style="padding: 8px 15px; background: #007bff; color: #fff; border: none; border-radius: 4px; cursor: pointer;">
          {{ isEditing ? 'Lưu thay đổi' : 'Tải lên Banner' }}
        </button>
        <button v-if="isEditing" @click="resetForm" style="padding: 8px 15px; background: #6c757d; color: #fff; border: none; border-radius: 4px; cursor: pointer;">
          Hủy
        </button>
      </div>
    </div>

    <!-- Bảng danh sách -->
    <table border="1" cellpadding="10" style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #eee;">
          <th>ID</th>
          <th>Hình ảnh</th>
          <th>Tiêu đề</th>
          <th>Mô tả</th>
          <th>Trạng thái</th>
          <th>Hành động</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="b in banners" :key="b.id">
          <td>{{ b.id }}</td>
          <td>
            <img v-if="b.image_url" :src="`http://localhost:3000/uploads/banners/${b.image_url}`" width="100" height="50" style="object-fit: cover;" />
          </td>
          <td>{{ b.title }}</td>
          <td>{{ b.description }}</td>
          <td>
            <!-- Nút bấm đổi trạng thái nhanh -->
            <button 
              @click="toggleStatus(b)" 
              :style="{ background: b.status === 1 ? '#28a745' : '#ffc107', color: b.status === 1 ? '#fff' : '#000', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }"
            >
              {{ b.status === 1 ? 'Hiển thị' : 'Đã ẩn' }}
            </button>
          </td>
          <td>
            <button @click="editBanner(b)" style="background: #ffc107; color: black; border: none; padding: 5px 10px; cursor: pointer; margin-right: 5px; border-radius: 4px;">Sửa</button>
            <button @click="deleteBanner(b.id)" style="background: red; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px;">Xóa</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>