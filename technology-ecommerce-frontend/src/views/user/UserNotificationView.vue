<template>
  <div class="notif-page">
    <!-- HEADER -->
    

    <main class="notif-main">
      <div class="notif-card">
        <!-- Card header -->
        <div class="notif-header">
          <div class="header-titles">
            <h1 class="notif-title">Thông Báo Của Tôi</h1>
            <p class="notif-sub">
              Bạn có <b>{{ unreadCount }}</b> thông báo chưa đọc
            </p>
          </div>
          <button
            v-if="unreadCount > 0"
            @click="markAllAsRead"
            class="btn-mark-all"
            :disabled="isMarkingAll"
            type="button"
          >
            <span v-if="isMarkingAll" class="spinner-xs"></span>
            <span>{{ isMarkingAll ? 'Đang xử lý...' : 'Đánh dấu tất cả đã đọc' }}</span>
          </button>
        </div>

        <!-- LOADING -->
        <div v-if="loading" class="state-box">
          <div class="spinner"></div>
          <p>Đang tải thông báo...</p>
        </div>

        <!-- EMPTY -->
        <div v-else-if="notifications.length === 0" class="state-box">
          <div class="state-icon">🔔</div>
          <p class="state-title">Chưa có thông báo nào</p>
          <p class="state-sub">Các cập nhật về đơn hàng và khuyến mãi sẽ xuất hiện ở đây.</p>
        </div>

        <!-- LIST -->
        <div v-else class="notification-list">
          <div
            v-for="item in notifications"
            :key="item.id"
            :class="['notification-item', { unread: !item.is_read }]"
            @click="handleNotificationClick(item)"
          >
            <!-- Icon -->
           <div class="notif-icon" :class="getIconClass(item.type)">
              <span v-if="item.type === 'order'" class="material-symbols-outlined">
                package_2
              </span>

              <span v-else-if="item.type === 'promotion'" class="material-symbols-outlined">
                redeem
              </span>

              <span v-else-if="item.type === 'system'" class="material-symbols-outlined">
                settings
              </span>

              <span v-else class="material-symbols-outlined">
                campaign
              </span>
            </div>

            <!-- Content -->
            <div class="notif-content">
              <div class="notif-title-row">
                <h4 class="notif-item-title">{{ item.title }}</h4>
                <span class="notif-time">{{ formatTime(item.created_at) }}</span>
              </div>
              <p class="notif-body">{{ item.content }}</p>
              <span v-if="item.type === 'order' && item.reference_id" class="notif-cta">
                Xem đơn hàng →
              </span>
            </div>

            <!-- Unread dot -->
            <div v-if="!item.is_read" class="unread-dot" title="Chưa đọc"></div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const notifications = ref([])
const loading = ref(false)
const isMarkingAll = ref(false)

const message = ref('')
const messageType = ref('success')
let messageTimer = null

const token = localStorage.getItem('token')
const getConfig = () => ({
  headers: { Authorization: `Bearer ${token}` },
})

const unreadCount = computed(() => {
  return notifications.value.filter((n) => !n.is_read).length
})

const showMessage = (msg, type = 'success') => {
  message.value = msg
  messageType.value = type
  if (messageTimer) clearTimeout(messageTimer)
  messageTimer = setTimeout(() => {
    message.value = ''
  }, 3000)
}

// ============ API ============
const fetchNotifications = async () => {
  loading.value = true
  try {
    const response = await axios.get('http://localhost:3000/api/notifications/', getConfig())
    if (response.data.success) {
      notifications.value = response.data.data || []
    }
  } catch (err) {
    console.error('Lỗi tải thông báo:', err)
  } finally {
    loading.value = false
  }
}

const handleNotificationClick = async (item) => {
  if (!item.is_read) {
    try {
      await axios.patch(
        'http://localhost:3000/api/notifications/read',
        { notificationId: item.id },
        getConfig(),
      )
      item.is_read = true
    } catch (err) {
      console.error('Lỗi đánh dấu đã đọc:', err)
    }
  }

  if (item.type === 'order' && item.reference_id) {
    router.push(`order/${item.reference_id}`)
  }
}

const markAllAsRead = async () => {
  if (isMarkingAll.value) return
  isMarkingAll.value = true
  try {
    await axios.put('http://localhost:3000/api/notifications/read-all', {}, getConfig())
    notifications.value.forEach((n) => (n.is_read = true))
    showMessage('Đã đánh dấu tất cả là đã đọc', 'success')
  } catch (err) {
    console.error('Lỗi đánh dấu tất cả đã đọc:', err)
    showMessage('Không thể đánh dấu tất cả. Vui lòng thử lại.', 'error')
  } finally {
    isMarkingAll.value = false
  }
}

