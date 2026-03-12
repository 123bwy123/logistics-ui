<template>
  <div class="station-workspace">
    <el-tabs v-model="activeTab" type="border-card" class="main-tabs">

      <!-- ===================== TAB 1：任务分配 ===================== -->
      <el-tab-pane label="📋 任务分配" name="assign">
        <el-card shadow="never">
          <template #header>
            <span class="panel-title">待分配任务单（分站ID：{{ stationId }}）</span>
            <el-form :inline="true" size="small" style="margin-left:auto">
              <el-form-item label="任务类型">
                <el-select v-model="filter.taskType" clearable placeholder="全部" style="width:110px">
                  <el-option label="送货收款" :value="1" />
                  <el-option label="送货" :value="2" />
                  <el-option label="退货" :value="3" />
                  <el-option label="换货" :value="4" />
                </el-select>
              </el-form-item>
              <el-form-item label="日期">
                <el-date-picker v-model="filter.dateRange" type="daterange"
                  start-placeholder="开始" end-placeholder="结束"
                  value-format="YYYY-MM-DD" style="width:220px" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" size="small" @click="loadPending" :loading="pending.loading">查询</el-button>
                <el-button size="small" @click="clearFilter">重置</el-button>
              </el-form-item>
            </el-form>
          </template>
          <el-table :data="pending.list" border stripe size="small" max-height="380"
            v-loading="pending.loading">
            <el-table-column prop="task_no" label="任务单号" min-width="180" />
            <el-table-column label="类型" width="80" align="center">
              <template #default="s">
                <el-tag size="small" :type="taskTypeColor(s.row.task_type)">{{ taskTypeLabel(s.row.task_type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="customer_name" label="客户" width="80" />
            <el-table-column prop="mobile" label="手机" width="120" />
            <el-table-column prop="receive_address" label="收货地址" min-width="160" show-overflow-tooltip />
            <el-table-column prop="total_amount" label="货款" width="90" align="right">
              <template #default="s">¥{{ fmt(s.row.total_amount) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="s">
                <el-button size="small" type="primary" @click="openAssignDialog(s.row)">分配</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 分配弹窗 -->
        <el-dialog v-model="assignDialog.visible" title="🚗 分配配送员" width="420px">
          <el-form label-width="80px" size="small">
            <el-form-item label="任务单">
              <el-input :model-value="assignDialog.task?.task_no" disabled />
            </el-form-item>
            <el-form-item label="客户">
              <el-input :model-value="(assignDialog.task?.customer_name || '') + ' ' + (assignDialog.task?.mobile || '')" disabled />
            </el-form-item>
            <el-form-item label="配送员" required>
              <el-select v-model="assignDialog.courierId" placeholder="请选择配送员" style="width:100%">
                <el-option v-for="c in couriers" :key="c.id" :label="c.realName" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="assignDialog.visible = false">取消</el-button>
            <el-button type="primary" :loading="assignDialog.submitting" @click="submitAssign">确认分配</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>

      <!-- ===================== TAB 2：打印签收单 ===================== -->
      <el-tab-pane label="🖨 打印签收单" name="print">
        <el-card shadow="never">
          <template #header>
            <span class="panel-title">已分配任务单（已派送，可打印）</span>
            <el-button size="small" type="primary" plain @click="loadAssigned" :loading="assigned.loading">刷新</el-button>
          </template>
          <el-table :data="assigned.list" border stripe size="small" max-height="380"
            v-loading="assigned.loading">
            <el-table-column prop="task_no" label="任务单号" min-width="170" />
            <el-table-column prop="customer_name" label="客户" width="80" />
            <el-table-column prop="mobile" label="手机" width="120" />
            <el-table-column prop="courier_name" label="配送员" width="90" />
            <el-table-column prop="receive_address" label="收货地址" min-width="150" show-overflow-tooltip />
            <el-table-column prop="total_amount" label="货款" width="90" align="right">
              <template #default="s">¥{{ fmt(s.row.total_amount) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="s">
                <el-button size="small" type="warning" @click="openPrintDialog(s.row)">🖨 打印</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 打印预览弹窗 -->
        <el-dialog v-model="printDialog.visible" title="📄 签收单预览" width="600px">
          <div id="print-area" class="print-area" v-if="printDialog.data">
            <div class="print-header">
              <h2>📦 物流配送签收单</h2>
              <p>打印时间：{{ new Date().toLocaleString('zh-CN') }}</p>
            </div>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="任务单号">{{ printDialog.data.task_no }}</el-descriptions-item>
              <el-descriptions-item label="关联订单">{{ printDialog.data.order_no }}</el-descriptions-item>
              <el-descriptions-item label="客户姓名">{{ printDialog.data.customer_name }}</el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ printDialog.data.mobile }}</el-descriptions-item>
              <el-descriptions-item label="收货地址" :span="2">{{ printDialog.data.receive_address }}</el-descriptions-item>
              <el-descriptions-item label="配送员">{{ printDialog.data.courier_name }}</el-descriptions-item>
              <el-descriptions-item label="要求到达日期">{{ printDialog.data.require_date }}</el-descriptions-item>
            </el-descriptions>
            <h4 style="margin:12px 0 6px">📋 商品清单：</h4>
            <el-table :data="printDialog.items" border size="small">
              <el-table-column prop="product_name" label="商品名称" />
              <el-table-column prop="quantity" label="数量" width="70" align="center" />
              <el-table-column label="单价" width="90" align="right">
                <template #default="s">¥{{ fmt(s.row.unit_price) }}</template>
              </el-table-column>
              <el-table-column label="小计" width="90" align="right">
                <template #default="s">¥{{ fmt(s.row.amount) }}</template>
              </el-table-column>
            </el-table>
            <div class="print-footer">
              <div>应收货款合计：<strong style="color:#e6a23c;font-size:16px">¥{{ fmt(printDialog.data.total_amount) }}</strong></div>
              <div class="sign-area">
                <span>客户签字：________________</span>
                <span>送达时间：________________</span>
              </div>
            </div>
          </div>
          <template #footer>
            <el-button @click="printDialog.visible = false">关闭</el-button>
            <el-button type="primary" @click="doPrint">🖨 打印</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>

      <!-- ===================== TAB 3：回执录入结单 ===================== -->
      <el-tab-pane label="✅ 回执录入" name="receipt">
        <el-card shadow="never">
          <template #header>
            <span class="panel-title">待结单任务（已派送，等待回执）</span>
            <el-button size="small" type="primary" plain @click="loadAssigned2" :loading="receipt.loading">刷新</el-button>
          </template>
          <el-table :data="receipt.list" border stripe size="small" max-height="380"
            v-loading="receipt.loading">
            <el-table-column prop="task_no" label="任务单号" min-width="170" />
            <el-table-column prop="customer_name" label="客户" width="80" />
            <el-table-column prop="mobile" label="手机" width="120" />
            <el-table-column prop="courier_name" label="配送员" width="90" />
            <el-table-column prop="receive_address" label="收货地址" min-width="150" show-overflow-tooltip />
            <el-table-column prop="total_amount" label="应收" width="90" align="right">
              <template #default="s">¥{{ fmt(s.row.total_amount) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center">
              <template #default="s">
                <el-button size="small" type="success" @click="openReceiptDialog(s.row)">📝 回执录入</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 回执录入弹窗 -->
        <el-dialog v-model="receiptDialog.visible" title="📝 回执录入 / 结单" width="480px">
          <el-form ref="receiptFormRef" :model="receiptDialog.form" label-width="90px" size="small">
            <el-form-item label="任务单">
              <el-input :model-value="receiptDialog.task?.task_no" disabled />
            </el-form-item>
            <el-form-item label="客户"><el-input :model-value="receiptDialog.task?.customer_name" disabled /></el-form-item>
            <el-form-item label="应收金额"><el-input :model-value="'¥' + fmt(receiptDialog.task?.total_amount)" disabled /></el-form-item>
            <el-form-item label="完成状态" required>
              <el-radio-group v-model="receiptDialog.form.completeStatus">
                <el-radio :value="3" border>✅ 全部完成</el-radio>
                <el-radio :value="4" border>⚡ 部分完成</el-radio>
                <el-radio :value="5" border>❌ 失败/拒收</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="实收金额" required>
              <el-input-number v-model="receiptDialog.form.actualAmount"
                :min="0" :precision="2" :step="0.01" style="width:200px" />
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="receiptDialog.form.remark" type="textarea" :rows="2" placeholder="如：部分商品客户拒收，已带回3件..." />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="receiptDialog.visible = false">取消</el-button>
            <el-button type="primary" :loading="receiptDialog.submitting" @click="submitReceipt">确认结单</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>

      <!-- ===================== TAB 4：缴款统计 ===================== -->
      <el-tab-pane label="💰 缴款统计" name="payment">
        <el-card shadow="never">
          <template #header>
            <span class="panel-title">缴款对账统计</span>
            <el-form :inline="true" size="small" style="margin-left:auto">
              <el-form-item label="日期范围">
                <el-date-picker v-model="payFilter.dateRange" type="daterange"
                  start-placeholder="开始" end-placeholder="结束"
                  value-format="YYYY-MM-DD" style="width:220px" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" size="small" @click="loadPaymentStats" :loading="payment.loading">查询</el-button>
              </el-form-item>
            </el-form>
          </template>

          <!-- 汇总卡片 -->
          <div class="summary-cards" v-if="payment.summary">
            <el-card class="summary-card delivered">
              <div class="card-title">送达总量</div>
              <div class="card-value">{{ payment.summary.totalDelivered }}</div>
            </el-card>
            <el-card class="summary-card amount">
              <div class="card-title">实收总金额</div>
              <div class="card-value">¥{{ fmt(payment.summary.totalReceived) }}</div>
            </el-card>
            <el-card class="summary-card failed">
              <div class="card-title">失败/拒收</div>
              <div class="card-value">{{ payment.summary.totalFailed }}</div>
            </el-card>
            <el-card class="summary-card refund">
              <div class="card-title">退款总金额</div>
              <div class="card-value">¥{{ fmt(payment.summary.totalRefund) }}</div>
            </el-card>
          </div>

          <el-table :data="payment.details" border stripe size="small" max-height="300"
            v-loading="payment.loading" style="margin-top:12px">
            <el-table-column prop="settle_date" label="结算日期" width="120" />
            <el-table-column prop="delivered_count" label="送达数量" width="90" align="center" />
            <el-table-column label="实收金额" width="110" align="right">
              <template #default="s">¥{{ fmt(s.row.total_received) }}</template>
            </el-table-column>
            <el-table-column prop="failed_count" label="失败数量" width="90" align="center" />
            <el-table-column label="退款金额" width="110" align="right">
              <template #default="s">¥{{ fmt(s.row.total_refund) }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const BASE = 'http://localhost:8080'

// 当前登录分站ID（从 localStorage 读取，实际登录逻辑存储）
const stationId = ref(parseInt(localStorage.getItem('currentUserId')) || 1)
const activeTab = ref('assign')
const couriers = ref([])

// ============ 工具函数 ============
const fmt = (v) => Number(v || 0).toFixed(2)
const taskTypeLabel = (t) => ({ 1:'送货收款', 2:'送货', 3:'退货', 4:'换货' }[t] ?? `类型${t}`)
const taskTypeColor = (t) => ({ 1:'', 2:'success', 3:'danger', 4:'warning' }[t] ?? 'info')

// ============ TAB 1：任务分配 ============
const filter = reactive({ taskType: null, dateRange: null })
const pending = reactive({ list: [], loading: false })

const clearFilter = () => { filter.taskType = null; filter.dateRange = null; loadPending() }
const loadPending = async () => {
  pending.loading = true
  try {
    const res = await axios.get(`${BASE}/admin/station/pending-tasks`, {
      params: {
        stationId: stationId.value,
        taskType: filter.taskType || undefined,
        dateStart: filter.dateRange?.[0] || undefined,
        dateEnd: filter.dateRange?.[1] || undefined
      }
    })
    if (res.data.code === 200) pending.list = res.data.data || []
    else ElMessage.error(res.data.msg)
  } catch { ElMessage.error('加载失败') }
  finally { pending.loading = false }
}

const assignDialog = reactive({ visible: false, task: null, courierId: null, submitting: false })
const openAssignDialog = (row) => {
  assignDialog.task = row
  assignDialog.courierId = null
  assignDialog.visible = true
}
const submitAssign = async () => {
  if (!assignDialog.courierId) return ElMessage.warning('请选择配送员！')
  assignDialog.submitting = true
  try {
    const res = await axios.post(`${BASE}/admin/station/assign`, {
      taskId: assignDialog.task.id,
      orderId: assignDialog.task.order_id,
      courierId: assignDialog.courierId,
      adminId: stationId.value
    })
    if (res.data.code === 200) {
      ElMessage.success(res.data.data || '分配成功！')
      assignDialog.visible = false
      loadPending()
      loadAssigned()
      loadAssigned2()
    } else { ElMessage.error(res.data.msg) }
  } catch { ElMessage.error('网络错误') }
  finally { assignDialog.submitting = false }
}

// ============ TAB 2：打印签收单 ============
const assigned = reactive({ list: [], loading: false })
const printDialog = reactive({ visible: false, data: null, items: [] })

const loadAssigned = async () => {
  assigned.loading = true
  try {
    const res = await axios.get(`${BASE}/admin/station/assigned-tasks`, {
      params: { stationId: stationId.value }
    })
    if (res.data.code === 200) assigned.list = res.data.data || []
  } catch {}
  finally { assigned.loading = false }
}

const openPrintDialog = async (row) => {
  try {
    const res = await axios.get(`${BASE}/admin/station/print-data`, { params: { taskId: row.id } })
    if (res.data.code === 200) {
      printDialog.data = res.data.data
      printDialog.items = res.data.data.items || []
      printDialog.visible = true
    } else { ElMessage.error(res.data.msg) }
  } catch { ElMessage.error('获取打印数据失败') }
}

const doPrint = () => {
  // 提取打印区域内容并打印
  const content = document.getElementById('print-area').innerHTML
  const w = window.open('', '', 'width=800,height=800')
  w.document.write(`
    <html><head><title>物流签收单</title>
    <style>
      body{font-family:SimSun,serif;padding:20px;color:#000}
      h2{text-align:center;margin-bottom:4px}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      th,td{border:1px solid #999;padding:6px 10px;font-size:13px}
      th{background:#f0f0f0;text-align:center}
      .sign-area{display:flex;justify-content:space-between;margin-top:20px;padding-top:10px;border-top:1px dashed #999}
      .print-footer{margin-top:12px;font-size:14px}
    </style>
    </head><body>${content}</body></html>`)
  w.document.close()
  w.onload = () => { w.print(); w.close() }
}

// ============ TAB 3：回执录入 ============
const receipt = reactive({ list: [], loading: false })
const receiptDialog = reactive({
  visible: false, task: null, submitting: false,
  form: { completeStatus: 3, actualAmount: 0, remark: '' }
})

const loadAssigned2 = async () => {
  receipt.loading = true
  try {
    const res = await axios.get(`${BASE}/admin/station/assigned-tasks`, {
      params: { stationId: stationId.value }
    })
    if (res.data.code === 200) receipt.list = res.data.data || []
  } catch {}
  finally { receipt.loading = false }
}

const openReceiptDialog = (row) => {
  receiptDialog.task = row
  receiptDialog.form = {
    completeStatus: 3,
    actualAmount: Number(row.total_amount || 0),
    remark: ''
  }
  receiptDialog.visible = true
}

const submitReceipt = async () => {
  await ElMessageBox.confirm(
    `确认录入回执？完成状态：${ { 3:'全部完成', 4:'部分完成', 5:'失败/拒收' }[receiptDialog.form.completeStatus] }，实收：¥${receiptDialog.form.actualAmount}`,
    '结单确认', { type: 'warning' })
  receiptDialog.submitting = true
  try {
    const res = await axios.post(`${BASE}/admin/station/receipt`, {
      taskId: receiptDialog.task.id,
      orderId: receiptDialog.task.order_id,
      completeStatus: receiptDialog.form.completeStatus,
      actualAmount: receiptDialog.form.actualAmount,
      remark: receiptDialog.form.remark
    })
    if (res.data.code === 200) {
      ElMessage.success(res.data.data || '结单成功！')
      receiptDialog.visible = false
      loadAssigned2()
    } else { ElMessage.error(res.data.msg) }
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  } finally { receiptDialog.submitting = false }
}

// ============ TAB 4：缴款统计 ============
const payFilter = reactive({ dateRange: null })
const payment = reactive({ loading: false, details: [], summary: null })

const loadPaymentStats = async () => {
  payment.loading = true
  try {
    const res = await axios.get(`${BASE}/admin/station/payment-stats`, {
      params: {
        stationId: stationId.value,
        dateStart: payFilter.dateRange?.[0] || undefined,
        dateEnd: payFilter.dateRange?.[1] || undefined
      }
    })
    if (res.data.code === 200) {
      payment.details = res.data.data.details || []
      payment.summary = res.data.data.summary
    } else { ElMessage.error(res.data.msg) }
  } catch { ElMessage.error('查询失败') }
  finally { payment.loading = false }
}

// ============ 初始化 ============
const loadCouriers = async () => {
  try {
    const res = await axios.get(`${BASE}/admin/station/couriers`)
    if (res.data.code === 200) couriers.value = res.data.data || []
  } catch {}
}

onMounted(() => {
  loadCouriers()
  loadPending()
  loadAssigned()
})
</script>

<style scoped>
.station-workspace { padding: 10px; }
.main-tabs { min-height: 520px; }
.panel-title { font-weight: 600; font-size: 14px; }
:deep(.el-card__header) {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; background: #f5f7fa; flex-wrap: wrap;
}

/* 汇总卡片 */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 4px;
}
.summary-card { border-radius: 8px; text-align: center; padding: 8px; }
.card-title { font-size: 12px; color: #909399; margin-bottom: 4px; }
.card-value { font-size: 22px; font-weight: 700; }
.delivered { border-top: 3px solid #409eff; }
.delivered .card-value { color: #409eff; }
.amount { border-top: 3px solid #67c23a; }
.amount .card-value { color: #67c23a; }
.failed { border-top: 3px solid #f56c6c; }
.failed .card-value { color: #f56c6c; }
.refund { border-top: 3px solid #e6a23c; }
.refund .card-value { color: #e6a23c; }

/* 打印区域 */
.print-area { padding: 10px; }
.print-header { text-align: center; margin-bottom: 12px; }
.print-header h2 { margin: 0; font-size: 20px; }
.print-header p { margin: 4px 0; color: #666; font-size: 12px; }
.print-footer { margin-top: 16px; }
.sign-area {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 12px;
  border-top: 1px dashed #ccc;
  font-size: 13px;
}
</style>