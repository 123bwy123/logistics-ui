<template>
  <div class="app-container">
    <el-card shadow="never" class="box-card" style="border-radius: 8px;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 800; font-size: 18px; color: #303133;">
            <el-icon><Box /></el-icon> 中心枢纽总仓 - 仓储调度中心
          </span>
          <el-button type="primary" plain icon="Refresh" @click="refreshCurrentTab">刷新当前页</el-button>
        </div>
      </template>

      <el-tabs v-model="activeTab" type="border-card" @tab-click="handleTabClick">
        
        <el-tab-pane label="🚛 供应商入库月台 (进货)" name="inbound">
          <el-alert title="大卡车抵达后，请清点货品数量，确认无损后点击入库。入库后实际库存将暴涨！" type="warning" show-icon style="margin-bottom: 20px;" />

          <el-table :data="inboundData" border stripe style="width: 100%" v-loading="loading">
            <el-table-column prop="purchaseNo" label="待收货采购单号" width="220" align="center">
              <template #default="scope">
                <el-tag type="info" size="large">{{ scope.row.purchaseNo }}</el-tag>
              </template>
            </el-table-column>
            
            <el-table-column prop="supplierName" label="发货方 (供应商)" min-width="180" align="center" />

            <el-table-column label="单据总价值" width="180" align="center">
              <template #default="scope">
                <span style="color: #F56C6C; font-weight: bold;">¥ {{ scope.row.totalAmount }}</span>
              </template>
            </el-table-column>

            <el-table-column label="物流状态" width="150" align="center">
              <template #default>
                <el-tag type="primary" effect="plain"><el-icon><Van /></el-icon> 货车已抵达</el-tag>
              </template>
            </el-table-column>

            <el-table-column label="仓储操作" width="200" align="center" fixed="right">
              <template #default="scope">
                <el-button type="success" icon="Check" size="small" @click="handleReceive(scope.row)">
                  重磅！验货并一键入库
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="📦 内部调拨出库作业 (发货)" name="outbound">
          <el-alert title="请仔细核对调拨单号与货物，确认无误后点击【发货出库】发往各大分站。" type="info" show-icon style="margin-bottom: 20px;" />

          <el-table :data="outboundData" border stripe style="width: 100%" v-loading="loading">
            <el-table-column prop="transferNo" label="内部调拨单号" width="200" align="center">
              <template #default="scope">
                <el-tag type="warning" effect="dark">{{ scope.row.transferNo }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="customerOrderNo" label="关联客户单号" width="180" align="center" />
            <el-table-column prop="receiveAddress" label="终端配送地址" min-width="250" show-overflow-tooltip />
            <el-table-column prop="createTime" label="下达时间" width="170" align="center">
              <template #default="scope">{{ formatDate(scope.row.createTime) }}</template>
            </el-table-column>
            
            <el-table-column label="库房操作" width="150" align="center" fixed="right">
              <template #default="scope">
                <el-button size="small" type="primary" icon="Van" @click="handleOutbound(scope.row)">发货出库</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Box, Van, Check, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const activeTab = ref('inbound') // 默认打开入库月台
const inboundData = ref([])      // 装入库单的数组
const outboundData = ref([])     // 装出库单的数组
const loading = ref(false)

// 刷新当前选中的标签页数据
const refreshCurrentTab = () => {
  if (activeTab.value === 'inbound') fetchInboundList()
  else fetchOutboundList()
}

// 切换标签页时触发
const handleTabClick = (tab) => {
  refreshCurrentTab()
}

// ================= 1. 进货入库逻辑 (新) =================
const fetchInboundList = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/admin/centerWarehouse/pending')
    if (res.data.code === 200) inboundData.value = res.data.data
  } catch (error) {
    ElMessage.error('获取月台入库数据失败')
  } finally {
    loading.value = false
  }
}

const handleReceive = (row) => {
  ElMessageBox.confirm(
    `大仓主管请注意：签收采购单 [${row.purchaseNo}] 后，系统库存将立刻暴涨！此操作将产生财务对账流！确认无误吗？`,
    '📦 终极入库确认',
    { confirmButtonText: '货品无误，全量入库！', cancelButtonText: '等一下', type: 'warning' }
  ).then(async () => {
    const res = await axios.post(`http://localhost:8080/admin/centerWarehouse/receive?orderId=${row.orderId}`)
    if (res.data.code === 200) {
      ElMessage.success(res.data.msg)
      fetchInboundList() 
    } else {
      ElMessage.error(res.data.msg)
    }
  }).catch(() => {})
}

// ================= 2. 发货出库逻辑 (你原来的) =================
const fetchOutboundList = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/admin/warehouse/pendingOutbound')
    if (res.data.code === 200) outboundData.value = res.data.data
  } catch (error) {
    ElMessage.error('获取出库列表失败，请检查网络')
  } finally {
    loading.value = false
  }
}

const handleOutbound = (row) => {
  ElMessageBox.confirm(`确认将调拨单 [${row.transferNo}] 打包装车并发出吗？`, '出库确认', {
    confirmButtonText: '确认发货',
    cancelButtonText: '再核对一下',
    type: 'warning',
  }).then(async () => {
    const realAdminId = parseInt(localStorage.getItem('currentUserId')) || 0;
    const res = await axios.post('http://localhost:8080/admin/warehouse/outbound', null, {
      params: { transferId: row.id, adminId: realAdminId }
    })
    if (res.data.code === 200) {
      ElMessage.success(res.data.msg)
      fetchOutboundList() 
    } else {
      ElMessage.error(res.data.msg)
    }
  }).catch(() => {})
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return dateStr.replace('T', ' ')
}

onMounted(() => {
  fetchInboundList() // 初始化默认拉取入库数据
})
</script>

<style scoped>
.app-container { height: 100%; }
.box-card { min-height: 100%; }
</style>