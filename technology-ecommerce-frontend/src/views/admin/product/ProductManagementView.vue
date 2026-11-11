<template>
  <div class="product-page">
    <!-- HEADER -->
    <div class="page-header">
      <div class="header-left">      
        <div class="header-titles">
          <p class="page-sub">
            Tổng cộng <b>{{ products.length }}</b> sản phẩm •
            Hiển thị <b>{{ filteredProducts.length }}</b> kết quả
          </p>
        </div>
      </div>
    </div>

    <!-- FILTER BAR -->
    <div class="filter-card">
      <ProductFilter
        v-model:search="searchQuery"
        v-model:status="currentStatus"
        @open-add-modal="openModalForCreate"
      />
    </div>

    <!-- TABLE -->
    <div class="table-card">
      <!-- Loading -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Đang tải danh sách sản phẩm...</p>
      </div>

      <!-- Error -->
      <div v-else-if="loadError" class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>Không thể tải dữ liệu</h3>
        <p>{{ loadError }}</p>
        <button class="btn-retry" @click="fetchProducts">Thử lại</button>
      </div>

      <!-- Table -->
      <ProductTable
        v-else
        :products="filteredProducts"
        @edit="openModalForEdit"
        @toggle-status="handleToggleStatus"
      />
    </div>

    <!-- MODAL -->
    <ProductModal
      :isOpen="isModalOpen"
      :productData="selectedProduct"
      @close="isModalOpen = false"
      @success="fetchProducts"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import ProductFilter from '@/components/product/ProductFilter.vue'
import ProductTable from '@/components/product/ProductTable.vue'
import ProductModal from '@/components/product/ProductModal.vue'

const router = useRouter()

const products = ref([])
const searchQuery = ref('')
const currentStatus = ref('')

const isModalOpen = ref(false)
const selectedProduct = ref(null)

const isLoading = ref(false)
const loadError = ref('')

const goBack = () => router.back()

const fetchProducts = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('http://localhost:3000/api/admin/products', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res && res.data) {
      products.value = res.data
    }
  } catch (error) {
    console.error('Lỗi khi lấy danh sách sản phẩm:', error)
    loadError.value = error.response?.data?.message || 'Có lỗi xảy ra khi tải danh sách sản phẩm.'
    products.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchProducts()
})

const filteredProducts = computed(() => {
  return products.value.filter((product) => {
    const matchesSearch = searchQuery.value
      ? (product.name || '').toLowerCase().includes(searchQuery.value.toLowerCase())
      : true

    let matchesStatus = true
    if (currentStatus.value !== '') {
      matchesStatus = Number(product.status) === Number(currentStatus.value)
    }

    return matchesSearch && matchesStatus
  })
})

const openModalForCreate = () => {
  selectedProduct.value = null
  isModalOpen.value = true
}

const openModalForEdit = (product) => {
  selectedProduct.value = product
  isModalOpen.value = true
}

const handleToggleStatus = async (product) => {
  const newStatus = Number(product.status) === 1 ? 0 : 1
  const actionText = newStatus === 1 ? 'khôi phục' : 'ngừng kinh doanh'

  if (confirm(`Bạn có chắc muốn ${actionText} sản phẩm "${product.name}"?`)) {
    try {
      const token = localStorage.getItem('token')
      await axios.patch(
        `http://localhost:3000/api/admin/products/${product.id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchProducts()
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error)
      alert(error.response?.data?.message || 'Có lỗi xảy ra')
    }
  }
}
</script>

<style scoped>


/* ---- HEADER ---- */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 20px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  min-width: 0;
}

.header-titles {
  min-width: 0;
}

.brand-tag {
  font-size: 0.725rem;
  font-weight: 700;
  color: #0284c7;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px 0;
  letter-spacing: -0.02em;
}

.page-sub {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
}

.page-sub b {
  color: #0284c7;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #475569;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-top: 4px;
}

.btn-back:hover {
  background: #f1f5f9;
  color: #0284c7;
  border-color: #0284c7;
  transform: translateX(-2px);
}

/* ---- CARDS ---- */
.filter-card,
.table-card {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-sizing: border-box;
}

.filter-card {
  padding: 18px 24px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.table-card {
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

/* ---- LOADING ---- */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #0284c7;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
}

/* ---- ERROR ---- */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  gap: 10px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 6px;
}

.error-state h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
}

.error-state p {
  margin: 0 0 12px 0;
  color: #64748b;
  font-size: 0.9rem;
  max-width: 460px;
  line-height: 1.6;
}

.btn-retry {
  padding: 9px 22px;
  background: #0284c7;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.product-page {
  width: 100%;
  box-sizing: border-box;
}
.btn-retry:hover {
  background: #0369a1;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
  transform: translateY(-1px);
}

/* ---- RESPONSIVE ---- */
@media (max-width: 768px) {
  
  .page-title {
    font-size: 1.4rem;
  }
  .filter-card {
    padding: 14px 16px;
  }
  .header-left {
    flex-direction: column;
    gap: 12px;
  }
}
</style>