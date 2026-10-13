<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const API = 'http://localhost:3000/api'
const UPLOADS = 'http://localhost:3000/uploads'

const route = useRoute()
const router = useRouter()

const token = localStorage.getItem('token')
const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
const authHeaders = { headers: { Authorization: `Bearer ${token}` } }

// --- DỮ LIỆU ---
const product = ref(null)
const loading = ref(true)
const reviews = ref([])
const summary = ref({ total: 0, average: 0, star1: 0, star2: 0, star3: 0, star4: 0, star5: 0 })

// --- TRẠNG THÁI GIAO DIỆN ---
const selectedVariantId = ref(null)
const quantity = ref(1)
const activeImage = ref('')
const ratingFilter = ref(0) // 0 = tất cả
const lightboxSrc = ref('')

// --- TOAST ---
const toast = ref({ show: false, msg: '', type: 'success' })
let toastTimer = null
const showToast = (msg, type = 'success') => {
  toast.value = { show: true, msg, type }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value.show = false), 3000)
}

// --- GỌI API ---
const fetchProduct = async () => {
  loading.value = true
  product.value = null
  try {
    const res = await axios.get(`${API}/products/${route.params.id}/detail`)
    product.value = res.data

    // Mặc định chọn biến thể còn hàng đầu tiên
    const variants = product.value.variants || []
    const first = variants.find((v) => !isOutOfStock(v)) || variants[0]
    if (first) selectVariant(first)
    else activeImage.value = gallery.value[0] || ''
  } catch (error) {
    console.error('Lỗi tải sản phẩm:', error)
  } finally {
    loading.value = false
  }
}

const fetchReviews = async () => {
  try {
    const res = await axios.get(`${API}/products/${route.params.id}/reviews`)
    reviews.value = res.data.reviews
    summary.value = res.data.summary
  } catch (error) {
    console.error('Lỗi tải đánh giá:', error)
  }
}

// --- THƯ VIỆN ẢNH ---
const gallery = computed(() => {
  if (!product.value) return []
  const list = []
  if (product.value.main_image) list.push(`${UPLOADS}/products/${product.value.main_image}`)
  product.value.images.forEach((i) => list.push(`${UPLOADS}/products/${i.image_url}`))
  product.value.variants.forEach((v) => {
    if (v.image_url) {
      const src = `${UPLOADS}/variants/${v.image_url}`
      if (!list.includes(src)) list.push(src)
    }
  })
  return list
})

// --- BIẾN THỂ ---
const isOutOfStock = (v) => Number(v.stock_quantity) <= 0

const variantLabel = (v) => {
  const values = (v.attributes || []).map((a) => a.attribute_value)
  return values.length ? values.join(' / ') : v.sku
}

const selectedVariant = computed(
  () => product.value?.variants.find((v) => v.id === selectedVariantId.value) || null,
)

const selectVariant = (v) => {
  selectedVariantId.value = v.id
  quantity.value = 1
  if (v.image_url) activeImage.value = `${UPLOADS}/variants/${v.image_url}`
  else if (!activeImage.value) activeImage.value = gallery.value[0] || ''
}

const unitPrice = computed(() => {
  const v = selectedVariant.value
  if (!v) return 0
  return Number(v.sale_price || v.selling_price)
})

const formatMoney = (n) => Number(n).toLocaleString('vi-VN') + ' ₫'

const maxQuantity = computed(() => {
  const stock = Number(selectedVariant.value?.stock_quantity)
  return Number.isFinite(stock) && stock > 0 ? stock : 1
})

const normalizeQuantity = () => {
  let q = Math.floor(Number(quantity.value))
  if (!Number.isFinite(q) || q < 1) q = 1
  if (q > maxQuantity.value) q = maxQuantity.value
  quantity.value = q
}

// --- MUA HÀNG ---
const requireLogin = () => {
  if (!token) {
    showToast('Vui lòng đăng nhập để tiếp tục', 'error')
    return false
  }
  return true
}

const addToCart = async () => {
  if (!requireLogin() || !selectedVariant.value) return false
  normalizeQuantity()
  try {
    await axios.post(
      `${API}/cart`,
      { variant_id: selectedVariant.value.id, quantity: quantity.value },
      authHeaders,
    )
    showToast('Đã thêm vào giỏ hàng')
    return true
  } catch (error) {
    showToast(error.response?.data?.message || 'Thêm vào giỏ hàng thất bại', 'error')
    return false
  }
}

