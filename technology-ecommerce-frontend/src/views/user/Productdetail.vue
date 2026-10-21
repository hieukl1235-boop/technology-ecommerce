<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
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
const ratingFilter = ref(0)
const lightboxSrc = ref('')

// --- TOAST ---
const toast = ref({ show: false, msg: '', type: 'success' })
let toastTimer = null
const showToast = (msg, type = 'success') => {
  toast.value = { show: true, msg, type }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value.show = false), 3000)
}

// --- MODAL XÁC NHẬN XÓA ---
const showDeleteModal = ref(false)
const deleteTarget = ref(null)

// --- SẢN PHẨM ĐỀ XUẤT ---
const recommend = ref([])
const productRecommend = ref([])
const collaborativeRecommend = ref([])
const collaborativeProducts = ref([])
const getCollaborativeRecommend = async () => {
  try {
    const res = await axios.get(
      `http://localhost:5000/api/products/${route.params.id}/collaborative-recommendations`,
    )

    collaborativeRecommend.value = res.data.recommendations || []

    // Lấy thông tin chi tiết từng sản phẩm để giao diện có dữ liệu hiển thị
    collaborativeProducts.value = await Promise.all(
      collaborativeRecommend.value.map(async (item) => {
        const detailRes = await axios.get(`http://localhost:3000/api/${item.product_id}`)

        return {
          ...detailRes.data,
          similarity: item.similarity,
        }
      }),
    )
  } catch (error) {
    console.error('Lỗi tải gợi ý theo lịch sử mua:', error.message)
    collaborativeRecommend.value = []
    collaborativeProducts.value = []
  }
}
// --- GỌI API SẢN PHẨM ---
const fetchProduct = async () => {
  loading.value = true
  product.value = null
  try {
    const res = await axios.get(`${API}/products/${route.params.id}/detail`)
    product.value = res.data

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

// --- LẤY SẢN PHẨM ĐỀ XUẤT ---
const getRecommend = async () => {
  try {
    const res = await axios.get(
      `http://localhost:5000/api/products/${route.params.id}/recommendations`,
    )
    recommend.value = res.data.recommendations || []
    await getProductRecommend()
  } catch (error) {
    console.error('Lỗi gọi API recommendations:', error.message)
    // Fallback: lấy sản phẩm cùng danh mục từ API trang chủ
    try {
      if (!product.value?.category_id) return
      const res = await axios.get(`${API}/`, {
        params: { category_id: product.value.category_id, limit: 8 },
      })
      const list = Array.isArray(res.data) ? res.data : res.data.data || []
      productRecommend.value = list
        .filter((p) => Number(p.id) !== Number(route.params.id))
        .slice(0, 4)
    } catch (fallbackErr) {
      console.error('Fallback cũng lỗi:', fallbackErr.message)
    }
  }
}

const getProductRecommend = async () => {
  if (recommend.value.length === 0) return

  try {
    const results = await Promise.all(
      recommend.value.map(async (item) => {
        const res = await axios.get(`http://localhost:3000/api/${item.product_id}`)
        return res.data
      }),
    )
    productRecommend.value = results
  } catch (error) {
    console.error('Lỗi lấy dữ liệu sản phẩm:', error.message)
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

const discountPercent = computed(() => {
  const v = selectedVariant.value
  if (!v || !v.sale_price) return 0
  const sale = Number(v.sale_price)
  const sell = Number(v.selling_price)
  if (!sell || sale >= sell) return 0
  return Math.round((1 - sale / sell) * 100)
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

const stepQuantity = (delta) => {
  let q = Number(quantity.value) + delta
  if (q < 1) q = 1
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
    showToast('Đã thêm vào giỏ hàng', 'success')
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

const canDelete = (r) => !!token && Number(r.user_id) === Number(currentUser.id)

const deleteReview = (review) => {
  deleteTarget.value = review
  showDeleteModal.value = true
}

const confirmDeleteReview = async () => {
  if (!deleteTarget.value) return
  try {
    await axios.delete(`${API}/reviews/${deleteTarget.value.id}`, authHeaders)
    showToast('Đã xóa đánh giá', 'success')
    showDeleteModal.value = false
    deleteTarget.value = null
    await fetchReviews()
  } catch (error) {
    showToast(error.response?.data?.message || 'Xóa đánh giá thất bại', 'error')
  }
}

onMounted(() => {
  fetchProduct()
  fetchReviews()
  getRecommend()
  getCollaborativeRecommend()
})

onBeforeUnmount(() => {
  clearTimeout(toastTimer)
})

watch(
  () => route.params.id,
  (id) => {
    if (!id) return

    ratingFilter.value = 0
    recommend.value = []
    productRecommend.value = []
    collaborativeRecommend.value = []
    collaborativeProducts.value = []

    fetchProduct()
    fetchReviews()
    getRecommend()
    getCollaborativeRecommend()
  },
)
</script>

<template>
  <div class="pd-page">
    <!-- HEADER -->
    <header class="pd-top">
      <div class="pd-top-inner">
        <RouterLink to="/home" class="brand" aria-label="TechStore - Trang chủ">
          Tech<span>Store</span>
        </RouterLink>
        <RouterLink to="/cart" class="cart-link"> 🛒 Giỏ hàng </RouterLink>
      </div>
    </header>

    <main class="pd-main">
      <RouterLink to="/home" class="btn-back">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Quay về trang chủ</span>
      </RouterLink>

      <!-- LOADING -->
      <div v-if="loading" class="state-box">
        <div class="spinner"></div>
        <p>Đang tải sản phẩm...</p>
      </div>

      <!-- NOT FOUND -->
      <div v-else-if="!product" class="state-box">
        <div class="state-icon">📦</div>
        <p class="state-title">Không tìm thấy sản phẩm</p>
        <p class="state-sub">Sản phẩm có thể đã ngừng kinh doanh hoặc đường dẫn không đúng.</p>
      </div>

      <template v-else>
        <!-- TOP SECTION -->
        <section class="pd-top-section">
          <!-- Gallery -->
          <div class="gallery">
            <div class="main-image-box">
              <img v-if="activeImage" :src="activeImage" :alt="product.name" class="main-image" />
              <div v-else class="no-image">Chưa có ảnh</div>
              <span v-if="discountPercent > 0" class="discount-badge">
                -{{ discountPercent }}%
              </span>
            </div>

            <div v-if="gallery.length > 1" class="thumb-list">
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

          <!-- Info -->
          <div class="info">
            <p class="breadcrumb">
              {{ product.category_name
              }}<span v-if="product.brand_name"> • {{ product.brand_name }}</span>
            </p>

            <h1 class="pd-title">{{ product.name }}</h1>

            <!-- Rating summary -->
            <div v-if="summary.total > 0" class="rating-row">
              <span class="star-text">{{ stars(Math.round(summary.average)) }}</span>
              <b>{{ summary.average }}</b>
              <a href="#reviews" class="rating-link">({{ summary.total }} đánh giá)</a>
            </div>
            <p v-else class="no-rating">Chưa có đánh giá</p>

            <!-- Price -->
            <div v-if="selectedVariant" class="price-block">
              <span class="price-sale">{{ formatMoney(unitPrice) }}</span>
              <span v-if="selectedVariant.sale_price" class="price-original">
                {{ formatMoney(selectedVariant.selling_price) }}
              </span>
            </div>

            <!-- Variants -->
            <div v-if="product.variants.length" class="variant-section">
              <p class="section-label">Phân loại</p>
              <div class="variant-list">
                <button
                  v-for="v in product.variants"
                  :key="v.id"
                  type="button"
                  class="variant-btn"
                  :class="{ active: v.id === selectedVariantId, disabled: isOutOfStock(v) }"
                  :disabled="isOutOfStock(v)"
                  @click="selectVariant(v)"
                >
                  <span>{{ variantLabel(v) }}</span>
                  <span v-if="isOutOfStock(v)" class="variant-sold-out">Hết hàng</span>
                </button>
              </div>
              <p v-if="selectedVariant" class="variant-meta">
                SKU: {{ selectedVariant.sku }}
                <span v-if="!isOutOfStock(selectedVariant)">
                  • Còn {{ selectedVariant.stock_quantity }} sản phẩm
                </span>
              </p>
            </div>
            <p v-else class="no-variant">Sản phẩm hiện chưa có phân loại để bán.</p>

            <!-- Quantity -->
            <div v-if="selectedVariant" class="qty-block">
              <label class="section-label">Số lượng</label>
              <div class="qty-control">
                <button
                  type="button"
                  class="qty-btn"
                  :disabled="quantity <= 1 || isOutOfStock(selectedVariant)"
                  @click="stepQuantity(-1)"
                >
                  −
                </button>
                <input
                  v-model.number="quantity"
                  type="number"
                  min="1"
                  :max="maxQuantity"
                  class="qty-input"
                  :disabled="isOutOfStock(selectedVariant)"
                  @change="normalizeQuantity"
                />
                <button
                  type="button"
                  class="qty-btn"
                  :disabled="quantity >= maxQuantity || isOutOfStock(selectedVariant)"
                  @click="stepQuantity(1)"
                >
                  +
                </button>
              </div>
            </div>

            <!-- Actions -->
            <div class="action-buttons">
              <button
                class="btn-add-cart"
                :disabled="!selectedVariant || isOutOfStock(selectedVariant)"
                @click="addToCart"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <span>Thêm vào giỏ</span>
              </button>
              <button
                class="btn-buy-now"
                :disabled="!selectedVariant || isOutOfStock(selectedVariant)"
                @click="buyNow"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                <span>Mua ngay</span>
              </button>
            </div>

            <!-- Trust badges -->
            <div class="trust-row">
              <div class="trust-item">
                <span>🚚</span>
                <span>Miễn phí giao hàng từ 500K</span>
              </div>
              <div class="trust-item">
                <span>🛡️</span>
                <span>Bảo hành chính hãng</span>
              </div>
              <div class="trust-item">
                <span>🔄</span>
                <span>Đổi trả 30 ngày</span>
              </div>
            </div>
          </div>
        </section>

        <!-- DESCRIPTION -->
        <section class="section-block">
          <h2 class="section-title">
            <span class="section-icon">📝</span>
            Mô tả sản phẩm
          </h2>
          <p v-if="product.description" class="description">{{ product.description }}</p>
          <p v-else class="text-muted">Sản phẩm chưa có mô tả.</p>
        </section>

        <!-- REVIEWS -->
        <section id="reviews" class="section-block">
          <h2 class="section-title">
            <span class="section-icon">⭐</span>
            Đánh giá từ khách hàng
          </h2>

          <div v-if="summary.total === 0" class="review-empty">
            <div class="review-empty-icon">💬</div>
            <p class="review-empty-title">Chưa có đánh giá nào</p>
            <p class="review-empty-sub">Hãy mua sản phẩm và là người đầu tiên chia sẻ cảm nhận.</p>
          </div>

          <template v-else>
            <div class="review-overview">
              <div class="overview-score">
                <div class="score-big">{{ summary.average }}<span class="score-max">/5</span></div>
                <div class="star-text star-big">{{ stars(Math.round(summary.average)) }}</div>
                <div class="score-total">{{ summary.total }} đánh giá</div>
              </div>

              <div class="overview-bars">
                <div v-for="n in [5, 4, 3, 2, 1]" :key="n" class="bar-row">
                  <span class="bar-label">{{ n }} ★</span>
                  <div class="bar-track">
                    <div
                      class="bar-fill"
                      :style="{ width: percentOf(summary['star' + n]) + '%' }"
                    ></div>
                  </div>
                  <span class="bar-count">{{ summary['star' + n] }}</span>
                </div>
              </div>
            </div>

            <div class="filter-row">
              <button
                class="filter-btn"
                :class="{ active: ratingFilter === 0 }"
                @click="ratingFilter = 0"
              >
                Tất cả ({{ summary.total }})
              </button>
              <button
                v-for="n in [5, 4, 3, 2, 1]"
                :key="n"
                class="filter-btn"
                :class="{ active: ratingFilter === n }"
                :disabled="summary['star' + n] === 0"
                @click="ratingFilter = n"
              >
                {{ n }} sao ({{ summary['star' + n] }})
              </button>
            </div>

            <div class="review-list">
              <article v-for="r in filteredReviews" :key="r.id" class="review-item">
                <div class="review-head">
                  <div class="review-user">
                    <div class="avatar">{{ (r.user_name || '?').charAt(0).toUpperCase() }}</div>
                    <div class="user-info">
                      <span class="user-name">{{ r.user_name }}</span>
                      <span class="star-text">{{ stars(r.rating) }}</span>
                      <span class="review-meta">
                        {{ formatDate(r.created_at) }}
                        <span v-if="isEdited(r)"> · đã chỉnh sửa</span>
                        <span v-if="r.sku"> · Phân loại: {{ r.sku }}</span>
                      </span>
                    </div>
                  </div>

                  <button
                    v-if="canDelete(r)"
                    class="btn-delete-review"
                    @click="deleteReview(r)"
                    title="Xóa đánh giá"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path
                        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                      ></path>
                    </svg>
                  </button>
                </div>

                <h3 v-if="r.title" class="review-title">{{ r.title }}</h3>
                <p class="review-content">{{ r.content }}</p>

                <div v-if="r.images && r.images.length" class="review-images">
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

                <div v-if="r.reply" class="review-reply">
                  <div class="reply-label">Phản hồi từ cửa hàng</div>
                  <div class="reply-content">{{ r.reply }}</div>
                </div>
              </article>
            </div>

            <p v-if="filteredReviews.length === 0" class="no-filter-result">
              Không có đánh giá nào ở mức sao này.
            </p>
          </template>
        </section>

        <!-- ========== SẢN PHẨM ĐỀ XUẤT ========== -->
        <section class="section-block" v-if="productRecommend.length > 0">
          <h2 class="section-title">
            <span class="section-icon">🎯</span>
            Sản phẩm tương tự
          </h2>

          <div class="related-grid">
            <RouterLink
              v-for="rp in productRecommend"
              :key="rp.id"
              :to="`/product/${rp.id}`"
              class="related-card"
            >
              <div class="related-img-box">
                <img
                  v-if="rp.main_image"
                  :src="`${UPLOADS}/products/${rp.main_image}`"
                  :alt="rp.name"
                  class="related-img"
                  loading="lazy"
                />
                <div v-else class="related-img related-img-empty">📦</div>
              </div>

              <div class="related-info">
                <h3 class="related-name" :title="rp.name">{{ rp.name }}</h3>

                <div class="related-price" v-if="rp.variants && rp.variants.length">
                  <template
                    v-if="
                      rp.variants[0].sale_price &&
                      Number(rp.variants[0].sale_price) < Number(rp.variants[0].selling_price)
                    "
                  >
                    <span class="related-price-sale">
                      {{ Number(rp.variants[0].sale_price).toLocaleString('vi-VN') }}đ
                    </span>
                    <span class="related-price-origin">
                      {{ Number(rp.variants[0].selling_price).toLocaleString('vi-VN') }}đ
                    </span>
                  </template>
                  <template v-else>
                    <span class="related-price-sale">
                      {{ Number(rp.variants[0].selling_price).toLocaleString('vi-VN') }}đ
                    </span>
                  </template>
                </div>

                <span v-if="rp.brand_name" class="related-brand">
                  {{ rp.brand_name }}
                </span>
              </div>
            </RouterLink>
          </div>
        </section>
        <section class="section-block" v-if="productRecommend.length > 0">
          <h2 class="section-title">
            <span class="section-icon">🎯</span>
            Khách hàng mua sản phẩm này cũng thường chọn
          </h2>

          <div class="related-grid">
            <RouterLink
              v-for="rp in collaborativeProducts"
              :key="rp.id"
              :to="`/product/${rp.id}`"
              class="related-card"
            >
              <div class="related-img-box">
                <img
                  v-if="rp.main_image"
                  :src="`${UPLOADS}/products/${rp.main_image}`"
                  :alt="rp.name"
                  class="related-img"
                  loading="lazy"
                />
                <div v-else class="related-img related-img-empty">📦</div>
              </div>

              <div class="related-info">
                <h3 class="related-name" :title="rp.name">{{ rp.name }}</h3>

                <div class="related-price" v-if="rp.variants && rp.variants.length">
                  <template
                    v-if="
                      rp.variants[0].sale_price &&
                      Number(rp.variants[0].sale_price) < Number(rp.variants[0].selling_price)
                    "
                  >
                    <span class="related-price-sale">
                      {{ Number(rp.variants[0].sale_price).toLocaleString('vi-VN') }}đ
                    </span>
                    <span class="related-price-origin">
                      {{ Number(rp.variants[0].selling_price).toLocaleString('vi-VN') }}đ
                    </span>
                  </template>
                  <template v-else>
                    <span class="related-price-sale">
                      {{ Number(rp.variants[0].selling_price).toLocaleString('vi-VN') }}đ
                    </span>
                  </template>
                </div>

                <span v-if="rp.brand_name" class="related-brand">
                  {{ rp.brand_name }}
                </span>
              </div>
            </RouterLink>
          </div>
        </section>
      </template>
    </main>

    <!-- LIGHTBOX -->
    <transition name="fade">
      <div v-if="lightboxSrc" class="lightbox" @click="lightboxSrc = ''">
        <img :src="lightboxSrc" alt="Ảnh đánh giá phóng to" @click.stop />
        <button class="lightbox-close" @click="lightboxSrc = ''" title="Đóng">✕</button>
      </div>
    </transition>

    <!-- MODAL XÓA ĐÁNH GIÁ -->
    <transition name="fade">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
        <div class="modal-card">
          <div class="confirm-icon">🗑️</div>
          <h3>Xóa đánh giá?</h3>
          <p>Bạn có chắc chắn muốn xóa đánh giá này không? Hành động này không thể hoàn tác.</p>
          <div class="modal-actions">
            <button class="btn-cancel-tech" @click="showDeleteModal = false">Hủy</button>
            <button class="btn-danger-tech" @click="confirmDeleteReview">Xóa</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- TOAST -->
    <transition name="slide-fade">
      <div
        v-if="toast.show"
        class="toast-box"
        :class="toast.type === 'error' ? 'toast-error' : 'toast-success'"
      >
        <span>{{ toast.type === 'error' ? '⚠️' : '✅' }}</span>
        <span>{{ toast.msg }}</span>
      </div>
    </transition>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap');

.pd-page {
  --ink: #0f1b2d;
  --muted: #5b6b7f;
  --line: #e3e8ef;
  --bg: #f5f7fa;
  --brand: #0a6cff;
  --price: #e5322d;
  --star: #f5a623;

  font-family: 'Be Vietnam Pro', 'Segoe UI', system-ui, sans-serif;
  color: var(--ink);
  background: var(--bg);
  min-height: 100vh;
}
.pd-page *,
.pd-page *::before,
.pd-page *::after {
  box-sizing: border-box;
}

/* Header */
.pd-top {
  background: #fff;
  border-bottom: 1px solid var(--line);
  position: sticky;
  top: 0;
  z-index: 100;
}
.pd-top-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ink);
  text-decoration: none;
}
.brand span {
  color: var(--brand);
}
.cart-link {
  padding: 8px 16px;
  background: #f0f9ff;
  border: 1px solid #bfdbfe;
  color: var(--brand);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
}
.cart-link:hover {
  background: var(--brand);
  color: #fff;
  border-color: var(--brand);
}

/* Main */
.pd-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 60px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--muted);
  font-weight: 600;
  font-size: 13px;
  text-decoration: none;
  transition: all 0.2s;
  margin-bottom: 20px;
}
.btn-back:hover {
  background: #f0f9ff;
  color: var(--brand);
  border-color: var(--brand);
  transform: translateX(-2px);
}

/* State */
.state-box {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 60px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.state-icon {
  font-size: 48px;
  opacity: 0.5;
}
.state-title {
  margin: 0;
  font-weight: 700;
  color: var(--ink);
  font-size: 16px;
}
.state-sub {
  margin: 0;
  font-size: 14px;
  color: var(--muted);
  max-width: 340px;
}
.state-box p {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--line);
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Top section */
.pd-top-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 30px;
}

/* Gallery */
.gallery {
  min-width: 0;
}
.main-image-box {
  position: relative;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
}
.main-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.4s;
}
.main-image-box:hover .main-image {
  transform: scale(1.03);
}
.no-image {
  color: var(--muted);
  font-size: 14px;
}

.discount-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 5px 12px;
  background: var(--price);
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(229, 50, 45, 0.3);
}

.thumb-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.thumb {
  width: 68px;
  height: 68px;
  padding: 0;
  border: 2px solid var(--line);
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}
.thumb.active {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(10, 108, 255, 0.15);
}
.thumb:hover:not(.active) {
  border-color: #94a3b8;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Info */
.info {
  min-width: 0;
}

.breadcrumb {
  margin: 0 0 10px;
  font-size: 13px;
  color: var(--muted);
  font-weight: 500;
}

.pd-title {
  margin: 0 0 14px;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: -0.01em;
}

.rating-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.star-text {
  color: var(--star);
  letter-spacing: 1.5px;
}
.star-big {
  font-size: 22px;
}
.rating-row b {
  color: var(--ink);
  font-size: 15px;
}
.rating-link {
  font-size: 13px;
  color: var(--muted);
  text-decoration: none;
}
.rating-link:hover {
  color: var(--brand);
  text-decoration: underline;
}
.no-rating {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--muted);
  font-style: italic;
}

.price-block {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 14px 18px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.price-sale {
  font-size: 30px;
  font-weight: 800;
  color: var(--price);
  letter-spacing: -0.02em;
}
.price-original {
  font-size: 16px;
  color: var(--muted);
  text-decoration: line-through;
}

/* Variants */
.variant-section {
  margin-bottom: 20px;
}
.section-label {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.variant-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.variant-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  background: #fff;
  border: 1.5px solid var(--line);
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink);
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.variant-btn:hover:not(:disabled):not(.active) {
  border-color: var(--brand);
  color: var(--brand);
}
.variant-btn.active {
  background: var(--brand);
  color: #fff;
  border-color: var(--brand);
  box-shadow: 0 4px 12px rgba(10, 108, 255, 0.25);
}
.variant-btn.disabled,
.variant-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  text-decoration: line-through;
}
.variant-sold-out {
  font-size: 11px;
  color: var(--price);
  font-weight: 700;
}
.variant-btn.active .variant-sold-out {
  color: #fecaca;
}

.variant-meta {
  margin: 10px 0 0;
  font-size: 12.5px;
  color: var(--muted);
}

.no-variant {
  color: var(--price);
  font-size: 14px;
  font-weight: 600;
}

/* Quantity */
.qty-block {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}
.qty-block .section-label {
  margin: 0;
}

.qty-control {
  display: flex;
  align-items: center;
  border: 1.5px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
}
.qty-btn {
  width: 38px;
  height: 40px;
  border: 0;
  background: #fff;
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
  cursor: pointer;
  transition: background 0.15s;
  font-family: inherit;
}
.qty-btn:hover:not(:disabled) {
  background: #f0f9ff;
  color: var(--brand);
}
.qty-btn:disabled {
  color: #cbd5e1;
  cursor: not-allowed;
}

.qty-input {
  width: 58px;
  height: 40px;
  border: 0;
  border-left: 1.5px solid var(--line);
  border-right: 1.5px solid var(--line);
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
  font-family: inherit;
  -moz-appearance: textfield;
  outline: none;
}
.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.qty-input:focus {
  background: #f0f9ff;
}

/* Actions */
.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.btn-add-cart,
.btn-buy-now {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  border-radius: 12px;
  font-family: inherit;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}
.btn-add-cart:disabled,
.btn-buy-now:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.btn-add-cart {
  background: #fff;
  color: var(--brand);
  border: 2px solid var(--brand);
}
.btn-add-cart:hover:not(:disabled) {
  background: #f0f9ff;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(10, 108, 255, 0.15);
}

.btn-buy-now {
  background: var(--price);
  color: #fff;
  box-shadow: 0 4px 12px rgba(229, 50, 45, 0.25);
}
.btn-buy-now:hover:not(:disabled) {
  background: #c9231e;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(229, 50, 45, 0.35);
}

/* Trust */
.trust-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  background: #f8fafc;
  border: 1px solid var(--line);
  border-radius: 10px;
}
.trust-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--muted);
  font-weight: 500;
}
.trust-item span:first-child {
  font-size: 16px;
}

