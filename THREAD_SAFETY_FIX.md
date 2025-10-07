# 線程安全修復文檔
# Thread Safety Fix Documentation

## 🐛 問題描述

在搜尋電台或執行其他操作時，出現以下錯誤：

```
Player is accessed on the wrong thread.
```

這是因為 React Native 的 Native 模組（如音訊播放器）必須在主線程（UI線程）上訪問，但某些操作（如搜尋、異步處理）可能在後台線程完成，然後嘗試直接訪問播放器模組。

## ⚠️ 錯誤原因

### 線程模型

```
React Native 線程模型：
┌────────────────────┐
│   主線程 (UI)      │ ← Native 模組必須在這裡訪問
├────────────────────┤
│   JS 線程          │ ← JavaScript 代碼執行
├────────────────────┤
│   後台線程         │ ← 異步操作（網路請求、搜尋等）
└────────────────────┘
```

### 問題場景

```javascript
// ❌ 錯誤：可能在後台線程調用
async handleSearch() {
  const results = await searchStations(); // 後台線程
  await AudioPlayerService.play(results[0]); // ❌ 錯誤的線程！
}
```

## ✅ 解決方案

使用 React Native 的 `InteractionManager.runAfterInteractions()` 確保所有播放器操作都在主線程執行。

### 修復模式

```javascript
// ✅ 正確：使用 InteractionManager 確保在主線程執行
import { InteractionManager } from 'react-native';

async handleSearch() {
  const results = await searchStations(); // 後台線程 OK
  
  // 確保播放器操作在主線程執行
  InteractionManager.runAfterInteractions(async () => {
    try {
      await AudioPlayerService.play(results[0]); // ✅ 主線程
    } catch (error) {
      console.error('播放失敗:', error);
    }
  });
}
```

## 📝 修復的文件

### 1. AIAssistantScreen.tsx

修復搜尋後播放電台的線程問題：

```typescript
// 添加 InteractionManager 導入
import { InteractionManager } from 'react-native';

// 修復播放預覽
const handlePlayPreview = async (station: StationResult) => {
  InteractionManager.runAfterInteractions(async () => {
    await AudioPlayerService.play(tempStation);
  });
};

// 修復頁面離開時停止
useFocusEffect(
  useCallback(() => {
    return () => {
      InteractionManager.runAfterInteractions(async () => {
        await AudioPlayerService.stop();
      });
    };
  }, [])
);
```

### 2. HomeScreen.tsx

修復首頁播放控制的線程問題：

```typescript
import { InteractionManager } from 'react-native';

// 修復播放/暫停
const handlePlayPause = async () => {
  InteractionManager.runAfterInteractions(async () => {
    await AudioPlayerService.play/pause/resume();
  });
};

// 修復停止
const handleStop = async () => {
  InteractionManager.runAfterInteractions(async () => {
    await AudioPlayerService.stop();
  });
};

// 修復上一個/下一個
const handlePrevious/Next = async () => {
  InteractionManager.runAfterInteractions(async () => {
    await AudioPlayerService.play(station);
  });
};
```

### 3. StationsScreen.tsx

修復電台列表點擊播放的線程問題：

```typescript
import { InteractionManager } from 'react-native';

const handleStationPress = async (station: Station) => {
  await StorageManager.setCurrentStation(station); // 可以在任何線程
  
  InteractionManager.runAfterInteractions(async () => {
    await AudioPlayerService.play(station); // 主線程
  });
};
```

### 4. FavoritesScreen.tsx

修復我的最愛播放的線程問題：

```typescript
import { InteractionManager } from 'react-native';

const handleStationPress = async (station: Station) => {
  await StorageManager.setCurrentStation(station);
  
  InteractionManager.runAfterInteractions(async () => {
    await AudioPlayerService.play(station);
  });
};
```

## 🔧 InteractionManager 工作原理

### runAfterInteractions()

```javascript
InteractionManager.runAfterInteractions(() => {
  // 這段代碼會在：
  // 1. 當前所有交互動畫完成後
  // 2. 在主線程上執行
  // 這確保了 UI 流暢且 Native 模組訪問安全
});
```

### 執行時序

```
用戶操作
  ↓
JavaScript 事件處理
  ↓
InteractionManager 排隊
  ↓
等待動畫完成
  ↓
在主線程執行 ← Native 模組在這裡安全訪問
```

## 📊 修復前後對比

### 修復前 ❌

```
用戶搜尋電台
  ↓
搜尋結果返回（後台線程）
  ↓
直接調用 AudioPlayerService.play()
  ↓
❌ Player is accessed on the wrong thread
```

### 修復後 ✅

```
用戶搜尋電台
  ↓
搜尋結果返回（後台線程）
  ↓
InteractionManager.runAfterInteractions()
  ↓
切換到主線程
  ↓
安全調用 AudioPlayerService.play()
  ↓
✅ 播放成功
```

## 🎯 最佳實踐

### 規則

1. **所有 AudioPlayerService 操作都應該包裝在 InteractionManager 中**
   ```typescript
   InteractionManager.runAfterInteractions(async () => {
     await AudioPlayerService.play/pause/resume/stop();
   });
   ```

2. **數據操作可以在任何線程**
   ```typescript
   // ✅ 這些可以直接調用
   await StorageManager.setCurrentStation();
   await RadioBrowserService.searchStations();
   ```

3. **UI 更新會自動在主線程**
   ```typescript
   // ✅ React state 更新會自動排隊到主線程
   setPlayingUrl(url);
   setCurrentStation(station);
   ```

### 模板

```typescript
// 標準播放器操作模板
const handlePlayerAction = async () => {
  try {
    // 1. 數據操作（任何線程 OK）
    await StorageManager.doSomething();
    setUIState(newState);
    
    // 2. 播放器操作（必須主線程）
    InteractionManager.runAfterInteractions(async () => {
      try {
        await AudioPlayerService.play/pause/resume/stop();
      } catch (error) {
        console.error('播放器錯誤:', error);
        // 錯誤處理
      }
    });
  } catch (error) {
    console.error('操作錯誤:', error);
  }
};
```

## 🧪 測試要點

### 驗證修復

1. **搜尋後播放**
   - 進入 AI 語音助手
   - 搜尋電台
   - 點擊播放
   - ✅ 不應出現線程錯誤

2. **快速切換電台**
   - 在我的最愛中快速點擊多個電台
   - ✅ 不應出現線程錯誤

3. **後台操作**
   - 播放電台
   - 切換到其他應用
   - 返回應用
   - ✅ 不應出現線程錯誤

## 📚 參考資料

- [React Native InteractionManager](https://reactnative.dev/docs/interactionmanager)
- [React Native Threading Model](https://reactnative.dev/docs/performance)
- [expo-av Audio Documentation](https://docs.expo.dev/versions/latest/sdk/av/)

## 🚨 注意事項

### 不要過度使用

```typescript
// ❌ 不必要的包裝
InteractionManager.runAfterInteractions(() => {
  console.log('Hello'); // 不需要，這不是 Native 操作
});

// ✅ 只在 Native 模組調用時使用
InteractionManager.runAfterInteractions(() => {
  AudioPlayerService.play(); // Native 操作，需要
});
```

### 錯誤處理

```typescript
// ✅ 總是包含錯誤處理
InteractionManager.runAfterInteractions(async () => {
  try {
    await AudioPlayerService.play(station);
  } catch (error) {
    console.error('播放失敗:', error);
    // 更新 UI 顯示錯誤
  }
});
```

---

**修復日期**: 2025-10-07
**影響範圍**: 所有涉及 AudioPlayerService 的操作
**測試狀態**: 待驗證

