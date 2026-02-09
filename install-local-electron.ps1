# Electron 本地安装脚本
# 使用本地 electron-v21.4.4-win32-x64.zip 文件

$electronVersion = "21.4.4"
$electronZip = "electron-v21.4.4-win32-x64.zip"

# 检查本地 zip 文件是否存在
if (-not (Test-Path $electronZip)) {
    Write-Host "错误: 找不到 $electronZip 文件" -ForegroundColor Red
    Write-Host "请将 electron-v21.4.4-win32-x64.zip 放到当前目录" -ForegroundColor Yellow
    exit 1
}

# 获取 Electron 缓存目录
$cacheDir = "$env:LOCALAPPDATA\electron\Cache"
if ($env:ELECTRON_CACHE) {
    $cacheDir = $env:ELECTRON_CACHE
}

# 创建缓存目录
$electronCacheDir = "$cacheDir\$electronVersion"
if (-not (Test-Path $electronCacheDir)) {
    New-Item -ItemType Directory -Path $electronCacheDir -Force | Out-Null
}

# 复制 zip 文件到缓存目录
$targetFile = "$electronCacheDir\electron-v$electronVersion-win32-x64.zip"
Write-Host "正在复制 Electron 文件到缓存目录..." -ForegroundColor Green
Copy-Item $electronZip $targetFile -Force

Write-Host "Electron 本地文件已准备完成!" -ForegroundColor Green
Write-Host "缓存位置: $targetFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "现在可以运行: npm install" -ForegroundColor Yellow
