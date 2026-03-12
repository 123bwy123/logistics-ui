<template>
  <div class="customer-portal">
    <!-- 顶部导航 -->
    <div class="portal-header">
      <div class="logo-box">
        <img src="https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg" alt="logo" class="logo" />
        <h2>智能物流 · 客户门户</h2>
      </div>
      <div class="user-info">
        <el-icon><User /></el-icon>
        <span style="margin-left: 6px;">欢迎您，尊贵的客户</span>
        <el-button type="danger" link @click="logout" style="margin-left: 15px;">退出登录</el-button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="portal-main">
      <el-row :gutter="20">
        <!-- 欢迎卡片 -->
        <el-col :span="24">
          <el-card class="welcome-card" shadow="hover">
            <div class="welcome-content">
              <h1>🎉 欢迎来到客户服务中心</h1>
              <p>在这里，您可以快速下单、查询物流轨迹、管理个人信息。</p>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px;">
        <!-- 快捷功能入口 -->
        <el-col :span="8">
          <el-card shadow="hover" class="action-card" @click="goToNewOrder">
            <el-icon class="action-icon" style="color: #409eff;"><ShoppingCart /></el-icon>
            <h3>我要下单</h3>
            <p>发起新的物流配送请求</p>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover" class="action-card">
            <el-icon class="action-icon" style="color: #67c23a;"><Document /></el-icon>
            <h3>我的订单</h3>
            <p>查看全部历史订单及状态</p>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover" class="action-card">
            <el-icon class="action-icon" style="color: #e6a23c;"><UserFilled /></el-icon>
            <h3>个人信息</h3>
            <p>查看与修改个人资料</p>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { User, ShoppingCart, Document, UserFilled } from '@element-plus/icons-vue'

const router = useRouter()

const goToNewOrder = () => {
  router.push('/customer')
}

const logout = () => {
  localStorage.removeItem('currentUserId')
  localStorage.removeItem('currentUserRole')
  router.push('/login')
}
</script>

<style scoped>
.customer-portal {
  min-height: 100vh;
  background-color: #f0f2f5;
}

.portal-header {
  height: 60px;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
}
.logo-box {
  display: flex;
  align-items: center;
}
.logo {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 12px;
}
.portal-header h2 {
  margin: 0;
  font-size: 20px;
  letter-spacing: 1px;
}
.user-info {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.portal-main {
  max-width: 1000px;
  margin: 30px auto;
  padding: 0 20px;
}

.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
}
.welcome-content {
  text-align: center;
  color: white;
  padding: 30px 0;
}
.welcome-content h1 {
  margin: 0 0 10px;
  font-size: 28px;
}
.welcome-content p {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
}

.action-card {
  text-align: center;
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.3s ease;
  padding: 10px 0;
}
.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}
.action-icon {
  font-size: 42px;
  margin-bottom: 10px;
}
.action-card h3 {
  margin: 8px 0 4px;
  font-size: 18px;
  color: #303133;
}
.action-card p {
  margin: 0;
  font-size: 13px;
  color: #909399;
}
</style>
