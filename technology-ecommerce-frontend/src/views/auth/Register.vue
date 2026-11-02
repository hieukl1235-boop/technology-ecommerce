<template>
  <div class="auth-wrapper">
    <!-- Họa tiết ánh sáng nền công nghệ -->
    <div class="light-glow glow-blue"></div>
    <div class="light-glow glow-purple"></div>

    <div class="auth-card shadow-sm">
      <!-- Header thương hiệu -->
      <div class="text-center mb-4">
        <div class="brand-badge mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <line x1="19" y1="8" x2="19" y2="14"></line>
            <line x1="22" y1="11" x2="16" y2="11"></line>
          </svg>
          <span>MEMBER REGISTRATION</span>
        </div>
        <h2 class="auth-title">Đăng Ký Tài Khoản</h2>
        <p class="auth-subtitle">Trở thành thành viên để trải nghiệm hệ sinh thái công nghệ</p>
      </div>

      <!-- Form đăng ký -->
      <form @submit.prevent="register">
        <!-- Họ tên -->
        <div class="mb-3">
          <label class="form-label tech-label">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Họ và tên
          </label>
          <input 
            v-model="form.full_name" 
            type="text" 
            class="tech-input" 
            placeholder="Ví dụ: Nguyễn Văn A" 
            required
          >
        </div>

        <!-- Email -->
        <div class="mb-3">
          <label class="form-label tech-label">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1">
              <rect width="20" height="16" x="2" y="4" rx="2"></rect>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
            </svg>
            Email
          </label>
          <input 
            v-model="form.email" 
            type="email" 
            class="tech-input" 
            placeholder="name@example.com" 
            required
          >
        </div>

        <!-- Mật khẩu kèm icon ẩn/hiện -->
        <div class="mb-3">
          <label class="form-label tech-label">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Mật khẩu
          </label>
          <div class="position-relative">
            <input 
              v-model="form.password" 
              :type="showPassword ? 'text' : 'password'" 
              class="tech-input pe-5" 
              placeholder="Tối thiểu 6 ký tự..." 
              required
            >
            <button 
              type="button" 
              class="btn-toggle-eye" 
              @click="showPassword = !showPassword"
              title="Hiện/Ẩn mật khẩu"
            >
              <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m15 18-.722-3.25"></path>
                <path d="M2 8a10.645 10.645 0 0 0 20 0"></path>
                <path d="m20 15-1.726-2.05"></path>
                <path d="m4 15 1.726-2.05"></path>
                <path d="m9 18 .722-3.25"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Hàng 2 cột: Ngày sinh & Giới tính -->
        <div class="row g-2 mb-4">
          <!-- Ngày sinh -->
          <div class="col-6">
            <label class="form-label tech-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Ngày sinh
            </label>
            <input 
              v-model="form.date_of_birth" 
              type="date" 
              class="tech-input date-input"
            >
          </div>

          <!-- Giới tính thiết kế dạng Pill -->
          <div class="col-6">
            <label class="form-label tech-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
              Giới tính
            </label>
            <div class="gender-toggle-group">
              <label class="gender-option" :class="{ active: form.gender === '1' }">
                <input v-model="form.gender" type="radio" value="1" class="d-none">
                <span>Nam</span>
              </label>
              <label class="gender-option" :class="{ active: form.gender === '0' }">
                <input v-model="form.gender" type="radio" value="0" class="d-none">
                <span>Nữ</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Nút Submit Gradient -->
        <button type="submit" class="btn-submit" :disabled="loading">
          <span>{{ loading ? "Đang gửi OTP..." : "Đăng Ký Tài Khoản" }}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ms-2">
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>
        </button>
      </form>
      <!-- Form xác minh OTP -->
      <div v-if="showOtpForm" class="mt-4">
        <h5 class="text-center">Xác minh email</h5>

        <p class="text-center">
          Mã OTP đã được gửi đến email {{ form.email }}.
          Mã có hiệu lực trong 5 phút.
        </p>

        <form @submit.prevent="verifyRegistrationOtp">
          <div class="mb-3">
            <label class="form-label tech-label">Mã OTP</label>
            <input v-model="otp" type="text" class="tech-input" placeholder="Nhập mã OTP gồm 6 chữ số" maxlength="6"
              inputmode="numeric" pattern="[0-9]{6}" required>
          </div>

          <button type="submit" class="btn-submit" :disabled="loading">
            {{ loading ? "Đang xác minh..." : "Xác minh và đăng ký" }}
          </button>
        </form>

        <button type="button" class="btn btn-link w-100 mt-2" @click="showOtpForm = false">
          Quay lại form đăng ký
        </button>
      </div>

      <!-- Link chuyển về trang đăng nhập -->
      <div class="text-center mt-4 pt-3 footer-links">
        <span class="text-muted-sub">Đã có tài khoản? </span>
        <router-link to="/login" class="login-link">
          Đăng nhập ngay
        </router-link>
      </div>

      <!-- Thông báo alert -->
      <div v-if="message" class="tech-alert mt-3" role="alert">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-2 flex-shrink-0">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <span>{{ message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";

