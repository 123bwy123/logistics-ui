<template>
  <div class="app-container">
    <el-card shadow="never">
      <template #header>
        <div class="header-box">
          <span>角色管理</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增角色</el-button>
        </div>
      </template>

      <el-table :data="tableData" border v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="roleName" label="角色名称" />
        <el-table-column prop="roleKey" label="权限标识符" />
        <el-table-column label="内置角色" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.isBuiltin ? 'info' : 'success'">
              {{ scope.row.isBuiltin ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" align="center">
          <template #default="scope">
            <el-button size="small" type="primary" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="success" @click="handleAssign(scope.row)">分配权限</el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDelete(scope.row)"
              :disabled="scope.row.isBuiltin === 1"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 角色编辑弹窗 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="如：物流分析师" />
        </el-form-item>
        <el-form-item label="权限字符" prop="roleKey">
          <el-input v-model="form.roleKey" placeholder="如：logistics_analyst" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 权限分配弹窗 -->
    <el-dialog title="权限分配" v-model="permDialogVisible" width="400px">
      <el-tree
        ref="permTreeRef"
        :data="permTreeData"
        show-checkbox
        node-key="id"
        :props="{ label: 'name', children: 'children' }"
        default-expand-all
      />
      <template #footer>
        <el-button @click="permDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPerms">更新权限</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const tableData = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const permDialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)
const permTreeRef = ref(null)
const permTreeData = ref([])

const form = reactive({
  id: null,
  roleName: '',
  roleKey: ''
})

const rules = {
  roleName: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
  roleKey: [{ required: true, message: '权限字符不能为空', trigger: 'blur' }]
}

let activeRoleId = null

const fetchList = async () => {
  loading.value = true
  const res = await axios.get('http://localhost:8080/admin/sys/role/list')
  tableData.value = res.data.data
  loading.value = false
}

const fetchPermTree = async () => {
  const res = await axios.get('http://localhost:8080/admin/sys/permission/tree')
  permTreeData.value = res.data.data
}

const handleAdd = () => {
  form.id = null
  form.roleName = ''
  form.roleKey = ''
  dialogTitle.value = '新增角色'
  dialogVisible.value = true
}

const handleEdit = (row) => {
  if (row.isBuiltin === 1) {
    ElMessage.warning('内置角色禁止修改核心信息！')
    // 依然允许打开，但前端应限制敏感字段修改（可选）
  }
  form.id = row.id
  form.roleName = row.roleName
  form.roleKey = row.roleKey
  dialogTitle.value = '编辑角色'
  dialogVisible.value = true
}

const submitForm = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    const api = form.id ? 'update' : 'save'
    const res = await axios[form.id ? 'put' : 'post'](`http://localhost:8080/admin/sys/role/${api}`, form)
    if (res.data.code === 200) {
      ElMessage.success('操作成功')
      dialogVisible.value = false
      fetchList()
    } else {
      ElMessage.error(res.data.msg)
    }
  })
}

const handleAssign = async (row) => {
  activeRoleId = row.id
  permDialogVisible.value = true
  // 加载该角色的权限
  const res = await axios.get(`http://localhost:8080/admin/sys/permission/role/${row.id}`)
  if (res.data.code === 200) {
    // 树勾选，注意处理父节点半选状态（ElementUI 特性，全设 ID 会导致父子全选）
    // 这里简单设置
    permTreeRef.value.setCheckedKeys(res.data.data)
  }
}

const submitPerms = async () => {
  const keys = permTreeRef.value.getCheckedKeys()
  const res = await axios.post(`http://localhost:8080/admin/sys/role/assign?roleId=${activeRoleId}`, keys)
  if (res.data.code === 200) {
    ElMessage.success('权限更新成功')
    permDialogVisible.value = false
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该自定义角色吗？', '提示', { type: 'warning' }).then(async () => {
    const res = await axios.delete(`http://localhost:8080/admin/sys/role/delete/${row.id}`)
    if (res.data.code === 200) {
      ElMessage.success('已删除')
      fetchList()
    } else {
        ElMessage.error(res.data.msg)
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchList()
  fetchPermTree()
})
</script>

<style scoped>
.app-container { padding: 20px; }
.header-box { display: flex; justify-content: space-between; align-items: center; }
</style>
