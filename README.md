# 摄像头录制助手 (CamRec)

[![Build and Release](https://github.com/你的用户名/camrec/actions/workflows/release.yml/badge.svg)](https://github.com/你的用户名/camrec/actions/workflows/release.yml)
[![GitHub release](https://img.shields.io/github/v/release/PythonSmall-Q/camrec)](https://github.com/你的用户名/camrec/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一款适配 Windows 7 的多摄像头录制软件，支持同时录制多个摄像头，自动分割视频，智能管理存储空间。

> 💡 **快速下载**：[最新版本安装包](https://github.com/PythonSmall-Q/camrec/releases/latest)

## ✨ 主要功能

- 📹 **多摄像头支持**：自动检测所有摄像头，支持同时录制多个摄像头
- � **实时预览**：软件启动后自动显示所有摄像头画面，分栏展示
- 💾 **智能存储管理**：设置最大存储空间，自动删除旧文件
- ✂️ **自动分割视频**：按设定时间（默认30分钟）自动分割视频文件
- 🕐 **时间戳水印**：视频右下角嵌入时间戳，颜色自适应背景亮度
- 📝 **智能命名**：视频文件名为开始录制的本地时间
- ⚙️ **灵活配置**：可自定义保存位置、存储大小、分割时间等

## 📋 系统要求

- **操作系统**：Windows 7 及以上
- **内存**：至少 2GB RAM
- **硬盘**：根据录制需求预留足够空间
- **摄像头**：USB 摄像头或内置摄像头

## 🚀 安装步骤

### 方法一：从源码运行（开发者）

1. **安装 Node.js**（推荐 v16.x 或 v18.x 版本，兼容 Windows 7）

   - 下载地址：https://nodejs.org/download/release/
   - 推荐 v16.20.2 或 v18.20.0
   - 选择对应的 x86.msi（32位）或 x64.msi（64位）
2. **克隆或下载项目**

   ```bash
   git clone <repository-url>
   cd camrec
   ```
3. **安装依赖**

   ```bash
   npm install
   ```

   > 💡 **离线安装提示**：如果网络不佳，可以使用本地 Electron 安装包。详见 [ELECTRON_LOCAL_INSTALL.md](ELECTRON_LOCAL_INSTALL.md)
   >
4. **运行程序**

   ```bash
   npm start
   ```

### 方法二：安装打包版本（推荐）

1. 运行打包命令生成安装包：

   ```bash
   npm run build
   ```

   > 💡 **离线打包**：如果网络不佳，运行 `install-local-electron-builder.bat` 配置本地 Electron，详见 [ELECTRON_LOCAL_INSTALL.md](ELECTRON_LOCAL_INSTALL.md)
   >
2. 在 `dist` 目录找到生成的安装程序
3. 双击安装程序，按提示完成安装

## 📖 使用说明

### 1. 首次使用

1. **打开软件**：启动"摄像头录制助手"
2. **设置配置**（可选）：

   - 点击右上角"⚙️ 设置"按钮
   - 设置视频保存位置（默认：用户视频文件夹/CamRec）
   - 设置最大存储空间（默认：10 GB）
   - 设置视频分割时间（默认：30 分钟）
   - 点击"💾 保存设置"

### 2. 选择摄像头

- 软件会自动检测所有可用摄像头
- 在"选择要录制的摄像头"区域勾选需要录制的摄像头
- 可以使用"✔️ 全选"或"✖️ 取消全选"快速操作
- 如果摄像头列表未更新，点击"🔄 刷新摄像头"

### 3. 开始录制

1. 选择至少一个摄像头
2. 点击"▶️ 开始录制"按钮
3. 所有选中的摄像头将开始录制，并在预览区域实时显示
4. 录制状态和时长会显示在界面上

### 4. 停止录制

- 点击"⏹️ 停止录制"按钮即可停止所有录制
- 视频文件会自动保存到设置的保存位置

### 5. 视频文件

- **文件命名格式**：`YYYY-MM-DD_HH-MM-SS_摄像头名称.webm`
  - 例如：`2026-02-09_14-30-00_USB Camera.webm`
- **文件格式**：WebM (VP8 视频编码 + Opus 音频编码)
- **保存位置**：在设置中配置的文件夹

### 6. 自动功能

- **自动分割**：录制超过设定时间后自动生成新文件
- **自动清理**：存储空间超过限制时，自动删除最旧的录制文件
- **自动保存**：每次分割或停止录制时自动保存文件

## ⚙️ 配置说明

### 视频保存位置

- 选择一个有足够空间的硬盘位置
- 避免选择系统盘（C盘），以免影响系统性能
- 建议使用专门的硬盘或分区存储录制文件

### 最大存储空间

- 设置该软件最多可以使用的存储空间（GB）
- 建议设置为硬盘可用空间的 50-70%
- 超过此限制后，最旧的录制文件会被自动删除

### 视频分割时间

- 设置每个视频文件的最大录制时长（分钟）
- 推荐值：30 分钟（方便管理和播放）
- 较短的时间：便于查找特定时段的录像
- 较长的时间：减少文件数量

## 🎬 视频播放

录制的 WebM 格式视频可以使用以下播放器：

- **VLC Media Player**（推荐）：https://www.videolan.org/
- **PotPlayer**
- **Windows Media Player**（需要安装编解码器）
- **现代浏览器**（Chrome、Firefox、Edge）

## 🔧 常见问题

### Q: 检测不到摄像头？

A:

- 确保摄像头已正确连接并安装驱动
- 检查其他软件是否正在使用摄像头
- 点击"🔄 刷新摄像头"按钮重新检测
- 重启软件或电脑

### Q: 录制时画面卡顿？

A:

- 检查电脑性能，关闭不必要的程序
- 减少同时录制的摄像头数量
- 降低摄像头分辨率（在摄像头设置中）

### Q: 视频文件丢失？

A:

- 检查"最大存储空间"设置是否过小
- 确认文件未被杀毒软件误删
- 检查保存路径是否正确

### Q: 软件无法启动？

A:

- 确保已安装 Node.js 12.x 版本
- 检查 Windows 7 是否已安装所有更新
- 尝试以管理员身份运行

### Q: 如何更改视频格式？

A:

- 软件默认使用 WebM 格式（最佳兼容性）
- 如需其他格式，可使用 FFmpeg 等工具转换
- 转换命令示例：`ffmpeg -i input.webm output.mp4`

## 📁 项目结构

```
camrec/
├── main.js              # Electron 主进程
├── renderer.js          # 渲染进程（主界面逻辑）
├── settings.js          # 设置页面逻辑
├── index.html           # 主界面
├── settings.html        # 设置界面
├── styles.css           # 样式文件
├── package.json         # 项目配置
└── README.md            # 说明文档
```

## 🛠️ 技术栈

- **Electron 21.4.4**：桌面应用框架（最后支持 Windows 7 的版本）
- **Node.js**：运行环境
- **MediaRecorder API**：视频录制
- **WebRTC**：摄像头访问

## 📝 开发说明

### 本地构建安装包

```bash
npm run build
```

生成的安装包位于 `dist` 目录。

### 自动发布 (GitHub Actions)

项目配置了 GitHub Actions 自动发布流程：

1. **首次配置**：

   - 更新 `package.json` 中的 `repository` 字段为你的仓库地址
   - 启用 GitHub Actions 并设置读写权限
   - 详细步骤见 [.github/SETUP.md](.github/SETUP.md)
2. **发布新版本**：

   ```bash
   # 更新版本号
   npm version patch  # 或 minor, major

   # 推送到 GitHub
   git push origin main --follow-tags
   ```
3. **自动构建**：

   - GitHub Actions 自动检测版本变化
   - 在云端构建 Windows 安装包
   - 自动创建 Release 并上传安装包

详细说明请查看：

- [GitHub Actions 配置指南](.github/SETUP.md)
- [Release 工作流说明](.github/RELEASE.md)

### 调试模式

在 [main.js](main.js#L56) 中取消注释以下行以启用开发者工具：

```javascript
mainWindow.webContents.openDevTools();
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如有问题或建议，请创建 Issue 或联系开发者。

---

**注意**：本软件仅供合法用途使用，请遵守当地法律法规，尊重他人隐私。
