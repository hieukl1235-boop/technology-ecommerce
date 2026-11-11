<template>
  <div class="dashboard">
    <!-- Welcome card -->
    <div class="welcome-card">
      <div class="welcome-content">
        <h2>Chào mừng trở lại, {{ user?.full_name || 'Quản trị viên' }} 👋</h2>
        <p>
          Bạn có <strong>{{ allowedMenuItems.length }}</strong> chức năng được cấp quyền.
          Chọn một mục bên trái để bắt đầu quản lý.
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

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AdminCard from '@/components/AdminCard.vue'

const router = useRouter()
const user = JSON.parse(localStorage.getItem('user')) || {}

const allowedMenuItems = computed(() => {
  const userPermissions = user?.permissions || []
  return router.getRoutes()
    .filter(r => r.meta?.isMenu && userPermissions.includes(r.meta.permission))
    .map(r => ({ title: r.meta.title, path: r.path }))
})

const go = (path) => router.push(path)
</script>

<style scoped>
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

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
}

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

@media (max-width: 768px) {
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
</style>