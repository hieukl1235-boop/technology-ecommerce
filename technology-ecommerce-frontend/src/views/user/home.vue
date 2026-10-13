<script setup>
import { ref, onMounted, watch } from 'vue'
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
  limit: 2,
  offset: 0,
})
const banners = ref([]) // <-- Thêm biến lưu danh sách banner
const hasMore = ref(true)

// --- BIẾN THỂ & MODAL ---
const variants = ref([])
const quantities = ref({})
const showModal = ref(false)

// --- TOAST NOTIFICATION (THÔNG BÁO NỔI) ---
const showToast = ref(false)
const toastMsg = ref('')
const toastType = ref('success') // 'success' hoặc 'error'

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
    const response = await axios.get(`${API_BASE_URL}/admin/categories`)
    categories.value = response.data
  } catch (error) {
    console.error('Lỗi tải danh mục:', error)
  }
}
const fetchBanners = async () => {
  try {
    // Sửa lại URL cho đúng với route client (hoặc dùng ${API_BASE_URL}/banners)
    const response = await axios.get(`${API_BASE_URL}/admin/banners`)

    banners.value = response.data.data || []
    console.log('Banners:', banners.value) // <-- Kiểm tra dữ liệu banner
  } catch (error) {
    console.error('Lỗi tải banner:', error)
  }
}
const fetchBrands = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/brands`)
    brands.value = response.data
  } catch (error) {
    console.error('Lỗi tải thương hiệu:', error)
  }
}

const fetchProducts = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/`, { params: filters.value })
    products.value = Array.isArray(response.data) ? response.data : response.data.data || []
  } catch (error) {
    console.error('Lỗi tải sản phẩm:', error)
  }
}
// Hàm reset bộ lọc về mặc định
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
// --- XEM THÊM / THU GỌN ---
const loadAllProducts = () => {
  filters.value.limit = 1000
  hasMore.value = false
  fetchProducts()
}

const collapseProducts = () => {
  filters.value.limit = 2
  hasMore.value = true
  fetchProducts()
}

