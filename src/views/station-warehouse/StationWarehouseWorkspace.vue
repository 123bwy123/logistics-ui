<template>
  <div class="app-container">
    <el-card class="box-card" shadow="hover">
      <el-tabs v-model="activeTab" class="demo-tabs" @tab-click="handleTabClick">
        
        <el-tab-pane label="待验货入库 (接大车)" name="incoming">
          <el-alert title="大货车到达网点后，请核对订单号，确认无误点击【验货入库】。" type="warning" show-icon style="margin-bottom: 15px;" />
          <el-table :data="incomingData" border stripe v-loading="loading1">
            <el-table-column prop="orderNo" label="客户订单号" align="center" />
            <el-table-column prop="receiveAddress" label="收件地址" min-width="200" show-overflow-tooltip />
            <el-table-column label="当前状态" align="center">
              <template #default><el-tag type="warning">运输中(待入网点)</el-tag></template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center">
              <template #default="scope">
                <el-button size="small" type="success" @click="doArrive(scope.row.id)">验货入库</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="待移交小哥 (发快件)" name="handover">
          <el-alert title="站长派单后，小哥来领货时，核对无误后点击【确认移交】。" type="success" show-icon style="margin-bottom: 15px;" />
          <el-table :data="handoverData" border stripe v-loading="loading2">
            <el-table-column prop="orderNo" label="客户订单号" align="center" />
            <el-table-column prop="receiveAddress" label="收件地址" min-width="200" show-overflow-tooltip />
            <el-table-column label="当前状态" align="center">
              <template #default><el-tag type="primary">站长已派单(待取件)</el-tag></template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center">
              <template #default="scope">
                <el-button size="small" type="primary" icon="Position" @click="doPickup(scope.row.id)">确认移交小哥</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Position } from '@element-plus/icons-vue'
import axios from 'axios'

const activeTab = ref('incoming')
const incomingData = ref([])
const handoverData = ref([])
const loading1 = ref(false)
const loading2 = ref(false)

const loadIncoming = async () => {
  loading1.value = true
  const res = await axios.get('http://localhost:8080/admin/stationWarehouse/incoming')
  incomingData.value = res.data.data
  loading1.value = false
}

const loadHandover = async () => {
  loading2.value = true
  const res = await axios.get('http://localhost:8080/admin/stationWarehouse/handover')
  handoverData.value = res.data.data
  loading2.value = false
}

const handleTabClick = (tab) => {
  if (tab.paneName === 'incoming') loadIncoming()
  if (tab.paneName === 'handover') loadHandover()
}

// 入库动作 (3->4)
const doArrive = async (id) => {
  const res = await axios.post(`http://localhost:8080/admin/stationWarehouse/arrive?orderId=${id}`)
  if(res.data.code === 200) {
    ElMessage.success(res.data.msg)
    loadIncoming() // 刷新列表
  }
}

// 移交小哥动作 (5->6)
const doPickup = async (id) => {
  const res = await axios.post(`http://localhost:8080/admin/stationWarehouse/pickup?orderId=${id}`)
  if(res.data.code === 200) {
    ElMessage.success(res.data.msg)
    loadHandover() // 刷新列表
  }
}

onMounted(() => {
  loadIncoming()
})
</script>