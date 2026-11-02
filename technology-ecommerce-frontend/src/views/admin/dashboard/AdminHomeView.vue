<template>
  <div class="admin-wrapper">
    <div class="admin-layout">
      <!-- ================= SIDEBAR ================= -->
      <aside class="admin-sidebar">
        <div class="sidebar-brand">
          <div class="brand-logo">🖥️</div>
          <div class="brand-text">
            <span class="brand-name">TechStore</span>
            <span class="brand-sub">Admin Panel</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section-label">Chức năng</div>
          <button
            v-for="item in allowedMenuItems"
            :key="`sb-${item.path}`"
            class="sidebar-item"
            :class="{ active: isActive(item.path) }"
            @click="go(item.path)"
          >
            <span class="sidebar-item-dot"></span>
            <span class="sidebar-item-text">{{ item.title }}</span>
          </button>

          <div v-if="allowedMenuItems.length === 0" class="sidebar-empty">
            Chưa có quyền truy cập
          </div>
        </nav>

        <div class="sidebar-footer">
          <button class="sidebar-logout" @click="logout">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <!-- ================= MAIN ================= -->
      <div class="admin-main">
        <div class="admin-container">
          <!-- Header (component giữ nguyên props/emit) -->
          <AdminHeader :user="user" @logout="logout" />

          <!-- Welcome card -->
          <div class="welcome-card">
            <div class="welcome-content">
              <h2>Chào mừng trở lại, {{ user?.full_name || 'Quản trị viên' }} 👋</h2>
              <p>
                Bạn có <strong>{{ allowedMenuItems.length }}</strong> chức năng được cấp quyền.
                Chọn một mục bên dưới hoặc từ thanh điều hướng để bắt đầu quản lý.
              </p>
            </div>
            <div class="welcome-illustration">
              <div class="welcome-circle">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="1.8"
                     stroke-linecap="round" stroke-linejoin="round">
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
            <h3>Quản lý chức năng</h3>
            <span class="section-count">{{ allowedMenuItems.length }} mục</span>
          </div>

          <div v-if="allowedMenuItems.length > 0" class="menu-grid">
            <AdminCard
              v-for="item in allowedMenuItems"
              :key="item.path"
              :title="item.title"
              @click="go(item.path)"
            />
          </div>

          <!-- Trạng thái không có quyền -->
          <div v-else class="no-permission">
            <div class="no-permission-icon">🔒</div>
            <h3>Chưa được cấp quyền</h3>
            <p>Bạn chưa được cấp quyền truy cập chức năng nào. Vui lòng liên hệ quản trị viên cấp cao để được phân quyền.</p>
          </div>
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

// Lấy danh sách menu tự động từ Vue Router dựa theo isMenu và permissions
// (GIỮ NGUYÊN logic phân quyền của code cũ)
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

.admin-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 100vh;
}

/* =========================================================
   SIDEBAR
   ========================================================= */
.admin-sidebar {
  background: #0f172a;
  color: #cbd5e1;
  display: flex;
  flex-direction: column;
  padding: 22px 16px;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 8px 22px;
  border-bottom: 1px solid #1e293b;
  margin-bottom: 20px;
}

.brand-logo {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0284c7, #0369a1);
  border-radius: 10px;
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand-name {
  font-weight: 800;
  color: #ffffff;
  font-size: 16px;
  letter-spacing: -0.3px;
}

.brand-sub {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
}

/* ---- NAV ---- */
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-section-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #475569;
  font-weight: 700;
  padding: 4px 10px 10px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #cbd5e1;
  font-size: 13.5px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: all 0.18s ease;
  width: 100%;
}

.sidebar-item-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #475569;
  flex-shrink: 0;
  transition: all 0.18s ease;
}

.sidebar-item-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.sidebar-item:hover {
  background: #1e293b;
  color: #ffffff;
}

.sidebar-item:hover .sidebar-item-dot {
  background: #38bdf8;
}

.sidebar-item.active {
  background: linear-gradient(90deg, rgba(2, 132, 199, 0.18), transparent);
  color: #ffffff;
  font-weight: 600;
}

.sidebar-item.active .sidebar-item-dot {
  background: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25);
}

.sidebar-empty {
  padding: 12px;
  font-size: 12.5px;
  color: #64748b;
  font-style: italic;
  text-align: center;
  background: #1e293b;
  border-radius: 8px;
}

/* ---- FOOTER ---- */
.sidebar-footer {
  padding-top: 16px;
  border-top: 1px solid #1e293b;
  margin-top: 16px;
}

.sidebar-logout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  background: transparent;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #cbd5e1;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sidebar-logout:hover {
  background: #dc2626;
  border-color: #dc2626;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(220, 38, 38, 0.3);
}

/* =========================================================
   MAIN
   ========================================================= */
.admin-main {
  padding: 30px 40px;
  box-sizing: border-box;
  min-width: 0;
}

.admin-container {
  width: 100%;
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
  margin-bottom: 16px;
}

.section-title h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.section-count {
  font-size: 0.78rem;
  font-weight: 700;
  color: #0284c7;
  background: #f0f9ff;
  padding: 4px 10px;
  border-radius: 999px;
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
  padding: 60px 20px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
}

.no-permission-icon {
  font-size: 46px;
  margin-bottom: 12px;
  opacity: 0.6;
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
@media (max-width: 992px) {
  .admin-layout {
    grid-template-columns: 80px 1fr;
  }
  .sidebar-brand .brand-text { display: none; }
  .sidebar-brand { justify-content: center; padding: 0 0 18px; }
  .nav-section-label { display: none; }
  .sidebar-item { justify-content: center; padding: 12px 8px; }
  .sidebar-item-text { display: none; }
  .sidebar-item-dot { width: 8px; height: 8px; }
  .sidebar-logout span { display: none; }
  .admin-main { padding: 22px 20px; }
  .admin-container { padding: 24px 20px; }
}

@media (max-width: 640px) {
  .admin-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
  .admin-sidebar {
    position: static;
    height: auto;
    flex-direction: row;
    align-items: center;
    padding: 12px 16px;
    overflow-x: auto;
    gap: 12px;
  }
  .sidebar-brand {
    border: none;
    padding: 0;
    margin: 0;
  }
  .sidebar-nav {
    flex-direction: row;
    flex: 1;
    gap: 6px;
    overflow-x: auto;
  }
  .sidebar-item {
    width: auto;
    white-space: nowrap;
    padding: 8px 14px;
  }
  .sidebar-item-text { display: inline; }
  .sidebar-footer {
    border: none;
    padding: 0;
    margin: 0;
  }
  .sidebar-logout {
    width: auto;
    padding: 8px 12px;
  }
  .sidebar-logout span { display: none; }

  .admin-main { padding: 16px 12px; }
  .admin-container { padding: 20px 16px; }
  .welcome-card {
    flex-direction: column;
    text-align: center;
    padding: 20px;
  }
  .welcome-content h2 { font-size: 1.15rem; }
  .menu-grid { grid-template-columns: 1fr; }
}
</style>