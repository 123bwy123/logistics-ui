import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/login/Login.vue'
import Layout from '../layout/index.vue' // 引入后台骨架

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/login/Register.vue')
  },
  // ===== 后台管理路由模块 (内部员工统一走这里) =====
  {
    path: '/admin',
    name: 'Admin',
    component: Layout, // 父组件是骨架
    redirect: '/admin/system-user',
    children: [
      {
        path: 'system-user',
        name: 'SystemUser',
        component: () => import('../views/admin/SystemUser.vue')
      },
      // 客户管理 (客服专用)
      {
        path: 'customer-management',
        name: 'CustomerManagement',
        component: () => import('../views/customer/CustomerWorkspace.vue')
      },
      // 客服专属工作台 (真实嵌套在后台里)
      {
        path: 'service-workspace',
        name: 'ServiceWorkspace',
        component: () => import('../views/service/ServiceWorkspace.vue')
      },
      // 客服代客下单（新订订单工作台）
      {
        path: 'new-order',
        name: 'NewOrderWorkspace',
        component: () => import('../views/service/NewOrderWorkspace.vue')
      },
      // 客服订单管理工作台（新订/退订/换货/退货）
      {
        path: 'customer-order-workspace',
        name: 'CustomerOrderWorkspace',
        component: () => import('../views/service/CustomerOrderWorkspace.vue')
      },
      // 调度中心工作台
      {
        path: 'dispatch-workspace',
        name: 'DispatchWorkspace',
        component: () => import('../views/dispatch/DispatchWorkspace.vue')
      },
      // 中心库房工作台
      {
        path: 'warehouse-workspace',
        name: 'CenterWarehouseWorkspace',
        component: () => import('../views/warehouse/CenterWarehouseWorkspace.vue')
      },
      // 分站工作台
      {
        path: 'station-workspace',
        name: 'StationWorkspace',
        component: () => import('../views/station/StationWorkspace.vue')
      },
      // 分站库房工作台
      {
        path: 'station-warehouse-workspace',
        name: 'StationWarehouseWorkspace',
        component: () => import('../views/station-warehouse/StationWarehouseWorkspace.vue')
      },
      // 快递小哥工作台
      {
        path: 'courier-workspace',
        name: 'CourierWorkspace',
        component: () => import('../views/courier/CourierWorkspace.vue')
      },
      // 【新增】配送中心管理员大屏
      {
        path: 'center-workspace',
        name: 'CenterWorkspace',
        component: () => import('../views/center/CenterWorkspace.vue')
      },
      {
        path: 'supplier-workspace',
        name: 'SupplierWorkspace',
        component: () => import('../views/supplier/SupplierWorkspace.vue')
      },
      {
        path: 'supplier-management',
        name: 'SupplierManagement',
        component: () => import('../views/center/SupplierManagement.vue')
      },
      {
        path: 'category-management',
        name: 'CategoryManagement',
        component: () => import('../views/center/CategoryManagement.vue')
      },
      {
        path: 'product-management',
        name: 'ProductManagement',
        component: () => import('../views/center/ProductManagement.vue')
      },
      {
        path: 'warehouse-management',
        name: 'WarehouseManagement',
        component: () => import('../views/center/WarehouseManagement.vue')
      },
      {
        path: 'warehouse-reserve',
        name: 'WarehouseReserve',
        component: () => import('../views/center/WarehouseReserve.vue')
      },
      {
        path: 'inventory-report',
        name: 'InventoryInquiry',
        component: () => import('../views/center/InventoryInquiry.vue')
      },
      {
        path: 'stock-flow',
        name: 'StockFlowReport',
        component: () => import('../views/center/StockFlowReport.vue')
      },
      // 财务中心
      {
        path: 'finance-workspace',
        name: 'FinanceWorkspace',
        component: () => import('../views/finance/FinanceWorkspace.vue')
      },
      // 系统管理 (Super Admin)
      {
        path: 'system-user',
        name: 'SystemUser',
        component: () => import('../views/admin/SystemUser.vue')
      },
      {
        path: 'role-management',
        name: 'RoleManagement',
        component: () => import('../views/admin/RoleManagement.vue')
      }
    ]
  },
  // ===== 客户专属下单大厅 (外部客户走这里) =====
  {
    path: '/customer',
    name: 'CustomerDashboard',
    component: () => import('../views/customer/NewOrder.vue')
  },
  // ===== 客户个人中心门户 (C 端入口) =====
  {
    path: '/customer-portal',
    name: 'CustomerPortal',
    component: () => import('../views/customer/CustomerPortal.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router