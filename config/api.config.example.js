/**
 * API配置示例文件
 * 请复制此文件为api.config.js并填入您的实际API密钥和配置
 * 注意：请勿将包含真实API密钥的文件上传至代码仓库
 */

module.exports = {
  // API密钥（请替换为您的实际密钥）
  apiKey: 'your-api-key-here',

  // API URL
  apiUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',

  // AI模型名称
  imageModelName: 'doubao-1-5-vision-pro-32k-250115', // 图像分析模型
  textModelName: 'doubao-1-5-pro-32k-250115',// 文本处理模型

  // API默认参数
  defaultParams: {
    temperature: 0.6,
    max_tokens: 1000
  }
} 