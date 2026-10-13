<template>
  <div class="product-page-wrapper">
    <!-- Header trang: Nút quay lại & Tiêu đề -->
    <div class="page-header d-flex justify-content-between align-items-center mb-4">
      <div class="d-flex align-items-center gap-3">
        <button class="btn-back" @click="goBack" title="Quay lại">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Quay lại</span>
        </button>
        <div>
          <div class="brand-tag">E-COMMERCE CATALOG</div>
          <h2 class="page-title mb-0">Quản Lý Sản Phẩm</h2>
        </div>
      </div>
    </div>

    <!-- Thanh công cụ tìm kiếm và lọc -->
    <div class="filter-card mb-4 shadow-sm">
      <ProductFilter
        v-model:search="searchQuery"
        v-model:status="currentStatus"
        @open-add-modal="openModalForCreate"
      />
    </div>

    <!-- Bảng danh sách sản phẩm -->
    <div class="table-card shadow-sm mb-4">
      <ProductTable 
        :products="filteredProducts" 
        @edit="openModalForEdit" 
        @toggle-status="handleToggleStatus" 
      />
    </div>

    <!-- Modal Thêm / Sửa sản phẩm -->
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

const goBack = () => {
  router.back()
}

const fetchProducts = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('http://localhost:3000/api/admin/products', {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res && res.data) {
      products.value = res.data
    }
  } catch (error) {
    console.error('Lỗi khi lấy danh sách sản phẩm:', error)
  }
}

onMounted(() => {
  fetchProducts()
})

const filteredProducts = computed(() => {
  return products.value.filter((product) => {
    const matchesSearch = searchQuery.value
      ? product.name.toLowerCase().includes(searchQuery.value.toLowerCase())
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
      alert(`Đã ${actionText} sản phẩm thành công!`)
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error)
      alert(error.response?.data?.message || 'Có lỗi xảy ra')
    }
  }
}
</script>

<style scoped>
/* Tràn toàn màn hình máy tính với background tech */
.product-page-wrapper {
  min-height: 100vh;
  width: 100%;
  background-color: #f8fafc;
  background-image: 
    linear-gradient(rgba(226, 232, 240, 0.6) 1px, transparent 1px),
    linear-gradient(90deg, rgba(226, 232, 240, 0.6) 1px, transparent 1px);
  background-size: 32px 32px;
  padding: 30px 40px;
  box-sizing: border-box;
}

.brand-tag {
  font-size: 0.725rem;
  font-weight: 700;
  color: #0284c7;
  letter-spacing: 0.08em;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #475569;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-back:hover {
  background: #f1f5f9;
  color: #0284c7;
  border-color: #0284c7;
}

.filter-card, .table-card {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-sizing: border-box;
}

.filter-card {
  padding: 18px 24px;
}
</style>