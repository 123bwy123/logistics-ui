<template>
  <div class="app-container">
    <el-card shadow="never" class="box-card">
      <template #header>
        <div class="header-content">
          <div class="header-title">
            <el-icon><House /></el-icon>
            <span>库房物理架构设置</span>
          </div>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增物理库房</el-button>
        </div>
      </template>

      <el-alert
        title="核心业务规则"
        type="info"
        description="系统中必须且只能有一个【中心库房】，中心库房不可删除。普通分站库房若存有余货，亦不可删除。"
        show-icon
        :closable="false"
        style="margin-bottom: 20px;"
      />

      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="id" label="库房ID" width="100" align="center" />
        <el-table-column prop="warehouseName" label="库房名称" min-width="150" />
        <el-table-column prop="type" label="库房类型" width="120" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.type === 1 ? 'danger' : 'success'">
              {{ scope.row.type === 1 ? '中心库房' : '分站库房' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="manager" label="负责人" width="120" align="center" />
        <el-table-column prop="contactPhone" label="联系电话" width="150" align="center" />
        <el-table-column prop="address" label="物理地址" show-overflow-tooltip />
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)">注销</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑库房信息' : '接入新库房'" width="500px">
      <el-form :model="formData" label-width="100px" ref="formRef" :rules="rules">
        <el-form-item label="名称" prop="warehouseName">
          <el-input v-model="formData.warehouseName" placeholder="如：华东物流中心" />
        </el-form-item>
        <el-form-item label="库房类型" prop="type">
          <el-radio-group v-model="formData.type">
            <el-radio :label="1">中心库房</el-radio>
            <el-radio :label="2">普通分站仓</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="负责人" prop="manager">
          <el-input v-model="formData.manager" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="formData.contactPhone" />
        </el-form-item>
        <el-form-item label="详细地址" prop="address">
          <el-input v-model="formData.address" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus, House } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const formData = ref({ id: null, warehouseName: '', type: 2, manager: '', contactPhone: '', address: '' })

const rules = {
  warehouseName: [{ required: true, message: '必填', trigger: 'blur' }],
  type: [{ required: true, message: '必选', trigger: 'change' }]
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/admin/dc/warehouse/list')
    if (res.data.code === 200) tableData.value = res.data.data
  } catch (e) { ElMessage.error('加载库房列表失败') }
  finally { loading.value = false }
}

const handleAdd = () => {
  isEdit.value = false
  formData.value = { id: null, warehouseName: '', type: 2, manager: '', contactPhone: '', address: '' }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

const submitForm = async () => {
  try {
    const url = isEdit.value ? 'http://localhost:8080/admin/dc/warehouse/update' : 'http://localhost:8080/admin/dc/warehouse/save'
    const method = isEdit.value ? 'put' : 'post'
    const res = await axios[method](url, formData.value)
    if (res.data.code === 200) {
      ElMessage.success('操作成功')
      dialogVisible.value = false
      fetchList()
    } else {
      ElMessage.warning(res.data.msg)
    }
  } catch (e) { ElMessage.error('请求接口异常') }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要注销 [${row.warehouseName}] 吗？系统将检查库存锁定状态。`, '警告', { type: 'error' })
    .then(async () => {
      const res = await axios.delete(`http://localhost:8080/admin/dc/warehouse/delete/${row.id}`)
      if (res.data.code === 200) {
        ElMessage.success('库房已注销')
        fetchList()
      } else {
        ElMessageBox.alert(res.data.msg, '拦截提示', { type: 'error' })
      }
    }).catch(() => {})
}

onMounted(fetchList)
</script>

<style scoped>
.app-container { padding: 20px; }
.header-content { display: flex; justify-content: space-between; align-items: center; }
.header-title { display: flex; align-items: center; font-size: 18px; font-weight: bold; }
.header-title .el-icon { margin-right: 10px; color: #409EFF; }
</style>
