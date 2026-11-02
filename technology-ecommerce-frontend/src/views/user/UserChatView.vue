<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { connectChat } from '@/services/chatSocket'

const router = useRouter()
const API_URL = 'http://localhost:3000/api/chat'

const token = localStorage.getItem('token')
const user = JSON.parse(localStorage.getItem('user') || '{}')

const headers = {
  Authorization: `Bearer ${token}`,
}

// ============ STATE ============
const conversation = ref(null)
const messages = ref([])
const content = ref('')
const errorMessage = ref('')
const socket = ref(null)
const sending = ref(false)
const isLoading = ref(true)
const messagesContainer = ref(null)

// ============ COMPUTED ============
const userAvatarUrl = computed(() => {
  const avatar = user?.avatar || user?.avatar_url
  if (!avatar) return ''
  return avatar.startsWith('http')
    ? avatar
    : `http://localhost:3000/uploads/avatars/${avatar}`
})

const userInitials = computed(() => {
  const name = user?.full_name?.trim()
  if (!name) return '?'
  const parts = name.split(/\s+/)
  return parts.length === 1
    ? parts[0].charAt(0).toUpperCase()
    : (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
})

// ============ HELPERS ============
const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Hôm nay'
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua'
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Nhóm tin nhắn theo ngày
const groupedMessages = computed(() => {
  const groups = []
  let currentDate = null
  let currentGroup = null

  messages.value.forEach((msg) => {
    const dateKey = msg.created_at ? new Date(msg.created_at).toDateString() : 'unknown'
    if (dateKey !== currentDate) {
      currentDate = dateKey
      currentGroup = {
        date: msg.created_at,
        dateLabel: formatDate(msg.created_at),
        messages: [],
      }
      groups.push(currentGroup)
    }
    currentGroup.messages.push(msg)
  })
  return groups
})

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// ============ API ============
const loadMessages = async () => {
  if (!conversation.value) return

  try {
    const response = await axios.get(
      `${API_URL}/conversations/${conversation.value.id}/messages`,
      { headers },
    )
    messages.value = response.data
    await scrollToBottom()
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message || 'Không thể tải lịch sử tin nhắn'
  }
}

const openConversation = async () => {
  try {
    const response = await axios.post(`${API_URL}/conversations`, {}, { headers })
    conversation.value = response.data

    await loadMessages()

    socket.value = connectChat(token)

    socket.value.emit(
      'join_conversation',
      { conversationId: conversation.value.id },
      (result) => {
        if (!result?.success) {
          errorMessage.value =
            result?.message || 'Không thể tham gia cuộc trò chuyện'
        }
      },
    )

    socket.value.on('new_message', async (message) => {
      if (
        message.conversation_id === conversation.value.id &&
        !messages.value.some((item) => item.id === message.id)
      ) {
        messages.value.push(message)
        await scrollToBottom()
      }
    })
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message || 'Không thể mở cuộc trò chuyện'
  } finally {
    isLoading.value = false
  }
}

// ============ GỬI TIN NHẮN ============
const sendMessage = () => {
  const text = content.value.trim()
  if (!text || !conversation.value || sending.value) return

  sending.value = true

  socket.value.emit(
    'send_message',
    {
      conversationId: conversation.value.id,
      content: text,
    },
    (result) => {
      sending.value = false
      if (result?.success) {
        content.value = ''
      } else {
        errorMessage.value = result?.message || 'Gửi tin nhắn thất bại'
      }
    },
  )
}

// Enter để gửi (Shift+Enter để xuống dòng)
const handleKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

// ============ LIFECYCLE ============
onMounted(() => {
  if (!token) {
    errorMessage.value = 'Vui lòng đăng nhập trước khi chat'
    isLoading.value = false
    setTimeout(() => {
      router.push({ path: '/login', query: { redirect: '/chat' } })
    }, 1500)
    return
  }

  openConversation()
})

onBeforeUnmount(() => {
  if (socket.value) {
    socket.value.off('new_message')
    socket.value.disconnect()
  }
})
</script>

<template>
  <div class="chat-page">
    <!-- HEADER -->
    <header class="chat-top">
      <div class="chat-top-inner">
        <RouterLink to="/home" class="brand" aria-label="TechStore - Trang chủ">
          Tech<span>Store</span>
        </RouterLink>
        <RouterLink to="/home" class="back-link">← Tiếp tục mua sắm</RouterLink>
      </div>
    </header>

    <main class="chat-main">
      <!-- PAGE HEADER -->
      <div class="page-head">
        <button class="btn-back" @click="router.back()" title="Quay lại" type="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Quay lại</span>
        </button>
        <div class="page-titles">
          <h1 class="page-title">Hỗ trợ khách hàng</h1>
          <p class="page-sub">
            <span class="status-online"></span>
            Nhân viên đang trực tuyến · Phản hồi trong 1-2 phút
          </p>
        </div>
      </div>

      <!-- ALERT -->
      <transition name="fade">
        <div v-if="errorMessage" class="chat-alert">
          <span>⚠️ {{ errorMessage }}</span>
          <button type="button" @click="errorMessage = ''" aria-label="Đóng">✕</button>
        </div>
      </transition>

      <!-- LOADING -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Đang mở cuộc trò chuyện...</p>
      </div>

      <!-- CHAT BOX -->
      <div v-else-if="conversation" class="chat-box">
        <!-- Chat header -->
        <div class="chat-header">
          <div class="staff-info">
            <div class="staff-avatar">
              <span>💬</span>
            </div>
            <div class="staff-detail">
              <span class="staff-name">Nhân viên tư vấn</span>
              <span class="staff-status">
                <span class="dot-online"></span>
                Đang hoạt động
              </span>
            </div>
          </div>
          <span class="chat-id">#{{ conversation.id }}</span>
        </div>

        <!-- Messages -->
        <div ref="messagesContainer" class="messages">
          <!-- Empty -->
          <div v-if="messages.length === 0" class="messages-empty">
            <div class="messages-empty-icon">👋</div>
            <p class="messages-empty-title">Xin chào {{ user.full_name || 'bạn' }}!</p>
            <p class="messages-empty-sub">
              Nhân viên tư vấn sẽ phản hồi bạn trong giây lát. Hãy đặt câu hỏi về sản phẩm, đơn hàng hoặc bảo hành.
            </p>
          </div>

          <!-- Message groups -->
          <template v-else>
            <div v-for="(group, idx) in groupedMessages" :key="idx" class="message-group">
              <!-- Date divider -->
              <div class="date-divider">
                <span>{{ group.dateLabel }}</span>
              </div>

              <!-- Messages in group -->
              <div v-for="message in group.messages" :key="message.id" :class="[
                'message-row',
                message.sender_type === 'user' ? 'message-row-user' : 'message-row-staff',
              ]">
                <!-- Staff avatar (chỉ hiển thị bên staff) -->
                <div v-if="message.sender_type !== 'user'" class="msg-avatar msg-avatar-staff">
                  <span>💬</span>
                </div>

                <!-- User avatar -->
                <div v-else class="msg-avatar msg-avatar-user">
                  <img v-if="userAvatarUrl" :src="userAvatarUrl" :alt="user.full_name" class="msg-avatar-img" />
                  <span v-else class="msg-avatar-text">{{ userInitials }}</span>
                </div>

                <!-- Bubble -->
                <div class="msg-bubble-wrap">
                  <div class="msg-bubble">
                    <p>{{ message.content }}</p>
                  </div>
                  <span class="msg-time">{{ formatTime(message.created_at) }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Send form -->
        <form class="send-form" @submit.prevent="sendMessage">
          <textarea v-model="content" class="send-input"
            placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter xuống dòng)" maxlength="2000" rows="1"
            :disabled="sending" @keydown="handleKeydown"></textarea>
          <button type="submit" class="btn-send" :disabled="sending || !content.trim()" title="Gửi tin nhắn">
            <span v-if="sending" class="spinner-sm"></span>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap');

