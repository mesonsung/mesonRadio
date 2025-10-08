# 屏幕關閉播放修復方案 V2
# Screen-Off Playback Fix V2

## 🐛 問題描述

**用戶反饋**: 屏幕關閉後，無法自動持續播放

## 🔍 問題分析

### 之前的配置

雖然已經實現了以下功能：
- ✅ WAKE_LOCK 權限
- ✅ expo-keep-awake 套件
- ✅ 前台服務通知
- ✅ staysActiveInBackground: true

但仍然無法在屏幕關閉後持續播放，原因如下：

### 根本原因

1. **音頻中斷模式不當**: 
   - 使用 `InterruptionModeAndroid.DoNotMix` 
   - 這會導致系統在某些情況下暫停音頻
   
2. **KeepAwake 未在應用層級激活**:
   - 只在 AudioPlayerService 中激活
   - 沒有在 App 組件中使用 `<KeepAwake />` 組件
   
3. **缺少 AppState 監聽**:
   - 沒有監聽應用狀態變化
   - 無法在屏幕關閉/開啟時做出響應

## ✅ 解決方案

### 1. 修改 App.tsx - 添加應用層級的 KeepAwake

```typescript
import { KeepAwake } from 'expo-keep-awake';
import { AppState } from 'react-native';

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // 監聽應用狀態變化
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const playing = AudioPlayerService.getIsPlaying();
      setIsPlaying(playing);
      
      if (nextAppState === 'background' && playing) {
        console.log('📱 App 進入後台，保持播放');
      }
    });

    return () => subscription?.remove();
  }, []);

  return (
    <>
      {/* ⭐ 關鍵：當播放時保持喚醒 */}
      {isPlaying && <KeepAwake />}
      <AppNavigator />
    </>
  );
}
```

### 2. 修改音頻中斷模式

```typescript
// AudioPlayerService.ts

await Audio.setAudioModeAsync({
  staysActiveInBackground: true,        // ⭐ 關鍵
  playsInSilentModeIOS: true,
  shouldDuckAndroid: false,
  playThroughEarpieceAndroid: false,
  // ⭐ 改用 DuckOthers（更穩定）
  interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
  interruptionModeIOS: InterruptionModeIOS.DuckOthers,
});
```

### 3. 增強音頻會話管理

```typescript
// 創建音頻對象後，確保設置狀態
await sound.setStatusAsync({
  shouldPlay: true,
  volume: Config.DEFAULT_VOLUME,
});

await sound.playAsync();
```

## 🔧 修改的文件

### 1. App.tsx

**新增**:
- 導入 `KeepAwake` 組件
- 導入 `AppState` API
- 添加 `isPlaying` 狀態追蹤
- 添加 AppState 監聽器
- 條件渲染 `<KeepAwake />` 組件

### 2. AudioPlayerService.ts

**修改**:
- 音頻中斷模式從 `DoNotMix` 改為 `DuckOthers`
- 添加更詳細的日誌輸出
- 增強音頻會話狀態設置

## 📊 技術細節

### KeepAwake 的兩種用法

#### 方法 1: 使用組件（推薦用於應用層級）
```typescript
import { KeepAwake } from 'expo-keep-awake';

function App() {
  return (
    <>
      <KeepAwake /> {/* 保持整個應用喚醒 */}
      <YourApp />
    </>
  );
}
```

#### 方法 2: 使用 API（用於特定功能）
```typescript
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

// 激活
await activateKeepAwakeAsync('tag-name');

// 停用
deactivateKeepAwake('tag-name');
```

**我們的方案**: 結合兩種方法
- App 層級使用 `<KeepAwake />` 組件（根據播放狀態條件渲染）
- AudioPlayerService 使用 API（更細粒度控制）

### 音頻中斷模式對比

| 模式 | 行為 | 適用場景 | 屏幕關閉穩定性 |
|------|------|----------|----------------|
| **DoNotMix** | 獨占音頻，暫停其他應用 | 遊戲、專業音頻 | ⚠️ 可能不穩定 |
| **DuckOthers** | 降低其他音頻音量 | 音樂播放器、廣播 | ✅ 穩定 |
| **MixWithOthers** | 與其他音頻混音 | 通知音效 | ⚠️ 可能衝突 |

**選擇 DuckOthers 的原因**:
- ✅ 更穩定的後台播放
- ✅ 系統不會輕易暫停音頻
- ✅ 與其他應用共存更友好
- ✅ 屏幕關閉時繼續播放

### AppState 監聽

監聽應用狀態變化，確保在不同狀態下正確管理播放：

```typescript
AppState.addEventListener('change', (nextAppState) => {
  // active: 應用在前台
  // background: 應用在後台
  // inactive: 過渡狀態（iOS）
});
```

## 🧪 測試步驟

