<template>
  <div class="app-container">
    <el-card shadow="never" class="box-card" style="border-radius: 8px;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 900; font-size: 20px; color: #303133;">
            <el-icon><Money /></el-icon> 财务结算与资金分配中心 (总账本)
          </span>
          <el-button type="primary" plain icon="Refresh" @click="refreshCurrentTab">刷新账本</el-button>
        </div>
      </template>

      <el-tabs v-model="activeTab" type="border-card" @tab-click="handleTabClick">
        
        <el-tab-pane label="🏭 对外付款 (供应商结算)" name="supplier">
          <el-alert title="【对外打款】核对大仓入库货品，向供应商打款并录入增值税发票。" type="error" show-icon style="margin-bottom: 20px;" />
          <el-table :data="supplierData" border stripe style="width: 100%" v-loading="loading">
            <el-table-column prop="purchaseNo" label="关联采购单号" width="220" align="center" />
            <el-table-column prop="supplierName" label="收款方 (供应商)" min-width="180" align="center" />
            <el-table-column label="应付账款 (元)" width="180" align="center">
              <template #default="scope">
                <span style="color: #F56C6C; font-weight: 900; font-size: 16px;">¥ {{ scope.row.totalAmount }}</span>
              </template>
            </el-table-column>
            <el-table-column label="财务操作" width="200" align="center" fixed="right">
              <template #default="scope">
                <el-button type="danger" icon="CreditCard" @click="openInvoiceDialog(scope.row)">
                  核对无误，打款并录发票
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="🤝 对内分账 (分站与中心库房结算)" name="internal">
          <el-alert title="【内部分润】以下为客户已妥投签收的订单。执行结算后，系统将自动计提 20% 配送费给分站，并将主订单永久封账归档。" type="success" show-icon style="margin-bottom: 20px;" />
          <el-table :data="internalData" border stripe style="width: 100%" v-loading="loading">
            <el-table-column prop="orderNo" label="客户主订单号" width="220" align="center">
              <template #default="scope">
                <el-tag type="success" size="large">{{ scope.row.orderNo }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="taskNo" label="关联分站任务单" width="200" align="center" />
            <el-table-column prop="finishTime" label="客户签收时间" min-width="180" align="center" />
            <el-table-column label="客户已付总额 (元)" width="180" align="center">
              <template #default="scope">
                <span style="color: #67C23A; font-weight: bold; font-size: 16px;">¥ {{ scope.row.totalAmount }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" align="center" fixed="right">
              <template #default="scope">
                <el-button type="success" icon="Wallet" @click="handleInternalSettle(scope.row)">
                  执行分站结算并封账
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

      </el-tabs>
    </el-card>

    <el-dialog v-model="dialogVisible" title="🧾 录入增值税发票并执行打款" width="500px">
      <el-form label-width="120px">
        <el-form-item label="发票代码/号码" required>
          <el-input v-model="invoiceForm.invoiceNo" placeholder="请输入厂家开具的真实发票号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="danger" @click="submitSettlement">确认打款并归档</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Money, CreditCard, Wallet, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const activeTab = ref('internal') // 默认打开对内分账
const supplierData = ref([])
const internalData = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const currentOrder = ref({})
const invoiceForm = ref({ invoiceNo: '' })

const refreshCurrentTab = () => {
  if (activeTab.value === 'supplier') fetchSupplier()
  else fetchInternal()
}

const handleTabClick = () => {
  refreshCurrentTab()
}

// === 1. 对外打款逻辑 (你原有的) ===
const fetchSupplier = async () => {
  loading.value = true
  const res = await axios.get('http://localhost:8080/admin/finance/pendingSupplier')
  supplierData.value = res.data.data
  loading.value = false
}

const openInvoiceDialog = (row) => {
  currentOrder.value = row
  invoiceForm.value.invoiceNo = 'FP' + Math.floor(Math.random() * 100000000)
  dialogVisible.value = true
}

const submitSettlement = async () => {
  const adminId = parseInt(localStorage.getItem('currentUserId')) || 1
  const res = await axios.post('http://localhost:8080/admin/finance/settleSupplier', {
    orderId: currentOrder.value.orderId, invoiceNo: invoiceForm.value.invoiceNo,
    amount: currentOrder.value.totalAmount, adminId: adminId
  })
  if (res.data.code === 200) {
    ElMessage.success(res.data.msg)
    dialogVisible.value = false
    fetchSupplier()
  }
}

// === 2. 对内结算分润逻辑 (新增终极绝杀) ===
const fetchInternal = async () => {
  loading.value = true
  const res = await axios.get('http://localhost:8080/admin/finance/pendingInternal')
  internalData.value = res.data.data
  loading.value = false
}

const handleInternalSettle = (row) => {
  ElMessageBox.confirm(
    `系统将按 20% 比例给分站计提服务费，并将总订单 [${row.orderNo}] 彻底封账。此操作不可逆，确认执行吗？`,
    '💸 内部结算确认',
    { confirmButtonText: '执行分润并封账', cancelButtonText: '取消', type: 'success' }
  ).then(async () => {
    const res = await axios.post(`http://localhost:8080/admin/finance/settleInternal?orderId=${row.orderId}&totalAmount=${row.totalAmount}`)
    if (res.data.code === 200) {
      ElMessage.success(res.data.msg)
      fetchInternal() // 结算完成，单据从大屏消失
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchInternal() // 默认拉取内部对账单
})
</script>