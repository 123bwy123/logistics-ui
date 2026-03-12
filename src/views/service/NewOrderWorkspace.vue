<template>
  <div class="new-order-workspace">
    <!-- ===== 第一步：定位客户 ===== -->
    <el-card class="section-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="section-title">
            <el-icon><User /></el-icon> 第一步：定位客户
          </span>
          <el-tag v-if="selectedCustomer" type="success" size="large" effect="dark" style="font-size: 14px;">
            ✅ 已选客户：{{ selectedCustomer.customerName }}（{{ selectedCustomer.mobile || selectedCustomer.phone }}）
          </el-tag>
        </div>
      </template>

      <el-form :inline="true" :model="customerSearch" class="search-form">
        <el-form-item label="客户姓名">
          <el-input v-model="customerSearch.name" placeholder="模糊搜索" clearable @keyup.enter="searchCustomer" />
        </el-form-item>
        <el-form-item label="身份证号">
          <el-input v-model="customerSearch.idCard" placeholder="模糊搜索" clearable @keyup.enter="searchCustomer" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="customerSearch.mobile" placeholder="模糊搜索" clearable @keyup.enter="searchCustomer" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="searchCustomer">搜索客户</el-button>
        </el-form-item>
      </el-form>

      <el-table
        v-if="customerList.length > 0"
        :data="customerList"
        border stripe
        v-loading="customerLoading"
        highlight-current-row
        @current-change="handleSelectCustomer"
        style="width: 100%; margin-top: 10px;"
        max-height="250"
      >
        <el-table-column prop="id" label="ID" width="60" align="center" />
        <el-table-column prop="customerName" label="姓名" width="100" />
        <el-table-column prop="idCard" label="身份证号" width="180" />
        <el-table-column prop="mobile" label="手机" width="130" />
        <el-table-column prop="phone" label="座机" width="130" />
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
      </el-table>
    </el-card>

    <!-- ===== 第二步：挑选商品入车 ===== -->
    <el-card class="section-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="section-title">
            <el-icon><ShoppingCart /></el-icon> 第二步：挑选商品（购物车）
          </span>
          <el-tag v-if="cart.length > 0" type="warning" effect="dark" size="large">
            🛒 已选 {{ cart.length }} 件商品
          </el-tag>
        </div>
      </template>

      <!-- 商品搜索 -->
      <el-form :inline="true" style="margin-bottom: 10px;">
        <el-form-item label="搜索商品">
          <el-input v-model="productKeyword" placeholder="输入商品名称" clearable @keyup.enter="loadProducts" style="width: 250px;" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" plain icon="Search" @click="loadProducts">搜索</el-button>
          <el-button plain @click="productKeyword = ''; loadProducts()">显示全部</el-button>
        </el-form-item>
      </el-form>

      <!-- 商品列表 -->
      <el-table :data="productList" border stripe v-loading="productLoading" max-height="300" style="width: 100%;">
        <el-table-column prop="productName" label="商品名称" min-width="180" />
        <el-table-column prop="productCode" label="编码" width="120" />
        <el-table-column prop="price" label="单价" width="100" align="right">
          <template #default="scope">¥{{ Number(scope.row.price).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="totalStock" label="库存" width="80" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.totalStock > 0 ? 'success' : 'danger'" size="small">
              {{ scope.row.totalStock }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default="scope">
            <el-input-number
              v-model="tempQuantities[scope.row.id]"
              :min="1"
              :max="999"
              size="small"
              style="width: 100px; margin-right: 8px;"
            />
            <el-button type="success" size="small" icon="Plus" @click="addToCart(scope.row)">加入</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 购物车明细 -->
      <div v-if="cart.length > 0" class="cart-section">
        <el-divider content-position="left">
          <el-icon><ShoppingCart /></el-icon> 本单待购清单
        </el-divider>
        <el-table :data="cart" border stripe style="width: 100%;">
          <el-table-column type="index" label="#" width="50" align="center" />
          <el-table-column prop="productName" label="商品名称" min-width="180" />
          <el-table-column prop="unitPrice" label="单价" width="100" align="right">
            <template #default="scope">¥{{ scope.row.unitPrice.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="数量" width="150" align="center">
            <template #default="scope">
              <el-input-number v-model="scope.row.quantity" :min="1" :max="999" size="small" style="width: 110px;" />
            </template>
          </el-table-column>
          <el-table-column label="小计" width="120" align="right">
            <template #default="scope">
              <span class="subtotal">¥{{ (scope.row.unitPrice * scope.row.quantity).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="scope">
              <el-button type="danger" size="small" icon="Delete" circle @click="removeFromCart(scope.$index)" />
            </template>
          </el-table-column>
        </el-table>
        <div class="cart-total">
          订单总额：<span class="total-price">¥{{ cartTotal.toFixed(2) }}</span>
        </div>
      </div>
    </el-card>

    <!-- ===== 第三步：确认订单信息并提交 ===== -->
    <el-card class="section-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="section-title">
            <el-icon><Document /></el-icon> 第三步：确认订单信息
          </span>
        </div>
      </template>

      <el-form ref="orderFormRef" :model="orderForm" :rules="orderRules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="收货地址" prop="receiveAddress">
              <el-input v-model="orderForm.receiveAddress" type="textarea" :rows="2" placeholder="请输入详细收货地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="期望送达日期" prop="requireDate">
              <el-date-picker
                v-model="orderForm.requireDate"
                type="date"
                placeholder="请选择日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <div style="text-align: center; margin-top: 20px;">
          <el-button
            type="primary"
            size="large"
            :loading="submitLoading"
            :disabled="!selectedCustomer || cart.length === 0"
            @click="submitOrder"
            style="width: 280px; font-size: 16px; letter-spacing: 2px;"
          >
            <el-icon><Check /></el-icon> 一键生成订单
          </el-button>
          <p v-if="!selectedCustomer" style="color: #e6a23c; margin-top: 8px; font-size: 13px;">⚠️ 请先在第一步选择客户</p>
          <p v-else-if="cart.length === 0" style="color: #e6a23c; margin-top: 8px; font-size: 13px;">⚠️ 请先在第二步添加商品到购物车</p>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { User, ShoppingCart, Document, Search, Plus, Delete, Check } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const baseURL = 'http://localhost:8080'

// ==================== 第一步：客户搜索 ====================
const customerSearch = reactive({ name: '', idCard: '', mobile: '' })
const customerList = ref([])
const customerLoading = ref(false)
const selectedCustomer = ref(null)

const searchCustomer = async () => {
  customerLoading.value = true
  try {
    const res = await axios.get(`${baseURL}/customer/list`, {
      params: {
        page: 1,
        size: 50,
        name: customerSearch.name,
        idCard: customerSearch.idCard,
        mobile: customerSearch.mobile
      }
    })
    if (res.data.code === 200) {
      customerList.value = res.data.data.list
      if (customerList.value.length === 0) {
        ElMessage.warning('未找到匹配的客户')
      }
    } else {
      ElMessage.error(res.data.msg || '搜索失败')
    }
  } catch (error) {
    ElMessage.error('网络错误')
  } finally {
    customerLoading.value = false
  }
}

const handleSelectCustomer = (row) => {
  if (!row) return
  selectedCustomer.value = row
  // 自动填充收货地址
  orderForm.receiveAddress = row.address || ''
  ElMessage.success(`已选中客户：${row.customerName}`)
}

// ==================== 第二步：商品选购 ====================
const productList = ref([])
const productLoading = ref(false)
const productKeyword = ref('')
const tempQuantities = reactive({}) // 每个商品的临时数量输入
const cart = ref([]) // 购物车

const loadProducts = async () => {
  productLoading.value = true
  try {
    const res = await axios.get(`${baseURL}/customer/order/products`, {
      params: { keyword: productKeyword.value || undefined }
    })
    if (res.data.code === 200) {
      productList.value = res.data.data
      // 初始化临时数量
      productList.value.forEach(p => {
        if (!tempQuantities[p.id]) tempQuantities[p.id] = 1
      })
    } else {
      ElMessage.error(res.data.msg || '加载商品失败')
    }
  } catch (error) {
    ElMessage.error('网络错误')
  } finally {
    productLoading.value = false
  }
}

const addToCart = (product) => {
  const qty = tempQuantities[product.id] || 1
  // 检查是否已在购物车
  const existing = cart.value.find(item => item.productId === product.id)
  if (existing) {
    existing.quantity += qty
    ElMessage.success(`${product.productName} 数量已更新为 ${existing.quantity}`)
  } else {
    cart.value.push({
      productId: product.id,
      productName: product.productName,
      unitPrice: Number(product.price),
      quantity: qty,
      stock: product.totalStock
    })
    ElMessage.success(`${product.productName} × ${qty} 已加入购物车`)
  }
}

const removeFromCart = (index) => {
  cart.value.splice(index, 1)
}

// 计算购物车总额
const cartTotal = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
})

// ==================== 第三步：确认并提交 ====================
const orderFormRef = ref(null)
const submitLoading = ref(false)
const orderForm = reactive({
  receiveAddress: '',
  requireDate: ''
})
const orderRules = {
  receiveAddress: [{ required: true, message: '收货地址不能为空', trigger: 'blur' }],
  requireDate: [{ required: true, message: '请选择期望送达日期', trigger: 'change' }]
}

const submitOrder = () => {
  orderFormRef.value.validate(async (valid) => {
    if (!valid) return

    // 组装提交数据
    const submitData = {
      customerId: selectedCustomer.value.id,
      operatorId: parseInt(localStorage.getItem('currentUserId')) || 0,
      orderType: 1, // 新订
      receiveAddress: orderForm.receiveAddress,
      requireDate: orderForm.requireDate,
      itemList: cart.value.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    }

    submitLoading.value = true
    try {
      const res = await axios.post(`${baseURL}/customer/order/newOrder`, submitData)
      if (res.data.code === 200) {
        ElMessageBox.alert(res.data.data, '订单创建结果', {
          confirmButtonText: '确定',
          type: 'success',
          callback: () => {
            // 清空购物车和表单
            cart.value = []
            orderForm.receiveAddress = ''
            orderForm.requireDate = ''
            selectedCustomer.value = null
            customerList.value = []
            // 刷新商品列表的库存
            loadProducts()
          }
        })
      } else {
        ElMessage.error(res.data.msg || '订单创建失败')
      }
    } catch (error) {
      ElMessage.error('网络错误，请检查后端服务')
    } finally {
      submitLoading.value = false
    }
  })
}

// ==================== 初始化 ====================
onMounted(() => {
  loadProducts()
})
</script>

<style scoped>
.new-order-workspace {
  padding: 15px;
}
.section-card {
  margin-bottom: 15px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.section-title {
  font-weight: bold;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #303133;
}
.search-form {
  margin-bottom: 0;
}
.cart-section {
  margin-top: 15px;
}
.cart-total {
  text-align: right;
  margin-top: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.total-price {
  color: #e6a23c;
  font-size: 22px;
  font-weight: 700;
}
.subtotal {
  font-weight: 600;
  color: #409eff;
}
</style>
