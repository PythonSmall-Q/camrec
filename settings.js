const { ipcRenderer, shell } = require('electron');
const crypto = require('crypto');

const savePathInput = document.getElementById('savePath');
const maxStorageInput = document.getElementById('maxStorage');
const segmentMinutesInput = document.getElementById('segmentMinutes');
const currentPasswordInput = document.getElementById('currentPassword');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const selectPathBtn = document.getElementById('selectPathBtn');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const openFolderBtn = document.getElementById('openFolderBtn');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password, 'utf8').digest('hex');
}

let currentConfig = null;

// 加载当前配置
function loadSettings() {
  currentConfig = ipcRenderer.sendSync('get-config');
  savePathInput.value = currentConfig.savePath;
  maxStorageInput.value = currentConfig.maxStorageGB;
  segmentMinutesInput.value = currentConfig.segmentMinutes;
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

  const currentPassword = currentPasswordInput.value.trim();
  const newPassword = newPasswordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();

  if (newPassword || confirmPassword || currentPassword) {
    if (!newPassword) {
      alert('请输入新密码');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('两次输入的新密码不一致');
      return;
    }

    const hasExisting = currentConfig && currentConfig.stopPasswordHash;
    if (hasExisting) {
      if (!currentPassword) {
        alert('请输入当前密码');
        return;
      }
      const currentHash = hashPassword(currentPassword);
      if (currentHash !== currentConfig.stopPasswordHash) {
        alert('当前密码不正确');
        return;
      }
    }

    newConfig.stopPasswordHash = hashPassword(newPassword);
  }
  
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
