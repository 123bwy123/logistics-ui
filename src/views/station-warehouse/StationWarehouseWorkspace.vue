<template>
  <div class="station-warehouse-workspace">
    <h2>分站库房管理员工作台</h2>
    
    <el-tabs v-model="activeTab" class="custom-tabs">
      <!-- ================= 调拨入库 ================= -->
      <el-tab-pane label="调拨入库 (Transfer Stock-in)" name="inbound">
        <el-card class="box-card">
          <div class="toolbar">
            <el-button type="primary" @click="fetchPendingInspections" :loading="loading.inspect">刷新列表</el-button>
          </div>
          
          <el-table :data="inspectionList" style="width: 100%" v-loading="loading.inspect">
            <el-table-column prop="inspectionNo" label="验货单号" width="180" />
            <el-table-column prop="transferNo" label="来源调拨单关联" width="180" />
            <el-table-column prop="customerOrderNo" label="客户主订单号" width="180" />
            <el-table-column prop="productName" label="商品名称" />
            <el-table-column prop="expectedQty" label="应入库数量" width="120">
              <template #default="scope">
                <el-tag type="info">{{ scope.row.expectedQty }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="生成时间" width="180">
              <template #default="scope">
                {{ formatDate(scope.row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="scope">
                <el-button type="success" size="small" @click="openInboundDialog(scope.row)">入库</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- ================= 配送员领货 ================= -->
      <el-tab-pane label="配送员领货 (Courier Pickup)" name="pickup">
        <el-card class="box-card">
          <div class="toolbar" style="display: flex; gap: 15px; margin-bottom: 20px;">
            <el-input 
              v-model="searchTaskNo" 
              placeholder="请输入任务单号精确查询" 
              style="width: 300px" 
              clearable 
              @keyup.enter="fetchPendingPickups"
            />
            <el-button type="primary" @click="fetchPendingPickups" :loading="loading.pickup">查询</el-button>
          </div>
          
          <el-table :data="pickupList" style="width: 100%" v-loading="loading.pickup">
            <el-table-column prop="taskNo" label="配送任务单号" width="200" />
            <el-table-column prop="customerOrderNo" label="关联主订单号" width="200" />
            <el-table-column prop="productName" label="商品明细" />
            <el-table-column prop="quantity" label="需领数量" width="100">
              <template #default="scope">
                <el-tag type="warning">{{ scope.row.quantity }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="courierName" label="指定配送员" width="120" />
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="scope">
                <el-button type="primary" size="small" @click="openPickupDialog(scope.row)">发放货件</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 入库弹窗 -->
    <el-dialog v-model="inboundDialog.visible" title="调拨入库确认" width="500px">
      <el-form :model="inboundDialog.form" :rules="inboundDialog.rules" ref="inboundFormRef" label-width="120px">
        <el-form-item label="商品名称">
          <el-input :value="inboundDialog.row?.productName" disabled />
        </el-form-item>
        <el-form-item label="应入库数量">
          <el-input :value="inboundDialog.row?.expectedQty" disabled />
        </el-form-item>
        <el-form-item label="实际入库数量" prop="actualQty">
          <el-input-number v-model="inboundDialog.form.actualQty" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="入库备注" prop="remark">
          <el-input v-model="inboundDialog.form.remark" type="textarea" placeholder="选填，如发现破损可备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="inboundDialog.visible = false">取消</el-button>
          <el-button type="success" @click="submitInbound" :loading="loading.submit">确认入库</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 领货弹窗 -->
    <el-dialog v-model="pickupDialog.visible" title="配送员领货确认" width="500px">
      <el-form :model="pickupDialog.form" :rules="pickupDialog.rules" ref="pickupFormRef" label-width="100px">
        <el-form-item label="商品明细">
          <el-input :value="pickupDialog.row?.productName + ' × ' + pickupDialog.row?.quantity" disabled type="textarea" />
        </el-form-item>
        <el-form-item label="领货人姓名" prop="courierName">
          <el-input v-model="pickupDialog.form.courierName" placeholder="核对来访人员姓名" />
        </el-form-item>
        <el-form-item label="领货日期" prop="pickupDate">
          <el-date-picker
            v-model="pickupDialog.form.pickupDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="pickupDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitPickup" :loading="loading.submit">确认发货给配送员</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import dayjs from 'dayjs'

const activeTab = ref('inbound')
const stationId = ref(null)

const loading = reactive({
  inspect: false,
  pickup: false,
  submit: false
})

// ================= 数据源 =================
const inspectionList = ref([])
const pickupList = ref([])
const searchTaskNo = ref('')

// ================= 表单与弹窗状态 =================
const inboundFormRef = ref(null)
const inboundDialog = reactive({
  visible: false,
  row: null,
  form: {
    actualQty: 0,
    remark: ''
  },
  rules: {
    actualQty: [{ required: true, message: '请输入实际数量', trigger: 'blur' }]
  }
})

const pickupFormRef = ref(null)
const pickupDialog = reactive({
  visible: false,
  row: null,
  form: {
    courierName: '',
    pickupDate: ''
  },
  rules: {
    courierName: [{ required: true, message: '请输入领货人姓名', trigger: 'blur' }],
    pickupDate: [{ required: true, message: '请选择领货日期', trigger: 'change' }]
  }
})

// ================= 初始化 =================
onMounted(() => {
  const currentUserId = localStorage.getItem('currentUserId')
  if (!currentUserId) {
    ElMessage.error('当前登录状态丢失，请重新登录！')
    return
  }
  stationId.value = parseInt(currentUserId)
  
  fetchPendingInspections()
})

watch(activeTab, (newTab) => {
  if (newTab === 'inbound') {
    fetchPendingInspections()
  } else if (newTab === 'pickup') {
    fetchPendingPickups()
  }
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

// ================= 调拨入库逻辑 =================
const fetchPendingInspections = async () => {
  loading.inspect = true
  try {
    const res = await axios.get(`http://localhost:8080/admin/stationWarehouse/pending-inspections`, {
      params: { stationId: stationId.value }
    })
    if (res.data.code === 200) {
      inspectionList.value = res.data.data || []
    } else {
      ElMessage.error(res.data.msg || '获取列表失败')
    }
  } catch (err) {
    ElMessage.error('网络请求异常，连接被拒绝或服务未响应！')
  } finally {
    loading.inspect = false
  }
}

const openInboundDialog = (row) => {
  inboundDialog.row = row
  inboundDialog.form.actualQty = row.expectedQty // 默认等同于应入库数
  inboundDialog.form.remark = ''
  inboundDialog.visible = true
}

const submitInbound = () => {
  inboundFormRef.value.validate(async (valid) => {
    if (!valid) return
    loading.submit = true
    try {
      const payload = {
        inspectionId: inboundDialog.row.inspectionId,
        stationId: inboundDialog.row.stationId, // 提取这单原本关联的真实分站ID
        actualQty: inboundDialog.form.actualQty,
        remark: inboundDialog.form.remark
      }
      const res = await axios.post('http://localhost:8080/admin/stationWarehouse/inbound', payload)
      if (res.data.code === 200) {
        ElMessage.success('入库成功！')
        inboundDialog.visible = false
        fetchPendingInspections()
      } else {
        ElMessage.error(res.data.msg || '业务操作失败')
      }
    } catch (err) {
      ElMessage.error('网络请求异常，连接被拒绝或服务未响应！')
    } finally {
      loading.submit = false
    }
  })
}

// ================= 领货发货逻辑 =================
const fetchPendingPickups = async () => {
  loading.pickup = true
  try {
    const params = { stationId: stationId.value }
    if (searchTaskNo.value) {
      params.taskNo = searchTaskNo.value
    }
    const res = await axios.get('http://localhost:8080/admin/stationWarehouse/pending-pickups', { params })
    if (res.data.code === 200) {
      pickupList.value = res.data.data || []
    } else {
      ElMessage.error(res.data.msg || '获取列表失败')
    }
  } catch (err) {
    ElMessage.error('网络请求异常，连接被拒绝或服务未响应！')
  } finally {
    loading.pickup = false
  }
}

const openPickupDialog = (row) => {
  pickupDialog.row = row
  // 默认填入系统指定的派送员
  pickupDialog.form.courierName = row.courierName || ''
  pickupDialog.form.pickupDate = dayjs().format('YYYY-MM-DD')
  pickupDialog.visible = true
}

const submitPickup = () => {
  pickupFormRef.value.validate(async (valid) => {
    if (!valid) return
    loading.submit = true
    try {
      const payload = {
        taskId: pickupDialog.row.taskId,
        stationId: pickupDialog.row.stationId, // 提取任务原本关联的真实分站ID
        courierName: pickupDialog.form.courierName,
        pickupDate: pickupDialog.form.pickupDate
      }
      const res = await axios.post('http://localhost:8080/admin/stationWarehouse/pickup', payload)
      if (res.data.code === 200) {
        ElMessage.success('发货成功！商品已由小哥领走')
        pickupDialog.visible = false
        fetchPendingPickups()
      } else {
        // 展示后端的精细化错误拦截，如“库存不足”
        ElMessage.error(res.data.msg || '业务操作失败')
      }
    } catch (err) {
      ElMessage.error('网络请求异常，连接被拒绝或服务未响应！')
    } finally {
      loading.submit = false
    }
  })
}
</script>

<style scoped>
.station-warehouse-workspace {
  padding: 20px;
  background-color: #f7f9fc;
  min-height: calc(100vh - 60px);
}

h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 24px;
}

.custom-tabs :deep(.el-tabs__item) {
  font-size: 16px;
  font-weight: 500;
}

.box-card {
  margin-top: 10px;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
}

.toolbar {
  margin-bottom: 20px;
}
</style>