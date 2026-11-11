<template>
    <aside class="admin-sidebar" :class="{ 'is-collapsed': collapsed }">
        <!-- Logo -->
        <div class="sidebar-brand">
            <div class="brand-logo">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="7" height="9" rx="1" />
                    <rect x="14" y="3" width="7" height="5" rx="1" />
                    <rect x="14" y="12" width="7" height="9" rx="1" />
                    <rect x="3" y="16" width="7" height="5" rx="1" />
                </svg>
            </div>
            <div v-if="!collapsed" class="brand-text">
                <span class="brand-name">Admin Panel</span>
                <span class="brand-sub">Quản trị hệ thống</span>
            </div>
        </div>

        <!-- Menu -->
        <nav class="sidebar-nav">
            <div v-if="!collapsed" class="nav-label">Chức năng</div>
           <button class="nav-item" :class="{ 'is-active': route.path === '/admin' }" @click="go('/admin')"
                :title="collapsed ? 'Trang chủ' : ''">
                <span class="nav-icon" v-html="homeIcon"></span>
                <span v-if="!collapsed" class="nav-text">Trang chủ</span>
            </button>            <button v-for="item in menuItems" :key="item.path" class="nav-item"
                :class="{ 'is-active': isActive(item.path) }" @click="go(item.path)"
                :title="collapsed ? item.title : ''">
                <span class="nav-icon" v-html="item.icon || defaultIcon"></span>
                <span v-if="!collapsed" class="nav-text">{{ item.title }}</span>
            </button>

            <div v-if="menuItems.length === 0 && !collapsed" class="nav-empty">
                Chưa được cấp quyền
            </div>
        </nav>

        <!-- Nút thu gọn -->
        <button class="collapse-btn" @click="$emit('toggle-collapse')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                :style="{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }">
                <polyline points="15 18 9 12 15 6" />
            </svg>
        </button>
    </aside>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'

defineProps({
    menuItems: { type: Array, default: () => [] },
    collapsed: { type: Boolean, default: false }
})

defineEmits(['toggle-collapse'])

const router = useRouter()
const route = useRoute()

const defaultIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`

const isActive = (path) => {
    if (path === '/') return route.path === '/'
    return route.path === path || route.path.startsWith(path + '/')
}

const go = (path) => router.push(path)
</script>

<style scoped>
/* =========================================================
   SIDEBAR — LIGHT THEME
   ========================================================= */
.admin-sidebar {
    position: sticky;
    top: 0;
    height: 100vh;
    width: 260px;
    flex-shrink: 0;
    background: #ffffff;
    color: #334155;
    display: flex;
    flex-direction: column;
    transition: width 0.25s ease;
    border-right: 1px solid #e2e8f0;
    box-shadow: 2px 0 12px -8px rgba(15, 23, 42, 0.08);
}

.admin-sidebar.is-collapsed {
    width: 76px;
}

/* ---- BRAND ---- */
.sidebar-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 18px;
    border-bottom: 1px solid #f1f5f9;
}

.brand-logo {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: linear-gradient(135deg, #0ea5e9, #0284c7);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 6px 16px -6px rgba(2, 132, 199, 0.45);
}

.brand-text {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    white-space: nowrap;
}

.brand-name {
    font-size: 0.95rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.01em;
}

.brand-sub {
    font-size: 0.7rem;
    color: #94a3b8;
    margin-top: 2px;
}

/* ---- NAV ---- */
.sidebar-nav {
    flex: 1;
    padding: 16px 12px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.nav-label {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    color: #94a3b8;
    letter-spacing: 0.08em;
    padding: 8px 10px 6px;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 11px 12px;
    border: none;
    background: transparent;
    color: #475569;
    font-size: 0.88rem;
    font-weight: 500;
    border-radius: 9px;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s ease;
    font-family: inherit;
    position: relative;
}

.nav-item:hover {
    background: #f1f5f9;
    color: #0f172a;
}

.nav-item.is-active {
    background: #eff6ff;
    color: #0284c7;
    font-weight: 700;
    box-shadow: inset 0 0 0 1px #bfdbfe;
}

/* Thanh xanh bên trái cho item active */
.nav-item.is-active::before {
    content: '';
    position: absolute;
    left: -12px;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 60%;
    background: #0284c7;
    border-radius: 0 3px 3px 0;
}

.nav-icon {
    display: inline-flex;
    flex-shrink: 0;
    width: 18px;
    height: 18px;
}

.nav-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.nav-empty {
    padding: 20px 10px;
    font-size: 0.8rem;
    color: #94a3b8;
    text-align: center;
    font-style: italic;
}

/* ---- SCROLLBAR (cho đẹp) ---- */
.sidebar-nav::-webkit-scrollbar {
    width: 4px;
}

.sidebar-nav::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* ---- NÚT THU GỌN ---- */
.collapse-btn {
    position: absolute;
    top: 28px;
    right: -13px;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.1);
    z-index: 10;
    transition: all 0.15s ease;
}

.collapse-btn:hover {
    background: #eff6ff;
    border-color: #0284c7;
    color: #0284c7;
}
</style>