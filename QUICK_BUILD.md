# 快速建置 APK 指南 🚀
# Quick APK Build Guide

## 🎯 最簡單的方式（推薦）

### 3 步驟建置 APK：

```bash
# 1. 安裝 EAS CLI（只需執行一次）
npm install -g eas-cli

# 2. 登入 Expo 帳號（只需執行一次）
eas login

# 3. 建置 APK
npm run build:apk
```

**就這樣！** ✨

建置完成後，APK 檔案會在專案根目錄。

---

## 📦 或使用 Windows 建置工具

雙擊執行：`build-apk.bat`

然後選擇建置方式。

---

## 💻 所有可用的建置指令

```bash
# 預覽版 APK（推薦用於測試）
npm run build:apk
# 或
npm run build:apk:preview

# 正式版 APK（用於發布）
npm run build:apk:production

# Gradle Debug（需要 Android SDK）
npm run build:android:debug

# Gradle Release（需要 Android SDK）
npm run build:android:release
```

---

## 📱 安裝 APK 到手機

### 方法 1: 直接傳輸（最簡單）

1. 將 APK 檔案傳到手機
   - 用 USB 複製
   - 透過 Email 發送
   - 上傳到雲端（Google Drive、Dropbox）
   - 用藍牙傳送

2. 在手機上開啟 APK 檔案

3. 允許「安裝未知來源的應用程式」

4. 點擊「安裝」

### 方法 2: 使用 ADB

```bash
# 透過 USB 連接手機
adb install 你的apk檔名.apk
```

---

## ⏱️ 建置時間

- **首次建置**：10-20 分鐘（需要下載依賴）
- **後續建置**：5-10 分鐘

建置時可以去泡杯咖啡 ☕

---

## 🔧 如果遇到問題

### 錯誤：找不到 eas 命令

```bash
npm install -g eas-cli
```

### 錯誤：需要登入

```bash
eas login
```

### 建置失敗

```bash
# 清除快取重試
eas build -p android --profile preview --local --clear-cache
```

### 其他問題

查看詳細指南：`BUILD_APK_GUIDE.md`

---

## 📋 建置檢查清單

- [ ] 安裝了 Node.js
- [ ] 安裝了 npm 依賴 (`npm install`)
- [ ] 安裝了 EAS CLI (`npm install -g eas-cli`)
- [ ] 登入 Expo 帳號 (`eas login`)
- [ ] 執行建置指令 (`npm run build:apk`)
- [ ] 等待建置完成
- [ ] 在根目錄找到 APK 檔案
- [ ] 傳輸到手機並安裝

---

## 🎉 成功建置後

您的 APK 檔案名稱可能類似：
- `mesonradio-1.0.1-preview.apk`
- `mesonradio-abc123.apk`

檔案大小約：**50-100 MB**

---

**需要更多幫助？**
- 詳細指南：`BUILD_APK_GUIDE.md`
- 使用 Windows 工具：`build-apk.bat`

祝建置順利！🚀

