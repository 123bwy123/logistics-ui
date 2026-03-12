<template>
  <div class="log-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span class="title">系统操作日志</span>
          <div class="header-ops">
            <el-input
              v-model="queryParams.operator"
              placeholder="搜索操作人"
              clearable
              style="width: 200px; margin-right: 10px"
              @keyup.enter="handleQuery"
            />
            <el-select v-model="queryParams.type" placeholder="日志类型" clearable style="width: 150px; margin-right: 10px">
              <el-option label="正常" :value="0" />
              <el-option label="异常" :value="1" />
            </el-select>
            <el-button type="primary" @click="handleQuery">查询</el-button>
            <el-button @click="resetQuery">重置</el-button>
          </div>
        </div>
      </template>

      <el-table :data="logList" border stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="module" label="模块" width="120" align="center" />
        <el-table-column prop="operation" label="操作内容" width="180" />
        <el-table-column prop="operator" label="操作人" width="120" align="center" />
        <el-table-column prop="ip" label="IP地址" width="140" align="center" />
        <el-table-column prop="time" label="耗时(ms)" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.time > 500 ? 'warning' : 'success'">
              {{ scope.row.time }}ms
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.type === 0 ? 'success' : 'danger'">
              {{ scope.row.type === 0 ? '正常' : '异常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="记录时间" width="180" align="center" />
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="scope">
            <el-button link type="primary" @click="showDetail(scope.row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="日志详情" width="700px">
      <el-form :model="currentLog" label-width="100px" label-position="left">
        <el-form-item label="请求方法:">
          <el-tag type="info">{{ currentLog.method }}</el-tag>
        </el-form-item>
        <el-form-item label="请求参数:">
          <div class="json-box">{{ currentLog.params }}</div>
        </el-form-item>
        <el-form-item label="响应结果:">
          <div class="json-box" :class="{ 'error-text': currentLog.type === 1 }">
            {{ currentLog.result }}
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const logList = ref([])
const queryParams = ref({
  operator: '',
  type: null
})

const detailVisible = ref(false)
const currentLog = ref({})

const fetchLogs = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/admin/sys/log/list', { params: queryParams.value })
    if (res.data.code === 200) {
      logList.value = res.data.data
    }
  } catch (err) {
    ElMessage.error('获取日志失败')
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  fetchLogs()
}

const resetQuery = () => {
  queryParams.value = {
    operator: '',
    type: null
  }
  fetchLogs()
}

const showDetail = (row) => {
  currentLog.value = row
  detailVisible.value = true
}

onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.log-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font-size: 18px;
  font-weight: bold;
}
.json-box {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  word-break: break-all;
  white-space: pre-wrap;
  max-height: 400px;
  overflow-y: auto;
  width: 100%;
}
.error-text {
  color: #f56c6c;
}
</style>
