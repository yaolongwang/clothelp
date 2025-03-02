const app = getApp()
const apiConfig = require('../../config/api.config.js')

Page({
  data: {
    tempImagePath: '',
    occasions: ['日常', '职场', '约会', '聚会', '运动', '旅游'],
    occasionIndex: 0,
    base64Image: '',
    isUploading: false,
    // 添加设备信息相关数据
    isIphoneX: false,
    isLandscape: false,
    statusBarHeight: 20,
    // 添加按钮显示控制
    showAnalyzeButton: false
  },

  onLoad() {
    // 获取全局设备信息
    this.setData({
      isIphoneX: app.globalData.isIphoneX,
      statusBarHeight: app.globalData.statusBarHeight
    })
    
    // 检测屏幕方向
    this.checkOrientation()
  },
  
  // 页面显示时检测方向
  onShow() {
    this.checkOrientation()
  },
  
  // 屏幕旋转时重新检测方向
  onResize() {
    this.checkOrientation()
  },
  
  // 检测屏幕方向
  checkOrientation() {
    try {
      const { windowWidth, windowHeight } = wx.getSystemInfoSync()
      const isLandscape = windowWidth > windowHeight
      this.setData({ isLandscape })
    } catch (e) {
      console.error('获取屏幕方向失败', e)
    }
  },

  // 选择图片
  chooseImage() {
    // 防止重复点击
    if (this.data.isUploading) return
    
    this.setData({ isUploading: true })
    
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempImagePath = res.tempFiles[0].tempFilePath
        this.setData({
          tempImagePath,
          showAnalyzeButton: true // 上传照片后显示分析按钮
        })
        // 将图片转为base64
        this.imageToBase64(tempImagePath)
      },
      complete: () => {
        this.setData({ isUploading: false })
      }
    })
  },

  // 图片转base64
  imageToBase64(filePath) {
    wx.showLoading({
      title: '处理图片中',
    })
    
    wx.getFileSystemManager().readFile({
      filePath,
      encoding: 'base64',
      success: (res) => {
        this.setData({
          base64Image: res.data
        })
        // 确保loading被关闭
        setTimeout(() => {
          wx.hideLoading()
          
          // 显示提示，引导用户点击分析按钮
          wx.showToast({
            title: '请点击"分析穿搭"按钮',
            icon: 'none',
            duration: 2000
          })
        }, 500)
      },
      fail: (error) => {
        console.error('图片转base64失败', error)
        wx.hideLoading()
        wx.showToast({
          title: '图片处理失败',
          icon: 'none'
        })
        this.setData({ isUploading: false })
      }
    })
  },

  // 选择场合变化
  bindOccasionChange(e) {
    this.setData({
      occasionIndex: e.detail.value
    })
  },

  // 分析穿搭
  analyzeOutfit() {
    if (!this.data.tempImagePath) {
      wx.showToast({
        title: '请先上传照片',
        icon: 'none'
      })
      return
    }
    
    // 防止重复点击
    if (this.data.isUploading) return
    this.setData({ isUploading: true })

    wx.showLoading({
      title: '分析中...',
    })

    const selectedOccasion = this.data.occasions[this.data.occasionIndex]
    
    // 构建请求体，简化提问
    const requestBody = {
      model: app.globalData.imageModelName,
      messages: [
        {
          role: "user", 
          content: [
            {
              type: "text",
              text: `分析这套穿搭在${selectedOccasion}场合的合适度，给出1-10分评分，给分差距要拉大，对于丑的穿搭，要勇敢给低分。简明扼要地列出优点、缺点和具体改进建议。使用Markdown格式并保持简洁，去掉开头结尾的客套话。`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${this.data.base64Image}`
              }
            }
          ]
        }
      ]
    }

    wx.request({
      url: app.globalData.apiUrl,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${app.globalData.apiKey}`
      },
      data: requestBody,
      success: (res) => {
        if (res.statusCode === 200 && res.data.choices && res.data.choices[0]) {
          // 提取回复
          const responseText = res.data.choices[0].message.content
          
          // 解析评分
          let score = 0
          const scoreMatch = responseText.match(/(\d+(\.\d+)?)\s*分/)
          if (scoreMatch) {
            score = parseFloat(scoreMatch[1])
          }
          
          // 将结果保存到全局变量，以便结果页面使用
          app.globalData.analysisResult = {
            score: score,
            feedback: responseText,
            occasion: selectedOccasion,
            imagePath: this.data.tempImagePath
          }
          
          // 跳转到结果页
          wx.navigateTo({
            url: '/pages/result/result'
          })
        } else {
          throw new Error('接口返回格式异常')
        }
      },
      fail: (error) => {
        console.error('分析请求失败', error)
        wx.showToast({
          title: '分析失败，请重试',
          icon: 'none'
        })
      },
      complete: () => {
        wx.hideLoading()
        this.setData({ isUploading: false })
      }
    })
  }
}) 