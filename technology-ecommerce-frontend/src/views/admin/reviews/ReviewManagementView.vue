<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const API = 'http://localhost:3000/api/admin/reviews'
const UPLOADS = 'http://localhost:3000/uploads'

const token = localStorage.getItem('token')
const authHeaders = { headers: { Authorization: `Bearer ${token}` } }

// --- STATE ---
const reviews = ref([])
const loading = ref(true)
const keyword = ref('')
const ratingFilter = ref(0)
const statusFilter = ref('all') // 'all' | 'replied' | 'pending'

// Modal phản hồi
const showReplyModal = ref(false)
const replyTarget = ref(null)
const replyContent = ref('')
const replyLoading = ref(false)

// Modal xóa
const showDeleteModal = ref(false)
const deleteTarget = ref(null)

// Lightbox ảnh
const lightboxSrc = ref('')

// Toast
const toast = ref({ show: false, msg: '', type: 'success' })
let toastTimer = null
const showToast = (msg, type = 'success') => {
    toast.value = { show: true, msg, type }
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => (toast.value.show = false), 3000)
}

// --- LOAD ---
const fetchReviews = async () => {
    loading.value = true
    try {
        const res = await axios.get(API, authHeaders)
        const list = Array.isArray(res.data) ? res.data : res.data.data || []
        // Loại bỏ dữ liệu nhạy cảm không cần hiển thị
        reviews.value = list.map(({ password, google_id, ...safe }) => safe)
    } catch (e) {
        console.error('Lỗi tải đánh giá:', e)
        showToast('Không tải được danh sách đánh giá', 'error')
    } finally {
        loading.value = false
    }
}

onMounted(fetchReviews)

// --- HELPERS ---
const stars = (n) => '★'.repeat(Number(n)) + '☆'.repeat(5 - Number(n))
const formatDate = (d) =>
    new Date(d).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
const userInitial = (r) => (r.full_name || '?').charAt(0).toUpperCase()

// --- FILTER ---
const filtered = computed(() => {
    return reviews.value.filter((r) => {
        if (keyword.value.trim()) {
            const k = keyword.value.toLowerCase()
            const match =
                (r.product_name || '').toLowerCase().includes(k) ||
                (r.content || '').toLowerCase().includes(k) ||
                (r.title || '').toLowerCase().includes(k) ||
                (r.full_name || '').toLowerCase().includes(k) ||
                (r.email || '').toLowerCase().includes(k) ||
                String(r.user_id).includes(k)
            if (!match) return false
        }
        if (ratingFilter.value && Number(r.rating) !== ratingFilter.value) return false
        if (statusFilter.value === 'replied' && !r.reply) return false
        if (statusFilter.value === 'pending' && r.reply) return false
        return true
    })
})

// --- STATS ---
const stats = computed(() => {
    const total = reviews.value.length
    const replied = reviews.value.filter((r) => r.reply).length
    const avg =
        total > 0
            ? (reviews.value.reduce((s, r) => s + Number(r.rating), 0) / total).toFixed(1)
            : '0.0'
    return { total, replied, pending: total - replied, avg }
})

// --- REPLY ---
const openReply = (r) => {
    replyTarget.value = r
    replyContent.value = r.reply || ''
    showReplyModal.value = true
}

const submitReply = async () => {
    if (!replyContent.value.trim()) {
        showToast('Vui lòng nhập nội dung phản hồi', 'error')
        return
    }
    replyLoading.value = true
    try {
        await axios.post(
            `${API}/${replyTarget.value.id}/reply`,
            { replyContent: replyContent.value.trim() },
            authHeaders,
        )
        showToast('Đã gửi phản hồi', 'success')
        showReplyModal.value = false
        await fetchReviews()
    } catch (e) {
        showToast(e.response?.data?.message || 'Gửi phản hồi thất bại', 'error')
    } finally {
        replyLoading.value = false
    }
}

const deleteReply = (r) => {
    deleteTarget.value = r
    showDeleteModal.value = true
}

const confirmDeleteReply = async () => {
    if (!deleteTarget.value) return
    try {
        await axios.patch(`${API}/deleteReply/${deleteTarget.value.id}`, authHeaders)
        showToast('Đã xóa phản hồi', 'success')
        showDeleteModal.value = false
        deleteTarget.value = null
        await fetchReviews()
    } catch (e) {
        showToast(e.response?.data?.message || 'Xóa phản hồi thất bại', 'error')
    }
}
</script>

