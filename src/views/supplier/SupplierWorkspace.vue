<template>
  <div class="app-container">
    <el-card shadow="never" class="box-card" style="border-radius: 8px;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 800; font-size: 18px; color: #303133;">
            <el-icon><Van /></el-icon> 厂家发货与订单协同平台 (B2B)
          </span>
          <el-button type="primary" plain icon="Refresh" @click="fetchOrders">刷新订单池</el-button>
        </div>
      </template>

      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="8">
          <el-card shadow="hover" style="background-color: #f0f9eb; border: none;">
            <div style="font-size: 14px; color: #67C23A;">待处理采购单 (笔)</div>
            <div style="font-size: 28px; font-weight: bold; margin-top: 10px;">{{ tableData.length }}</div>
          </el-card>
        </el-col>
      </el-row>

      <el-alert title="请仔细核对采购单金额与货品，确认无误后安排物流车辆发货。发货后，系统将自动通知对方【中心库房】准备接车验货。" type="info" show-icon style="margin-bottom: 20px;" />

      <el-table :data="tableData" border stripe style="width: 100%" v-loading="loading">
        <el-table-column type="expand">
          <template #default="props">
            <div style="padding: 20px; background-color: #fafafa;">
              <el-descriptions title="发货要求与物流规划" :column="2" border>
                <el-descriptions-item label="收货方">智能物流总公司 - 中心枢纽总仓</el-descriptions-item>
                <el-descriptions-item label="结算方式">月结转账 (货到付款核验)</el-descriptions-item>
                <el-descriptions-item label="要求送达时效">48小时内极速入库</el-descriptions-item>
                <el-descriptions-item label="承运要求">冷链/防震包装，车辆需具备 GPS 轨迹同步能力</el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="purchaseNo" label="官方采购单号" width="200" align="center">
          <template #default="scope">
            <el-tag type="info" size="large">{{ scope.row.purchaseNo }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="supplierName" label="出货厂家" min-width="180" align="center" />
        
        <el-table-column prop="purchaseDate" label="下达时间" width="180" align="center" />

        <el-table-column label="本单总金额 (元)" width="180" align="center">
          <template #default="scope">
            <span style="color: #F56C6C; font-weight: 900; font-size: 18px;">¥ {{ scope.row.totalAmount }}</span>
          </template>
        </el-table-column>

        <el-table-column label="当前状态" width="120" align="center">
          <template #default>
            <el-tag type="warning" effect="dark">待发货</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="scope">
            <el-button type="success" icon="Van" @click="handleDispatch(scope.row)">呼叫大卡车发货</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Van, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const tableData = ref([])
const loading = ref(false)

const fetchOrders = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/admin/supplier/pending')
    if (res.data.code === 200) tableData.value = res.data.data
  } catch (error) {
    ElMessage.error('订单拉取失败')
  } finally {
    loading.value = false
  }
}

const handleDispatch = (row) => {
  ElMessageBox.confirm(
    `确认将采购单 [${row.purchaseNo}] (总价值 ¥${row.totalAmount}) 装车发出吗？`,
    '🚛 发货确认',
    { confirmButtonText: '确认装车，立即发车', cancelButtonText: '取消', type: 'success' }
  ).then(async () => {
    const res = await axios.post(`http://localhost:8080/admin/supplier/dispatch?orderId=${row.orderId}`)
    if (res.data.code === 200) {
      ElMessage.success(res.data.msg)
      fetchOrders() // 刷新列表，发货完毕的订单将消失
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchOrders()
})
</script>