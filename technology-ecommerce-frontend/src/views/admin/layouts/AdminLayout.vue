<template>
    <div class="admin-layout">
        <!-- SIDEBAR -->
        <AdminSidebar :menu-items="allowedMenuItems" :collapsed="collapsed" @toggle-collapse="collapsed = !collapsed" />

        <!-- MAIN CONTENT -->
        <div class="admin-main">
            <AdminHeader :user="user" @logout="logout" />

            <main class="admin-content">
                <router-view />
            </main>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminSidebar from '@/components/AdminSidebar.vue'
import AdminHeader from '@/components/AdminHeader.vue'
import axios from 'axios'

const router = useRouter()
const collapsed = ref(false)
const user = ref(JSON.parse(localStorage.getItem('user')) || {})

const allowedMenuItems = computed(() => {
    const userPermissions = user.value?.permissions || []

    return router.getRoutes()
        .filter(r => r.meta?.isMenu && userPermissions.includes(r.meta.permission))
        .map(r => ({
            title: r.meta.title,
            path: r.path,
            icon: r.meta.icon
        }))
})

const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
}

const getConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

const getInforEmployee = async () => {
    const employeeId = user.value?.id
    if (!employeeId) return
    try {
        await axios.get(
            `http://localhost:3000/api/admin/employees/${employeeId}`,
            getConfig()
        )
    } catch (err) {
        console.error('Lỗi tải thông tin người dùng:', err)
    }
}

onMounted(() => {
    getInforEmployee()
})
</script>

<style scoped>
.admin-layout {
    display: flex;
    min-height: 100vh;
    width: 100%;
    background-color: #f8fafc;
    background-image:
        linear-gradient(rgba(226, 232, 240, 0.6) 1px, transparent 1px),
        linear-gradient(90deg, rgba(226, 232, 240, 0.6) 1px, transparent 1px);
    background-size: 32px 32px;
}

.admin-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: auto;
}

.admin-content {
    flex: 1;
    padding: 24px 32px;
    box-sizing: border-box;
    overflow-y: auto;
}

@media (max-width: 768px) {
    .admin-content {
        padding: 16px;
    }
}
</style>