/* Sections */
.section-block {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: -0.01em;
}
.section-icon {
  font-size: 20px;
}

.description {
  white-space: pre-line;
  line-height: 1.75;
  font-size: 15px;
  color: #334155;
  margin: 0;
  max-width: 85ch;
}

.text-muted {
  color: var(--muted);
  font-style: italic;
  margin: 0;
}

/* Reviews overview */
.review-overview {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 32px;
  padding: 22px;
  background: #f8fafc;
  border: 1px solid var(--line);
  border-radius: 14px;
  margin-bottom: 20px;
  align-items: center;
}

.overview-score {
  text-align: center;
  padding-right: 20px;
  border-right: 1px solid var(--line);
}
.score-big {
  font-size: 44px;
  font-weight: 800;
  color: var(--price);
  line-height: 1;
  letter-spacing: -0.03em;
}
.score-max {
  font-size: 18px;
  color: var(--muted);
  font-weight: 600;
  margin-left: 2px;
}
.overview-score .star-big {
  display: block;
  margin: 6px 0;
}
.score-total {
  font-size: 13px;
  color: var(--muted);
  font-weight: 500;
}

.overview-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}
.bar-label {
  width: 42px;
  color: var(--muted);
  font-weight: 600;
  flex-shrink: 0;
}
.bar-track {
  flex: 1;
  height: 8px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b, #f5a623);
  border-radius: 999px;
  transition: width 0.3s;
}
.bar-count {
  width: 36px;
  text-align: right;
  color: var(--muted);
  font-weight: 600;
  flex-shrink: 0;
}

