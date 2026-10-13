<template>
  <div class="admin-header">
    <div>
      <div class="brand-tag">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
          <line x1="6" y1="6" x2="6.01" y2="6"></line>
          <line x1="6" y1="18" x2="6.01" y2="18"></line>
        </svg>
        <span>HỆ THỐNG QUẢN TRỊ</span>
      </div>
      <h1 class="page-title">Trang Quản Trị</h1>
      <p class="user-greeting">
        Xin chào: <strong>{{ user?.full_name || 'Quản trị viên' }}</strong>
      </p>
    </div>

    <!-- Nút Đăng xuất -->
    <button class="btn-logout" @click="$emit('logout')">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
      </svg>
      <span>Đăng xuất</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  user: {
    type: Object,
    default: () => ({})
  }
});

defineEmits(['logout']);
</script>

<style scoped>
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 24px;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 30px;
}

.brand-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #0284c7;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 6px 0;
  letter-spacing: -0.02em;
}

.user-greeting {
  color: #64748b;
  margin: 0;
  font-size: 0.95rem;
}

.user-greeting strong {
  color: #0284c7;
}

.btn-logout {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  background-color: #ef4444;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-logout:hover {
  background-color: #dc2626;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3);
  transform: translateY(-1px);
}
</style>