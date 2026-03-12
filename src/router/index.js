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
      // 客服专属工作台 (真实嵌套在后台里)
      { 
        path: 'service-workspace', 
        name: 'ServiceWorkspace', 
        component: () => import('../views/service/ServiceWorkspace.vue') 
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
		name: 'WarehouseWorkspace', 
		component: () => import('../views/warehouse/WarehouseWorkspace.vue') 
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
			 // 财务中心
			   { 
				 path: 'finance-workspace', 
				 name: 'FinanceWorkspace', 
				 component: () => import('../views/finance/FinanceWorkspace.vue') 
			   }
		
    ]
  },
  // ===== 客户专属下单大厅 (外部客户走这里) =====
  {
    path: '/customer',
    name: 'CustomerDashboard',
    component: () => import('../views/customer/NewOrder.vue') 
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router