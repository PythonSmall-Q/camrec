const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 全局变量
let availableCameras = [];
let selectedCameras = [];
let mediaRecorders = [];
let recordingStreams = [];
let canvasStreams = [];  // canvas 流（用于带时间戳的录制）
let previewStreams = [];  // 预览流（不录制）
let expandedPreview = null;  // 当前放大的预览
let isRecording = false;
let recordingStartTime = null;
let timerInterval = null;
let segmentInterval = null;
let config = {};

function hashPassword(password) {
  return crypto.createHash('sha256').update(password, 'utf8').digest('hex');
}

let activePasswordResolve = null;
let activePasswordMode = 'verify';

function showPasswordModal({ mode, title, message }) {
  return new Promise((resolve) => {
    activePasswordResolve = resolve;
    activePasswordMode = mode;
    passwordTitle.textContent = title;
    passwordMessage.textContent = message || '';
    passwordInput.value = '';
    passwordConfirmInput.value = '';
    passwordConfirmGroup.style.display = mode === 'set' ? 'block' : 'none';
    passwordModal.classList.add('visible');
    passwordModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => passwordInput.focus(), 0);
  });
}

function closePasswordModal(value) {
  passwordModal.classList.remove('visible');
  passwordModal.setAttribute('aria-hidden', 'true');
  if (activePasswordResolve) {
    activePasswordResolve(value);
    activePasswordResolve = null;
  }
}

async function ensureStopPasswordSet() {
  if (config.stopPasswordHash) return;

  while (!config.stopPasswordHash) {
    const password = await showPasswordModal({
      mode: 'set',
      title: '设置停止录制密码',
      message: '首次使用需要设置密码'
    });

    if (!password) {
      alert('必须设置密码才能继续使用。');
      continue;
    }

    const stopPasswordHash = hashPassword(password);
    ipcRenderer.sendSync('save-config', { stopPasswordHash });
    config.stopPasswordHash = stopPasswordHash;
  }
}

async function verifyStopPassword() {
  if (!config.stopPasswordHash) return true;

  const input = await showPasswordModal({
    mode: 'verify',
    title: '验证密码',
    message: '请输入停止/关闭密码'
  });

  if (!input) return false;

  const hashed = hashPassword(input.trim());
  if (hashed !== config.stopPasswordHash) {
    alert('密码错误');
    return false;
  }

  return true;
}

function getStreamInfo(stream) {
  const track = stream.getVideoTracks()[0];
  if (!track) return null;
  const settings = track.getSettings ? track.getSettings() : {};
  const width = settings.width || null;
  const height = settings.height || null;
  const frameRate = settings.frameRate || null;
  return { width, height, frameRate };
}

// 页面元素
const cameraList = document.getElementById('cameraList');
const previewGrid = document.getElementById('previewGrid');
const startRecordingBtn = document.getElementById('startRecordingBtn');
const stopRecordingBtn = document.getElementById('stopRecordingBtn');
const settingsBtn = document.getElementById('settingsBtn');
const refreshBtn = document.getElementById('refreshBtn');
const selectAllBtn = document.getElementById('selectAllBtn');
const deselectAllBtn = document.getElementById('deselectAllBtn');
const recordingStatus = document.getElementById('recordingStatus');
const recordingTimer = document.getElementById('recordingTimer');
const statusText = document.getElementById('statusText');
const storageInfo = document.getElementById('storageInfo');
const passwordModal = document.getElementById('passwordModal');
const passwordTitle = document.getElementById('passwordTitle');
const passwordMessage = document.getElementById('passwordMessage');
const passwordInput = document.getElementById('passwordInput');
const passwordConfirmGroup = document.getElementById('passwordConfirmGroup');
const passwordConfirmInput = document.getElementById('passwordConfirmInput');
const passwordCancelBtn = document.getElementById('passwordCancelBtn');
const passwordOkBtn = document.getElementById('passwordOkBtn');

// 初始化
async function init() {
  config = ipcRenderer.sendSync('get-config');
  await ensureStopPasswordSet();
  await detectCameras();
  
  // 自动开始预览所有摄像头
  if (availableCameras.length > 0) {
    await startPreview();
  }
  
  updateStorageInfo();
  
  // 每30秒更新一次存储信息
  setInterval(updateStorageInfo, 30000);
}

