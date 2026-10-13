<template>
  <div class="table-container">
    <div class="table-responsive">
      <table class="table custom-table align-middle mb-0">
        <thead>
          <tr>
            <th class="ps-4" style="width: 75px">Ảnh</th>
            <th style="width: 22%">Tên sản phẩm</th>
            <th style="width: 13%">Danh mục</th>
            <!-- CỘT BIẾN THỂ: SKU + GIÁ + KHO RIÊNG -->
            <th style="width: 29%">Biến thể (Giá & Kho)</th>
            <!-- CỘT TỔNG TỒN CỘNG DỒN -->
            <th class="text-center" style="width: 11%">Tổng tồn</th>
            <th class="text-center" style="width: 120px">Trạng thái</th>
            <th class="text-center pe-4" style="width: 110px">Hành động</th>
          </tr>
        </thead>
        <tbody>
          <!-- Khi không có sản phẩm -->
          <tr v-if="products.length === 0">
            <td colspan="7" class="text-center py-5 text-muted">
              <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-secondary mb-2">
                  <path d="m7.5 4.27 9 5.15"></path>
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                  <path d="m3.3 7 8.7 5 8.7-5"></path>
                  <path d="M12 22V12"></path>
                </svg>
                <p class="mb-0 fw-semibold">Không tìm thấy sản phẩm nào phù hợp</p>
              </div>
            </td>
          </tr>

          <!-- Lặp qua sản phẩm -->
          <tr v-for="product in products" :key="product.id">
            <!-- ẢNH CHÍNH -->
            <td class="ps-4">
              <div class="img-thumb-wrap">
                <img
                  :src="
                    product.main_image
                      ? `http://localhost:3000/uploads/products/${product.main_image}`
                      : 'https://via.placeholder.com/60'
                  "
                  alt="Product Image"
                  class="product-thumb"
                />
              </div>
            </td>

            <!-- TÊN SẢN PHẨM -->
            <td>
              <span class="product-name" :title="product.name">
                {{ product.name }}
              </span>
              <span class="product-id-sub">ID: #{{ product.id }}</span>
            </td>

            <!-- DANH MỤC -->
            <td>
              <span class="category-badge">
                {{ product.category_name || product.Category?.name || 'Chưa phân loại' }}
              </span>
            </td>

            <!-- BIẾN THỂ: SKU + GIÁ + KHO TỪNG BIẾN THỂ -->
            <td>
              <div v-if="product.variants && product.variants.length > 0" class="variants-wrapper">
                <div
                  v-for="(v, vIndex) in product.variants"
                  :key="vIndex"
                  class="variant-chip"
                >
                  <div class="d-flex align-items-center gap-2">
                    <!-- Ảnh nhỏ biến thể -->
                    <img
                      v-if="v.image_url"
                      :src="`http://localhost:3000/uploads/variants/${v.image_url}`"
                      alt="Variant"
                      class="variant-thumb"
                      title="Ảnh biến thể"
                    />

                    <div class="variant-info">
                      <div class="d-flex align-items-center gap-2">
                        <span class="sku-tag">SKU: {{ v.sku || 'N/A' }}</span>

                        <!-- HIỂN THỊ STOCK_QUANTITY CỦA BIẾN THỂ -->
                        <span 
                          class="var-stock-tag"
                          :class="getVariantStock(v) > 0 ? 'stock-available' : 'stock-empty'"
                          :title="getVariantStock(v) > 0 ? 'Số lượng còn trong kho' : 'Biến thể này đã hết hàng'"
                        >
                          Kho: {{ getVariantStock(v) }}
                        </span>
                      </div>

                      <!-- Giá bán -->
                      <span class="price-tag">
                        <template v-if="v.sale_price && Number(v.sale_price) < Number(v.selling_price)">
                          <span class="old-price">{{ Number(v.selling_price).toLocaleString('vi-VN') }}đ</span>
                          <span class="sale-price">{{ Number(v.sale_price).toLocaleString('vi-VN') }}đ</span>
                        </template>
                        <template v-else>
                          <span class="regular-price">{{ Number(v.selling_price).toLocaleString('vi-VN') }}đ</span>
                        </template>
                      </span>

                      <!-- 🟢 THÊM HIỂN THỊ GIÁ GỐC (COST PRICE) -->
                      <span class="cost-price-tag text-muted d-block">
                        Giá gốc: {{ Number(v.cost_price || 0).toLocaleString('vi-VN') }}đ
                      </span>
                    </div>
                  </div>

                  <!-- Trạng thái biến thể -->
                  <span class="status-dot" :class="v.status === 1 ? 'dot-active' : 'dot-inactive'" :title="v.status === 1 ? 'Biến thể đang bật' : 'Biến thể tạm ẩn'"></span>
                </div>
              </div>
              <span v-else class="text-muted small fst-italic">Chưa có biến thể</span>
            </td>

            <!-- CỘT TỔNG TỒN -->
            <td class="text-center">
              <span 
                class="stock-pill"
                :class="getTotalQuantity(product) > 0 ? 'in-stock' : 'out-of-stock'"
              >
                {{ getTotalQuantity(product) }}
              </span>
            </td>

            <!-- TRẠNG THÁI SẢN PHẨM -->
            <td class="text-center">
              <span class="status-badge" :class="product.status === 1 ? 'status-active' : 'status-disabled'">
                {{ product.status === 1 ? 'Đang bán' : 'Ngừng bán' }}
              </span>
            </td>

            <!-- HÀNH ĐỘNG -->
            <td class="text-center pe-4">
              <div class="action-btn-group">
                <button
                  class="btn-action btn-edit"
                  @click="$emit('edit', product)"
                  title="Chỉnh sửa sản phẩm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                    <path d="m15 5 4 4"></path>
                  </svg>
                </button>
                <button
                  class="btn-action"
                  :class="product.status === 1 ? 'btn-lock' : 'btn-unlock'"
                  @click="$emit('toggle-status', product)"
                  :title="product.status === 1 ? 'Ngừng kinh doanh' : 'Khôi phục'"
                >
                  <svg v-if="product.status === 1" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  products: { type: Array, default: () => [] },
})
defineEmits(['edit', 'toggle-status'])

