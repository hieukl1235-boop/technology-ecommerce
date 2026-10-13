<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const API_URL = 'http://localhost:3000/api/admin/coupons'
const CATEGORY_API_URL = 'http://localhost:3000/api/admin/categories' // Đường dẫn API lấy danh mục của bạn

const coupons = ref([])
const categories = ref([]) // Danh sách loại sản phẩm / danh mục để hiển thị checkbox
const message = ref('')
const editingId = ref(null)

const form = ref({
  code: '',
  name: '',
  discount_type: 1,
  discount_value: 10,
  max_discount: '',
  quantity: 100,
  start_date: '',
  end_date: '',
  category_ids: [], // Mảng chứa ID các danh mục được chọn
})

// Lấy token nhân viên
const getConfig = () => {
  return {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  }
}

// 1. Lấy danh sách mã giảm giá
const getAllCoupons = async () => {
  try {
    const response = await axios.get(API_URL, getConfig())
    coupons.value = response.data
  } catch (error) {
    message.value = error.response?.data?.message || 'Lỗi lấy danh sách mã giảm giá'
  }
}

// 2. Lấy danh sách danh mục (loại sản phẩm) để hiển thị lên form
const getAllCategories = async () => {
  try {
    const response = await axios.get(CATEGORY_API_URL, getConfig())
    categories.value = response.data
  } catch (error) {
    console.error('Lỗi lấy danh mục sản phẩm', error)
  }
}

