# 衣鉴 - AI穿搭分析微信小程序

## 项目介绍

"衣鉴"是一款基于人工智能的微信小程序，通过先进的AI视觉分析技术，为用户提供专业的穿搭建议。用户只需上传照片并选择场合，即可获得详细的穿搭分析、评分和改进建议。

## 功能特点

- **智能分析**：采用双重AI模型分析系统，提供更准确的穿搭建议
- **场景匹配**：支持多种场合（日常、职场、约会等）的穿搭适配度分析
- **专业评分**：采用10分制评分系统，并配有动态星级显示
- **精准建议**：分别列出穿搭优点、缺点和具体改进建议
- **视觉反馈**：优质评分（7分以上）触发祝贺动画效果
- **分享功能**：支持一键分享分析结果
- **暗黑模式**：支持系统暗黑模式

## 项目结构

```
clothelp/
├── pages/                # 小程序页面
│   ├── index/           # 首页（照片上传、场合选择）
│   └── result/          # 结果页（AI分析展示）
├── assets/              # 静态资源
│   ├── 衣鉴.svg         # 应用logo
│   ├── upload-icon.svg  # 上传图标
│   ├── back-icon.svg    # 返回图标
│   ├── star-full.svg    # 实心星星
│   ├── star-half.svg    # 半星
│   └── star-empty.svg   # 空星
├── config/              # 配置文件
│   ├── api.config.js           # API配置（私密）
│   └── api.config.example.js   # API配置示例
├── app.js              # 全局逻辑
├── app.json            # 全局配置
├── app.wxss            # 全局样式
└── project.config.json # 项目配置
```

## 开发指南

1. **环境准备**
   - 安装[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
   - 申请[火山引擎](https://www.volcengine.com/)账号并获取API密钥（也可以使用其它的平台和大模型（需支持多模态））

2. **项目配置**
   ```bash
   # 1. 复制API配置示例文件
   cp config/api.config.example.js config/api.config.js
   
   # 2. 编辑config/api.config.js，填入你的API密钥和模型配置
   ```

3. **开发调试**
   - 在微信开发者工具中导入项目
   - 开启调试模式
   - 编译并预览

## 技术实现

- **前端框架**：微信小程序原生开发
- **AI能力**：
  - 图像分析：火山引擎 doubao-1-5-vision-pro-32k-250115
  - 文本优化：火山引擎 doubao-1-5-pro-32k-250115
- **数据安全**：所有分析均为实时处理，不存储用户照片
- **UI设计**：采用简约现代风格，支持暗黑模式

## 注意事项

- API密钥请妥善保管，不要提交到版本控制系统
- 建议在生产环境中启用图片压缩，优化分析速度
- 请遵守微信小程序和火山引擎的相关使用规范

## License

Apache-2.0 license
