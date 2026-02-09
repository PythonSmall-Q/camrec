# Electron Builder 本地部署脚本
# 用于 electron-builder 打包时使用本地 Electron 文件

$electronVersion = "21.4.4"
$electronZip = "electron-v21.4.4-win32-x64.zip"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Electron Builder 本地部署脚本" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 检查本地 zip 文件是否存在
if (-not (Test-Path $electronZip)) {
    Write-Host "[错误] 找不到 $electronZip 文件" -ForegroundColor Red
    Write-Host ""
    Write-Host "请将 electron-v21.4.4-win32-x64.zip 放到当前目录" -ForegroundColor Yellow
    Write-Host "下载地址: https://github.com/electron/electron/releases/tag/v21.4.4" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# 验证 zip 文件完整性
Write-Host "正在验证 ZIP 文件..." -ForegroundColor Green
try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [System.IO.Compression.ZipFile]::OpenRead((Get-Item $electronZip).FullName)
    $archive.Dispose()
    Write-Host "✓ ZIP 文件验证成功" -ForegroundColor Green
} catch {
    Write-Host "[错误] ZIP 文件损坏或不完整，请重新下载" -ForegroundColor Red
    Write-Host "错误详情: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# electron-builder 缓存目录
$builderCacheDir = "$env:LOCALAPPDATA\electron-builder\Cache"

# 创建缓存目录结构
# electron-builder 使用的路径格式: Cache/electron/版本号/
$electronCacheDir = "$builderCacheDir\electron\$electronVersion"

if (-not (Test-Path $electronCacheDir)) {
    Write-Host "创建 electron-builder 缓存目录..." -ForegroundColor Green
    New-Item -ItemType Directory -Path $electronCacheDir -Force | Out-Null
}

# 复制到 electron-builder 缓存
$builderTarget = "$electronCacheDir\electron-v$electronVersion-win32-x64.zip"
Write-Host "复制文件到 electron-builder 缓存..." -ForegroundColor Green
Copy-Item $electronZip $builderTarget -Force

# 同时复制到 npm electron 缓存（用于 npm install）
$npmCacheDir = "$env:LOCALAPPDATA\electron\Cache\$electronVersion"
if (-not (Test-Path $npmCacheDir)) {
    New-Item -ItemType Directory -Path $npmCacheDir -Force | Out-Null
}

$npmTarget = "$npmCacheDir\electron-v$electronVersion-win32-x64.zip"
Write-Host "复制文件到 npm electron 缓存..." -ForegroundColor Green
Copy-Item $electronZip $npmTarget -Force

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "✓ 部署完成!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "缓存位置:" -ForegroundColor Cyan
Write-Host "  - electron-builder: $builderTarget" -ForegroundColor Gray
Write-Host "  - npm electron: $npmTarget" -ForegroundColor Gray
Write-Host ""
Write-Host "现在可以运行:" -ForegroundColor Yellow
Write-Host "  1. npm install    (安装依赖)" -ForegroundColor White
Write-Host "  2. npm run build  (打包应用)" -ForegroundColor White
Write-Host ""
