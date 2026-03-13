<template>
  <div class="center-warehouse-workspace">
    <el-tabs v-model="activeTab" type="border-card" class="main-tabs">

      <!-- ===================== TAB 1：购货入库 ===================== -->
      <el-tab-pane label="📥 购货入库" name="inbound">
        <el-card shadow="never">
          <template #header>
            <span class="panel-title">待入库采购单</span>
            <el-form :inline="true" size="small" style="margin-left:auto">
              <el-form-item label="入库状态">
                <el-select v-model="inboundFilter.status" clearable placeholder="全部" style="width:120px">
                  <el-option label="待入库（在途）" :value="2" />
                  <el-option label="已入库" :value="3" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" size="small" @click="loadPurchases" :loading="purchases.loading">查询</el-button>
              </el-form-item>
            </el-form>
          </template>
          
          <el-table :data="purchases.list" border stripe size="small" max-height="350" v-loading="purchases.loading">
            <el-table-column prop="purchase_no" label="采购单号" min-width="160" />
            <el-table-column prop="supplier_name" label="供应商" min-width="150" show-overflow-tooltip />
            <el-table-column prop="purchase_date" label="采购日期" width="150" />
            <el-table-column label="状态" width="95" align="center">
              <template #default="s">
                <el-tag size="small"
                  :type="s.row.status === 3 ? 'success' : s.row.status === 2 ? 'warning' : 'info'">
                  {{ s.row.status === 3 ? '已入库' : s.row.status === 2 ? '在途待入库' : '待发货' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="总金额" width="100" align="right">
              <template #default="s">¥{{ fmt(s.row.total_amount) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center" fixed="right">
              <template #default="s">
                <el-button size="small" type="primary" v-if="s.row.status === 2" @click="openInboundDialog(s.row)">入库核对</el-button>
                <el-button size="small" type="info" v-else @click="openInboundDialog(s.row)">查看明细</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 入库核对弹窗 -->
        <el-dialog v-model="inboundDialog.visible" :title="inboundDialog.isView ? '📦 采购入库明细' : '📦 购货入库核对'" width="750px">
          <el-descriptions border :column="2" size="small" style="margin-bottom:12px">
            <el-descriptions-item label="采购单号">{{ inboundDialog.order?.purchase_no }}</el-descriptions-item>
            <el-descriptions-item label="供应商">{{ inboundDialog.order?.supplier_name }}</el-descriptions-item>
          </el-descriptions>
          
          <el-table :data="inboundDialog.items" border size="small" v-loading="inboundDialog.loading">
            <el-table-column prop="product_name" label="商品名称" min-width="150" />
            <el-table-column prop="purchase_quantity" label="订购数量" width="90" align="center" />
            <el-table-column label="实际到货数量" width="130" align="center">
              <template #default="s">
                <el-input-number v-if="!inboundDialog.isView" v-model="s.row.actual_quantity" :min="0" :max="9999" size="small" style="width:100px" />
                <span v-else>{{ s.row.actual_quantity }}</span>
              </template>
            </el-table-column>
            <el-table-column label="单价" width="80" align="right">
              <template #default="s">¥{{ fmt(s.row.unit_price) }}</template>
            </el-table-column>
            <el-table-column label="金额小计" width="90" align="right">
              <template #default="s">¥{{ fmt(s.row.amount) }}</template>
            </el-table-column>
          </el-table>

          <el-form v-if="!inboundDialog.isView" size="small" style="margin-top:16px" label-width="80px">
            <el-form-item label="入库备注">
              <el-input v-model="inboundDialog.remark" type="textarea" :rows="2" placeholder="默认全部到货。如有破损或少件请在此说明。" />
            </el-form-item>
          </el-form>

          <template #footer>
            <el-button @click="inboundDialog.visible = false">关 闭</el-button>
            <el-button v-if="!inboundDialog.isView" type="success" :loading="inboundDialog.submitting" @click="submitInbound">✅ 确认入库</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>

      <!-- ===================== TAB 2：调拨出库 ===================== -->
      <el-tab-pane label="📤 调拨出库" name="outbound">
        <el-card shadow="never">
          <template #header>
            <span class="panel-title">待发货调拨单（调度中心下发）</span>
            <el-form :inline="true" size="small" style="margin-left:auto">
              <el-form-item label="发货日期">
                <el-date-picker v-model="transferFilter.dateRange" type="daterange"
                  start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width:220px" />
              </el-form-item>
              <el-form-item label="调拨单号">
                <el-input v-model="transferFilter.transferNo" placeholder="单号模糊查" clearable style="width:140px"/>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" size="small" @click="loadTransfers" :loading="transfers.loading">查询</el-button>
              </el-form-item>
            </el-form>
          </template>

          <el-table :data="transfers.list" border stripe size="small" max-height="350" v-loading="transfers.loading">
            <el-table-column prop="transferNo" label="调拨单号" min-width="160" />
            <el-table-column prop="customerOrderNo" label="关联主订单" min-width="160" />
            <el-table-column prop="stationName" label="目的分站" width="120" />
            <el-table-column prop="receiveAddress" label="客户地址(参考)" min-width="160" show-overflow-tooltip />
            <el-table-column prop="createTime" label="下发时间" width="140" />
            <el-table-column label="操作" width="100" align="center" fixed="right">
              <template #default="s">
                <el-button size="small" type="warning" @click="openOutboundDialog(s.row)">🚀 出库发货</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 出库操作弹窗 -->
        <el-dialog v-model="outboundDialog.visible" title="🚀 调拨出库确认" width="600px">
          <el-alert title="注意：出库操作将扣减中心库房库存，并自动生成【验货单】给分站！" type="warning" show-icon style="margin-bottom:12px"/>
          <el-descriptions border :column="2" size="small" style="margin-bottom:12px">
            <el-descriptions-item label="调拨单号">{{ outboundDialog.order?.transferNo }}</el-descriptions-item>
            <el-descriptions-item label="目的分站">
              <el-tag type="info">{{ outboundDialog.order?.stationName }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
          <el-table :data="outboundDialog.items" border size="small" v-loading="outboundDialog.loading">
            <el-table-column prop="product_name" label="出库商品名称" min-width="150" />
            <el-table-column prop="quantity" label="应出库数量" width="100" align="center">
              <template #default="s">
                <strong style="color:#f56c6c;font-size:15px">{{ s.row.quantity }}</strong>
              </template>
            </el-table-column>
          </el-table>
          <template #footer>
            <el-button @click="outboundDialog.visible = false">取 消</el-button>
            <el-button type="danger" :loading="outboundDialog.submitting" @click="submitOutbound">确认出库并发车</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>

      <!-- ===================== TAB 3：单据打印 (聚合) ===================== -->
      <el-tab-pane label="🖨 单据查询与打印" name="print">
        <el-card shadow="never">
          <template #header>
            <span class="panel-title">已出库商品日报明细与验货单</span>
          </template>

          <el-form :inline="true" size="small" style="background:#f5f7fa;padding:12px;border-radius:4px;margin-bottom:12px">
             <el-form-item label="单据类型" required>
                <el-radio-group v-model="printFilter.type" @change="loadPrintData">
                  <el-radio-button label="outbound">总出库单 (按天)</el-radio-button>
                  <el-radio-button label="inspection">分站验货单 (按天+分站)</el-radio-button>
                </el-radio-group>
             </el-form-item>
             <el-form-item label="日期">
                <el-date-picker v-model="printFilter.date" type="date" placeholder="选择某天" value-format="YYYY-MM-DD" style="width:140px"/>
             </el-form-item>
             <el-form-item label="分站" v-if="printFilter.type === 'inspection'">
                <el-select v-model="printFilter.stationId" placeholder="不限" clearable style="width:120px">
                  <el-option v-for="s in stationOptions" :key="s.id" :label="s.stationName" :value="s.id" />
                </el-select>
             </el-form-item>
             <el-form-item label="商品名称">
                <el-input v-model="printFilter.productName" placeholder="模糊搜" clearable style="width:120px"/>
             </el-form-item>
             <el-form-item>
                <el-button type="primary" @click="loadPrintData" :loading="printData.loading">查询</el-button>
                <el-button type="success" plain @click="doPrint" :disabled="printData.list.length===0">🖨 打印本页单据</el-button>
             </el-form-item>
          </el-form>

          <!-- 用于打印的隐藏区域或直接当场展示区域 -->
          <div id="print-area" class="print-container">
            <h2 class="print-title">
              {{ printFilter.type === 'outbound' ? '中心库房汇总出库单' : '发往分站商品验货单' }}
            </h2>
            <p class="print-subtitle">日期：{{ printFilter.date || '全部' }} &nbsp;&nbsp; 打印时间：{{ new Date().toLocaleString() }}</p>
            
            <table class="print-table" v-if="printData.list.length > 0">
              <thead>
                <tr>
                  <th v-if="printFilter.type === 'outbound'">出库日期</th>
                  <th v-if="printFilter.type === 'inspection'">发往分站</th>
                  <th>商品名称</th>
                  <th>总发货数量件(件)</th>
                  <th>验收确认(打勾)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in printData.list" :key="idx">
                  <td v-if="printFilter.type === 'outbound'">{{ row.outDate }}</td>
                  <td v-if="printFilter.type === 'inspection'">{{ row.stationName }}</td>
                  <td>{{ row.product_name }}</td>
                  <td align="center"><strong>{{ row.totalQty }}</strong></td>
                  <td align="center">________</td>
                </tr>
              </tbody>
            </table>
            <el-empty v-else description="暂无该条件下的商品发出记录" />
            
            <div class="print-footer" v-if="printData.list.length > 0">
              <span v-if="printFilter.type === 'outbound'">库房主管签字：___________</span>
              <span v-else>送货司机签字：___________ &nbsp;&nbsp; 分站接收人签字：___________</span>
            </div>
          </div>
        </el-card>

      </el-tab-pane>

    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const BASE = 'http://localhost:8080/admin/center-warehouse'

// 获取当前管理员ID (模拟)
const adminId = ref(parseInt(localStorage.getItem('currentUserId')) || 1)
const activeTab = ref('inbound')
const fmt = (v) => Number(v || 0).toFixed(2)

// ================= TAB 1: 购货入库 =================
// status: 2 = 在途待入库（供应商已发货），3 = 已入库（中心库房已收货）
const inboundFilter = reactive({ status: 2 })
const purchases = reactive({ list: [], loading: false })
const inboundDialog = reactive({ visible: false, isView: false, order: null, items: [], loading: false, submitting: false, remark: '' })

const loadPurchases = async () => {
  purchases.loading = true
  try {
    const res = await axios.get(`${BASE}/purchase-orders`, { params: { status: inboundFilter.status || undefined } })
    if (res.data.code === 200) purchases.list = res.data.data || []
  } finally { purchases.loading = false }
}

const openInboundDialog = async (row) => {
  inboundDialog.order = row
  inboundDialog.isView = row.status === 3 // 已入库只看，status=3 表示已完成入库
  inboundDialog.remark = ''
  inboundDialog.visible = true
  inboundDialog.loading = true
  try {
    const res = await axios.get(`${BASE}/purchase-items`, { params: { purchaseId: row.id } })
    if (res.data.code === 200) {
      inboundDialog.items = res.data.data || []
      if (!inboundDialog.isView) {
        // 默认实际到货=订购数量
        inboundDialog.items.forEach(i => i.actual_quantity = i.purchase_quantity)
      }
    }
  } finally { inboundDialog.loading = false }
}

const submitInbound = async () => {
  await ElMessageBox.confirm('确认提交入库？库存将立刻累加。', '提示', { type: 'warning' })
  inboundDialog.submitting = true
  try {
    const res = await axios.post(`${BASE}/purchase-inbound`, {
      purchaseId: inboundDialog.order.id,
      adminId: adminId.value,
      remark: inboundDialog.remark,
      items: inboundDialog.items
    })
    if (res.data.code === 200) {
      ElMessage.success('入库成功！')
      inboundDialog.visible = false
      loadPurchases()
    } else ElMessage.error(res.data.msg)
  } catch { ElMessage.error('入库失败') }
  finally { inboundDialog.submitting = false }
}

// ================= TAB 2: 调拨出库 =================
const transferFilter = reactive({ transferNo: '', orderNo: '', dateRange: null })
const transfers = reactive({ list: [], loading: false })
const outboundDialog = reactive({ visible: false, order: null, items: [], loading: false, submitting: false })

const loadTransfers = async () => {
  transfers.loading = true
  try {
    const res = await axios.get(`${BASE}/pending-transfers`, {
      params: {
        transferNo: transferFilter.transferNo || undefined,
        orderNo: transferFilter.orderNo || undefined,
        dateStart: transferFilter.dateRange?.[0] || undefined,
        dateEnd: transferFilter.dateRange?.[1] || undefined
      }
    })
    if (res.data.code === 200) transfers.list = res.data.data || []
  } finally { transfers.loading = false }
}

const openOutboundDialog = async (row) => {
  outboundDialog.order = row
  outboundDialog.visible = true
  outboundDialog.loading = true
  try {
    const res = await axios.get(`${BASE}/transfer-items`, { params: { transferId: row.id } })
    if (res.data.code === 200) outboundDialog.items = res.data.data || []
  } finally { outboundDialog.loading = false }
}

const submitOutbound = async () => {
  outboundDialog.submitting = true
  try {
    const res = await axios.post(`${BASE}/execute-outbound`, {
      transferId: outboundDialog.order.id,
      adminId: adminId.value,
      stationId: outboundDialog.order.stationId
    })
    if (res.data.code === 200) {
      ElMessage.success('出库成功，验货单已生成！')
      outboundDialog.visible = false
      loadTransfers()
    } else ElMessage.error(res.data.msg)
  } catch { ElMessage.error('出库失败，可能库存不足！') }
  finally { outboundDialog.submitting = false }
}

// ================= TAB 3: 单据打印 =================
const stationOptions = ref([])
const printFilter = reactive({ type: 'outbound', date: new Date().toISOString().split('T')[0], stationId: null, productName: '' })
const printData = reactive({ list: [], loading: false })

const loadPrintData = async () => {
  printData.loading = true
  try {
    const url = printFilter.type === 'outbound' ? '/outbound-print-data' : '/inspection-print-data'
    const res = await axios.get(BASE + url, {
      params: {
        dateVal: printFilter.date || undefined,
        stationId: printFilter.type === 'inspection' ? printFilter.stationId : undefined,
        productName: printFilter.productName || undefined
      }
    })
    if (res.data.code === 200) printData.list = res.data.data || []
  } finally { printData.loading = false }
}

const loadStations = async () => {
  try {
    const res = await axios.get(`${BASE}/all-stations`)
    if (res.data.code === 200) stationOptions.value = res.data.data || []
  } catch {}
}

const doPrint = () => {
  const content = document.getElementById('print-area').innerHTML
  const w = window.open('', '', 'width=800,height=800')
  w.document.write(`
    <html><head><title>中心库房实体单据</title>
    <style>
      body{font-family:SimSun,serif;padding:20px;color:#000}
      .print-title{text-align:center;margin-bottom:4px;font-size:22px}
      .print-subtitle{text-align:center;color:#666;font-size:13px;margin-bottom:16px}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      th,td{border:1px solid #333;padding:8px 10px;font-size:14px}
      th{background:#f0f0f0;}
      .print-footer{display:flex;justify-content:space-between;margin-top:40px;padding-top:10px;font-size:15px;font-weight:bold}
    </style>
    </head><body>${content}</body></html>`)
  w.document.close()
  w.onload = () => { w.print(); w.close() }
}

// ================= 初始化 =================
onMounted(() => {
  loadPurchases()
  loadTransfers()
  loadStations()
  loadPrintData()
})
</script>

<style scoped>
.center-warehouse-workspace { padding: 10px; }
.main-tabs { min-height: 520px; }
.panel-title { font-weight: 600; font-size: 14px; }
:deep(.el-card__header) {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; background: #f5f7fa; flex-wrap: wrap;
}

/* 本页内置的一点打印样式预览，方便不点击打印也能看 */
.print-container {
  margin-top: 10px;
  padding: 20px;
  border: 1px solid #ebeef5;
  background: white;
  min-height: 300px;
}
.print-title { text-align: center; margin: 0 0 8px 0; font-size: 20px; }
.print-subtitle { text-align: center; color: #909399; font-size: 13px; margin-bottom: 20px; }
.print-table {
  width: 100%;
  border-collapse: collapse;
}
.print-table th, .print-table td {
  border: 1px solid #dcdfe6;
  padding: 8px 12px;
  font-size: 14px;
}
.print-table th { background: #f5f7fa; text-align: left; }
.print-footer { margin-top: 30px; display: flex; justify-content: space-between; font-weight: bold; }
</style>