const getVariantStock = (v) => {
  return Number(v.stock_quantity || 0)
}

const getTotalQuantity = (product) => {
  if (!product.variants || product.variants.length === 0) return 0
  return product.variants.reduce((sum, v) => sum + getVariantStock(v), 0)
}
</script>

<style scoped>
.custom-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.custom-table thead th {
  background-color: #f8fafc;
  color: #64748b;
  font-size: 0.775rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 14px 12px;
  border-bottom: 1px solid #e2e8f0;
}

.custom-table tbody tr {
  transition: background-color 0.15s ease;
}

.custom-table tbody tr:hover {
  background-color: #f8fafc;
}

.custom-table tbody td {
  padding: 14px 12px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.img-thumb-wrap {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: #ffffff;
}

.product-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-name {
  display: block;
  font-weight: 700;
  color: #0f172a;
  font-size: 0.95rem;
  max-width: 280px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-id-sub {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 600;
}

.category-badge {
  display: inline-block;
  padding: 4px 10px;
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #334155;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

.variants-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 140px;
  overflow-y: auto;
  padding-right: 4px;
}

.variant-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.825rem;
}

.variant-thumb {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  object-fit: cover;
  border: 1px solid #cbd5e1;
}

.variant-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sku-tag {
  font-weight: 700;
  color: #0284c7;
  font-size: 0.775rem;
}

.var-stock-tag {
  font-size: 0.725rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  display: inline-block;
}

.stock-available {
  background-color: #f0f9ff;
  color: #0369a1;
  border: 1px solid #bae6fd;
}

.stock-empty {
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.price-tag {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}

.regular-price {
  font-weight: 700;
  color: #0f172a;
}

.sale-price {
  font-weight: 700;
  color: #ef4444;
}

.old-price {
  text-decoration: line-through;
  color: #94a3b8;
  font-size: 0.75rem;
}

/* 🟢 Style cho giá gốc */
.cost-price-tag {
  font-size: 0.75rem;
  color: #64748b;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-active { background-color: #10b981; }
.dot-inactive { background-color: #94a3b8; }

.stock-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 700;
}

.in-stock {
  background-color: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.out-of-stock {
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 50px;
  font-size: 0.775rem;
  font-weight: 700;
}
.status-active {
  background-color: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}
.status-disabled {
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.action-btn-group {
  display: inline-flex;
  gap: 6px;
}

.btn-action {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #ffffff;
}

.btn-edit {
  border-color: #cbd5e1;
  color: #0284c7;
}
.btn-edit:hover {
  background-color: #f0f9ff;
  border-color: #0284c7;
}

.btn-lock {
  border-color: #fecaca;
  color: #ef4444;
}
.btn-lock:hover {
  background-color: #fef2f2;
  border-color: #dc2626;
}

.btn-unlock {
  border-color: #a7f3d0;
  color: #10b981;
}
.btn-unlock:hover {
  background-color: #ecfdf5;
  border-color: #059669;
}
</style>