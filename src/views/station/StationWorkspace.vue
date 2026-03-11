<template>
  <div class="app-container">
    <el-card class="box-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span style="font-weight: bold; font-size: 16px;">
            <el-icon><Bicycle /></el-icon> 配送分站 - 运单派发工作台
          </span>
          <el-button type="primary" plain size="small" icon="Refresh" @click="fetchPendingTasks">刷新任务池</el-button>
        </div>
      </template>

      <el-table :data="tableData" border stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="taskNo" label="内部任务单号" width="180" align="center">
          <template #default="scope">
            <el-tag type="info">{{ scope.row.taskNo }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="customerOrderNo" label="关联运单号" width="180" align="center" />
        <el-table-column prop="receiveAddress" label="客户收件地址 (关键)" min-width="250" show-overflow-tooltip />
        <el-table-column prop="createTime" label="任务到达时间" width="170" align="center">
          <template #default="scope">{{ formatDate(scope.row.createTime) }}</template>
        </el-table-column>
        
        <el-table-column label="站长操作" width="150" align="center" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" icon="Position" @click="openAssignDialog(scope.row)">指派小哥</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog title="人工指派配送员" v-model="dialogVisible" width="450px">
      <el-alert title="请根据包裹的目的地地址，分配给负责该片区的骑士。" type="success" show-icon style="margin-bottom: 20px;" />
      
      <el-form ref="formRef" :model="assignForm" label-width="90px">
        <el-form-item label="任务单号">
          <el-input v-model="assignForm.taskNo" disabled />
        </el-form-item>
        <el-form-item label="派送地址">
          <el-input type="textarea" :rows="2" v-model="assignForm.receiveAddress" disabled />
        </el-form-item>
        
        <el-form-item label="选择配送员" prop="courierId" :rules="{ required: true, message: '必须选择一名配送员' }">
          <el-select v-model="assignForm.courierId" placeholder="请选择当班骑士" style="width: 100%;">
            <el-option label="🌟 金牌骑士 - 王建国 (负责海淀)" :value="401" />
            <el-option label="⚡ 闪电小哥 - 李铁柱 (负责朝阳)" :value="402" />
            <el-option label="🛵 靠谱专员 - 张大山 (负责浦东)" :value="403" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">暂不派单</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitAssign">立即下发任务</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Bicycle, Position, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const tableData = ref([])
const loading = ref(false)
const submitLoading = ref(false)

const dialogVisible = ref(false)
const formRef = ref(null)
const assignForm = reactive({
  taskId: null,
  orderId: null,
  taskNo: '',
  receiveAddress: '',
  courierId: null
})

const fetchPendingTasks = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/admin/station/pendingTasks')
    if (res.data.code === 200) {
      tableData.value = res.data.data
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (error) {
    ElMessage.error('获取列表失败，请检查网络')
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return dateStr.replace('T', ' ')
}

const openAssignDialog = (row) => {
  assignForm.taskId = row.id
  assignForm.orderId = row.orderId
  assignForm.taskNo = row.taskNo
  assignForm.receiveAddress = row.receiveAddress
  assignForm.courierId = null // 清空上次选择
  dialogVisible.value = true
}

const submitAssign = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    
    // 获取当前站长ID
    const realAdminId = parseInt(localStorage.getItem('currentUserId')) || 0;

    try {
      const res = await axios.post('http://localhost:8080/admin/station/assign', null, {
        params: {
          taskId: assignForm.taskId,
          orderId: assignForm.orderId,
          courierId: assignForm.courierId,
          adminId: realAdminId
        }
      })
      
      if (res.data.code === 200) {
        ElMessage.success(res.data.msg)
        dialogVisible.value = false
        fetchPendingTasks() // 刷新，订单被小哥拿走，离开任务池
      } else {
        ElMessage.error(res.data.msg)
      }
    } catch (error) {
      ElMessage.error('任务下发失败！')
    } finally {
      submitLoading.value = false
    }
  })
}

onMounted(() => {
  fetchPendingTasks()
})
</script>

<style scoped>
.app-container { height: 100%; }
.box-card { min-height: 100%; }
</style>