// --- HÀM MUA HÀNG ---
async function fetchVariants(productId) {
  try {
    const response = await axios.get(`http://localhost:3000/api/product-variants/${productId}`)
    variants.value = response.data
    variants.value.forEach((v) => {
      quantities.value[v.id] = 1
    })
    showModal.value = true
  } catch (error) {
    console.error('Lỗi tải biến thể sản phẩm:', error)
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
      {
        variant_id: variantId,
        quantity: quantity,
      },
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

// --- HÀM TÌM KIẾM BẰNG GIỌNG NÓI ---
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

// --- WATCH LOGIC ---
watch(
  () => ({ ...filters.value }),
  (newVal, oldVal) => {
    if (newVal.limit !== oldVal.limit) return
    filters.value.limit = 2
    hasMore.value = true
    fetchProducts()
  },
  { deep: true },
)
const handleCheckout = async (variantId, quantity) => {
  try{
    const res = await axios.get(`http://localhost:3000/api/product-variants/${variantId}/variants`)
    const variantselect =[ {
      image: res.data.image,
      product_name: res.data.name,
      quantity: quantity,
      sale_price: res.data.sale_price,
      selling_price:res.data.selling_price,
      sku:res.data.sku,
      variant_id: variantId
    }]
    localStorage.setItem('checkout_items',JSON.stringify(variantselect))
    router.push('/checkout')
  }
  catch(error)
  {
    console.log("lỗi là: ", error);

  }
}

onMounted(() => {
  fetchCategories()
  fetchBrands()
  fetchProducts()
  fetchBanners()
})

const user = JSON.parse(localStorage.getItem('user') || '{}')
</script>

<template>
  <div class="store-layout">
    <!-- TOAST THÔNG BÁO NỔI -->
    <div
      class="toast-notification"
      :class="{ 'toast-show': showToast, 'toast-error': toastType === 'error' }"
    >
      {{ toastMsg }}
    </div>

    <!-- HEADER (Dính chặt trên cùng) -->
    <header class="store-header">
      <div class="header-logo">
        <h2>Tech<span>Store</span></h2>
      </div>
      <div class="header-user">
        Xin chào, <b>{{ user.full_name || 'Khách' }}</b>
      </div>
      <div class="header-links">
        <RouterLink to="/notifications" class="nav-link">🔔 Thông báo</RouterLink>
        <RouterLink to="/cart" class="nav-link cart-link">
          🛒 Giỏ hàng
          <span class="cart-badge">3</span>
          <!-- Chấm đỏ -->
        </RouterLink>
        <RouterLink to="/account" class="nav-link">👤 Tài khoản</RouterLink>
      </div>
    </header>

    <div class="main-content">
      <!-- KHU VỰC HERO BANNER ĐỘNG -->
      <div
        v-for="b in banners"
        :key="b.id"
        class="hero-banner"
        style="
          position: relative;
          width: 100%;
          height: 260px;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
        "
      >
        <!-- Hình nền banner -->
        <img
          v-if="b.image_url"
          :src="`http://localhost:3000/uploads/banners/${b.image_url}`"
          alt="Banner Image"
          style="
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 1;
          "
        />

        <!-- Lớp phủ mờ (Overlay) giúp chữ không bị chìm vào ảnh -->
        <div
          style="
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.35);
            z-index: 2;
          "
        ></div>

        <!-- Nội dung chữ và nút bấm đè lên trên -->
        <div
          class="hero-content"
          style="position: relative; z-index: 3; padding: 0 40px; color: #fff"
        >
          <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: bold">{{ b.title }} 💥</h1>
          <p style="margin: 0 0 15px 0; font-size: 15px; color: #f1f1f1; max-width: 600px">
            {{ b.description }}
          </p>
          <button
            class="btn-hero"
            @click="filters.sort = 'price_asc'"
            style="
              padding: 9px 18px;
              background: #ffc107;
              color: #000;
              font-weight: bold;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            "
          >
            🔥 Săn Deal Ngay
          </button>
        </div>
      </div>

      <!-- DANH MỤC NÚT BẤM (PILLS) -->
      <div class="category-pills">
        <button
          class="pill-btn"
          :class="{ active: filters.category_id === '' }"
          @click="filters.category_id = ''"
        >
          🌟 Tất cả
        </button>
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="pill-btn"
          :class="{ active: filters.category_id === cat.id }"
          @click="filters.category_id = cat.id"
        >
          {{ cat.name }}
        </button>
      </div>

      <!-- BỘ LỌC CƠ BẢN -->
      <div class="filter-bar">
        <!-- BẠN NHỚ THÊM CHỮ search-group VÀO ĐÂY NHÉ 👇 -->
        <div class="filter-item search-group">
          <label>Tìm kiếm:</label>
          <div class="search-input-wrapper">
            <input type="text" v-model="filters.keyword" placeholder="Nhập tên sản phẩm..." />
            <button
              class="btn-voice"
              :class="{ listening: isListening }"
              @click="startVoiceSearch"
              :title="isListening ? 'Đang nghe...' : 'Tìm kiếm giọng nói'"
            >
              {{ isListening ? '🎙️ Đang nghe' : '🎤 Nói' }}
            </button>
          </div>
        </div>

        <div class="filter-item">
          <label>Thương hiệu:</label>
          <select v-model="filters.brand_id">
            <option value="">Tất cả</option>
            <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
        </div>
        <div class="filter-item">
          <label>Giá từ:</label>
          <input type="number" v-model="filters.min_price" placeholder="0 ₫" />
        </div>
        <div class="filter-item">
          <label>Đến giá:</label>
          <input type="number" v-model="filters.max_price" placeholder="Không giới hạn" />
        </div>
        <div class="filter-item">
          <label>Sắp xếp:</label>
          <select v-model="filters.sort">
            <option value="latest">Mới nhất</option>
            <option value="price_asc">Giá: Thấp đến Cao</option>
            <option value="price_desc">Giá: Cao đến Thấp</option>
          </select>
        </div>
        <div class="filter-item btn-align">
          <!-- Nút reset bộ lọc -->
          <div>
            <button
              @click="resetFilters"
              class="btn-reset"
              style="
                padding: 7px 12px;
                background: #ddd;
                border: none;
                cursor: pointer;
                border-radius: 4px;
              "
            >
              Xóa lọc
            </button>
          </div>
        </div>
      </div>

      <!-- DANH SÁCH SẢN PHẨM -->
      <div v-if="products.length === 0" class="empty-state">
        <img src="https://cdn-icons-png.flaticon.com/512/2748/2748558.png" alt="Empty" />
        <p>Không tìm thấy sản phẩm nào phù hợp.</p>
      </div>

      <div class="product-grid">
        <div class="product-card" v-for="p in products" :key="p.id">
          <!-- Ảnh và Nhãn Giảm Giá -->
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
            />
            <span v-else class="no-img">Không có ảnh</span>
          </div>

          <div class="product-info">
         <RouterLink :to="`/product/${p.id}`">   <h4 class="product-name" :title="p.name">{{ p.name }}</h4></RouterLink>
            <div class="product-rating" v-if="p.avg_review >0">{{Number(p.avg_review).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}}⭐ <span>(Đã bán {{ p.count_sell }})</span></div>

            <div class="product-tags">
              <span class="tag tag-category">{{ p.category_name || 'Khác' }}</span>
              <span class="tag tag-brand">{{ p.brand_name || 'Khác' }}</span>
            </div>
            <div class="product-price">
              <span class="price-sale"
                >{{
                  p.min_sale_price
                    ? Number(p.min_sale_price).toLocaleString('vi-VN')
                    : Number(p.min_selling_price).toLocaleString('vi-VN')
                }}
                ₫</span
              >
              <span v-if="p.min_sale_price" class="price-original"
                >{{ Number(p.min_selling_price).toLocaleString('vi-VN') }} ₫</span
              >
            </div>
          </div>
          <button class="btn-primary" @click="fetchVariants(p.id)">🛒 Chọn mua</button>
        </div>
      </div>

      <!-- XEM THÊM / THU GỌN -->
      <div class="load-more" v-if="products.length > 0">
        <button v-if="hasMore" class="btn-outline-primary" @click="loadAllProducts">
          ⬇ Xem thêm tất cả
        </button>
        <button v-else class="btn-outline-secondary" @click="collapseProducts">⬆ Thu gọn</button>
      </div>
    </div>

    <!-- MODAL POPUP -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-container">
        <div class="modal-header">
          <h3>Chọn phân loại sản phẩm</h3>
          <button class="btn-close" @click="showModal = false" title="Đóng">✖</button>
        </div>
        <div class="modal-body">
          <div v-if="variants.length === 0" class="empty-state">
            Sản phẩm này hiện chưa có phân loại nào.
          </div>
          <div v-else class="variant-list">
            <div v-for="variant in variants" :key="variant.id" class="variant-item">
              <img
                v-if="variant.image_url"
                :src="`http://localhost:3000/uploads/variants/${variant.image_url}`"
                class="variant-img"
              />
              <div class="variant-details">
                <p><b>SKU:</b> {{ variant.sku }}</p>
                <div class="variant-price">
                  <span class="price-sale"
                    >{{
                      variant.sale_price
                        ? Number(variant.sale_price).toLocaleString('vi-VN')
                        : Number(variant.selling_price).toLocaleString('vi-VN')
                    }}
                    ₫</span
                  >
                  <span v-if="variant.sale_price" class="price-original"
                    >{{ Number(variant.selling_price).toLocaleString('vi-VN') }} ₫</span
                  >
                </div>
              </div>
              <div class="variant-actions">
                <div class="qty-control">
                  <label>SL:</label>
                  <input type="number" v-model="quantities[variant.id]" min="1" class="qty-input" />
                </div>
                <div class="btn-group">
                  <button
                    class="btn-add-cart"
                    @click="addToCart(variant.id, quantities[variant.id])"
                  >
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
      <!-- Mặc định như cũ -->
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
            <li><a href="#">Bảo hành</a></li>
            <li><a href="#">Đổi trả 30 ngày</a></li>
            <li><a href="#">Giao hàng</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Tổng Đài Hỗ Trợ</h4>
          <p>📞 Tư vấn: <b>1800.xxxx</b></p>
          <p>📧 Email: <b>cskh@store.vn</b></p>
        </div>
      </div>
      <div class="footer-bottom">&copy; 2026 Bản quyền thuộc về TechStore.</div>
    </footer>
  </div>
</template>

<style scoped>
/* Tổng quan trang web */
.store-layout {
  font-family: 'Segoe UI', sans-serif;
  background: #f4f6f9;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.main-content {
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
.page-title {
  display: none;
} /* Ẩn đi vì đã có Banner */

/* TOAST THÔNG BÁO NỔI */
.toast-notification {
  position: fixed;
  top: 20px;
  right: -300px;
  background: #28a745;
  color: white;
  padding: 15px 25px;
  border-radius: 8px;
  font-weight: bold;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  transition: right 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  z-index: 9999;
}
.toast-show {
  right: 20px;
}
.toast-error {
  background: #dc3545;
}

/* HEADER STICKY */
.store-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 15px 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 900;
}
.header-logo h2 {
  margin: 0;
  color: #333;
  font-weight: 900;
}
.header-logo span {
  color: #007bff;
}
.header-links {
  display: flex;
  gap: 20px;
  align-items: center;
}
.nav-link {
  text-decoration: none;
  color: #555;
  font-weight: 600;
  transition: color 0.2s;
  position: relative;
}
.nav-link:hover {
  color: #007bff;
}
.cart-link {
  position: relative;
  display: inline-block;
  padding-right: 10px;
}
.cart-badge {
  position: absolute;
  top: -8px;
  right: -5px;
  background: #ff4d4f;
  color: white;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 20px;
  font-weight: bold;
  border: 2px solid #fff;
}

/* HERO BANNER */
.hero-banner {
  border-radius: 16px;
  padding: 50px 30px;
  color: white;
  margin-bottom: 30px;
  box-shadow: 0 10px 20px rgba(0, 123, 255, 0.2);
}
.hero-content h1 {
  font-size: 36px;
  margin: 0 0 15px 0;
  font-weight: 800;
}
.hero-content p {
  font-size: 16px;
  margin: 0 0 25px 0;
  opacity: 0.9;
}
.btn-hero {
  background: #ffc107;
  color: #333;
  border: none;
  padding: 12px 30px;
  font-size: 16px;
  font-weight: bold;
  border-radius: 30px;
  cursor: pointer;
  transition: 0.3s;
}
.btn-hero:hover {
  background: #ffca2c;
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(255, 193, 7, 0.4);
}

/* DANH MỤC PILLS */
.category-pills {
  display: flex;
  gap: 10px;
  margin-bottom: 25px;
  overflow-x: auto;
  padding-bottom: 10px;
}
.category-pills::-webkit-scrollbar {
  height: 6px;
}
.category-pills::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 10px;
}
.pill-btn {
  padding: 10px 20px;
  border: 1px solid #e0e0e0;
  background: #fff;
  border-radius: 30px;
  font-weight: 600;
  color: #555;
  cursor: pointer;
  white-space: nowrap;
  transition: 0.3s;
}
.pill-btn:hover {
  border-color: #007bff;
  color: #007bff;
}
.pill-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
  box-shadow: 0 5px 15px rgba(0, 123, 255, 0.3);
}

