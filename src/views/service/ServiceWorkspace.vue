<template>
  <div class="app-container">
    <el-card class="box-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span style="font-weight: bold; font-size: 16px;">
            <el-icon><PhoneFilled /></el-icon> 客服工作台 - 待审核配送请求
          </span>
          <el-button type="success" plain size="small" icon="Refresh" @click="fetchPendingOrders">刷新列表</el-button>
        </div>
      </template>

      <el-table :data="tableData" border stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="orderNo" label="客户订单号" width="180" align="center" />
        <el-table-column prop="requireDate" label="期望送达日期" width="120" align="center">
          <template #default="scope">
            {{ formatDate(scope.row.requireDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="receiveAddress" label="收货详情" min-width="250" show-overflow-tooltip />
        <el-table-column prop="createTime" label="下单时间" width="170" align="center" />
        
        <el-table-column label="业务操作" width="150" align="center" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" icon="Check" @click="openApproveDialog(scope.row)">审核接单</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog title="订单审核与运费核算" v-model="dialogVisible" width="450px">
      <el-alert title="根据客户的配送地址和货物重量/体积，请核算并录入本次配送的总运费。" type="warning" show-icon style="margin-bottom: 20px;" />
      
      <el-form ref="formRef" :model="approveForm" label-width="100px">
        <el-form-item label="客户订单号">
          <el-input v-model="approveForm.orderNo" disabled />
        </el-form-item>
        <el-form-item label="核算总金额" prop="totalAmount" :rules="{ required: true, message: '总金额不能为空' }">
          <el-input-number v-model="approveForm.totalAmount" :precision="2" :step="10" :min="0" style="width: 100%;" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">暂不接单</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitApprove">确认接单并流转</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { PhoneFilled, Check, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const tableData = ref([])
const loading = ref(false)
const submitLoading = ref(false)

// 弹窗数据
const dialogVisible = ref(false)
const formRef = ref(null)
const approveForm = reactive({
  orderId: null,
  orderNo: '',
  totalAmount: 0.00
})

// 1. 查数据库：获取状态为 0 的待审核订单
const fetchPendingOrders = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/customer/order/pendingList')
    if (res.data.code === 200) {
      tableData.value = res.data.data
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (error) {
    ElMessage.error('获取列表失败，请检查后端是否报错')
  } finally {
    loading.value = false
  }
}

// 格式化日期去掉时分秒
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

// 2. 打开审核弹窗
const openApproveDialog = (row) => {
  approveForm.orderId = row.id
  approveForm.orderNo = row.orderNo
  approveForm.totalAmount = 50.00 // 给个默认预估运费
  dialogVisible.value = true
}

// 3. 提交审核结果给后端
const submitApprove = () => {
  formRef.value.validate(async (valid) => {
      if (!valid) return
      submitLoading.value = true
      
      // 【动态获取真实身份】
      const realOperatorId = parseInt(localStorage.getItem('currentUserId')) || 0;
  
      try {
        const res = await axios.post('http://localhost:8080/customer/order/approve', null, {
          params: {
            orderId: approveForm.orderId,
            operatorId: realOperatorId, // 这里换成了真实的客服 ID
            totalAmount: approveForm.totalAmount
          }
        })
      
      if (res.data.code === 200) {
        ElMessage.success(res.data.msg)
        dialogVisible.value = false
        fetchPendingOrders() // 审核成功后刷新列表，那条数据就会消失（流转到下一环了）
      } else {
        ElMessage.error(res.data.msg)
      }
    } catch (error) {
      ElMessage.error('审核提交失败！')
    } finally {
      submitLoading.value = false
    }
  })
}

onMounted(() => {
  fetchPendingOrders()
})
</script>

<style scoped>
.app-container { height: 100%; }
.box-card { min-height: 100%; }
</style>