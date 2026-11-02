import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/auth/Login.vue'
import RegisterView from '../views/auth/Register.vue'
import HomeView from '../views/user/HomeView.vue'
import AdminHomeView from '../views/admin/dashboard/AdminHomeView.vue'
import CategoryManagerView from '../views/admin/categories/CategoryManagementView.vue'
import BrandManagerView from '../views/admin/banners/BannerManagementView.vue'
import CouponManagementView from '../views/admin/coupons/CouponManagementView.vue'
import ForgotPasswordView from '../views/auth/ForgotPasswordView.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    //  KHÁCH HÀNG VÀ XÁC THỰC
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

    // B. TRANG CHỦ QUẢN TRỊ
    {
      path: '/admin',
      name: 'admin-home',
      component: AdminHomeView,
    },

    // QUẢN LÝ SẢN PHẨM
    {
      path: '/admin/products',
      name: 'admin-products',
      component: () => import('../views/admin/product/ProductManagementView.vue'),
      meta: {
        title: 'Quản lý sản phẩm',
        permission: 'manage_products',
        isMenu: true,
      },
    },
    //  QUẢN LÝ DANH MỤC
    {
      path: '/admin/categories',
      name: 'admin-categories',
      component: CategoryManagerView,
      meta: {
        title: 'Quản lý danh mục',
        permission: 'manage_categories',
        isMenu: true,
      },
    },

    //  QUẢN LÝ THƯƠNG HIỆU
    {
      path: '/admin/brands',
      name: 'admin-brands',
      component: BrandManagerView,
      meta: {
        title: 'Quản lý thương hiệu',
        permission: 'manage_brands',
        isMenu: true,
      },
    },
    // F. QUẢN LÝ NHÀ CUNG CẤP
    {
      path: '/admin/suppliers',
      name: 'admin-suppliers',
      component: () => import('../views/admin/suppliers/SupplierManagementView.vue'),
      meta: {
        title: 'Quản lý nhà cung cấp',
        permission: 'manage_suppliers',
        isMenu: true,
      },
    },
    // G. QUẢN LÝ NHÂN VIÊN
    {
      path: '/admin/employees',
      name: 'admin-employees',
      component: () => import('../views/admin/employees/EmployeeManagementView.vue'),
      meta: {
        title: 'Quản lý nhân viên',
        permission: 'manage_employees',
        isMenu: true,
      },
    },
    // QUẢN LÝ NGƯỜI DÙNG
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('../views/admin/customers/CustomerManagementView.vue'),
      meta: {
        title: 'Quản lý người dùng',
        permission: 'manage_users',
        isMenu: true,
      },
    },
    // QUẢN LÝ NHẬP HÀNG VÀ TỒN KHO
    {
      path: '/admin/purchases',
      name: 'admin-purchases',
      component: () => import('../views/admin/inventory/PurchaseReceiptView.vue'),
      meta: {
        title: 'Quản lý đơn nhập hàng',
        permission: 'manage_inventory',
        isMenu: true,
      },
    },
    //  QUẢN LÝ MÃ GIẢM GIÁ
    {
      path: '/admin/coupons',
      name: 'admin-coupons',
      component: CouponManagementView,
      meta: {
        title: 'Quản lý voucher',
        permission: 'manage_coupons',
        isMenu: true,
      },
    },
    // K. QUẢN LÝ BANNER
    {
      path: '/admin/banners',
      name: 'admin-banners',
      component: () => import('../views/admin/brands/BrandManagementView.vue'),
      meta: {
        title: 'Quản lý banner',
        permission: 'manage_banners',
        isMenu: true,
      },
    },
    // L. QUẢN LÝ ĐƠN HÀNG
    {
      path: '/admin/orders',
      name: 'admin-orders',
      component: () => import('../views/admin/orders/AdminOrdersView.vue'),
      meta: {
        title: 'Quản lý đơn hàng',
        permission: 'manage_orders',
        isMenu: true,
      },
    },
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

    //  QUẢN LÝ GIAO HÀNG
    {
      path: '/ship',
      name: 'shipper-orders',
      component: () => import('../views/shipper/ShipperOrdersView.vue'),
      meta: {
        title: 'Quản lý giao hàng',
        permission: 'manage_delivery',
        isMenu: true,
      },
    },
    // QUẢN LÝ THỐNG KÊ
    {
      path: '/admin/Dashboard',
      name: 'admin-dashboard',
      component: () => import('../views/admin/statistics/StatisticsView.vue'),
      meta: {
        title: 'Thống kê',
        permission: 'view_statistics',
        isMenu: true,
      },
    },
    // GIỎ HÀNG VÀ THANH TOÁN
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

    // QUẢN LÝ TÀI KHOẢN
    {
      path: '/account',
      name: 'user-account',
      component: () => import('../views/user/AccountView.vue'),
    },
    // CHI TIẾT SẢN PHẨM
    {
      path: '/product/:id',
      name: 'product-detail',
      component: () => import('../views/user/ProductDetailView.vue'),
    },
    // CHAT VÀ TƯ VẤN KHÁCH HÀNG
    {
      path: '/chat',
      name: 'user-chat',
      component: () => import('../views/user/UserChatView.vue'),
    },
    {
      path: '/admin/chat',
      name: 'admin-chat',
      component: () => import('../views/admin/chat/AdminChatView.vue'),
      meta: {
        title: 'Tư vấn khách hàng',
        permission: 'manage_chat',
        isMenu: true,
      },
    },
    // QUẢN LÝ THÔNG BÁO
    {
      path: '/admin/notification',
      name: 'admin-notifications',
      component: () => import('../views/admin/notifications/AdminNotificationView.vue'),
      meta: {
        title: 'Quản lý thông báo',
        permission: 'manage_chat',
        isMenu: true,
      },
    },
    {
      path: '/notifications',
      name: 'user-notifications',
      component: () => import('../views/user/UserNotificationView.vue'),
    },
  ],
})

// KIỂM TRA QUYỀN TRUY CẬP
router.beforeEach((to) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const requiredPermission = to.meta.permission
  // Nếu trang yêu cầu quyền mà người dùng không có
  if (requiredPermission && !user.permissions?.includes(requiredPermission)) {
    alert('Bạn không có quyền truy cập vào mục này!')

    return '/admin'
  }
  // Không return false hoặc đường dẫn khác nghĩa là cho phép tiếp tục
})


export default router
