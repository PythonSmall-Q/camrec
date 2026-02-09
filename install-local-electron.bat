@echo off
chcp 65001 >nul
echo ====================================
echo Electron 本地安装脚本
echo ====================================
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

REM 获取缓存目录
set CACHE_DIR=%LOCALAPPDATA%\electron\Cache\%ELECTRON_VERSION%

REM 创建缓存目录
if not exist "%CACHE_DIR%" (
    echo 创建缓存目录: %CACHE_DIR%
    mkdir "%CACHE_DIR%"
)

REM 复制文件
echo.
echo 正在复制 Electron 文件到缓存目录...
copy /Y "%ELECTRON_ZIP%" "%CACHE_DIR%\electron-v%ELECTRON_VERSION%-win32-x64.zip" >nul

if %errorlevel% equ 0 (
    echo.
    echo [成功] Electron 本地文件已准备完成!
    echo 缓存位置: %CACHE_DIR%\electron-v%ELECTRON_VERSION%-win32-x64.zip
    echo.
    echo 现在可以运行: npm install
    echo.
) else (
    echo.
    echo [错误] 复制文件失败
    echo.
)

pause
