<template>
  <div class="app-container">
    <el-card shadow="never" class="box-card" style="border-radius: 12px; border: none; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
      <template #header>
        <div class="header-content">
          <div class="title-section">
            <el-icon class="title-icon"><Shop /></el-icon>
            <span class="title-text">供应商综合管理系统</span>
            <el-tag type="info" effect="plain" class="count-tag">共 {{ total }} 家合作伙伴</el-tag>
          </div>
          <div class="action-section">
            <el-input
              v-model="searchQuery.name"
              placeholder="搜索供应商名称..."
              clearable
              style="width: 250px; margin-right: 15px;"
              @keyup.enter="handleSearch"
              :prefix-icon="Search"
            />
            <el-button type="primary" :icon="Plus" @click="handleAdd" class="gradient-btn">新增供应商</el-button>
          </div>
        </div>
      </template>

      <!-- 供应商看板 (数据摘要) -->
      <el-row :gutter="20" style="margin-bottom: 25px;">
        <el-col :span="6">
          <div class="stat-card blue">
            <div class="stat-label">活跃供应商</div>
            <div class="stat-value">{{ total }}</div>
            <el-icon class="stat-icon"><Connection /></el-icon>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card gold">
            <div class="stat-label">今日待更新</div>
            <div class="stat-value">0</div>
            <el-icon class="stat-icon"><Timer /></el-icon>
          </div>
        </el-col>
      </el-row>

      <!-- 数据表格 -->
      <el-table :data="tableData" border stripe style="width: 100%;" v-loading="loading" row-key="id">
        <el-table-column prop="id" label="供应商编号" width="120" align="center">
          <template #default="scope">
            <span class="id-text">#{{ scope.row.id }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="supplierName" label="企业全称" min-width="200">
          <template #default="scope">
            <div style="font-weight: bold; color: #303133;">{{ scope.row.supplierName }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="contactPerson" label="核心联系人" width="120" align="center" />
        <el-table-column prop="contactPhone" label="联系方式" width="150" align="center" />
        <el-table-column prop="address" label="办公地址" show-overflow-tooltip min-width="200" />
        
        <el-table-column label="财务信息" width="220">
          <template #default="scope">
            <div style="font-size: 12px; color: #909399;">
              <div><el-icon><CreditCard /></el-icon> {{ scope.row.bankName }}</div>
              <div>{{ scope.row.bankAccount }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="primary" :icon="Edit" @click="handleEdit(scope.row)">修改</el-button>
            <el-button link type="danger" :icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="searchQuery.pageNum"
          v-model:page-size="searchQuery.pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/修改对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑供应商信息' : '新增供应商伙伴'"
      width="650px"
      destroy-on-close
      class="custom-dialog"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="110px"
        style="padding: 10px 20px;"
      >
        <el-divider content-position="left">基本信息</el-divider>
        <el-form-item label="企业名称" prop="supplierName">
          <el-input v-model="formData.supplierName" placeholder="必须与营业执照一致" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系人" prop="contactPerson">
              <el-input v-model="formData.contactPerson" placeholder="姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input v-model="formData.contactPhone" placeholder="手机/座机" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="详细地址" prop="address">
          <el-input v-model="formData.address" type="textarea" :rows="2" placeholder="省/市/区/街道详细地址" />
        </el-form-item>

        <el-divider content-position="left">财务与备注</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开户银行" prop="bankName">
              <el-input v-model="formData.bankName" placeholder="XX银行XX支行" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="银行账号" prop="bankAccount">
              <el-input v-model="formData.bankAccount" placeholder="16-19位卡号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注说明" prop="remark">
          <el-input v-model="formData.remark" type="textarea" placeholder="合作详情、特殊约定等..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保 存 到 系 统</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus, Search, Edit, Delete, Shop, Connection, Timer, CreditCard, Van } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

// 数据状态
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)

// 搜索参数
const searchQuery = reactive({
  pageNum: 1,
  pageSize: 10,
  name: ''
})

// 表单数据
const formData = ref({
  id: null,
  supplierName: '',
  contactPerson: '',
  contactPhone: '',
  address: '',
  bankName: '',
  bankAccount: '',
  remark: ''
})

// 校验规则
const formRules = {
  supplierName: [{ required: true, message: '请输入供应商企业名称', trigger: 'blur' }],
  contactPerson: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
  contactPhone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  address: [{ required: true, message: '请输入详细地址', trigger: 'blur' }],
  bankName: [{ required: true, message: '请输入开户行', trigger: 'blur' }],
  bankAccount: [{ required: true, message: '请输入银行账号', trigger: 'blur' }]
}

// 获取数据
const fetchList = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/admin/supplier/list', {
      params: searchQuery
    })
    if (res.data.code === 200) {
      tableData.value = res.data.data
      // 注意：分页助手返回的 list 在 data 里，这里由于后端直接返回 List，简单起见我们取长度作为total，
      // 如果使用了真正的 PageInfo，则需要 res.data.data.total，这里假设简单处理
      total.value = res.data.data.length 
    }
  } catch (error) {
    ElMessage.error('供应商数据加载失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  searchQuery.pageNum = 1
  fetchList()
}

// 新增
const handleAdd = () => {
  isEdit.value = false
  formData.value = {
    id: null,
    supplierName: '',
    contactPerson: '',
    contactPhone: '',
    address: '',
    bankName: '',
    bankAccount: '',
    remark: ''
  }
  dialogVisible.value = true
}

// 修改
const handleEdit = (row) => {
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        const url = isEdit.value ? 'http://localhost:8080/admin/supplier/update' : 'http://localhost:8080/admin/supplier/save'
        const method = isEdit.value ? 'put' : 'post'
        const res = await axios[method](url, formData.value)
        if (res.data.code === 200) {
          ElMessage.success(res.data.msg)
          dialogVisible.value = false
          fetchList()
        } else {
          ElMessage.error(res.data.msg)
        }
      } catch (error) {
        ElMessage.error('接口请求异常')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `警告：确定要删除供应商 [${row.supplierName}] 吗？\n删除前系统将自动检查是否存在关联商品。`,
    '高危操作提示',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      const res = await axios.delete(`http://localhost:8080/admin/supplier/delete/${row.id}`)
      if (res.data.code === 200) {
        ElMessage.success(res.data.msg)
        fetchList()
      } else {
        // 这里会显示后端拦截的“存在关联商品”提示
        ElMessageBox.alert(res.data.msg, '拦截提示', { type: 'error' })
      }
    } catch (error) {
      ElMessage.error('删除操作失败')
    }
  }).catch(() => {})
}

