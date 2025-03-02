// app.js
const apiConfig = require('./config/api.config.js')

App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    
    // 获取设备信息，用于自适应布局
    this.getSystemInfo()
  },
  
  // 获取系统信息
  getSystemInfo() {
    try {
      const systemInfo = wx.getSystemInfoSync()
      this.globalData.systemInfo = systemInfo
      
      // 判断是否为iPhone X及以上机型（有安全区域的机型）
      const model = systemInfo.model
      const isIphoneX = /iPhone X|iPhone 1[1-9]|iPhone 2[0-9]/.test(model)
      
      this.globalData.isIphoneX = isIphoneX
      this.globalData.statusBarHeight = systemInfo.statusBarHeight
      
      // 计算安全区域
      if (systemInfo.safeArea) {
        this.globalData.safeArea = systemInfo.safeArea
      }
    } catch (e) {
      console.error('获取设备信息失败', e)
    }
  },
  
  globalData: {
    userInfo: null,
    // 从配置文件导入API信息
    apiKey: apiConfig.apiKey,
    apiUrl: apiConfig.apiUrl,
    imageModelName: apiConfig.imageModelName,
    textModelName: apiConfig.textModelName,
    // 系统信息
    systemInfo: null,
    isIphoneX: false,
    statusBarHeight: 20,
    safeArea: null
  }
}) 