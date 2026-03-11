<template>
  <div class="app-container">
    <el-card class="box-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span style="font-weight: bold; font-size: 16px;">
            <el-icon><Guide /></el-icon> 调度中心 - 待分配任务池
          </span>
          <el-button type="warning" plain size="small" icon="Refresh" @click="fetchAssignableOrders">刷新任务池</el-button>
        </div>
      </template>

      <el-table :data="tableData" border stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="orderNo" label="客户订单号" width="180" align="center" />
        <el-table-column prop="receiveAddress" label="收货详情" min-width="250" show-overflow-tooltip />
        <el-table-column prop="requireDate" label="期望送达日期" width="120" align="center">
          <template #default="scope">
            {{ formatDate(scope.row.requireDate) }}
          </template>
        </el-table-column>
        <el-table-column label="当前状态" width="100" align="center">
          <template #default>
            <el-tag type="success">可分配</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="调度操作" width="150" align="center" fixed="right">
          <template #default="scope">
            <el-button size="small" type="warning" icon="Position" @click="openDispatchDialog(scope.row)">分发调度</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog title="订单智能调度与分发" v-model="dialogVisible" width="500px">
      <el-alert title="系统将自动生成【出库调拨单】发往中心库房，并生成【配送任务单】发往您选择的分站。" type="info" show-icon style="margin-bottom: 20px;" />
      
      <el-form ref="formRef" :model="dispatchForm" label-width="120px">
        <el-form-item label="关联订单号">
          <el-input v-model="dispatchForm.orderNo" disabled />
        </el-form-item>
        
        <el-form-item label="分配至配送分站" prop="stationId" :rules="{ required: true, message: '请选择要承接的分站' }">
          <el-select v-model="dispatchForm.stationId" placeholder="请根据收货地址就近分配" style="width: 100%;">
            <el-option label="北京海淀区中关村分站 (ID: 101)" :value="101" />
            <el-option label="北京朝阳区国贸分站 (ID: 102)" :value="102" />
            <el-option label="上海浦东新区陆家嘴分站 (ID: 201)" :value="201" />
            <el-option label="广州天河区珠江新城分站 (ID: 301)" :value="301" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="warning" :loading="submitLoading" @click="submitDispatch">确认调度裂变</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Guide, Position, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const tableData = ref([])
const loading = ref(false)
const submitLoading = ref(false)

const dialogVisible = ref(false)
const formRef = ref(null)
const dispatchForm = reactive({
  orderId: null,
  orderNo: '',
  stationId: null
})

// 1. 获取待分配的订单列表
const fetchAssignableOrders = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/admin/dispatch/list')
    if (res.data.code === 200) {
      tableData.value = res.data.data
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (error) {
    ElMessage.error('获取调度列表失败，请检查后端是否报错')
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

// 2. 打开调度弹窗
const openDispatchDialog = (row) => {
  dispatchForm.orderId = row.id
  dispatchForm.orderNo = row.orderNo
  dispatchForm.stationId = null // 每次打开清空上次的选择
  dialogVisible.value = true
}

// 3. 提交调度 (核心裂变)
const submitDispatch = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      const res = await axios.post('http://localhost:8080/admin/dispatch/execute', null, {
        params: {
          orderId: dispatchForm.orderId,
          stationId: dispatchForm.stationId
        }
      })
      
      if (res.data.code === 200) {
        ElMessage.success(res.data.msg) // 这里会提示成功生成了哪两个单号
        dialogVisible.value = false
        fetchAssignableOrders() // 刷新列表，该订单已被调度，会从这里消失
      } else {
        ElMessage.error(res.data.msg)
      }
    } catch (error) {
      ElMessage.error('调度执行失败！')
    } finally {
      submitLoading.value = false
    }
  })
}

onMounted(() => {
  fetchAssignableOrders()
})
</script>

<style scoped>
.app-container { height: 100%; }
.box-card { min-height: 100%; }
</style>