<template>
    <div >
        

        <!-- STATS -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">💬</div>
                <div>
                    <div class="stat-value">{{ stats.total }}</div>
                    <div class="stat-label">Tổng đánh giá</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⭐</div>
                <div>
                    <div class="stat-value">{{ stats.avg }}</div>
                    <div class="stat-label">Điểm trung bình</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">✅</div>
                <div>
                    <div class="stat-value">{{ stats.replied }}</div>
                    <div class="stat-label">Đã phản hồi</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⏳</div>
                <div>
                    <div class="stat-value">{{ stats.pending }}</div>
                    <div class="stat-label">Chờ phản hồi</div>
                </div>
            </div>
        </div>

        <!-- TOOLBAR -->
        <div class="toolbar">
            <input v-model="keyword" type="text" class="search-input"
                placeholder="🔍 Tìm theo sản phẩm, nội dung, tên, email..." />
            <select v-model="ratingFilter" class="select">
                <option :value="0">Tất cả sao</option>
                <option v-for="n in [5, 4, 3, 2, 1]" :key="n" :value="n">{{ n }} sao</option>
            </select>
            <select v-model="statusFilter" class="select">
                <option value="all">Tất cả trạng thái</option>
                <option value="replied">Đã phản hồi</option>
                <option value="pending">Chờ phản hồi</option>
            </select>
        </div>

        <!-- LOADING -->
        <div v-if="loading" class="state-box">
            <div class="spinner"></div>
            <p>Đang tải đánh giá...</p>
        </div>

        <!-- EMPTY -->
        <div v-else-if="filtered.length === 0" class="state-box">
            <div class="state-icon">📭</div>
            <p class="state-title">Không có đánh giá nào</p>
            <p class="state-sub">Thử đổi bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>

        <!-- LIST -->
        <template v-else>
            <p class="result-count">Hiển thị {{ filtered.length }} đánh giá</p>

            <div class="review-list">
                <article v-for="r in filtered" :key="r.id" class="review-card">
                    <!-- USER -->
                    <div class="review-top">
                        <div class="user-block">
                            <div class="avatar">
                                <img v-if="r.avatar" :src="`${UPLOADS}/avatars/${r.avatar}`" :alt="r.full_name"
                                    class="avatar-img" @error="$event.target.style.display = 'none'" />
                                <span v-else>{{ userInitial(r) }}</span>
                            </div>
                            <div class="user-meta">
                                <div class="user-line">
                                    <span class="user-name">{{ r.full_name || 'Người dùng #' + r.user_id }}</span>
                                    <span class="dot">•</span>
                                    <span class="date">{{ formatDate(r.created_at) }}</span>
                                </div>
                                <div v-if="r.email" class="user-email">{{ r.email }}</div>
                                <div class="rating-line">
                                    <span class="stars">{{ stars(r.rating) }}</span>
                                    <span class="rating-num">{{ r.rating }}/5</span>
                                </div>
                            </div>
                        </div>

                        <div class="status-badge" :class="r.reply ? 'replied' : 'pending'">
                            {{ r.reply ? '✅ Đã phản hồi' : '⏳ Chờ phản hồi' }}
                        </div>
                    </div>

                    <!-- PRODUCT -->
                    <div class="product-line">
                        <button type="button" class="product-thumb"
                            @click="r.image_url && (lightboxSrc = `${UPLOADS}/variants/${r.image_url}`)">
                            <img v-if="r.image_url" :src="`${UPLOADS}/variants/${r.image_url}`" :alt="r.product_name"
                                loading="lazy" />
                            <span v-else class="thumb-empty">📦</span>
                        </button>
                        <div class="product-text">
                            <span class="product-name">{{ r.product_name }}</span>
                            <span class="sku-text">SKU: {{ r.sku }}</span>
                        </div>
                    </div>

                    <!-- BODY -->
                    <div class="review-body">
                        <h3 v-if="r.title" class="review-title">{{ r.title }}</h3>
                        <p class="review-content">{{ r.content }}</p>
                    </div>

                    <!-- REPLY -->
                    <div v-if="r.reply" class="reply-box">
                        <div class="reply-head">
                            <span class="reply-label">💬 Phản hồi của cửa hàng</span>
                            <button class="btn-del-reply" @click="deleteReply(r)" title="Xóa phản hồi">
                                🗑️ Xóa
                            </button>
                        </div>
                        <p class="reply-text">{{ r.reply }}</p>
                    </div>

                    <!-- ACTIONS -->
                    <div class="review-actions">
                        <button class="btn-reply" @click="openReply(r)">
                            {{ r.reply ? '✏️ Sửa phản hồi' : '💬 Phản hồi' }}
                        </button>
                    </div>
                </article>
            </div>
           
        </template>
        

        <!-- MODAL REPLY -->
        <transition name="fade">
            <div v-if="showReplyModal" class="modal-overlay" @click.self="showReplyModal = false">
                <div class="modal-card">
                    <h3>{{ replyTarget?.reply ? 'Sửa phản hồi' : 'Phản hồi đánh giá' }}</h3>
                    <div class="modal-quote">
                        <div class="quote-user">{{ replyTarget?.full_name || 'Người dùng #' + replyTarget?.user_id }}
                        </div>
                        <div class="quote-rating">{{ stars(replyTarget?.rating) }}</div>
                        <p class="quote-content">{{ replyTarget?.content }}</p>
                    </div>
                    <textarea v-model="replyContent" rows="5" class="reply-textarea"
                        placeholder="Nhập nội dung phản hồi tới khách hàng..."></textarea>
                    <div class="modal-actions">
                        <button class="btn-cancel" @click="showReplyModal = false">Hủy</button>
                        <button class="btn-primary" :disabled="replyLoading" @click="submitReply">
                            {{ replyLoading ? 'Đang gửi...' : 'Gửi phản hồi' }}
                        </button>
                    </div>
                </div>
            </div>
        </transition>

        <!-- MODAL DELETE REPLY -->
        <transition name="fade">
            <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
                <div class="modal-card small">
                    <div class="confirm-icon">🗑️</div>
                    <h3>Xóa phản hồi?</h3>
                    <p class="confirm-text">
                        Phản hồi của bạn sẽ bị xóa khỏi đánh giá này. Hành động không thể hoàn tác.
                    </p>
                    <div class="modal-actions">
                        <button class="btn-cancel" @click="showDeleteModal = false">Hủy</button>
                        <button class="btn-danger" @click="confirmDeleteReply">Xóa</button>
                    </div>
                </div>
            </div>
        </transition>

        <!-- LIGHTBOX -->
        <transition name="fade">
            <div v-if="lightboxSrc" class="lightbox" @click="lightboxSrc = ''">
                <img :src="lightboxSrc" alt="" @click.stop />
                <button class="lightbox-close" @click="lightboxSrc = ''">✕</button>
            </div>
        </transition>

        <!-- TOAST -->
        <transition name="slide-fade">
            <div v-if="toast.show" class="toast-box" :class="toast.type === 'error' ? 'toast-error' : 'toast-success'">
                <span>{{ toast.type === 'error' ? '⚠️' : '✅' }}</span>
                <span>{{ toast.msg }}</span>
            </div>
        </transition>
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap');

