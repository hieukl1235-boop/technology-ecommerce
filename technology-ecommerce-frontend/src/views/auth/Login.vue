<template>
  <div class="auth-wrapper">
    <!-- Họa tiết ánh sáng công nghệ nền sáng -->
    <div class="light-glow glow-blue"></div>
    <div class="light-glow glow-purple"></div>

    <div class="auth-card shadow-sm">
      <!-- Header thương hiệu công nghệ -->
      <div class="text-center mb-4">
        <div class="brand-badge mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
            <line x1="6" y1="6" x2="6.01" y2="6"></line>
            <line x1="6" y1="18" x2="6.01" y2="18"></line>
          </svg>
          <span>TECH STORE PORTAL</span>
        </div>
        <h2 class="auth-title">Đăng Nhập Hệ Thống</h2>
        <p class="auth-subtitle">Vui lòng chọn vai trò để truy cập hệ thống</p>
      </div>

      <!-- Tab chuyển đổi giữa Khách hàng và Nhân viên -->
      <div class="custom-tabs mb-4">
        <button 
          type="button" 
          class="tab-btn" 
          :class="{ active: role === 'customer' }" 
          @click="role = 'customer'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
            <path d="M3 6h18"></path>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          Khách hàng
        </button>
        <button 
          type="button" 
          class="tab-btn" 
          :class="{ active: role === 'employee' }" 
          @click="role = 'employee'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          Nhân viên
        </button>
      </div>

      <!-- Form đăng nhập -->
      <form @submit.prevent="login">
        <!-- Input Email -->
        <div class="mb-3">
          <label class="form-label tech-label">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1">
              <rect width="20" height="16" x="2" y="4" rx="2"></rect>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
            </svg>
            Email đăng nhập
          </label>
          <div class="input-wrapper">
            <input 
              v-model="form.email" 
              type="email" 
              class="tech-input" 
              placeholder="nhap-email@example.com" 
              required
            >
          </div>
        </div>
         
        <!-- Input Mật khẩu -->
        <div class="mb-4">
          <label class="form-label tech-label">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Mật khẩu
          </label>
          <div class="input-wrapper position-relative">
            <input 
              v-model="form.password" 
              type="password" 
              class="tech-input pe-5" 
              ref="passwordInput"
              placeholder="••••••••" 
              required
            >
            <!-- Nút hiện/ẩn mật khẩu dạng icon đặt gọn trong input -->
            <button 
              type="button" 
              class="btn-toggle-eye" 
              @click="ChangeType" 
              title="Hiện/Ẩn mật khẩu"
            >
              <!-- Icon Mắt Mở -->
              <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <!-- Icon Mắt Đóng -->
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

        <!-- Nút submit đổi màu theo vai trò -->
        <button 
          type="submit" 
          class="btn-submit"
          :class="role === 'customer' ? 'btn-customer' : 'btn-employee'"
        >
          <span>Đăng nhập với tư cách {{ role === 'customer' ? 'Khách hàng' : 'Nhân viên' }}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ms-2">
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>
        </button>
      </form>

      <!-- Phần đăng nhập Google (Chỉ dành cho Khách hàng) -->
      <template v-if="role === 'customer'">
        <div class="divider-container my-4">
          <div class="divider-line"></div>
          <span class="divider-text">Hoặc tiếp tục với</span>
          <div class="divider-line"></div>
        </div>

        <div class="d-flex justify-content-center google-btn-wrap">
          <div ref="googleButton"></div>
        </div>
      </template>

      <!-- Link chuyển sang trang đăng ký -->
      <div class="text-center mt-4 pt-3 footer-links">
        <span class="text-muted-sub">Chưa có tài khoản? </span>
        <router-link to="/register" class="register-link">
          Đăng ký ngay
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
import { ref, onMounted, watch, nextTick } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";
const router = useRouter();

// Biến xác định vai trò hiện tại: 'customer' hoặc 'employee'
const role = ref("customer");
const passwordInput = ref(null);
const showPassword = ref(false);

const form = ref({
  email: "",
  password: ""
});

const message = ref("");
const googleButton = ref(null);

const ChangeType = () => {
  if (passwordInput.value) {
    if (passwordInput.value.type === "password") {
      passwordInput.value.type = "text";
      showPassword.value = true;
    } else {
      passwordInput.value.type = "password";
      showPassword.value = false;
    }
  }
};