// ============ HELPERS ============
const formatTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const getIconClass = (type) => {
  if (type === 'order') return 'icon-order'
  if (type === 'promotion') return 'icon-promotion'
  if (type === 'system') return 'icon-system'
  return 'icon-default'
}

onMounted(() => {
  fetchNotifications()

})

onBeforeUnmount(() => {
  if (messageTimer) clearTimeout(messageTimer)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');

.notif-page {
  --ink: #0f1b2d;
  --muted: #5b6b7f;
  --line: #e3e8ef;
  --bg: #f5f7fa;
  --brand: #0a6cff;
  --price: #e5322d;

  font-family: 'Be Vietnam Pro', 'Segoe UI', system-ui, sans-serif;
  color: var(--ink);
  background: var(--bg);
  min-height: 100vh;
}
.notif-page *,
.notif-page *::before,
.notif-page *::after {
  box-sizing: border-box;
}

/* Header */
.notif-top {
  background: #fff;
  border-bottom: 1px solid var(--line);
}
.notif-top-inner {
  max-width: 800px;
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
.brand span { color: var(--brand); }
.back-link {
  font-size: 14px;
  font-weight: 500;
  color: var(--muted);
  text-decoration: none;
}
.back-link:hover { color: var(--brand); }

/* Main */
.notif-main {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 20px 60px;
}

.notif-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(15, 27, 45, 0.06);
}

/* Card header */
.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px;
  border-bottom: 1px solid var(--line);
  background: #fbfcfe;
  flex-wrap: wrap;
}
.header-titles { min-width: 0; }
.notif-title {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: -0.01em;
}
.notif-sub {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}
.notif-sub b { color: var(--brand); }

.btn-mark-all {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--brand);
  font-weight: 600;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-mark-all:hover:not(:disabled) {
  background: #f0f9ff;
  border-color: var(--brand);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(10, 108, 255, 0.15);
}
.btn-mark-all:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* States */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 10px;
  text-align: center;
}
.state-icon { font-size: 48px; opacity: 0.5; margin-bottom: 6px; }
.state-title { margin: 0; font-weight: 700; color: var(--ink); font-size: 16px; }
.state-sub { margin: 0; font-size: 14px; color: var(--muted); max-width: 340px; line-height: 1.5; }
.state-box p { margin: 0; color: var(--muted); font-size: 14px; }

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--line);
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.spinner-xs {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(10, 108, 255, 0.25);
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* List */
.notification-list {
  display: flex;
  flex-direction: column;
  max-height: 620px;
  overflow-y: auto;
}
.notification-list::-webkit-scrollbar { width: 6px; }
.notification-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

/* Item */
.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 22px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
}
.notification-item:last-child { border-bottom: none; }
.notification-item:hover { background: #f8fafc; }
.notification-item.unread {
  background: #f0f7ff;
}
.notification-item.unread:hover {
  background: #e6f1ff;
}

/* Icon */
.notif-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  transition: transform 0.2s;
}
.notification-item:hover .notif-icon { transform: scale(1.05); }

.icon-order { background: #eff6ff; color: #2563eb; }
.icon-promotion { background: #fef3c7; color: #d97706; }
.icon-system { background: #f1f5f9; color: #475569; }
.icon-default { background: #f0f9ff; color: #0284c7; }

/* Content */
.notif-content { flex: 1; min-width: 0; }

.notif-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 4px;
}
.notif-item-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.4;
  flex: 1;
  min-width: 0;
}
.notif-time {
  font-size: 11px;
  color: var(--muted);
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
  padding-top: 2px;
}
.notif-body {
  margin: 0;
  font-size: 13px;
  color: #4a5568;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.notif-cta {
  display: inline-block;
  margin-top: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--brand);
  transition: transform 0.2s;
}
.notification-item:hover .notif-cta {
  transform: translateX(2px);
}

/* Unread dot */
.unread-dot {
  width: 9px;
  height: 9px;
  background: var(--brand);
  border-radius: 50%;
  align-self: flex-start;
  margin-top: 6px;
  flex-shrink: 0;
  box-shadow: 0 0 0 3px rgba(10, 108, 255, 0.15);
  animation: pulse-dot 2s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 3px rgba(10, 108, 255, 0.15); }
  50% { box-shadow: 0 0 0 6px rgba(10, 108, 255, 0.08); }
}

/* Responsive */
@media (max-width: 640px) {
  .notif-main { padding: 16px 12px 40px; }
  .notif-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 18px 18px;
  }
  .btn-mark-all { justify-content: center; }
  .notif-item-title { font-size: 13.5px; }
  .notification-item { padding: 14px 16px; gap: 12px; }
  .notif-icon { width: 38px; height: 38px; font-size: 18px; }
}
</style>