// 创建带时间戳的视频流
async function createTimestampedStream(videoStream, videoElement) {
  return new Promise((resolve) => {
    // 检查视频元素是否已经加载
    const initCanvas = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      // 设置canvas尺寸为视频尺寸
      canvas.width = videoElement.videoWidth || 640;
      canvas.height = videoElement.videoHeight || 480;
      
      console.log(`Canvas 尺寸: ${canvas.width}x${canvas.height}`);
      
      // 获取音频轨道
      const audioTracks = videoStream.getAudioTracks();
      
      // 使用固定 FPS，并用定时器驱动绘制，避免时间基准异常
      const targetFps = 30;
      const frameInterval = 1000 / targetFps;
      const canvasStream = canvas.captureStream(targetFps);
      console.log(`使用固定帧率录制 (${targetFps} FPS)`);
      
      // 添加音频轨道
      if (audioTracks.length > 0) {
        audioTracks.forEach(track => {
          canvasStream.addTrack(track);
        });
      }
      
      // 标记这个流正在录制
      let isStreamActive = true;
      let frameCount = 0;
      let drawTimer = null;
      
      // 绘制视频帧并添加时间戳
      function drawFrame() {
        if (!isStreamActive) return;
        
        try {
          // 绘制视频帧
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          
          // 绘制时间戳
          const now = new Date();
          const timestamp = formatFullTimestamp(now);
          
          // 设置时间戳样式
          const fontSize = Math.max(16, Math.floor(canvas.height / 25));
          ctx.font = `bold ${fontSize}px Arial`;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          
          // 计算时间戳位置
          const padding = fontSize * 0.3;
          const textWidth = ctx.measureText(timestamp).width;
          const bgX = canvas.width - textWidth - padding * 2 - 10;
          const bgY = canvas.height - fontSize - padding * 2 - 10;
          const bgWidth = textWidth + padding * 2;
          const bgHeight = fontSize + padding * 2;
          
          // 采样右下角区域的颜色来决定文字颜色
          const sampleX = Math.max(0, bgX - 20);
          const sampleY = Math.max(0, bgY - 20);
          const sampleWidth = Math.min(bgWidth + 40, canvas.width - sampleX);
          const sampleHeight = Math.min(bgHeight + 40, canvas.height - sampleY);
          
          let textColor = '#FFFFFF'; // 默认白色
          
          try {
            // 获取采样区域的像素数据
            const imageData = ctx.getImageData(sampleX, sampleY, sampleWidth, sampleHeight);
            const pixels = imageData.data;
            
            // 计算平均亮度
            let totalBrightness = 0;
            let pixelCount = 0;
            
            for (let i = 0; i < pixels.length; i += 4) {
              const r = pixels[i];
              const g = pixels[i + 1];
              const b = pixels[i + 2];
              
              // 使用加权公式计算亮度（人眼对绿色更敏感）
              const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
              totalBrightness += brightness;
              pixelCount++;
            }
            
            const avgBrightness = totalBrightness / pixelCount;
            
            // 如果背景较亮（亮度 > 128），使用黑色文字；否则使用白色文字
            textColor = avgBrightness > 128 ? '#000000' : '#FFFFFF';
          } catch (err) {
            // 如果采样失败，保持默认白色
            if (frameCount % 100 === 0) {
              console.warn('颜色采样失败，使用默认颜色');
            }
          }
          
          // 绘制半透明背景（使其更容易阅读）
          ctx.fillStyle = textColor === '#FFFFFF' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)';
          ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
          
          // 绘制时间戳文字
          ctx.fillStyle = textColor;
          ctx.fillText(timestamp, canvas.width - padding - 10, canvas.height - padding - 10);
          
          frameCount++;
          if (frameCount % 300 === 0) {
            console.log(`Canvas 已绘制 ${frameCount} 帧`);
          }
        } catch (err) {
          console.error('drawFrame 错误:', err);
        }
        
        // 由定时器驱动
      }
      
      // 开始绘制
      drawTimer = setInterval(drawFrame, frameInterval);
      
      // 添加停止方法到流对象
      canvasStream.stopDrawing = () => {
        isStreamActive = false;
        if (drawTimer) {
          clearInterval(drawTimer);
          drawTimer = null;
        }
        console.log(`Canvas 绘制已停止，共绘制 ${frameCount} 帧`);
      };
      
      console.log('Canvas 流已创建，开始录制');
      resolve(canvasStream);
    };
    
    // 检查视频是否已经加载
    if (videoElement.readyState >= 2) {
      // 视频已加载，立即初始化
      console.log('视频已就绪，立即初始化 Canvas');
      initCanvas();
    } else {
      // 等待视频加载
      console.log('等待视频加载...');
      videoElement.onloadedmetadata = initCanvas;
    }
  });
}

