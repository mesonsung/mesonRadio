# 背景播放與網路重傳完整指南
# Background Playback and Network Retry Guide

## 📋 概述 Overview

本應用已實現完整的後台播放和網路自動重連功能，確保音訊在應用進入後台時能夠：
- ✅ 持續播放媒體
- ✅ 自動處理網路斷線重連
- ✅ 顯示媒體控制通知
- ✅ 監控網路狀態變化
- ✅ 保持前台服務運行

---

## 🏗️ 架構說明 Architecture

### 三大核心服務

#### 1. AudioPlayerService
**音訊播放服務** - 核心播放邏輯
- 負責音訊播放、暫停、停止
- 多層網路重試機制（請求級 + 流級）
- 自動緩衝管理
- 播放狀態監控

#### 2. MediaNotificationService
**媒體通知服務** - 保持前台服務
- 顯示持續通知（無法滑動移除）
- 更新播放狀態（播放中、暫停、緩衝）
- 提供媒體控制入口
- 保持應用在後台運行

#### 3. BackgroundTaskService
**後台任務服務** - 網路監控與任務管理
- 註冊後台獲取任務
- 監控網路狀態變化
- 觸發網路恢復時的重連
- 保持後台運行權限

---

## 🔧 配置說明 Configuration

### Android 權限配置

在 `app.config.js` 中已配置以下權限：

```javascript
android: {
  permissions: [
    'INTERNET',                          // 網路訪問
    'FOREGROUND_SERVICE',                // 前台服務（基本）
    'FOREGROUND_SERVICE_MEDIA_PLAYBACK', // 前台服務（媒體播放）
    'WAKE_LOCK',                         // 保持設備喚醒
    'ACCESS_NETWORK_STATE',              // 檢測網路狀態
    'RECEIVE_BOOT_COMPLETED',            // 開機自啟動（可選）
    'POST_NOTIFICATIONS',                // 顯示通知（Android 13+）
  ],
}
```

### iOS 配置

```javascript
ios: {
  infoPlist: {
    UIBackgroundModes: ['audio'],  // 後台音訊模式
  },
}
```

### 插件配置

```javascript
plugins: [
  ['expo-av', { microphonePermission: false }],
  'expo-localization',
  [
    'expo-notifications',
    {
      icon: './assets/icon.png',
      color: '#1a1a2e',
      sounds: [],
    },
  ],
  [
    'expo-background-fetch',
    {
      minimumInterval: 15,  // 最小間隔（分鐘）
    },
  ],
  'expo-task-manager',
]
```

---

## 🚀 使用方法 Usage

### 初始化（應用啟動時）

```typescript
import { AudioPlayerService } from '@/services/AudioPlayerService';

// 在 App.tsx 或主組件中初始化
useEffect(() => {
  const initAudio = async () => {
    try {
      // 初始化音訊系統（自動初始化通知和後台任務）
      await AudioPlayerService.initialize();
      console.log('✅ 音訊系統初始化成功');
    } catch (error) {
      console.error('❌ 音訊初始化失敗:', error);
    }
  };

  initAudio();

  // 清理資源
  return () => {
    AudioPlayerService.cleanup();
  };
}, []);
```

### 播放電台

```typescript
import { AudioPlayerService } from '@/services/AudioPlayerService';

// 播放電台（自動顯示通知）
const handlePlay = async (station: Station) => {
  try {
    await AudioPlayerService.play(station);
    // ✅ 自動顯示媒體通知
    // ✅ 啟用後台播放
    // ✅ 自動網路重試
  } catch (error) {
    console.error('播放失敗:', error);
  }
};
```

### 暫停/恢復播放

```typescript
// 暫停播放（更新通知狀態）
const handlePause = async () => {
  await AudioPlayerService.pause();
  // ✅ 通知顯示「已暫停」
};

// 恢復播放（更新通知狀態）
const handleResume = async () => {
  await AudioPlayerService.resume();
  // ✅ 通知顯示「正在播放」
};
```

### 停止播放

```typescript
// 停止播放（隱藏通知）
const handleStop = async () => {
  await AudioPlayerService.stop();
  // ✅ 自動隱藏通知
  // ✅ 清理後台任務
};
```

### 監聽播放狀態

```typescript
import { PlaybackStatus } from '@/models/PlayerState';

// 設置狀態回調
AudioPlayerService.setStatusCallback((status: PlaybackStatus) => {
  switch (status) {
    case PlaybackStatus.PLAYING:
      console.log('正在播放');
      break;
    case PlaybackStatus.BUFFERING:
      console.log('緩衝中...');
      break;
    case PlaybackStatus.PAUSED:
      console.log('已暫停');
      break;
    case PlaybackStatus.ERROR:
      console.log('播放錯誤');
      break;
  }
});
```

---

## 🔄 網路重試機制 Network Retry

### 多層重試架構