// Hàm xử lý đăng nhập thường
const login = async () => {
  try {
    const endpoint =
      role.value === "employee"
        ? "http://localhost:3000/api/employee/auth/login"
        : "http://localhost:3000/api/auth/login";

    const response = await axios.post(endpoint, {
      email: form.value.email,
      password: form.value.password
    });

    message.value = response.data.message;

    // Lưu token
    localStorage.setItem(
      "token",
      response.data.token
    );

    // =========================
    // NHÂN VIÊN / ADMIN
    // =========================
    if (response.data.employee) {
      const employee = response.data.employee;

      localStorage.setItem(
        "user",
        JSON.stringify(employee)
      );

      // Admin
      if (employee.role_id === 1) {
        router.push("/admin");
      }
      // Nhân viên bán hàng
      else if (employee.role_id === 2) {
        router.push("/admin");
      }
      // Nhân viên giao hàng
      else if (employee.role_id === 3) {
        router.push("/admin");
      }
    }

    // =========================
    // KHÁCH HÀNG
    // =========================
    else if (response.data.user) {
      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      router.push("/home");
    }

  } catch (err) {
    message.value =
      err.response?.data?.message ||
      "Đăng nhập thất bại";
  }
};

// Đăng nhập Google
const handleGoogleLogin = async (response) => {
  try {
    const result = await axios.post(
      "http://localhost:3000/api/auth/google",
      {
        credential: response.credential
      }
    );

    message.value = result.data.message;

    // Lưu JWT
    localStorage.setItem(
      "token",
      result.data.token
    );

    // Lưu thông tin khách hàng để Vue sử dụng
    localStorage.setItem(
      "user",
      JSON.stringify(result.data.user)
    );

    router.push("/home");

  } catch (error) {
    message.value =
      error.response?.data?.message ||
      "Đăng nhập Google thất bại";
  }
};

const renderGoogleBtn = () => {
  nextTick(() => {
    if (googleButton.value && window.google) {
      try {
        google.accounts.id.renderButton(
          googleButton.value,
          { theme: "outline", size: "large", text: "signin_with", width: "100%", shape: "rectangular" }
        );
      } catch (e) {}
    }
  });
};

onMounted(() => {
  if (window.google) {
    google.accounts.id.initialize({
      client_id: "293172430566-r0pngscca9184ig90iks0if6i5j7l8fu.apps.googleusercontent.com",
      callback: handleGoogleLogin
    });
  }
  renderGoogleBtn();
});

watch(role, (newRole) => {
  if (newRole === 'customer') {
    renderGoogleBtn();
  }
});
</script>

<style scoped>
/* Nền trắng sáng kết hợp họa tiết lưới tinh tế chuẩn Tech/Modern */
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

/* Ánh sáng mềm mại phản chiếu dưới nền */
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
  max-width: 440px;
  padding: 2.25rem 2rem;
  border-radius: 1.25rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.08), 
              0 0 1px 1px rgba(15, 23, 42, 0.03);
}

/* Badge nhận diện cổng công nghệ */
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

/* Thanh chuyển tab gạt kiểu Segmented Control */
.custom-tabs {
  display: flex;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 0.75rem;
  gap: 4px;
  border: 1px solid #e2e8f0;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.6rem 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  background: transparent;
  border: none;
  border-radius: 0.55rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: #1e293b;
}

.tab-btn.active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* Tiêu đề Label */
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

/* Nút Submit */
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
}

/* Nút Khách Hàng: Xanh Cyan / Công nghệ */
.btn-customer {
  background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
  box-shadow: 0 4px 14px rgba(2, 132, 199, 0.3);
}
.btn-customer:hover {
  background: linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%);
  box-shadow: 0 6px 20px rgba(2, 132, 199, 0.4);
  transform: translateY(-1px);
}

/* Nút Nhân Viên: Tím Hiện đại */
.btn-employee {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
}
.btn-employee:hover {
  background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
  transform: translateY(-1px);
}

/* Đường gạch phân cách Hoặc */
.divider-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: #e2e8f0;
}

.divider-text {
  font-size: 0.775rem;
  color: #94a3b8;
  font-weight: 500;
}

.google-btn-wrap {
  min-height: 44px;
}

/* Liên kết Đăng ký */
.footer-links {
  border-top: 1px solid #f1f5f9;
}

.text-muted-sub {
  color: #64748b;
  font-size: 0.85rem;
}

.register-link {
  color: #0284c7;
  font-weight: 700;
  text-decoration: none;
  font-size: 0.85rem;
  transition: color 0.2s;
}

.register-link:hover {
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