// 格式化完整时间戳（用于视频水印）
function formatFullTimestamp(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

// 检测摄像头
async function detectCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    availableCameras = devices.filter(device => device.kind === 'videoinput');
    
    if (availableCameras.length === 0) {
      cameraList.innerHTML = '<p class="error">未检测到摄像头</p>';
      return;
    }
    
    displayCameraList();
    statusText.textContent = `检测到 ${availableCameras.length} 个摄像头`;
  } catch (err) {
    console.error('检测摄像头失败:', err);
    cameraList.innerHTML = '<p class="error">检测摄像头失败</p>';
  }
}

// 显示摄像头列表
function displayCameraList() {
  cameraList.innerHTML = '';
  
  availableCameras.forEach((camera, index) => {
    const cameraItem = document.createElement('div');
    cameraItem.className = 'camera-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `camera-${index}`;
    checkbox.value = camera.deviceId;
    checkbox.checked = config.selectedCameras.includes(camera.deviceId);
    checkbox.addEventListener('change', handleCameraSelection);
    
    const label = document.createElement('label');
    label.htmlFor = `camera-${index}`;
    label.textContent = camera.label || `摄像头 ${index + 1}`;
    
    cameraItem.appendChild(checkbox);
    cameraItem.appendChild(label);
    cameraList.appendChild(cameraItem);
  });
  
  updateSelectedCameras();
}

// 处理摄像头选择
function handleCameraSelection() {
  updateSelectedCameras();
  // 更新预览
  if (!isRecording) {
    updatePreview();
  }
}

// 更新选中的摄像头
function updateSelectedCameras() {
  const checkboxes = cameraList.querySelectorAll('input[type="checkbox"]');
  selectedCameras = Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);
  
  startRecordingBtn.disabled = selectedCameras.length === 0 || isRecording;
  
  // 保存选择到配置
  config.selectedCameras = selectedCameras;
  ipcRenderer.sendSync('save-config', { selectedCameras });
  
  statusText.textContent = `已选择 ${selectedCameras.length} 个摄像头`;
}

// 开始预览摄像头（不录制）
async function startPreview() {
  try {
    // 停止现有预览
    stopPreview();
    
    previewGrid.innerHTML = '';
    previewStreams = [];
    
    // 获取所有选中的摄像头（如果没有选中，则显示所有）
    const camerasToPreview = selectedCameras.length > 0 ? selectedCameras : availableCameras.map(c => c.deviceId);
    
    if (camerasToPreview.length === 0) {
      previewGrid.innerHTML = '<p class="placeholder">未检测到摄像头</p>';
      return;
    }
    
    for (let i = 0; i < camerasToPreview.length; i++) {
      const deviceId = camerasToPreview[i];
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } },
          audio: false  // 预览不需要音频
        });
        
        previewStreams.push(stream);
        
        // 创建预览元素
        const previewContainer = document.createElement('div');
        previewContainer.className = 'preview-item';
        
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.muted = true;
        
        const label = document.createElement('div');
        label.className = 'preview-label';
        const cameraInfo = availableCameras.find(c => c.deviceId === deviceId);
        label.textContent = cameraInfo?.label || `摄像头 ${i + 1}`;
        
        // 添加点击事件放大/缩小预览
        previewContainer.style.cursor = 'pointer';
        previewContainer.addEventListener('click', () => {
          togglePreviewExpand(previewContainer);
        });
        
        previewContainer.appendChild(video);
        previewContainer.appendChild(label);
        previewGrid.appendChild(previewContainer);
      } catch (err) {
        console.error(`预览摄像头 ${deviceId} 失败:`, err);
      }
    }
    
    statusText.textContent = `正在预览 ${camerasToPreview.length} 个摄像头`;
  } catch (err) {
    console.error('启动预览失败:', err);
  }
}

