<template>
  <div class="filter-wrapper">
    <!-- Hàng 1: search + status + nút thêm -->
    <div class="filter-row">
      <!-- Search -->
      <div class="filter-search">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" class="search-icon">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          class="custom-input"
          placeholder="Tìm kiếm theo tên sản phẩm..."
          :value="search"
          @input="$emit('update:search', $event.target.value)"
        />
        <button
          v-if="search"
          type="button"
          class="clear-btn"
          @click="$emit('update:search', '')"
          title="Xóa tìm kiếm"
        >
          ✕
        </button>
      </div>

      <!-- Status -->
      <select
        class="custom-select"
        :value="status"
        @change="$emit('update:status', $event.target.value)"
      >
        <option value="">⚡ Tất cả trạng thái</option>
        <option value="1">🟢 Đang kinh doanh</option>
        <option value="0">🔒 Ngừng kinh doanh</option>
      </select>

      <!-- Nút thêm -->
      <button class="btn-add-product" @click="$emit('open-add-modal')">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>Thêm sản phẩm</span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  search: { type: String, default: '' },
  status: { type: [String, Number], default: '' }
})

defineEmits(['update:search', 'update:status', 'open-add-modal'])
</script>

<style scoped>
.filter-wrapper {
  width: 100%;
}

.filter-row {
  display: grid;
  grid-template-columns: 1fr 220px auto;
  gap: 12px;
  align-items: center;
}

/* ---- SEARCH ---- */
.filter-search {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
}

.custom-input {
  width: 100%;
  padding: 11px 40px 11px 42px;
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.925rem;
  color: #0f172a;
  outline: none;
  transition: all 0.2s ease;
}

.custom-input:focus {
  background-color: #ffffff;
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
}

.clear-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: #e2e8f0;
  border: none;
  color: #64748b;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 11px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.clear-btn:hover {
  background: #cbd5e1;
  color: #0f172a;
}

/* ---- SELECT ---- */
.custom-select {
  width: 100%;
  padding: 11px 14px;
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.925rem;
  color: #334155;
  font-weight: 500;
  outline: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.custom-select:focus {
  background-color: #ffffff;
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
}

/* ---- ADD BUTTON ---- */
.btn-add-product {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 20px;
  background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.925rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-add-product:hover {
  background: linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%);
  box-shadow: 0 6px 16px rgba(2, 132, 199, 0.35);
  transform: translateY(-1px);
}

.btn-add-product:active {
  transform: translateY(0);
}

.btn-add-product:focus-visible {
  outline: 2px solid #0284c7;
  outline-offset: 2px;
}

/* ---- RESPONSIVE ---- */
@media (max-width: 768px) {
  .filter-row {
    grid-template-columns: 1fr;
  }
  .btn-add-product {
    justify-content: center;
    width: 100%;
  }
}
</style>