.ar-page {
    --ink: #0f1b2d;
    --muted: #5b6b7f;
    --line: #e3e8ef;
    --bg: #f5f7fa;
    --brand: #0a6cff;
    --price: #e5322d;
    --star: #f5a623;
    --green: #10b981;
    --amber: #f59e0b;

    font-family: 'Be Vietnam Pro', 'Segoe UI', system-ui, sans-serif;
    color: var(--ink);
    background: var(--bg);
    min-height: 100vh;
    padding: 24px 20px 60px;
    max-width: 1100px;
    margin: 0 auto;
}

.ar-page *,
.ar-page *::before,
.ar-page *::after {
    box-sizing: border-box;
}

/* ========== HEADER ========== */
.ar-header {
    margin-bottom: 20px;
}

.ar-title {
    margin: 0 0 4px;
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.02em;
}

.ar-sub {
    margin: 0;
    color: var(--muted);
    font-size: 14px;
}

.btn-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 14px;
    margin-bottom: 14px;
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 8px;
    color: var(--muted);
    font-family: inherit;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-back:hover {
    background: #f0f9ff;
    color: var(--brand);
    border-color: var(--brand);
    transform: translateX(-2px);
}

/* ========== STATS ========== */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 20px;
}

.stat-card {
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 16px 18px;
    display: flex;
    align-items: center;
    gap: 14px;
}

