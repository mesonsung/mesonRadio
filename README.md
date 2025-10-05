# mesonRadio - 網路廣播 APP

一個跨平台的網路廣播播放器，支援 Android 和 iOS 平台。

> 🎉 **應用已成功運行！** 
> - **所有問題已解決！** 查看 [🎉應用已成功運行.md](./🎉應用已成功運行.md)
> - 使用 `npx expo start -c --port 8086` 立即開始
> - 已簡化配置，移除不必要的複雜性

## 功能特色

### 核心功能
- ✅ **跨平台支援**: Android 和 iOS 均可使用
- ✅ **多語系介面**: 支援繁體中文（預設）、英文、越南文
- ✅ **無廣告體驗**: 完全無廣告，純淨使用體驗
- ✅ **背景播放**: 關閉螢幕也能持續播放
- ✅ **模組化設計**: 採用模組化架構，易於維護和擴展

### 電台管理
- ✅ **新增電台**
  - 手動輸入電台資訊（站名/URL/圖示）
  - 自動搜尋網路廣播電台（透過 Radio Browser API）
- ✅ **編輯電台**: 修改電台名稱和圖示
- ✅ **刪除電台**: 移除不需要的電台
- ✅ **我的最愛**: 標記常用電台為最愛

### 播放功能
- ✅ **網路廣播串流**: 支援傳統網路廣播電台
- ⚠️ **YouTube 音訊**: 基礎支援（需額外配置）
- ✅ **播放控制**: 播放/暫停/停止
- ✅ **電台切換**: 在最愛電台之間快速切換
- ✅ **記憶功能**: 記憶上次播放的電台

### 使用者體驗
- ✅ **視覺回饋**: 所有操作都有明確的視覺反饋
- ✅ **載入狀態**: 顯示載入和緩衝狀態
- ✅ **錯誤處理**: 完善的錯誤提示和處理機制
- ✅ **現代化 UI**: 美觀的深色主題介面

## 技術架構

### 技術棧
- **框架**: React Native + Expo
- **語言**: TypeScript
- **導航**: React Navigation (Bottom Tabs + Stack)
- **音訊**: Expo AV
- **儲存**: AsyncStorage
- **UI 元件**: React Native Paper + Vector Icons
- **API**: Radio Browser API

### 專案結構
```
mesonRadio/
├── src/
│   ├── components/          # 可重用組件
│   │   ├── StationCard.tsx
│   │   ├── PlayerControls.tsx
│   │   └── EmptyState.tsx
│   ├── screens/            # 畫面組件
│   │   ├── HomeScreen.tsx
│   │   ├── StationsScreen.tsx
│   │   ├── FavoritesScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── AddStationScreen.tsx
│   │   └── SearchStationsScreen.tsx
│   ├── navigation/         # 導航配置
│   │   └── AppNavigator.tsx
│   ├── services/           # 服務層
│   │   ├── AudioPlayerService.ts
│   │   └── RadioBrowserService.ts
│   ├── utils/              # 工具類
│   │   ├── StorageManager.ts
│   │   └── i18n.ts
│   ├── models/             # 資料模型
│   │   ├── Station.ts
│   │   └── PlayerState.ts
│   └── constants/          # 常數配置
│       ├── theme.ts
│       └── config.ts
├── assets/                 # 資源檔案
├── App.tsx                 # 應用入口
├── app.json               # Expo 配置
├── package.json           # 依賴管理
├── tsconfig.json          # TypeScript 配置
└── babel.config.js        # Babel 配置
```

## 安裝與運行

### 環境需求
- Node.js 16.x 或更高版本
- npm 或 yarn
- Expo CLI
- Android Studio（Android 開發）或 Xcode（iOS 開發）

### 安裝步驟

1. **安裝依賴**
```bash
cd mesonRadio
npm install
```

2. **啟動開發伺服器**
```bash
npm start
```

