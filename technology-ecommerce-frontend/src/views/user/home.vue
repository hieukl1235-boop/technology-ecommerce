<script setup>
import { ref, onMounted, watch, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const API_BASE_URL = 'http://localhost:3000/api'

// --- DỮ LIỆU SẢN PHẨM & BỘ LỌC ---
const products = ref([])
const categories = ref([])
const brands = ref([])
const filters = ref({
  keyword: '',
  category_id: '',
  brand_id: '',
  min_price: '',
  max_price: '',
  sort: 'latest',
  limit: 10,
  offset: 0,
})
const banners = ref([])
const hasMore = ref(true)

// --- TRẠNG THÁI LOADING & ERROR ---
const isLoadingProducts = ref(false)
const isLoadingMeta = ref(false)
const loadError = ref('')
const isSearchFocused = ref(false)

// --- BIẾN THỂ & MODAL ---
const variants = ref([])
const quantities = ref({})
const showModal = ref(false)
const isLoadingVariants = ref(false)

// --- SLIDER BANNER ---
const currentBannerIndex = ref(0)
let bannerTimer = null

const currentBanner = computed(() => {
  if (!banners.value.length) return null
  return banners.value[currentBannerIndex.value] || banners.value[0]
})

const goToBanner = (index) => {
  currentBannerIndex.value = index
  restartBannerTimer()
}

const nextBanner = () => {
  if (!banners.value.length) return
  currentBannerIndex.value = (currentBannerIndex.value + 1) % banners.value.length
}

const restartBannerTimer = () => {
  if (bannerTimer) clearInterval(bannerTimer)
  if (banners.value.length > 1) {
    bannerTimer = setInterval(nextBanner, 5000)
  }
}

// --- TOAST NOTIFICATION ---
const showToast = ref(false)
const toastMsg = ref('')
const toastType = ref('success')

const triggerToast = (msg, type = 'success') => {
  toastMsg.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// --- CALL API ---
const fetchCategories = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/categories?status=1`)
    categories.value = response.data
  } catch (error) {
    console.error('Lỗi tải danh mục:', error)
  }
}

const fetchBanners = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/banners`)
    banners.value = response.data.data || []
    currentBannerIndex.value = 0
    restartBannerTimer()
  } catch (error) {
    console.error('Lỗi tải banner:', error)
  }
}

const fetchBrands = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/brands?status=1`)
    brands.value = response.data
  } catch (error) {
    console.error('Lỗi tải thương hiệu:', error)
  }
}

const fetchProducts = async () => {
  isLoadingProducts.value = true
  loadError.value = ''
  try {
    const response = await axios.get(`${API_BASE_URL}/`, { params: filters.value })
    products.value = Array.isArray(response.data) ? response.data : response.data.data || []
  } catch (error) {
    console.error('Lỗi tải sản phẩm:', error)
    loadError.value = 'Không thể tải danh sách sản phẩm. Vui lòng thử lại.'
    products.value = []
  } finally {
    isLoadingProducts.value = false
  }
}

const fetchAllMeta = async () => {
  isLoadingMeta.value = true
  try {
    await Promise.all([fetchCategories(), fetchBrands(), fetchBanners()])
  } finally {
    isLoadingMeta.value = false
  }
}

const resetFilters = () => {
  filters.value = {
    keyword: '',
    category_id: '',
    brand_id: '',
    min_price: '',
    max_price: '',
    sort: 'latest',
    limit: 10,
    offset: 0,
  }
  hasMore.value = true
}

const loadAllProducts = () => {
  filters.value.limit = 1000
  hasMore.value = false
  fetchProducts()
}

const collapseProducts = () => {
  filters.value.limit = 10
  hasMore.value = true
  fetchProducts()
}

const selectCategory = (catId) => {
  filters.value.category_id = filters.value.category_id === catId ? '' : catId
}

// --- HÀM MUA HÀNG ---
async function fetchVariants(productId) {
  isLoadingVariants.value = true
  variants.value = []
  showModal.value = true
  try {
    const response = await axios.get(`http://localhost:3000/api/product-variants/${productId}`)
    variants.value = response.data
    variants.value.forEach((v) => {
      quantities.value[v.id] = 1
    })
  } catch (error) {
    console.error('Lỗi tải biến thể sản phẩm:', error)
    triggerToast('Không thể tải phân loại sản phẩm!', 'error')
  } finally {
    isLoadingVariants.value = false
  }
}