// 停止预览
function stopPreview() {
  previewStreams.forEach(stream => {
    stream.getTracks().forEach(track => track.stop());
  });
  previewStreams = [];
}

// 更新预览（当选择改变时）
async function updatePreview() {
  if (!isRecording) {
    expandedPreview = null;  // 重置放大状态
    await startPreview();
  }
}

// 切换预览放大/缩小
function togglePreviewExpand(clickedPreview) {
  const allPreviews = previewGrid.querySelectorAll('.preview-item');
  
  if (expandedPreview === clickedPreview) {
    // 再次点击同一个，恢复正常模式
    expandedPreview = null;
    allPreviews.forEach(preview => {
      preview.classList.remove('preview-expanded', 'preview-minimized');
    });
    previewGrid.classList.remove('has-expanded');
  } else {
    // 点击新的预览，放大它并缩小其他
    expandedPreview = clickedPreview;
    allPreviews.forEach(preview => {
      if (preview === clickedPreview) {
        preview.classList.add('preview-expanded');
        preview.classList.remove('preview-minimized');
      } else {
        preview.classList.add('preview-minimized');
        preview.classList.remove('preview-expanded');
      }
    });
    previewGrid.classList.add('has-expanded');
  }
}

// 开始录制
async function startRecording() {
  if (selectedCameras.length === 0) {
    alert('请先选择要录制的摄像头');
    return;
  }
  
  try {
    // 检查存储空间
    ipcRenderer.sendSync('check-storage');
    
    // 停止预览
    stopPreview();
    
    previewGrid.innerHTML = '';
    mediaRecorders = [];
    recordingStreams = [];
    canvasStreams = [];
    
    let firstStreamInfo = null;
    // 为每个选中的摄像头创建预览和录制
    for (let i = 0; i < selectedCameras.length; i++) {
      const deviceId = selectedCameras[i];
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: false
      });

      if (!firstStreamInfo) {
        firstStreamInfo = getStreamInfo(stream);
        if (firstStreamInfo) {
          console.log(`录制参数: ${firstStreamInfo.width || '?'}x${firstStreamInfo.height || '?'} @ ${firstStreamInfo.frameRate || '?'}fps`);
        }
      }
      
      recordingStreams.push(stream);
      
      // 创建预览元素
      const previewContainer = document.createElement('div');
      previewContainer.className = 'preview-item';
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;
      
      const label = document.createElement('div');
      label.className = 'preview-label';
      const cameraInfo = availableCameras.find(c => c.deviceId === deviceId);
      label.textContent = cameraInfo?.label || `摄像头 ${i + 1}`;
      
      const recordingIndicator = document.createElement('div');
      recordingIndicator.className = 'recording-indicator';
      recordingIndicator.textContent = '● 录制中';
      
      previewContainer.appendChild(video);
      previewContainer.appendChild(label);
      previewContainer.appendChild(recordingIndicator);      
      // 添加点击事件放大/缩小预览
      previewContainer.style.cursor = 'pointer';
      previewContainer.addEventListener('click', () => {
        togglePreviewExpand(previewContainer);
      });
            previewGrid.appendChild(previewContainer);
      
      // 使用带时间戳的录制流（canvas）
      const recordingStream = await createTimestampedStream(stream, video);
      canvasStreams.push(recordingStream);
      
      // 创建MediaRecorder
      const mediaRecorder = new MediaRecorder(recordingStream, {
        mimeType: 'video/webm',
        videoBitsPerSecond: 800000  // 800kbps 视频比特率（约 0.35GB/小时）
      });

      const recordedChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        saveRecording(blob, deviceId, i);
      };

      mediaRecorder.onerror = (err) => {
        console.error('录制错误:', err);
      };

      // 不使用 timeslice，ondataavailable 会在 stop 时触发
      mediaRecorder.start();
      mediaRecorders.push(mediaRecorder);
    }
    
    isRecording = true;
    recordingStartTime = new Date();
    startRecordingBtn.disabled = true;
    stopRecordingBtn.disabled = false;
    recordingStatus.textContent = '⏺️ 录制中';
    recordingStatus.className = 'status recording';
    
    // 启动计时器
    startTimer();
    
    // 设置自动分割
    const segmentMs = config.segmentMinutes * 60 * 1000;
    segmentInterval = setInterval(() => {
      restartRecording();
    }, segmentMs);
    
    if (firstStreamInfo) {
      const w = firstStreamInfo.width || '?';
      const h = firstStreamInfo.height || '?';
      const fps = firstStreamInfo.frameRate || '?';
      statusText.textContent = `录制中... ${w}x${h} @ ${fps}fps`;
    } else {
      statusText.textContent = '录制中...';
    }
    
  } catch (err) {
    console.error('开始录制失败:', err);
    alert('开始录制失败: ' + err.message);
    stopRecording();
  }
}

