<template>
    <div class="profile-page">
        <div class="profile-container">

            <!-- Tiêu đề -->
            <div class="page-heading">
                <div>
                    <h2>Thông tin cá nhân</h2>
                    <p>Quản lý thông tin và tài khoản của bạn</p>
                </div>

                <button class="btn-back" @click="router.back()">
                    ← Quay lại
                </button>
            </div>

            <div class="profile-card">

                <!-- Ảnh đại diện -->
                <div class="avatar-section">
                    <div class="avatar-wrapper">
                        <img v-if="avatarPreview || avatarUrl" :src="avatarPreview || avatarUrl" alt="Avatar"
                            class="avatar-img" />

                        <div v-else class="avatar-fallback">
                            {{ getInitials(form.full_name) }}
                        </div>
                    </div>

                    <div class="avatar-info">
                        <h4>{{ form.full_name || 'Nhân viên' }}</h4>
                        <p>Ảnh đại diện tài khoản</p>

                        <div class="avatar-actions">
                            <button type="button" class="btn-change-avatar" @click="$refs.avatarInput.click()">
                                Chọn ảnh
                            </button>

                            <button v-if="avatarPreview" type="button" class="btn-remove-avatar"
                                @click="removeSelectedAvatar">
                                Hủy ảnh mới
                            </button>
                        </div>

                        <input ref="avatarInput" type="file" accept="image/*" hidden @change="handleAvatarChange" />
                    </div>
                </div>

                <div class="section-divider"></div>

                <!-- Form thông tin -->
                <form @submit.prevent="updateProfile">

                    <div class="form-heading">
                        <h4>Thông tin cơ bản</h4>
                        <span>Cập nhật thông tin cá nhân của bạn</span>
                    </div>

                    <div class="form-grid">

                        <!-- Họ tên -->
                        <div class="form-group">
                            <label>Họ và tên <span>*</span></label>
                            <input v-model.trim="form.full_name" type="text" placeholder="Nhập họ và tên" required />
                        </div>

                        <!-- Email -->
                        <div class="form-group">
                            <label>Email <span>*</span></label>
                            <input v-model.trim="form.email" type="email" placeholder="Nhập email" required />
                        </div>

                        <!-- Số điện thoại -->
                        <div class="form-group">
                            <label>Số điện thoại</label>
                            <input v-model.trim="form.phone" type="tel" placeholder="Nhập số điện thoại" />
                        </div>

                        <!-- Ngày sinh -->
                        <div class="form-group">
                            <label>Ngày sinh</label>
                            <input v-model="form.date_of_birth" type="date" />
                        </div>

                        <!-- Giới tính -->
                        <div class="form-group">
                            <label>Giới tính</label>
                            <select v-model="form.gender">
                                <option value="">Chọn giới tính</option>
                                <option value=1>Nam</option>
                                <option value=0>Nữ</option>
                              
                            </select>
                        </div>

                    </div>

                    <div class="section-divider"></div>

                    <!-- Thông tin tài khoản -->
                    <div class="form-heading">
                        <h4>Thông tin tài khoản</h4>
                        <span>Thông tin nhận diện tài khoản nhân viên</span>
                    </div>

                    <div class="form-grid">

                        <div class="form-group">
                            <label>Mã nhân viên</label>
                            <input :value="form.id" type="text" disabled />
                        </div>

                        <div class="form-group">
                            <label>Vai trò</label>
                            <input :value="form.role " type="text" disabled />
                        </div>

                    </div>

                    <!-- Nút cập nhật -->
                    <div class="form-footer">
                        <button type="button" class="btn-cancel" @click="router.back()">
                            Hủy
                        </button>

                        <button type="submit" class="btn-save" :disabled="isSubmitting || isLoading">
                            {{ isSubmitting ? 'Đang cập nhật...' : 'Lưu thay đổi' }}
                        </button>
                    </div>

                </form>
            </div>

        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const user = JSON.parse(localStorage.getItem('user') || '{}')
const employeeId = user?.id

const isLoading = ref(false)
const isSubmitting = ref(false)

const avatarInput = ref(null)
const avatarFile = ref(null)
const avatarPreview = ref(null)
const avatarUrl = ref('')

const form = reactive({
    id: '',
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    role: ''
})

const API_URL = 'http://localhost:3000/api/admin/employees'

const getConfig = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
    }
})

// Chuyển ngày về định dạng input date
const formatDate = (date) => {
    if (!date) return ''

    return String(date).slice(0, 10)
}

// Lấy chữ viết tắt
const getInitials = (name) => {
    if (!name) return 'AD'

    const parts = String(name).trim().split(/\s+/)

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase()
    }

    return (
        parts[0][0] + parts[parts.length - 1][0]
    ).toUpperCase()
}

// Tải thông tin nhân viên
const getInforEmployee = async () => {
    try {
        if (!employeeId) {
            alert('Không tìm thấy thông tin nhân viên')
            return
        }

        isLoading.value = true

        const response = await axios.get(
            `${API_URL}/${employeeId}`,
            getConfig()
        )

        // Điều chỉnh theo cấu trúc response thực tế của API
        const employee = response.data.employee || response.data

        Object.assign(form, {
            id: employee.id || '',
            full_name: employee.full_name || '',
            email: employee.email || '',
            phone: employee.phone || '',
            date_of_birth: formatDate(employee.date_of_birth),
            gender: employee.gender || '',
            role: employee.role || ''
        })

        avatarUrl.value = employee.avatar
            ? `http://localhost:3000/uploads/avatars/${employee.avatar}`
            : ''

    } catch (err) {
        console.error('Lỗi tải thông tin nhân viên:', err)
        alert('Không thể tải thông tin cá nhân')
    } finally {
        isLoading.value = false
    }
}

