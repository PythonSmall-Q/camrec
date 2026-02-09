# 使用本地 Electron 安装包指南

当网络环境不佳或需要离线安装时，可以使用本地的 Electron 安装包。

**重要说明**：
- `npm install` 使用 npm 的 electron 缓存
- `npm run build` 使用 electron-builder 的独立缓存
- 本指南提供了统一的解决方案，一次部署，两个命令都能使用

## 📥 准备工作

1. 下载 Electron 21.4.4 的安装包：
   - 文件名：`electron-v21.4.4-win32-x64.zip`
   - 下载地址：https://github.com/electron/electron/releases/tag/v21.4.4
   - 或者从 npm 镜像：https://cdn.npmmirror.com/binaries/electron/v21.4.4/

2. 将下载的 zip 文件放到项目根目录（与 package.json 同级）

## 🚀 安装步骤

### 方法一：统一部署脚本（强烈推荐）

**适用于**：需要同时运行 `npm install` 和 `npm run build`

1. 确保 `electron-v21.4.4-win32-x64.zip` 在项目根目录

2. 运行统一部署脚本：
   
   **批处理方式**（推荐）：
   ```cmd
   install-local-electron-builder.bat
   ```
   
   **PowerShell 方式**：
   ```powershell
   .\install-local-electron-builder.ps1
   ```

3. 脚本会自动：
   - 验证 ZIP 文件完整性
   - 复制到 electron-builder 缓存（用于打包）
   - 复制到 npm electron 缓存（用于安装）

4. 然后可以正常使用：
   ```powershell
   npm install      # 使用本地缓存
   npm run build    # 使用本地缓存打包
   ```

### 方法二：仅安装依赖（不需要打包）

### 方法二：仅安装依赖（不需要打包）

**适用于**：只需要运行 `npm start`，不需要打包

1. 确保 `electron-v21.4.4-win32-x64.zip` 在项目根目录

2. 运行安装脚本：
   
   **批处理方式**：
   ```cmd
   install-local-electron.bat
   ```
   
   **PowerShell 方式**：
   ```powershell
   .\install-local-electron.ps1
   ```

3. 然后安装依赖：
   ```powershell
   npm install
   ```

### 方法三：手动配置缓存

### 方法三：手动配置缓存

**步骤 1 - 配置 npm electron 缓存（用于 npm install）**：

1. 找到 Electron 缓存目录：
   ```powershell
   # 默认位置
   $env:LOCALAPPDATA\electron\Cache
   # 通常是: C:\Users\你的用户名\AppData\Local\electron\Cache
   ```

2. 创建版本目录：
   ```powershell
   mkdir "$env:LOCALAPPDATA\electron\Cache\21.4.4"
   ```

3. 复制 zip 文件：
   ```powershell
   Copy-Item electron-v21.4.4-win32-x64.zip "$env:LOCALAPPDATA\electron\Cache\21.4.4\electron-v21.4.4-win32-x64.zip"
   ```

**步骤 2 - 配置 electron-builder 缓存（用于 npm run build）**：

1. 找到 electron-builder 缓存目录：
   ```powershell
   # 默认位置
   $env:LOCALAPPDATA\electron-builder\Cache
   # 通常是: C:\Users\你的用户名\AppData\Local\electron-builder\Cache
   ```

2. 创建版本目录：
   ```powershell
   mkdir "$env:LOCALAPPDATA\electron-builder\Cache\electron\21.4.4"
   ```

3. 复制 zip 文件：
   ```powershell
   Copy-Item electron-v21.4.4-win32-x64.zip "$env:LOCALAPPDATA\electron-builder\Cache\electron\21.4.4\electron-v21.4.4-win32-x64.zip"
   ```

**步骤 3 - 安装和打包**：

4. 安装依赖：
   ```powershell
   npm install
   ```

5. 打包应用：
   ```powershell
   npm run build
   ```

5. 打包应用：
   ```powershell
   npm run build
   ```

## 🔍 验证安装

### 验证 npm electron 安装：

```powershell
# 查看 Electron 版本
.\node_modules\.bin\electron --version
# 应该显示: v21.4.4
```

### 验证 electron-builder 缓存：