const buyNow = () => {
  if (!requireLogin() || !selectedVariant.value) return
  normalizeQuantity()
  const v = selectedVariant.value

  // Checkout đọc một MẢNG sản phẩm từ localStorage, giống trang giỏ hàng
  const checkoutPayload = [
    {
      variant_id: v.id,
      product_name: product.value.name,
      sku: v.sku,
      image: v.image_url,
      quantity: quantity.value,
      sale_price: v.sale_price,
      selling_price: v.selling_price,
    },
  ]
  localStorage.setItem('checkout_items', JSON.stringify(checkoutPayload))
  router.push('/checkout')
}

// --- ĐÁNH GIÁ ---
const filteredReviews = computed(() =>
  ratingFilter.value
    ? reviews.value.filter((r) => Number(r.rating) === ratingFilter.value)
    : reviews.value,
)

const percentOf = (count) => (summary.value.total ? (count / summary.value.total) * 100 : 0)

const stars = (n) => '★'.repeat(Number(n)) + '☆'.repeat(5 - Number(n))

const formatDate = (d) => new Date(d).toLocaleDateString('vi-VN')

const isEdited = (r) => new Date(r.updated_at).getTime() - new Date(r.created_at).getTime() > 60000

// Chỉ người viết mới thấy nút xóa (backend vẫn kiểm tra lại quyền)
const canDelete = (r) => !!token && Number(r.user_id) === Number(currentUser.id)

const deleteReview = async (review) => {
  if (!confirm('Bạn có chắc chắn muốn xóa đánh giá này không?')) return
  try {
    await axios.delete(`${API}/reviews/${review.id}`, authHeaders)
    showToast('Đã xóa đánh giá')
    await fetchReviews()
  } catch (error) {
    showToast(error.response?.data?.message || 'Xóa đánh giá thất bại', 'error')
  }
}

onMounted(() => {
  fetchProduct()
  fetchReviews()
})

// Chuyển từ sản phẩm này sang sản phẩm khác mà không rời trang
watch(
  () => route.params.id,
  (id) => {
    if (!id) return
    ratingFilter.value = 0
    fetchProduct()
    fetchReviews()
  },
)
</script>

