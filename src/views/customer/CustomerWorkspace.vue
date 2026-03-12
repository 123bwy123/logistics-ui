<template>
  <div class="customer-workspace">
    <!-- 1. 顶部搜索区 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="客户姓名">
          <el-input v-model="searchForm.name" placeholder="请输入姓名" clearable />
        </el-form-item>
        <el-form-item label="身份证号">
          <el-input v-model="searchForm.idCard" placeholder="请输入身份证号" clearable />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="searchForm.mobile" placeholder="请输入手机号" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="success" @click="handleAdd">新增客户</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 2. 数据表格区 -->
    <el-card class="table-card">
      <el-table :data="tableData" border stripe v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="编号" width="80" />
        <el-table-column prop="customerName" label="客户姓名" width="120" />
        <el-table-column prop="idCard" label="身份证号" width="180" />
        <el-table-column prop="company" label="工作单位" min-width="150" />
        <el-table-column prop="phone" label="座机" width="120" />
        <el-table-column prop="mobile" label="移动电话" width="120" />
        <el-table-column prop="address" label="联系地址" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="handleEdit(scope.row)">修改</el-button>
            <el-button size="small" type="warning" @click="handleViewOrders(scope.row)">查看订单</el-button>
            <el-popconfirm title="确定要删除该客户吗？" @confirm="handleDelete(scope.row)">
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 3. 新增/修改弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="50%"
      :before-close="handleCloseDialog"
    >
      <el-form ref="customerFormRef" :model="customerForm" :rules="rules" label-width="100px">
        <el-form-item label="客户姓名" prop="customerName">
          <el-input v-model="customerForm.customerName" placeholder="请输入客户姓名" />
        </el-form-item>
        <el-form-item label="身份证号" prop="idCard">
          <el-input v-model="customerForm.idCard" placeholder="请输入身份证号" />
        </el-form-item>
        <el-form-item label="工作单位" prop="company">
          <el-input v-model="customerForm.company" placeholder="请输入工作单位" />
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="座机" prop="phone">
              <el-input v-model="customerForm.phone" placeholder="请输入座机" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="移动电话" prop="mobile">
              <el-input v-model="customerForm.mobile" placeholder="请输入移动电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="联系地址" prop="address">
          <el-input v-model="customerForm.address" placeholder="请输入详细地址" type="textarea" />
        </el-form-item>
        <el-form-item label="邮编" prop="zipCode">
          <el-input v-model="customerForm.zipCode" placeholder="请输入邮编" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 4. 查看订单抽屉 -->
    <el-drawer v-model="orderDrawerVisible" title="客户历史订单" size="60%">
      <el-table :data="orderList" border stripe style="width: 100%" v-loading="orderLoading">
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column prop="createTime" label="下单日期" width="160">
            <template #default="scope">
                {{ formatDate(scope.row.createTime) }}
            </template>
        </el-table-column>
        <el-table-column prop="productName" label="商品名称" min-width="150" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="unitPrice" label="单价" width="100">
            <template #default="scope">¥{{ scope.row.unitPrice }}</template>
        </el-table-column>
        <el-table-column prop="itemAmount" label="总额" width="100">
             <template #default="scope">¥{{ scope.row.itemAmount }}</template>
        </el-table-column>
        <el-table-column prop="orderStatus" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.orderStatus)">
              {{ getStatusText(scope.row.orderStatus) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

// --- 基础配置 ---
const baseURL = 'http://localhost:8080' // 后端地址
const loading = ref(false)

// --- 搜索与列表 ---
const searchForm = reactive({
  name: '',
  idCard: '',
  mobile: ''
})
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const loadData = async () => {
  loading.value = true
  try {
    const res = await axios.get(`${baseURL}/customer/list`, {
      params: {
        page: currentPage.value,
        size: pageSize.value,
        name: searchForm.name,
        idCard: searchForm.idCard,
        mobile: searchForm.mobile
      }
    })
    if (res.data.code === 200) {
      tableData.value = res.data.data.list
      total.value = res.data.data.total
    } else {
      ElMessage.error(res.data.msg || '查询失败')
    }
  } catch (error) {
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

const resetSearch = () => {
  searchForm.name = ''
  searchForm.idCard = ''
  searchForm.mobile = ''
  handleSearch()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  loadData()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  loadData()
}

// --- 新增与修改 ---
const dialogVisible = ref(false)
const dialogTitle = ref('')
const customerFormRef = ref(null)
const customerForm = reactive({
  id: null,
  customerName: '',
  idCard: '',
  company: '',
  phone: '',
  mobile: '',
  address: '',
  zipCode: ''
})

// 自定义校验规则：手机和座机二选一
const validatePhoneOrMobile = (rule, value, callback) => {
  if (!customerForm.phone && !customerForm.mobile) {
    callback(new Error('座机和移动电话至少填写一项'))
  } else {
    callback()
  }
}

const rules = {
  customerName: [{ required: true, message: '请输入客户姓名', trigger: 'blur' }],
  idCard: [{ required: true, message: '请输入身份证号', trigger: 'blur' }],
  address: [{ required: true, message: '请输入联系地址', trigger: 'blur' }],
  phone: [{ validator: validatePhoneOrMobile, trigger: 'blur' }],
  mobile: [{ validator: validatePhoneOrMobile, trigger: 'blur' }]
}

const handleAdd = () => {
  dialogTitle.value = '新增客户'
  customerForm.id = null
  customerForm.customerName = ''
  customerForm.idCard = ''
  customerForm.company = ''
  customerForm.phone = ''
  customerForm.mobile = ''
  customerForm.address = ''
  customerForm.zipCode = ''
  dialogVisible.value = true
  // 重置校验
  if (customerFormRef.value) customerFormRef.value.resetFields()
}

const handleEdit = (row) => {
  dialogTitle.value = '修改客户'
  // 复制数据
  Object.assign(customerForm, row)
  dialogVisible.value = true
  if (customerFormRef.value) customerFormRef.value.clearValidate()
}

const handleCloseDialog = (done) => {
    done()
}

const submitForm = () => {
  customerFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        let res
        if (customerForm.id) {
          // 修改
          res = await axios.put(`${baseURL}/customer/update`, customerForm)
        } else {
          // 新增
          res = await axios.post(`${baseURL}/customer/add`, customerForm)
        }
        
        if (res.data.code === 200) {
          ElMessage.success(customerForm.id ? '修改成功' : '新增成功')
          dialogVisible.value = false
          loadData()
        } else {
          ElMessage.error(res.data.msg || '操作失败')
        }
      } catch (error) {
        ElMessage.error('网络错误')
      }
    }
  })
}