const token = localStorage.getItem('token')

const addToCart = async (variantId, quantity) => {
  if (!quantity || quantity <= 0) {
    triggerToast('Vui lòng nhập số lượng hợp lệ!', 'error')
    return false
  }
  try {
    await axios.post(
      'http://localhost:3000/api/cart',
      { variant_id: variantId, quantity: quantity },
      { headers: { Authorization: `Bearer ${token}` } },
    )
    triggerToast('✅ Thêm vào giỏ hàng thành công!')
    showModal.value = false
    return true
  } catch (error) {
    triggerToast('❌ Thêm vào giỏ hàng thất bại!', 'error')
    return false
  }
}

const buyNow = async (variantId, quantity) => {
  const success = await addToCart(variantId, quantity)
  if (success) router.push('/checkout')
}

const increaseQty = (variantId) => {
  const cur = Number(quantities.value[variantId]) || 1
  quantities.value[variantId] = cur + 1
}

const decreaseQty = (variantId) => {
  const cur = Number(quantities.value[variantId]) || 1
  if (cur > 1) quantities.value[variantId] = cur - 1
}

// --- TÌM KIẾM BẰNG GIỌNG NÓI ---
const isListening = ref(false)
const startVoiceSearch = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    triggerToast('Trình duyệt không hỗ trợ tìm kiếm giọng nói!', 'error')
    return
  }
  const recognition = new SpeechRecognition()
  recognition.lang = 'vi-VN'
  recognition.interimResults = false
  recognition.maxAlternatives = 1

  recognition.onstart = () => { isListening.value = true }
  recognition.onresult = (event) => {
    filters.value.keyword = event.results[0][0].transcript.replace(/[.,]/g, '')
  }
  recognition.onerror = () => { isListening.value = false }
  recognition.onend = () => { isListening.value = false }
  recognition.start()
}

// --- WATCH LOGIC ---
watch(
  () => ({ ...filters.value }),
  (newVal, oldVal) => {
    if (newVal.limit !== oldVal.limit) return
    filters.value.limit = 10
    hasMore.value = true
    fetchProducts()
  },
  { deep: true },
)

const handleCheckout = async (variantId, quantity) => {
  try {
    const res = await axios.get(`http://localhost:3000/api/product-variants/${variantId}/variants`)
    const variantselect = [
      {
        image: res.data.image_url,
        product_name: res.data.name,
        quantity: quantity,
        sale_price: res.data.sale_price,
        selling_price: res.data.selling_price,
        sku: res.data.sku,
        variant_id: variantId,
      },
    ]
    localStorage.setItem('checkout_items', JSON.stringify(variantselect))
    router.push('/checkout')
  } catch (error) {
    console.log('lỗi là: ', error)
    triggerToast('Không thể xử lý đơn hàng!', 'error')
  }
}

onMounted(() => {
  fetchAllMeta()
  fetchProducts()
})

onBeforeUnmount(() => {
  if (bannerTimer) clearInterval(bannerTimer)
})

const user = JSON.parse(localStorage.getItem('user') || '{}')
</script>