// 分页处理
const handleSizeChange = (val) => {
  searchQuery.pageSize = val
  fetchList()
}
const handleCurrentChange = (val) => {
  searchQuery.pageNum = val
  fetchList()
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 100px);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section {
  display: flex;
  align-items: center;
}

.title-icon {
  font-size: 24px;
  color: #409eff;
  margin-right: 12px;
}

.title-text {
  font-size: 20px;
  font-weight: 800;
  color: #2c3e50;
  margin-right: 15px;
}

.count-tag {
  border-radius: 20px;
}

.gradient-btn {
  background: linear-gradient(135deg, #409eff 0%, #1e88e5 100%);
  border: none;
  font-weight: bold;
}

.stat-card {
  padding: 20px;
  border-radius: 12px;
  color: white;
  position: relative;
  overflow: hidden;
  height: 100px;
}

.stat-card.blue { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.stat-card.gold { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); }

.stat-label { font-size: 14px; opacity: 0.9; }
.stat-value { font-size: 32px; font-weight: bold; margin-top: 5px; }
.stat-icon {
  position: absolute;
  right: -10px;
  bottom: -10px;
  font-size: 80px;
  opacity: 0.15;
}

.id-text {
  font-family: 'Courier New', Courier, monospace;
  color: #909399;
  font-weight: bold;
}

.pagination-container {
  margin-top: 25px;
  display: flex;
  justify-content: flex-end;
}

.custom-dialog :deep(.el-dialog__header) {
  padding-bottom: 0;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  padding-bottom: 10px;
}
</style>
