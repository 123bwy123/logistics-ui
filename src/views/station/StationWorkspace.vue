<template>
  <div class="app-container">
    <el-card shadow="hover">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        
        <el-tab-pane label="派件调度 (发任务)" name="dispatch">
          <el-table :data="tableData" border stripe v-loading="loading">
            <el-table-column prop="taskNo" label="内部任务单号" />
            <el-table-column prop="customerOrderNo" label="关联运单号" />
            <el-table-column prop="receiveAddress" label="客户收件地址" show-overflow-tooltip />
            <el-table-column label="操作" width="120" align="center">
              <template #default="scope">
                <el-button type="primary" size="small" @click="openAssignDialog(scope.row)">派单</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="回执录入与结单 (收钱)" name="close">
          <el-alert title="小哥送完货回网点后，请仔细核对签收单及货款，确认无误后点击【确认收款并结单】。" type="success" show-icon style="margin-bottom: 20px;" />
          <el-table :data="closeTableData" border stripe v-loading="closeLoading">
            <el-table-column prop="customerOrderNo" label="客户订单号" align="center" />
            <el-table-column prop="courierName" label="派送骑士" align="center">
              <template #default="scope"><el-tag type="warning">{{ scope.row.courierName }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="totalAmount" label="应上交货款(元)" align="center">
              <template #default="scope"><span style="color: red; font-weight: bold; font-size: 16px;">¥ {{ scope.row.totalAmount }}</span></template>
            </el-table-column>
            <el-table-column label="站长操作" width="200" align="center">
              <template #default="scope">
                <el-button type="success" icon="Money" @click="doClose(scope.row)">已收妥·确认结单</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

      </el-tabs>
    </el-card>
		<el-dialog v-model="dialogVisible" title="🚚 分配配送任务" width="400px">
			  <el-form ref="formRef" :model="assignForm">
				<el-form-item label="选择配送员" required prop="courierId">
				  <el-select v-model="assignForm.courierId" placeholder="请选择本站快递小哥" style="width: 100%">
					<el-option v-for="c in courierList" :key="c.id" :label="c.realName" :value="c.id" />
				  </el-select>
				</el-form-item>
			  </el-form>
			  <template #footer>
				<span class="dialog-footer">
				  <el-button @click="dialogVisible = false">取消</el-button>
				  <el-button type="primary" @click="submitAssign" :loading="submitLoading">确认派发</el-button>
				</span>
			  </template>
			</el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Bicycle, Position, Refresh,Money } from '@element-plus/icons-vue'
import { ElMessage , ElMessageBox} from 'element-plus'
import axios from 'axios'

const activeTab = ref('dispatch') // 默认停在第一个标签
const closeTableData = ref([])
const closeLoading = ref(false)

const tableData = ref([])
const loading = ref(false)
const submitLoading = ref(false)

// 【新增】：存放真实小哥的数组
const courierList = ref([])

// 【新增】：去后端拉取真实的快递小哥名单
const fetchCouriers = async () => {
  try {
    const res = await axios.get('http://localhost:8080/admin/station/courierList')
    if (res.data.code === 200) {
      courierList.value = res.data.data
    }
  } catch (error) {
    console.error('获取小哥列表失败')
  }
}
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



// 拉取待结单的数据
const fetchCloseTasks = async () => {
  closeLoading.value = true
  const res = await axios.get('http://localhost:8080/admin/station/pendingClose')
  if (res.data.code === 200) closeTableData.value = res.data.data
  closeLoading.value = false
}

// 切换 Tab 时触发
const handleTabClick = (tab) => {
  if (tab.paneName === 'dispatch') fetchPendingTasks()
  if (tab.paneName === 'close') fetchCloseTasks()
}

// 终极结单操作
const doClose = (row) => {
  ElMessageBox.confirm(`确认已收到骑士 [${row.courierName}] 上交的货款 ¥ ${row.totalAmount} 并核对签收单无误？`, '财务结单确认', {
    confirmButtonText: '钱款无误，完结此单',
    cancelButtonText: '再算算',
    type: 'success',
  }).then(async () => {
    const res = await axios.post(`http://localhost:8080/admin/station/close?taskId=${row.taskId}&orderId=${row.orderId}`)
    if (res.data.code === 200) {
      ElMessage.success(res.data.msg)
      fetchCloseTasks() // 刷新收银台
    }
  }).catch(() => {})
}
// 找到现有的 onMounted，把拉取小哥的方法加进去
onMounted(() => {
  fetchPendingTasks()
  fetchCouriers()
  fetchCloseTasks() 
})
</script>

<style scoped>
.app-container { height: 100%; }
.box-card { min-height: 100%; }
</style>