/* BỘ LỌC CƠ BẢN */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  margin-bottom: 25px;
}
.filter-item {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 140px;
}
.search-group {
  min-width: 250px;
}
.filter-item label {
  font-size: 13px;
  color: #555;
  margin-bottom: 6px;
  font-weight: 600;
}
.filter-item input,
.filter-item select {
  padding: 9px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  outline: none;
  transition: 0.2s;
  background: #fafafa;
}
.filter-item input:focus,
.filter-item select:focus {
  border-color: #007bff;
  background: #fff;
}
.btn-align {
  justify-content: flex-end;
}
.btn-reset {
  padding: 10px 15px;
  background: #e9ecef;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
/* Ép khối tìm kiếm to gấp đôi các khối khác để có chỗ chứa nút Micro */
.search-group {
  flex: 2 !important;
  min-width: 280px;
}

/* Ép input không được tự ý phình to làm vỡ khung */
.search-input-wrapper input {
  flex: 1;
  height: 100%;
  min-width: 0; /* Thuộc tính cực kỳ quan trọng để sửa lỗi đè lên nhau */
}
/* Micro Search */
.search-input-wrapper {
  display: flex;
  gap: 8px;
}
.search-input-wrapper input {
  flex: 1;
}
.btn-voice {
  padding: 0 15px;
  background: #ff4d4f;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: 0.2s;
  white-space: nowrap;
}
.btn-voice:hover {
  background: #e04345;
}
.btn-voice.listening {
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 77, 79, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 77, 79, 0);
  }
}

