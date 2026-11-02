<template>
  <div class="admin-wrapper">
    <div class="admin-main">
      <div class="admin-container">
        <!-- Header (giữ nguyên props/emit) -->
        <AdminHeader :user="user" @logout="logout" />

        <!-- Welcome card -->
        <div class="welcome-card">
          <div class="welcome-content">
            <h2>Chào mừng trở lại, {{ user?.full_name || 'Quản trị viên' }} 👋</h2>
            <p>
              Bạn có <strong>{{ allowedMenuItems.length }}</strong> chức năng được cấp quyền.
              Chọn một mục bên dưới để bắt đầu quản lý.
            </p>
          </div>
          <div class="welcome-illustration">
            <div class="welcome-circle">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Menu grid -->
        <div class="section-title">
          <div class="section-title-left">
            <h3>Quản lý chức năng</h3>
            <span class="section-count">{{ allowedMenuItems.length }} mục</span>
          </div>
          <div class="section-hint">Nhấn vào thẻ để truy cập</div>
        </div>

        <div v-if="allowedMenuItems.length > 0" class="menu-grid">
          <AdminCard v-for="item in allowedMenuItems" :key="item.path" :title="item.title" @click="go(item.path)" />
        </div>

        <!-- Trạng thái không có quyền -->
        <div v-else class="no-permission">
          <div class="no-permission-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h3>Chưa được cấp quyền</h3>
          <p>Bạn chưa được cấp quyền truy cập chức năng nào. Vui lòng liên hệ quản trị viên cấp cao để được phân quyền.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AdminHeader from '@/components/AdminHeader.vue'
import AdminCard from '@/components/AdminCard.vue'

const router = useRouter()
const route = useRoute()
const user = ref(JSON.parse(localStorage.getItem('user')) || {})

// Giữ nguyên logic cũ: lấy menu từ Vue Router theo isMenu + permissions
const allowedMenuItems = computed(() => {
  const userPermissions = user.value?.permissions || []

  return router.getRoutes()
    .filter(r => r.meta?.isMenu && userPermissions.includes(r.meta.permission))
    .map(r => ({
      title: r.meta.title,
      path: r.path
    }))
})

const isActive = (path) => {
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(path + '/')
}

const go = (path) => {
  router.push(path)
}

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}
</script>

<style scoped>
/* =========================================================
   WRAPPER
   ========================================================= */
.admin-wrapper {
  min-height: 100vh;
  width: 100%;
  background-color: #f8fafc;
  background-image:
    linear-gradient(rgba(226, 232, 240, 0.6) 1px, transparent 1px),
    linear-gradient(90deg, rgba(226, 232, 240, 0.6) 1px, transparent 1px);
  background-size: 32px 32px;
}

/* =========================================================
   MAIN — full width, căn giữa
   ========================================================= */
.admin-main {
  padding: 30px 40px;
  box-sizing: border-box;
  min-width: 0;
}

.admin-container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  background: #ffffff;
  padding: 32px 40px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.05);
  box-sizing: border-box;
}

/* ---- WELCOME CARD ---- */
.welcome-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 28px;
  background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
  border: 1px solid #bfdbfe;
  border-radius: 14px;
  margin-bottom: 30px;
}

.welcome-content h2 {
  margin: 0 0 8px 0;
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.welcome-content p {
  margin: 0;
  color: #475569;
  font-size: 0.92rem;
  line-height: 1.55;
  max-width: 620px;
}

.welcome-content strong {
  color: #0284c7;
}

.welcome-illustration {
  flex-shrink: 0;
}

.welcome-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid #bfdbfe;
  color: #0284c7;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px -6px rgba(2, 132, 199, 0.25);
}

/* ---- SECTION TITLE ---- */
.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f1f5f9;
}

.section-title-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.section-count {
  font-size: 0.75rem;
  font-weight: 700;
  color: #0284c7;
  background: #f0f9ff;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid #bae6fd;
}

.section-hint {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 500;
}

/* ---- MENU GRID ---- */
.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
}

/* ---- NO PERMISSION ---- */
.no-permission {
  text-align: center;
  padding: 70px 20px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
}

.no-permission-icon {
  color: #94a3b8;
  margin-bottom: 14px;
  display: inline-flex;
}

.no-permission h3 {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  color: #0f172a;
}

.no-permission p {
  margin: 0 auto;
  color: #64748b;
  font-size: 0.9rem;
  max-width: 460px;
  line-height: 1.6;
}

/* =========================================================
   RESPONSIVE
   ========================================================= */
@media (max-width: 1024px) {
  .menu-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (max-width: 768px) {
  .admin-main {
    padding: 16px 12px;
  }

  .admin-container {
    padding: 20px 16px;
  }

  .welcome-card {
    flex-direction: column;
    text-align: center;
    padding: 20px;
  }

  .welcome-content h2 {
    font-size: 1.15rem;
  }

  .section-hint {
    display: none;
  }

  .menu-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .menu-grid {
    grid-template-columns: 1fr;
  }
}
</style>