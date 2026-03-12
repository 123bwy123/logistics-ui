<template>
  <div class="order-workspace">
    <el-tabs v-model="activeTab" type="border-card" class="main-tabs">

      <!-- ===================== TAB 1：新订下单 ===================== -->
      <el-tab-pane label="📦 新订下单" name="newOrder">
        <div class="two-col-layout">
          <!-- 左侧：客户搜索 + 商品列表 -->
          <div class="left-panel">
            <!-- 客户搜索 -->
            <el-card class="panel-card" shadow="never">
              <template #header>
                <span class="panel-title"><el-icon><User /></el-icon> 定位客户</span>
                <el-tag v-if="newOrder.selectedCustomer" type="success" size="small" effect="dark">
                  已选：{{ newOrder.selectedCustomer.customer_name || newOrder.selectedCustomer.customerName }}
                </el-tag>
              </template>
              <el-form :inline="true" size="small">
                <el-form-item label="姓名">
                  <el-input v-model="newOrder.searchName" placeholder="模糊" clearable style="width:100px" />
                </el-form-item>
                <el-form-item label="手机">
                  <el-input v-model="newOrder.searchMobile" placeholder="模糊" clearable style="width:120px" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" size="small" @click="searchCustomer('newOrder')">搜索</el-button>
                </el-form-item>
              </el-form>
              <el-table
                v-if="newOrder.customerList.length"
                :data="newOrder.customerList" border stripe size="small"
                highlight-current-row max-height="180"
                @current-change="(row) => selectCustomer(row, 'newOrder')">
                <el-table-column prop="customerName" label="姓名" width="80" />
                <el-table-column prop="mobile" label="手机" width="120" />
                <el-table-column prop="address" label="地址" min-width="120" show-overflow-tooltip />
              </el-table>
            </el-card>

            <!-- 商品列表 -->
            <el-card class="panel-card" shadow="never" style="margin-top:12px">
              <template #header>
                <span class="panel-title"><el-icon><Goods /></el-icon> 商品列表</span>
                <el-input v-model="productKeyword" placeholder="商品名称" size="small" style="width:150px"
                  clearable @keyup.enter="loadProducts" />
                <el-button size="small" type="primary" plain @click="loadProducts" style="margin-left:6px">搜索</el-button>
              </template>
              <el-table :data="productList" border stripe size="small" max-height="260" v-loading="productLoading">
                <el-table-column prop="productName" label="商品名称" min-width="140" />
                <el-table-column label="单价" width="80" align="right">
                  <template #default="s">¥{{ Number(s.row.price).toFixed(2) }}</template>
                </el-table-column>
                <el-table-column label="库存" width="60" align="center">
                  <template #default="s">
                    <el-tag size="small" :type="s.row.totalStock > 0 ? 'success' : 'danger'">{{ s.row.totalStock }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="加入" width="130" align="center">
                  <template #default="s">
                    <el-input-number v-model="tempQty[s.row.id]" :min="1" :max="999" size="small" style="width:80px" />
                    <el-button size="small" type="success" link icon="Plus" @click="addToCart(s.row)" style="margin-left:4px" />
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </div>

          <!-- 右侧：购物车 + 确认提交 -->
          <div class="right-panel">
            <el-card class="panel-card" shadow="never" style="height:100%">
              <template #header>
                <span class="panel-title"><el-icon><ShoppingCart /></el-icon> 购物车</span>
                <span class="total-badge">合计：<strong class="price-text">¥{{ cartTotal.toFixed(2) }}</strong></span>
              </template>

              <div v-if="cart.length === 0" class="empty-cart">
                <el-empty description="购物车为空，请从左侧选择商品" :image-size="80" />
              </div>

              <div v-for="(item, idx) in cart" :key="idx" class="cart-item">
                <div class="cart-item-name">{{ item.productName }}</div>
                <div class="cart-item-actions">
                  <span class="cart-unit-price">¥{{ item.unitPrice.toFixed(2) }} ×</span>
                  <el-input-number v-model="item.quantity" :min="1" :max="999" size="small" style="width:90px" />
                  <span class="cart-subtotal">= ¥{{ (item.unitPrice * item.quantity).toFixed(2) }}</span>
                  <el-button type="danger" size="small" icon="Delete" circle link @click="removeFromCart(idx)" />
                </div>
              </div>

              <el-divider />

              <el-form label-width="80px" size="small">
                <el-form-item label="收货地址">
                  <el-input v-model="newOrder.receiveAddress" type="textarea" :rows="2" placeholder="详细地址" />
                </el-form-item>
                <el-form-item label="期望送达">
                  <el-date-picker v-model="newOrder.requireDate" type="date" value-format="YYYY-MM-DD"
                    placeholder="选择日期" style="width:100%" />
                </el-form-item>
              </el-form>

              <el-button type="primary" style="width:100%;margin-top:8px" :loading="newOrder.submitting"
                :disabled="!newOrder.selectedCustomer || cart.length === 0"
                @click="submitNewOrder">
                🚀 一键生成订单
              </el-button>
              <div v-if="!newOrder.selectedCustomer" class="hint-tip">⚠ 请先在左侧搜索并选择客户</div>
            </el-card>
          </div>
        </div>
      </el-tab-pane>

      <!-- ===================== TAB 2：退订 ===================== -->
      <el-tab-pane label="❌ 订单退订" name="cancel">
        <el-card shadow="never">
          <template #header><span class="panel-title">搜索客户，选择要退订的订单</span></template>
          <el-form :inline="true" size="small">
            <el-form-item label="客户姓名">
              <el-input v-model="cancel.searchName" clearable style="width:120px" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="cancel.searchMobile" clearable style="width:130px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="small" @click="searchCustomer('cancel')">搜索客户</el-button>
            </el-form-item>
          </el-form>

          <el-table v-if="cancel.customerList.length" :data="cancel.customerList" border stripe size="small"
            highlight-current-row max-height="180" @current-change="(row) => loadOrders(row, 'cancel')"
            style="margin-bottom:12px">
            <el-table-column prop="customerName" label="姓名" width="90" />
            <el-table-column prop="mobile" label="手机" width="130" />
          </el-table>

          <el-table v-if="cancel.orders.length" :data="cancel.orders" border stripe size="small"
            highlight-current-row max-height="200" @current-change="(row) => cancel.selectedOrder = row">
            <el-table-column prop="order_no" label="订单号" min-width="180" />
            <el-table-column label="类型" width="70" align="center">
              <template #default="s"><el-tag size="small">{{ orderTypeLabel(s.row.order_type) }}</el-tag></template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="s">
                <el-tag :type="statusTagType(s.row.order_status)" size="small">{{ statusLabel(s.row.order_status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="total_amount" label="金额" width="90" align="right">
              <template #default="s">¥{{ Number(s.row.total_amount || 0).toFixed(2) }}</template>
            </el-table-column>
          </el-table>

          <div v-if="cancel.selectedOrder" class="action-form">
            <el-divider>确认退订订单：{{ cancel.selectedOrder.order_no }}</el-divider>
            <el-form label-width="80px" size="small" style="max-width:500px">
              <el-form-item label="退订原因">
                <el-input v-model="cancel.reason" type="textarea" :rows="2" placeholder="请填写退订原因（必填）" />
              </el-form-item>
              <el-form-item>
                <el-button type="danger" :loading="cancel.submitting" @click="submitCancel">确认退订</el-button>
                <el-button @click="cancel.selectedOrder = null">取消</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- ===================== TAB 3：换货 ===================== -->
      <el-tab-pane label="🔄 售后换货" name="exchange">
        <el-card shadow="never">
          <template #header><span class="panel-title">定位客户，选择已完成订单进行换货</span></template>
          <el-form :inline="true" size="small">
            <el-form-item label="客户姓名">
              <el-input v-model="exchange.searchName" clearable style="width:120px" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="exchange.searchMobile" clearable style="width:130px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="small" @click="searchCustomer('exchange')">搜索客户</el-button>
            </el-form-item>
          </el-form>

          <el-table v-if="exchange.customerList.length" :data="exchange.customerList" border stripe size="small"
            highlight-current-row max-height="150" @current-change="(row) => loadOrders(row, 'exchange')"
            style="margin-bottom:12px">
            <el-table-column prop="customerName" label="姓名" width="90" />
            <el-table-column prop="mobile" label="手机" width="130" />
          </el-table>

          <el-table v-if="exchange.orders.length" :data="exchange.orders" border stripe size="small"
            highlight-current-row max-height="160" @current-change="(row) => loadOrderItems(row, 'exchange')"
            style="margin-bottom:12px">
            <el-table-column prop="order_no" label="订单号" min-width="180" />
            <el-table-column label="状态" width="100" align="center">
              <template #default="s">
                <el-tag :type="statusTagType(s.row.order_status)" size="small">{{ statusLabel(s.row.order_status) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="exchange.items.length" class="action-form">
            <el-divider>选择要换货的商品</el-divider>
            <el-table :data="exchange.items" border stripe size="small" max-height="160"
              highlight-current-row @current-change="(row) => exchange.selectedItem = row">
              <el-table-column prop="product_name" label="商品名称" min-width="150" />
              <el-table-column prop="quantity" label="原购数量" width="90" align="center" />
              <el-table-column label="单价" width="80" align="right">
                <template #default="s">¥{{ Number(s.row.price || 0).toFixed(2) }}</template>
              </el-table-column>
            </el-table>

            <div v-if="exchange.selectedItem" style="margin-top:12px">
              <el-form label-width="100px" size="small" style="max-width:500px">
                <el-form-item label="换货数量">
                  <el-input-number v-model="exchange.quantity" :min="1"
                    :max="exchange.selectedItem.quantity" />
                  <span style="margin-left:8px;color:#909399">（最多 {{ exchange.selectedItem.quantity }} 件）</span>
                </el-form-item>
                <el-form-item label="换货原因">
                  <el-input v-model="exchange.reason" type="textarea" :rows="2" placeholder="请填写换货原因" />
                </el-form-item>
                <el-form-item label="要求完成日期">
                  <el-date-picker v-model="exchange.requireDate" type="date" value-format="YYYY-MM-DD"
                    placeholder="选择日期" style="width:100%" />
                </el-form-item>
                <el-form-item>
                  <el-button type="warning" :loading="exchange.submitting" @click="submitExchange">确认换货申请</el-button>
                </el-form-item>
              </el-form>
            </div>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- ===================== TAB 4：退货 ===================== -->
      <el-tab-pane label="↩ 售后退货" name="return">
        <el-card shadow="never">
          <template #header><span class="panel-title">定位客户，选择已完成订单进行退货</span></template>
          <el-form :inline="true" size="small">
            <el-form-item label="客户姓名">
              <el-input v-model="ret.searchName" clearable style="width:120px" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="ret.searchMobile" clearable style="width:130px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="small" @click="searchCustomer('return')">搜索客户</el-button>
            </el-form-item>
          </el-form>

          <el-table v-if="ret.customerList.length" :data="ret.customerList" border stripe size="small"
            highlight-current-row max-height="150" @current-change="(row) => loadOrders(row, 'return')"
            style="margin-bottom:12px">
            <el-table-column prop="customerName" label="姓名" width="90" />
            <el-table-column prop="mobile" label="手机" width="130" />
          </el-table>

          <el-table v-if="ret.orders.length" :data="ret.orders" border stripe size="small"
            highlight-current-row max-height="160" @current-change="(row) => loadOrderItems(row, 'return')"
            style="margin-bottom:12px">
            <el-table-column prop="order_no" label="订单号" min-width="180" />
            <el-table-column label="状态" width="100" align="center">
              <template #default="s">
                <el-tag :type="statusTagType(s.row.order_status)" size="small">{{ statusLabel(s.row.order_status) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="ret.items.length" class="action-form">
            <el-divider>选择退货商品</el-divider>
            <el-table :data="ret.items" border stripe size="small" max-height="160"
              highlight-current-row @current-change="(row) => ret.selectedItem = row">
              <el-table-column prop="product_name" label="商品名称" min-width="150" />
              <el-table-column prop="quantity" label="原购数量" width="90" align="center" />
              <el-table-column label="单价" width="80" align="right">
                <template #default="s">¥{{ Number(s.row.price || 0).toFixed(2) }}</template>
              </el-table-column>
            </el-table>

            <div v-if="ret.selectedItem" style="margin-top:12px">
              <el-form label-width="100px" size="small" style="max-width:500px">
                <el-form-item label="退货数量">
                  <el-input-number v-model="ret.quantity" :min="1" :max="ret.selectedItem.quantity" />
                  <span style="margin-left:8px;color:#909399">（最多 {{ ret.selectedItem.quantity }} 件）</span>
                </el-form-item>
                <el-form-item label="退货原因">
                  <el-input v-model="ret.reason" type="textarea" :rows="2" placeholder="请填写退货原因" />
                </el-form-item>
                <el-form-item label="要求完成日期">
                  <el-date-picker v-model="ret.requireDate" type="date" value-format="YYYY-MM-DD"
                    placeholder="选择日期" style="width:100%" />
                </el-form-item>
                <el-form-item>
                  <el-button type="danger" :loading="ret.submitting" @click="submitReturn">确认退货申请</el-button>
                </el-form-item>
              </el-form>
            </div>
          </div>
        </el-card>
      </el-tab-pane>

    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { User, ShoppingCart, Goods } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const BASE = 'http://localhost:8080'
const activeTab = ref('newOrder')

// ======================== 通用工具函数 ========================

const statusLabel = (s) => {
  const map = { 0:'待审核', 1:'缺货', 2:'可分配', 3:'已出库', 4:'分站到货', 5:'已分配', 6:'已领货', 7:'已完成', 8:'已取消', 9:'已调度' }
  return map[s] ?? `状态${s}`
}
const statusTagType = (s) => {
  if (s === 7) return 'success'
  if (s === 8) return 'info'
  if (s === 1) return 'danger'
  if (s >= 3) return 'warning'
  return ''
}
const orderTypeLabel = (t) => ({ 1:'新订', 2:'退订', 3:'换货', 4:'退货' }[t] ?? '未知')

// 搜索客户（通用）
const searchCustomer = async (tab) => {
  const state = getState(tab)
  try {
    const res = await axios.get(`${BASE}/customer/list`, {
      params: { page: 1, size: 50, name: state.searchName, mobile: state.searchMobile }
    })
    if (res.data.code === 200) {
      state.customerList = res.data.data.list || []
      if (!state.customerList.length) ElMessage.warning('未找到匹配客户')
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch { ElMessage.error('网络错误') }
}

// 加载客户订单（通用）
const loadOrders = async (row, tab) => {
  if (!row) return
  const state = getState(tab)
  state.selectedCustomer = row
  state.orders = []
  state.items = []
  state.selectedOrder = null
  state.selectedItem = null
  try {
    const res = await axios.get(`${BASE}/customer/order/byCustomer`, { params: { customerId: row.id } })
    if (res.data.code === 200) {
      state.orders = res.data.data || []
    }
  } catch { ElMessage.error('网络错误') }
}

// 加载订单商品明细（换货/退货）
const loadOrderItems = async (row, tab) => {
  if (!row) return
  const state = getState(tab)
  state.selectedOrder = row
  state.items = []
  state.selectedItem = null
  try {
    const res = await axios.get(`${BASE}/customer/order/items`, { params: { orderId: row.id } })
    if (res.data.code === 200) {
      state.items = res.data.data || []
    }
  } catch { ElMessage.error('网络错误') }
}

const getState = (tab) => {
  if (tab === 'newOrder') return newOrder
  if (tab === 'cancel') return cancel
  if (tab === 'exchange') return exchange
  return ret
}

// ======================== TAB1：新订 ========================

const newOrder = reactive({
  searchName: '', searchMobile: '',
  customerList: [], selectedCustomer: null,
  receiveAddress: '', requireDate: '',
  submitting: false
})
const productKeyword = ref('')
const productList = ref([])
const productLoading = ref(false)
const tempQty = reactive({})
const cart = ref([])

const loadProducts = async () => {
  productLoading.value = true
  try {
    const res = await axios.get(`${BASE}/customer/order/products`,
      { params: { keyword: productKeyword.value || undefined } })
    if (res.data.code === 200) {
      productList.value = res.data.data
      productList.value.forEach(p => { if (!tempQty[p.id]) tempQty[p.id] = 1 })
    }
  } catch { ElMessage.error('加载商品失败') }
  finally { productLoading.value = false }
}

const selectCustomer = (row, tab) => {
  if (!row) return
  const state = getState(tab)
  state.selectedCustomer = row
  if (tab === 'newOrder') newOrder.receiveAddress = row.address || ''
  ElMessage.success(`已选客户：${row.customerName || row.customer_name}`)
}

const addToCart = (product) => {
  const qty = tempQty[product.id] || 1
  const existing = cart.value.find(i => i.productId === product.id)
  if (existing) {
    existing.quantity += qty
  } else {
    cart.value.push({ productId: product.id, productName: product.productName, unitPrice: Number(product.price), quantity: qty })
  }
  ElMessage.success(`${product.productName} × ${qty} 已加入购物车`)
}

const removeFromCart = (idx) => cart.value.splice(idx, 1)

const cartTotal = computed(() => cart.value.reduce((s, i) => s + i.unitPrice * i.quantity, 0))

const submitNewOrder = async () => {
  if (!newOrder.selectedCustomer) return ElMessage.warning('请先选择客户！')
  if (!cart.value.length) return ElMessage.warning('购物车为空！')
  if (!newOrder.receiveAddress) return ElMessage.warning('请填写收货地址！')

  newOrder.submitting = true
  try {
    const res = await axios.post(`${BASE}/customer/order/newOrder`, {
      customerId: newOrder.selectedCustomer.id,
      operatorId: null,
      orderType: 1,
      receiveAddress: newOrder.receiveAddress,
      requireDate: newOrder.requireDate,
      itemList: cart.value.map(i => ({ productId: i.productId, quantity: i.quantity }))
    })
    if (res.data.code === 200) {
      ElMessageBox.alert(res.data.data, '✅ 订单创建结果', { type: 'success',
        callback: () => { cart.value = []; newOrder.receiveAddress = ''; newOrder.requireDate = ''; loadProducts() }
      })
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch { ElMessage.error('网络错误') }
  finally { newOrder.submitting = false }
}

// ======================== TAB2：退订 ========================

const cancel = reactive({
  searchName: '', searchMobile: '',
  customerList: [], selectedCustomer: null,
  orders: [], selectedOrder: null,
  reason: '', submitting: false
})

const submitCancel = async () => {
  if (!cancel.selectedOrder) return ElMessage.warning('请先选择要退订的订单！')
  if (!cancel.reason.trim()) return ElMessage.warning('请填写退订原因！')

  await ElMessageBox.confirm(
    `确认退订订单【${cancel.selectedOrder.order_no}】？此操作不可撤销。`,
    '二次确认', { type: 'warning' }
  )

  cancel.submitting = true
  try {
    const res = await axios.post(`${BASE}/customer/order/cancel`, {
      orderId: cancel.selectedOrder.id,
      cancelReason: cancel.reason,
      operatorId: null
    })
    if (res.data.code === 200) {
      ElMessage.success(res.data.data || '退订成功！')
      cancel.orders = []
      cancel.selectedOrder = null
      cancel.reason = ''
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  } finally { cancel.submitting = false }
}

// ======================== TAB3：换货 ========================

const exchange = reactive({
  searchName: '', searchMobile: '',
  customerList: [], selectedCustomer: null,
  orders: [], selectedOrder: null,
  items: [], selectedItem: null,
  quantity: 1, reason: '', requireDate: '',
  submitting: false
})

const submitExchange = async () => {
  if (!exchange.selectedOrder || !exchange.selectedItem) return ElMessage.warning('请选择订单和商品！')
  if (!exchange.reason.trim()) return ElMessage.warning('请填写换货原因！')
  if (!exchange.requireDate) return ElMessage.warning('请选择要求完成日期！')

  exchange.submitting = true
  try {
    const res = await axios.post(`${BASE}/customer/order/exchange`, {
      originalOrderId: exchange.selectedOrder.id,
      productId: exchange.selectedItem.product_id,
      quantity: exchange.quantity,
      reason: exchange.reason,
      requireDate: exchange.requireDate,
      operatorId: null
    })
    if (res.data.code === 200) {
      ElMessage.success(res.data.data || '换货申请成功！')
      exchange.selectedItem = null; exchange.reason = ''; exchange.requireDate = ''; exchange.quantity = 1
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch { ElMessage.error('网络错误') }
  finally { exchange.submitting = false }
}

// ======================== TAB4：退货 ========================

const ret = reactive({
  searchName: '', searchMobile: '',
  customerList: [], selectedCustomer: null,
  orders: [], selectedOrder: null,
  items: [], selectedItem: null,
  quantity: 1, reason: '', requireDate: '',
  submitting: false
})

const submitReturn = async () => {
  if (!ret.selectedOrder || !ret.selectedItem) return ElMessage.warning('请选择订单和商品！')
  if (!ret.reason.trim()) return ElMessage.warning('请填写退货原因！')
  if (!ret.requireDate) return ElMessage.warning('请选择要求完成日期！')

  ret.submitting = true
  try {
    const res = await axios.post(`${BASE}/customer/order/return`, {
      originalOrderId: ret.selectedOrder.id,
      productId: ret.selectedItem.product_id,
      quantity: ret.quantity,
      reason: ret.reason,
      requireDate: ret.requireDate,
      operatorId: null
    })
    if (res.data.code === 200) {
      ElMessage.success(res.data.data || '退货申请成功！')
      ret.selectedItem = null; ret.reason = ''; ret.requireDate = ''; ret.quantity = 1
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch { ElMessage.error('网络错误') }
  finally { ret.submitting = false }
}

// ======================== 初始化 ========================
onMounted(() => loadProducts())
</script>

<style scoped>
.order-workspace { padding: 10px; }

.main-tabs { min-height: 600px; }

/* 新订：左右分栏 */
.two-col-layout {
  display: flex;
  gap: 16px;
  min-height: 580px;
}
.left-panel { flex: 1.2; display: flex; flex-direction: column; }
.right-panel { flex: 0.8; }

.panel-card :deep(.el-card__header) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f5f7fa;
}
.panel-card :deep(.el-card__body) { padding: 12px; }
.panel-title { font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 4px; flex: 1; }

.empty-cart { padding: 20px 0; }

.cart-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}
.cart-item-name { font-size: 13px; font-weight: 500; margin-bottom: 4px; color: #303133; }
.cart-item-actions { display: flex; align-items: center; gap: 6px; }
.cart-unit-price { color: #909399; font-size: 12px; }
.cart-subtotal { color: #409eff; font-weight: 600; font-size: 13px; flex: 1; }

.total-badge { font-size: 13px; color: #606266; margin-left: auto; }
.price-text { font-size: 18px; color: #e6a23c; font-weight: 700; }

.hint-tip { font-size: 12px; color: #e6a23c; margin-top: 6px; text-align: center; }

.action-form { margin-top: 12px; padding: 12px; background: #fafafa; border-radius: 6px; }
</style>
