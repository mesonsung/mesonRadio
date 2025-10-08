# 屏幕解鎖播放器重複問題修復
# Screen Unlock Duplicate Player Fix

## 🐛 問題描述

**用戶反饋**: 屏幕打開後，好像多了一個播放器繼續播放

### 問題根源

在 `HomeScreen.tsx` 中存在以下問題：

1. **重複初始化**: 
   - `App.tsx` 在應用啟動時已經初始化了 `AudioPlayerService`
   - `HomeScreen` 的 `useEffect` 又重複調用了 `AudioPlayerService.initialize()`
   - 每次屏幕解鎖或應用恢復時，HomeScreen 重新挂載，導致重複初始化

2. **不當的清理**:
   - HomeScreen 的 cleanup 函數調用了 `AudioPlayerService.cleanup()`
   - 這會在組件卸載時停止播放，但組件卸載可能發生在：
     - 切換標籤頁
     - 應用進入後台
     - 屏幕鎖定
   - 這與後台播放的需求相衝突

## ✅ 解決方案

### 修改 `src/screens/HomeScreen.tsx`

**移除重複初始化**:
```typescript
// 之前（錯誤）❌
useEffect(() => {
  initializePlayer(); // 重複初始化

  return () => {
    AudioPlayerService.cleanup(); // 不當清理
  };
}, []);

const initializePlayer = async () => {
  await AudioPlayerService.initialize(); // 重複初始化
  AudioPlayerService.setStatusCallback(handleStatusChange);
};
```

**修改後（正確）✅**:
```typescript
useEffect(() => {
  // 只設置狀態回調，不重複初始化（App.tsx 已初始化）
  AudioPlayerService.setStatusCallback(handleStatusChange);
  
  // 載入初始數據
  loadData();

  // 不需要 cleanup - 讓播放器在後台繼續運行
  return () => {
    // 只清除狀態回調，不停止播放
    AudioPlayerService.setStatusCallback(() => {});
  };
}, []);

// 移除 initializePlayer 函數
```

## 🔍 為什麼會出現多個播放器？

1. **初始化時機**:
   - App 啟動 → 初始化播放器 (正確)
   - HomeScreen 掛載 → 又初始化播放器 (錯誤)
   - 屏幕解鎖 → HomeScreen 重新掛載 → 再次初始化播放器 (錯誤)

2. **Sound 對象重複創建**:
   - 雖然代碼中有清理舊 Sound 對象的邏輯
   - 但重複初始化可能導致競態條件
   - 舊的 Sound 對象可能還在播放，而新的又被創建

3. **後台任務與前台組件衝突**:
   - 後台任務試圖維持播放
   - HomeScreen 的 cleanup 試圖停止播放
   - 屏幕解鎖時兩者衝突，導致混亂

## 📊 修復效果

### 之前 ❌
```
應用啟動
  └─> App.tsx 初始化播放器 ✅
  └─> HomeScreen 初始化播放器 ❌ (重複)

屏幕鎖定
  └─> HomeScreen 卸載
  └─> cleanup() 停止播放 ❌ (不應該停止)

屏幕解鎖
  └─> HomeScreen 重新掛載
  └─> initializePlayer() 又初始化 ❌ (重複)
  └─> 可能創建多個 Sound 對象 ❌
```

### 之後 ✅
```
應用啟動
  └─> App.tsx 初始化播放器 ✅ (只初始化一次)

HomeScreen 掛載
  └─> 只設置狀態回調 ✅
  └─> 載入數據 ✅

屏幕鎖定
  └─> HomeScreen 可能卸載
  └─> 只清除狀態回調 ✅
  └─> 播放繼續 ✅

屏幕解鎖
  └─> HomeScreen 重新掛載
  └─> 重新設置狀態回調 ✅
  └─> 重新載入數據 ✅
  └─> 播放器保持單一實例 ✅
```

## 🧪 測試步驟

### 測試 1: 基本鎖屏測試
```
1. 開啟應用，播放電台
2. 按下電源鍵（鎖屏）
3. ✅ 檢查音訊是否繼續播放（只有一個播放器）
4. 再次按下電源鍵（解鎖）
5. ✅ 檢查是否沒有多個播放器
6. ✅ 檢查應用狀態是否正常
```

### 測試 2: 多次鎖屏/解鎖測試
```
1. 開啟應用，播放電台
2. 重複鎖屏/解鎖 5 次
3. ✅ 檢查每次解鎖後是否只有一個播放器
4. ✅ 檢查音量是否正常（沒有疊加）
```

### 測試 3: 切換標籤頁測試
```
1. 開啟應用，播放電台
2. 切換到其他標籤頁（電台列表、設定等）
3. ✅ 檢查播放是否繼續
4. 切換回首頁
5. ✅ 檢查是否沒有重新創建播放器
```

### 測試 4: 應用進入後台測試
```
1. 開啟應用，播放電台
2. 按 Home 鍵（應用進入後台）
3. ✅ 檢查播放是否繼續
4. 重新開啟應用
5. ✅ 檢查是否沒有多個播放器
```

## 📝 最佳實踐

### ✅ 正確做法

1. **單一初始化點**:
   - 只在應用啟動時（App.tsx）初始化一次全局服務
   - 子組件不應該重複初始化全局服務

2. **組件職責分離**:
   - 全局服務（如 AudioPlayerService）應該在 App 層級管理
   - 組件只負責訂閱/取消訂閱狀態更新

3. **避免過度清理**:
   - 組件卸載時不應該清理全局服務
   - 只清理組件自己的訂閱和狀態

### ❌ 錯誤做法

1. **重複初始化全局服務**:
   ```typescript
   // 錯誤 ❌
   useEffect(() => {
     GlobalService.initialize(); // 不要在組件中初始化全局服務
   }, []);
   ```

2. **在組件中清理全局服務**:
   ```typescript
   // 錯誤 ❌
   useEffect(() => {
     return () => {
       GlobalService.cleanup(); // 不要在組件中清理全局服務
     };
   }, []);
   ```

3. **混淆組件生命週期與服務生命週期**:
   ```typescript
   // 錯誤 ❌
   // 組件掛載 → 初始化服務
   // 組件卸載 → 清理服務
   // 這會導致服務隨組件重複創建/銷毀
   ```

## 🔗 相關文件

- **[AudioPlayerService.ts](./src/services/AudioPlayerService.ts)** - 音訊播放服務
- **[HomeScreen.tsx](./src/screens/HomeScreen.tsx)** - 首頁組件（已修復）
- **[App.tsx](./App.tsx)** - 應用入口（全局初始化點）

## 📅 修復日期

2025-10-08

## 🎯 修復結果

- ✅ 移除重複的 AudioPlayerService 初始化
- ✅ 移除不當的 cleanup 調用
- ✅ 確保播放器只有一個實例
- ✅ 屏幕解鎖後不會創建多個播放器
- ✅ 後台播放不受影響

