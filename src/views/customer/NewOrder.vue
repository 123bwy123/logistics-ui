<template>
  <div class="customer-container">
    <div class="header">
      <div class="logo-box">
        <img src="https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg" alt="logo" class="logo">
        <h2>客户服务大厅 - 智能物流系统</h2>
      </div>
      <div class="user-info">
        <span>欢迎您，尊贵的客户</span>
        <el-button type="danger" link @click="logout" style="margin-left: 15px;">退出登录</el-button>
      </div>
    </div>

    <div class="main-content">
      <el-card class="order-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <h3><el-icon><Van /></el-icon> 发起新的配送请求</h3>
          </div>
        </template>

        <el-form ref="orderFormRef" :model="orderForm" :rules="rules" label-width="120px" size="large">
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="期望送达日期" prop="requireDate">
                <el-date-picker 
                  v-model="orderForm.requireDate" 
                  type="date" 
                  placeholder="请选择日期" 
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%" 
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="详细收货地址" prop="receiveAddress">
            <el-input 
              v-model="orderForm.receiveAddress" 
              placeholder="请输入 姓名 + 电话 + 省市区详细街道" 
              type="textarea" 
              :rows="2"
            />
          </el-form-item>

          <el-divider border-style="dashed">货物明细</el-divider>

          <div v-for="(item, index) in orderForm.itemList" :key="index" class="item-row">
            <el-form-item :label="'商品 ' + (index + 1)" :prop="'itemList.' + index + '.productId'" :rules="{ required: true, message: '请选择商品', trigger: 'change' }">
              <el-select v-model="item.productId" placeholder="请选择要寄送的商品" style="width: 200px;">
                <el-option
                  v-for="product in productList"
                  :key="product.id"
                  :label="product.productName || product.product_name"
                  :value="product.id"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="数量" label-width="60px" :prop="'itemList.' + index + '.quantity'" :rules="{ required: true, message: '数量不能为空', trigger: 'blur' }">
              <el-input-number v-model="item.quantity" :min="1" :max="999" />
            </el-form-item>

            <el-button v-if="orderForm.itemList.length > 1" type="danger" icon="Delete" circle plain @click="removeItem(index)" style="margin-left: 20px;" />
          </div>

          <el-form-item>
            <el-button type="success" plain icon="Plus" @click="addItem">继续添加商品</el-button>
          </el-form-item>

          <el-divider />

          <div style="text-align: center; margin-top: 30px;">
            <el-button type="primary" size="large" :loading="loading" @click="submitOrder" style="width: 250px; font-size: 16px; letter-spacing: 2px;">
              确认下单
            </el-button>
          </div>

        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Van, Delete, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const orderFormRef = ref(null)
const loading = ref(false)

// 表单数据绑定
const orderForm = reactive({
  // 【动态获取真实身份】：如果取不到就给个报错默认值 0
    customerId: parseInt(localStorage.getItem('currentUserId')) || 0, 
    requireDate: '',
    receiveAddress: '',
    itemList: [
      { productId: null, quantity: 1 }
    ]
})

const productList = ref([])

onMounted(async () => {
  const storedId = localStorage.getItem('currentUserId')
  if (storedId) {
    orderForm.customerId = parseInt(storedId)
  } else {
    ElMessage.error('请先登录！')
    router.push('/login')
  }

  // 动态获取可售商品
  try {
    const res = await axios.get('http://localhost:8080/customer/order/products')
    if (res.data.code === 200) {
      productList.value = res.data.data
    }
  } catch (error) {
    console.error('加载商品失败', error)
  }
})

// 校验规则
const rules = reactive({
  requireDate: [{ required: true, message: '期望送达日期不能为空', trigger: 'change' }],
  receiveAddress: [{ required: true, message: '收货地址不能为空', trigger: 'blur' }]
})

// 增加一行商品
const addItem = () => {
  orderForm.itemList.push({ productId: null, quantity: 1 })
}

// 移除一行商品
const removeItem = (index) => {
  orderForm.itemList.splice(index, 1)
}

// 核心：提交订单发给后端
const submitOrder = () => {
  orderFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    try {
      const res = await axios.post('http://localhost:8080/customer/order/submit', orderForm)
      
      if (res.data.code === 200) {
        ElMessageBox.alert(res.data.msg, '下单成功', {
          confirmButtonText: '确定',
          type: 'success',
          callback: () => {
            // 下单成功后清空表单
            orderForm.requireDate = ''
            orderForm.receiveAddress = ''
            orderForm.itemList = [{ productId: null, quantity: 1 }]
          }
        })
      } else {
        ElMessage.error(res.data.msg)
      }
    } catch (error) {
      ElMessage.error('服务器请求失败，请检查网络或后端是否启动')
      console.error(error)
    } finally {
      loading.value = false
    }
  })
}

const logout = () => {
  router.push('/login')
}
</script>

<style scoped>
.customer-container {
  min-height: 100vh;
  background-color: #f4f7fb;
}

/* 顶部导航样式 */
.header {
  height: 60px;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  color: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
.logo-box {
  display: flex;
  align-items: center;
}
.logo {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 15px;
}
.header h2 {
  margin: 0;
  font-size: 20px;
  letter-spacing: 1px;
}
.user-info {
  font-size: 14px;
}

/* 主体内边距 */
.main-content {
  padding: 40px;
  display: flex;
  justify-content: center;
}

/* 居中的白色卡片 */
.order-card {
  width: 900px;
  border-radius: 10px;
}
.card-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
}

/* 商品明细同行显示 */
.item-row {
  display: flex;
  align-items: flex-start;
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}
</style>