<template>
  <div class="dispatch-workspace">
    <el-tabs v-model="activeTab" type="border-card" class="main-tabs">

      <!-- ===================== TAB 1：手工调度 ===================== -->
      <el-tab-pane label="🖱 手工调度" name="manual">
        <el-card shadow="never">
          <template #header>
            <span class="panel-title">📋 可分配订单列表（状态：可分配）</span>
            <el-button size="small" type="primary" plain @click="loadAssignable" :loading="manual.loading">刷新</el-button>
          </template>
          <el-table :data="manual.orders" border stripe size="small" max-height="350"
            v-loading="manual.loading" @selection-change="(rows) => manual.selected = rows">
            <el-table-column type="selection" width="45" />
            <el-table-column prop="order_no" label="订单号" min-width="180" />
            <el-table-column prop="customer_name" label="客户" width="90" />
            <el-table-column prop="mobile" label="手机" width="120" />
            <el-table-column prop="receive_address" label="收货地址" min-width="160" show-overflow-tooltip />
            <el-table-column prop="total_amount" label="金额" width="90" align="right">
              <template #default="s">¥{{ Number(s.row.total_amount || 0).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="s">
                <el-button size="small" type="primary" @click="openDispatchDialog(s.row)">调度</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 手工调度对话框 -->
        <el-dialog v-model="manual.dialogVisible" title="🚀 手工调度" width="460px">
          <el-form label-width="90px" size="small">
            <el-form-item label="订单号">
              <el-input :model-value="manual.currentOrder?.order_no" disabled />
            </el-form-item>
            <el-form-item label="客户">
              <el-input :model-value="manual.currentOrder?.customer_name + ' ' + (manual.currentOrder?.mobile || '')" disabled />
            </el-form-item>
            <el-form-item label="执行分站" required>
              <el-select v-model="manual.stationAdminId" placeholder="请选择分站管理员" style="width:100%">
                <el-option v-for="s in stationAdmins" :key="s.id" :label="s.realName + ' (' + s.username + ')'" :value="s.id" />
              </el-select>
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="manual.dialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="manual.submitting" @click="submitManualDispatch">确认调度</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>

      <!-- ===================== TAB 2：自动调度 ===================== -->
      <el-tab-pane label="⚡ 自动调度" name="auto">
        <el-card shadow="never">
          <template #header>
            <span class="panel-title">🤖 可自动调度订单（已有调度员记录）</span>
            <el-button size="small" type="primary" plain @click="loadAutoReady" :loading="auto.loading">刷新</el-button>
            <el-button size="small" type="success" :loading="auto.submitting"
              :disabled="!auto.orders.length" @click="submitAutoDispatch" style="margin-left:8px">
              ⚡ 一键全部调度（{{ auto.orders.length }} 单）
            </el-button>
          </template>
          <el-table :data="auto.orders" border stripe size="small" max-height="400" v-loading="auto.loading">
            <el-table-column prop="order_no" label="订单号" min-width="180" />
            <el-table-column prop="customer_name" label="客户" width="90" />
            <el-table-column prop="mobile" label="手机" width="120" />
            <el-table-column prop="receive_address" label="收货地址" min-width="160" show-overflow-tooltip />
            <el-table-column prop="total_amount" label="金额" width="90" align="right">
              <template #default="s">¥{{ Number(s.row.total_amount || 0).toFixed(2) }}</template>
            </el-table-column>
          </el-table>
          <div v-if="auto.result" class="auto-result">
            <el-alert :title="auto.result" type="success" :closable="false" show-icon />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- ===================== TAB 3：缺货处理 ===================== -->
      <el-tab-pane label="📦 缺货处理" name="outofstock">
        <el-card shadow="never">
          <template #header>
            <span class="panel-title">⚠ 缺货订单列表（等待到货）</span>
            <el-button size="small" type="primary" plain @click="loadOutOfStock" :loading="oos.loading">刷新</el-button>
          </template>
          <el-table :data="oos.orders" border stripe size="small" max-height="420" v-loading="oos.loading">
            <el-table-column prop="order_no" label="订单号" min-width="180" />
            <el-table-column prop="customer_name" label="客户" width="90" />
            <el-table-column prop="mobile" label="手机" width="120" />
            <el-table-column prop="receive_address" label="收货地址" min-width="160" show-overflow-tooltip />
            <el-table-column prop="total_amount" label="金额" width="90" align="right">
              <template #default="s">¥{{ Number(s.row.total_amount || 0).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="130" align="center">
              <template #default="s">
                <el-button size="small" type="warning" @click="activateOrder(s.row)"
                  :loading="s.row._activating">✅ 到货确认</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- ===================== TAB 4：任务单查询 ===================== -->
      <el-tab-pane label="📋 任务单查询" name="taskquery">
        <el-card shadow="never">
          <template #header><span class="panel-title">综合查询任务单</span></template>
          <el-form :inline="true" size="small" @submit.prevent="searchTaskOrders">
            <el-form-item label="任务单号"><el-input v-model="query.taskNo" clearable style="width:140px" /></el-form-item>
            <el-form-item label="任务状态">
              <el-select v-model="query.taskStatus" clearable placeholder="全部" style="width:110px">
                <el-option label="未分配" :value="0" />
                <el-option label="派送中" :value="1" />
                <el-option label="待结单" :value="2" />
                <el-option label="已完成" :value="3" />
              </el-select>
            </el-form-item>
            <el-form-item label="客户姓名"><el-input v-model="query.customerName" clearable style="width:110px" /></el-form-item>
            <el-form-item label="手机号"><el-input v-model="query.mobile" clearable style="width:130px" /></el-form-item>
            <el-form-item label="要求完成日期">
              <el-date-picker v-model="query.dateRange" type="daterange" range-separator="→"
                start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width:230px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" native-type="submit" :loading="query.loading">查询</el-button>
              <el-button @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="query.result" border stripe size="small" max-height="380"
            v-loading="query.loading" style="margin-top:8px">
            <el-table-column prop="task_no" label="任务单号" min-width="180" />
            <el-table-column label="状态" width="80" align="center">
              <template #default="s">
                <el-tag :type="taskStatusType(s.row.task_status)" size="small">{{ taskStatusLabel(s.row.task_status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="customer_name" label="客户" width="80" />
            <el-table-column prop="mobile" label="手机" width="120" />
            <el-table-column prop="receive_address" label="收货地址" min-width="150" show-overflow-tooltip />
            <el-table-column prop="order_no" label="关联客户订单" min-width="180" />
            <el-table-column prop="settlement_amount" label="结算金额" width="90" align="right">
              <template #default="s">¥{{ Number(s.row.settlement_amount || 0).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="创建时间" width="150">
              <template #default="s">{{ formatDate(s.row.create_time) }}</template>
            </el-table-column>
          </el-table>
          <div style="padding:8px 0;color:#909399;font-size:12px">共 {{ query.result.length }} 条记录</div>
        </el-card>
      </el-tab-pane>

    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const BASE = 'http://localhost:8080'
const activeTab = ref('manual')
const stationAdmins = ref([])

// ======================== 通用工具 ========================

const taskStatusLabel = (s) => ({ 0:'未分配', 1:'派送中', 2:'待结单', 3:'已完成', 6:'已取消' }[s] ?? `${s}`)
const taskStatusType = (s) => {
  if (s === 3) return 'success'
  if (s === 6) return 'info'
  if (s === 1) return 'warning'
  return ''
}
const formatDate = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleString('zh-CN', { hour12: false })
}

const loadStationAdmins = async () => {
  try {
    const res = await axios.get(`${BASE}/admin/dispatch/station-admins`)
    if (res.data.code === 200) stationAdmins.value = res.data.data || []
  } catch {}
}

// ======================== TAB 1：手工调度 ========================

const manual = reactive({
  orders: [], loading: false, selected: [],
  dialogVisible: false, currentOrder: null,
  stationAdminId: null, submitting: false
})

const loadAssignable = async () => {
  manual.loading = true
  try {
    const res = await axios.get(`${BASE}/admin/dispatch/assignable`)
    if (res.data.code === 200) manual.orders = res.data.data || []
    else ElMessage.error(res.data.msg)
  } catch { ElMessage.error('加载失败') }
  finally { manual.loading = false }
}

const openDispatchDialog = (row) => {
  manual.currentOrder = row
  manual.stationAdminId = null
  manual.dialogVisible = true
}

const submitManualDispatch = async () => {
  if (!manual.stationAdminId) return ElMessage.warning('请选择执行分站！')

  manual.submitting = true
  try {
    const res = await axios.post(`${BASE}/admin/dispatch/manual`, {
      orderId: manual.currentOrder.id,
      stationAdminId: manual.stationAdminId,
      dispatchAdminId: parseInt(localStorage.getItem('currentUserId')) || 0
    })
    if (res.data.code === 200) {
      ElMessage.success(res.data.data || '调度成功！')
      manual.dialogVisible = false
      loadAssignable()
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch { ElMessage.error('网络错误') }
  finally { manual.submitting = false }
}

// ======================== TAB 2：自动调度 ========================

const auto = reactive({ orders: [], loading: false, submitting: false, result: '' })

const loadAutoReady = async () => {
  auto.loading = true
  auto.result = ''
  try {
    const res = await axios.get(`${BASE}/admin/dispatch/auto-ready`)
    if (res.data.code === 200) auto.orders = res.data.data || []
  } catch { ElMessage.error('加载失败') }
  finally { auto.loading = false }
}

const submitAutoDispatch = async () => {
  await ElMessageBox.confirm(
    `确认一键自动调度全部 ${auto.orders.length} 条订单？`,
    '批量确认', { type: 'warning' }
  )
  auto.submitting = true
  try {
    const res = await axios.post(`${BASE}/admin/dispatch/auto`,
      null, { params: { dispatchAdminId: parseInt(localStorage.getItem('currentUserId')) || 0 } })
    if (res.data.code === 200) {
      auto.result = res.data.data
      ElMessage.success('自动调度完成！')
      loadAutoReady()
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  } finally { auto.submitting = false }
}

// ======================== TAB 3：缺货处理 ========================

const oos = reactive({ orders: [], loading: false })

const loadOutOfStock = async () => {
  oos.loading = true
  try {
    const res = await axios.get(`${BASE}/admin/dispatch/out-of-stock`)
    if (res.data.code === 200) oos.orders = res.data.data || []
  } catch { ElMessage.error('加载失败') }
  finally { oos.loading = false }
}

const activateOrder = async (row) => {
  await ElMessageBox.confirm(
    `确认【${row.order_no}】已到货？将进行库存校验并变更为【可分配】状态。`,
    '到货确认', { type: 'warning' }
  )
  row._activating = true
  try {
    const res = await axios.post(`${BASE}/admin/dispatch/activate`, null, { params: { orderId: row.id } })
    if (res.data.code === 200) {
      ElMessage.success(res.data.data || '激活成功！')
      loadOutOfStock()
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  } finally { row._activating = false }
}

// ======================== TAB 4：任务单查询 ========================

const query = reactive({
  taskNo: '', taskStatus: null, customerName: '', mobile: '',
  dateRange: null, loading: false, result: []
})

const searchTaskOrders = async () => {
  query.loading = true
  try {
    const params = {
      taskNo: query.taskNo || undefined,
      taskStatus: query.taskStatus !== null ? query.taskStatus : undefined,
      customerName: query.customerName || undefined,
      mobile: query.mobile || undefined,
      requireDateStart: query.dateRange?.[0] || undefined,
      requireDateEnd: query.dateRange?.[1] || undefined
    }
    const res = await axios.get(`${BASE}/admin/dispatch/task-orders`, { params })
    if (res.data.code === 200) query.result = res.data.data || []
    else ElMessage.error(res.data.msg)
  } catch { ElMessage.error('查询失败') }
  finally { query.loading = false }
}

const resetQuery = () => {
  query.taskNo = ''; query.taskStatus = null; query.customerName = ''
  query.mobile = ''; query.dateRange = null; query.result = []
}

// ======================== 初始化 ========================
onMounted(() => {
  loadStationAdmins()
  loadAssignable()
})
</script>

<style scoped>
.dispatch-workspace { padding: 10px; }
.main-tabs { min-height: 500px; }
.panel-title { font-weight: 600; font-size: 14px; flex: 1; }
.auto-result { margin-top: 12px; }
:deep(.el-card__header) {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; background: #f5f7fa;
}
</style>