#### 第1層：請求級重試
```typescript
// 配置: Config.NETWORK_RETRY.maxAttemptsPerRequest = 3
// 延遲: Config.NETWORK_RETRY.retryDelayBase = 1000ms

// 每次流媒體請求會嘗試 3 次
// 第1次失敗 → 等待 1s → 第2次嘗試
// 第2次失敗 → 等待 2s → 第3次嘗試
```

#### 第2層：流級重試
```typescript
// 配置: Config.NETWORK_RETRY.streamRetryInterval = 5000ms

// 如果所有請求級重試都失敗，會觸發流級重試
// 固定每 5 秒重試一次，直到：
// 1. 播放成功
// 2. 用戶手動停止
// 3. 網路恢復
```

#### 第3層：網路監控重連
```typescript
// BackgroundTaskService 持續監控網路狀態
// 當網路從斷線恢復時，自動觸發重連
BackgroundTaskService.setNetworkCallback((isConnected) => {
  if (isConnected && shouldKeepPlaying && !isPlaying) {
    // 立即嘗試重新連接
    handlePlaybackError(new Error('Network reconnected'));
  }
});
```

### 重試流程圖

```
用戶點擊播放
    ↓
嘗試連接 (1/3) → 失敗 → 等待 1s
    ↓
嘗試連接 (2/3) → 失敗 → 等待 2s
    ↓
嘗試連接 (3/3) → 失敗
    ↓
觸發流級重試 → 等待 5s → 重新開始請求級重試
    ↓
同時監控網路狀態 → 網路恢復 → 立即重連
```

---

## 📱 通知管理 Notification

### 通知特性

#### Android
- **前台服務通知**：無法滑動移除（sticky）
- **持續顯示**：ongoing = true
- **高優先級**：保證通知可見
- **自動更新**：隨播放狀態更新內容

#### iOS
- **後台音訊模式**：UIBackgroundModes: ['audio']
- **控制中心整合**：顯示在控制中心
- **鎖定螢幕顯示**：鎖定時也能看到

### 通知內容

```
標題：電台名稱
內容：正在播放... / 已暫停 / 緩衝中... / 載入中...
圖示：應用圖示
操作：點擊返回應用
```

---

## 🧪 測試場景 Testing Scenarios

### 1. 正常播放測試
```
1. 啟動應用
2. 選擇電台播放
3. 按下 Home 鍵（應用進入後台）
4. ✅ 音訊持續播放
5. ✅ 通知顯示「正在播放」
6. ✅ 通知欄顯示電台名稱
```

### 2. 網路斷線重連測試
```
1. 開始播放電台
2. 進入後台
3. 關閉 Wi-Fi/行動網路
4. ✅ 自動開始重試（每 5 秒一次）
5. ✅ 通知顯示「緩衝中」
6. 重新開啟網路
7. ✅ 自動恢復播放
8. ✅ 通知更新為「正在播放」
```

### 3. 長時間後台播放測試
```
1. 開始播放
2. 鎖定螢幕
3. 等待 10-30 分鐘
4. ✅ 音訊持續播放
5. ✅ 通知持續顯示
6. ✅ 不被系統殺死
```

### 4. 暫停/恢復測試
```
1. 播放中按暫停
2. ✅ 通知更新為「已暫停」
3. 進入後台
4. 點擊通知
5. 返回應用播放
6. ✅ 通知更新為「正在播放」
```

### 5. 應用重啟測試
```
1. 播放電台
2. 完全關閉應用（滑動清除）
3. 重新開啟應用
4. ✅ 初始化成功
5. ✅ 可以重新播放
```

---

## ⚙️ 調試方法 Debugging

### 查看日誌

```bash
# Android
npx react-native log-android

# iOS
npx react-native log-ios

# 過濾相關日誌
npx react-native log-android | grep -E "(AudioPlayer|Notification|Background)"
```

### 重要日誌標記

```
✅  成功操作
❌  錯誤
⚠️  警告
🔄  重試操作
📡  網路相關
📱  通知相關
🛑  停止操作
▶️  播放操作
⏸️  緩衝/暫停
```

### 檢查後台任務狀態

```typescript
import { BackgroundTaskService } from '@/services/BackgroundTaskService';

// 獲取任務狀態
const status = await BackgroundTaskService.getTaskStatus();
console.log('後台任務狀態:', status);
// Available = 1 (正常)
// Denied = 2 (被拒絕)
// Restricted = 0 (受限)

// 獲取網路狀態
const networkStatus = await BackgroundTaskService.getNetworkStatus();
console.log('網路狀態:', networkStatus);
```

---

## 🐛 常見問題 Troubleshooting

### 1. 應用進入後台後音訊停止

**可能原因：**
- 未正確初始化音訊模式
- 通知未顯示（Android 需要前台服務通知）
- 權限不足

**解決方法：**
```typescript
// 確認初始化已執行
await AudioPlayerService.initialize();

// 檢查通知權限
const { status } = await Notifications.getPermissionsAsync();
if (status !== 'granted') {
  await Notifications.requestPermissionsAsync();
}
```

