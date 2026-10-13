<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import axios from "axios";
import { connectChat } from "@/services/chatSocket";

const API_URL = "http://localhost:3000/api/chat";

const conversation = ref(null);
const messages = ref([]);
const content = ref("");
const errorMessage = ref("");
const socket = ref(null);
const sending = ref(false);

const token = localStorage.getItem("token");

const headers = {
  Authorization: `Bearer ${token}`,
};

// Tải lịch sử tin nhắn
const loadMessages = async () => {
  if (!conversation.value) return;

  try {
    const response = await axios.get(
      `${API_URL}/conversations/${conversation.value.id}/messages`,
      { headers }
    );

    messages.value = response.data;
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ||
      "Không thể tải lịch sử tin nhắn";
  }
};

// Mở hoặc lấy cuộc trò chuyện hiện tại
const openConversation = async () => {
  try {
    const response = await axios.post(
      `${API_URL}/conversations`,
      {},
      { headers }
    );

    conversation.value = response.data;

    await loadMessages();

    socket.value = connectChat(token);

    socket.value.emit(
      "join_conversation",
      { conversationId: conversation.value.id },
      (result) => {
        if (!result?.success) {
          errorMessage.value =
            result?.message || "Không thể tham gia cuộc trò chuyện";
        }
      }
    );

    socket.value.on("new_message", (message) => {
      if (
        message.conversation_id === conversation.value.id &&
        !messages.value.some((item) => item.id === message.id)
      ) {
        messages.value.push(message);
      }
    });
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ||
      "Không thể mở cuộc trò chuyện";
  }
};

// Gửi tin nhắn
const sendMessage = () => {
  const text = content.value.trim();

  if (!text || !conversation.value || sending.value) return;

  sending.value = true;

  socket.value.emit(
    "send_message",
    {
      conversationId: conversation.value.id,
      content: text,
    },
    (result) => {
      sending.value = false;

      if (result?.success) {
        content.value = "";
      } else {
        errorMessage.value =
          result?.message || "Gửi tin nhắn thất bại";
      }
    }
  );
};

// Hàm xử lý nút quay lại (có thể thay đổi tùy router của bạn, ví dụ: router.back())
const goBack = () => {
  window.history.back();
};

onMounted(() => {
  if (!token) {
    errorMessage.value = "Vui lòng đăng nhập trước khi chat";
    return;
  }

  openConversation();
});

onBeforeUnmount(() => {
  if (socket.value) {
    socket.value.off("new_message");
    socket.value.disconnect();
  }
});
</script>

<template>
  <div class="chat-page">
    <!-- Header của trang chat chứa nút Quay lại -->
    <div class="chat-header">
      <button class="back-btn" @click="goBack" title="Quay lại">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Quay lại</span>
      </button>
      <h2>Hỗ trợ khách hàng</h2>
    </div>

    <p v-if="errorMessage" class="error">
      {{ errorMessage }}
    </p>

    <div v-if="conversation" class="chat-box shadow-sm">
      <div class="messages">
        <div
          v-for="message in messages"
          :key="message.id"
          :class="[
            'message-wrapper',
            message.sender_type === 'user' ? 'message-user' : 'message-staff'
          ]"
        >
          <div class="message-bubble">
            <span class="sender-name">
              {{ message.sender_type === "user" ? "Bạn" : "Nhân viên" }}
            </span>
            <p>{{ message.content }}</p>
          </div>
        </div>
      </div>

      <form class="send-form" @submit.prevent="sendMessage">
        <input
          v-model="content"
          type="text"
          placeholder="Nhập tin nhắn..."
          maxlength="2000"
        />

        <button type="submit" :disabled="sending || !content.trim()">
          Gửi
        </button>
      </form>
    </div>

    <div v-else-if="!errorMessage" class="loading-state">
      <div class="spinner"></div>
      <p>Đang mở cuộc trò chuyện...</p>
    </div>
  </div>
</template>

<style scoped>
.chat-page {
  max-width: 850px;
  margin: 30px auto;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #333;
}

/* Header & Back button */
.chat-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.chat-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111;
  margin: 0;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  color: #374151;
  padding: 8px 14px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #e5e7eb;
  color: #111;
}

/* Chat Box Container */
.chat-box {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
}

.messages {
  height: 450px;
  overflow-y: auto;
  padding: 20px;
  background: #f9fafb;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Message Bubbles layout */
.message-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 75%;
}

.message-user {
  align-self: flex-end;
}

.message-staff {
  align-self: flex-start;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.message-user .message-bubble {
  background: #eff6ff;
  border-color: #dbeafe;
}

.sender-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  display: block;
  margin-bottom: 4px;
}

.message-bubble p {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.4;
  overflow-wrap: anywhere;
  color: #1f2937;
}

/* Send Form */
.send-form {
  display: flex;
  gap: 10px;
  padding: 16px;
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
}

.send-form input {
  flex: 1;
  min-width: 0;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
  font-size: 0.95rem;
  transition: border-color 0.2s;
}

.send-form input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.send-form button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.send-form button:hover:not(:disabled) {
  background: #2563eb;
}

.send-form button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

/* Error & Loading States */
.error {
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 0.95rem;
}

.loading-state {
  text-align: center;
  padding: 60px 0;
  color: #6b7280;
}
</style>