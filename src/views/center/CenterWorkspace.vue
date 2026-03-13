<template>
  <div class="app-container">
    <el-card shadow="hover" class="box-card">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold; font-size: 16px;">
            <el-icon><DataLine /></el-icon> 配送中心 - 智能库存监控与采购大屏
          </span>
          <el-button type="primary" plain icon="Refresh" @click="fetchInventory">刷新大屏</el-button>
        </div>
      </template>

      <el-alert title="系统已开启自动巡检：当商品实际库存 ≤ 安全预警线时，将自动触发红色报警机制！" type="error" show-icon style="margin-bottom: 20px;" />

      <el-table :data="tableData" border style="width: 100%" v-loading="loading" :row-class-name="tableRowClassName">
        <el-table-column prop="productName" label="核心商品名称" min-width="200" />
        <el-table-column prop="unitPrice" label="进货单价(元)" width="120" align="center" />
        
        <el-table-column label="当前实际库存" width="150" align="center">
          <template #default="scope">
            <span :style="{ color: scope.row.isWarning === 1 ? 'red' : '#67C23A', fontWeight: 'bold', fontSize: '20px' }">
              {{ scope.row.stockQuantity }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column prop="warningLevel" label="安全预警线" width="120" align="center">
          <template #default="scope">
            <span style="color: #E6A23C; font-weight: bold;">{{ scope.row.warningLevel }}</span>
          </template>
        </el-table-column>

        <el-table-column label="健康状态" width="120" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.isWarning === 1" type="danger" effect="dark" round>缺货报警</el-tag>
            <el-tag v-else type="success" round>库存健康</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="供应链调度" width="180" align="center" fixed="right">
          <template #default="scope">
            <el-button
              v-if="scope.row.isWarning === 1"
              type="danger"
              size="small"
              icon="ShoppingCart"
              @click="handlePurchase(scope.row)"
            >紧急向供应商采购</el-button>
            <el-button
              v-else
              type="info"
              size="small"
              plain
              disabled
            >无需采购</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { DataLine, ShoppingCart, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const tableData = ref([])
const loading = ref(false)

// 1. 去后端拉取智能分析后的库存数据
const fetchInventory = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/admin/center/inventoryAlerts')
    if (res.data.code === 200) {
      tableData.value = res.data.data
    }
  } catch (error) {
    ElMessage.error('大屏数据加载失败，请检查网络')
  } finally {
    loading.value = false
  }
}

// 2. 高亮变红的底层逻辑 (Element Plus 的行样式)
const tableRowClassName = ({ row }) => {
  if (row.isWarning === 1) {
    return 'warning-row' // 缺货的行，给它加上浅红色的背景
  }
  return ''
}

// 3. 点击采购按钮触发的动作
const handlePurchase = async (row) => {
  // 先让用户输入真实采购数量，默认 100 件
  let quantityInput
  try {
    const { value } = await ElMessageBox.prompt(
      `请输入本次向供应商采购【${row.productName}】的数量（件）：`,
      '📦 填写采购数量',
      {
        confirmButtonText: '下一步确认',
        cancelButtonText: '取消',
        inputPattern: /^[1-9]\d*$/,
        inputErrorMessage: '数量必须是大于 0 的整数',
        inputValue: '100'
      }
    )
    quantityInput = parseInt(value)
  } catch {
    return // 用户取消
  }

  try {
    await ElMessageBox.confirm(
      `确认向供应商采购 ${quantityInput} 件【${row.productName}】吗？总预算约为 ¥ ${(row.unitPrice * quantityInput).toFixed(2)}`,
      '✅ 最终确认采购',
      { confirmButtonText: '确定下单', cancelButtonText: '返回修改', type: 'warning' }
    )
  } catch {
    return // 用户取消
  }

  // 获取当前登录的主管 ID
  const adminId = localStorage.getItem('currentUserId')
  try {
    const res = await axios.post('http://localhost:8080/admin/center/createPurchase', {
      productId: row.productId,
      unitPrice: row.unitPrice,
      quantity: quantityInput,  // ✅ 传入真实数量
      adminId: adminId
    })
    if (res.data.code === 200) {
      ElMessage.success(res.data.msg)
      fetchInventory()
    } else {
      ElMessage.error(res.data.msg || '采购指令下达失败')
    }
  } catch (error) {
    ElMessage.error('采购指令下达失败，请检查网络')
  }
}
onMounted(() => {
  fetchInventory()
})
</script>

<style scoped>
.app-container { height: 100%; }
.box-card { min-height: 100%; }
/* 给缺货报警的行加一个醒目的浅红底色 */
:deep(.warning-row) {
  background-color: #fef0f0 !important;
}
</style>