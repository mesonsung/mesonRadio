# 流媒體緩衝架構說明
# Streaming Buffer Architecture

## 📡 整體架構

本應用使用標準的流媒體播放架構，數據流程如下：

```
┌──────────────────────────────────────────────────────────────┐
│                    完整的數據流程                               │
└──────────────────────────────────────────────────────────────┘

網路電台伺服器
    ↓ (HTTP/HTTPS Stream)
[網路層]
    ↓ 接收數據包
[網路重試機制] ← 3次快速重試 (0.5s, 1s, 1.5s)
    ↓ 數據流
[Native 緩衝區] ← expo-av 底層自動管理
    ↓ 緩衝數據
[解碼器] ← Native 層解碼 (iOS: AVPlayer, Android: MediaPlayer)
    ↓ PCM 音訊數據
[播放器] ← 從緩衝區取出並播放
    ↓
揚聲器/耳機
```

## 🔧 緩衝機制詳解

### 1. Native 層緩衝 (自動管理)

**iOS (AVPlayer)**
- 自動管理緩衝區大小
- 根據網路狀況動態調整
- 支援 HTTP Live Streaming (HLS)

**Android (MediaPlayer/ExoPlayer)**
- 內建緩衝隊列
- 支援多種串流格式
- 自動處理網路波動

### 2. 緩衝狀態監控

我們的應用監控以下緩衝狀態：

```typescript
{
  isPlaying: boolean,        // 是否正在播放
  isBuffering: boolean,      // 是否正在緩衝（需要更多數據）
  playableDurationMillis: number,  // 已緩衝的可播放時長（毫秒）
  positionMillis: number,    // 當前播放位置
  durationMillis: number     // 總時長（直播流為 0）
}
```

### 3. 緩衝配置

在 `src/constants/config.ts` 中配置：

```typescript
BUFFER_CONFIG: {
  preferredForwardBufferDuration: 5000,  // 前向緩衝 5 秒
  progressUpdateInterval: 500,           // 每 0.5 秒更新緩衝狀態
}
```

## 🔄 重試機制

### 雙層重試架構

#### 第一層：網路層快速重試
```
網路請求失敗
  ↓
嘗試 1: 立即重試
  ↓ 失敗
嘗試 2: 0.5秒後重試
  ↓ 失敗
嘗試 3: 1秒後重試
  ↓ 失敗
進入串流層重試
```

#### 第二層：串流層持久重試
```
所有網路嘗試失敗
  ↓
等待 3 秒
  ↓
重新進入完整播放流程
  ├─ 網路層: 3次快速重試
  └─ 失敗則繼續等待 3 秒
  ↓
無限循環（直到使用者停止）
```

## 📊 緩衝狀態處理

### 正常播放流程

```
1. 用戶點擊播放
   ↓
2. [LOADING] 建立連接，開始接收數據
   ↓
3. [BUFFERING] Native 緩衝區填充數據
   ↓ 緩衝區有足夠數據
4. [PLAYING] 開始播放
   ↓
5. 持續接收數據 → 緩衝區 → 播放
   ↓ 如果網路慢於播放速度
6. [BUFFERING] 暫停播放，等待更多數據
   ↓ 緩衝區再次填滿
7. [PLAYING] 繼續播放
```

### 錯誤處理流程

```
網路中斷或串流錯誤
   ↓
[ERROR] 通知錯誤狀態
   ↓
檢查：使用者是否停止？
   ├─ 是 → 停止
   └─ 否 → 進入重試
       ↓
[BUFFERING] 顯示緩衝中
       ↓
等待 3 秒後重試
       ↓
重新建立連接
```

## 🎯 優化建議

### 1. 網路優化
- 使用 CDN 加速
- 選擇地理位置較近的電台
- 使用較低比特率的串流（更穩定）

### 2. 緩衝優化
- 調整 `preferredForwardBufferDuration` (預設 5 秒)
- 在良好網路環境可增加到 10-15 秒
- 在弱網環境可減少到 2-3 秒（更快開始播放）

### 3. 重試優化
- 調整 `streamRetryInterval` (預設 3 秒)
- 可根據實際情況調整為 1-10 秒

## 📝 診斷日誌

應用每 2 秒記錄一次緩衝狀態：

```
Buffer status: {
  isPlaying: true,
  isBuffering: false,
  playableDuration: 5234,  // 已緩衝 5.2 秒
  position: 12456,         // 播放到 12.4 秒
  duration: 0              // 直播流無總時長
}
```

## 🔍 常見問題

### Q: 為什麼會出現緩衝？
A: 當網路接收數據的速度慢於播放速度時，緩衝區會耗盡，播放器暫停等待更多數據。

### Q: 如何減少緩衝次數？
A: 
1. 確保網路連接穩定
2. 選擇比特率較低的電台
3. 增加 `preferredForwardBufferDuration`

### Q: 重試會消耗更多流量嗎？
A: 重試只會在連接失敗時發生，不會重複下載已緩衝的數據。

### Q: 為什麼使用雙層重試？
A: 
- 網路層快速重試：處理瞬時網路抖動（< 2 秒內恢復）
- 串流層持久重試：處理長時間中斷（持續重試直到恢復）

## 🚀 效能指標

### 理想狀態
- 首次播放延遲: < 2 秒
- 緩衝次數: 0 次/小時
- 重連時間: < 5 秒

### 弱網環境
- 首次播放延遲: 3-10 秒
- 緩衝次數: 可能頻繁
- 重連時間: 持續重試直到恢復

## 📚 技術參考

- [expo-av 文檔](https://docs.expo.dev/versions/latest/sdk/av/)
- [iOS AVPlayer](https://developer.apple.com/documentation/avfoundation/avplayer)
- [Android MediaPlayer](https://developer.android.com/reference/android/media/MediaPlayer)
- [HTTP Live Streaming](https://developer.apple.com/streaming/)

---

**最後更新**: 2025-10-07
**版本**: 1.0.0