3. **在模擬器或實體裝置上運行**
```bash
# Android
npm run android

# iOS
npm run ios
```

### 建置與發布

#### Android (Google Play)
```bash
# 建置 APK
eas build --platform android

# 建置 AAB (用於 Google Play)
eas build --platform android --profile production
```

#### iOS (Apple App Store)
```bash
# 建置 IPA
eas build --platform ios

# 提交到 App Store
eas submit --platform ios
```

## 使用說明

### 新增電台

#### 方法一：手動輸入
1. 進入「電台」頁面
2. 點擊右下角的「+」按鈕
3. 選擇「手動輸入」
4. 填寫電台名稱和 URL
5. 選擇電台類型（網路廣播或 YouTube）
6. 選擇性上傳電台圖示
7. 點擊「儲存」

#### 方法二：自動搜尋
1. 進入「電台」頁面
2. 點擊右下角的「+」按鈕
3. 選擇「自動搜尋」
4. 輸入搜尋關鍵字（電台名稱、國家或標籤）
5. 從搜尋結果中選擇想要的電台
6. 點擊「新增選取的電台」

### 播放電台
1. 在「電台」或「我的最愛」頁面點擊任意電台
2. 電台會自動開始播放
3. 可在「首頁」查看播放狀態和控制播放

### 管理最愛
- 點擊電台卡片上的星號圖示即可加入或移除最愛
- 在「我的最愛」頁面查看所有最愛電台

### 切換電台
- 在首頁使用「上一個」和「下一個」按鈕
- 可在最愛電台之間快速切換

## API 說明

### Radio Browser API
本應用使用 [Radio Browser API](https://www.radio-browser.info/) 來搜尋網路廣播電台。

- **API 端點**: `https://de1.api.radio-browser.info/json`
- **功能**: 搜尋全球的網路廣播電台
- **限制**: 免費使用，無需 API Key

### YouTube 音訊支援

⚠️ **注意**: YouTube 音訊播放功能需要額外配置。

由於 YouTube 的服務條款限制，直接播放 YouTube 音訊需要：
1. 使用 YouTube Data API
2. 或使用第三方音訊提取服務（如 yt-dlp）
3. 確保符合 YouTube 的使用條款

目前實現為基礎框架，實際使用需要額外配置。

## 配置檔案

### app.json
包含 Expo 應用配置，包括：
- 應用名稱和版本
- 圖示和啟動畫面
- 權限設定（網路、背景音訊）
- iOS 和 Android 特定配置

### tsconfig.json
TypeScript 編譯器配置，包括：
- 路徑別名設定（@/、@components/、@screens/ 等）
- 編譯選項

## 故障排除

### 常見問題

1. **音訊無法播放**
   - 檢查網路連線
   - 確認電台 URL 是否正確
   - 檢查是否已授予必要的權限

2. **背景播放不工作**
   - iOS: 確認已在 Info.plist 中設定 UIBackgroundModes
   - Android: 確認已授予前景服務權限

3. **圖示顯示異常**
   - 確認圖片格式正確（JPEG、PNG）
   - 檢查圖片大小是否過大

4. **搜尋功能無法使用**
   - 檢查網路連線
   - 確認 Radio Browser API 是否可訪問

## 授權

本專案採用 MIT 授權。

## 貢獻

歡迎提交 Issue 和 Pull Request！

## 聯絡方式

如有問題或建議，請透過 GitHub Issues 聯絡。

## 更新日誌

### v1.0.0 (2025-10-05)
- ✅ 初始版本發布
- ✅ 基礎播放功能
- ✅ 電台管理功能
- ✅ 多語系支援
- ✅ 背景播放支援

## 未來計畫

- [ ] YouTube 音訊完整支援
- [ ] 電台分類和標籤管理
- [ ] 播放歷史記錄
- [ ] 定時關閉功能
- [ ] 音訊等化器
- [ ] 電台分享功能
- [ ] 雲端同步功能
- [ ] 播客（Podcast）支援
