<template>
  <div class="app-container">
    <el-card class="box-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span style="font-weight: bold; font-size: 16px;">
            <el-icon><Box /></el-icon> 中心库房 - 待出库调拨作业
          </span>
          <el-button type="primary" plain size="small" icon="Refresh" @click="fetchOutboundList">刷新作业台</el-button>
        </div>
      </template>

      <el-alert title="请仔细核对调拨单号与货物，确认无误后点击【发货出库】。" type="info" show-icon style="margin-bottom: 20px;" />

      <el-table :data="tableData" border stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="transferNo" label="内部调拨单号" width="200" align="center">
          <template #default="scope">
            <el-tag type="warning" effect="dark">{{ scope.row.transferNo }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="customerOrderNo" label="关联客户单号" width="180" align="center" />
        <el-table-column prop="receiveAddress" label="终端配送地址 (贴面单用)" min-width="250" show-overflow-tooltip />
        <el-table-column prop="createTime" label="下达时间" width="170" align="center">
          <template #default="scope">{{ formatDate(scope.row.createTime) }}</template>
        </el-table-column>
        
        <el-table-column label="库房操作" width="150" align="center" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" icon="Van" @click="handleOutbound(scope.row)">发货出库</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Box, Van, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const tableData = ref([])
const loading = ref(false)

const fetchOutboundList = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/admin/warehouse/pendingOutbound')
    if (res.data.code === 200) {
      tableData.value = res.data.data
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (error) {
    ElMessage.error('获取列表失败，请检查网络')
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return dateStr.replace('T', ' ')
}

const handleOutbound = (row) => {
  ElMessageBox.confirm(`确认将调拨单 [${row.transferNo}] 打包装车并发出吗？`, '出库确认', {
    confirmButtonText: '确认发货',
    cancelButtonText: '再核对一下',
    type: 'warning',
  }).then(async () => {
    // 获取当前登录的真实库管员ID
    const realAdminId = parseInt(localStorage.getItem('currentUserId')) || 0;
    
    const res = await axios.post('http://localhost:8080/admin/warehouse/outbound', null, {
      params: { transferId: row.id, adminId: realAdminId }
    })
    
    if (res.data.code === 200) {
      ElMessage.success(res.data.msg)
      fetchOutboundList() // 刷新列表，数据消失，发往下一站
    } else {
      ElMessage.error(res.data.msg)
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchOutboundList()
})
</script>

<style scoped>
.app-container { height: 100%; }
.box-card { min-height: 100%; }
</style>