<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-left">
        <img src="https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg" alt="logo" class="logo" />
        <h2>智能物流管理系统</h2>
        <p>高效 · 智能 · 安全的现代化物流平台</p>
      </div>
      
      <div class="login-right">
        <div class="login-header">
          <h3>欢迎登录</h3>
        </div>
        
        <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" size="large">
          
          <el-form-item prop="role">
            <el-select v-model="loginForm.role" placeholder="请选择您的角色" style="width: 100%;">
              <el-option
                v-for="item in roleOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item prop="username">
            <el-input v-model="loginForm.username" :placeholder="loginForm.role === 'customer' ? '请输入手机号/身份证号' : '请输入系统员工账号'" :prefix-icon="User" clearable />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" :prefix-icon="Lock" show-password @keyup.enter="handleLogin" />
          </el-form-item>
          
          <el-form-item prop="captcha">
            <div class="captcha-container">
              <el-input v-model="loginForm.captcha" placeholder="验证码" :prefix-icon="Key" style="flex: 1; margin-right: 15px;" @keyup.enter="handleLogin" />
              <div class="captcha-img" @click="refreshCaptcha" title="看不清？换一张">
                <span class="mock-captcha">{{ captchaCode }}</span>
              </div>
            </div>
          </el-form-item>

          <div class="login-options">
            <el-checkbox v-model="loginForm.rememberMe">记住账号</el-checkbox>
            <el-checkbox v-model="loginForm.agreePolicy">
              我已阅读并同意 <a href="javascript:void(0)" class="link-text">《用户协议》</a> 与 <a href="javascript:void(0)" class="link-text">《隐私政策》</a>
            </el-checkbox>
          </div>

          <el-form-item>
            <el-button type="primary" class="login-btn" :loading="loading" @click="handleLogin">
              {{ loading ? '身份验证中...' : '登 录' }}
            </el-button>
          </el-form-item>
          
          <div class="login-footer-links">
            <span class="register-link" @click="handleRegister">
              {{ loginForm.role === 'customer' ? '客户注册' : '内部人员开通账号?' }}
            </span>
            <span class="divider">|</span>
            <span class="forgot-link" @click="handleForgotPassword">忘记密码</span>
          </div>

        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { User, Lock, Key } from '@element-plus/icons-vue'
import './login.css'
import { useLogin } from './login.js'

const {
  loginFormRef, loading, captchaCode, loginForm, loginRules, roleOptions,
  refreshCaptcha, handleLogin, handleRegister, handleForgotPassword
} = useLogin()
</script>