/* Filter */
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}
.filter-btn {
  padding: 7px 14px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 999px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.2s;
}
.filter-btn:hover:not(:disabled):not(.active) {
  border-color: var(--brand);
  color: var(--brand);
}
.filter-btn.active {
  background: var(--ink);
  color: #fff;
  border-color: var(--ink);
}
.filter-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Review list */
.review-list {
  display: flex;
  flex-direction: column;
}
.review-item {
  padding: 20px 0;
  border-bottom: 1px solid #f1f5f9;
}
.review-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.review-item:first-child {
  padding-top: 0;
}

.review-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.review-user {
  display: flex;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0284c7, #0369a1);
  color: #fff;
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(2, 132, 199, 0.25);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.user-name {
  font-weight: 700;
  color: var(--ink);
  font-size: 14.5px;
}
.review-meta {
  font-size: 12px;
  color: var(--muted);
}

.btn-delete-review {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #fecaca;
  color: var(--price);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}
.btn-delete-review:hover {
  background: #fef2f2;
  border-color: var(--price);
  transform: translateY(-1px);
}

.review-title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
}
.review-content {
  margin: 0;
  font-size: 14px;
  color: #334155;
  line-height: 1.65;
  white-space: pre-line;
  max-width: 85ch;
}

.review-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.review-img {
  width: 88px;
  height: 88px;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
  cursor: zoom-in;
  background: #fff;
  transition: all 0.2s;
}
.review-img:hover {
  transform: scale(1.04);
  border-color: var(--brand);
  box-shadow: 0 4px 12px rgba(10, 108, 255, 0.15);
}
.review-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.review-reply {
  background: #f0f9ff;
  border-left: 3px solid var(--brand);
  border-radius: 8px;
  padding: 12px 16px;
  margin-top: 14px;
}
.reply-label {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--brand);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.reply-content {
  font-size: 14px;
  color: #334155;
  line-height: 1.6;
  white-space: pre-line;
}

