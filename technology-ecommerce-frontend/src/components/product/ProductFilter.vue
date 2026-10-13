<template>
  <div class="row g-3 align-items-center">
    <!-- Ô tìm kiếm có icon -->
    <div class="col-md-6">
      <div class="search-input-wrapper">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
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
      </div>
    </div>

    <!-- Dropdown lọc trạng thái -->
    <div class="col-md-3">
      <select 
        class="custom-select" 
        :value="status"
        @change="$emit('update:status', $event.target.value)"
      >
        <option value="">⚡ Tất cả trạng thái</option>
        <option value="1">🟢 Đang kinh doanh</option>
        <option value="0">🔒 Ngừng kinh doanh</option>
      </select>
    </div>

    <!-- Nút thêm mới -->
    <div class="col-md-3 text-end">
      <button class="btn-add-product" @click="$emit('open-add-modal')">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-1">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>Thêm sản phẩm mới</span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  search: String,
  status: [String, Number]
});

defineEmits(['update:search', 'update:status', 'open-add-modal']);
</script>

<style scoped>
.search-input-wrapper {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.custom-input {
  width: 100%;
  padding: 10px 14px 10px 42px;
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.925rem;
  color: #0f172a;
  outline: none;
  transition: all 0.2s ease;
}

.custom-input:focus, .custom-select:focus {
  background-color: #ffffff;
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
}

.custom-select {
  width: 100%;
  padding: 10px 14px;
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.925rem;
  color: #334155;
  font-weight: 500;
  outline: none;
  cursor: pointer;
}

.btn-add-product {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.925rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
  transition: all 0.2s ease;
}

.btn-add-product:hover {
  background: linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%);
  box-shadow: 0 6px 16px rgba(2, 132, 199, 0.35);
  transform: translateY(-1px);
}
</style>