const router = useRouter();

const form = ref({
  full_name: "",
  email: "",
  password: "",
  date_of_birth: "",
  gender: "1"
});

const showPassword = ref(false);
const message = ref("");
const loading = ref(false);

const showOtpForm = ref(false);
const otp = ref("");

const register = async () => {
  if (loading.value) return;

  loading.value = true;
  message.value = "";

  try {
    const response = await axios.post(
      "http://localhost:3000/api/auth/register",
      form.value
    );

    message.value = response.data.message;
    showOtpForm.value = true;
    otp.value = "";
  } catch (error) {
    message.value =
      error.response?.data?.message || "Không thể gửi OTP đăng ký";
  } finally {
    loading.value = false;
  }
};

const verifyRegistrationOtp = async () => {
  if (loading.value) return;

  loading.value = true;
  message.value = "";

  try {
    const response = await axios.post(
      "http://localhost:3000/api/auth/verify-registration-otp",
      {
        email: form.value.email,
        otp: otp.value
      }
    );

    message.value = response.data.message;

    // Chỉ chuyển trang khi backend xác minh thành công.
    await router.push("/login");
  } catch (error) {
    message.value =
      error.response?.data?.message || "Xác minh OTP thất bại";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Đồng bộ hoàn toàn hiệu ứng nền trắng sáng vân lưới Tech */
.auth-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8fafc;
  background-image: 
    linear-gradient(rgba(226, 232, 240, 0.6) 1px, transparent 1px),
    linear-gradient(90deg, rgba(226, 232, 240, 0.6) 1px, transparent 1px);
  background-size: 32px 32px;
  z-index: 1000;
  overflow-y: auto;
  padding: 1.5rem;
}

/* Ánh sáng mềm mại nền */
.light-glow {
  position: absolute;
  width: 450px;
  height: 450px;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.55;
  pointer-events: none;
}
.glow-blue {
  background: #bae6fd;
  top: 10%;
  left: 25%;
}
.glow-purple {
  background: #e0e7ff;
  bottom: 10%;
  right: 25%;
}

/* Thẻ form nền trắng cao cấp */
.auth-card {
  position: relative;
  background: #ffffff;
  width: 100%;
  max-width: 450px;
  padding: 2.25rem 2rem;
  border-radius: 1.25rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.08), 
              0 0 1px 1px rgba(15, 23, 42, 0.03);
}

/* Badge nhận diện cổng đăng ký */
.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  color: #0284c7;
  border-radius: 50px;
  font-size: 0.725rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.auth-title {
  font-weight: 800;
  color: #0f172a;
  font-size: 1.6rem;
  letter-spacing: -0.02em;
  margin-top: 0.4rem;
  margin-bottom: 0.25rem;
}

.auth-subtitle {
  color: #64748b;
  font-size: 0.85rem;
  margin-bottom: 0;
}

/* Label chuẩn Tech */
.tech-label {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.4rem;
}

/* Ô nhập liệu */
.tech-input {
  width: 100%;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 0.65rem;
  color: #0f172a;
  padding: 0.75rem 1rem;
  font-size: 0.925rem;
  outline: none;
  transition: all 0.2s ease;
}

.tech-input:focus {
  background: #ffffff;
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
}

.tech-input::placeholder {
  color: #94a3b8;
}

.date-input {
  color: #334155;
}

/* Nút ẩn/hiện mật khẩu */
.btn-toggle-eye {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  transition: color 0.2s;
}

.btn-toggle-eye:hover {
  color: #0284c7;
}

/* Tùy chỉnh chọn giới tính kiểu Segmented Pill */
.gender-toggle-group {
  display: flex;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 0.65rem;
  padding: 3px;
  gap: 3px;
  height: 44px;
}

.gender-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
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

/* Nút submit xanh công nghệ */
.btn-submit {
  width: 100%;
  padding: 0.8rem 1rem;
  border-radius: 0.65rem;
  border: none;
  font-weight: 700;
  font-size: 0.95rem;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s ease;
  margin-top: 0.5rem;
  background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
  box-shadow: 0 4px 14px rgba(2, 132, 199, 0.3);
}

.btn-submit:hover {
  background: linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%);
  box-shadow: 0 6px 20px rgba(2, 132, 199, 0.4);
  transform: translateY(-1px);
}

/* Footer link */
.footer-links {
  border-top: 1px solid #f1f5f9;
}

.text-muted-sub {
  color: #64748b;
  font-size: 0.85rem;
}

.login-link {
  color: #0284c7;
  font-weight: 700;
  text-decoration: none;
  font-size: 0.85rem;
  transition: color 0.2s;
}

.login-link:hover {
  color: #0369a1;
  text-decoration: underline;
}

/* Hộp thông báo Tech Alert */
.tech-alert {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  color: #0369a1;
  padding: 0.65rem 0.9rem;
  border-radius: 0.55rem;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
}
</style>