// 停止录制
function stopRecording() {
  if (!isRecording) return;
  
  console.log('开始停止录制...');
  
  // 1. 先停止所有MediaRecorder（这会触发 onstop 事件保存文件）
  mediaRecorders.forEach((recorder, index) => {
    if (recorder.state !== 'inactive') {
      console.log(`停止录制器 ${index + 1}`);
      recorder.stop();
    }
  });
  
  // 2. 等待一小段时间让 MediaRecorder 处理完数据
  setTimeout(() => {
    // 3. 停止所有 canvas 绘制
    canvasStreams.forEach(stream => {
      if (stream.stopDrawing) {
        stream.stopDrawing();
      }
    });
    
    // 4. 停止所有原始流
    recordingStreams.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
    
    // 5. 停止 canvas 流
    canvasStreams.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
    
    console.log('所有流已停止');
  }, 1000);  // 等待1秒让数据处理完成
  
  // 清空预览
  previewGrid.innerHTML = '<p class="placeholder">正在恢复预览...</p>';
  
  // 清除定时器
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  if (segmentInterval) {
    clearInterval(segmentInterval);
    segmentInterval = null;
  }
  
  isRecording = false;
  recordingStartTime = null;
  startRecordingBtn.disabled = selectedCameras.length === 0;
  stopRecordingBtn.disabled = true;
  recordingStatus.textContent = '未录制';
  recordingStatus.className = 'status';
  recordingTimer.textContent = '00:00:00';
  statusText.textContent = '录制已停止';
  
  mediaRecorders = [];
  recordingStreams = [];
  canvasStreams = [];
  
  updateStorageInfo();
  
  // 恢复预览
  setTimeout(() => {
    startPreview();
  }, 500);
}

// 重启录制（用于分割视频）
async function restartRecording() {
  if (!isRecording) return;
  
  // 停止当前录制
  mediaRecorders.forEach(recorder => {
    if (recorder.state !== 'inactive') {
      recorder.stop();
    }
  });
  
  // 等待一小段时间
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 重新开始录制
  const currentStreams = [...recordingStreams];
  const previewVideos = previewGrid.querySelectorAll('video');
  mediaRecorders = [];
  
  for (let i = 0; i < currentStreams.length; i++) {
    const stream = currentStreams[i];
    const videoElement = previewVideos[i];
    const deviceId = selectedCameras[i];
    
    // 使用带时间戳的录制流（canvas）
    const recordingStream = await createTimestampedStream(stream, videoElement);
    canvasStreams.push(recordingStream);
    
    const mediaRecorder = new MediaRecorder(recordingStream, {
      mimeType: 'video/webm',
      videoBitsPerSecond: 800000  // 800kbps 视频比特率（约 0.35GB/小时）
    });

    const recordedChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      saveRecording(blob, deviceId, i);
    };

    mediaRecorder.onerror = (err) => {
      console.error('录制错误:', err);
    };

    mediaRecorder.start();
    mediaRecorders.push(mediaRecorder);
  }
  
  recordingStartTime = new Date();
}