<template>
  <div class="store-layout">
    <!-- TOAST -->
    <div
      class="toast-notification"
      :class="{ 'toast-show': showToast, 'toast-error': toastType === 'error' }"
    >
      {{ toastMsg }}
    </div>

    <!-- TOP BAR -->
    <div class="top-bar">
      <div class="top-bar-inner">
        <div class="top-bar-left">
          <span>🚚 Miễn phí giao hàng đơn từ 500K</span>
          <span class="divider">|</span>
          <span>🔄 Đổi trả trong 30 ngày</span>
        </div>
        <div class="top-bar-right">
          <a href="tel:18006789">📞 Hotline: <b>1800.6789</b></a>
          <span class="divider">|</span>
          <RouterLink to="/notifications">🔔 Thông báo</RouterLink>
          <span class="divider">|</span>
          <RouterLink to="/chat">💬 Tư vấn</RouterLink>
        </div>
      </div>
    </div>

    <!-- HEADER -->
    <header class="store-header">
      <div class="header-container-inner">
        <RouterLink to="/" class="header-logo">
          <h2>Tech<span>Store</span></h2>
        </RouterLink>

        <div class="header-search" :class="{ focused: isSearchFocused }">
          <input
            type="text"
            v-model="filters.keyword"
            placeholder="Bạn cần tìm laptop, điện thoại, phụ kiện...?"
            @focus="isSearchFocused = true"
            @blur="isSearchFocused = false"
            @keyup.enter="fetchProducts"
          />
          <button
            class="btn-voice"
            :class="{ listening: isListening }"
            @click="startVoiceSearch"
            :title="isListening ? 'Đang nghe...' : 'Tìm kiếm giọng nói'"
          >
            {{ isListening ? '🎙️' : '🎤' }}
          </button>
          <button class="btn-search" @click="fetchProducts">🔍 Tìm</button>
        </div>

        <div class="header-actions">
          <div class="header-user">
            <span class="user-label">Xin chào,</span>
            <b>{{ user.full_name || 'Khách' }}</b>
          </div>
          <RouterLink to="/cart" class="header-icon-btn">
            🛒
            <span class="cart-badge">3</span>
          </RouterLink>
          <RouterLink to="/account" class="header-icon-btn">👤</RouterLink>
        </div>
      </div>

      <!-- NAV DANH MỤC -->
      <nav class="main-nav">
        <div class="main-nav-inner">
          <button
            class="nav-cat-btn"
            :class="{ active: filters.category_id === '' }"
            @click="filters.category_id = ''"
          >
            ☰ Tất cả danh mục
          </button>
          <button
            v-for="cat in categories"
            :key="cat.id"
            class="nav-cat-btn"
            :class="{ active: filters.category_id === cat.id }"
            @click="selectCategory(cat.id)"
          >
            {{ cat.name }}
          </button>
        </div>
      </nav>
    </header>

    <main class="main-content">
      <!-- HERO SLIDER -->
      <div class="hero-banner-wrapper" v-if="currentBanner">
        <div class="hero-banner">
          <transition name="fade" mode="out-in">
            <img
              v-if="currentBanner.image_url"
              :key="currentBanner.id"
              :src="`http://localhost:3000/uploads/banners/${currentBanner.image_url}`"
              alt="Banner Image"
              class="hero-img"
            />
          </transition>
          <div class="hero-overlay"></div>
          <div class="hero-content">
            <span class="hero-tag">🔥 Ưu đãi đặc biệt</span>
            <h1>{{ currentBanner.title }}</h1>
            <p>{{ currentBanner.description }}</p>
            <div class="hero-actions">
              <button class="btn-hero" @click="filters.sort = 'price_asc'">
                🔥 Săn Deal Ngay
              </button>
              <button class="btn-hero-outline" @click="filters.category_id = ''">
                Khám phá thêm →
              </button>
            </div>
          </div>

          <!-- Dots -->
          <div class="hero-dots" v-if="banners.length > 1">
            <button
              v-for="(b, idx) in banners"
              :key="b.id"
              class="dot"
              :class="{ active: idx === currentBannerIndex }"
              @click="goToBanner(idx)"
              :aria-label="`Banner ${idx + 1}`"
            />
          </div>
        </div>
      </div>

      <!-- TRUST BADGES -->
      <div class="trust-badges">
        <div class="trust-item">
          <span class="trust-icon">🚚</span>
          <div>
            <b>Miễn phí vận chuyển</b>
            <p>Cho đơn hàng từ 500.000đ</p>
          </div>
        </div>
        <div class="trust-item">
          <span class="trust-icon">🛡️</span>
          <div>
            <b>Bảo hành chính hãng</b>
            <p>Cam kết 100% chính hãng</p>
          </div>
        </div>
        <div class="trust-item">
          <span class="trust-icon">🔄</span>
          <div>
            <b>Đổi trả 30 ngày</b>
            <p>Nhanh chóng - Miễn phí</p>
          </div>
        </div>
        <div class="trust-item">
          <span class="trust-icon">💳</span>
          <div>
            <b>Thanh toán an toàn</b>
            <p>Bảo mật thông tin</p>
          </div>
        </div>
      </div>

      <!-- BỘ LỌC -->
      <div class="filter-bar">
        <div class="filter-bar-header">
          <h3>🔎 Bộ lọc sản phẩm</h3>
          <button @click="resetFilters" class="btn-reset">↺ Xóa tất cả</button>
        </div>
        <div class="filter-bar-body">
          <div class="filter-item">
            <label>Thương hiệu</label>
            <select v-model="filters.brand_id">
              <option value="">Tất cả thương hiệu</option>
              <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
          </div>
          <div class="filter-item">
            <label>Giá từ</label>
            <input type="number" v-model="filters.min_price" placeholder="0 ₫" />
          </div>
          <div class="filter-item">
            <label>Đến giá</label>
            <input type="number" v-model="filters.max_price" placeholder="Không giới hạn" />
          </div>
          <div class="filter-item">
            <label>Sắp xếp theo</label>
            <select v-model="filters.sort">
              <option value="latest">Mới nhất</option>
              <option value="price_asc">Giá: Thấp → Cao</option>
              <option value="price_desc">Giá: Cao → Thấp</option>
            </select>
          </div>
        </div>
      </div>

      <!-- TIÊU ĐỀ KHU VỰC SẢN PHẨM -->
      <div class="section-header">
        <h2>⚡ Sản phẩm nổi bật</h2>
        <p v-if="!isLoadingProducts">
          Tìm thấy <b>{{ products.length }}</b> sản phẩm
        </p>
      </div>

      <!-- SKELETON LOADING -->
      <div v-if="isLoadingProducts" class="product-grid">
        <div v-for="n in 8" :key="`sk-${n}`" class="product-card skeleton">
          <div class="skeleton-img"></div>
          <div class="skeleton-line w-80"></div>
          <div class="skeleton-line w-60"></div>
          <div class="skeleton-line w-40"></div>
          <div class="skeleton-btn"></div>
        </div>
      </div>

      <!-- ERROR STATE -->
      <div v-else-if="loadError" class="state-box error-state">
        <div class="state-icon">⚠️</div>
        <h3>Đã có lỗi xảy ra</h3>
        <p>{{ loadError }}</p>
        <button class="btn-outline-primary" @click="fetchProducts">Thử lại</button>
      </div>

      <!-- EMPTY STATE -->
      <div v-else-if="products.length === 0" class="state-box empty-state">
        <div class="state-icon">🔍</div>
        <h3>Không tìm thấy sản phẩm</h3>
        <p>Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
        <button class="btn-outline-primary" @click="resetFilters">Xóa bộ lọc</button>
      </div>

      <!-- GRID SẢN PHẨM -->
      <div v-else class="product-grid">
        <div class="product-card" v-for="p in products" :key="p.id">
          <div class="product-img-wrapper">
            <span
              v-if="p.min_sale_price && p.min_sale_price < p.min_selling_price"
              class="product-badge"
            >
              -{{ Math.round((1 - p.min_sale_price / p.min_selling_price) * 100) }}%
            </span>
            <img
              v-if="p.main_image"
              :src="`http://localhost:3000/uploads/products/${p.main_image}`"
              class="product-img"
              alt="Product image"
              loading="lazy"
            />
            <span v-else class="no-img">Không có ảnh</span>
          </div>

          <div class="product-info">
            <RouterLink :to="`/product/${p.id}`" class="product-name-link">
              <h4 class="product-name" :title="p.name">{{ p.name }}</h4>
            </RouterLink>
            <div class="product-rating" v-if="p.avg_review > 0">
              {{ Number(p.avg_review).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) }}⭐
              <span>(Đã bán {{ p.count_sell }})</span>
            </div>
            <div class="product-tags">
              <span class="tag tag-category">{{ p.category_name || 'Khác' }}</span>
              <span class="tag tag-brand">{{ p.brand_name || 'Khác' }}</span>
            </div>
            <div class="product-price">
              <span class="price-sale">
                {{ p.min_sale_price
                  ? Number(p.min_sale_price).toLocaleString('vi-VN')
                  : Number(p.min_selling_price).toLocaleString('vi-VN') }} ₫
              </span>
              <span v-if="p.min_sale_price" class="price-original">
                {{ Number(p.min_selling_price).toLocaleString('vi-VN') }} ₫
              </span>
            </div>
          </div>
          <button class="btn-primary" @click="fetchVariants(p.id)">🛒 Chọn mua</button>
        </div>
      </div>

      <!-- LOAD MORE -->
      <div class="load-more" v-if="products.length > 0 && !isLoadingProducts">
        <button v-if="hasMore" class="btn-outline-primary" @click="loadAllProducts">
          ⬇ Xem thêm tất cả
        </button>
        <button v-else class="btn-outline-secondary" @click="collapseProducts">⬆ Thu gọn</button>
      </div>
    </main>

    <!-- MODAL -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-container">
        <div class="modal-header">
          <h3>Chọn phân loại sản phẩm</h3>
          <button class="btn-close" @click="showModal = false" title="Đóng">✖</button>
        </div>
        <div class="modal-body">
          <div v-if="isLoadingVariants" class="empty-state-modal">
            <div class="spinner"></div>
            <p>Đang tải phân loại sản phẩm...</p>
          </div>
          <div v-else-if="variants.length === 0" class="empty-state-modal">
            Sản phẩm này hiện chưa có phân loại nào.
          </div>
          <div v-else class="variant-list">
            <div v-for="variant in variants" :key="variant.id" class="variant-item">
              <img
                v-if="variant.image_url"
                :src="`http://localhost:3000/uploads/variants/${variant.image_url}`"
                class="variant-img"
                alt="Variant image"
              />
              <div class="variant-details">
                <p><b>SKU:</b> {{ variant.sku }}</p>
                <div class="variant-price">
                  <span class="price-sale">
                    {{ variant.sale_price
                      ? Number(variant.sale_price).toLocaleString('vi-VN')
                      : Number(variant.selling_price).toLocaleString('vi-VN') }} ₫
                  </span>
                  <span v-if="variant.sale_price" class="price-original">
                    {{ Number(variant.selling_price).toLocaleString('vi-VN') }} ₫
                  </span>
                </div>
              </div>
              <div class="variant-actions">
                <div class="qty-control">
                  <button class="qty-btn" @click="decreaseQty(variant.id)">−</button>
                  <input
                    type="number"
                    v-model="quantities[variant.id]"
                    min="1"
                    class="qty-input"
                  />
                  <button class="qty-btn" @click="increaseQty(variant.id)">+</button>
                </div>
                <div class="btn-group">
                  <button class="btn-add-cart" @click="addToCart(variant.id, quantities[variant.id])">
                    🛒 Thêm giỏ
                  </button>
                  <button class="btn-buy-now" @click="handleCheckout(variant.id, quantities[variant.id])">
                    ⚡ Mua ngay
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <footer class="store-footer">
      <div class="footer-container">
        <div class="footer-col">
          <h4>Về Chúng Tôi</h4>
          <p>
            Hệ thống bán lẻ thiết bị điện tử, phụ kiện công nghệ cao cấp chính hãng với giá tốt nhất
            thị trường.
          </p>
        </div>
        <div class="footer-col">
          <h4>Chính Sách</h4>
          <ul>
            <li><a href="#">Bảo hành chính hãng</a></li>
            <li><a href="#">Đổi trả linh hoạt 30 ngày</a></li>
            <li><a href="#">Giao hàng miễn phí toàn quốc</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Tổng Đài Hỗ Trợ</h4>
          <p>📞 Tư vấn mua hàng: <b>1800.6789</b></p>
          <p>📧 Email hỗ trợ: <b>cskh@techstore.vn</b></p>
        </div>
      </div>
      <div class="footer-bottom">&copy; 2026 Bản quyền thuộc về TechStore. All rights reserved.</div>
    </footer>
  </div>
