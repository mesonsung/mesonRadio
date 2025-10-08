# 🚀 背景播放快速開始
# Background Playback Quick Start

## ⚡ 5 分鐘快速配置

### 1️⃣ 安裝依賴（已完成）✅

所需依賴已安裝：
```json
{
  "expo-notifications": "^0.32.12",
  "expo-task-manager": "~14.0.7",
  "expo-background-fetch": "~14.0.7",
  "@react-native-community/netinfo": "^11.4.1"
}
```

### 2️⃣ 配置權限（已完成）✅

`app.config.js` 已配置所有必要權限：
- ✅ Android: 前台服務、通知、網路監控
- ✅ iOS: 後台音訊模式
- ✅ 插件配置完成

### 3️⃣ 初始化服務

在您的主組件（例如 `App.tsx`）中添加：

```typescript
import { AudioPlayerService } from '@/services/AudioPlayerService';

function App() {
  useEffect(() => {
    // 初始化音訊服務（一次性）
    AudioPlayerService.initialize().then(() => {
      console.log('✅ 音訊系統就緒');
    });

    // 清理資源
    return () => {
      AudioPlayerService.cleanup();
    };
  }, []);

  // ... 其他代碼
}
```

### 4️⃣ 使用播放功能

在任何需要播放的地方：

```typescript
import { AudioPlayerService } from '@/services/AudioPlayerService';

// 播放
const playStation = async (station: Station) => {
  await AudioPlayerService.play(station);
  // ✅ 自動顯示通知
  // ✅ 支持後台播放
  // ✅ 自動網路重試
};

// 暫停
const pauseStation = async () => {
  await AudioPlayerService.pause();
};

// 停止
const stopStation = async () => {
  await AudioPlayerService.stop();
  // ✅ 自動隱藏通知
};
```

### 5️⃣ 重新構建應用

```bash
# 方法 1: 使用 EAS (推薦)
npm run build:apk

# 方法 2: 使用 Gradle
npx expo prebuild --clean
npm run android
```

## ✅ 完成！

現在您的應用已支持：
- 📱 後台持續播放
- 🔔 媒體控制通知
- 🔄 自動網路重試
- 📡 網路斷線自動重連

## 🧪 測試

1. **後台播放測試**
   - 播放電台
   - 按 Home 鍵
   - ✅ 音訊繼續播放
   - ✅ 通知欄顯示控制

2. **網路重試測試**
   - 開始播放
   - 關閉網路
   - 等待 5 秒
   - ✅ 自動重試
   - 開啟網路
   - ✅ 自動恢復

## 📚 詳細文檔

更多信息請查看：
- `BACKGROUND_PLAYBACK_GUIDE.md` - 完整指南
- `BACKGROUND_USAGE_EXAMPLE.tsx` - 使用示例
- `BUILD_APK_GUIDE.md` - 構建指南

## 🐛 問題排查

**通知不顯示？**
```bash
# 重新構建並清除快取
npx expo prebuild --clean
npm run android
```

**後台不播放？**
```typescript
// 檢查初始化是否成功
await AudioPlayerService.initialize();
```

**網路不重連？**
```typescript
// 確認服務已初始化
const status = await BackgroundTaskService.getTaskStatus();
console.log('Task status:', status);
```

---

**最後更新**: 2025-10-08
**版本**: 1.0.1
