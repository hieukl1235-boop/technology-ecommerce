<template>
  <div class="admin-card" @click="$emit('click')">
    <div class="card-icon">
      <!-- Icon vi mạch công nghệ -->
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    </div>
    
    <div class="card-info">
      <span class="card-title">{{ title }}</span>
      <span class="card-subtitle">Truy cập quản lý &rarr;</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  }
});

defineEmits(['click']);
</script>

<style scoped>
.admin-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.admin-card:hover {
  border-color: #0284c7;
  transform: translateY(-3px);
  box-shadow: 0 12px 24px -6px rgba(2, 132, 199, 0.15);
}

.card-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #f0f9ff;
  color: #0284c7;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.25s ease;
}

.admin-card:hover .card-icon {
  background: #0284c7;
  color: #ffffff;
}

.card-info {
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 2px;
}

.card-subtitle {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 500;
  transition: color 0.2s ease;
}

.admin-card:hover .card-subtitle {
  color: #0284c7;
}
</style>