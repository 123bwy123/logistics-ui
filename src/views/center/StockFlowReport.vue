<template>
  <div class="app-container">
    <el-card shadow="never" class="box-card">
      <template #header>
        <div class="header-title">
          <el-icon><List /></el-icon>
          <span>全网进出库流水台账</span>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-form :inline="true" :model="searchQuery">
          <el-form-item label="库房">
            <el-select v-model="searchQuery.warehouseId" placeholder="全部" clearable style="width: 150px">
              <el-option v-for="w in warehouses" :key="w.id" :label="w.warehouseName" :value="w.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="searchQuery.flowType" placeholder="全部" clearable style="width: 120px">
              <el-option label="入库" :value="1" />
              <el-option label="出库" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="单据号">
            <el-input v-model="searchQuery.relatedNo" placeholder="搜索单号" clearable />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">刷新列表</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column label="操作时间" width="180">
          <template #default="scope">{{ formatDate(scope.row.createTime) }}</template>
        </el-table-column>
        <el-table-column prop="warehouseName" label="库房" width="130" />
        <el-table-column prop="productName" label="涉及商品" min-width="180" />
        <el-table-column label="流动类型" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.flowType === 1 ? 'success' : 'warning'">
              {{ scope.row.flowType === 1 ? '入库 (+)' : '出库 (-)' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="100" align="center">
          <template #default="scope">
            <b :style="{ color: scope.row.flowType === 1 ? '#67C23A' : '#E6A23C' }">
              {{ scope.row.flowType === 1 ? '+' : '-' }}{{ scope.row.quantity }}
            </b>
          </template>
        </el-table-column>
        <el-table-column prop="operatorName" label="操作人" width="120" align="center" />
        <el-table-column prop="relatedNo" label="关联单据号" width="180" />
        <el-table-column prop="remark" label="备注说明" show-overflow-tooltip />
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="searchQuery.pageNum"
          v-model:page-size="searchQuery.pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="handleSearch"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { List } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const loading = ref(false)
const tableData = ref([])
const warehouses = ref([])
const total = ref(0)

const searchQuery = reactive({
  pageNum: 1,
  pageSize: 15,
  warehouseId: null,
  flowType: null,
  relatedNo: ''
})

const fetchWarehouses = async () => {
  const res = await axios.get('http://localhost:8080/admin/dc/warehouse/list')
  warehouses.value = res.data.data
}

const handleSearch = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/admin/dc/report/flow', { params: searchQuery })
    if (res.data.code === 200) {
      tableData.value = res.data.data
      total.value = res.data.data.length // 简单处理
    }
  } catch (e) { ElMessage.error('加载流水账失败') }
  finally { loading.value = false }
}

const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}

onMounted(() => {
  fetchWarehouses()
  handleSearch()
})
</script>

<style scoped>
.app-container { padding: 20px; }
.header-title { display: flex; align-items: center; font-size: 18px; font-weight: bold; }
.header-title .el-icon { margin-right: 10px; color: #E6A23C; }
.search-bar { margin-bottom: 20px; padding: 15px; background: #fdf6ec; border-radius: 4px; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
