const { app, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// 强制使用软件渲染/编码
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-accelerated-video-encode');
app.commandLine.appendSwitch('disable-accelerated-video-decode');

let mainWindow;
let settingsWindow;
let tray;
let allowClose = false;
let configPath = path.join(app.getPath('userData'), 'config.json');
let isQuitting = false;

// 默认配置
let config = {
  savePath: path.join(os.homedir(), 'Videos', 'CamRec'),
  maxStorageGB: 10,
  segmentMinutes: 30,
  selectedCameras: [],
  stopPasswordHash: ''
};

// 加载配置
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      config = { ...config, ...JSON.parse(data) };
    } else {
      saveConfig();
    }
  } catch (err) {
    console.error('加载配置失败:', err);
  }
  
  // 确保保存目录存在
  if (!fs.existsSync(config.savePath)) {
    fs.mkdirSync(config.savePath, { recursive: true });
  }
}

// 确保应用图标存在
function ensureIconExists() {
  try {
    const assetsDir = path.join(__dirname, 'assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    // 检查 PNG 或 ICO 是否存在
    const pngPath = path.join(assetsDir, 'icon.png');
    const icoPath = path.join(assetsDir, 'icon.ico');
    
    if (!fs.existsSync(pngPath) && !fs.existsSync(icoPath)) {
      // 创建一个最小的有效 PNG 图标
      const minimalPng = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x20, 0x00, 0x00, 0x00, 0x20,
        0x08, 0x02, 0x00, 0x00, 0x00, 0xFD, 0x24, 0xA0, 0x66, 0x00, 0x00, 0x00,
        0x19, 0x74, 0x45, 0x58, 0x74, 0x53, 0x6F, 0x66, 0x74, 0x77, 0x61, 0x72,
        0x65, 0x00, 0x41, 0x64, 0x6F, 0x62, 0x65, 0x20, 0x49, 0x6D, 0x61, 0x67,
        0x65, 0x52, 0x65, 0x61, 0x64, 0x79, 0x71, 0xC9, 0x65, 0x3C, 0x00, 0x00,
        0x01, 0x2A, 0x49, 0x44, 0x41, 0x54, 0x78, 0xDA, 0xEC, 0xC1, 0x01, 0x0D,
        0x00, 0x00, 0x00, 0xC2, 0xA0, 0xF7, 0x4F, 0xED, 0x61, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0xBB, 0x11, 0xB9, 0xE7, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      
      fs.writeFileSync(pngPath, minimalPng);
      console.log('已创建默认应用图标:', pngPath);
    }
  } catch (err) {
    console.error('确保图标存在时出错:', err);
  }
}

// 保存配置
function saveConfig() {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (err) {
    console.error('保存配置失败:', err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    // 窗口保护：隐藏最大化、最小化按钮，只保留关闭（实际是隐藏到托盘）
    frame: true,  // 保持系统标题栏
    resizable: true  // 允许调整大小
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
  
  // 开发时打开开发者工具
  // mainWindow.webContents.openDevTools();

  // 监听最小化事件→隐藏到托盘（继续后台录制）
  mainWindow.on('minimize', (event) => {
    mainWindow.hide();
  });

  mainWindow.on('close', (event) => {
    // 如果不是真正退出（isQuitting = true），则隐藏到托盘
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return;
    }
    
    // 真正退出时，需要密码验证
    if (allowClose) {
      return;
    }
    event.preventDefault();
    if (mainWindow) {
      mainWindow.webContents.send('request-close');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 600,
    height: 500,
    parent: mainWindow,
    modal: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    resizable: false
  });

  settingsWindow.loadFile('settings.html');
  settingsWindow.setMenu(null);

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function createTray() {
  try {
    // 使用系统默认图标创建托盘
    tray = new Tray(nativeImage.createEmpty());
    console.log('✓ 托盘已创建（使用系统默认图标）');
  } catch (err) {
    console.error('✗ 创建托盘失败:', err);
    return;
  }
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: '停止录制并退出',
      click: async () => {
        // 先发送停止录制请求，然后退出
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('request-exit');
        }
      }
    },
    { type: 'separator' },
    {
      label: '设置',
      click: () => {
        createSettingsWindow();
      }
    },
    {
      label: '关于',
      click: () => {
        const owner = mainWindow || null;
        dialog.showMessageBox(owner, {
          type: 'info',
          title: '关于 CamRec',
          message: 'CamRec 1.0.0',
          detail: '电脑摄像头监控系统',
          buttons: ['确定']
        });
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
  
  // 点击托盘图标显示/隐藏窗口
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
  
  // 添加托盘工具提示
  tray.setToolTip('CamRec - 摄像头监控系统');
}

app.on('ready', () => {
  loadConfig();
  ensureIconExists();  // 确保图标文件存在
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // 不自动退出，保持托盘运行
    // app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC 事件处理

// 获取配置
ipcMain.on('get-config', (event) => {
  event.returnValue = config;
});

// 保存配置
ipcMain.on('save-config', (event, newConfig) => {
  config = { ...config, ...newConfig };
  saveConfig();
  
  // 确保新的保存目录存在
  if (!fs.existsSync(config.savePath)) {
    fs.mkdirSync(config.savePath, { recursive: true });
  }
  
  event.returnValue = true;
  
  // 通知主窗口配置已更新
  if (mainWindow) {
    mainWindow.webContents.send('config-updated', config);
  }
});

// 选择保存路径
ipcMain.on('select-save-path', (event) => {
  const result = dialog.showOpenDialogSync(settingsWindow || mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    defaultPath: config.savePath
  });
  
  event.returnValue = result ? result[0] : null;
});

// 打开设置窗口
ipcMain.on('open-settings', () => {
  createSettingsWindow();
});

// 处理关闭请求
ipcMain.on('close-response', (event, allowed) => {
  if (!mainWindow) return;
  if (allowed) {
    allowClose = true;
    isQuitting = true;
    mainWindow.close();
    // 延迟退出，确保所有流程完成
    setTimeout(() => {
      app.quit();
    }, 500);
  }
});

// 处理退出应用请求（从托盘菜单）
ipcMain.on('app-exit-request', (event, allowed) => {
  if (allowed) {
    allowClose = true;
    isQuitting = true;
    if (mainWindow) {
      mainWindow.close();
    }
    setTimeout(() => {
      app.quit();
    }, 500);
  }
});

// 检查存储空间并清理（磁盘满自动轮转）
ipcMain.on('check-storage', (event) => {
  try {
    const maxSizeBytes = config.maxStorageGB * 1024 * 1024 * 1024;
    const files = fs.readdirSync(config.savePath);
    const videoFiles = files.filter(f => f.endsWith('.webm'));
    
    let totalSize = 0;
    const filesWithStats = [];
    
    videoFiles.forEach(file => {
      const filePath = path.join(config.savePath, file);
      try {
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
        filesWithStats.push({
          file,
          filePath,
          mtime: stats.mtime,
          size: stats.size
        });
      } catch (err) {
        // 忽略无法访问的文件
      }
    });
    
    // 成功状态（即使已满，也允许继续录制）
    event.returnValue = { success: true, totalSize, maxSize: maxSizeBytes };
    
    // 如果超过限制，删除最旧的文件来腾出空间（循环覆盖）
    if (totalSize > maxSizeBytes) {
      console.log(`存储空间已满 (${(totalSize / 1024 / 1024 / 1024).toFixed(2)} GB / ${config.maxStorageGB} GB)，自动删除最旧文件`);
      
      // 按修改时间排序（最旧的在前）
      filesWithStats.sort((a, b) => a.mtime - b.mtime);
      
      // 删除最旧的文件，直到总大小回到限制以下
      for (const fileInfo of filesWithStats) {
        if (totalSize <= maxSizeBytes * 0.95) {  // 保留在 95% 以下
          break;
        }
        
        try {
          fs.unlinkSync(fileInfo.filePath);
          console.log(`已删除文件: ${fileInfo.file} (释放 ${(fileInfo.size / 1024 / 1024).toFixed(1)} MB)`);
          totalSize -= fileInfo.size;
        } catch (err) {
          console.error(`删除文件失败: ${fileInfo.file}`, err);
        }
      }
    }
  } catch (err) {
    console.error('检查存储空间失败:', err);
    event.returnValue = { success: false, error: err.message };
  }
});

// 获取保存路径
ipcMain.on('get-save-path', (event) => {
  event.returnValue = config.savePath;
});
