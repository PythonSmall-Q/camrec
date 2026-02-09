# 摄像头录制助手 - 快速开始

## 快速安装（首次使用）

1. **安装 Node.js v16 或 v18**（兼容 Windows 7 和 Electron 21）
   - 推荐 v16.20.2：https://nodejs.org/download/release/v16.20.2/
   - 或 v18.20.0：https://nodejs.org/download/release/v18.20.0/
   - 选择对应的 x86.msi（32位）或 x64.msi（64位）

2. **打开命令提示符（cmd）**，进入项目目录：
   ```
   cd c:\Users\seans\Documents\GitHub\camrec
   ```

3. **安装依赖**：
   
   **选项 A - 在线安装（有网络）**：
   ```
   npm install
   ```
   
   **选项 B - 离线安装（使用本地 Electron）**：
   ```cmd
   REM 1. 将 electron-v21.4.4-win32-x64.zip 放到项目根目录
   REM 2. 双击运行 install-local-electron.bat（或运行下面的 PowerShell 脚本）
   install-local-electron.bat
   REM 3. 安装依赖
   npm install
   ```
   
   详细说明请查看 [ELECTRON_LOCAL_INSTALL.md](ELECTRON_LOCAL_INSTALL.md)

4. **启动软件**：
   ```
   npm start
   ```

## 日常使用

直接运行：
```
npm start
```

## 打包成安装程序

生成 Windows 安装包：

**在线打包**：
```
npm run build
```

**离线打包（使用本地 Electron）**：
```cmd
REM 1. 确保已放置 electron-v21.4.4-win32-x64.zip
REM 2. 运行部署脚本
install-local-electron-builder.bat
REM 3. 打包
npm run build
```

安装包将生成在 `dist` 目录中。

**注意**：`npm run build` 使用 electron-builder，需要单独配置缓存。详见 [ELECTRON_LOCAL_INSTALL.md](ELECTRON_LOCAL_INSTALL.md)

## 常用命令

- `npm start` - 启动程序
- `npm run build` - 打包安装程序
- `npm install` - 安装依赖（首次使用或更新后）

## 故障排除

### 如果 npm install 失败：

1. 清除缓存：
   ```
   npm cache clean --force
   ```

2. 删除 node_modules 文件夹（如果存在）

3. 重新安装：
   ```
   npm install
   ```

### 如果启动失败：

1. 确认 Node.js 版本正确：
   ```
   node --version
   ```
   应显示 v16.x.x 或 v18.x.x

2. 确认依赖已安装：
   ```
   npm install
   ```

3. 以管理员身份运行命令提示符

## Windows 7 特别说明

Windows 7 需要确保：
- 已安装 Service Pack 1
- 已安装 .NET Framework 4.5 或更高版本
- 已安装所有 Windows Updates

如果遇到 SSL/TLS 错误，可能需要更新根证书。