// Định dạng ngày để đưa vào input datetime-local
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hour}:${minute}`
}

// Tạo mã giảm giá
const createCoupon = async () => {
  try {
    await axios.post(API_URL, form.value, getConfig())
    message.value = 'Tạo mã giảm giá thành công'
    resetForm()
    await getAllCoupons()
  } catch (error) {
    message.value = error.response?.data?.message || 'Lỗi tạo mã giảm giá'
  }
}

// Đưa dữ liệu mã cần sửa lên form (kèm theo category_ids)
const editCoupon = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, getConfig())
    const coupon = response.data

    editingId.value = coupon.id

    form.value = {
      code: coupon.code,
      name: coupon.name,
      discount_type: coupon.discount_type,
      discount_value: Number(coupon.discount_value),
      max_discount: coupon.max_discount ?? '',
      quantity: coupon.quantity,
      start_date: formatDate(coupon.start_date),
      end_date: formatDate(coupon.end_date),
      category_ids: coupon.category_ids.map((id) => Number(id)),
    }

    // Debug: xem field thật của category, không bị rút gọn
    console.log('categories raw:', JSON.stringify(categories.value))
    console.log('form.category_ids:', form.value.category_ids)

    message.value = ''
  } catch (error) {
    message.value = error.response?.data?.message || 'Lỗi lấy thông tin mã giảm giá'
  }
}
// Cập nhật mã giảm giá
const updateCoupon = async () => {
  try {
    await axios.put(`${API_URL}/${editingId.value}`, form.value, getConfig())
    message.value = 'Cập nhật mã giảm giá thành công'
    resetForm()
    await getAllCoupons()
  } catch (error) {
    message.value = error.response?.data?.message || 'Lỗi cập nhật mã giảm giá'
  }
}

// Bật hoặc tắt mã giảm giá
const changeStatus = async (coupon) => {
  try {
    const newStatus = coupon.status === 1 ? 0 : 1
    await axios.patch(`${API_URL}/${coupon.id}/status`, { status: newStatus }, getConfig())
    message.value = 'Cập nhật trạng thái thành công'
    await getAllCoupons()
  } catch (error) {
    message.value = error.response?.data?.message || 'Lỗi cập nhật trạng thái'
  }
}

// Làm mới form
const resetForm = () => {
  editingId.value = null
  form.value = {
    code: '',
    name: '',
    discount_type: 1,
    discount_value: 10,
    max_discount: '',
    quantity: 100,
    start_date: '',
    end_date: '',
    category_ids: [],
  }
}

onMounted(() => {
  getAllCoupons()
  getAllCategories() // Tải danh mục khi trang vừa load
})
</script>

<template>
  <div>
    <h2>Quản lý mã giảm giá</h2>
    <p>{{ message }}</p>
    <hr />

    <h3>{{ editingId ? 'Cập nhật mã giảm giá' : 'Thêm mã giảm giá' }}</h3>

    <form @submit.prevent="editingId ? updateCoupon() : createCoupon()">
      <div>
        <label>Mã giảm giá:</label>
        <input v-model="form.code" required />
      </div>

      <div>
        <label>Tên chương trình:</label>
        <input v-model="form.name" required />
      </div>

      <!-- PHẦN CHỌN LOẠI SẢN PHẨM / DANH MỤC -->
      <div>
        <label><strong>Áp dụng cho loại sản phẩm (Danh mục):</strong></label>

        <div style="border: 1px solid #ccc; padding: 10px; max-height: 150px; overflow-y: auto">
          <div v-for="cat in categories" :key="cat.id" style="margin-bottom: 5px">
            <input
              type="checkbox"
              :id="'cat-' + cat.id"
              :value="Number(cat.id)"
              v-model="form.category_ids"
            />

            <label :for="'cat-' + cat.id" style="margin-left: 5px">
              {{ cat.name }}
            </label>
          </div>
        </div>
      </div>

      <div>
        <label>Loại giảm giá:</label>
        <select v-model.number="form.discount_type">
          <option :value="1">Giảm theo phần trăm</option>
          <option :value="2">Giảm số tiền cố định</option>
        </select>
      </div>

      <div>
        <label>
          {{ form.discount_type === 1 ? 'Phần trăm giảm (%)' : 'Số tiền giảm (VNĐ)' }}
        </label>
        <input type="number" v-model.number="form.discount_value" min="1" required />
      </div>

      <div v-if="form.discount_type === 1">
        <label>Mức giảm tối đa (VNĐ):</label>
        <input type="number" v-model="form.max_discount" min="1" />
      </div>

      <div>
        <label>Số lượt sử dụng:</label>
        <input type="number" v-model.number="form.quantity" min="1" required />
      </div>

      <div>
        <label>Ngày bắt đầu:</label>
        <input type="datetime-local" v-model="form.start_date" required />
      </div>

      <div>
        <label>Ngày kết thúc:</label>
        <input type="datetime-local" v-model="form.end_date" required />
      </div>

      <br />

      <button type="submit">
        {{ editingId ? 'Cập nhật' : 'Tạo mã' }}
      </button>

      <button v-if="editingId" type="button" @click="resetForm">Hủy sửa</button>
    </form>

    <hr />

    <h3>Danh sách mã giảm giá</h3>
    <button @click="getAllCoupons">Tải lại</button>

    <table border="1" cellpadding="8">
      <thead>
        <tr>
          <th>ID</th>
          <th>Mã</th>
          <th>Tên</th>
          <th>Loại</th>
          <th>Giá trị giảm</th>
          <th>Đã dùng / Tổng</th>
          <th>Ngày bắt đầu</th>
          <th>Ngày kết thúc</th>
          <th>Trạng thái</th>
          <th>Thao tác</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="coupon in coupons" :key="coupon.id">
          <td>{{ coupon.id }}</td>
          <td>{{ coupon.code }}</td>
          <td>{{ coupon.name }}</td>
          <td>{{ coupon.discount_type === 1 ? 'Phần trăm' : 'Tiền cố định' }}</td>
          <td>{{ coupon.discount_value }} {{ coupon.discount_type === 1 ? '%' : 'VNĐ' }}</td>
          <td>{{ coupon.used_quantity }} / {{ coupon.quantity }}</td>
          <td>{{ coupon.start_date }}</td>
          <td>{{ coupon.end_date }}</td>
          <td>{{ coupon.status === 1 ? 'Hoạt động' : 'Đã tắt' }}</td>
          <td>
            <button @click="editCoupon(coupon.id)">Sửa</button>
            <button @click="changeStatus(coupon)">
              {{ coupon.status === 1 ? 'Tắt' : 'Bật' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
