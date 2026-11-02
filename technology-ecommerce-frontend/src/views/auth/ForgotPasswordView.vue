<template>
    <div class="container py-5">
        <div class="card shadow-sm mx-auto" style="max-width: 480px">
            <div class="card-body p-4">
                <h3 class="text-center mb-2">Quên mật khẩu</h3>

                <p class="text-center text-muted mb-4">
                    {{ step === 1
                        ? "Nhập email đã đăng ký tài khoản"
                        : step === 2
                            ? "Nhập mã OTP được gửi đến email"
                            : "Tạo mật khẩu mới cho tài khoản" }}
                </p>

                <!-- BƯỚC 1: NHẬP EMAIL -->
                <form v-if="step === 1" @submit.prevent="sendOtp">
                    <div class="mb-3">
                        <label class="form-label">Email</label>
                        <input v-model.trim="email" type="email" class="form-control" placeholder="Nhập email của bạn"
                            required />
                    </div>

                    <button type="submit" class="btn btn-primary w-100" :disabled="loading">
                        {{ loading ? "Đang gửi..." : "Gửi mã OTP" }}
                    </button>
                </form>

                <!-- BƯỚC 2: XÁC MINH OTP -->
                <form v-else-if="step === 2" @submit.prevent="verifyOtp">
                    <div class="mb-3">
                        <label class="form-label">Mã OTP</label>
                        <input v-model.trim="otp" type="text" class="form-control" placeholder="Nhập mã OTP 6 chữ số"
                            inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required />
                    </div>

                    <button type="submit" class="btn btn-primary w-100" :disabled="loading">
                        {{ loading ? "Đang xác minh..." : "Xác minh OTP" }}
                    </button>

                    <button type="button" class="btn btn-outline-secondary w-100 mt-2" @click="step = 1; message = ''">
                        Quay lại
                    </button>
                </form>

                <!-- BƯỚC 3: ĐẶT MẬT KHẨU MỚI -->
                <form v-else @submit.prevent="resetPassword">
                    <div class="mb-3">
                        <label class="form-label">Mật khẩu mới</label>
                        <input v-model="newPassword" type="password" class="form-control" placeholder="Ít nhất 8 ký tự"
                            minlength="8" required />
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Xác nhận mật khẩu mới</label>
                        <input v-model="confirmPassword" type="password" class="form-control"
                            placeholder="Nhập lại mật khẩu mới" minlength="8" required />
                    </div>

                    <button type="submit" class="btn btn-success w-100" :disabled="loading">
                        {{ loading ? "Đang cập nhật..." : "Đổi mật khẩu" }}
                    </button>
                </form>

                <!-- THÔNG BÁO -->
                <div v-if="message" class="alert mt-3 mb-0" :class="isError ? 'alert-danger' : 'alert-info'"
                    role="alert">
                    {{ message }}
                </div>

                <div class="text-center mt-4">
                    <router-link to="/login" class="text-decoration-none">
                        Quay lại đăng nhập
                    </router-link>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";

const router = useRouter();

const step = ref(1);
const email = ref("");
const otp = ref("");
const newPassword = ref("");
const confirmPassword = ref("");

const message = ref("");
const isError = ref(false);
const loading = ref(false);

// BƯỚC 1: GỬI OTP ĐẾN EMAIL
const sendOtp = async () => {
    loading.value = true;
    message.value = "";
    isError.value = false;

    try {
        const response = await axios.post(
            "http://localhost:3000/api/auth/forgot-password",
            {
                email: email.value,
            }
        );

        message.value = response.data.message;
        step.value = 2;
    } catch (error) {
        isError.value = true;
        message.value =
            error.response?.data?.message ||
            "Không thể gửi mã OTP. Vui lòng thử lại.";
    } finally {
        loading.value = false;
    }
};

// BƯỚC 2: XÁC MINH OTP
const verifyOtp = async () => {
    loading.value = true;
    message.value = "";
    isError.value = false;

    try {
        const response = await axios.post(
            "http://localhost:3000/api/auth/verify-reset-otp",
            {
                email: email.value,
                otp: otp.value,
            }
        );

        message.value = response.data.message;
        step.value = 3;
    } catch (error) {
        isError.value = true;
        message.value =
            error.response?.data?.message ||
            "Xác minh OTP thất bại.";
    } finally {
        loading.value = false;
    }
};

// BƯỚC 3: ĐẶT LẠI MẬT KHẨU
const resetPassword = async () => {
    if (newPassword.value !== confirmPassword.value) {
        isError.value = true;
        message.value = "Mật khẩu xác nhận không khớp.";
        return;
    }

    loading.value = true;
    message.value = "";
    isError.value = false;

    try {
        const response = await axios.post(
            "http://localhost:3000/api/auth/reset-password",
            {
                email: email.value,
                otp: otp.value,
                newPassword: newPassword.value,
            }
        );

        message.value = response.data.message;

        // Chuyển về đăng nhập sau khi đổi mật khẩu thành công
        await router.push("/login");
    } catch (error) {
        isError.value = true;
        message.value =
            error.response?.data?.message ||
            "Không thể đặt lại mật khẩu.";
    } finally {
        loading.value = false;
    }
};
</script>
