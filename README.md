# 🎵 mesonRadio

<div align="center">

**智能網路電台播放器**

一個功能強大、體驗優雅的跨平台網路電台應用

[![React Native](https://img.shields.io/badge/React%20Native-0.81.4-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.12-000020.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[功能特色](#-功能特色) • [快速開始](#-快速開始) • [使用指南](#-使用指南) • [技術架構](#-技術架構) • [建置發布](#-建置發布)

</div>

---

## ✨ 功能特色

### 🎙️ 核心播放功能

- **穩定播放引擎**
  - 支援網路電台串流播放
  - 自動重連機制（網路中斷時自動恢復）
  - 健康檢查系統（確保播放穩定）
  - 防止多個播放實體（雙重鎖機制）
  
- **後台播放**
  - 📱 關閉螢幕繼續播放
  - 🔒 前台服務保護（Android）
  - ⚡ Keep Awake 機制
  - 🎯 音訊焦點管理（來電自動暫停）

- **播放控制**
  - 播放 / 暫停 / 停止
  - 上一個 / 下一個電台
  - 記憶上次播放的電台
  - 在我的最愛中快速切換

### 🤖 AI 智能助手

- **多 AI 引擎支援**
  - Google Gemini 1.5 Flash
  - OpenAI ChatGPT 4o-mini
  - xAI Grok
  
- **智能電台搜尋**
  - 🧠 AI 理解用戶需求
  - 🎯 自動推薦知名電台
  - 🔄 三層降級策略（AI → 關鍵詞 → 直接搜尋）
  - 📊 智能排序（按播放量選擇最佳電台）

- **語音命令控制**
  - 🎤 語音搜尋電台（「我想聽新聞」）
  - 🗣️ 語音控制播放（「播放」、「暫停」、「下一個」）
  - 📢 語音回饋（TTS 語音播報）
  - 🎚️ 完整的語音互動體驗

### 📻 電台管理

- **多種新增方式**
  - 手動輸入（站名 / URL / 圖示）
  - 自動搜尋（Radio Browser API，8萬+ 全球電台）
  - AI 智能推薦
  - 批量新增

- **完整管理功能**
  - ⭐ 我的最愛標記
  - ✏️ 編輯電台資訊
  - 🖼️ 自定義電台圖示
  - 🗑️ 刪除電台
  - 🔍 電台搜尋

### 🌍 多語系支援

- 🇹🇼 繁體中文（預設）
- 🇬🇧 English
- 🇻🇳 Tiếng Việt

### 🎨 優質使用體驗

- **現代化 UI**
  - 🌙 精美的深色主題
  - 🎭 Material Design 風格
  - ✨ 流暢的動畫效果
  - 📱 響應式佈局

- **完善的反饋系統**
  - ⏳ 載入狀態顯示
  - 📊 緩衝進度提示
  - ✅ 操作成功提示
  - ❌ 錯誤處理和提示
  - 📝 詳細的調試日誌

### 🔒 穩定性保障

- **多層防護機制**
  - 🔐 雙重鎖機制（防止並發播放）
  - 🔄 自動重連（網路中斷恢復）
  - 💓 健康檢查（週期性檢測播放狀態）
  - 🛡️ 錯誤降級（AI 失敗自動切換策略）

- **性能優化**
  - ⚡ 快速啟動
  - 💾 高效儲存管理
  - 🚀 優化的網路請求
  - 🎯 智能緩存策略

---

## 🚀 快速開始

### 📋 環境需求

- **Node.js**: 20.14.0 或更高
- **npm**: 10.7.0 或更高
- **Expo CLI**: 最新版本
- **Android Studio**（Android 開發）
- **Xcode**（iOS 開發，僅 macOS）

### 📦 安裝

```bash
# 1. 克隆專案
git clone https://github.com/mesonsung/mesonRadio.git
cd mesonRadio

# 2. 安裝依賴
npm install

# 3. 啟動開發伺服器
npm start
```

### 📱 運行

```bash
# Android 模擬器/實機
npm run android

# iOS 模擬器（需要 macOS）
npm run ios

# 網頁版（測試用）
npm run web
```

### 🔑 配置 AI 功能（可選）

1. 進入「設定」→「AI 設定」
2. 選擇 AI 提供商：
   - **Google Gemini**（推薦，免費配額充足）
   - OpenAI ChatGPT
   - xAI Grok
3. 輸入對應的 API Key
4. 保存設定

**獲取 API Key：**
- Gemini: https://makersuite.google.com/app/apikey
- ChatGPT: https://platform.openai.com/api-keys
- Grok: https://console.x.ai/

---

## 📖 使用指南

### 🎧 播放電台

1. **瀏覽電台**
   - 「電台」頁面查看所有電台
   - 「我的最愛」頁面查看收藏電台

2. **開始播放**
   - 點擊任意電台卡片
   - 電台自動開始播放
   - 首頁顯示播放狀態

3. **播放控制**
   - ⏯️ 播放/暫停按鈕
   - ⏹️ 停止按鈕
   - ⏮️ 上一個電台
   - ⏭️ 下一個電台

### 📻 管理電台

#### 方法 1：手動新增

1. 進入「電台」頁面
2. 點擊右下角 ➕ 按鈕
3. 選擇「手動輸入」
4. 填寫電台資訊：
   - 📝 電台名稱
   - 🔗 串流 URL
   - 🖼️ 電台圖示（可選）
5. 點擊「儲存」

#### 方法 2：自動搜尋

1. 進入「電台」頁面
2. 點擊右下角 ➕ 按鈕
3. 選擇「自動搜尋」
4. 輸入搜尋關鍵字：
   - 電台名稱（例如：BBC、NPR）
   - 國家（例如：Taiwan、USA）
   - 類型（例如：news、jazz）
5. 從結果中選擇電台
6. 點擊「新增選取的電台」

#### 方法 3：AI 智能搜尋

1. 進入「AI 助手」頁面
2. 輸入或語音說出需求：
   - 「我想聽新聞」
   - 「播放古典音樂」
   - 「來點爵士樂」
3. AI 自動推薦電台
4. 點擊電台試聽
5. 點擊 ⭐ 加入最愛

### 🎤 語音控制

#### 搜尋電台

1. 進入「AI 助手」
2. 點擊麥克風按鈕或輸入框
3. 說出需求（例如：「我想聽新聞」）
4. AI 自動搜尋並推薦電台

#### 控制播放

播放電台後，可使用語音命令：
- 「播放」/ "Play"
- 「暫停」/ "Pause"
- 「停止」/ "Stop"
- 「下一個」/ "Next"
- 「上一個」/ "Previous"

### ⭐ 管理最愛

- **加入最愛**：點擊電台卡片上的 ☆ 圖示
- **移除最愛**：再次點擊 ★ 圖示
- **查看最愛**：進入「我的最愛」頁面
- **快速切換**：在首頁使用 ⏮️ ⏭️ 按鈕

### ✏️ 編輯電台

1. 長按電台卡片
2. 選擇「編輯」
3. 修改電台資訊
4. 點擊「儲存」

### 🗑️ 刪除電台

1. 長按電台卡片
2. 選擇「刪除」
3. 確認刪除

---

## 🏗️ 技術架構

### 📚 技術棧

| 類別 | 技術 |
|------|------|
| **框架** | React Native 0.81.4 + Expo 54.0.12 |
| **語言** | TypeScript 5.1.3 |
| **導航** | React Navigation 6.x |
| **UI 框架** | React Native Paper 5.11.3 |
| **音訊播放** | Expo AV 16.0.7 |
| **語音識別** | @react-native-voice/voice 3.1.5 |
| **AI 引擎** | Google Generative AI 0.24.1 |
| **本地儲存** | AsyncStorage 2.2.0 |
| **網路請求** | Axios 1.6.2 |
| **圖示** | React Native Vector Icons 10.0.3 |

### 🏛️ 專案結構

```
mesonRadio/
├── src/
│   ├── components/              # UI 組件
│   │   ├── StationCard.tsx      # 電台卡片
│   │   ├── PlayerControls.tsx   # 播放控制
│   │   ├── EmptyState.tsx       # 空狀態
│   │   └── ...
│   ├── screens/                 # 頁面
│   │   ├── HomeScreen.tsx       # 首頁（播放狀態）
│   │   ├── StationsScreen.tsx   # 電台列表
│   │   ├── FavoritesScreen.tsx  # 我的最愛
│   │   ├── AIAssistantScreen.tsx # AI 助手
│   │   ├── SettingsScreen.tsx   # 設定
│   │   └── ...
│   ├── services/                # 服務層
│   │   ├── AudioPlayerService.ts        # 音訊播放服務
│   │   ├── AIRadioSearchService.ts      # AI 搜尋服務
│   │   ├── VoiceCommandService.ts       # 語音命令服務
│   │   ├── RadioBrowserService.ts       # 電台搜尋 API
│   │   ├── MediaNotificationService.ts  # 媒體通知
│   │   ├── ForegroundService.ts         # 前台服務
│   │   └── BackgroundTaskService.ts     # 後台任務
│   ├── navigation/              # 導航配置
│   │   └── AppNavigator.tsx
│   ├── utils/                   # 工具類
│   │   ├── StorageManager.ts    # 儲存管理
│   │   └── i18n.ts              # 國際化
│   ├── models/                  # 資料模型
│   │   ├── Station.ts           # 電台模型
│   │   └── PlayerState.ts       # 播放狀態
│   ├── constants/               # 常數配置
│   │   ├── theme.ts             # 主題配置
│   │   └── config.ts            # 應用配置
│   └── android/                 # Android 原生代碼
│       └── app/src/main/java/com/meson/mesonradio/
│           ├── AudioForegroundService.kt    # 前台服務
│           └── AudioForegroundServicePackage.kt
├── assets/                      # 資源文件
├── App.tsx                      # 應用入口
├── app.config.js                # Expo 配置
├── package.json                 # 依賴管理
├── tsconfig.json               # TypeScript 配置
├── babel.config.js             # Babel 配置
└── eas.json                    # EAS Build 配置
```

### 🎯 核心服務

#### AudioPlayerService
- **功能**：音訊播放的核心服務
- **特色**：
  - 雙重鎖機制（防止並發播放）
  - 自動重連機制
  - 健康檢查系統
  - 後台播放支援

#### AIRadioSearchService
- **功能**：AI 智能電台搜尋
- **特色**：
  - 支援多個 AI 引擎
  - 三層降級策略
  - 智能關鍵詞提取
  - 最佳電台選擇

#### VoiceCommandService
- **功能**：語音命令處理
- **特色**：
  - 語音識別
  - AI 命令分析
  - 自動執行操作
  - TTS 語音回饋

---

## 🔨 建置發布

### 📦 建置 APK（Android）

#### 方法 1：EAS Build（推薦）

```bash
# Preview 版本（測試用）
npm run build:apk:preview

# Production 版本（正式版）
npm run build:apk:production
```

#### 方法 2：Gradle

```bash
# Debug 版本
npm run build:android:debug

# Release 版本
npm run build:android:release
```

輸出位置：`android/app/build/outputs/apk/`

### 📱 建置 iOS

```bash
# 建置 IPA
eas build --platform ios

# 提交到 App Store
eas submit --platform ios
```

### 🚀 發布到商店

#### Google Play

1. 建置 AAB：
   ```bash
   eas build -p android --profile production
   ```

2. 上傳到 Google Play Console
3. 填寫應用資訊
4. 提交審核

#### Apple App Store

1. 建置 IPA：
   ```bash
   eas build -p ios --profile production
   ```

2. 提交審核：
   ```bash
   eas submit -p ios
   ```

---

## 🐛 故障排除

### 常見問題

#### 1. 音訊無法播放

**症狀**：點擊電台無反應或錯誤提示

**解決方法**：
- ✅ 檢查網路連線
- ✅ 確認電台 URL 是否正確
- ✅ 嘗試其他電台
- ✅ 查看日誌：`adb logcat | grep "AudioPlayer"`

#### 2. AI 搜尋無結果

**症狀**：AI 搜尋返回「找不到電台」

**解決方法**：
- ✅ 檢查是否配置 AI API Key
- ✅ 確認 API Key 是否有效
- ✅ 檢查網路連線
- ✅ 嘗試更具體的查詢（例如：「BBC 新聞」）
- ✅ 查看 AI 搜尋日誌：
  ```bash
  adb logcat | grep -E "🔍|✅|⚠️|❌"
  ```

詳細排查：參考 `AI搜尋問題排查指南.md`

#### 3. 後台播放停止

**症狀**：關閉螢幕後音訊停止

**解決方法**：

**Android**：
- ✅ 允許後台運行（設定 → 應用 → mesonRadio → 電池 → 不限制）
- ✅ 關閉電池優化
- ✅ 允許自啟動（某些品牌需要）

**小米/華為/OPPO/VIVO**：
- 📱 設定 → 應用管理 → mesonRadio
- 🔋 自啟動 → 允許
- ⚡ 省電模式 → 無限制
- 🔔 通知管理 → 允許所有通知

**iOS**：
- ✅ 設定 → mesonRadio → 背景 App 重新整理 → 開啟

#### 4. 語音識別不工作

**症狀**：點擊麥克風無反應

**解決方法**：
- ✅ 授予麥克風權限
- ✅ 檢查麥克風是否正常工作
- ✅ 重啟應用
- ✅ 使用鍵盤輸入作為替代方案

#### 5. 建置失敗

**症狀**：`eas build` 或 `gradlew` 建置失敗

**解決方法**：
- ✅ 清除建置緩存：
  ```bash
  cd android && ./gradlew clean && cd ..
  ```
- ✅ 刪除 node_modules 重新安裝：
  ```bash
  rm -rf node_modules
  npm install
  ```
- ✅ 確認 Node.js 版本正確（20.14.0+）
- ✅ 查看詳細錯誤日誌

### 📝 調試工具

```bash
# 查看應用日誌
adb logcat | grep mesonRadio

# 查看 AI 搜尋日誌
adb logcat | grep -E "AI|搜尋"

# 查看音訊播放日誌
adb logcat | grep AudioPlayer

# 清除應用數據（重置）
adb shell pm clear com.meson.mesonradio
```

---

## 🤝 貢獻指南

歡迎貢獻！請遵循以下步驟：

1. **Fork 專案**
2. **創建分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送分支** (`git push origin feature/AmazingFeature`)
5. **提交 Pull Request**

### 開發規範

- 使用 TypeScript
- 遵循 ESLint 規則
- 添加註釋說明
- 編寫單元測試（如適用）

---

## 📄 授權

本專案採用 [MIT 授權](LICENSE)。

---

## 🙏 致謝

- [Radio Browser API](https://www.radio-browser.info/) - 提供全球電台數據庫
- [Expo](https://expo.dev/) - 優秀的 React Native 開發框架
- [React Native Paper](https://reactnativepaper.com/) - Material Design UI 組件
- [Google Generative AI](https://ai.google.dev/) - AI 智能搜尋支援

---

## 📞 聯絡方式

- 📧 Email: meson.sung@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/mesonsung/mesonRadio/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/mesonsung/mesonRadio/discussions)

---

## 📈 更新日誌

### v1.0.2 (2025-01-09)

#### 🎉 新增功能
- ✨ AI 智能電台搜尋
- 🎤 語音命令控制
- 🤖 多 AI 引擎支援（Gemini/ChatGPT/Grok）
- 🔄 三層降級搜尋策略

#### 🐛 Bug 修復
- 🔧 修復 Gemini 模型名稱錯誤
- 🛡️ 修復 AI 搜尋失敗問題
- 🔒 強化雙重鎖機制
- 📱 優化後台播放穩定性

#### 🚀 性能優化
- ⚡ 加快電台載入速度
- 💾 優化記憶體使用
- 🎯 智能選擇最佳電台

### v1.0.1 (2025-01-05)

#### 🐛 Bug 修復
- 修復多個播放實體問題
- 修復後台播放停止問題
- 優化網路重連機制

### v1.0.0 (2024-10-05)

#### 🎉 初始版本
- ✅ 基礎播放功能
- ✅ 電台管理功能
- ✅ 多語系支援
- ✅ 後台播放支援

---

## 🗺️ 未來計畫

### 短期計畫
- [ ] 🎨 主題自定義（淺色/深色/自動）
- [ ] 📊 播放歷史記錄
- [ ] ⏰ 定時關閉功能
- [ ] 🔊 音訊等化器
- [ ] 📱 Widget 支援

### 中期計畫
- [ ] ☁️ 雲端同步（跨設備同步最愛）
- [ ] 🎙️ 播客（Podcast）支援
- [ ] 📻 電台分類和標籤系統
- [ ] 🎵 歌曲識別（Shazam 整合）
- [ ] 🌐 社群分享功能

### 長期計畫
- [ ] 🤖 更智能的 AI 推薦系統
- [ ] 🎧 Hi-Fi 音質支援
- [ ] 📡 離線下載功能
- [ ] 🏆 成就系統
- [ ] 👥 社交功能（分享、評論）

---

<div align="center">

**如果這個專案對你有幫助，請給它一個 ⭐！**

Made with ❤️ by [Meson Sung](https://github.com/mesonsung)

</div>