<template>
  <div class="container py-4" style="max-width: 1100px">
    <router-link to="/home" class="btn btn-outline-secondary btn-sm mb-3">
      ← Quay về trang chủ
    </router-link>

    <div v-if="loading" class="text-center text-muted py-5">Đang tải sản phẩm...</div>

    <div v-else-if="!product" class="text-center py-5 bg-light rounded-3 border">
      <p class="fs-5 mb-1">Không tìm thấy sản phẩm</p>
      <p class="text-muted mb-0">Sản phẩm có thể đã ngừng kinh doanh hoặc đường dẫn không đúng.</p>
    </div>

    <template v-else>
      <!-- ========== THÔNG TIN SẢN PHẨM ========== -->
      <div class="row g-4">
        <!-- Thư viện ảnh -->
        <div class="col-md-6">
          <div class="main-image-box border rounded-3 mb-2">
            <img v-if="activeImage" :src="activeImage" :alt="product.name" class="main-image" />
            <span v-else class="text-muted">Chưa có ảnh</span>
          </div>
          <div v-if="gallery.length > 1" class="d-flex flex-wrap gap-2">
            <button
              v-for="src in gallery"
              :key="src"
              type="button"
              class="thumb"
              :class="{ active: src === activeImage }"
              @click="activeImage = src"
            >
              <img :src="src" alt="" />
            </button>
          </div>
        </div>

        <!-- Thông tin + mua hàng -->
        <div class="col-md-6">
          <p class="text-muted small mb-1">
            {{ product.category_name }}<span v-if="product.brand_name"> • {{ product.brand_name }}</span>
          </p>
          <h2 class="fw-bold mb-2">{{ product.name }}</h2>

          <div v-if="summary.total > 0" class="d-flex align-items-center gap-2 mb-3">
            <span class="star-text">{{ stars(Math.round(summary.average)) }}</span>
            <span class="fw-semibold">{{ summary.average }}</span>
            <a href="#reviews" class="text-muted small">({{ summary.total }} đánh giá)</a>
          </div>
          <p v-else class="text-muted small mb-3">Chưa có đánh giá</p>

          <div v-if="selectedVariant" class="mb-3">
            <span class="fs-3 fw-bold text-danger">{{ formatMoney(unitPrice) }}</span>
            <span
              v-if="selectedVariant.sale_price"
              class="ms-2 text-muted text-decoration-line-through"
            >
              {{ formatMoney(selectedVariant.selling_price) }}
            </span>
          </div>

          <!-- Chọn biến thể -->
          <div v-if="product.variants.length" class="mb-3">
            <p class="fw-semibold mb-2">Phân loại</p>
            <div class="d-flex flex-wrap gap-2">
              <button
                v-for="v in product.variants"
                :key="v.id"
                type="button"
                class="btn btn-sm variant-btn"
                :class="v.id === selectedVariantId ? 'btn-dark' : 'btn-outline-secondary'"
                :disabled="isOutOfStock(v)"
                @click="selectVariant(v)"
              >
                {{ variantLabel(v) }}
                <span v-if="isOutOfStock(v)" class="small">(hết hàng)</span>
              </button>
            </div>
            <p v-if="selectedVariant" class="small text-muted mt-2 mb-0">
              SKU: {{ selectedVariant.sku }}
              <span v-if="!isOutOfStock(selectedVariant)"> • Còn {{ selectedVariant.stock_quantity }} sản phẩm</span>
            </p>
          </div>
          <p v-else class="text-danger">Sản phẩm hiện chưa có phân loại để bán.</p>

          <!-- Số lượng + nút mua -->
          <div v-if="selectedVariant" class="d-flex align-items-center gap-3 mb-3">
            <label for="qty" class="fw-semibold mb-0">Số lượng</label>
            <input
              id="qty"
              v-model.number="quantity"
              type="number"
              min="1"
              :max="maxQuantity"
              class="form-control text-center"
              style="width: 90px"
              :disabled="isOutOfStock(selectedVariant)"
              @change="normalizeQuantity"
            />
          </div>

          <div class="d-flex flex-wrap gap-2">
            <button
              class="btn btn-outline-success btn-lg"
              :disabled="!selectedVariant || isOutOfStock(selectedVariant)"
              @click="addToCart"
            >
              Thêm vào giỏ
            </button>
            <button
              class="btn btn-danger btn-lg px-4"
              :disabled="!selectedVariant || isOutOfStock(selectedVariant)"
              @click="buyNow"
            >
              Mua ngay
            </button>
          </div>
        </div>
      </div>

      <!-- ========== MÔ TẢ ========== -->
      <section class="mt-5">
        <h4 class="fw-bold mb-3">Mô tả sản phẩm</h4>
        <p v-if="product.description" class="description">{{ product.description }}</p>
        <p v-else class="text-muted">Sản phẩm chưa có mô tả.</p>
      </section>

      <!-- ========== ĐÁNH GIÁ ========== -->
      <section id="reviews" class="mt-5">
        <h4 class="fw-bold mb-3">Đánh giá từ khách hàng</h4>

        <div v-if="summary.total === 0" class="text-center py-5 bg-light rounded-3 border">
          <p class="mb-1 fs-5">Chưa có đánh giá nào</p>
          <p class="text-muted mb-0">Hãy mua sản phẩm và là người đầu tiên chia sẻ cảm nhận.</p>
        </div>

        <template v-else>
          <!-- Tổng quan -->
          <div class="row g-4 align-items-center border rounded-3 p-3 mb-3">
            <div class="col-md-3 text-center">
              <div class="display-5 fw-bold">{{ summary.average }}<span class="fs-5 text-muted">/5</span></div>
              <div class="star-text fs-5">{{ stars(Math.round(summary.average)) }}</div>
              <div class="text-muted small">{{ summary.total }} đánh giá</div>
            </div>
            <div class="col-md-9">
              <div v-for="n in [5, 4, 3, 2, 1]" :key="n" class="d-flex align-items-center gap-2 mb-1">
                <span class="small" style="width: 36px">{{ n }} ★</span>
                <div class="progress flex-grow-1" style="height: 8px">
                  <div class="progress-bar bg-warning" :style="{ width: percentOf(summary['star' + n]) + '%' }"></div>
                </div>
                <span class="small text-muted text-end" style="width: 32px">{{ summary['star' + n] }}</span>
              </div>
            </div>
          </div>

          <!-- Bộ lọc theo sao -->
          <div class="d-flex flex-wrap gap-2 mb-3">
            <button
              class="btn btn-sm"
              :class="ratingFilter === 0 ? 'btn-dark' : 'btn-outline-secondary'"
              @click="ratingFilter = 0"
            >
              Tất cả ({{ summary.total }})
            </button>
            <button
              v-for="n in [5, 4, 3, 2, 1]"
              :key="n"
              class="btn btn-sm"
              :class="ratingFilter === n ? 'btn-dark' : 'btn-outline-secondary'"
              :disabled="summary['star' + n] === 0"
              @click="ratingFilter = n"
            >
              {{ n }} sao ({{ summary['star' + n] }})
            </button>
          </div>

          <!-- Danh sách -->
          <article v-for="r in filteredReviews" :key="r.id" class="review border-bottom py-3">
            <div class="d-flex justify-content-between align-items-start gap-3">
              <div class="d-flex gap-3">
                <div class="avatar">{{ (r.user_name || '?').charAt(0).toUpperCase() }}</div>
                <div>
                  <div class="fw-semibold">{{ r.user_name }}</div>
                  <div class="star-text">{{ stars(r.rating) }}</div>
                  <div class="small text-muted">
                    {{ formatDate(r.created_at) }}
                    <span v-if="isEdited(r)"> (đã chỉnh sửa)</span>
                    <span v-if="r.sku"> • Phân loại: {{ r.sku }}</span>
                  </div>
                </div>
              </div>

              <button
                v-if="canDelete(r)"
                class="btn btn-outline-danger btn-sm flex-shrink-0"
                @click="deleteReview(r)"
              >
                Xóa đánh giá
              </button>
            </div>

            <h6 v-if="r.title" class="fw-semibold mt-3 mb-1">{{ r.title }}</h6>
            <p class="mb-2" :class="{ 'mt-3': !r.title }" style="white-space: pre-line">{{ r.content }}</p>

            <div v-if="r.images && r.images.length" class="d-flex flex-wrap gap-2 mb-2">
              <button
                v-for="img in r.images"
                :key="img"
                type="button"
                class="review-img"
                @click="lightboxSrc = `${UPLOADS}/images_review/${img}`"
              >
                <img :src="`${UPLOADS}/images_review/${img}`" alt="Ảnh đánh giá" />
              </button>
            </div>

            <div v-if="r.reply" class="reply rounded-2 p-3 mt-2">
              <div class="fw-semibold small mb-1">Phản hồi từ cửa hàng</div>
              <div style="white-space: pre-line">{{ r.reply }}</div>
            </div>
          </article>

          <p v-if="filteredReviews.length === 0" class="text-muted text-center py-4">
            Không có đánh giá nào ở mức sao này.
          </p>
        </template>
      </section>
    </template>

    <!-- Xem ảnh đánh giá phóng to -->
    <div v-if="lightboxSrc" class="lightbox" @click="lightboxSrc = ''">
      <img :src="lightboxSrc" alt="Ảnh đánh giá phóng to" />
    </div>

    <!-- Thông báo -->
    <div
      v-if="toast.show"
      class="toast-box"
      :class="toast.type === 'error' ? 'bg-danger' : 'bg-success'"
      role="status"
    >
      {{ toast.msg }}
    </div>
  </div>
</template>

<style scoped>
.main-image-box {
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  overflow: hidden;
}
.main-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.thumb {
  width: 64px;
  height: 64px;
  padding: 0;
  border: 2px solid #dee2e6;
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
  cursor: pointer;
}
.thumb.active {
  border-color: #212529;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.variant-btn:disabled {
  text-decoration: line-through;
}
.description {
  white-space: pre-line;
  max-width: 75ch;
  line-height: 1.7;
}
.star-text {
  color: #f5a623;
  letter-spacing: 1px;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e9ecef;
  color: #495057;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.review p {
  max-width: 75ch;
}
.review-img {
  width: 84px;
  height: 84px;
  padding: 0;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  overflow: hidden;
  cursor: zoom-in;
  background: #fff;
}
.review-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.reply {
  background: #f1f3f5;
  border-left: 3px solid #adb5bd;
}
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  cursor: zoom-out;
  padding: 20px;
}
.lightbox img {
  max-width: 100%;
  max-height: 100%;
  border-radius: 6px;
}
.toast-box {
  position: fixed;
  right: 20px;
  bottom: 20px;
  color: #fff;
  padding: 12px 18px;
  border-radius: 6px;
  z-index: 3000;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.2);
}
</style>