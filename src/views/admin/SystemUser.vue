<template>
  <div class="app-container">
    <el-card class="box-card">
      <div class="filter-container" style="margin-bottom: 20px;">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增员工账号</el-button>
      </div>

      <el-table :data="tableData" border stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="员工ID" width="80" align="center" />
        <el-table-column prop="username" label="登录账号(工号)" />
		<el-table-column prop="realName" label="真实姓名" />
        <el-table-column prop="role" label="系统角色">
          <template #default="scope">
            <el-tag :type="getRoleTagType(scope.row.role)">{{ formatRole(scope.row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default="scope">
            <el-button size="small" type="primary" :icon="Edit" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" :icon="Delete" @click="handleDelete(scope.row)">停用</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="登录账号" prop="username">
          <el-input v-model="form.username" placeholder="请输入员工账号/工号" />
		 </el-form-item>
		<el-form-item label="真实姓名" prop="realName">
		    <el-input v-model="form.realName" placeholder="请输入员工真实姓名" />
		</el-form-item>
        <el-form-item label="分配角色" prop="role">
                  <el-select v-model="form.role" placeholder="请选择系统角色" style="width: 100%;">
                    <el-option label="客服人员 (Service)" :value="1" />
                    <el-option label="调度中心管理员 (Dispatcher)" :value="2" />
                    <el-option label="中心库房管理员 (Center Warehouse)" :value="3" />
                    <el-option label="分站库房管理员 (Station Warehouse)" :value="8" />
                    <el-option label="配送员/快递小哥 (Courier)" :value="4" />
                    <el-option label="分站管理员 (Station Admin)" :value="5" />
                    <el-option label="配送中心管理员 (Center Admin)" :value="6" />
                    <el-option label="财务中心管理员 (Finance Admin)" :value="7" />
                  </el-select>
        </el-form-item>
        <el-alert v-if="!form.id" title="初始密码默认为 123456" type="info" show-icon style="margin-bottom: 15px;"/>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

// --- 状态数据 ---
const tableData = ref([])
const loading = ref(false)

// 弹窗相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)
const form = reactive({
  id: null,
  username: '',
  realName: '', 
  role: ''
})
const rules = reactive({
  username: [{ required: true, message: '账号不能为空', trigger: 'blur' }],
  realName: [{ required: true, message: '真实姓名不能为空', trigger: 'blur' }], 
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
})

// --- 方法 ---
// 1. 获取列表数据
const fetchList = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/admin/user/list')
    if (res.data.code === 200) {
      tableData.value = res.data.data
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (error) {
    ElMessage.error('获取列表失败，请检查后端服务')
  } finally {
    loading.value = false
  }
}

// 2. 格式化角色显示 (字典转换)
const formatRole = (role) => {
  const map = { 
    1: '客服人员', 
    2: '调度管理员', 
    3: '中心库房管理员', // <--- 修改这行
    4: '配送员',
    5: '分站管理员',
    6: '配送中心管理员',
    7: '财务管理员',
    8: '分站库房管理员', // <--- 新增这行
    0: '系统管理员'
  }
  return map[role] || '未知角色'
}

const getRoleTagType = (role) => {
  const map = { 
    1: 'success', 
    2: 'warning', 
    3: 'info', 
    4: '', // 默认蓝色
    5: 'danger',
    6: 'warning',
    7: 'success',
	8: 'info',
    0: 'danger'
  }
  return map[role] || 'primary'
}

// 3. 点击新增
const handleAdd = () => {
  form.id = null
  form.username = ''
  form.realName = '' 
  form.role = ''
  dialogTitle.value = '新增员工账号'
  dialogVisible.value = true
}

// 4. 点击编辑
const handleEdit = (row) => {
  form.id = row.id
  form.username = row.username
  form.realName = row.realName 
  form.role = row.role
  dialogTitle.value = '编辑员工账号'
  dialogVisible.value = true
}

// 5. 提交表单 (新增或修改)
const submitForm = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    
    try {
      let res;
      if (form.id) {
        res = await axios.put('http://localhost:8080/admin/user/update', form)
      } else {
        res = await axios.post('http://localhost:8080/admin/user/add', form)
      }

      if (res.data.code === 200) {
        ElMessage.success(res.data.msg)
        dialogVisible.value = false
        fetchList() // 刷新列表
      } else {
        ElMessage.error(res.data.msg)
      }
    } catch (error) {
      ElMessage.error('操作失败！')
    }
  })
}

// 6. 删除 (停用)
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要停用账号 [${row.username}] 吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    const res = await axios.delete(`http://localhost:8080/admin/user/delete/${row.id}`)
    if (res.data.code === 200) {
      ElMessage.success('账号已停用')
      fetchList()
    } else {
      ElMessage.error(res.data.msg)
    }
  }).catch(() => {})
}

// 初始化加载
onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.app-container { height: 100%; }
.box-card { min-height: 100%; }
</style>