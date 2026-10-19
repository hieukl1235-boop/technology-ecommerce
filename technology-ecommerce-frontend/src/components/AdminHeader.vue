<template>
  <div class="admin-header">
    <!-- BÊN TRÁI: Breadcrumb + Tiêu đề -->
    <div class="header-left">
      <div class="brand-tag">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
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

    <!-- BÊN PHẢI: User dropdown + Logout -->
    <div class="header-right">
      <!-- Avatar + tên -->
      <div class="user-chip">
        <div class="user-avatar">
          {{ getInitials(user?.full_name) }}
        </div>
        <div class="user-chip-info">
          <span class="user-chip-name">{{ user?.full_name || 'Quản trị viên' }}</span>
          <span class="user-chip-role">{{ user?.role || 'Admin' }}</span>
        </div>
      </div>

      <!-- Nút Đăng xuất -->
      <button class="btn-logout" @click="$emit('logout')" title="Đăng xuất khỏi hệ thống">
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
  </div>
</template>

<script setup>
defineProps({
  user: {
    type: Object,
    default: () => ({})
  }
})

defineEmits(['logout'])

// Lấy 2 ký tự đầu của tên làm avatar
const getInitials = (name) => {
  if (!name) return 'AD'
  const parts = String(name).trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
</script>

<style scoped>
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

/* ---- LEFT ---- */
.header-left {
  min-width: 0;
}

.brand-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #0284c7;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
  padding: 4px 10px;
  background: #f0f9ff;
  border-radius: 999px;
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

/* ---- RIGHT ---- */
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* User chip */
.user-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px 6px 6px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  transition: all 0.2s ease;
}

.user-chip:hover {
  border-color: #0284c7;
  background: #f0f9ff;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0284c7, #0369a1);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(2, 132, 199, 0.25);
}

.user-chip-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  min-width: 0;
}

.user-chip-name {
  font-weight: 700;
  font-size: 0.88rem;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.user-chip-role {
  font-size: 0.72rem;
  color: #0284c7;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* Logout button — chuyển sang tông trung tính + hover đỏ */
.btn-logout {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  background-color: #ffffff;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-logout:hover {
  background-color: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.15);
  transform: translateY(-1px);
}

.btn-logout:active {
  transform: translateY(0);
}

.btn-logout:focus-visible {
  outline: 2px solid #0284c7;
  outline-offset: 2px;
}

/* ---- RESPONSIVE ---- */
@media (max-width: 640px) {
  .admin-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-right {
    width: 100%;
    justify-content: space-between;
  }
  .user-chip-info { display: none; }
  .user-chip { padding: 4px; }
  .btn-logout span { display: none; }
  .btn-logout { padding: 10px; }
}
</style>