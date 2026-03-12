<template>
  <div class="app-container">
    <el-card shadow="never" class="box-card">
      <template #header>
        <div class="header-content">
          <div class="header-title">
            <el-icon><Box /></el-icon>
            <span>商品综合管理</span>
          </div>
          <div class="header-actions">
            <el-input v-model="searchQuery.name" placeholder="商品名称搜索..." clearable @clear="handleSearch" @keyup.enter="handleSearch" style="width: 200px; margin-right: 10px;" />
            
            <el-cascader
              v-model="selectedCategory"
              :options="categoryOptions"
              :props="{ label: 'name', value: 'id', children: 'children', checkStrictly: false }"
              placeholder="选择分类"
              clearable
              style="width: 220px; margin-right: 10px;"
              @change="handleCategoryChange"
            />

            <el-button type="primary" :icon="Plus" @click="handleAdd">入库新商品</el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="productCode" label="商品代码" width="120" align="center" />
        <el-table-column prop="productName" label="商品名称" min-width="150" />
        <el-table-column prop="stockUnit" label="单位" width="80" align="center" />
        <el-table-column prop="price" label="基础定价" width="100" align="center">
          <template #default="scope">￥{{ scope.row.price }}</template>
        </el-table-column>
        <el-table-column label="所属分类" width="150" align="center">
          <template #default="scope">
            <el-tag size="small" type="info">{{ getCategoryName(scope.row.categoryId) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="录入日期" width="180">
          <template #default="scope">{{ formatDate(scope.row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleEdit(scope.row)">修改</el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="searchQuery.pageNum"
          v-model:page-size="searchQuery.pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="fetchList"
        />
      </div>
    </el-card>

    <!-- 商品表单 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑商品信息' : '新商品入库'" width="600px">
      <el-form :model="formData" label-width="100px" ref="formRef" :rules="rules">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品名称" prop="productName">
              <el-input v-model="formData.productName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品代码" prop="productCode">
              <el-input v-model="formData.productCode" :disabled="isEdit" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="计量单位" prop="stockUnit">
              <el-input v-model="formData.stockUnit" placeholder="如: 件, 箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="基础单价" prop="price">
              <el-input-number v-model="formData.price" :precision="2" :step="0.1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="所属分类" prop="categoryId">
          <el-cascader
            v-model="formData.categoryId"
            :options="categoryOptions"
            :props="{ label: 'name', value: 'id', children: 'children', emitPath: false }"
            placeholder="请选择二级细化分类"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="生产厂商" prop="supplierId">
          <el-select v-model="formData.supplierId" placeholder="选择供应商" style="width: 100%">
            <el-option v-for="s in suppliers" :key="s.id" :label="s.supplierName" :value="s.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="商品描述">
          <el-input v-model="formData.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus, Box } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const suppliers = ref([])
const categoryOptions = ref([])
const selectedCategory = ref([])

const searchQuery = reactive({
  pageNum: 1,
  pageSize: 10,
  name: '',
  categoryId: null
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const formData = ref({ id: null, productName: '', productCode: '', stockUnit: '', price: 0, categoryId: null, supplierId: null, remark: '' })
const rules = {
  productName: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  productCode: [{ required: true, message: '请输入代码', trigger: 'blur' }],
  stockUnit: [{ required: true, message: '请输入计量单位', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  supplierId: [{ required: true, message: '请选择供应商', trigger: 'change' }]
}

const fetchCategories = async () => {
  try {
    const l1 = await axios.get('http://localhost:8080/admin/dc/category/list?level=1')
    const l2 = await axios.get('http://localhost:8080/admin/dc/category/list?level=2')
    
    const tree = l1.data.data.map(parent => ({
      ...parent,
      children: l2.data.data.filter(child => child.parentId === parent.id)
    }))
    categoryOptions.value = tree
  } catch (e) { ElMessage.error('分类数据加载失败') }
}

const fetchSuppliers = async () => {
    // 借用之前实现的供应商列表接口
    const res = await axios.get('http://localhost:8080/admin/supplier/list?pageSize=999')
    suppliers.value = res.data.data
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/admin/dc/product/list', { params: searchQuery })
    if (res.data.code === 200) {
      tableData.value = res.data.data
      total.value = res.data.data.length // 简化处理
    }
  } catch (e) { ElMessage.error('加载商品列表失败') }
  finally { loading.value = false }
}

const handleSearch = () => { searchQuery.pageNum = 1; fetchList() }

const handleCategoryChange = (val) => {
  searchQuery.categoryId = val && val.length > 0 ? val[val.length - 1] : null
  handleSearch()
}

const getCategoryName = (id) => {
  // 简单从 options 中找
  for (let l1 of categoryOptions.value) {
    if (l1.id === id) return l1.name
    if (l1.children) {
      let l2 = l1.children.find(c => c.id === id)
      if (l2) return `${l1.name} / ${l2.name}`
    }
  }
  return '未分类'
}

const handleAdd = () => {
  isEdit.value = false
  formData.value = { id: null, productName: '', productCode: '', stockUnit: '', price: 0, categoryId: null, supplierId: null, remark: '' }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

const submitForm = async () => {
  try {
    const url = isEdit.value ? 'http://localhost:8080/admin/dc/product/update' : 'http://localhost:8080/admin/dc/product/save'
    const method = isEdit.value ? 'put' : 'post'
    const res = await axios[method](url, formData.value)
    if (res.data.code === 200) {
      ElMessage.success('保存成功')
      dialogVisible.value = false
      fetchList()
    }
  } catch (e) { ElMessage.error('操作失败') }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定移除商品 [${row.productName}] 吗？`, '提示', { type: 'warning' })
    .then(async () => {
      const res = await axios.delete(`http://localhost:8080/admin/dc/product/delete/${row.id}`)
      if (res.data.code === 200) {
        ElMessage.success('移除成功')
        fetchList()
      } else {
        ElMessage.error(res.data.msg)
      }
    }).catch(() => {})
}

const formatDate = (date) => date ? new Date(date).toLocaleDateString() : '-'

onMounted(() => {
  fetchCategories()
  fetchSuppliers()
  fetchList()
})
</script>

<style scoped>
.app-container { padding: 20px; }
.header-content { display: flex; justify-content: space-between; align-items: center; }
.header-title { display: flex; align-items: center; font-size: 18px; font-weight: bold; }
.header-title .el-icon { margin-right: 10px; color: #67C23A; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
