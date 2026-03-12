<template>
  <div class="app-container">
    <el-card shadow="never" class="box-card">
      <template #header>
        <div class="header-title">
          <el-icon><DataLine /></el-icon>
          <span>全网库存综合查询</span>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-form :inline="true" :model="searchQuery">
          <el-form-item label="所属库房">
            <el-select v-model="searchQuery.warehouseId" placeholder="所有库房" clearable @change="handleSearch">
              <el-option v-for="w in warehouses" :key="w.id" :label="w.warehouseName" :value="w.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="商品名称">
            <el-input v-model="searchQuery.productName" placeholder="模糊搜索" clearable @clear="handleSearch" @keyup.enter="handleSearch" />
          </el-form-item>
          <el-form-item label="所属分类">
            <el-cascader
              v-model="searchQuery.categoryId"
              :options="categoryOptions"
              :props="{ label: 'name', value: 'id', children: 'children', emitPath: false, checkStrictly: true }"
              placeholder="选择分类"
              clearable
              @change="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">立即查询</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="warehouseName" label="所在库房" width="150" sortable />
        <el-table-column prop="productName" label="商品名称" min-width="180" />
        <el-table-column prop="categoryName" label="商品分类" width="150" align="center" />
        <el-table-column prop="stockUnit" label="计量单位" width="100" align="center" />
        <el-table-column prop="stockQuantity" label="实物库存" width="120" align="center">
          <template #default="scope">
            <span :class="{ 'warning-text': scope.row.stockQuantity <= scope.row.warningLevel }">
              {{ scope.row.stockQuantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="warningLevel" label="预警阈值" width="100" align="center" />
        <el-table-column label="库存状态" width="120" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.stockQuantity <= scope.row.warningLevel" type="danger">库存告急</el-tag>
            <el-tag v-else type="success">供应充足</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { DataLine } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const loading = ref(false)
const tableData = ref([])
const warehouses = ref([])
const categoryOptions = ref([])

const searchQuery = reactive({
  warehouseId: null,
  categoryId: null,
  productName: ''
})

const fetchWarehouses = async () => {
  const res = await axios.get('http://localhost:8080/admin/dc/warehouse/list')
  warehouses.value = res.data.data
}

const fetchCategories = async () => {
    const l1 = await axios.get('http://localhost:8080/admin/dc/category/list?level=1')
    const l2 = await axios.get('http://localhost:8080/admin/dc/category/list?level=2')
    categoryOptions.value = l1.data.data.map(p => ({
      ...p,
      children: l2.data.data.filter(c => c.parentId === p.id)
    }))
}

const handleSearch = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/admin/dc/report/inventory', { params: searchQuery })
    if (res.data.code === 200) tableData.value = res.data.data
  } catch (e) { ElMessage.error('查询失败') }
  finally { loading.value = false }
}

onMounted(() => {
  fetchWarehouses()
  fetchCategories()
  handleSearch()
})
</script>

<style scoped>
.app-container { padding: 20px; }
.header-title { display: flex; align-items: center; font-size: 18px; font-weight: bold; }
.header-title .el-icon { margin-right: 10px; color: #409EFF; }
.search-bar { margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 4px; }
.warning-text { color: #F56C6C; font-weight: bold; }
</style>