### 測試 1: 基本屏幕關閉測試
```
1. 開啟應用，播放電台
2. 觀察控制台日誌：
   ✅ 音訊模式已配置（後台播放、屏幕關閉播放）
   ✅ Keep Awake 已激活（屏幕關閉時繼續播放）
3. 按下電源鍵（關閉屏幕）
4. ✅ 檢查音訊是否繼續播放
5. 等待 30 秒
6. ✅ 檢查音訊是否仍在播放
7. 打開屏幕
8. 觀察控制台日誌：
   📱 App State changed: active
9. ✅ 檢查播放是否正常
```

### 測試 2: 後台播放測試
```
1. 開啟應用，播放電台
2. 按 Home 鍵（進入後台）
3. 觀察控制台日誌：
   📱 App State changed: background
   📱 App 進入後台，保持播放
4. ✅ 檢查音訊是否繼續播放
5. 關閉屏幕
6. ✅ 檢查音訊是否仍在播放
7. 打開屏幕並返回應用
8. ✅ 檢查播放狀態是否正常同步
```

### 測試 3: 長時間後台測試
```
1. 開啟應用，播放電台
2. 關閉屏幕
3. 等待 5-10 分鐘
4. ✅ 檢查音訊是否仍在播放
5. ✅ 檢查通知是否仍在顯示
6. 打開屏幕
7. ✅ 檢查應用狀態是否正常
```

### 測試 4: 停止功能測試
```
1. 開啟應用，播放電台
2. 關閉屏幕
3. 從通知欄點擊應用圖標（返回應用）
4. 點擊停止按鈕
5. 觀察控制台日誌：
   🛑 User triggered stop
   ✅ Keep Awake 已停用
   ✅ 播放已停止
6. ✅ 檢查通知是否消失
7. ✅ 檢查音訊是否已停止
```

## 🔄 工作流程

### 播放開始
```
用戶點擊播放
  ↓
AudioPlayerService.play()
  ↓
設置音頻模式（staysActiveInBackground: true）✅
  ↓
創建 Sound 對象
  ↓
設置 shouldPlay: true
  ↓
激活 Keep Awake (API) ✅
  ↓
顯示前台服務通知 ✅
  ↓
App 組件檢測到 isPlaying = true
  ↓
渲染 <KeepAwake /> 組件 ✅
  ↓
開始播放
```

### 屏幕關閉
```
用戶按下電源鍵
  ↓
AppState 變為 'inactive' 或 'background'
  ↓
AppState 監聽器檢測到變化
  ↓
檢查 isPlaying 狀態
  ↓
<KeepAwake /> 組件保持活躍 ✅
  ↓
Keep Awake API 保持活躍 ✅
  ↓
前台服務通知保持運行 ✅
  ↓
音頻模式保持 staysActiveInBackground ✅
  ↓
音頻繼續播放 ✅
```

### 停止播放
```
用戶點擊停止
  ↓
AudioPlayerService.stop()
  ↓
停用 Keep Awake (API) ✅
  ↓
停止 Sound 對象
  ↓
隱藏通知 ✅
  ↓
設置 isPlaying = false
  ↓
App 組件更新狀態
  ↓
移除 <KeepAwake /> 組件 ✅
  ↓
播放停止
```

## 🎯 關鍵改進點

### 之前 ❌
```
- 只在 AudioPlayerService 使用 Keep Awake API
- 音頻中斷模式使用 DoNotMix（不穩定）
- 沒有 AppState 監聽
- 沒有應用層級的 KeepAwake
```

### 之後 ✅
```
+ 雙重 Keep Awake 保護（API + 組件）
+ 音頻中斷模式改用 DuckOthers（穩定）
+ 添加 AppState 監聽
+ 應用層級根據播放狀態渲染 KeepAwake
+ 更詳細的日誌輸出
```

## 📱 Android 電池優化處理

如果仍然無法在屏幕關閉後播放，可能需要用戶手動設置：

### 方法 1: 關閉電池優化
```
設定 → 電池 → 電池優化 
→ 找到 mesonRadio 
→ 選擇「不優化」
```

### 方法 2: 允許後台運行
```
設定 → 應用程式 → mesonRadio 
→ 電池 
→ 不受限制
```

### 方法 3: 允許自動啟動（部分品牌）
```
設定 → 應用程式 → mesonRadio 
→ 自動啟動 
→ 開啟
```

**注意**: 不同 Android 品牌的設定路徑可能不同（小米、華為、OPPO 等）

## 📚 相關資源

- [Expo Keep Awake 文檔](https://docs.expo.dev/versions/latest/sdk/keep-awake/)
- [Expo AV 文檔](https://docs.expo.dev/versions/latest/sdk/av/)
- [React Native AppState](https://reactnative.dev/docs/appstate)
- [Android 前台服務](https://developer.android.com/guide/components/foreground-services)

## 📅 修復日期

2025-10-08

## 🎯 預期結果

- ✅ 屏幕關閉後音頻繼續播放
- ✅ 應用進入後台後音頻繼續播放
- ✅ 長時間後台運行穩定
- ✅ 通知欄控制正常工作
- ✅ 網路斷線自動重連
- ✅ 播放狀態正確同步