### 2. 網路斷線後不自動重連

**可能原因：**
- 後台任務未註冊
- 網路監聽未設置
- shouldKeepPlaying 被重置

**解決方法：**
```typescript
// 檢查任務註冊狀態
const isRegistered = BackgroundTaskService.isTaskRegistered();
console.log('後台任務已註冊:', isRegistered);

// 手動重新初始化
await BackgroundTaskService.initialize();
```

### 3. 通知不顯示（Android）

**可能原因：**
- 通知權限未授予（Android 13+）
- 通知頻道未創建
- 前台服務權限不足

**解決方法：**
```bash
# 重新構建並安裝
npx expo prebuild --clean
npm run android

# 檢查 AndroidManifest.xml 中的權限
cat android/app/src/main/AndroidManifest.xml
```

### 4. 播放一段時間後自動停止

**可能原因：**
- 電池優化殺死應用
- 後台獲取被限制
- 系統資源不足

**解決方法：**
- Android: 在設置中將應用添加到「不受電池優化限制」列表
- iOS: 確保 UIBackgroundModes 正確配置
- 確保通知持續顯示

### 5. 編譯錯誤

**可能原因：**
- 依賴未正確安裝
- 配置文件錯誤
- Expo 配置插件問題

**解決方法：**
```bash
# 清除並重新安裝
rm -rf node_modules
npm install

# 清除 Expo 快取
npx expo start --clear

# 重新預構建
npx expo prebuild --clean
```

---

## 📊 性能優化 Performance

### 網路重試配置調整

根據實際情況調整 `Config.NETWORK_RETRY`：

```typescript
// src/constants/config.ts
export const Config = {
  NETWORK_RETRY: {
    maxAttemptsPerRequest: 3,      // 每次請求重試次數
    retryDelayBase: 1000,          // 基礎延遲（毫秒）
    streamRetryInterval: 5000,     // 流級重試間隔（毫秒）
    bufferingTimeout: 15000,       // 緩衝超時（毫秒）
  },
};

// 弱網環境：增加重試次數和延遲
maxAttemptsPerRequest: 5,
retryDelayBase: 2000,
streamRetryInterval: 10000,

// 良好網路環境：減少延遲
retryDelayBase: 500,
streamRetryInterval: 3000,
```

### 後台任務頻率

```javascript
// app.config.js
[
  'expo-background-fetch',
  {
    minimumInterval: 15,  // Android: 最小 15 分鐘
                         // iOS: 最小 1 分鐘
  },
]
```

---

## 🔒 權限說明 Permissions

### Android 權限詳解

| 權限 | 用途 | 必需 |
|------|------|------|
| `INTERNET` | 網路訪問 | ✅ 是 |
| `FOREGROUND_SERVICE` | 前台服務基本權限 | ✅ 是 |
| `FOREGROUND_SERVICE_MEDIA_PLAYBACK` | 媒體播放前台服務 | ✅ 是 |
| `WAKE_LOCK` | 保持設備喚醒 | ✅ 是 |
| `ACCESS_NETWORK_STATE` | 檢測網路狀態 | ✅ 是 |
| `POST_NOTIFICATIONS` | 顯示通知 (Android 13+) | ✅ 是 |
| `RECEIVE_BOOT_COMPLETED` | 開機自啟動 | ❌ 可選 |

### iOS 配置

| 配置 | 用途 | 必需 |
|------|------|------|
| `UIBackgroundModes: ['audio']` | 後台音訊播放 | ✅ 是 |
| 通知權限 | 顯示播放通知 | ✅ 是 |

---

## 📝 更新日誌 Changelog

### 版本 1.0.1 (2025-10-08)

**新增功能：**
- ✅ 完整的後台播放支持
- ✅ 媒體通知服務（前台服務）
- ✅ 後台任務管理
- ✅ 網路狀態監控
- ✅ 多層網路重試機制
- ✅ 自動斷線重連

**優化：**
- 🔧 改進緩衝管理
- 🔧 優化電池使用
- 🔧 增強穩定性

---

## 🔗 相關資源 Resources

### 官方文檔
- [Expo AV](https://docs.expo.dev/versions/latest/sdk/av/)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Background Fetch](https://docs.expo.dev/versions/latest/sdk/background-fetch/)
- [Expo Task Manager](https://docs.expo.dev/versions/latest/sdk/task-manager/)

### Android 開發
- [Foreground Services](https://developer.android.com/guide/components/foreground-services)
- [Media Playback](https://developer.android.com/guide/topics/media/mediaplayer)

### iOS 開發
- [Background Modes](https://developer.apple.com/documentation/avfoundation/media_playback/creating_a_basic_video_player_ios_and_tvos/enabling_background_audio)

---

## 💬 支持 Support

如遇問題，請查看：
1. 本文檔的「常見問題」章節
2. 應用日誌輸出
3. Expo 官方文檔

---

**最後更新**: 2025-10-08  
**版本**: 1.0.1  
**作者**: Meson Radio Team