.stat-icon {
    font-size: 26px;
}

.stat-value {
    font-size: 22px;
    font-weight: 800;
    color: var(--ink);
    line-height: 1.1;
}

.stat-label {
    font-size: 12.5px;
    color: var(--muted);
    font-weight: 600;
    margin-top: 2px;
}

/* ========== TOOLBAR ========== */
.toolbar {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

.search-input,
.select {
    padding: 10px 14px;
    border: 1px solid var(--line);
    border-radius: 10px;
    font-family: inherit;
    font-size: 14px;
    background: #fff;
    color: var(--ink);
    outline: none;
    transition: border-color 0.2s;
}

.search-input {
    flex: 1;
    min-width: 220px;
}

.search-input:focus,
.select:focus {
    border-color: var(--brand);
    box-shadow: 0 0 0 3px rgba(10, 108, 255, 0.1);
}

.select {
    cursor: pointer;
    min-width: 160px;
}

/* ========== STATE ========== */
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
    font-size: 16px;
}

.state-sub {
    margin: 0;
    color: var(--muted);
    font-size: 14px;
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

/* ========== RESULT COUNT ========== */
.result-count {
    margin: 0 0 12px;
    font-size: 13px;
    color: var(--muted);
    font-weight: 600;
}

/* ========== REVIEW LIST ========== */
.review-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.review-card {
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 20px;
    transition: box-shadow 0.2s;
}

.review-card:hover {
    box-shadow: 0 8px 24px -12px rgba(15, 27, 45, 0.12);
}

.review-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 14px;
    flex-wrap: wrap;
}

/* ========== USER BLOCK ========== */
.user-block {
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
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
    box-shadow: 0 2px 6px rgba(2, 132, 199, 0.25);
    position: relative;
}

.avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
    display: block;
}

.user-meta {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
    flex: 1;
}

.user-line {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    font-size: 13px;
}

.user-name {
    font-weight: 700;
    color: var(--ink);
    font-size: 14px;
}

.user-email {
    font-size: 12px;
    color: var(--muted);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 280px;
}

.dot {
    color: #cbd5e1;
}

.date {
    color: var(--muted);
    font-size: 12.5px;
}

.rating-line {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 2px;
}

.stars {
    color: var(--star);
    letter-spacing: 1px;
    font-size: 15px;
}

.rating-num {
    font-size: 12.5px;
    color: var(--muted);
    font-weight: 600;
}

/* ========== STATUS BADGE ========== */
.status-badge {
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
}

.status-badge.replied {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
}

.status-badge.pending {
    background: #fffbeb;
    color: #b45309;
    border: 1px solid #fde68a;
}

/* ========== PRODUCT ROW ========== */
.product-line {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    background: #f8fafc;
    border: 1px solid var(--line);
    border-radius: 10px;
    margin-bottom: 12px;
}

.product-thumb {
    width: 56px;
    height: 56px;
    flex-shrink: 0;
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
    border: 1px solid var(--line);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    cursor: zoom-in;
    transition: border-color 0.2s;
}

.product-thumb:hover {
    border-color: var(--brand);
}

.product-thumb img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.thumb-empty {
    font-size: 22px;
    color: #cbd5e1;
}

.product-text {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
    flex: 1;
}

.product-name {
    font-size: 13.5px;
    font-weight: 600;
    color: var(--ink);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.sku-text {
    font-size: 11.5px;
    color: var(--muted);
    font-weight: 600;
    font-family: 'SF Mono', Consolas, monospace;
}

/* ========== BODY ========== */
.review-body {
    margin-bottom: 12px;
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
    line-height: 1.6;
    color: #334155;
    white-space: pre-line;
}

/* ========== REPLY BOX ========== */
.reply-box {
    background: #f0f9ff;
    border-left: 3px solid var(--brand);
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 12px;
}

.reply-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
    gap: 8px;
}

