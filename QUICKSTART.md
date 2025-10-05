# mesonRadio 快速開始指南

## 最快速的方式開始使用

### 5 分鐘快速啟動

#### 步驟 1: 安裝依賴（2 分鐘）
```bash
cd /home/meson/mesonRadio
npm install
```

#### 步驟 2: 安裝 Expo Go（1 分鐘）
在您的手機上：
- **Android**: 從 Google Play Store 搜尋「Expo Go」
- **iOS**: 從 App Store 搜尋「Expo Go」

#### 步驟 3: 啟動應用（1 分鐘）
```bash
npm start
```

#### 步驟 4: 在手機上開啟（1 分鐘）
- 使用 Expo Go 掃描終端機顯示的 QR Code
- 應用會自動載入並運行

## 完成！🎉

現在您可以：
1. 點擊「+」按鈕新增電台
2. 使用搜尋功能尋找全球電台
3. 點擊電台開始播放
4. 加入最愛以便快速存取

## 常用指令

```bash
# 啟動開發伺服器
npm start

# 在 Android 模擬器中運行
npm run android

# 在 iOS 模擬器中運行（僅限 macOS）
npm run ios

# 清除快取並重新啟動
npx expo start --clear
```

## 疑難排解

### 無法連線？
1. 確保手機和電腦在同一個 Wi-Fi
2. 嘗試使用 Tunnel 模式：
   ```bash
   npx expo start --tunnel
   ```

### 建置錯誤？
```bash
# 重新安裝依賴
rm -rf node_modules package-lock.json
npm install
npx expo start --clear
```

## 下一步

- 閱讀 [README.md](README.md) 了解完整功能
- 查看 [INSTALLATION.md](INSTALLATION.md) 了解詳細安裝說明
- 參考 [DEPLOYMENT.md](DEPLOYMENT.md) 學習如何發布應用

## 需要幫助？

- 查看 [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) 了解專案結構
- 閱讀 [CONTRIBUTING.md](CONTRIBUTING.md) 了解如何貢獻

祝您使用愉快！🎵

