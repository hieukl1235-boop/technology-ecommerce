import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/auth/Login.vue'
import Register from '../views/auth/Register.vue'
import Home from '../views/user/home.vue'
import AdminHome from '../views/admin/AdminHome.vue'
import CategoryManager from '../views/admin/CategoryManager.vue'
import BrandManager from '../views/admin/BrandManager.vue'
import ProductCreate from '../views/admin/ProductCreate.vue'
// import EditProduct from '../views/admin/EditProduct.vue'
import CouponManagement from '../views/admin/CouponManagement.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ==========================================
    // KHÁCH HÀNG & XÁC THỰC
    // ==========================================
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
    },
    {
      path: '/home',
      name: 'home',
      component: Home,
    },

    // ==========================================
    // TRANG CHỦ ADMIN DASHBOARD
    // ==========================================
    {
      path: '/admin',
      name: 'admin-home',
      component: AdminHome,
    },

    // ==========================================
    // CÁC CHỨC NĂNG QUẢN LÝ (Có hiện nút ở Menu Dashboard)
    // ==========================================
    {
      path: '/admin/products',
      name: 'admin-products',
      component: () => import('../views/admin/product/ProductManagement.vue'),
      meta: {
        title: 'Quản lý sản phẩm',
        permission: 'manage_products',
        isMenu: true,
      },
    },
    {
      path: '/admin/categories',
      name: 'admin-categories',
      component: CategoryManager,
      meta: {
        title: 'Quản lý danh mục',
        permission: 'manage_categories',
        isMenu: true,
      },
    },
    {
      path: '/admin/brands',
      name: 'admin-brands',
      component: BrandManager,
      meta: {
        title: 'Quản lý thương hiệu',
        permission: 'manage_brands',
        isMenu: true,
      },
    },
    {
      path: '/admin/suppliers',
      name: 'admin-suppliers',
      component: () => import('../views/admin/Test.vue'),
      meta: {
        title: 'Quản lý nhà cung cấp',
        permission: 'manage_suppliers',
        isMenu: true,
      },
    },
    {
      path: '/admin/employees',
      name: 'admin-employees',
      component: () => import('../views/admin/EmployeeManager.vue'),
      meta: {
        title: 'Quản lý nhân viên',
        permission: 'manage_employees',
        isMenu: true,
      },
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('../views/admin/UserManager.vue'),
      meta: {
        title: 'Quản lý người dùng',
        permission: 'manage_users',
        isMenu: true,
      },
    },
    {
      path: '/admin/purchases',
      name: 'admin-purchases',
      component: () => import('../views/admin/PurchaseReceiptTest.vue'),
      meta: {
        title: 'Quản lý đơn nhập hàng',
        permission: 'manage_inventory',
        isMenu: true,
      },
    },
    {
      path: '/admin/coupons',
      component: CouponManagement,
      meta: {
        title: 'Quản lí vourcher',
        isMenu: true,
        permission: 'manage_coupons',
      },
    },
    {
      path: '/admin/banners',
      component: () => import('../views/admin/BannerManager.vue'),
      meta: {
        title: 'Quản lí banner',
        isMenu: true,
        permission: 'manage_banners',
      },
    },
    {
      path: '/admin/orders',
      component: () => import('../views/admin/AdminOrders.vue'),
      meta: {
        title: 'Quản lí đơn hàng',
        isMenu: true,
        permission: 'manage_orders',
      },
    },
    {
      path: '/user/orders',
      name: 'UserOrders',
      component: () => import('../views/user/UserOrdersView.vue'),
    },

    // ==========================================
    // CÁC TRANG CON (Thêm / Sửa - Không hiện nút ở Menu nhưng vẫn kiểm tra quyền)
    // ==========================================
    {
      path: '/admin/products/create',
      name: 'admin-product-create',
      component: ProductCreate,
      meta: { permission: 'manage_products' },
    },
    {
      path: '/cart',
      name: 'cart',
      component: () => import('../views/user/cart.vue'),
    },
    {
      path: '/account',
      name: 'account',
      component: () => import('../views/user/account.vue'),
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: () => import('../views/user/checkout.vue'),
    },
    {
      path: '/ship',
      name: 'ship',
      component: () => import('../views/shipper/ShipperOrders.vue'),
      meta: {
        title: 'Shipper',
        isMenu: true,
        permission: 'manage_delivery',
      },
    },
    { path: '/product/:id', component: () => import('../views/user/Productdetail.vue') },
    {
      path: '/chat',
      component: () => import('../views/user/chat.vue'),
    },
    {
      path: '/admin/chat',
      component: () => import('../views/admin/Chat.vue'),
      meta: {
        title: 'Tư vấn khách hàng',
        isMenu: true,
        permission: 'manage_chat',
      },
    },
    {
      path: '/admin/notification',
      component: () => import('../views/admin/Adminnotification.vue'),
      meta: {
        title: 'Quản lí thông báo',
        isMenu: true,
        permission: 'manage_chat',
      },
    },
    {
      path: '/notifications',
      component: () => import('../views/user/UserNotification.vue'),
    },
    {
      path: '/user/orders/:orderCode',
      name: 'OrderDetail',
      component: () => import('../views/user/OrderDetail.vue'),
      props: true, // (Tùy chọn) Cho phép truyền params trực tiếp vào props của component nếu muốn
    },
    {
      path: '/admin/Dashboard',
      component: () => import('../views/admin/AdminDashboard.vue'),
      meta: {
        title: 'Thống kê',
        isMenu: true,
        permission: 'view_statistics',
      },
    },
  ],
})
// ==========================================

// ==========================================
// BẢO VỆ ĐƯỜNG DẪN (Chặn gõ URL trái phép)
// ==========================================
// ==========================================
// BẢO VỆ ĐƯỜNG DẪN (Chặn gõ URL trái phép)
// ==========================================
router.beforeEach((to, from) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const requiredPermission = to.meta?.permission

  // Nếu trang này yêu cầu quyền mà tài khoản không có
  if (requiredPermission && !user.permissions?.includes(requiredPermission)) {
    alert('Bạn không có quyền truy cập vào mục này!')
    return '/admin' // Thay vì next('/admin'), ta dùng return trực tiếp
  }

  // Nếu hợp lệ, không cần return gì cả (hoặc có thể return true để cho phép qua)
})

export default router
