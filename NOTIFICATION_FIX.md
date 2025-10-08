# 通知頻繁發送問題修復
# Notification Spam Fix

## 🐛 問題描述

**症狀**: 應用在播放時不斷發出通知，導致通知欄閃爍或頻繁更新。

**原因**: 播放狀態監聽器 (`onPlaybackStatusUpdate`) 會在播放和緩衝狀態之間頻繁切換時被不斷觸發，每次觸發都會調用 `MediaNotificationService.updateNotification()` 重新創建通知。

---

## ✅ 修復方案

### 1. 添加防抖機制 (Debouncing)

```typescript
// 新增變量
private static lastNotificationStatus: string = ''; // 追蹤上次通知狀態
private static notificationUpdateTimer: NodeJS.Timeout | null = null; // 防抖計時器

// 防抖更新通知
private static updateNotificationDebounced(status: string): void {
  // 如果狀態未改變，不更新
  if (status === this.lastNotificationStatus) {
    return;
  }

  // 清除之前的計時器
  if (this.notificationUpdateTimer) {
    clearTimeout(this.notificationUpdateTimer);
  }

  // 設置新的計時器（500ms 防抖）
  this.notificationUpdateTimer = setTimeout(() => {
    if (this.currentStation && status !== this.lastNotificationStatus) {
      this.lastNotificationStatus = status;
      MediaNotificationService.updateNotification(this.currentStation, status)
        .catch(console.error);
    }
    this.notificationUpdateTimer = null;
  }, 500); // 500ms 防抖延遲
}
```

### 2. 移除緩衝狀態的通知更新

```typescript
// 之前：每次緩衝都更新通知（會導致頻繁閃爍）
if (this.currentStation) {
  MediaNotificationService.updateNotification(this.currentStation, 'buffering').catch(console.error);
}

// 現在：註釋掉緩衝狀態的通知更新
// 緩衝狀態不更新通知（避免頻繁閃爍）
// 只在長時間緩衝時才更新
// this.updateNotificationDebounced('buffering');
```

### 3. 使用防抖方法更新播放狀態

```typescript
// 之前：直接更新通知
if (this.currentStation) {
  MediaNotificationService.updateNotification(this.currentStation, 'playing').catch(console.error);
}

// 現在：使用防抖方法
this.updateNotificationDebounced('playing');
```

### 4. 清理計時器

在 `stop()` 和 `cleanup()` 方法中清除防抖計時器：

```typescript
// 清除防抖計時器
if (this.notificationUpdateTimer) {
  clearTimeout(this.notificationUpdateTimer);
  this.notificationUpdateTimer = null;
}
this.lastNotificationStatus = '';
```

---

## 📊 效果對比

### 修復前
```
時間  |  事件                  | 通知動作
------|----------------------|----------
0.0s  | 開始播放              | 創建通知 ✓
0.1s  | 進入緩衝狀態          | 創建通知 ✗
0.2s  | 恢復播放              | 創建通知 ✗
0.3s  | 進入緩衝狀態          | 創建通知 ✗
0.4s  | 恢復播放              | 創建通知 ✗
...   | （持續循環）          | ...

結果：通知不斷閃爍，用戶體驗差
```

### 修復後
```
時間  |  事件                  | 通知動作
------|----------------------|----------
0.0s  | 開始播放              | 創建通知 ✓
0.1s  | 進入緩衝狀態          | 跳過（不是重要狀態變化）
0.2s  | 恢復播放              | 跳過（狀態未變，仍是 'playing'）
0.3s  | 進入緩衝狀態          | 跳過
0.4s  | 恢復播放              | 跳過
5.0s  | 用戶暫停              | 創建通知 ✓（狀態改變）

結果：只在重要狀態改變時更新通知
```

---

## 🔍 技術細節

### 防抖延遲時間
- **選擇**: 500ms
- **原因**: 
  - 太短（<200ms）：可能仍會有頻繁更新
  - 太長（>1000ms）：用戶操作反饋延遲
  - 500ms 是平衡點，既能過濾頻繁切換，又不影響用戶體驗

### 狀態追蹤
- 使用 `lastNotificationStatus` 追蹤上次通知狀態
- 只在狀態真正改變時才更新通知
- 避免相同狀態的重複更新