</template>

<style scoped>
/* ============ RESET & BASE ============ */
.store-layout {
  font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: #f8fafc;
  color: #1e293b;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 24px 16px;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

/* ============ TOAST ============ */
.toast-notification {
  position: fixed;
  top: 24px;
  right: -400px;
  background: #10b981;
  color: white;
  padding: 14px 24px;
  border-radius: 10px;
  font-weight: 600;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  transition: right 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  z-index: 9999;
}
.toast-show { right: 24px; }
.toast-error { background: #ef4444; }

/* ============ TOP BAR ============ */
.top-bar {
  background: #0f172a;
  color: #cbd5e1;
  font-size: 12.5px;
  padding: 8px 0;
}
.top-bar-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.top-bar-left, .top-bar-right {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.top-bar a {
  color: #cbd5e1;
  text-decoration: none;
  transition: color 0.2s;
}
.top-bar a:hover { color: #fff; }
.top-bar b { color: #fff; }
.divider { color: #334155; }

/* ============ HEADER ============ */
.store-header {
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 900;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.header-container-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  max-width: 1280px;
  margin: 0 auto;
  padding: 14px 24px;
}

.header-logo {
  text-decoration: none;
  flex-shrink: 0;
}
.header-logo h2 {
  margin: 0;
  color: #0f172a;
  font-weight: 800;
  font-size: 24px;
  letter-spacing: -0.5px;
}
.header-logo span { color: #2563eb; }

.header-search {
  flex: 1;
  max-width: 560px;
  display: flex;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  background: #f8fafc;
  transition: all 0.2s;
}
.header-search.focused {
  border-color: #2563eb;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
.header-search input {
  flex: 1;
  padding: 11px 16px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #1e293b;
  min-width: 0;
}
.header-search input::placeholder { color: #94a3b8; }

.btn-voice {
  padding: 0 14px;
  background: transparent;
  color: #64748b;
  border: none;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}
.btn-voice:hover { color: #2563eb; background: #eff6ff; }
.btn-voice.listening {
  color: #ef4444;
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

.btn-search {
  padding: 0 22px;
  background: #2563eb;
  color: white;
  border: none;
  cursor: pointer;
  font-weight: 700;
  font-size: 13px;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-search:hover { background: #1d4ed8; }

.header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}
.header-user {
  font-size: 13px;
  color: #475569;
  line-height: 1.3;
  text-align: right;
}
.user-label { display: block; font-size: 11px; color: #94a3b8; }

.header-icon-btn {
  position: relative;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #f1f5f9;
  font-size: 18px;
  text-decoration: none;
  transition: all 0.2s;
}
.header-icon-btn:hover { background: #e0e7ff; transform: translateY(-1px); }

.cart-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 999px;
  font-weight: 700;
  border: 2px solid #fff;
}

/* ============ NAV DANH MỤC ============ */
.main-nav {
  border-top: 1px solid #f1f5f9;
  background: #fff;
}
.main-nav-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: thin;
}
.main-nav-inner::-webkit-scrollbar { height: 4px; }
.main-nav-inner::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }

.nav-cat-btn {
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #475569;
  font-weight: 600;
  font-size: 13.5px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}
.nav-cat-btn:hover { color: #2563eb; }
.nav-cat-btn.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

/* ============ HERO SLIDER ============ */
.hero-banner-wrapper {
  margin-bottom: 24px;
}

.hero-banner {
  position: relative;
  width: 100%;
  height: 340px;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  align-items: center;
  box-shadow: 0 10px 30px rgba(37, 99, 235, 0.15);
}

.hero-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.5) 60%, transparent 100%);
  z-index: 2;
}

.hero-content {
  position: relative;
  z-index: 3;
  padding: 0 48px;
  color: #fff;
  max-width: 650px;
}

.hero-tag {
  display: inline-block;
  padding: 5px 12px;
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 14px;
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.hero-content h1 {
  margin: 0 0 12px 0;
  font-size: 34px;
  font-weight: 800;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.hero-content p {
  margin: 0 0 22px 0;
  font-size: 15px;
  color: #cbd5e1;
  line-height: 1.5;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-hero {
  padding: 11px 24px;
  background: #f59e0b;
  color: #0f172a;
  font-weight: 700;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  font-size: 14px;
}
.btn-hero:hover {
  background: #d97706;
  transform: translateY(-2px);
}

.btn-hero-outline {
  padding: 11px 24px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-weight: 700;
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  backdrop-filter: blur(4px);
}
.btn-hero-outline:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: #fff;
}

.hero-dots {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 4;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  padding: 0;
}
.dot.active {
  background: #fff;
  width: 24px;
  border-radius: 999px;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ============ TRUST BADGES ============ */
.trust-badges {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}
.trust-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.2s;
}
.trust-item:hover {
  border-color: #2563eb;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08);
}
.trust-icon { font-size: 24px; }
.trust-item b {
  display: block;
  font-size: 13.5px;
  color: #1e293b;
}
.trust-item p {
  margin: 2px 0 0 0;
  font-size: 12px;
  color: #64748b;
}

/* ============ FILTER BAR ============ */
.filter-bar {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  margin-bottom: 24px;
  overflow: hidden;
}
.filter-bar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid #f1f5f9;
}
.filter-bar-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}
.filter-bar-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  padding: 16px 20px;
}

.filter-item {
  display: flex;
  flex-direction: column;
}
.filter-item label {
  font-size: 12.5px;
  color: #475569;
  margin-bottom: 6px;
  font-weight: 600;
}
.filter-item input,
.filter-item select {
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  outline: none;
  transition: all 0.2s;
  background: #f8fafc;
  font-size: 14px;
  color: #1e293b;
}
.filter-item input:focus,
.filter-item select:focus {
  border-color: #2563eb;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.btn-reset {
  padding: 8px 14px;
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s;
}
.btn-reset:hover {
  background: #e2e8f0;
  color: #0f172a;
}

/* ============ SECTION HEADER ============ */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 18px;
  gap: 12px;
  flex-wrap: wrap;
}
.section-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.3px;
}
.section-header p {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}
.section-header b { color: #2563eb; }

/* ============ PRODUCT GRID ============ */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 18px;
}

.product-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s;
  border: 1px solid #e2e8f0;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}
.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.08);
  border-color: #2563eb;
}

.product-img-wrapper {
  width: 100%;
  height: 190px;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 12px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.4s;
}
.product-card:hover .product-img { transform: scale(1.06); }

.no-img {
  color: #94a3b8;
  font-size: 13px;
}

.product-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ef4444;
  color: white;
  font-weight: 700;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 6px;
  z-index: 2;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
}

.product-name-link { text-decoration: none; }

.product-name {
  font-size: 14.5px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 6px 0;
  height: 40px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}
.product-name:hover { color: #2563eb; }

.product-rating {
  font-size: 12px;
  color: #d97706;
  margin-bottom: 8px;
  font-weight: 600;
}
.product-rating span {
  color: #64748b;
  font-weight: normal;
  margin-left: 4px;
}

.product-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.tag {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 600;
}
.tag-category { background: #eff6ff; color: #2563eb; }
.tag-brand { background: #fffbeb; color: #d97706; }

.product-price {
  margin-bottom: 12px;
  margin-top: auto;
}
.price-sale {
  color: #dc2626;
  font-weight: 800;
  font-size: 17px;
  display: block;
}
.price-original {
  color: #94a3b8;
  text-decoration: line-through;
  font-size: 12px;
}

.btn-primary {
  width: 100%;
  padding: 10px;
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  margin-top: auto;
  transition: all 0.2s;
}
.product-card:hover .btn-primary {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

/* ============ SKELETON ============ */
.skeleton { pointer-events: none; }
.skeleton-img {
  width: 100%;
  height: 190px;
  border-radius: 10px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  margin-bottom: 12px;
}
.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  margin-bottom: 8px;
}
.w-80 { width: 80%; }
.w-60 { width: 60%; }
.w-40 { width: 40%; }
.skeleton-btn {
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  margin-top: 8px;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ============ STATE BOX (EMPTY/ERROR) ============ */
.state-box {
  text-align: center;
  padding: 60px 20px;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
}
.state-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.7;
}
.state-box h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #1e293b;
}
.state-box p {
  margin: 0 0 20px 0;
  color: #64748b;
  font-size: 14px;
}
.error-state { border-color: #fecaca; background: #fef2f2; }
.error-state .state-icon { color: #ef4444; }

/* ============ LOAD MORE ============ */
.load-more {
  text-align: center;
  margin-top: 32px;
}
.btn-outline-primary, .btn-outline-secondary {
  padding: 10px 28px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-outline-primary {
  background: transparent;
  color: #2563eb;
  border: 2px solid #2563eb;
}
.btn-outline-primary:hover {
  background: #2563eb;
  color: white;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}
.btn-outline-secondary {
  background: #f1f5f9;
  color: #475569;
  border: 2px solid #cbd5e1;
}
.btn-outline-secondary:hover {
  background: #e2e8f0;
  border-color: #94a3b8;
}

/* ============ MODAL ============ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-container {
  background: #fff;
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  padding: 18px 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
}

.btn-close {
  background: #f1f5f9;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-weight: bold;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-close:hover {
  background: #ef4444;
  color: white;
  transform: rotate(90deg);
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

.empty-state-modal {
  text-align: center;
  color: #64748b;
  padding: 30px;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  margin: 0 auto 12px;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.variant-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.variant-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  transition: all 0.2s;
}
.variant-item:hover {
  border-color: #2563eb;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08);
}

.variant-img {
  width: 70px;
  height: 70px;
  object-fit: contain;
  border-radius: 8px;
  background: #f8fafc;
  padding: 4px;
  border: 1px solid #f1f5f9;
  flex-shrink: 0;
}

.variant-details { flex: 1; min-width: 0; }
.variant-details p {
  margin: 0 0 4px 0;
  color: #1e293b;
  font-size: 13px;
}
.variant-price { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }

.variant-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.qty-control {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}
.qty-btn {
  width: 28px;
  height: 30px;
  background: #f8fafc;
  border: none;
  font-size: 15px;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
}
.qty-btn:hover { background: #eff6ff; color: #2563eb; }
.qty-input {
  width: 42px;
  height: 30px;
  border: none;
  border-left: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  text-align: center;
  font-size: 13px;
  outline: none;
  -moz-appearance: textfield;
}
.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.btn-group {
  display: flex;
  gap: 6px;
}

.btn-add-cart {
  padding: 7px 12px;
  background: #fff;
  color: #d97706;
  border: 1.5px solid #d97706;
  border-radius: 6px;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-add-cart:hover {
  background: #d97706;
  color: white;
}

.btn-buy-now {
  padding: 7px 14px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);
  white-space: nowrap;
}
.btn-buy-now:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

/* ============ FOOTER ============ */
.store-footer {
  background: #0f172a;
  color: #94a3b8;
  padding: 40px 0 0 0;
  margin-top: auto;
}

.footer-container {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px 30px;
}

.footer-col {
  flex: 1;
  min-width: 240px;
}
.footer-col h4 {
  font-size: 15px;
  margin-bottom: 16px;
  color: #60a5fa;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.footer-col p, .footer-col a {
  color: #94a3b8;
  font-size: 13px;
  text-decoration: none;
  line-height: 1.8;
}
.footer-col a:hover { color: #fff; }
.footer-col ul { list-style: none; padding: 0; margin: 0; }

.footer-bottom {
  text-align: center;
  padding: 16px;
  background: #090d16;
  font-size: 12px;
  color: #64748b;
  border-top: 1px solid #1e293b;
}

/* ============ RESPONSIVE ============ */
@media (max-width: 992px) {
  .header-container-inner {
    flex-wrap: wrap;
    padding: 12px 16px;
  }
  .header-search {
    order: 3;
    flex-basis: 100%;
    max-width: 100%;
  }
  .header-user { display: none; }
  .hero-banner { height: 280px; }
  .hero-content { padding: 0 32px; }
  .hero-content h1 { font-size: 26px; }
}

@media (max-width: 640px) {
  .top-bar-left { display: none; }
  .top-bar-inner { justify-content: center; }
  .header-container-inner { gap: 10px; }
  .header-logo h2 { font-size: 20px; }
  .hero-banner { height: 240px; }
  .hero-content { padding: 0 20px; }
  .hero-content h1 { font-size: 20px; }
  .hero-content p { font-size: 13px; }
  .hero-actions { flex-direction: column; align-items: stretch; }
  .btn-hero, .btn-hero-outline { width: 100%; text-align: center; }
  .main-content { padding: 16px 12px; }
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .product-card { padding: 10px; }
  .product-img-wrapper { height: 140px; }
  .product-name { font-size: 13px; height: 36px; }
  .price-sale { font-size: 15px; }
  .variant-item {
    flex-direction: column;
    align-items: stretch;
  }
  .variant-img { align-self: center; }
  .variant-actions { align-items: stretch; }
  .btn-group { width: 100%; }
  .btn-add-cart, .btn-buy-now { flex: 1; }
  .trust-badges { grid-template-columns: 1fr 1fr; }
}
</style>