/* THẺ SẢN PHẨM HIỆN ĐẠI */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}
.product-card {
  background: #fff;
  border-radius: 16px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  transition: 0.3s;
  border: 1px solid #f0f0f0;
  position: relative;
  overflow: hidden;
}
.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.08);
  border-color: #007bff;
}
.product-img-wrapper {
  width: 100%;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 15px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
}
.product-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.5s;
}
.product-card:hover .product-img {
  transform: scale(1.08);
}
.product-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ff4d4f;
  color: white;
  font-weight: bold;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
  z-index: 2;
  box-shadow: 0 4px 8px rgba(255, 77, 79, 0.3);
}
.product-name {
  font-size: 16px;
  font-weight: 600;
  color: #2b2b2b;
  margin: 0 0 5px 0;
  height: 45px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.product-rating {
  font-size: 12px;
  margin-bottom: 10px;
}
.product-rating span {
  color: #888;
  margin-left: 5px;
}
.product-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.tag {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: bold;
}
.tag-category {
  background: #e8f4fd;
  color: #007bff;
}
.tag-brand {
  background: #fdf3e8;
  color: #fd7e14;
}
.price-sale {
  color: #d70018;
  font-weight: 800;
  font-size: 18px;
  display: block;
}
.price-original {
  color: #999;
  text-decoration: line-through;
  font-size: 13px;
}
.btn-primary {
  width: 100%;
  padding: 12px;
  background: #f0f7ff;
  color: #007bff;
  border: 1px solid #cce5ff;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  margin-top: auto;
  transition: 0.3s;
}
.product-card:hover .btn-primary {
  background: #007bff;
  color: white;
}

/* TRẠNG THÁI RỖNG */
.empty-state {
  text-align: center;
  color: #888;
  padding: 60px 20px;
  font-size: 16px;
  background: #fff;
  border-radius: 16px;
}
.empty-state img {
  width: 120px;
  margin-bottom: 20px;
  opacity: 0.5;
  filter: grayscale(100%);
}
.load-more {
  text-align: center;
  margin-top: 40px;
}
.btn-outline-primary,
.btn-outline-secondary {
  padding: 12px 30px;
  border-radius: 30px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.3s;
}
.btn-outline-primary {
  background: transparent;
  color: #007bff;
  border: 2px solid #007bff;
}
.btn-outline-primary:hover {
  background: #007bff;
  color: white;
  box-shadow: 0 5px 15px rgba(0, 123, 255, 0.3);
}
.btn-outline-secondary {
  background: #f8f9fa;
  color: #666;
  border: 2px solid #ddd;
}
.btn-outline-secondary:hover {
  background: #e9ecef;
  border-color: #ccc;
}

/* MODAL & FOOTER giữ nguyên như bản chuẩn */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-container {
  background: #fff;
  width: 95%;
  max-width: 600px;
  max-height: 85vh;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
}
@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
.modal-header {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
}
.btn-close {
  background: #f0f0f0;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-weight: bold;
  color: #555;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-close:hover {
  background: #ff4d4f;
  color: white;
  transform: rotate(90deg);
}
.modal-body {
  padding: 20px;
  overflow-y: auto;
}
.variant-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.variant-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 12px;
  background: #fff;
  transition: 0.2s;
}
.variant-item:hover {
  border-color: #007bff;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.1);
}
.variant-img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  border-radius: 8px;
  margin-right: 15px;
  background: #f8f9fa;
  padding: 5px;
}
.variant-details {
  flex: 1;
}
.variant-details p {
  margin: 0 0 5px 0;
  color: #333;
}
.variant-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}
.qty-control {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  color: #555;
}
.qty-input {
  width: 60px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 8px;
  text-align: center;
}
.btn-group {
  display: flex;
  gap: 8px;
}
.btn-add-cart {
  padding: 8px 12px;
  background: #fff;
  color: #e67e22;
  border: 2px solid #e67e22;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.2s;
}
.btn-add-cart:hover {
  background: #e67e22;
  color: white;
}
.btn-buy-now {
  padding: 8px 15px;
  background: #ff4d4f;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.2s;
  box-shadow: 0 4px 10px rgba(255, 77, 79, 0.3);
}
.btn-buy-now:hover {
  background: #d32f2f;
  transform: translateY(-2px);
}

.store-footer {
  background: #1a1a2e;
  color: #ecf0f1;
  padding: 50px 0 0 0;
  margin-top: auto;
}
.footer-container {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 40px;
}
.footer-col {
  flex: 1;
  min-width: 250px;
}
.footer-col h4 {
  font-size: 16px;
  margin-bottom: 20px;
  color: #4facfe;
  text-transform: uppercase;
  font-weight: bold;
  letter-spacing: 1px;
}
.footer-col p,
.footer-col a {
  color: #a0aabf;
  font-size: 14px;
  text-decoration: none;
  line-height: 1.8;
}
.footer-col a:hover {
  color: #fff;
}
.footer-bottom {
  text-align: center;
  padding: 15px;
  background: #121220;
  font-size: 13px;
  color: #7f8c8d;
}
</style>
