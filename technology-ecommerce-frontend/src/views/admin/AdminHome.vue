<template>
  <div class="admin-wrapper">
    <div class="admin-container">
      <!-- Header -->
      <AdminHeader :user="user" @logout="logout" />

      <!-- Lưới Menu chức năng tự động -->
      <div class="menu-grid">
        <AdminCard
          v-for="item in allowedMenuItems"
          :key="item.path"
          :title="item.title"
          @click="go(item.path)"
        />
      </div>

      <!-- Hiển thị khi không có quyền nào -->
      <div v-if="allowedMenuItems.length === 0" class="no-permission text-center py-5">
        <p class="text-muted">Bạn chưa được cấp quyền truy cập chức năng nào.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import AdminHeader from "@/components/AdminHeader.vue";
import AdminCard from "@/components/AdminCard.vue";

const router = useRouter();
const user = ref(JSON.parse(localStorage.getItem("user")) || {});

// Lấy danh sách menu tự động từ Vue Router dựa theo isMenu và permissions
const allowedMenuItems = computed(() => {
  const userPermissions = user.value?.permissions || [];

  return router.getRoutes()
    .filter(route => route.meta?.isMenu && userPermissions.includes(route.meta.permission))
    .map(route => ({
      title: route.meta.title,
      path: route.path
    }));
});

const go = (path) => {
  router.push(path);
};

const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  router.push("/login");
};
</script>

<style scoped>
.admin-wrapper {
  min-height: 100vh;
  width: 100%;
  background-color: #f8fafc;
  background-image: 
    linear-gradient(rgba(226, 232, 240, 0.6) 1px, transparent 1px),
    linear-gradient(90deg, rgba(226, 232, 240, 0.6) 1px, transparent 1px);
  background-size: 32px 32px;
  padding: 30px 40px; /* Căn lề rộng thoáng 2 bên */
  box-sizing: border-box;
}

.admin-container {
  width: 100%; /* Mở rộng 100% toàn màn hình */
  background: #ffffff;
  padding: 32px 40px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.05);
  box-sizing: border-box;
}

.menu-grid {
  display: grid;
  /* Tự động dàn đều 4 đến 5 cột rộng thênh thang trên màn hình máy tính */
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
</style>