.chat-page {
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

.chat-page *,
.chat-page *::before,
.chat-page *::after {
  box-sizing: border-box;
}

/* Header */
.chat-top {
  background: #fff;
  border-bottom: 1px solid var(--line);
}

.chat-top-inner {
  max-width: 900px;
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

.back-link {
  font-size: 14px;
  font-weight: 500;
  color: var(--muted);
  text-decoration: none;
}

.back-link:hover {
  color: var(--brand);
}

/* Main */
.chat-main {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}

/* Page head */
.page-head {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.page-titles {
  flex: 1;
  min-width: 0;
}

.page-title {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--ink);
}

.page-sub {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-online {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  animation: pulse-green 2s ease-in-out infinite;
}

@keyframes pulse-green {

  0%,
  100% {
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  }

  50% {
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.05);
  }
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
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  flex-shrink: 0;
}

.btn-back:hover {
  background: #f0f9ff;
  color: var(--brand);
  border-color: var(--brand);
  transform: translateX(-2px);
}

/* Alert */
.chat-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
}

.chat-alert button {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 14px;
  opacity: 0.6;
  padding: 2px 6px;
  border-radius: 4px;
}

.chat-alert button:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.05);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 14px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
}

.loading-state p {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--line);
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Chat Box */
.chat-box {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(15, 27, 45, 0.06);
  display: flex;
  flex-direction: column;
  height: 620px;
}

