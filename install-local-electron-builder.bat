@echo off
chcp 65001 >nul
echo =====================================
echo Electron Builder 本地部署脚本
echo =====================================
echo.

set ELECTRON_VERSION=21.4.4
set ELECTRON_ZIP=electron-v21.4.4-win32-x64.zip

REM 检查 zip 文件是否存在
if not exist "%ELECTRON_ZIP%" (
    echo [错误] 找不到 %ELECTRON_ZIP% 文件
    echo.
    echo 请将 electron-v21.4.4-win32-x64.zip 放到当前目录
    echo 下载地址: https://github.com/electron/electron/releases/tag/v21.4.4
    echo.
    pause
    exit /b 1
)

echo 正在验证 ZIP 文件...
REM PowerShell 验证 ZIP 文件
powershell -Command "try { Add-Type -AssemblyName System.IO.Compression.FileSystem; $archive = [System.IO.Compression.ZipFile]::OpenRead((Get-Item '%ELECTRON_ZIP%').FullName); $archive.Dispose(); exit 0 } catch { exit 1 }"
if %errorlevel% neq 0 (
    echo [错误] ZIP 文件损坏或不完整，请重新下载
    echo.
    pause
    exit /b 1
)
echo √ ZIP 文件验证成功
echo.

REM electron-builder 缓存目录
set BUILDER_CACHE=%LOCALAPPDATA%\electron-builder\Cache\electron\%ELECTRON_VERSION%
set NPM_CACHE=%LOCALAPPDATA%\electron\Cache\%ELECTRON_VERSION%

REM 创建 electron-builder 缓存目录
if not exist "%BUILDER_CACHE%" (
    echo 创建 electron-builder 缓存目录...
    mkdir "%BUILDER_CACHE%"
)

REM 复制到 electron-builder 缓存
echo 复制文件到 electron-builder 缓存...
copy /Y "%ELECTRON_ZIP%" "%BUILDER_CACHE%\electron-v%ELECTRON_VERSION%-win32-x64.zip" >nul

REM 创建 npm electron 缓存目录
if not exist "%NPM_CACHE%" (
    mkdir "%NPM_CACHE%"
)

REM 复制到 npm electron 缓存
echo 复制文件到 npm electron 缓存...
copy /Y "%ELECTRON_ZIP%" "%NPM_CACHE%\electron-v%ELECTRON_VERSION%-win32-x64.zip" >nul

if %errorlevel% equ 0 (
    echo.
    echo =====================================
    echo √ 部署完成!
    echo =====================================
    echo.
    echo 缓存位置:
    echo   - electron-builder: %BUILDER_CACHE%\electron-v%ELECTRON_VERSION%-win32-x64.zip
    echo   - npm electron: %NPM_CACHE%\electron-v%ELECTRON_VERSION%-win32-x64.zip
    echo.
    echo 现在可以运行:
    echo   1. npm install    ^(安装依赖^)
    echo   2. npm run build  ^(打包应用^)
    echo.
) else (
    echo.
    echo [错误] 复制文件失败
    echo.
)

pause
