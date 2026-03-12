<template>
  <div class="common-layout">
    <el-container class="layout-container">
      <el-aside width="220px" class="aside-menu">
        <div class="logo-box">
          <img src="https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg" alt="logo" class="sidebar-logo" />
          <span class="sidebar-title">智能物流后台</span>
        </div>
        
        <el-menu
                  active-text-color="#409EFF"
                  background-color="#304156"
                  text-color="#bfcbd9"
                  :default-active="route.path"
                  router
                  class="el-menu-vertical"
                >
                  <el-menu-item index="/admin/system-user" v-if="currentRole === 'admin'">
				  <el-icon><User /></el-icon>
				  <span>员工账号管理</span>
				</el-menu-item>
	  
				<el-menu-item index="/admin/service-workspace" v-if="currentRole === 'service' || currentRole === 'admin'">
				  <el-icon><PhoneFilled /></el-icon>
				  <span>客服工作台</span>
				</el-menu-item>

				<el-menu-item index="/admin/new-order" v-if="currentRole === 'service' || currentRole === 'admin'">
				  <el-icon><ShoppingCart /></el-icon>
				  <span>新订订单</span>
				</el-menu-item>

			<el-menu-item index="/admin/customer-order-workspace" v-if="currentRole === 'service' || currentRole === 'admin'">
			  <el-icon><List /></el-icon>
			  <span>订单管理</span>
			</el-menu-item>
	  
				<el-menu-item index="/admin/dispatch-workspace" v-if="currentRole === 'dispatcher' || currentRole === 'admin'">
				  <el-icon><Guide /></el-icon>
				  <span>调度中心工作台</span>
				</el-menu-item>
	  
				<el-menu-item index="/admin/warehouse-workspace" v-if="currentRole === 'center_warehouse' || currentRole === 'admin'">
				  <el-icon><Box /></el-icon>
				  <span>库房出库管理</span>
				</el-menu-item>
	  
				<el-menu-item index="/admin/station-workspace" v-if="currentRole === 'station_admin' || currentRole === 'admin'">
				  <el-icon><Bicycle /></el-icon>
				  <span>分站派件管理</span>
				</el-menu-item>
	  
				<el-menu-item index="/admin/station-warehouse-workspace" v-if="currentRole === 'station_warehouse' || currentRole === 'admin'">
				  <el-icon><House /></el-icon>
				  <span>分站库房工作台</span>
				</el-menu-item>
				<el-menu-item index="/admin/courier-workspace" v-if="currentRole === 'courier' || currentRole === 'admin'">
				<el-icon><Bicycle /></el-icon>
				<span>骑士终端 (派送)</span>
			  </el-menu-item>  
			  <el-menu-item index="/admin/center-workspace" v-if="currentRole === 'center_admin' || currentRole === 'admin'">
				  <el-icon><DataLine /></el-icon>
				  <span>库存监控与采购大屏</span>
				</el-menu-item>
				<el-menu-item index="/admin/supplier-management" v-if="currentRole === 'center_admin' || currentRole === 'admin'">
					<el-icon><Shop /></el-icon>
					<span>供应商管理</span>
				</el-menu-item>
				<el-menu-item index="/admin/category-management" v-if="currentRole === 'center_admin' || currentRole === 'admin'">
					<el-icon><Fold /></el-icon>
					<span>商品分类管理</span>
				</el-menu-item>
				<el-menu-item index="/admin/product-management" v-if="currentRole === 'center_admin' || currentRole === 'admin'">
					<el-icon><Box /></el-icon>
					<span>商品信息管理</span>
				</el-menu-item>
				<el-menu-item index="/admin/warehouse-management" v-if="currentRole === 'center_admin' || currentRole === 'admin'">
					<el-icon><House /></el-icon>
					<span>库房设置</span>
				</el-menu-item>
				<el-menu-item index="/admin/warehouse-reserve" v-if="currentRole === 'center_admin' || currentRole === 'admin'">
					<el-icon><Timer /></el-icon>
					<span>库房储备设置</span>
				</el-menu-item>
				<el-menu-item index="/admin/inventory-report" v-if="currentRole === 'center_admin' || currentRole === 'admin'">
					<el-icon><DataLine /></el-icon>
					<span>全网库存查询</span>
				</el-menu-item>
				<el-menu-item index="/admin/stock-flow" v-if="currentRole === 'center_admin' || currentRole === 'admin'">
					<el-icon><List /></el-icon>
					<span>出入库流水账</span>
				</el-menu-item>

				<!-- 系统管理 (RBAC) -->
				<el-sub-menu index="system" v-if="currentRole === 'admin'">
					<template #title>
						<el-icon><Setting /></el-icon>
						<span>系统权限控制</span>
					</template>
					<el-menu-item index="/admin/system-user">员工账号管理</el-menu-item>
					<el-menu-item index="/admin/role-management">角色权限分配</el-menu-item>
				</el-sub-menu>

				<el-menu-item index="/admin/supplier-workspace" v-if="currentRole === 'supplier' || currentRole === 'admin'">
					<el-icon><Van /></el-icon>
					<span>厂家发货大厅</span>
				  </el-menu-item>
				  <el-menu-item index="/admin/finance-workspace" v-if="currentRole === 'finance_admin' || currentRole === 'admin'">
					  <el-icon><Money /></el-icon>
					  <span>财务结算与发票中心</span>
					</el-menu-item>
			  
          <el-menu-item index="/admin/customer-management" v-if="currentRole === 'service' || currentRole === 'admin'">
            <el-icon><Postcard /></el-icon>
            <span>客户信息查询</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-container>
        <el-header class="header">
          <div class="header-left">
            <el-icon class="fold-btn"><Expand /></el-icon>
            <span class="breadcrumb">首页 / 系统管理 / 员工账号管理</span>
          </div>
          <div class="header-right">
            <el-dropdown @command="handleCommand">
              <span class="el-dropdown-link" style="cursor: pointer; display: flex; align-items: center;">
				  {{ displayRoleName }} 
				  <el-icon class="el-icon--right"><arrow-down /></el-icon>
				</span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { User, Expand, ArrowDown, PhoneFilled, Postcard,Guide,Box,Bicycle,House,DataLine,Shop,Fold,Van,List,ShoppingCart,Money,Timer } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

