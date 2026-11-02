<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { connectChat } from "@/services/chatSocket";

const router = useRouter();
const API_URL = "http://localhost:3000/api/chat";

const conversations = ref([]);
const selectedConversation = ref(null);
const messages = ref([]);
const newMessage = ref("");
const errorMessage = ref("");
const socket = ref(null);
const messageList = ref(null);

const token = localStorage.getItem("token");
const employee = JSON.parse(localStorage.getItem("user") || "null");

const headers = {
  Authorization: `Bearer ${token}`,
};

const goBack = () => {
  router.back();
};

const getConversationStatus = (status) => {
  const value = Number(status);

  if (value === 0) return "Đã đóng";
  if (value === 1) return "Đang chờ";
  if (value === 2) return "Đang xử lý";

  return "Không xác định";
};

const loadConversations = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/employee/conversations`,
      { headers },
    );

    conversations.value = response.data;
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ||
      "Không thể tải danh sách cuộc trò chuyện";
  }
};

const scrollToBottom = async () => {
  await nextTick();

  if (messageList.value) {
    messageList.value.scrollTop = messageList.value.scrollHeight;
  }
};

const handleNewMessage = (message) => {
  if (
    selectedConversation.value &&
    String(message.conversation_id) ===
      String(selectedConversation.value.id)
  ) {
    const exists = messages.value.some(
      (item) => String(item.id) === String(message.id),
    );

    if (!exists) {
      messages.value.push(message);
      scrollToBottom();
    }
  }
};

const selectConversation = async (conversation) => {
  errorMessage.value = "";

  if (Number(conversation.status) === 0) {
    errorMessage.value = "Cuộc trò chuyện này đã đóng.";
    return;
  }

  selectedConversation.value = conversation;
  messages.value = [];

  try {
    if (
      Number(conversation.status) === 1 &&
      !conversation.employee_id
    ) {
      const response = await axios.post(
        `${API_URL}/conversations/${conversation.id}/assign`,
        {},
        { headers },
      );

      Object.assign(conversation, response.data.conversation);
      selectedConversation.value = response.data.conversation;
    }

    const response = await axios.get(
      `${API_URL}/employee/conversations/${conversation.id}/messages`,
      { headers },
    );

    messages.value = response.data;

    socket.value.emit(
      "join_conversation",
      { conversationId: conversation.id },
      (result) => {
        if (!result?.success) {
          errorMessage.value =
            result?.message || "Không thể tham gia cuộc trò chuyện";
        }
      },
    );

    await loadConversations();
    await scrollToBottom();
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ||
      "Không thể mở cuộc trò chuyện";
  }
};

const sendMessage = () => {
  const content = newMessage.value.trim();

  if (
    !content ||
    !selectedConversation.value ||
    Number(selectedConversation.value.status) === 0
  ) {
    return;
  }

  socket.value.emit(
    "send_message",
    {
      conversationId: selectedConversation.value.id,
      content,
    },
    (result) => {
      if (result?.success) {
        newMessage.value = "";
      } else {
        errorMessage.value =
          result?.message || "Gửi tin nhắn thất bại";
      }
    },
  );
};

const closeConversation = async () => {
  if (!selectedConversation.value) return;

  const conversationId = selectedConversation.value.id;

  try {
    await axios.post(
      `${API_URL}/conversations/${conversationId}/close`,
      {},
      { headers },
    );

    selectedConversation.value.status = 0;
    await loadConversations();
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ||
      "Không thể đóng cuộc trò chuyện";
  }
};

onMounted(async () => {
  if (!token || !employee) {
    errorMessage.value = "Vui lòng đăng nhập lại.";
    return;
  }

  socket.value = connectChat(token);
  socket.value.on("new_message", handleNewMessage);

  await loadConversations();
});

onBeforeUnmount(() => {
  if (socket.value) {
    socket.value.off("new_message", handleNewMessage);
  }
});
</script>

<template>
  <div class="chat-page">
    <header class="page-header">
      <button class="back-button" type="button" @click="goBack">
        <span class="back-icon">←</span>
        Quay lại
      </button>

      <div class="header-title">
        <div class="header-icon">✉</div>
        <div>
          <h1>Hỗ trợ khách hàng</h1>
          <p>Quản lý và phản hồi tin nhắn khách hàng</p>
        </div>
      </div>
    </header>

    <p v-if="errorMessage" class="error-message" role="alert">
      {{ errorMessage }}
      <button type="button" @click="errorMessage = ''">×</button>
    </p>

    <main class="chat-layout">
      <aside class="conversation-panel">
        <div class="panel-heading">
          <div>
            <h2>Cuộc trò chuyện</h2>
            <p>Danh sách yêu cầu hỗ trợ</p>
          </div>
          <span class="conversation-count">{{ conversations.length }}</span>
        </div>

        <div v-if="conversations.length" class="conversation-list">
          <button
            v-for="conversation in conversations"
            :key="conversation.id"
            type="button"
            class="conversation-item"
            :class="{
              active:
                String(selectedConversation?.id) ===
                String(conversation.id),
              closed: Number(conversation.status) === 0,
            }"
            @click="selectConversation(conversation)"
          >
            <div class="customer-avatar">
              {{ conversation.user_id ? "K" : "?" }}
            </div>

            <div class="conversation-info">
              <div class="conversation-top">
                <strong>Khách hàng #{{ conversation.user_id }}</strong>
              </div>
              <span class="conversation-subtitle">
                Cuộc trò chuyện #{{ conversation.id }}
              </span>
              <span
                class="status-label"
                :class="'status-' + Number(conversation.status)"
              >
                {{ getConversationStatus(conversation.status) }}
              </span>
            </div>

            <span class="item-arrow">›</span>
          </button>
        </div>

        <div v-else class="empty-conversations">
          <div class="empty-icon">✉</div>
          <strong>Chưa có cuộc trò chuyện</strong>
          <p>Các yêu cầu hỗ trợ sẽ xuất hiện tại đây.</p>
        </div>
      </aside>

      <section class="chat-panel">
        <template v-if="selectedConversation">
          <div class="chat-header">
            <div class="chat-customer">
              <div class="customer-avatar large">
                {{ selectedConversation.user_id ? "K" : "?" }}
              </div>
              <div>
                <h2>Khách hàng #{{ selectedConversation.user_id }}</h2>
                <p>
                  Cuộc trò chuyện #{{ selectedConversation.id }}
                  <span class="header-dot">•</span>
                  {{ getConversationStatus(selectedConversation.status) }}
                </p>
              </div>
            </div>

            <button
              v-if="Number(selectedConversation.status) !== 0"
              class="close-chat-button"
              type="button"
              @click="closeConversation"
            >
              Đóng cuộc trò chuyện
            </button>
            <span v-else class="closed-badge">Đã đóng</span>
          </div>

          <div ref="messageList" class="message-list">
            <div v-if="messages.length === 0" class="empty-messages">
              <div class="empty-icon">☏</div>
              <strong>Bắt đầu cuộc trò chuyện</strong>
              <p>Chưa có tin nhắn nào trong cuộc trò chuyện này.</p>
            </div>

            <div
              v-for="message in messages"
              :key="message.id"
              class="message-row"
              :class="{
                'my-message': message.sender_type === 'employee',
              }"
            >
              <div class="message-bubble">
                <span class="message-sender">
                  {{
                    message.sender_type === "employee"
                      ? "Bạn"
                      : message.sender_type === "user"
                        ? "Khách hàng"
                        : "Người gửi"
                  }}
                </span>
                <p>{{ message.content }}</p>
              </div>
            </div>
          </div>

          <form
            v-if="Number(selectedConversation.status) !== 0"
            class="message-form"
            @submit.prevent="sendMessage"
          >
            <input
              v-model="newMessage"
              type="text"
              maxlength="2000"
              placeholder="Nhập tin nhắn của bạn..."
              autocomplete="off"
            />
            <button
              type="submit"
              class="send-button"
              :disabled="!newMessage.trim()"
            >
              Gửi tin nhắn
              <span>➤</span>
            </button>
          </form>

          <div v-else class="closed-notice">
            Cuộc trò chuyện đã đóng và không thể gửi thêm tin nhắn.
          </div>
        </template>

        <div v-else class="chat-placeholder">
          <div class="placeholder-icon">✉</div>
          <h2>Hộp thư hỗ trợ</h2>
          <p>Chọn một cuộc trò chuyện ở bên trái để xem tin nhắn và phản hồi khách hàng.</p>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.chat-page {
  min-height: 100vh;
  padding: 28px;
  background: #f4f6fa;
  color: #1e293b;
  font-family: Arial, sans-serif;
}

.page-header {
  max-width: 1440px;
  margin: 0 auto 24px;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  background: #fff;
  color: #475569;
  cursor: pointer;
  font-size: 14px;
}

.back-button:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.back-icon {
  font-size: 20px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 22px;
}

.header-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 13px;
  background: #e0eaff;
  color: #2563eb;
  font-size: 25px;
}

.header-title h1 {
  margin: 0 0 6px;
  font-size: 25px;
}

.header-title p,
.panel-heading p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.error-message {
  max-width: 1440px;
  margin: 0 auto 16px;
  padding: 12px 16px;
  border: 1px solid #fecaca;
  border-radius: 9px;
  background: #fef2f2;
  color: #b91c1c;
  display: flex;
  justify-content: space-between;
}

.error-message button {
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 18px;
}

.chat-layout {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: 20px;
  max-width: 1440px;
  height: min(690px, calc(100vh - 205px));
  min-height: 480px;
  margin: 0 auto;
}

.conversation-panel,
.chat-panel {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #e5eaf1;
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 4px 16px rgb(15 23 42 / 4%);
}

.conversation-panel {
  display: flex;
  flex-direction: column;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 20px;
  border-bottom: 1px solid #edf0f5;
}

.panel-heading h2,
.chat-header h2 {
  margin: 0 0 7px;
  font-size: 17px;
}

.conversation-count {
  display: grid;
  place-items: center;
  min-width: 30px;
  height: 30px;
  padding: 0 8px;
  border-radius: 9px;
  background: #eaf1ff;
  color: #2563eb;
  font-weight: 700;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 17px 16px;
  border: 0;
  border-bottom: 1px solid #f1f5f9;
  background: #fff;
  text-align: left;
  cursor: pointer;
}

.conversation-item:hover {
  background: #f8faff;
}

.conversation-item.active {
  background: #edf4ff;
  box-shadow: inset 3px 0 #3b82f6;
}

.customer-avatar {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 43px;
  height: 43px;
  border-radius: 50%;
  background: #e0eaff;
  color: #2859b8;
  font-size: 17px;
  font-weight: 700;
}

.customer-avatar.large {
  width: 46px;
  height: 46px;
}

.conversation-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.conversation-top strong {
  overflow: hidden;
  color: #1e293b;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-subtitle {
  color: #64748b;
  font-size: 12px;
}

.status-label {
  width: fit-content;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.status-0 {
  background: #f1f5f9;
  color: #64748b;
}

.status-1 {
  background: #fff7ed;
  color: #c2410c;
}

.status-2 {
  background: #dcfce7;
  color: #15803d;
}

.item-arrow {
  color: #94a3b8;
  font-size: 25px;
}

.chat-panel {
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 20px 24px;
  border-bottom: 1px solid #edf0f5;
}

.chat-customer {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.chat-header h2 {
  overflow-wrap: anywhere;
}

.chat-header p {
  margin: 0;
  color: #64748b;
  font-size: 12px;
}

.header-dot {
  padding: 0 4px;
}

.close-chat-button {
  flex-shrink: 0;
  padding: 9px 12px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fff;
  color: #dc2626;
  cursor: pointer;
  font-size: 12px;
}

.close-chat-button:hover {
  background: #fef2f2;
}

.closed-badge {
  padding: 7px 10px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 12px;
}

.message-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 15px;
  overflow-y: auto;
  padding: 24px;
  background: #fafbfe;
}

.message-row {
  display: flex;
  justify-content: flex-start;
}

.message-row.my-message {
  justify-content: flex-end;
}

.message-bubble {
  max-width: min(75%, 520px);
  padding: 11px 14px;
  border: 1px solid #e5eaf1;
  border-radius: 13px 13px 13px 4px;
  background: #fff;
  overflow-wrap: anywhere;
}

.my-message .message-bubble {
  border-color: #2563eb;
  border-radius: 13px 13px 4px 13px;
  background: #2563eb;
  color: #fff;
}

.message-sender {
  display: block;
  margin-bottom: 6px;
  color: #64748b;
  font-size: 11px;
  font-weight: 600;
}

.my-message .message-sender {
  color: #dbeafe;
}

.message-bubble p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.message-form {
  display: flex;
  gap: 12px;
  padding: 17px 20px;
  border-top: 1px solid #edf0f5;
  background: #fff;
}

.message-form input {
  flex: 1;
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid #dbe2ec;
  border-radius: 9px;
  outline: none;
  font-size: 14px;
}

.message-form input:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgb(59 130 246 / 10%);
}

.send-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 17px;
  border: 0;
  border-radius: 9px;
  background: #2563eb;
  color: #fff;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
}

.send-button:hover {
  background: #1d4ed8;
}

.send-button:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.closed-notice {
  padding: 18px;
  background: #f8fafc;
  color: #64748b;
  text-align: center;
  font-size: 13px;
}

.empty-conversations,
.empty-messages,
.chat-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  color: #64748b;
  text-align: center;
}

.empty-conversations {
  flex: 1;
}

.empty-conversations strong,
.empty-messages strong {
  margin-top: 12px;
  color: #334155;
  font-size: 14px;
}

.empty-conversations p,
.empty-messages p,
.chat-placeholder p {
  max-width: 300px;
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.6;
}

.empty-icon,
.placeholder-icon {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border-radius: 18px;
  background: #edf4ff;
  color: #3b82f6;
  font-size: 27px;
}

.chat-placeholder {
  flex: 1;
  padding: 35px;
}

.chat-placeholder h2 {
  margin: 20px 0 0;
  color: #334155;
  font-size: 20px;
}

@media (max-width: 900px) {
  .chat-page {
    padding: 18px;
  }

  .chat-layout {
    grid-template-columns: 280px minmax(0, 1fr);
    gap: 12px;
  }

  .chat-header {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 650px) {
  .chat-layout {
    grid-template-columns: 1fr;
    height: auto;
    min-height: 0;
  }

  .conversation-panel {
    max-height: 300px;
  }

  .chat-panel {
    min-height: 480px;
  }

  .chat-header {
    padding: 16px;
  }

  .message-list {
    min-height: 250px;
    padding: 16px;
  }

  .message-form {
    padding: 12px;
  }

  .send-button {
    padding: 0 12px;
    font-size: 12px;
  }
}
</style>