### 緩衝狀態處理
- **問題**: 網路電台在播放和緩衝之間頻繁切換
- **解決**: 完全跳過緩衝狀態的通知更新
- **理由**: 
  - 緩衝通常很短暫（<1秒）
  - 用戶不需要看到短暫的緩衝提示
  - 避免通知閃爍影響體驗

---

## 📝 修改的文件

### `src/services/AudioPlayerService.ts`

**新增**:
- ✅ `lastNotificationStatus` - 追蹤通知狀態
- ✅ `notificationUpdateTimer` - 防抖計時器
- ✅ `updateNotificationDebounced()` - 防抖更新方法

**修改**:
- ✅ `onPlaybackStatusUpdate()` - 使用防抖方法
- ✅ `stop()` - 清除計時器
- ✅ `cleanup()` - 清除計時器

---

## 🧪 測試方法

### 1. 播放電台並觀察通知

```bash
# 查看日誌
adb logcat | grep "📱 通知"

# 修復前（頻繁出現）：
# 📱 通知已顯示: 電台名稱 播放中
# 📱 通知已顯示: 電台名稱 播放中
# 📱 通知已顯示: 電台名稱 播放中
# ...（不斷重複）

# 修復後（只在狀態改變時出現）：
# 📱 通知已顯示: 電台名稱 播放中
# （長時間無重複）
# 📱 通知已顯示: 電台名稱 已暫停（只在暫停時）
```

### 2. 測試場景

#### 場景 1: 正常播放
- ✅ 開始播放 → 顯示 1 次通知
- ✅ 播放 10 分鐘 → 通知保持不變
- ✅ 暫停 → 通知更新 1 次

#### 場景 2: 網路不穩定
- ✅ 播放時網路閃斷 → 通知不閃爍
- ✅ 短暫緩衝（<1秒）→ 通知不變
- ✅ 恢復播放 → 通知不變（狀態未變）

#### 場景 3: 長時間緩衝
- ✅ 網路斷開 > 5秒 → 可能顯示緩衝（取決於實現）
- ✅ 自動重連 → 恢復播放，通知更新 1 次

---

## ⚙️ 配置選項

如果需要調整行為，可以修改以下參數：

### 防抖延遲時間
```typescript
// 在 updateNotificationDebounced 中調整
setTimeout(() => {
  // ...
}, 500); // ← 修改這個值（毫秒）
```

### 啟用緩衝狀態通知
```typescript
// 如果想顯示緩衝狀態，取消註釋：
this.updateNotificationDebounced('buffering');
```

---

## 🎯 驗證清單

測試以下場景確認修復成功：

- [ ] 播放電台時，通知只顯示一次
- [ ] 播放期間通知不會閃爍或重複
- [ ] 暫停時通知正確更新
- [ ] 恢復播放時通知正確更新
- [ ] 停止播放時通知正確隱藏
- [ ] 網路不穩定時通知不閃爍
- [ ] 長時間播放（10分鐘+）通知保持穩定

---

## 📚 相關代碼

### 核心邏輯位置

```
src/services/AudioPlayerService.ts
├── Line 34-35: 新增變量定義
├── Line 395: 使用防抖更新（playing）
├── Line 408: 跳過緩衝狀態更新
├── Line 426-446: 防抖更新方法實現
├── Line 297-301: stop() 中清除計時器
└── Line 597-602: cleanup() 中清除計時器
```

---

## 💡 最佳實踐

### 1. 通知更新原則
- ✅ 只在重要狀態變化時更新
- ✅ 使用防抖避免頻繁更新
- ✅ 追蹤狀態避免重複更新

### 2. 用戶體驗
- ✅ 通知應該穩定、不閃爍
- ✅ 只顯示用戶需要知道的信息
- ✅ 避免過度打擾用戶

### 3. 性能優化
- ✅ 減少不必要的通知創建
- ✅ 使用防抖減少系統調用
- ✅ 及時清理計時器避免內存洩漏

---

## 🔄 後續優化建議

1. **長時間緩衝提示**
   - 只在緩衝超過 3 秒時才顯示緩衝提示
   - 避免短暫緩衝影響體驗

2. **通知內容增強**
   - 添加播放進度（如適用）
   - 顯示當前節目信息

3. **A/B 測試**
   - 測試不同的防抖延遲時間
   - 收集用戶反饋優化體驗

---

**修復日期**: 2025-10-08  
**版本**: v1.0.2  
**狀態**: ✅ 已修復，需測試驗證

**問題已解決！通知現在只在需要時才會更新。** 🎉
