import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/auth/Login.vue'
import RegisterView from '../views/auth/Register.vue'
import HomeView from '../views/user/HomeView.vue'
import ForgotPasswordView from '../views/auth/ForgotPasswordView.vue'

// ⬇️ IMPORT MỚI cho layout admin
import AdminLayout from '../views/admin/layouts/AdminLayout.vue'
import AdminDashboard from '../views/admin/dashboard/AdminHomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/',
      redirect: '/home',
    },

    // ==================================================
    // KHÁCH HÀNG VÀ XÁC THỰC
    // ==================================================
    {
      path: '/login',
      name: 'auth-login',
      component: LoginView,
    },
    {
      path: '/register',
      name: 'auth-register',
      component: RegisterView,
    },
    {
      path: '/home',
      name: 'user-home',
      component: HomeView,
    },
    {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: ForgotPasswordView,
    },

    // ==================================================
    // ADMIN — DÙNG LAYOUT (SIDEBAR + HEADER)
    // ==================================================
    {
      path: '/admin',
      component: AdminLayout, // ⬅️ Khung bao ngoài
      children: [
        // ---------- TRANG CHỦ ADMIN ----------
        {
          path: '', // → /admin
          name: 'admin-home',
          component: AdminDashboard,
          meta: { title: 'Trang Quản Trị' },
        },

        // ---------- THÔNG TIN CÁ NHÂN ----------
        {
          path: 'profile', // → /admin/profile
          name: 'AdminProfile',
          component: () => import('@/views/admin/profile/AdminProfileView.vue'),
          meta: { title: 'Thông tin cá nhân' },
        },

        // ---------- QUẢN LÝ SẢN PHẨM ----------
        {
          path: 'products', // → /admin/products
          name: 'admin-products',
          component: () => import('../views/admin/product/ProductManagementView.vue'),
          meta: {
            title: 'Quản lý sản phẩm',
            permission: 'manage_products',
            isMenu: true,
          },
        },

        // ---------- QUẢN LÝ DANH MỤC ----------
        {
          path: 'categories', // → /admin/categories
          name: 'admin-categories',
          component: () => import('../views/admin/categories/CategoryManagementView.vue'),
          meta: {
            title: 'Quản lý danh mục',
            permission: 'manage_categories',
            isMenu: true,
          },
        },

        // ---------- QUẢN LÝ THƯƠNG HIỆU ----------
        {
          path: 'brands', // → /admin/brands
          name: 'admin-brands',
          component: () => import('../views/admin/banners/BannerManagementView.vue'),
          meta: {
            title: 'Quản lý thương hiệu',
            permission: 'manage_brands',
            isMenu: true,
          },
        },

        // ---------- QUẢN LÝ NHÀ CUNG CẤP ----------
        {
          path: 'suppliers', // → /admin/suppliers
          name: 'admin-suppliers',
          component: () => import('../views/admin/suppliers/SupplierManagementView.vue'),
          meta: {
            title: 'Quản lý nhà cung cấp',
            permission: 'manage_suppliers',
            isMenu: true,
          },
        },

        // ---------- QUẢN LÝ NHÂN VIÊN ----------
        {
          path: 'employees', // → /admin/employees
          name: 'admin-employees',
          component: () => import('../views/admin/employees/EmployeeManagementView.vue'),
          meta: {
            title: 'Quản lý nhân viên',
            permission: 'manage_employees',
            isMenu: true,
          },
        },

        // ---------- QUẢN LÝ NGƯỜI DÙNG ----------
        {
          path: 'users', // → /admin/users
          name: 'admin-users',
          component: () => import('../views/admin/customers/CustomerManagementView.vue'),
          meta: {
            title: 'Quản lý người dùng',
            permission: 'manage_users',
            isMenu: true,
          },
        },

        // ---------- QUẢN LÝ NHẬP HÀNG ----------
        {
          path: 'purchases', // → /admin/purchases
          name: 'admin-purchases',
          component: () => import('../views/admin/inventory/PurchaseReceiptView.vue'),
          meta: {
            title: 'Quản lý đơn nhập hàng',
            permission: 'manage_inventory',
            isMenu: true,
          },
        },

        // ---------- QUẢN LÝ VOUCHER ----------
        {
          path: 'coupons', // → /admin/coupons
          name: 'admin-coupons',
          component: () => import('../views/admin/coupons/CouponManagementView.vue'),
          meta: {
            title: 'Quản lý voucher',
            permission: 'manage_coupons',
            isMenu: true,
          },
        },

        // ---------- QUẢN LÝ BANNER ----------
        {
          path: 'banners', // → /admin/banners
          name: 'admin-banners',
          component: () => import('../views/admin/brands/BrandManagementView.vue'),
          meta: {
            title: 'Quản lý banner',
            permission: 'manage_banners',
            isMenu: true,
          },
        },

        // ---------- QUẢN LÝ ĐƠN HÀNG ----------
        {
          path: 'orders', // → /admin/orders
          name: 'admin-orders',
          component: () => import('../views/admin/orders/AdminOrdersView.vue'),
          meta: {
            title: 'Quản lý đơn hàng',
            permission: 'manage_orders',
            isMenu: true,
          },
        },

        // ---------- THỐNG KÊ ----------
        {
          path: 'Dashboard', // → /admin/Dashboard
          name: 'admin-dashboard',
          component: () => import('../views/admin/statistics/StatisticsView.vue'),
          meta: {
            title: 'Thống kê',
            permission: 'view_statistics',
            isMenu: true,
          },
        },

        // ---------- QUẢN LÝ ĐÁNH GIÁ ----------
        {
          path: 'reviews', // → /admin/reviews
          name: 'admin-reviews',
          component: () => import('../views/admin/reviews/ReviewManagementView.vue'),
          meta: {
            title: 'Quản lý đánh giá',
            permission: 'manage_products',
            isMenu: true,
          },
        },

        // ---------- CHAT TƯ VẤN ----------
        {
          path: 'chat', // → /admin/chat
          name: 'admin-chat',
          component: () => import('../views/admin/chat/AdminChatView.vue'),
          meta: {
            title: 'Tư vấn khách hàng',
            permission: 'manage_chat',
            isMenu: true,
          },
        },

        // ---------- QUẢN LÝ THÔNG BÁO ----------
        {
          path: 'notification', // → /admin/notification
          name: 'admin-notifications',
          component: () => import('../views/admin/notifications/AdminNotificationView.vue'),
          meta: {
            title: 'Quản lý thông báo',
            permission: 'manage_chat',
            isMenu: true,
          },
        },
        {
          path: 'ship',
          name: 'shipper-orders',
          component: () => import('../views/shipper/ShipperOrdersView.vue'),
          meta: {
            title: 'Quản lý giao hàng',
            permission: 'manage_delivery',
            isMenu: true,
          },
        },
      ],
    },

    // ==================================================
    // USER (khách hàng)
    // ==================================================
    {
      path: '/user/orders',
      name: 'user-orders',
      component: () => import('../views/user/UserOrdersView.vue'),
    },
    {
      path: '/user/orders/:orderCode',
      name: 'user-order-detail',
      component: () => import('../views/user/OrderDetail.vue'),
      props: true,
    },
    {
      path: '/order/:orderCode',
      name: 'order-detail',
      component: () => import('../views/user/UserOrderDetailView.vue'),
    },
    {
      path: '/cart',
      name: 'user-cart',
      component: () => import('../views/user/CartView.vue'),
    },
    {
      path: '/checkout',
      name: 'user-checkout',
      component: () => import('../views/user/CheckoutView.vue'),
    },
    {
      path: '/account',
      name: 'user-account',
      component: () => import('../views/user/AccountView.vue'),
    },
    {
      path: '/product/:id',
      name: 'product-detail',
      component: () => import('../views/user/ProductDetailView.vue'),
    },
    {
      path: '/chat',
      name: 'user-chat',
      component: () => import('../views/user/UserChatView.vue'),
    },
    {
      path: '/notifications',
      name: 'user-notifications',
      component: () => import('../views/user/UserNotificationView.vue'),
    },
  ],
})

// ==================================================
// KIỂM TRA QUYỀN TRUY CẬP
// ==================================================
router.beforeEach((to) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const requiredPermission = to.meta.permission

  if (requiredPermission && !user.permissions?.includes(requiredPermission)) {
    alert('Bạn không có quyền truy cập vào mục này!')
    return '/admin'
  }
})

export default router
