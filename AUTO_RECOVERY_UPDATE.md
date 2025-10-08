# 自動恢復機制更新
# Auto Recovery Mechanism Update

## 🎯 新增功能：主動健康檢查

### 問題
播放中斷後無法自動恢復，特別是：
- 鎖屏後長時間播放停止
- 網路暫時中斷後無法恢復
- Sound 實例損壞但未觸發錯誤回調

### 解決方案：健康檢查機制

添加了主動的健康檢查系統，每30秒自動檢查播放狀態並嘗試恢復。

---

## 🔧 實現細節

### 1. 新增變量

```typescript
private static healthCheckInterval: NodeJS.Timeout | null = null; // 健康檢查計時器
private static lastHealthCheckTime: number = 0; // 上次健康檢查時間
```

### 2. 健康檢查邏輯

```typescript
private static startHealthCheck(): void {
  console.log('🏥 啟動播放健康檢查（每30秒）');
  
  this.healthCheckInterval = setInterval(async () => {
    if (this.shouldKeepPlaying && !this.isUserStopped) {
      // 檢查1: Sound 實例是否存在
      if (!this.sound) {
        console.warn('⚠️ 健康檢查: sound 實例不存在，嘗試恢復...');
        await this.startPlayback();
        return;
      }
      
      // 檢查2: Sound 是否已加載
      const status = await this.sound.getStatusAsync();
      if (!status.isLoaded) {
        console.warn('⚠️ 健康檢查: sound 未加載，嘗試恢復...');
        await this.startPlayback();
        return;
      }
      
      // 檢查3: 是否應該播放但實際停止
      if (!status.isPlaying && !status.isBuffering) {
        const timeSinceLastPlaying = Date.now() - this.lastPlayingTime;
        if (timeSinceLastPlaying > 60000) { // 超過1分鐘
          console.warn('⚠️ 已停止播放過久，強制恢復');
          await this.startPlayback();
        }
      }
    }
  }, 30000); // 每30秒
}
```

### 3. 觸發時機

```typescript
// 播放成功後啟動健康檢查
await sound.playAsync();
this.startHealthCheck();
```

### 4. 停止時機

```typescript
// 用戶主動停止時
static async stop(): Promise<void> {
  this.stopHealthCheck();
  // ...
}

// 清理時
static async cleanup(): Promise<void> {
  this.stopHealthCheck();
  // ...
}
```

---

## 📊 檢查流程圖

```
每30秒自動檢查
       ↓
是否應該播放？
       ↓ 是
Sound 實例存在？ → 否 → 重新創建並播放
       ↓ 是
Sound 已加載？ → 否 → 重新創建並播放
       ↓ 是
正在播放或緩衝？ → 否 → 檢查停止時間
       ↓            ↓
     繼續監控    超過1分鐘？ → 是 → 強制恢復
                     ↓ 否
                  繼續監控
```

---

## ✨ 優勢

### 1. 主動檢測 vs 被動等待

**之前**:
- 只在錯誤回調時嘗試恢復
- 如果錯誤未觸發，無法自動恢復

**現在**:
- 定期主動檢查狀態
- 即使沒有錯誤回調也能發現問題

### 2. 多層檢查

1. **實例檢查**: Sound 對象是否存在
2. **加載檢查**: Sound 是否正確加載
3. **播放檢查**: 是否真的在播放
4. **時間檢查**: 停止播放是否過久

### 3. 容錯處理

```typescript
try {
  const status = await this.sound.getStatusAsync();
  // ...
} catch (statusError) {
  console.error('❌ 健康檢查: 獲取狀態失敗', statusError);
  // 如果無法獲取狀態，Sound 可能已損壞
  await this.startPlayback();
}
```

---

## 🧪 測試場景

### 場景 1: 鎖屏長時間播放

```
1. 開始播放
2. 鎖定屏幕
3. 等待 2 分鐘

預期結果:
- 每 30 秒進行健康檢查
- 如果停止，在下次檢查時自動恢復
- 日誌顯示: "🏥 啟動播放健康檢查"
```

### 場景 2: 網路暫時中斷