// Chọn ảnh đại diện
const handleAvatarChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file hình ảnh')
        event.target.value = ''
        return
    }

    if (file.size > 5 * 1024 * 1024) {
        alert('Ảnh không được vượt quá 5MB')
        event.target.value = ''
        return
    }

    if (avatarPreview.value) {
        URL.revokeObjectURL(avatarPreview.value)
    }

    avatarFile.value = file
    avatarPreview.value = URL.createObjectURL(file)
}

// Hủy ảnh vừa chọn
const removeSelectedAvatar = () => {
    if (avatarPreview.value) {
        URL.revokeObjectURL(avatarPreview.value)
    }

    avatarPreview.value = null
    avatarFile.value = null

    if (avatarInput.value) {
        avatarInput.value.value = ''
    }
}

// Cập nhật thông tin
const updateProfile = async () => {
    try {
        if (!employeeId) return

        isSubmitting.value = true

        const formData = new FormData()

        formData.append('full_name', form.full_name)
        formData.append('email', form.email)
        formData.append('phone', form.phone)
        formData.append('date_of_birth', form.date_of_birth)
        formData.append('gender', form.gender)

        if (avatarFile.value) {
            formData.append('avatar', avatarFile.value)
        }

        const response = await axios.put(
            `${API_URL}/${employeeId}`,
            formData,
            getConfig()
        )

        const updatedEmployee =
            response.data.employee || response.data

        // Cập nhật localStorage, giữ lại các quyền đã đăng nhập
        const updatedUser = {
            ...user,
            ...updatedEmployee
        }

        localStorage.setItem('user', JSON.stringify(updatedUser))

        alert('Cập nhật thông tin thành công!')

        // Tải lại thông tin mới nhất
        removeSelectedAvatar()
        await getInforEmployee()

    } catch (err) {
        console.error('Lỗi cập nhật thông tin:', err)

        alert(
            err.response?.data?.message ||
            'Cập nhật thông tin thất bại'
        )
    } finally {
        isSubmitting.value = false
    }
}

onMounted(() => {
    getInforEmployee()
})

onBeforeUnmount(() => {
    if (avatarPreview.value) {
        URL.revokeObjectURL(avatarPreview.value)
    }
})
</script>

<style scoped>
.profile-page {
    min-height: 100vh;
    padding: 30px 40px;
    background: #f8fafc;
    box-sizing: border-box;
}

.profile-container {
    max-width: 1100px;
    margin: 0 auto;
}

.page-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    gap: 15px;
}

.page-heading h2 {
    margin: 0 0 6px;
    font-size: 1.6rem;
    font-weight: 800;
    color: #0f172a;
}

.page-heading p {
    margin: 0;
    color: #64748b;
    font-size: 0.9rem;
}

.btn-back {
    padding: 10px 16px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: white;
    color: #475569;
    cursor: pointer;
    font-weight: 600;
}

.profile-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 32px;
    box-shadow: 0 5px 20px rgba(15, 23, 42, 0.04);
}

.avatar-section {
    display: flex;
    align-items: center;
    gap: 24px;
}

.avatar-wrapper {
    width: 110px;
    height: 110px;
    flex-shrink: 0;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid #e0f2fe;
    background: #eff6ff;
}

.avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 30px;
    font-weight: 700;
    background: linear-gradient(135deg, #0284c7, #0369a1);
}

.avatar-info h4 {
    margin: 0 0 6px;
    font-size: 1.15rem;
    color: #0f172a;
}

.avatar-info p {
    margin: 0 0 14px;
    color: #94a3b8;
    font-size: 0.85rem;
}

.avatar-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.btn-change-avatar,
.btn-remove-avatar {
    padding: 8px 14px;
    border-radius: 7px;
    font-weight: 600;
    cursor: pointer;
}

.btn-change-avatar {
    background: #eff6ff;
    color: #0284c7;
    border: 1px solid #bfdbfe;
}

.btn-remove-avatar {
    background: white;
    color: #dc2626;
    border: 1px solid #fecaca;
}

.section-divider {
    height: 1px;
    background: #e2e8f0;
    margin: 28px 0;
}

.form-heading {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-bottom: 22px;
}

.form-heading h4 {
    margin: 0;
    color: #0f172a;
    font-size: 1.05rem;
    font-weight: 700;
}

.form-heading span {
    color: #94a3b8;
    font-size: 0.85rem;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 22px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-group label {
    font-size: 0.88rem;
    color: #334155;
    font-weight: 600;
}

.form-group label span {
    color: #dc2626;
}

.form-group input,
.form-group select {
    width: 100%;
    height: 44px;
    padding: 0 12px;
    box-sizing: border-box;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    outline: none;
    color: #334155;
    font-size: 0.9rem;
    background: white;
}

.form-group input:focus,
.form-group select:focus {
    border-color: #0284c7;
    box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);
}

.form-group input:disabled {
    background: #f1f5f9;
    color: #64748b;
    cursor: not-allowed;
}

.form-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 30px;
}

.btn-cancel,
.btn-save {
    padding: 11px 22px;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
}

.btn-cancel {
    background: white;
    border: 1px solid #cbd5e1;
    color: #475569;
}

.btn-save {
    background: #0284c7;
    border: 1px solid #0284c7;
    color: white;
}

.btn-save:hover {
    background: #0369a1;
}

.btn-save:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

@media (max-width: 768px) {
    .profile-page {
        padding: 18px 12px;
    }

    .profile-card {
        padding: 20px 16px;
    }

    .form-grid {
        grid-template-columns: 1fr;
    }

    .avatar-section {
        align-items: flex-start;
        flex-direction: column;
    }
}
</style>
