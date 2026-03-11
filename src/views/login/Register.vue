<template>
  <div class="login-container">
    <div class="login-box register-box">
      <div class="login-left">
        <img src="https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg" alt="logo" class="logo" />
        <h2>新客户入驻</h2>
        <p>实名认证 · 安全寄件 · 全程追踪</p>
      </div>
      
      <div class="login-right">
        <div class="login-header">
          <h3>创建您的客户账号</h3>
        </div>
        
        <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules" size="default" label-position="top">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="真实姓名 (寄件人)" prop="customerName">
                <el-input v-model="registerForm.customerName" placeholder="如：张三" :prefix-icon="User" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="手机号码 (作为登录账号)" prop="mobile">
                <el-input v-model="registerForm.mobile" placeholder="11位手机号" :prefix-icon="Phone" clearable />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="身份证号 (物流实名制要求)" prop="idCard">
            <el-input v-model="registerForm.idCard" placeholder="18位法定身份证号码" :prefix-icon="Postcard" clearable />
          </el-form-item>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="设置密码" prop="password">
                <el-input v-model="registerForm.password" type="password" placeholder="至少6位" :prefix-icon="Lock" show-password />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input v-model="registerForm.confirmPassword" type="password" placeholder="再次输入密码" :prefix-icon="Lock" show-password />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="常用联系地址" prop="address">
            <el-input v-model="registerForm.address" placeholder="请输入详细地址，精确到门牌号" :prefix-icon="Location" clearable />
          </el-form-item>

          <el-form-item style="margin-top: 10px;">
            <el-button type="primary" class="login-btn" :loading="loading" @click="handleRegister">
              {{ loading ? '提交中...' : '立即注册' }}
            </el-button>
          </el-form-item>

          <div class="login-footer-links">
            <span class="register-link" @click="goToLogin">
              已有账号？返回登录 <el-icon><Right /></el-icon>
            </span>
          </div>

        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import axios from 'axios'
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Phone, Postcard, Lock, Location, Right } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import CryptoJS from 'crypto-js'
import './login.css' // 直接复用登录页的背景样式

const router = useRouter()
const registerFormRef = ref(null)
const loading = ref(false)

const registerForm = reactive({
  customerName: '',
  mobile: '',
  idCard: '',
  password: '',
  confirmPassword: '',
  address: ''
})

// === 企业级严谨表单校验（正则） ===
// 1. 验证两次密码是否一致
const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}
// 2. 验证手机号正则
const validateMobile = (rule, value, callback) => {
  const reg = /^1[3-9]\d{9}$/
  if (!reg.test(value)) {
    callback(new Error('请输入正确的11位手机号码'))
  } else {
    callback()
  }
}
// 3. 验证身份证正则 (18位)
const validateIdCard = (rule, value, callback) => {
  const reg = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/
  if (!reg.test(value)) {
    callback(new Error('请输入正确的法定身份证号码'))
  } else {
    callback()
  }
}

const registerRules = reactive({
  customerName: [{ required: true, message: '真实姓名不能为空', trigger: 'blur' }],
  mobile: [
    { required: true, message: '手机号不能为空', trigger: 'blur' },
    { validator: validateMobile, trigger: 'blur' }
  ],
  idCard: [
    { required: true, message: '身份证号不能为空', trigger: 'blur' },
    { validator: validateIdCard, trigger: 'blur' }
  ],
  password: [
    { required: true, message: '密码不能为空', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ],
  confirmPassword: [{ required: true, validator: validatePass2, trigger: 'blur' }],
  address: [{ required: true, message: '常用联系地址不能为空', trigger: 'blur' }]
})

// === 提交注册核心逻辑 ===
const handleRegister = () => {
  registerFormRef.value.validate(async (valid) => {
    if (!valid) return false

    loading.value = true
    const encryptedPwd = CryptoJS.SHA256(registerForm.password).toString(CryptoJS.enc.Hex)
    
    try {
      // 真正向 SpringBoot 发起网络请求！
      const response = await axios.post('http://localhost:8080/customer/register', {
        customerName: registerForm.customerName,
        mobile: registerForm.mobile,
        idCard: registerForm.idCard,
        password: encryptedPwd,
        address: registerForm.address
      })

      // 判断后端返回的状态码
      if (response.data.code === 200) {
        ElMessage.success('注册成功！正在为您跳转到登录页...')
        setTimeout(() => {
          router.push('/login')
        }, 1500)
      } else {
        // 如果手机号重复等错误，弹出后端给出的错误提示
        ElMessage.error(response.data.msg)
      }
    } catch (error) {
      ElMessage.error('网络请求失败，请检查后端是否启动！')
      console.error(error)
    } finally {
      loading.value = false
    }
  })
}

// 点击返回登录
const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
/* 针对注册页微调卡片大小，适应更多字段 */
.register-box {
  width: 900px;
  height: 600px; 
}
.login-right {
  padding: 30px 40px;
}
.login-header {
  margin-bottom: 20px;
}
/* 调整表单项的间距，使其更紧凑 */
:deep(.el-form-item) {
  margin-bottom: 18px;
}
:deep(.el-form-item__label) {
  padding-bottom: 2px;
  font-weight: bold;
  color: #606266;
}
</style>