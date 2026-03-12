import axios from 'axios'
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import CryptoJS from 'crypto-js'
import { useRouter } from 'vue-router'

export function useLogin() {const router = useRouter() // 初始化路由
	
  const loginFormRef = ref(null)
  const loading = ref(false)
  const captchaCode = ref('X7B2')

  // 1. 定义系统支持的所有角色 (严格匹配需求文档)

    const roleOptions = [
      { label: '系统管理员 (System Admin)', value: 'admin' }, 
      { label: '客户 (Customer)', value: 'customer' },
      { label: '客服人员 (Service)', value: 'service' },
      { label: '调度中心管理员 (Dispatcher)', value: 'dispatcher' },
      { label: '分站管理员-站长 (Station Admin)', value: 'station_admin' },
      // 👇 --- 【核心修改：一分为二】 --- 👇
      { label: '中心库房管理员 (Center Warehouse)', value: 'center_warehouse' },
      { label: '分站库房管理员 (Station Warehouse)', value: 'station_warehouse' },
      // 👆 ---------------------------- 👆
      { label: '配送中心管理员 (Center Admin)', value: 'center_admin' },
      { label: '财务中心管理员 (Finance)', value: 'finance_admin' },
      { label: '配送员 (Courier)', value: 'courier' },
      { label: '供应商 (Supplier)', value: 'supplier' }
    ]

  // 2. 表单数据扩展：增加角色、记住我、同意协议
  const loginForm = reactive({
    role: 'customer', // 默认选中客户
    username: '',
    password: '',
    captcha: '',
    rememberMe: false,
    agreePolicy: false
  })

  // 3. 实时表单校验规则
  const loginRules = reactive({
    role: [{ required: true, message: '请选择登录角色', trigger: 'change' }],
    username: [{ required: true, message: '账号不能为空', trigger: 'blur' }],
    password: [{ required: true, message: '密码不能为空', trigger: 'blur' }],
    captcha: [{ required: true, message: '验证码不能为空', trigger: 'blur' }]
  })

  // 刷新验证码
  const refreshCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    captchaCode.value = code
  }

  // 密码前端加密
  const encryptPassword = (pwd) => {
    return CryptoJS.SHA256(pwd).toString(CryptoJS.enc.Hex)
  }

  // 4. 登录核心逻辑
  // 把 handleLogin 改成 async 异步函数
    const handleLogin = () => {
      if (!loginForm.agreePolicy) {
        ElMessage.warning('请先阅读并同意《用户协议》与《隐私政策》')
        return
      }
  
      loginFormRef.value.validate(async (valid) => { // 注意这里加了 async
        if (!valid) return false
  
        if (loginForm.captcha.toUpperCase() !== captchaCode.value.toUpperCase()) {
          ElMessage.error('验证码错误，请重新输入！')
          refreshCaptcha()
          loginForm.captcha = ''
          return
        }
  
        loading.value = true
        const encryptedPwd = encryptPassword(loginForm.password)
        
        try {
                const response = await axios.post('http://localhost:8080/auth/login', {
                  role: loginForm.role,
                  username: loginForm.username,
                  password: encryptedPwd,
                  rememberMe: loginForm.rememberMe
                })
        
                if (response.data.code === 200) {
							const realUserId = response.data.data;
                            localStorage.setItem('currentUserId', realUserId);
                            localStorage.setItem('currentUserRole', loginForm.role);
                            
                            // 严格基于角色的路由分发，彻底杜绝越权！
                            if (loginForm.role === 'customer') {
								ElMessage.success('登录成功！正在进入客户下单大厅...')
								router.push('/customer') 
							  } 
							  else if (loginForm.role === 'admin') {
								router.push('/admin')
							  } 
							  else if (loginForm.role === 'service') {
								ElMessage.success('欢迎客服专员！正在进入客服工作台...')
								router.push('/admin/service-workspace')
							  } 
							  // 👇 ===== 【就是这里！加上调度中心管理员的跳转】 ===== 👇
							  else if (loginForm.role === 'dispatcher') {
								ElMessage.success('欢迎调度管理员！正在进入调度控制台...')
								router.push('/admin/dispatch-workspace')
							  } 
							else if (loginForm.role === 'station_admin') {
								ElMessage.success('欢迎网点主管！正在进入分站工作台...')
								router.push('/admin/station-workspace')
							  }
								else if (loginForm.role === 'center_warehouse') {
								  ElMessage.success('欢迎中心库房主管！正在进入总库发货系统...')
								  router.push('/admin/warehouse-workspace') // 跳去中心库房 (发调拨单的)
								} 
								else if (loginForm.role === 'station_warehouse') {
								  ElMessage.success('欢迎分站库管！正在进入网点接货系统...')
								  router.push('/admin/station-warehouse-workspace') // 跳去分站库房 (接车验货的)
								}
								else if (loginForm.role === 'courier') {
									ElMessage.success('欢迎骑士！正在进入接单终端...')
									router.push('/admin/courier-workspace')
								  }
								  else if (loginForm.role === 'center_admin') {
									  ElMessage.success('欢迎主管！正在加载库存监控大屏...')
									  router.push('/admin/center-workspace')
									}
									// 【正确姿势】：直接认准 supplier 字符串！
								  else if (loginForm.role === 'supplier') {
									ElMessage.success('欢迎厂家老总！正在加载发货大厅...')
									router.push('/admin/supplier-workspace')
								  }
								  // 👇 【新增：在这里补上财务老总的绿色通道！】 👇
								else if (loginForm.role === 'finance_admin') {
								  ElMessage.success('欢迎财务总监！正在进入结算与发票中心...')
								  router.push('/admin/finance-workspace')
								}
								
							  else {
								ElMessage.info('您的专属工作台正在快马加鞭开发中...')
                            }
                  
                } else {
                  ElMessage.error(response.data.msg) 
                  refreshCaptcha() 
                  loginForm.captcha = ''
                }
              } catch (error) {
				  ElMessage.error('网络请求失败，请检查后端是否启动！')
				  console.error(error)
        } finally {
          loading.value = false
        }
      })
    }

  // 5. 注册拦截逻辑 (体现业务规则)
  const handleRegister = () => {
      if (loginForm.role !== 'customer') {
        ElMessage.info('内部系统用户需由【系统管理员】统一开通，暂不开放自主注册！')
      } else {
        // 如果是客户，直接通过路由跳转到注册页！
        router.push('/register')
      }
    }

  // 6. 忘记密码
  const handleForgotPassword = () => {
    ElMessage.success('正在跳转至找回密码页面...')
  }

  onMounted(() => {
    refreshCaptcha()
  })

  return {
    loginFormRef, loading, captchaCode, loginForm, loginRules, roleOptions,
    refreshCaptcha, handleLogin, handleRegister, handleForgotPassword
  }
}