```powershell
# 检查 electron-builder 缓存
dir "$env:LOCALAPPDATA\electron-builder\Cache\electron\21.4.4"
# 应该看到 electron-v21.4.4-win32-x64.zip

# 检查 npm electron 缓存
dir "$env:LOCALAPPDATA\electron\Cache\21.4.4"
# 应该看到 electron-v21.4.4-win32-x64.zip
```

## ⚙️ 配置说明

项目中的 `.npmrc` 文件已配置：

```ini
electron_use_cache=true
```

这会优先使用缓存中的 Electron，避免重复下载。

## 🛠️ 故障排除

### 问题 1：npm install 仍然尝试下载

**解决方法**：
```powershell
# 清除 npm 缓存
npm cache clean --force

# 删除 node_modules
Remove-Item -Recurse -Force node_modules

# 重新运行部署脚本
.\install-local-electron-builder.bat
npm install
```

### 问题 2：npm run build 报错 "zip: not a valid zip file"

**原因**：electron-builder 下载的文件损坏或缓存位置不正确

**解决方法**：
```powershell
# 1. 删除 electron-builder 缓存
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\electron-builder\Cache"

# 2. 验证你的 zip 文件完整性（尝试解压测试）
# 3. 重新运行部署脚本
.\install-local-electron-builder.bat

# 4. 再次打包
npm run build
```

### 问题 3：找不到 Electron

**解决方法**：
```powershell
# 检查两个缓存目录
dir "$env:LOCALAPPDATA\electron\Cache\21.4.4"
dir "$env:LOCALAPPDATA\electron-builder\Cache\electron\21.4.4"

# 确保两个目录都有 electron-v21.4.4-win32-x64.zip
```

### 问题 4：ZIP 文件损坏

**症状**：验证时提示 "ZIP 文件损坏或不完整"

**解决方法**：
1. 重新下载 electron-v21.4.4-win32-x64.zip
2. 确保下载完整（文件大小约 95 MB）
3. 尝试手动解压测试
4. 使用其他下载源：
   - GitHub: https://github.com/electron/electron/releases/tag/v21.4.4
   - npm 镜像: https://cdn.npmmirror.com/binaries/electron/v21.4.4/
   - 淘宝镜像: https://registry.npmmirror.com/-/binary/electron/v21.4.4/

### 问题 5：权限错误

**解决方法**：
```powershell
# 以管理员身份运行 PowerShell
# 或者修改脚本执行策略
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📦 electron-builder 本地构建说明

electron-builder 使用独立的缓存系统，与 npm electron 缓存不同：

**缓存位置对比**：
- npm electron: `%LOCALAPPDATA%\electron\Cache\版本号\`
- electron-builder: `%LOCALAPPDATA%\electron-builder\Cache\electron\版本号\`

**重要提示**：
- 如果只运行 `npm start`，只需要 npm electron 缓存
- 如果要运行 `npm run build`，必须配置 electron-builder 缓存
- 推荐使用 `install-local-electron-builder.bat`，一次配置两个缓存

**构建流程**：
```powershell
# 1. 部署本地 Electron（同时配置两个缓存）
.\install-local-electron-builder.bat

# 2. 安装依赖
npm install

# 3. 打包应用（完全离线）
npm run build
```

打包成功后，安装包位于 `dist` 目录：
- `dist\win-unpacked\` - 未打包的程序文件
- `dist\*.exe` - NSIS 安装程序（如果配置了）

## 🌐 完全离线环境

如果在完全离线的环境：

1. 在有网络的机器上：
   ```powershell
   # 下载所有依赖到本地
   npm install
   npm pack
   ```

2. 复制整个项目文件夹到离线机器

3. 在离线机器上：
   ```powershell
   # 复制 Electron 到缓存
   .\install-local-electron.ps1
   
   # 安装（会使用缓存）
   npm install --offline
   ```

## 📝 其他版本

如果需要其他版本的 Electron：

1. 修改 [install-local-electron.ps1](install-local-electron.ps1) 中的版本号
2. 下载对应版本的 zip 文件
3. 运行脚本

## 🔗 相关资源

- Electron 官方下载：https://github.com/electron/electron/releases
- npm 镜像下载：https://cdn.npmmirror.com/binaries/electron/
- Electron 文档：https://www.electronjs.org/docs

---

**提示**：第一次配置后，后续的 `npm install` 都会使用本地缓存，无需重复配置。