.review-empty {
  text-align: center;
  padding: 50px 20px;
  background: #f8fafc;
  border: 1px dashed var(--line);
  border-radius: 14px;
}
.review-empty-icon {
  font-size: 48px;
  opacity: 0.5;
  margin-bottom: 10px;
}
.review-empty-title {
  margin: 0 0 6px;
  font-weight: 700;
  font-size: 16px;
  color: var(--ink);
}
.review-empty-sub {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}

.no-filter-result {
  text-align: center;
  padding: 40px 20px;
  color: var(--muted);
  font-size: 14px;
}

/* ============ RELATED PRODUCTS ============ */
.related-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.related-card {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: all 0.25s;
}
.related-card:hover {
  transform: translateY(-4px);
  border-color: var(--brand);
  box-shadow: 0 12px 24px -8px rgba(10, 108, 255, 0.15);
}

.related-img-box {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #f8fafc;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.related-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.4s;
}
.related-card:hover .related-img {
  transform: scale(1.05);
}
.related-img-empty {
  color: #cbd5e1;
  font-size: 32px;
}

.related-info {
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.related-name {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.4;
  height: 40px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.related-card:hover .related-name {
  color: var(--brand);
}

.related-price {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: auto;
}
.related-price-sale {
  font-size: 15px;
  font-weight: 800;
  color: var(--price);
}
.related-price-origin {
  font-size: 12px;
  color: var(--muted);
  text-decoration: line-through;
}
.related-brand {
  font-size: 11.5px;
  color: var(--muted);
  font-weight: 600;
  margin-top: 2px;
}

/* Lightbox */
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  cursor: zoom-out;
  padding: 20px;
}
.lightbox img {
  max-width: 100%;
  max-height: 90vh;
  border-radius: 8px;
  cursor: default;
}
.lightbox-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  border: none;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  backdrop-filter: blur(4px);
}
.lightbox-close:hover {
  background: var(--price);
  transform: rotate(90deg);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 27, 45, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1500;
  padding: 20px;
}
.modal-card {
  background: #fff;
  padding: 28px 24px;
  border-radius: 14px;
  width: 100%;
  max-width: 420px;
  text-align: center;
  box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.25s ease-out;
}
@keyframes slideUp {
  from {
    transform: translateY(16px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
.confirm-icon {
  font-size: 42px;
  margin-bottom: 8px;
}
.modal-card h3 {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
}
.modal-card p {
  margin: 0 0 22px;
  font-size: 14px;
  color: var(--muted);
  line-height: 1.5;
}
.modal-actions {
  display: flex;
  gap: 10px;
}
.modal-actions button {
  flex: 1;
}

.btn-cancel-tech {
  padding: 11px 20px;
  background: #fff;
  border: 1px solid var(--line);
  color: var(--muted);
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.btn-cancel-tech:hover {
  background: var(--bg);
}

.btn-danger-tech {
  padding: 11px 20px;
  background: var(--price);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.btn-danger-tech:hover {
  background: #c9231e;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(229, 50, 45, 0.25);
}

/* Toast */
.toast-box {
  position: fixed;
  right: 20px;
  bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  padding: 14px 20px;
  border-radius: 12px;
  z-index: 3000;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  box-shadow: 0 10px 25px -8px rgba(0, 0, 0, 0.3);
}
.toast-success {
  background: #10b981;
}
.toast-error {
  background: #ef4444;
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Responsive */
@media (max-width: 900px) {
  .pd-top-section {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 20px;
  }
  .review-overview {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .overview-score {
    padding-right: 0;
    padding-bottom: 16px;
    border-right: none;
    border-bottom: 1px solid var(--line);
  }
  .related-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .pd-main {
    padding: 16px 12px 40px;
  }
  .pd-title {
    font-size: 20px;
  }
  .price-sale {
    font-size: 24px;
  }
  .action-buttons {
    grid-template-columns: 1fr;
  }
  .section-block {
    padding: 20px 18px;
  }
  .section-title {
    font-size: 16px;
  }
  .review-item {
    padding: 16px 0;
  }
  .toast-box {
    left: 16px;
    right: 16px;
    justify-content: center;
  }
  .related-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .related-info {
    padding: 10px 10px 12px;
  }
  .related-name {
    font-size: 13px;
    height: 36px;
  }
  .related-price-sale {
    font-size: 14px;
  }
}
</style>