// 保存录制
function saveRecording(blob, deviceId, index) {
  const savePath = ipcRenderer.sendSync('get-save-path');
  const timestamp = formatTimestamp(recordingStartTime || new Date());
  const cameraInfo = availableCameras.find(c => c.deviceId === deviceId);
  const cameraName = (cameraInfo?.label || `Camera${index + 1}`).replace(/[<>:"/\\|?*]/g, '_');
  const filename = `${timestamp}_${cameraName}.webm`;
  const filePath = path.join(savePath, filename);
  
  const reader = new FileReader();
  reader.onload = () => {
    const buffer = Buffer.from(reader.result);
    fs.writeFile(filePath, buffer, (err) => {
      if (err) {
        console.error('保存录制失败:', err);
      } else {
        console.log('录制已保存:', filename);
        updateStorageInfo();
      }
    });
  };
  reader.readAsArrayBuffer(blob);
}

// 格式化时间戳
function formatTimestamp(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}_${hour}-${minute}-${second}`;
}

// 启动计时器
function startTimer() {
  timerInterval = setInterval(() => {
    if (!recordingStartTime) return;
    
    const elapsed = Date.now() - recordingStartTime.getTime();
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    recordingTimer.textContent = 
      `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, 1000);
}

// 更新存储信息
function updateStorageInfo() {
  try {
    const savePath = ipcRenderer.sendSync('get-save-path');
    const files = fs.readdirSync(savePath);
    const videoFiles = files.filter(f => f.endsWith('.webm'));
    
    let totalSize = 0;
    videoFiles.forEach(file => {
      const filePath = path.join(savePath, file);
      try {
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      } catch (err) {
        // 忽略无法访问的文件
      }
    });
    
    const usedGB = (totalSize / (1024 * 1024 * 1024)).toFixed(2);
    const maxGB = config.maxStorageGB || 10;
    storageInfo.textContent = `存储: ${usedGB} GB / ${maxGB} GB (${videoFiles.length} 个文件)`;
  } catch (err) {
    console.error('更新存储信息失败:', err);
  }
}

// 事件监听
startRecordingBtn.addEventListener('click', startRecording);
stopRecordingBtn.addEventListener('click', async () => {
  if (!isRecording) return;
  const ok = await verifyStopPassword();
  if (!ok) return;
  stopRecording();
});
settingsBtn.addEventListener('click', () => {
  ipcRenderer.send('open-settings');
});
refreshBtn.addEventListener('click', async () => {
  await detectCameras();
  // 重新启动预览
  if (availableCameras.length > 0 && !isRecording) {
    await startPreview();
  }
});
selectAllBtn.addEventListener('click', () => {
  const checkboxes = cameraList.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => cb.checked = true);
  updateSelectedCameras();
  // 更新预览
  if (!isRecording) {
    updatePreview();
  }
});
deselectAllBtn.addEventListener('click', () => {
  const checkboxes = cameraList.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => cb.checked = false);
  updateSelectedCameras();
  // 更新预览
  if (!isRecording) {
    updatePreview();
  }
});

// 监听配置更新
ipcRenderer.on('config-updated', (event, newConfig) => {
  config = newConfig;
  updateStorageInfo();
});

ipcRenderer.on('request-close', async () => {
  const ok = await verifyStopPassword();
  if (ok && isRecording) {
    stopRecording();
  }
  ipcRenderer.send('close-response', ok);
});

passwordCancelBtn.addEventListener('click', () => {
  closePasswordModal(null);
});

passwordOkBtn.addEventListener('click', () => {
  const value = passwordInput.value.trim();
  if (!value) {
    alert('请输入密码');
    return;
  }

  if (activePasswordMode === 'set') {
    const confirmValue = passwordConfirmInput.value.trim();
    if (!confirmValue) {
      alert('请确认密码');
      return;
    }
    if (value !== confirmValue) {
      alert('两次输入的密码不一致');
      return;
    }
  }

  closePasswordModal(value);
});

passwordInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    passwordOkBtn.click();
  }
});

passwordConfirmInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    passwordOkBtn.click();
  }
});

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);
