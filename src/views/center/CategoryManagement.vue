<template>
  <div class="app-container">
    <el-card shadow="never" class="box-card">
      <template #header>
        <div class="header-title">
          <el-icon><Fold /></el-icon>
          <span>商品分类分级管理</span>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="category-tabs">
        <!-- 一级分类面板 -->
        <el-tab-pane label="一级分类 (大类)" name="level1">
          <div class="tab-actions">
            <el-button type="primary" :icon="Plus" @click="handleAdd(1)">新增一级分类</el-button>
          </div>
          <el-table :data="level1Data" border stripe v-loading="loading">
            <el-table-column prop="id" label="分类ID" width="120" align="center" />
            <el-table-column prop="name" label="一级分类名称" />
            <el-table-column prop="createTime" label="创建时间" width="180">
              <template #default="scope">{{ formatDate(scope.row.createTime) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="200" align="center">
              <template #default="scope">
                <el-button link type="primary" @click="handleEdit(scope.row)">编辑</el-button>
                <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 二级分类面板 -->
        <el-tab-pane label="二级分类 (细节类)" name="level2">
          <div class="tab-actions">
            <el-select v-model="filterL1" placeholder="筛选一级分类" clearable @change="fetchLevel2" style="width: 200px; margin-right: 15px;">
              <el-option v-for="item in level1Data" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
            <el-button type="primary" :icon="Plus" @click="handleAdd(2)">新增二级分类</el-button>
          </div>
          <el-table :data="level2Data" border stripe v-loading="loading">
            <el-table-column prop="id" label="分类ID" width="120" align="center" />
            <el-table-column prop="name" label="二级分类名称" />
            <el-table-column label="所属一级分类">
              <template #default="scope">
                <el-tag size="small">{{ getL1Name(scope.row.parentId) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="180">
              <template #default="scope">{{ formatDate(scope.row.createTime) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="200" align="center">
              <template #default="scope">
                <el-button link type="primary" @click="handleEdit(scope.row)">编辑</el-button>
                <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑分类' : '新增分类'" width="450px">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="层级">
          <el-tag>{{ formData.level === 1 ? '一级分类' : '二级分类' }}</el-tag>
        </el-form-item>
        <el-form-item v-if="formData.level === 2" label="所属一级" required>
          <el-select v-model="formData.parentId" placeholder="请选择一级分类" style="width: 100%">
            <el-option v-for="item in level1Data" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类名称" required>
          <el-input v-model="formData.name" placeholder="请输入分类名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Fold } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const activeTab = ref('level1')
const loading = ref(false)
const level1Data = ref([])
const level2Data = ref([])
const filterL1 = ref(null)

const dialogVisible = ref(false)
const isEdit = ref(false)
const formData = ref({ id: null, name: '', level: 1, parentId: null })

const fetchLevel1 = async () => {
  try {
    const res = await axios.get('http://localhost:8080/admin/dc/category/list?level=1')
    if (res.data.code === 200) level1Data.value = res.data.data
  } catch (e) { ElMessage.error('加载一级分类失败') }
}

const fetchLevel2 = async () => {
  loading.value = true
  try {
    let url = 'http://localhost:8080/admin/dc/category/list?level=2'
    if (filterL1.value) url += `&parentId=${filterL1.value}`
    const res = await axios.get(url)
    if (res.data.code === 200) level2Data.value = res.data.data
  } catch (e) { ElMessage.error('加载二级分类失败') }
  finally { loading.value = false }
}

const getL1Name = (id) => {
  const found = level1Data.value.find(item => item.id === id)
  return found ? found.name : '未知'
}

const handleAdd = (level) => {
  isEdit.value = false
  formData.value = { id: null, name: '', level: level, parentId: (level === 2 && filterL1.value) ? filterL1.value : null }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formData.value.name) return ElMessage.warning('请输入名称')
  if (formData.value.level === 2 && !formData.value.parentId) return ElMessage.warning('请选择所属一级分类')
  
  try {
    const url = isEdit.value ? 'http://localhost:8080/admin/dc/category/update' : 'http://localhost:8080/admin/dc/category/save'
    const method = isEdit.value ? 'put' : 'post'
    const res = await axios[method](url, formData.value)
    if (res.data.code === 200) {
      ElMessage.success('操作成功')
      dialogVisible.value = false
      fetchLevel1()
      fetchLevel2()
    }
  } catch (e) { ElMessage.error('请求失败') }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除分类 [${row.name}] 吗？系统将进行级联校验。`, '提示', { type: 'warning' })
    .then(async () => {
      const res = await axios.delete(`http://localhost:8080/admin/dc/category/delete/${row.id}`)
      if (res.data.code === 200) {
        ElMessage.success('删除成功')
        fetchLevel1()
        fetchLevel2()
      } else {
        ElMessage.error(res.data.msg)
      }
    }).catch(() => {})
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString()
}

onMounted(() => {
  fetchLevel1()
  fetchLevel2()
})
</script>

<style scoped>
.app-container { padding: 20px; }
.header-title { display: flex; align-items: center; font-size: 18px; font-weight: bold; }
.header-title .el-icon { margin-right: 10px; color: #409EFF; }
.tab-actions { margin-bottom: 20px; display: flex; align-items: center; }
.category-tabs { margin-top: 10px; }
</style>
