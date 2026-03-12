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
        <el-table-column prop="roleIds" label="当前角色">
          <template #default="scope">
            <el-tag v-for="roleId in scope.row.roleIds" :key="roleId" style="margin-right: 5px;">
              {{ (roleList && roleList.find(r => r.id === roleId)) ? roleList.find(r => r.id === roleId).roleName : '未知角色' }}
            </el-tag>
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
        <el-form-item label="分配角色" prop="roleIds">
          <el-select v-model="form.roleIds" multiple placeholder="请分配系统角色" style="width: 100%;">
            <el-option
              v-for="item in roleList"
              :key="item.id"
              :label="item.roleName"
              :value="item.id"
            />
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
const roleList = ref([])

// 弹窗相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)
const form = reactive({
  id: null,
  username: '',
  realName: '', 
  roleIds: []
})
const rules = reactive({
  username: [{ required: true, message: '账号不能为空', trigger: 'blur' }],
  realName: [{ required: true, message: '真实姓名不能为空', trigger: 'blur' }], 
  roleIds: [{ type: 'array', required: true, message: '请至少选择一个角色', trigger: 'change' }]
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

const fetchRoles = async () => {
  try {
    const res = await axios.get('http://localhost:8080/admin/sys/role/list')
    if (res.data.code === 200) {
      roleList.value = res.data.data
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (error) {
    ElMessage.error('获取角色列表失败')
  }
}

// 2. 格式化角色显示 (显示角色名称)
const getRoleNameById = (roleId) => {
  const role = roleList.value.find(item => item.id === roleId)
  return role ? role.roleName : '未知角色'
}

// 3. 点击新增
const handleAdd = () => {
  form.id = null
  form.username = ''
  form.realName = '' 
  form.roleIds = []
  dialogTitle.value = '新增员工账号'
  dialogVisible.value = true
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 4. 点击编辑
const handleEdit = (row) => {
  form.id = row.id
  form.username = row.username
  form.realName = row.realName 
  form.roleIds = row.roleIds || []
  dialogTitle.value = '编辑员工账号'
  dialogVisible.value = true
  if (formRef.value) {
    formRef.value.clearValidate()
  }
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
        // 保存角色关联
        const userIdToAssign = form.id || res.data.data; // Use existing ID or new ID from response
        if (userIdToAssign) {
          await axios.post(`http://localhost:8080/admin/user/assignRoles?userId=${userIdToAssign}`, form.roleIds)
        }
        ElMessage.success('操作成功')
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
  fetchRoles()
  fetchList()
})
</script>

<style scoped>
.app-container { height: 100%; }
.box-card { min-height: 100%; }
</style>