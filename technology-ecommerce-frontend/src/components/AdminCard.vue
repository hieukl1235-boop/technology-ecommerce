<template>
  <div class="admin-card" @click="$emit('click')">
    <div class="card-icon" :class="`icon-${iconKey}`">
      <component :is="iconComponent" />
    </div>

    <div class="card-info">
      <span class="card-title">{{ title }}</span>
      <span class="card-subtitle">Truy cập quản lý &rarr;</span>
    </div>

    <div class="card-arrow">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2.5"
           stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { computed, h } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  }
})

defineEmits(['click'])

/* =========================================================
   ICON SVG INLINE (không cài thêm thư viện)
   Mỗi icon là 1 functional component nhỏ, render bằng h()
   ========================================================= */
const SvgWrap = (children) =>
  h(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      width: 22,
      height: 22,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    },
    children
  )

const IconProduct = () =>
  SvgWrap([
    h('path', { d: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' }),
    h('polyline', { points: '3.27 6.96 12 12.01 20.73 6.96' }),
    h('line', { x1: 12, y1: 22.08, x2: 12, y2: 12 })
  ])

const IconOrder = () =>
  SvgWrap([
    h('circle', { cx: 9, cy: 21, r: 1 }),
    h('circle', { cx: 20, cy: 21, r: 1 }),
    h('path', { d: 'M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6' })
  ])

const IconUser = () =>
  SvgWrap([
    h('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }),
    h('circle', { cx: 9, cy: 7, r: 4 }),
    h('path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }),
    h('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' })
  ])

const IconCategory = () =>
  SvgWrap([
    h('rect', { x: 3, y: 3, width: 7, height: 7, rx: 1 }),
    h('rect', { x: 14, y: 3, width: 7, height: 7, rx: 1 }),
    h('rect', { x: 14, y: 14, width: 7, height: 7, rx: 1 }),
    h('rect', { x: 3, y: 14, width: 7, height: 7, rx: 1 })
  ])

const IconBrand = () =>
  SvgWrap([
    h('path', { d: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z' }),
    h('line', { x1: 7, y1: 7, x2: 7.01, y2: 7 })
  ])

const IconBanner = () =>
  SvgWrap([
    h('rect', { x: 3, y: 3, width: 18, height: 18, rx: 2 }),
    h('circle', { cx: 8.5, cy: 8.5, r: 1.5 }),
    h('polyline', { points: '21 15 16 10 5 21' })
  ])

const IconReview = () =>
  SvgWrap([
    h('polygon', { points: '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' })
  ])

const IconChat = () =>
  SvgWrap([
    h('path', { d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' })
  ])

const IconVoucher = () =>
  SvgWrap([
    h('path', { d: 'M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6' }),
    h('path', { d: 'M2 7h20v5H2z' }),
    h('line', { x1: 12, y1: 22, x2: 12, y2: 7 })
  ])

const IconSettings = () =>
  SvgWrap([
    h('circle', { cx: 12, cy: 12, r: 3 }),
    h('path', { d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' })
  ])

const IconDashboard = () =>
  SvgWrap([
    h('rect', { x: 3, y: 3, width: 7, height: 9, rx: 1 }),
    h('rect', { x: 14, y: 3, width: 7, height: 5, rx: 1 }),
    h('rect', { x: 14, y: 12, width: 7, height: 9, rx: 1 }),
    h('rect', { x: 3, y: 16, width: 7, height: 5, rx: 1 })
  ])

const IconDefault = () =>
  SvgWrap([
    h('rect', { x: 3, y: 3, width: 7, height: 9, rx: 1 }),
    h('rect', { x: 14, y: 3, width: 7, height: 5, rx: 1 }),
    h('rect', { x: 14, y: 12, width: 7, height: 9, rx: 1 }),
    h('rect', { x: 3, y: 16, width: 7, height: 5, rx: 1 })
  ])

/* =========================================================
   MAP TITLE → ICON KEY
   Dựa vào từ khóa tiếng Việt trong title (không đổi dữ liệu)
   ========================================================= */
const iconKey = computed(() => {
  const t = (props.title || '').toLowerCase()
  if (/(sản phẩm|product|hàng hóa)/.test(t)) return 'product'
  if (/(đơn hàng|order|hóa đơn)/.test(t)) return 'order'
  if (/(người dùng|user|tài khoản|khách hàng)/.test(t)) return 'user'
  if (/(danh mục|category|loại)/.test(t)) return 'category'
  if (/(thương hiệu|brand|nhãn)/.test(t)) return 'brand'
  if (/(banner|quảng cáo|slider)/.test(t)) return 'banner'
  if (/(đánh giá|review|nhận xét|comment)/.test(t)) return 'review'
  if (/(chat|tin nhắn|tư vấn|hội thoại)/.test(t)) return 'chat'
  if (/(voucher|giảm giá|khuyến mãi|mã)/.test(t)) return 'voucher'
  if (/(cài đặt|thiết lập|setting|cấu hình)/.test(t)) return 'settings'
  if (/(dashboard|tổng quan|báo cáo)/.test(t)) return 'dashboard'
  return 'default'
})

const iconComponent = computed(() => {
  const map = {
    product: IconProduct,
    order: IconOrder,
    user: IconUser,
    category: IconCategory,
    brand: IconBrand,
    banner: IconBanner,
    review: IconReview,
    chat: IconChat,
    voucher: IconVoucher,
    settings: IconSettings,
    dashboard: IconDashboard,
    default: IconDefault
  }
  return map[iconKey.value] || IconDefault
})
</script>

<style scoped>
.admin-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
}

.admin-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #0284c7;
  transform: scaleY(0);
  transition: transform 0.25s ease;
}

.admin-card:hover {
  border-color: #0284c7;
  transform: translateY(-3px);
  box-shadow: 0 12px 24px -6px rgba(2, 132, 199, 0.15);
}

.admin-card:hover::before {
  transform: scaleY(1);
}

/* ---- ICON ---- */
.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.25s ease;
  color: #0284c7;
  background: #f0f9ff;
}

.admin-card:hover .card-icon {
  transform: scale(1.08) rotate(-3deg);
}

/* Màu riêng theo iconKey — giúp phân biệt trực quan */
.icon-product  { background: #eff6ff; color: #2563eb; }
.icon-order    { background: #fff7ed; color: #ea580c; }
.icon-user     { background: #f0fdf4; color: #16a34a; }
.icon-category { background: #fef3c7; color: #d97706; }
.icon-brand    { background: #fce7f3; color: #db2777; }
.icon-banner   { background: #f3e8ff; color: #9333ea; }
.icon-review   { background: #fef9c3; color: #ca8a04; }
.icon-chat     { background: #cffafe; color: #0891b2; }
.icon-voucher  { background: #fee2e2; color: #dc2626; }
.icon-settings { background: #f1f5f9; color: #475569; }
.icon-dashboard{ background: #e0e7ff; color: #4f46e5; }
.icon-default  { background: #f0f9ff; color: #0284c7; }

.admin-card:hover .card-icon {
  color: #ffffff;
}
.icon-product:hover,
.admin-card:hover .icon-product  { background: #2563eb; }
.admin-card:hover .icon-order    { background: #ea580c; }
.admin-card:hover .icon-user     { background: #16a34a; }
.admin-card:hover .icon-category { background: #d97706; }
.admin-card:hover .icon-brand    { background: #db2777; }
.admin-card:hover .icon-banner   { background: #9333ea; }
.admin-card:hover .icon-review   { background: #ca8a04; }
.admin-card:hover .icon-chat     { background: #0891b2; }
.admin-card:hover .icon-voucher  { background: #dc2626; }
.admin-card:hover .icon-settings { background: #475569; }
.admin-card:hover .icon-dashboard{ background: #4f46e5; }
.admin-card:hover .icon-default  { background: #0284c7; }

/* ---- INFO ---- */
.card-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 1.02rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-subtitle {
  font-size: 0.78rem;
  color: #94a3b8;
  font-weight: 500;
  transition: color 0.2s ease;
}

.admin-card:hover .card-subtitle {
  color: #0284c7;
}

/* ---- ARROW ---- */
.card-arrow {
  color: #cbd5e1;
  transition: all 0.25s ease;
  flex-shrink: 0;
}

.admin-card:hover .card-arrow {
  color: #0284c7;
  transform: translateX(4px);
}
</style>