```
1. 開始播放
2. 關閉 WiF
3. 等待 30 秒
4. 打開 WiFi

預期結果:
- 網路中斷時觸發錯誤恢復
- 健康檢查作為備用機制
- 即使錯誤恢復失敗，健康檢查也會嘗試恢復
```

### 場景 3: Sound 實例損壞

```
1. 開始播放
2. 系統強制回收資源
3. Sound 實例變為 null

預期結果:
- 下次健康檢查（最多30秒內）發現 Sound 為 null
- 自動重新創建並開始播放
- 日誌顯示: "⚠️ 健康檢查: sound 實例不存在，嘗試恢復..."
```

---

## 📝 日誌示例

### 正常運行

```
🏥 啟動播放健康檢查（每30秒）
... (30秒後)
[健康檢查] 播放狀態正常
... (30秒後)
[健康檢查] 播放狀態正常
```

### 檢測到問題並恢復

```
🏥 啟動播放健康檢查（每30秒）
... (30秒後)
⚠️ 健康檢查: 應該播放但已停止，嘗試恢復...
⚠️ 已停止播放 65 秒，強制恢復
🎵 Starting playback for: [電台名稱]
🎵 Loading stream from: [URL]
Stream playing successfully
✅ Keep Awake 已激活（屏幕關閉時繼續播放）
```

### Sound 實例損壞

```
🏥 啟動播放健康檢查（每30秒）
... (30秒後)
⚠️ 健康檢查: sound 實例不存在，嘗試恢復...
🎵 Starting playback for: [電台名稱]
🎵 Loading stream from: [URL]
Stream playing successfully
```

---

## ⚙️ 配置選項

### 調整檢查間隔

```typescript
// 在 startHealthCheck() 中修改
setInterval(async () => {
  // ...
}, 30000); // ← 修改這個值（毫秒）

// 建議範圍:
// - 15000 (15秒) - 更快恢復，但更耗電
// - 30000 (30秒) - 平衡 (默認)
// - 60000 (60秒) - 省電，但恢復較慢
```

### 調整停止閾值

```typescript
// 超過多久停止才觸發恢復
if (timeSinceLastPlaying > 60000) { // ← 修改這個值（毫秒）
  await this.startPlayback();
}

// 建議範圍:
// - 30000 (30秒) - 快速恢復
// - 60000 (60秒) - 平衡 (默認)
// - 120000 (120秒) - 寬鬆
```

---

## 🎯 與現有機制的配合

### 多層保護

1. **實時錯誤處理** - 立即響應錯誤
   ```typescript
   onPlaybackStatusUpdate() {
     if (status.error) {
       this.handlePlaybackError();
     }
   }
   ```

2. **網路監聽** - 網路恢復時重連
   ```typescript
   BackgroundTaskService.setNetworkCallback((isConnected) => {
     if (isConnected && this.shouldKeepPlaying) {
       this.handlePlaybackError();
     }
   });
   ```

3. **緩衝超時** - 長時間緩衝時重試
   ```typescript
   setTimeout(() => {
     this.handlePlaybackError();
   }, Config.NETWORK_RETRY.bufferingTimeout);
   ```

4. **健康檢查** ⭐ **新增** - 定期主動檢查
   ```typescript
   setInterval(() => {
     if (應該播放但已停止) {
       await this.startPlayback();
     }
   }, 30000);
   ```

---

## 📚 更新的文件

- ✅ `src/services/AudioPlayerService.ts` - 添加健康檢查機制

---

## 🚀 使用說明

### 重新構建 APK

```bash
cd android
./gradlew assembleRelease
```

### 安裝測試

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

### 查看日誌

```bash
# 監控健康檢查
adb logcat | grep "健康檢查\|Health"

# 監控恢復
adb logcat | grep "恢復\|Recovery"
```

---

## ✅ 驗證清單

測試以下場景確認功能正常：

- [ ] 播放開始後看到 "🏥 啟動播放健康檢查"
- [ ] 鎖屏後播放繼續（超過 2 分鐘）
- [ ] 如果播放停止，30秒內自動恢復
- [ ] 網路中斷後自動恢復
- [ ] 停止播放時健康檢查停止

---

**更新日期**: 2025-10-08  
**版本**: v1.0.3  
**狀態**: ✅ 健康檢查機制已添加

**現在播放應該能夠自動恢復了！** 🎉
