const app = getApp()

// Markdown简单解析函数
function parseMarkdown(markdown) {
  if (!markdown) return '';
  
  // 处理标题
  let html = markdown
    .replace(/### (.*?)\n/g, '<h3 style="font-size:30rpx;font-weight:bold;margin:16rpx 0;">$1</h3>')
    .replace(/## (.*?)\n/g, '<h2 style="font-size:32rpx;font-weight:bold;margin:20rpx 0;">$1</h2>')
    .replace(/# (.*?)\n/g, '<h1 style="font-size:36rpx;font-weight:bold;margin:24rpx 0;">$1</h1>');
  
  // 处理无序列表（修复渲染问题）
  html = html.replace(/- (.*?)(?:\n|$)/g, '<div style="margin:10rpx 0;padding-left:20rpx;position:relative;"><span style="position:absolute;left:0;">•</span><span style="margin-left:10rpx;">$1</span></div>');
  
  // 处理有序列表
  html = html.replace(/\n\d+\. (.*?)(?:\n|$)/g, '<div style="margin:10rpx 0;padding-left:20rpx;">• $1</div>');
  
  // 处理加粗和斜体
  html = html
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // 处理换行
  html = html.replace(/\n/g, '<br>');
  
  return html;
}

Page({
  data: {
    score: 0,
    feedback: '',
    rawFeedback: '', // 原始反馈文本
    advantagesHtml: '',
    suggestionsHtml: '',
    occasion: '',
    imagePath: '',
    scoreStars: [],
    // 添加设备信息相关数据
    isIphoneX: false,
    isLandscape: false,
    statusBarHeight: 20,
    safeAreaBottom: 0,
    // 添加彩纸数据
    confettiItems: [],
    // 处理状态
    isProcessing: false
  },

  onLoad() {
    // 获取设备信息
    this.setData({
      isIphoneX: app.globalData.isIphoneX,
      statusBarHeight: app.globalData.statusBarHeight,
      safeAreaBottom: app.globalData.safeArea ? app.globalData.safeArea.bottom - app.globalData.safeArea.height : 0
    })
    
    // 检测屏幕方向
    this.checkOrientation()
    
    // 获取全局变量中的分析结果
    const result = app.globalData.analysisResult
    if (!result) {
      wx.showToast({
        title: '数据加载错误',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    // 设置数据
    this.setData({
      score: result.score,
      rawFeedback: result.feedback,
      feedback: result.feedback,
      occasion: result.occasion,
      imagePath: result.imagePath
    })

    // 生成星星数组
    this.generateStars()
    
    // 使用第二个AI处理文本
    this.processTextWithAI()
    
    // 添加动画效果（延迟执行，等待页面渲染完成）
    setTimeout(() => {
      this.animateStars()
      
      // 如果分数大于等于7，显示彩纸动画
      if (this.data.score >= 7) {
        this.generateConfetti()
      }
    }, 500)
  },

  // 使用第二个AI处理文本
  processTextWithAI() {
    const feedback = this.data.rawFeedback;
    if (!feedback || feedback.trim() === '') {
      console.error('反馈内容为空');
      this.processContent();  // 使用原有方法作为备选
      return;
    }
    
    // 防止重复请求
    if (this.data.isProcessing) return;
    this.setData({ isProcessing: true });
    
    // 显示加载中
    wx.showLoading({
      title: '优化内容中...'
    });
    
    // 构建提示词
    const prompt = `
我需要你帮我整理一段关于穿搭分析的文本。原始文本如下：

---
${feedback}
---

请将这段文本整理为两部分：
1. 优缺点部分：包括穿搭优点和缺点，以Markdown格式输出，使用### 优点和### 缺点作为标题。
2. 改进建议部分：所有建议内容，以无序列表(-)形式呈现，确保每条建议单独一行。

只需返回整理好的两部分内容，不要有任何前言和额外解释。确保输出格式如下：

<优缺点>
### 优点
- 优点1
- 优点2

### 缺点
- 缺点1
- 缺点2

<改进建议>
- 建议1
- 建议2
- 建议3
    `;
    
    // 构建请求体
    const requestBody = {
      model: app.globalData.textModelName,
      messages: [
        {
          role: "system", 
          content: "你是一个专业的文本整理助手，擅长提取和整理信息。"
        },
        {
          role: "user",
          content: prompt
        }
      ]
    };
    
    // 发送请求
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
          const responseText = res.data.choices[0].message.content;
          
          // 解析结果
          try {
            // 提取优缺点和建议部分
            const advantagesMatch = responseText.match(/<优缺点>([\s\S]*?)(?=<改进建议>|$)/);
            const suggestionsMatch = responseText.match(/<改进建议>([\s\S]*?)$/);
            
            let advantages = '';
            let suggestions = '';
            
            if (advantagesMatch && advantagesMatch[1]) {
              advantages = advantagesMatch[1].trim();
            }
            
            if (suggestionsMatch && suggestionsMatch[1]) {
              suggestions = suggestionsMatch[1].trim();
            }
            
            // 如果没有匹配到格式化内容，尝试直接分割
            if (!advantages && !suggestions) {
              const parts = responseText.split(/\n\s*\n/);
              if (parts.length >= 2) {
                advantages = parts[0].trim();
                suggestions = parts[parts.length - 1].trim();
              }
            }
            
            // 解析并设置HTML
            if (advantages) {
              const advantagesHtml = parseMarkdown(advantages);
              this.setData({ 
                advantagesHtml: advantagesHtml
                  .replace(/优点/g, '<span style="color:#6dcc5f">优点</span>')
                  .replace(/缺点/g, '<span style="color:#ff6b6b">缺点</span>')
              });
            }
            
            if (suggestions) {
              this.setData({
                suggestionsHtml: parseMarkdown(suggestions) + '<div style="margin-bottom:30rpx;"></div>'
              });
            }
            
            // 如果没有成功设置，回退到传统方法
            if (!this.data.advantagesHtml || !this.data.suggestionsHtml) {
              console.log('AI处理未能获得有效结果，使用传统方法');
              this.processContent();
            }
          } catch (error) {
            console.error('解析AI响应失败', error);
            this.processContent();  // 出错时使用传统方法
          }
        } else {
          console.error('AI处理请求异常');
          this.processContent();  // 请求异常时使用传统方法
        }
      },
      fail: (error) => {
        console.error('AI处理请求失败', error);
        this.processContent();  // 请求失败时使用传统方法
      },
      complete: () => {
        wx.hideLoading();
        this.setData({ isProcessing: false });
      }
    });
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

  // 生成星星数组
  generateStars() {
    const score = this.data.score
    const fullStars = Math.floor(score / 2)
    const hasHalfStar = score % 2 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)
    
    const stars = []
    
    // 添加实心星星
    for (let i = 0; i < fullStars; i++) {
      stars.push({
        src: '/assets/star-full.svg',
        class: ''
      })
    }
    
    // 添加半星（如果有）
    if (hasHalfStar) {
      stars.push({
        src: '/assets/star-half.svg',
        class: ''
      })
    }
    
    // 添加空星星
    for (let i = 0; i < emptyStars; i++) {
      stars.push({
        src: '/assets/star-empty.svg',
        class: ''
      })
    }
    
    this.setData({
      scoreStars: stars
    })
  },

  // 添加星星动画
  animateStars() {
    const stars = this.data.scoreStars
    stars.forEach((star, index) => {
      star.class = 'animate'
    })
    
    this.setData({
      scoreStars: stars
    })
  },
  
  // 生成彩纸礼花
  generateConfetti() {
    // 创建50个彩纸元素
    const confettiCount = 50
    const colors = ['#ff6b6b', '#5677fc', '#f0ad4e', '#6dcc5f', '#9d7af7', '#ff9d66']
    const confettiItems = []
    
    for (let i = 0; i < confettiCount; i++) {
      confettiItems.push({
        left: Math.floor(Math.random() * 750), // 随机左边距
        delay: Math.random() * 3, // 随机延迟
        color: colors[Math.floor(Math.random() * colors.length)] // 随机颜色
      })
    }
    
    this.setData({
      confettiItems
    })
  },

  // 处理内容，分离优缺点和改进建议（备用方法）
  processContent() {
    let feedback = this.data.feedback;
    
    // 检查是否有内容
    if (!feedback || feedback.trim() === '') {
      console.error('反馈内容为空');
      
      // 设置默认内容
      this.setData({
        advantagesHtml: '<div style="color:#666;text-align:center;padding:20rpx;">暂无穿搭评价</div>',
        suggestionsHtml: '<div style="color:#666;text-align:center;padding:20rpx;">暂无改进建议</div>'
      });
      return;
    }
    
    // 简化文本，移除多余内容
    feedback = feedback
      .replace(/我对这套穿搭的分析如下：\n?/g, '')
      .replace(/\n根据我的评估，/g, '\n')
      .replace(/总的来说，/g, '')
      .replace(/总体而言，/g, '')
      .replace(/综上所述，/g, '');
    
    // 将内容格式化成Markdown样式
    feedback = feedback.replace(/### (优点|缺点|建议|对于.+?的合适度)/g, '\n### $1');
    
    let advantages = '';
    let suggestions = '';
    
    // 尝试通过各种模式匹配提取内容
    const advantagesMatch = feedback.match(/优点：([\s\S]*?)(?=\n### 缺点|\n### 建议|$)/);
    const disadvantagesMatch = feedback.match(/缺点：([\s\S]*?)(?=\n### 建议|$)/);
    
    const suggestionsMatch = feedback.match(/建议：([\s\S]*?)(?=\n### |$)/) || 
                             feedback.match(/改进建议：([\s\S]*?)(?=\n### |$)/) ||
                             feedback.match(/改进建议([\s\S]*?)(?=\n### |$)/);
    
    // 如果匹配失败，则尝试其他分割方式
    if (!advantagesMatch && !disadvantagesMatch && !suggestionsMatch) {
      console.log('无法匹配优缺点和建议，尝试其他分割方式');
      
      // 检查是否有明确的分段
      const lines = feedback.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length >= 3) {
        // 假设前1/3是优点，中间1/3是缺点，最后1/3是建议
        const segmentLength = Math.ceil(lines.length / 3);
        advantages = '### 优点：\n' + lines.slice(0, segmentLength).join('\n') + '\n\n';
        advantages += '### 缺点：\n' + lines.slice(segmentLength, segmentLength * 2).join('\n');
        suggestions = lines.slice(segmentLength * 2).join('\n');
      } else {
        // 如果内容很少，就将全部内容都作为优点展示
        advantages = '### 评价：\n' + feedback;
        suggestions = '- 请根据评价自行调整穿搭';
      }
    } else {
      // 正常提取优缺点和建议
      if (advantagesMatch) {
        advantages += '### 优点：\n' + advantagesMatch[1].trim() + '\n\n';
      }
      
      if (disadvantagesMatch) {
        advantages += '### 缺点：\n' + disadvantagesMatch[1].trim();
      }
      
      if (suggestionsMatch) {
        suggestions = suggestionsMatch[1].trim();
      }
    }
    
    // 确保建议内容格式化为列表
    if (suggestions && !suggestions.includes('- ')) {
      suggestions = suggestions.split('\n')
        .map(line => line.trim() ? `- ${line.trim()}` : line)
        .join('\n');
    }
    
    // 如果没有提取到内容，设置默认内容
    if (!advantages) {
      advantages = '### 评价：\n无法提取明确的优缺点';
    }
    
    if (!suggestions) {
      suggestions = '- 无法提取明确的建议\n- 请根据整体评价自行调整';
    }
    
    // 解析Markdown
    let advantagesHtml = parseMarkdown(advantages);
    let suggestionsHtml = parseMarkdown(suggestions);
    
    // 添加样式调整
    advantagesHtml = advantagesHtml
      .replace(/优点/g, '<span style="color:#6dcc5f">优点</span>')
      .replace(/缺点/g, '<span style="color:#ff6b6b">缺点</span>')
      .replace(/评价/g, '<span style="color:#6dcc5f">评价</span>');
    
    // 适应暗黑模式
    if (wx.getSystemInfoSync().theme === 'dark') {
      advantagesHtml = advantagesHtml.replace(/color:#333/g, 'color:#eee');
      suggestionsHtml = suggestionsHtml.replace(/color:#333/g, 'color:#eee');
    }
    
    // 更新视图
    this.setData({
      advantagesHtml,
      suggestionsHtml: suggestionsHtml + '<div style="margin-bottom:30rpx;"></div>'
    });
    
    // 检查内容是否为空的调试信息
    console.log('优缺点HTML长度:', advantagesHtml.length);
    console.log('建议HTML长度:', suggestionsHtml.length);
  },

  // 返回首页
  backToHome() {
    wx.navigateBack({
      delta: 1
    })
  },

  // 分享结果
  onShareAppMessage() {
    return {
      title: `我的穿搭获得了${this.data.score}分，快来看看！`,
      path: '/pages/index/index',
      imageUrl: this.data.imagePath
    }
  }
}) 