// 取出当前登录用户的角色，存到变量里
const currentRole = localStorage.getItem('currentUserRole') || ''
// 【新增】：根据英文角色名，翻译成中文显示在右上角
const roleMap = {
  'admin': '超级管理员',
  'service': '客服人员',
  'dispatcher': '调度中心主管',
  'center_warehouse': '中心库房大叔',
  'station_warehouse': '分站接货员',
  'station_admin': '网点站长',
  'courier': '闪电骑士',
  'center_admin': '配送中心主管',
  'finance_admin': '财务总监'
}
// 计算出当前应该显示的中文名
const displayRoleName = roleMap[currentRole] || '内部员工'

const route = useRoute()
const router = useRouter()

const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessage.success('已安全退出系统')
    router.push('/login')
  }
}
</script>

<style scoped>
.common-layout, .layout-container {
  height: 100vh;
  width: 100vw;
}

/* 左侧边栏样式 */
.aside-menu {
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;
}
.logo-box {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2b3649;
  color: #fff;
}
.sidebar-logo {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 12px;
}
.sidebar-title {
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 1px;
}
.el-menu-vertical {
  border-right: none;
}

/* 顶部 Header 样式 */
.header {
  height: 60px;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0,21,41,0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}
.header-left {
  display: flex;
  align-items: center;
}
.fold-btn {
  font-size: 20px;
  cursor: pointer;
  margin-right: 15px;
  color: #606266;
}
.breadcrumb {
  font-size: 14px;
  color: #97a8be;
}
.user-dropdown {
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #606266;
  font-weight: 500;
}

/* 中间主内容区背景色 */
.main-content {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>