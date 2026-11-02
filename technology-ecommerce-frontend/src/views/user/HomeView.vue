<script setup>
import { ref, onMounted, watch, computed, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const API_BASE_URL = 'http://localhost:3000/api/products'

// ============ USER INFO ============
const token = localStorage.getItem('token')
const user = JSON.parse(localStorage.getItem('user') || '{}')

// Kiểm tra đăng nhập: cần token VÀ user.id
const isLoggedIn = computed(() => !!token && !!user?.id)

// Avatar URL an toàn
const userAvatarUrl = computed(() => {
  const avatar = user?.avatar || user?.avatar_url
  if (!avatar) return ''
  return avatar.startsWith('http')
    ? avatar
    : `http://localhost:3000/uploads/avatars/${avatar}`
})

// Chữ cái đầu tên — fallback avatar
const userInitials = computed(() => {
  const name = user?.full_name?.trim()
  if (!name) return '?'
  const parts = name.split(/\s+/)
  return parts.length === 1
    ? parts[0].charAt(0).toUpperCase()
    : (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
})

// Yêu cầu đăng nhập — redirect nếu chưa login
const requireLogin = (actionName = 'thực hiện chức năng này') => {
  if (!isLoggedIn.value) {
    triggerToast(`Vui lòng đăng nhập để ${actionName}`, 'error')
    setTimeout(() => {
      router.push({ path: '/login', query: { redirect: route.fullPath } })
    }, 800)
    return false
  }
  return true
}
const goToCart = () => {
  if (!requireLogin('xem giỏ hàng')) return
  router.push('/cart')
}

// ============ DỮ LIỆU SẢN PHẨM & BỘ LỌC ============
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

// Trạng thái loading
const isLoadingProducts = ref(false)
const isLoadingMeta = ref(false)
const loadError = ref('')
const isSearchFocused = ref(false)

// Biến thể & modal
const variants = ref([])
const quantities = ref({})
const showModal = ref(false)
const isLoadingVariants = ref(false)

// Badge giỏ hàng
const cartCount = ref(0)

// ============ SLIDER BANNER ============
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

// ============ TOAST ============
const showToast = ref(false)
const toastMsg = ref('')
const toastType = ref('success')
let toastTimer = null

const triggerToast = (msg, type = 'success') => {
  toastMsg.value = msg
  toastType.value = type
  showToast.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// ============ CALL API ============
const fetchCategories = async () => {
  try {
    const response = await axios.get(`http://localhost:3000/api/admin/categories?status=1`)
    categories.value = response.data
  } catch (error) {
    console.error('Lỗi tải danh mục:', error)
  }
}

const fetchBanners = async () => {
  try {
    const response = await axios.get(`http://localhost:3000/api/admin/banners`)
    banners.value = response.data.data || []
    currentBannerIndex.value = 0
    restartBannerTimer()
  } catch (error) {
    console.error('Lỗi tải banner:', error)
  }
}

const fetchBrands = async () => {
  try {
    const response = await axios.get(`http://localhost:3000/api/admin/brands?status=1`)
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

// Đếm tổng số lượng sản phẩm trong giỏ
const fetchCartCount = async () => {
  if (!isLoggedIn.value) {
    cartCount.value = 0
    return
  }
  try {
    const res = await axios.get('http://localhost:3000/api/cart', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const items = Array.isArray(res.data) ? res.data : res.data.data || []
    cartCount.value = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  } catch (error) {
    console.error('Lỗi tải giỏ hàng:', error)
    cartCount.value = 0
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

// ============ MUA HÀNG ============
async function fetchVariants(productId) {
  if (!requireLogin('xem phân loại và mua sản phẩm')) return

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

const addToCart = async (variantId, quantity) => {
  if (!requireLogin('thêm vào giỏ hàng')) return false

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
    await fetchCartCount()
    return true
  } catch (error) {
    triggerToast('❌ Thêm vào giỏ hàng thất bại!', 'error')
    return false
  }
}

const increaseQty = (variantId) => {
  const cur = Number(quantities.value[variantId]) || 1
  quantities.value[variantId] = cur + 1
}

const decreaseQty = (variantId) => {
  const cur = Number(quantities.value[variantId]) || 1
  if (cur > 1) quantities.value[variantId] = cur - 1
}

// ============ TÌM KIẾM GIỌNG NÓI ============
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

  recognition.onstart = () => {
    isListening.value = true
  }
  recognition.onresult = (event) => {
    filters.value.keyword = event.results[0][0].transcript.replace(/[.,]/g, '')
  }
  recognition.onerror = () => {
    isListening.value = false
  }
  recognition.onend = () => {
    isListening.value = false
  }
  recognition.start()
}

// ============ WATCH FILTERS ============
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

// ============ CHECKOUT NHANH ============
const handleCheckout = async (variantId, quantity) => {
  if (!requireLogin('mua hàng')) return

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

// ============ GỢI Ý CÁ NHÂN HÓA ============
const recomend = ref([])
const recomendProduct = ref([])

const getProductRecommend = async () => {
  // Chưa login → không gọi API, tránh lỗi
  if (!isLoggedIn.value) {
    recomend.value = []
    recomendProduct.value = []
    return
  }

  try {
    const res = await axios.get(
      `http://localhost:5000/api/users/${user.id}/recommendations`,
    )
    recomend.value = res.data.recommendations || []
    recomendProduct.value = await Promise.all(
      recomend.value.map(async (item) => {
        try {
          const result = await axios.get(
            `http://localhost:3000/api/product/${item.product_id}`,
          )
          return result.data
        } catch {
          return null
        }
      }),
    ).then((arr) => arr.filter(Boolean))
  } catch (error) {
    console.log('Lỗi gợi ý cá nhân hóa:', error)
    recomend.value = []
    recomendProduct.value = []
  }
}

// ============ TÌM KIẾM BẰNG HÌNH ẢNH ============
const imageSearchInput = ref(null)
const imageSearchResults = ref([])
const isSearchingByImage = ref(false)
const imageSearchError = ref('')

const openImagePicker = () => {
  imageSearchInput.value?.click()
}

const handleImageSearchChange = async (event) => {
  const file = event.target.files?.[0]
  event.target.value = ''

  if (!file) return
  if (!file.type.startsWith('image/')) {
    imageSearchError.value = 'Vui lòng chọn file hình ảnh.'
    return
  }

  const formData = new FormData()
  formData.append('image', file)
  formData.append('top_k', '5')

  isSearchingByImage.value = true
  imageSearchError.value = ''
  imageSearchResults.value = []

  try {
    const response = await axios.post(
      'http://localhost:5000/api/search-by-image',
      formData,
    )
    const results = response.data.data || []

    imageSearchResults.value = await Promise.all(
      results.map(async (item) => {
        try {
          const productResponse = await axios.get(
            `http://localhost:3000/api/products/${item.product_id}`,
          )
          return {
            ...productResponse.data,
            product_id: item.product_id,
            similarity: item.similarity,
          }
        } catch {
          return {
            id: item.product_id,
            product_id: item.product_id,
            name: item.product_name,
            image_url: item.image_url,
            similarity: item.similarity,
          }
        }
      }),
    )
  } catch (error) {
    console.error('Lỗi tìm kiếm bằng hình ảnh:', error)
    imageSearchError.value =
      error.response?.data?.message ||
      'Không thể tìm kiếm bằng hình ảnh. Vui lòng thử lại.'
  } finally {
    isSearchingByImage.value = false
  }
}

// ============ LIFECYCLE ============
onMounted(() => {
  fetchAllMeta()
  fetchProducts()
  fetchCartCount()
  getProductRecommend()

  if (route.query.status === 'failed') {
    triggerToast(`Thanh toán đơn ${route.query.order_code || ''} thất bại!`, 'error')
  } else if (route.query.status === 'success') {
    triggerToast(`Đặt hàng ${route.query.order_code || ''} thành công!`)
  }
})

onBeforeUnmount(() => {
  if (bannerTimer) clearInterval(bannerTimer)
  if (toastTimer) clearTimeout(toastTimer)
})
</script>

<template>
  <!-- <p>{{ isLoggedIn }}</p> -->
  <div class="store-layout">
    <!-- TOAST -->
    <div class="toast-notification" :class="{ 'toast-show': showToast, 'toast-error': toastType === 'error' }">
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
          <a href="tel:18006789">📞 Hotline: <b>1900 0000</b></a>
          <span class="divider">|</span>
         <RouterLink :to="isLoggedIn ? '/notifications' : '/login?redirect=/notifications'" class="top-bar-link">
            🔔 Thông báo
          </RouterLink>
          <span class="divider">|</span>
          <RouterLink :to="isLoggedIn ? '/chat' : '/login?redirect=/chat'" class="top-bar-link">
            💬 Tư vấn
          </RouterLink>
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
          <input type="text" v-model="filters.keyword" placeholder="Bạn cần tìm laptop, điện thoại, phụ kiện...?"
            @focus="isSearchFocused = true" @blur="isSearchFocused = false" @keyup.enter="fetchProducts" />
          <button class="btn-voice" :class="{ listening: isListening }" @click="startVoiceSearch"
            :title="isListening ? 'Đang nghe...' : 'Tìm kiếm giọng nói'">
            {{ isListening ? '🎙️' : '🎤' }}
          </button>
          <!-- Nút tìm kiếm bằng hình ảnh -->
          <button type="button" class="btn-voice" title="Tìm kiếm bằng hình ảnh" @click="openImagePicker">
            📷
          </button>

          <!-- Input chọn ảnh, ẩn khỏi giao diện -->
          <input ref="imageSearchInput" type="file" accept="image/*" hidden @change="handleImageSearchChange" />
          <button class="btn-search" @click="fetchProducts">🔍 Tìm</button>

        </div>

        <div class="header-actions">
          <!-- ĐÃ ĐĂNG NHẬP: avatar + tên -->
          <RouterLink v-if="isLoggedIn" to="/account" class="user-chip">
            <div class="user-avatar">
              <img v-if="userAvatarUrl" :src="userAvatarUrl" :alt="user.full_name" class="user-avatar-img"
                @error="(e) => (e.target.style.display = 'none')" />
              <span v-else class="user-avatar-text">{{ userInitials }}</span>
            </div>
            <div class="user-chip-info">
              <span class="user-chip-label">Xin chào,</span>
              <b class="user-chip-name">{{ user.full_name || 'Khách' }}</b>
            </div>
          </RouterLink>

          <!-- CHƯA ĐĂNG NHẬP: nút Đăng nhập -->
          <RouterLink v-else to="/login" class="btn-login">
            <span>👤 Đăng nhập</span>
          </RouterLink>

          <!-- Giỏ hàng (badge động) -->
          <button type="button" class="header-icon-btn" title="Giỏ hàng" @click="goToCart">
            🛒
            <span v-if="cartCount > 0" class="cart-badge">
              {{ cartCount > 99 ? '99+' : cartCount }}
            </span>
          </button>
        </div>
      </div>

      <!-- NAV DANH MỤC -->
      <nav class="main-nav">
        <div class="main-nav-inner">
          <button class="nav-cat-btn" :class="{ active: filters.category_id === '' }" @click="filters.category_id = ''">
            ☰ Tất cả danh mục
          </button>
          <button v-for="cat in categories" :key="cat.id" class="nav-cat-btn"
            :class="{ active: filters.category_id === cat.id }" @click="selectCategory(cat.id)">
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
            <img v-if="currentBanner.image_url" :key="currentBanner.id"
              :src="`http://localhost:3000/uploads/banners/${currentBanner.image_url}`" alt="Banner Image"
              class="hero-img" />
          </transition>
          <div class="hero-overlay"></div>
          <div class="hero-content">
            <span class="hero-tag">🔥 Ưu đãi đặc biệt</span>
            <h1>{{ currentBanner.title }}</h1>
            <p>{{ currentBanner.description }}</p>
            <div class="hero-actions">
              <button class="btn-hero" @click="filters.sort = 'price_asc'">🔥 Săn Deal Ngay</button>
              <button class="btn-hero-outline" @click="filters.category_id = ''">
                Khám phá thêm →
              </button>
            </div>
          </div>

          <!-- Dots -->
          <div class="hero-dots" v-if="banners.length > 1">
            <button v-for="(b, idx) in banners" :key="b.id" class="dot" :class="{ active: idx === currentBannerIndex }"
              @click="goToBanner(idx)" :aria-label="`Banner ${idx + 1}`" />
          </div>
        </div>
      </div>
      <!-- KẾT QUẢ TÌM KIẾM BẰNG HÌNH ẢNH -->
      <section v-if="isSearchingByImage || imageSearchError || imageSearchResults.length > 0" class="recommend-section">
        <div class="recommend-header">
          <h2 class="recommend-title">
            📷 Kết quả tìm kiếm bằng hình ảnh
          </h2>
        </div>

        <p v-if="isSearchingByImage">
          Đang phân tích hình ảnh và tìm sản phẩm tương tự...
        </p>

        <p v-if="imageSearchError" class="text-danger">
          {{ imageSearchError }}
        </p>

        <div v-if="imageSearchResults.length > 0" class="recommend-grid">
          <div v-for="p in imageSearchResults" :key="p.product_id" class="recommend-card">
            <RouterLink :to="`/product/${p.product_id}`" class="recommend-img-link">
              <div class="recommend-img-box">
                <img v-if="p.main_image" :src="`http://localhost:3000/uploads/products/${p.main_image}`" :alt="p.name"
                  class="recommend-img" />

                <span v-else class="recommend-no-img">
                  📦
                </span>
              </div>
            </RouterLink>

            <div class="recommend-info">
              <RouterLink :to="`/product/${p.product_id}`" class="recommend-name-link">
                <h3 class="recommend-name">
                  {{ p.name || `Sản phẩm ${p.product_id}` }}
                </h3>
              </RouterLink>

              <p>
                Độ tương đồng:
                {{ (p.similarity * 100).toFixed(2) }}%
              </p>

              <button class="recommend-btn" @click="fetchVariants(p.product_id)">
                🛒 Chọn mua
              </button>
            </div>
          </div>
        </div>
      </section>
      <section v-if="recomendProduct.length > 0" class="recommend-section">
        <div class="recommend-header">
          <h2 class="recommend-title">
            <span class="recommend-icon">✨</span>
            Gợi ý dành riêng cho bạn
          </h2>
          <p class="recommend-sub">Dựa trên lịch sử mua sắm của bạn</p>
        </div>

        <div class="recommend-grid">
          <div v-for="p in recomendProduct" :key="p.id" class="recommend-card">
            <RouterLink :to="`/product/${p.id}`" class="recommend-img-link">
              <div class="recommend-img-box">
                <img v-if="p.main_image" :src="`http://localhost:3000/uploads/products/${p.main_image}`" :alt="p.name"
                  class="recommend-img" loading="lazy" />
                <span v-else class="recommend-no-img">📦</span>

                <span v-if="p.variants?.[0]?.sale_price &&
                  Number(p.variants[0].sale_price) < Number(p.variants[0].selling_price)" class="recommend-badge">
                  -{{ Math.round((1 - p.variants[0].sale_price / p.variants[0].selling_price) * 100) }}%
                </span>
              </div>
            </RouterLink>

            <div class="recommend-info">
              <RouterLink :to="`/product/${p.id}`" class="recommend-name-link">
                <h3 class="recommend-name" :title="p.name">{{ p.name }}</h3>
              </RouterLink>

              <div class="recommend-tags">
                <span class="recommend-tag recommend-tag-cat">{{ p.category_name || 'Khác' }}</span>
                <span class="recommend-tag recommend-tag-brand">{{ p.brand_name || 'Khác' }}</span>
              </div>

              <div class="recommend-price" v-if="p.variants && p.variants.length">
                <span class="recommend-price-sale">
                  {{
                    Number(
                      p.variants[0].sale_price || p.variants[0].selling_price
                    ).toLocaleString('vi-VN')
                  }}đ
                </span>
                <span v-if="p.variants[0].sale_price &&
                  Number(p.variants[0].sale_price) < Number(p.variants[0].selling_price)"
                  class="recommend-price-origin">
                  {{ Number(p.variants[0].selling_price).toLocaleString('vi-VN') }}đ
                </span>
              </div>

              <button class="recommend-btn" @click="fetchVariants(p.id)">
                🛒 Chọn mua
              </button>
            </div>
          </div>
        </div>
      </section>



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
            <span v-if="p.min_sale_price && p.min_sale_price < p.min_selling_price" class="product-badge">
              -{{ Math.round((1 - p.min_sale_price / p.min_selling_price) * 100) }}%
            </span>
            <img v-if="p.main_image" :src="`http://localhost:3000/uploads/products/${p.main_image}`" class="product-img"
              alt="Product image" loading="lazy" />
            <span v-else class="no-img">Không có ảnh</span>
          </div>

          <div class="product-info">
            <RouterLink :to="`/product/${p.id}`" class="product-name-link">
              <h4 class="product-name" :title="p.name">{{ p.name }}</h4>
            </RouterLink>
            <div class="product-rating" >
              <span v-if="p.avg_review > 0">
                {{
                  Number(p.avg_review).toLocaleString('vi-VN', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })
                }}⭐
              </span>
              <span>(Đã bán {{ p.count_sell }})</span>
            </div>
            
            <div class="product-tags">
              <span class="tag tag-category">{{ p.category_name || 'Khác' }}</span>
              <span class="tag tag-brand">{{ p.brand_name || 'Khác' }}</span>
            </div>
            <div class="product-price">
              <span class="price-sale">
                {{
                  p.min_sale_price
                    ? Number(p.min_sale_price).toLocaleString('vi-VN')
                    : Number(p.min_selling_price).toLocaleString('vi-VN')
                }}
                ₫
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
              <img v-if="variant.image_url" :src="`http://localhost:3000/uploads/variants/${variant.image_url}`"
                class="variant-img" alt="Variant image" />
              <div class="variant-details">
                <p><b>SKU:</b> {{ variant.sku }}</p>
                <div class="variant-price">
                  <span class="price-sale">
                    {{
                      variant.sale_price
                        ? Number(variant.sale_price).toLocaleString('vi-VN')
                        : Number(variant.selling_price).toLocaleString('vi-VN')
                    }}
                    ₫
                  </span>
                  <span v-if="variant.sale_price" class="price-original">
                    {{ Number(variant.selling_price).toLocaleString('vi-VN') }} ₫
                  </span>
                </div>
              </div>
              <div class="variant-actions">
                <div class="qty-control">
                  <button class="qty-btn" @click="decreaseQty(variant.id)">−</button>
                  <input type="number" v-model="quantities[variant.id]" min="1" class="qty-input" />
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
          <p>📞 Tư vấn mua hàng: <b>1900 0000</b></p>
          <p>📧 Email hỗ trợ: <b>hieub2306615@student.ctu.edu.vn</b></p>
        </div>
      </div>
      <div class="footer-bottom">
        &copy; 2026 Bản quyền thuộc về TechStore. All rights reserved.
      </div>
    </footer>
  </div>
</template>

<style scoped>
@import '../../assets/Home.css'
</style>