.reply-label {
    font-size: 12px;
    font-weight: 700;
    color: var(--brand);
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.btn-del-reply {
    padding: 4px 10px;
    border: 1px solid #fecaca;
    background: #fff;
    color: var(--price);
    border-radius: 6px;
    font-size: 11.5px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s;
}

.btn-del-reply:hover {
    background: #fef2f2;
    border-color: var(--price);
}

.reply-text {
    margin: 0;
    font-size: 13.5px;
    color: #334155;
    line-height: 1.6;
    white-space: pre-line;
}

/* ========== ACTIONS ========== */
.review-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

.btn-reply {
    padding: 9px 18px;
    background: var(--brand);
    color: #fff;
    border: none;
    border-radius: 9px;
    font-family: inherit;
    font-size: 13.5px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-reply:hover {
    background: #0959d6;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(10, 108, 255, 0.25);
}

/* ========== MODAL ========== */
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
    padding: 24px;
    border-radius: 14px;
    width: 100%;
    max-width: 520px;
    box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.25);
    animation: slideUp 0.25s ease-out;
}

.modal-card.small {
    max-width: 400px;
    text-align: center;
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

.modal-card h3 {
    margin: 0 0 14px;
    font-size: 18px;
    font-weight: 700;
    color: var(--ink);
}

.confirm-icon {
    font-size: 42px;
    margin-bottom: 8px;
}

.confirm-text {
    margin: 0 0 20px;
    color: var(--muted);
    font-size: 14px;
    line-height: 1.5;
}

.modal-quote {
    background: #f8fafc;
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 12px 14px;
    margin-bottom: 14px;
}

.quote-user {
    font-size: 13px;
    font-weight: 700;
    color: var(--ink);
    margin-bottom: 4px;
}

.quote-rating {
    color: var(--star);
    font-size: 14px;
    letter-spacing: 1px;
    margin-bottom: 4px;
}

.quote-content {
    margin: 0;
    font-size: 13.5px;
    color: #334155;
    line-height: 1.5;
}

.reply-textarea {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: 10px;
    font-family: inherit;
    font-size: 14px;
    color: var(--ink);
    resize: vertical;
    outline: none;
    transition: border-color 0.2s;
}

.reply-textarea:focus {
    border-color: var(--brand);
    box-shadow: 0 0 0 3px rgba(10, 108, 255, 0.1);
}

.modal-actions {
    display: flex;
    gap: 10px;
    margin-top: 16px;
}

.modal-actions button {
    flex: 1;
}

.btn-cancel {
    padding: 11px 20px;
    background: #fff;
    border: 1px solid var(--line);
    color: var(--muted);
    border-radius: 10px;
    font-family: inherit;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-cancel:hover {
    background: var(--bg);
}

.btn-primary {
    padding: 11px 20px;
    background: var(--brand);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-family: inherit;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
    background: #0959d6;
}

.btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-danger {
    padding: 11px 20px;
    background: var(--price);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-family: inherit;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-danger:hover {
    background: #c9231e;
}

/* ========== LIGHTBOX ========== */
.lightbox {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 20px;
    cursor: zoom-out;
}

.lightbox img {
    max-width: 100%;
    max-height: 90vh;
    border-radius: 8px;
    cursor: default;
    object-fit: contain;
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
    backdrop-filter: blur(4px);
    transition: all 0.2s;
}

.lightbox-close:hover {
    background: var(--price);
    transform: rotate(90deg);
}

/* ========== TOAST ========== */
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
    box-shadow: 0 10px 25px -8px rgba(0, 0, 0, 0.3);
}

.toast-success {
    background: var(--green);
}

.toast-error {
    background: #ef4444;
}

/* ========== TRANSITIONS ========== */
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

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .toolbar {
        flex-direction: column;
    }

    .search-input,
    .select {
        width: 100%;
    }

    .review-top {
        flex-direction: column;
        align-items: flex-start;
    }

    .status-badge {
        align-self: flex-start;
    }
}

@media (max-width: 480px) {
    .ar-page {
        padding: 16px 12px 40px;
    }

    .ar-title {
        font-size: 20px;
    }

    .review-card {
        padding: 16px;
    }

    .toast-box {
        left: 16px;
        right: 16px;
        justify-content: center;
    }
}
</style>