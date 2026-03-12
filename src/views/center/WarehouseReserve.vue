<template>
  <div class="app-container">
    <el-card shadow="never" class="box-card">
      <template #header>
        <div class="header-title">
          <el-icon><Timer /></el-icon>
          <span>中心库房储备预警设置</span>
        </div>
      </template>

      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="productName" label="储备商品名称" min-width="180" />
        <el-table-column prop="stockQuantity" label="当前库存实物数" width="150" align="center">
          <template #default="scope">
            <span :style="{ color: scope.row.stockQuantity <= scope.row.warningLevel ? '#F56C6C' : '#67C23A', fontWeight: 'bold' }">
              {{ scope.row.stockQuantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="warningLevel" label="低量预警值" width="150" align="center">
          <template #default="scope">
            <el-input-number v-model="scope.row.warningLevel" :min="0" size="small" />
          </template>
        </el-table-column>
        <el-table-column prop="maxLevel" label="最高储备上限" width="150" align="center">
          <template #default="scope">
            <el-input-number v-model="scope.row.maxLevel" :min="1" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.stockQuantity <= scope.row.warningLevel" type="danger">缺货预警</el-tag>
            <el-tag v-else-if="scope.row.stockQuantity >= scope.row.maxLevel" type="warning">库存积压</el-tag>
            <el-tag v-else type="success">状态正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleUpdate(scope.row)">应用修改</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Timer } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const loading = ref(false)
const tableData = ref([])

const fetchList = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/admin/dc/warehouse/reserve/list')
    if (res.data.code === 200) tableData.value = res.data.data
  } catch (e) { ElMessage.error('加载储备数据失败') }
  finally { loading.value = false }
}

const handleUpdate = async (row) => {
  try {
    const res = await axios.post('http://localhost:8080/admin/dc/warehouse/reserve/update', {
      id: row.id,
      warningLevel: row.warningLevel,
      maxLevel: row.maxLevel
    })
    if (res.data.code === 200) {
      ElMessage.success(`[${row.productName}] 储备标准已更新`)
      fetchList()
    }
  } catch (e) { ElMessage.error('更新失败') }
}

onMounted(fetchList)
</script>

<style scoped>
.app-container { padding: 20px; }
.header-title { display: flex; align-items: center; font-size: 18px; font-weight: bold; }
.header-title .el-icon { margin-right: 10px; color: #E6A23C; }
</style>
