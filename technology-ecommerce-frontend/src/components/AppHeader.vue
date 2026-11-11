<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { setImageSearchFile } from '@/utils/imageSearchStore'
import axios from 'axios'

const router = useRouter()

// ====== AUTH ======
const token = localStorage.getItem('token')
const user = JSON.parse(localStorage.getItem('user') || '{}')
const isLoggedIn = computed(() => !!token && !!user?.id)

const userAvatarUrl = computed(() => {
    const avatar = user?.avatar || user?.avatar_url
    if (!avatar) return ''
    return `http://localhost:3000/uploads/avatars/${avatar}`
})
const userInitials = computed(() => {
    const name = user?.full_name?.trim()
    if (!name) return '?'
    const parts = name.split(/\s+/)
    return parts.length === 1
        ? parts[0].charAt(0).toUpperCase()
        : (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
})

// ====== TOAST ======
const showToast = ref(false)
const toastMsg = ref('')
const toastType = ref('success')
let toastTimer = null
const triggerToast = (msg, type = 'success') => {
    toastMsg.value = msg
    toastType.value = type
    showToast.value = true
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => (showToast.value = false), 3000)
}

// ====== GIỎ HÀNG ======
const cartCount = ref(0)
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
        cartCount.value = items.reduce((s, i) => s + Number(i.quantity || 0), 0)
    } catch {
        cartCount.value = 0
    }
}

// ====== SEARCH ======
const keyword = ref('')
const isSearchFocused = ref(false)
const isListening = ref(false)

const handleSearch = () => {
    const q = keyword.value.trim()
    // Quay về Home, mang theo keyword qua URL
    // Home.vue sẽ đọc route.query.keyword để load sản phẩm
    router.push({ path: '/home', query: q ? { keyword: q } : {} })
}

const startVoiceSearch = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
        triggerToast('Trình duyệt không hỗ trợ tìm kiếm giọng nói!', 'error')
        return
    }
    const rec = new SR()
    rec.lang = 'vi-VN'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onstart = () => (isListening.value = true)
    rec.onresult = (e) => {
        keyword.value = e.results[0][0].transcript.replace(/[.,]/g, '')
        handleSearch()
    }
    rec.onerror = () => (isListening.value = false)
    rec.onend = () => (isListening.value = false)
    rec.start()
}

// ====== ẢNH → lưu File → về /home để hiện kết quả ======
const imageInput = ref(null)
const openImagePicker = () => imageInput.value?.click()

const onPickImage = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    // Kiểm tra đúng là file ảnh
    if (!file.type.startsWith('image/')) {
        triggerToast('Vui lòng chọn file hình ảnh.', 'error')
        return
    }

    // Lưu file vào kho tạm
    setImageSearchFile(file)

    // Chuyển về trang chủ với cờ image_search=1
    router.push({ path: '/home', query: { image_search: '1' } })
}

// ====== ĐIỀU HƯỚNG ======
const goToCart = () => {
    if (!isLoggedIn.value) {
        triggerToast('Vui lòng đăng nhập để xem giỏ hàng', 'error')
        setTimeout(() => router.push('/login?redirect=/cart'), 800)
        return
    }
    router.push('/cart')
}

// ====== LIFECYCLE ======
onMounted(() => {
    fetchCartCount()
})
</script>

<template>
    <!-- Toast riêng của Header -->
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
                   <span class="material-symbols-outlined">
                        notifications
                    </span>Thông báo
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
            <RouterLink to="/home" class="header-logo">
                <h2>Tech<span>Store</span></h2>
            </RouterLink>

            <div class="header-search" :class="{ focused: isSearchFocused }">
                <input type="text" v-model="keyword" placeholder="Bạn cần tìm laptop, điện thoại, phụ kiện...?"
                    @focus="isSearchFocused = true" @blur="isSearchFocused = false" @keyup.enter="handleSearch" />
                <button class="btn-voice" :class="{ listening: isListening }" @click="startVoiceSearch"
                    :title="isListening ? 'Đang nghe...' : 'Tìm kiếm giọng nói'">
                    <span class="material-symbols-outlined">
                        {{ isListening ? 'graphic_eq' : 'mic' }}
                    </span>
                </button>
                <button type="button" class="btn-voice" title="Tìm kiếm bằng hình ảnh" @click="openImagePicker">
                    <span class="material-symbols-outlined">
                        image_search
                    </span>
                </button>
                <input ref="imageInput" type="file" accept="image/*" hidden @change="onPickImage" />
                <button class="btn-search" @click="handleSearch"><span class="material-symbols-outlined">
                        search
                    </span> </button>
            </div>

            <div class="header-actions">
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
                <RouterLink v-else to="/login" class="btn-login">
                    <span>👤 Đăng nhập</span>
                </RouterLink>

                <button type="button" class="header-icon-btn" title="Giỏ hàng" @click="goToCart">
                    🛒
                    <span v-if="cartCount > 0" class="cart-badge">
                        {{ cartCount > 99 ? '99+' : cartCount }}
                    </span>
                </button>
            </div>
        </div>
    </header>
</template>

<style scoped>
@import '@/assets/Home.css';
</style>