/* Chat header */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--line);
  background: #fbfcfe;
  flex-shrink: 0;
}

.staff-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.staff-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0a6cff, #0850c4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 2px 8px rgba(10, 108, 255, 0.25);
}

.staff-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.staff-name {
  font-weight: 700;
  font-size: 14px;
  color: var(--ink);
}

.staff-status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: #10b981;
  font-weight: 600;
}

.dot-online {
  width: 6px;
  height: 6px;
  background: #10b981;
  border-radius: 50%;
}

.chat-id {
  font-size: 12px;
  color: var(--muted);
  font-family: 'Courier New', monospace;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 600;
}

/* Messages */
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scroll-behavior: smooth;
}

.messages::-webkit-scrollbar {
  width: 6px;
}

.messages::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

/* Empty */
.messages-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  padding: 20px;
  gap: 6px;
}

.messages-empty-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.messages-empty-title {
  margin: 0;
  font-weight: 700;
  font-size: 16px;
  color: var(--ink);
}

.messages-empty-sub {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
  max-width: 400px;
  line-height: 1.6;
}

/* Message group */
.message-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.date-divider {
  text-align: center;
  position: relative;
  margin: 8px 0;
}

.date-divider span {
  display: inline-block;
  padding: 4px 14px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

/* Message row */
.message-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 80%;
}

.message-row-user {
  align-self: flex-end;
  flex-direction: row;
}

.message-row-staff {
  align-self: flex-start;
}

.msg-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.msg-avatar-staff {
  background: linear-gradient(135deg, #0a6cff, #0850c4);
  font-size: 16px;
}

.msg-avatar-user {
  background: linear-gradient(135deg, #10b981, #059669);
}

.msg-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.msg-avatar-text {
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.msg-bubble-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.msg-bubble {
  padding: 10px 14px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid var(--line);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  word-wrap: break-word;
}

.msg-bubble p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink);
  white-space: pre-wrap;
  word-break: break-word;
}

.message-row-user .msg-bubble {
  background: linear-gradient(135deg, #0a6cff, #0850c4);
  border-color: #0a6cff;
  border-bottom-right-radius: 4px;
}

.message-row-user .msg-bubble p {
  color: #fff;
}

.message-row-staff .msg-bubble {
  border-bottom-left-radius: 4px;
}

.msg-time {
  font-size: 10.5px;
  color: var(--muted);
  font-weight: 500;
  padding: 0 4px;
}

.message-row-user .msg-time {
  text-align: right;
}

/* Send form */
.send-form {
  display: flex;
  gap: 10px;
  padding: 14px 16px;
  background: #fff;
  border-top: 1px solid var(--line);
  flex-shrink: 0;
  align-items: flex-end;
}

.send-input {
  flex: 1;
  min-width: 0;
  padding: 11px 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  outline: none;
  font-size: 14px;
  font-family: inherit;
  color: var(--ink);
  background: #f8fafc;
  resize: none;
  max-height: 100px;
  min-height: 44px;
  line-height: 1.4;
  transition: all 0.2s;
}

.send-input:focus {
  background: #fff;
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(10, 108, 255, 0.12);
}

.send-input::placeholder {
  color: #94a3b8;
}

.btn-send {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(135deg, #0a6cff, #0850c4);
  color: #fff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(10, 108, 255, 0.25);
}

.btn-send:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(10, 108, 255, 0.35);
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Responsive */
@media (max-width: 640px) {
  .chat-main {
    padding: 16px 12px 30px;
  }

  .page-head {
    flex-direction: column;
    gap: 12px;
  }

  .page-title {
    font-size: 20px;
  }

  .chat-box {
    height: calc(100vh - 220px);
    min-height: 500px;
  }

  .messages {
    padding: 14px;
  }

  .message-row {
    max-width: 88%;
  }

  .msg-avatar {
    width: 28px;
    height: 28px;
  }

  .chat-header {
    padding: 12px 16px;
  }

  .send-form {
    padding: 12px;
  }
}
</style>