const { ipcRenderer, shell } = require('electron');

const savePathInput = document.getElementById('savePath');
const maxStorageInput = document.getElementById('maxStorage');
const segmentMinutesInput = document.getElementById('segmentMinutes');
const selectPathBtn = document.getElementById('selectPathBtn');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const openFolderBtn = document.getElementById('openFolderBtn');

// 加载当前配置
function loadSettings() {
  const config = ipcRenderer.sendSync('get-config');
  savePathInput.value = config.savePath;
  maxStorageInput.value = config.maxStorageGB;
  segmentMinutesInput.value = config.segmentMinutes;
}

// 选择保存路径
selectPathBtn.addEventListener('click', () => {
  const selectedPath = ipcRenderer.sendSync('select-save-path');
  if (selectedPath) {
    savePathInput.value = selectedPath;
  }
});

// 保存设置
saveBtn.addEventListener('click', () => {
  const maxStorage = parseInt(maxStorageInput.value);
  const segmentMinutes = parseInt(segmentMinutesInput.value);
  
  if (maxStorage < 1 || maxStorage > 1000) {
    alert('最大存储空间必须在 1-1000 GB 之间');
    return;
  }
  
  if (segmentMinutes < 1 || segmentMinutes > 120) {
    alert('视频分割时间必须在 1-120 分钟之间');
    return;
  }
  
  const newConfig = {
    savePath: savePathInput.value,
    maxStorageGB: maxStorage,
    segmentMinutes: segmentMinutes
  };
  
  ipcRenderer.sendSync('save-config', newConfig);
  alert('设置已保存');
  window.close();
});

// 取消
cancelBtn.addEventListener('click', () => {
  window.close();
});

// 打开保存文件夹
openFolderBtn.addEventListener('click', () => {
  shell.openPath(savePathInput.value);
});

// 页面加载时加载设置
window.addEventListener('DOMContentLoaded', loadSettings);