// --- 删除 ---
const handleDelete = async (row) => {
  try {
    const res = await axios.delete(`${baseURL}/customer/${row.id}`)
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      loadData()
    } else {
      ElMessage.error(res.data.msg || '删除失败')
    }
  } catch (error) {
    ElMessage.error('网络错误')
  }
}

// --- 查看订单 ---
const orderDrawerVisible = ref(false)
const orderList = ref([])
const orderLoading = ref(false)

const handleViewOrders = async (row) => {
  orderDrawerVisible.value = true
  orderLoading.value = true
  try {
    const res = await axios.get(`${baseURL}/customer/orders/${row.id}`)
    if (res.data.code === 200) {
      orderList.value = res.data.data
    } else {
      ElMessage.error(res.data.msg || '获取订单失败')
    }
  } catch (error) {
    ElMessage.error('网络错误')
  } finally {
    orderLoading.value = false
  }
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString()
}

// 订单状态显示
const getStatusType = (status) => {
  switch (status) {
    case 7: return 'success' // 已完成
    case 8: return 'danger'  // 失败/取消
    case 1: return 'warning' // 缺货
    default: return 'primary' // 进行中
  }
}

const getStatusText = (status) => {
  // 状态（1=缺货，2=可分配，3=中心库已出库，4=分站已到货，5=任务已分配，6=已领货，7=已完成，8=失败/取消）
  const map = {
    0: '待审核', // 前端可能有0状态
    1: '缺货',
    2: '可分配',
    3: '中心库出库',
    4: '分站到货',
    5: '派送中', // 任务已分配
    6: '已领货',
    7: '已完成',
    8: '已取消',
    9: '已调度' // 自定义状态
  }
  return map[status] || '未知状态'
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.customer-workspace {
  padding: 20px;
}
.search-card {
  margin-bottom: 20px;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
