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
                  <el-menu-item index="/admin/system-user">
                    <el-icon><User /></el-icon>
                    <span>员工账号管理</span>
                  </el-menu-item>
                  
                  <el-menu-item index="/admin/service-workspace">
                    <el-icon><PhoneFilled /></el-icon>
                    <span>客服工作台</span>
                  </el-menu-item>
                
          
          <el-menu-item index="/admin/customer">
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
              <span class="user-dropdown">
                超级管理员 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
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
import { User, Expand, ArrowDown, PhoneFilled, Postcard } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

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