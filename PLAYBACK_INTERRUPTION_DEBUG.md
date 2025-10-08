# 播放中斷問題診斷
# Playback Interruption Debugging

## 🔍 診斷步驟

### 1️⃣ 確認是否安裝了最新 APK

```bash
# 檢查最新 APK 時間
ls -lh android/app/build/outputs/apk/release/app-release.apk

# 應該顯示: 十 8 12:51 (2025-10-08 12:51)

# 安裝最新 APK
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

### 2️⃣ 查看實時日誌

打開兩個終端窗口：

**終端 1 - 查看 Keep Awake 狀態**:
```bash
adb logcat | grep "Keep Awake"
```

**終端 2 - 查看播放狀態**:
```bash
adb logcat | grep -E "AudioPlayer|播放|暫停|停止|Buffering"
```

### 3️⃣ 測試場景

#### 場景 A: 基本播放測試
1. 啟動應用
2. 開始播放電台
3. 觀察日誌，應該看到：
   ```
   ✅ Keep Awake 已激活（屏幕關閉時繼續播放）
   📱 通知已顯示: [電台名稱] 播放中
   ```

#### 場景 B: 鎖屏測試
1. 播放電台
2. 鎖定屏幕（按電源鍵）
3. 等待 1-2 分鐘
4. **預期**: 音訊繼續播放
5. **如果中斷**: 記錄日誌中的錯誤信息

#### 場景 C: 後台測試
1. 播放電台
2. 按 Home 鍵返回主屏幕
3. 等待 1-2 分鐘
4. **預期**: 音訊繼續播放

---

## 🐛 常見中斷原因

### 原因 1: 電池優化 ⭐ **最常見**

**症狀**: 鎖屏後幾分鐘音訊停止

**解決方法**:
```bash
# 在設備上手動設置：
1. 設置 > 應用 > mesonRadio
2. 電池 > 不限制
3. 或者：電池優化 > 不優化
```

**驗證**:
```bash
# 檢查應用是否被優化
adb shell dumpsys deviceidle whitelist | grep mesonradio
```

### 原因 2: Keep Awake 未激活

**症狀**: 日誌中沒有 "Keep Awake 已激活" 消息

**檢查**:
```bash
# 查看 Keep Awake 狀態
adb logcat | grep "Keep Awake"

# 應該看到：
# ✅ Keep Awake 已激活（屏幕關閉時繼續播放）
```

**如果沒有看到**: 可能是權限問題或代碼未正確執行

### 原因 3: 音訊焦點丟失

**症狀**: 其他應用播放聲音時中斷

**檢查日誌**:
```bash
adb logcat | grep "Audio"
```

**解決**: 已在代碼中配置 `interruptionModeAndroid: DoNotMix`

### 原因 4: 網路問題

**症狀**: 日誌顯示網路錯誤或緩衝超時

**檢查**:
```bash
adb logcat | grep -E "Network|網路|Buffering|重試"
```

### 原因 5: 系統強制停止

**症狀**: 應用進程被系統殺死

**檢查**:
```bash
# 查看應用進程狀態
adb shell ps | grep mesonradio

# 查看系統日誌
adb logcat | grep -E "killed|force"
```

---

## 🔧 調試命令集合

### 實時監控

```bash
# 完整日誌（過濾關鍵信息）
adb logcat | grep -E "Keep Awake|AudioPlayer|通知|播放|網路|Battery"

# 只看錯誤
adb logcat *:E | grep mesonradio

# 查看應用狀態
adb shell dumpsys activity processes | grep mesonradio
```

### 權限檢查

```bash
# 查看已授予的權限
adb shell dumpsys package com.meson.mesonradio | grep permission

# 查看電池優化狀態
adb shell dumpsys deviceidle whitelist
```

### 應用信息

```bash
# 查看應用詳情
adb shell dumpsys package com.meson.mesonradio

# 查看應用活動
adb shell dumpsys activity com.meson.mesonradio
```

---

## 📝 請提供以下信息

為了更準確地診斷問題，請提供：

### 1. 中斷發生時間
- [ ] 鎖屏後立即中斷（< 5秒）
- [ ] 鎖屏後短時間中斷（5秒 - 1分鐘）
- [ ] 鎖屏後較長時間中斷（1-5分鐘）
- [ ] 鎖屏後很長時間中斷（> 5分鐘）

### 2. 中斷場景
- [ ] 鎖定屏幕後中斷
- [ ] 按 Home 鍵後中斷
- [ ] 播放一段時間後自動中斷
- [ ] 網路切換時中斷
- [ ] 其他應用播放聲音時中斷

### 3. 日誌信息

**執行以下命令並提供輸出**:

```bash
# 啟動應用並播放，然後鎖屏，等待中斷發生
# 同時在另一個終端運行：
adb logcat -d | grep -A 5 -B 5 "Keep Awake\|停止\|中斷\|killed"
```

### 4. 設備信息

```bash
# 設備型號和 Android 版本
adb shell getprop ro.product.model
adb shell getprop ro.build.version.release

# 電池優化狀態
adb shell dumpsys deviceidle whitelist | grep mesonradio
```

---

## 🎯 可能的額外修復

根據您的反饋，可能需要：

### 選項 1: 增加 WakeLock 強度

如果 Keep Awake 不夠強，可以添加額外的 WakeLock：

```typescript
// 在 AudioPlayerService.ts 中添加
import { Platform } from 'react-native';

// Android 原生 WakeLock
if (Platform.OS === 'android') {
  // 需要添加原生模塊
}
```

### 選項 2: 使用前台服務優先級

確保通知設置為高優先級：

```typescript
// 在 MediaNotificationService.ts 中
importance: Notifications.AndroidImportance.MAX, // 改為 MAX
```

### 選項 3: 添加心跳檢測

定期發送心跳保持連接：

```typescript
// 每 30 秒檢查一次播放狀態
setInterval(() => {
  if (this.shouldKeepPlaying && !this.isPlaying) {
    this.handlePlaybackError(new Error('Heartbeat check failed'));
  }
}, 30000);
```

---

## 📱 快速測試腳本

創建測試腳本 `test_playback.sh`:

```bash
#!/bin/bash

echo "🔍 開始播放測試..."

# 1. 安裝最新 APK
echo "📦 安裝應用..."
adb install -r android/app/build/outputs/apk/release/app-release.apk

# 2. 啟動應用
echo "🚀 啟動應用..."
adb shell am start -n com.meson.mesonradio/.MainActivity

# 3. 等待應用啟動
sleep 5

# 4. 監控日誌
echo "📊 監控日誌（按 Ctrl+C 停止）..."
adb logcat -c  # 清除舊日誌
adb logcat | grep --line-buffered -E "Keep Awake|AudioPlayer|通知|播放|停止|killed"
```

**使用方法**:
```bash
chmod +x test_playback.sh
./test_playback.sh
```

---

## 💡 臨時測試方案

如果需要快速測試，可以使用 Expo Go：

```bash
# 1. 啟動開發服務器
npm start

# 2. 在手機上用 Expo Go 掃碼

# 3. 測試播放
# 注意：Expo Go 可能沒有完整的後台支持
```

---

## 📞 需要的反饋

請告訴我：

1. **是否安裝了最新 APK**？（12:51 生成的）
2. **中斷發生的具體時機**？（鎖屏後多久）
3. **日誌中看到了什麼**？（特別是 Keep Awake 相關）
4. **設備型號和 Android 版本**？
5. **是否關閉了電池優化**？

---

**準備好提供這些信息後，我們可以進一步診斷和修復問題。** 🔧
