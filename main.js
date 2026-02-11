const { app, BrowserWindow, ipcMain, dialog } = require('electron');
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
let allowClose = false;
let configPath = path.join(app.getPath('userData'), 'config.json');

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
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
  
  // 开发时打开开发者工具
  // mainWindow.webContents.openDevTools();

  mainWindow.on('close', (event) => {
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

app.on('ready', () => {
  loadConfig();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
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
    mainWindow.close();
  }
});

// 检查存储空间
ipcMain.on('check-storage', (event) => {
  try {
    const files = fs.readdirSync(config.savePath);
    const videoFiles = files.filter(f => f.endsWith('.webm'));
    
    let totalSize = 0;
    videoFiles.forEach(file => {
      const filePath = path.join(config.savePath, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
    });
    
    const maxSizeBytes = config.maxStorageGB * 1024 * 1024 * 1024;
    
    // 如果超过限制，删除最旧的文件
    if (totalSize > maxSizeBytes) {
      const filesWithStats = videoFiles.map(file => {
        const filePath = path.join(config.savePath, file);
        const stats = fs.statSync(filePath);
        return { file, mtime: stats.mtime, size: stats.size };
      }).sort((a, b) => a.mtime - b.mtime);
      
      let currentSize = totalSize;
      for (const fileInfo of filesWithStats) {
        if (currentSize <= maxSizeBytes * 0.9) break;
        
        const filePath = path.join(config.savePath, fileInfo.file);
        fs.unlinkSync(filePath);
        currentSize -= fileInfo.size;
      }
    }
    
    event.returnValue = { success: true };
  } catch (err) {
    console.error('检查存储空间失败:', err);
    event.returnValue = { success: false, error: err.message };
  }
});

// 获取保存路径
ipcMain.on('get-save-path', (event) => {
  event.returnValue = config.savePath;
});
