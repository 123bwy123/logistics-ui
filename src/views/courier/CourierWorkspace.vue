<template>
  <div class="app-container">
    <el-card class="box-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span style="font-weight: bold; font-size: 16px;">
            <el-icon><Bicycle /></el-icon> 骑士终端 - 我的派送任务
          </span>
          <el-button type="success" plain size="small" icon="Refresh" @click="fetchMyTasks">刷新任务</el-button>
        </div>
      </template>

      <el-alert title="请仔细核对包裹与客户地址，收款后点击【确认送达】。" type="warning" show-icon style="margin-bottom: 20px;" />

      <el-table :data="tableData" border stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="taskNo" label="任务单号" width="180" align="center">
          <template #default="scope">
            <el-tag type="info">{{ scope.row.taskNo }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="receiveAddress" label="客户收件地址 (导航至)" min-width="250" show-overflow-tooltip />
        <el-table-column prop="totalAmount" label="应收货款(元)" width="120" align="center">
          <template #default="scope">
            <span style="color: red; font-weight: bold;">¥ {{ scope.row.totalAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="当前状态" width="100" align="center">
          <template #default>
            <el-tag type="warning">派送中</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="骑士操作" width="160" align="center" fixed="right">
          <template #default="scope">
            <el-button size="small" type="success" icon="Check" @click="handleConfirm(scope.row)">已收款·确认送达</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Bicycle, Check, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const tableData = ref([])
const loading = ref(false)

const fetchMyTasks = async () => {
  loading.value = true
  // 取出当前登录的小哥 ID
  const realCourierId = parseInt(localStorage.getItem('currentUserId')) || 0;
  
  try {
    const res = await axios.get(`http://localhost:8080/admin/courier/myTasks?courierId=${realCourierId}`)
    if (res.data.code === 200) {
      tableData.value = res.data.data
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (error) {
    ElMessage.error('获取任务失败，请检查网络')
  } finally {
    loading.value = false
  }
}

const handleConfirm = (row) => {
  ElMessageBox.confirm(
    `请确认已将包裹交予客户，并已收妥货款：¥ ${row.totalAmount} 元？`,
    '送达与收款确认',
    {
      confirmButtonText: '钱货两清，确认送达！',
      cancelButtonText: '再核对一下',
      type: 'success',
    }
  ).then(async () => {
    const res = await axios.post(`http://localhost:8080/admin/courier/confirm?taskId=${row.taskId}`)
    if (res.data.code === 200) {
      ElMessage.success(res.data.msg)
      fetchMyTasks() // 刷新列表，该任务会消失
    } else {
      ElMessage.error(res.data.msg)
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchMyTasks()
})
</script>

<style scoped>
.app-container { height: 100%; }
.box-card { min-height: 100%; }
</style>