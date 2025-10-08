# 完全重置與啟動指南
# Complete Reset and Startup Guide

## ✅ 已完成的清理步驟

### 1. 清理所有緩存和構建文件
```bash
✅ 已刪除 node_modules/
✅ 已刪除 .expo/
✅ 已刪除 android/.gradle/
✅ 已刪除 android/app/build/
✅ 已清除 npm 緩存
```

### 2. 重新安裝依賴
```bash
✅ npm install 成功完成
✅ 所有依賴已安裝（818 個套件）
✅ 沒有安全漏洞
```

### 3. 新增配置文件解決文件監視器問題

#### 創建了 `.watchmanconfig`
此文件告訴文件監視器忽略構建目錄：
```json
{
  "ignore_dirs": [
    ".git",
    "node_modules",
    ".expo",
    "android/.gradle",
    "android/app/build",
    "android/.cxx",
    "ios/build",
    "ios/Pods"
  ]
}
```

#### 創建了 `metro.config.js`
配置 Metro Bundler 忽略不必要的目錄：
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.blacklistRE = /node_modules\/.*\/android\/.cxx\/.*/;
module.exports = config;
```

### 4. 重新啟動開發服務器
```bash
✅ npx expo start --clear 已在後台運行
```

---

## 🎯 當前狀態

開發服務器正在啟動中。應該能看到：

1. ✅ "Starting Metro Bundler"
2. ✅ QR code 顯示
3. ✅ "Metro waiting on..."
4. ✅ 沒有文件監視器錯誤

---

## 🔍 如何檢查狀態

### 查看開發服務器日誌
開發服務器在後台運行。如果需要查看完整輸出：

```bash
# 方法 1: 查看當前終端
# 服務器應該已經在運行

# 方法 2: 重新啟動並查看完整輸出
npx expo start
```

### 成功的標誌
當看到以下內容時，表示成功：
```
✓ Starting Metro Bundler
✓ Metro waiting on exp://...
✓ QR code 顯示
```

---

## 📱 如何運行應用

### 選項 1: 使用 Expo Go（推薦用於開發）
```bash
# 1. 確保手機和電腦在同一網路
# 2. 在手機上安裝 Expo Go 應用
# 3. 掃描終端顯示的 QR code
```

### 選項 2: 在 Android 模擬器上運行
```bash
# 確保 Android 模擬器正在運行
npx expo run:android
```

### 選項 3: 構建 APK
```bash
# 使用 EAS Build
npx eas build -p android --profile preview
```

---

## ⚠️ 如果仍然遇到問題

### 問題 1: 仍然有文件監視器錯誤

**解決方案 A**: 安裝 Watchman（推薦）
```bash
# Ubuntu/Debian
sudo apt-get install watchman

# 或從源碼編譯
# 參考: https://facebook.github.io/watchman/docs/install
```

**解決方案 B**: 使用不同的文件監視器
```bash
# 設置環境變量
export REACT_NATIVE_PACKAGER_HOSTNAME='0.0.0.0'
export CHOKIDAR_USEPOLLING=1
npx expo start
```

**解決方案 C**: 刪除問題目錄
```bash
# 如果看到特定的 .cxx 目錄錯誤
find node_modules -type d -name ".cxx" -exec rm -rf {} + 2>/dev/null
npx expo start --clear
```

### 問題 2: expo-av 模組錯誤

這應該已經解決了。如果仍然出現：
```bash
# 驗證模組存在
ls node_modules/expo-av

# 重新安裝
npm install expo-av@~16.0.7
npx expo start --clear
```

### 問題 3: Metro Bundler 緩存問題

```bash
# 完全重置 Metro
npx react-native start --reset-cache

# 或
rm -rf $TMPDIR/metro-* $TMPDIR/haste-*
npx expo start --clear
```

### 問題 4: Node 版本警告

雖然有警告但不影響使用。如果想升級：
```bash
# 使用 nvm 升級 Node
nvm install 20.19.4
nvm use 20.19.4
cd /home/meson/Meson/mesonRadio
npm install
```

---

## 🛠️ 完整重置命令（如果需要重新開始）

如果需要再次完全重置：

```bash
#!/bin/bash
cd /home/meson/Meson/mesonRadio

# 停止所有 node 進程
pkill -f "expo|metro|react-native"

# 完全清理
rm -rf node_modules .expo android/.gradle android/app/build ios/build
rm -rf $TMPDIR/metro-* $TMPDIR/haste-* 2>/dev/null

# 清除緩存
npm cache clean --force

# 重新安裝
npm install

# 啟動
npx expo start --clear
```

---

## 📋 快速啟動檢查清單

每次啟動開發環境時：

- [ ] 確認 Node.js 已安裝（當前: v20.14.0）
- [ ] 確認在正確的目錄（`/home/meson/Meson/mesonRadio`）
- [ ] 確認 `node_modules/` 存在且完整
- [ ] 運行 `npx expo start`
- [ ] 看到 QR code 和 "Metro waiting..."
- [ ] 選擇運行方式（Expo Go / 模擬器 / 實體設備）

---

## 🎉 成功指標

當一切正常時，您應該能：

1. ✅ 啟動開發服務器沒有錯誤
2. ✅ 在設備上打開應用
3. ✅ 看到首頁播放器界面
4. ✅ 能夠播放電台
5. ✅ 能夠在緩衝時停止播放（新功能！）
6. ✅ 能夠下拉刷新首頁（新功能！）

---

## 🔗 相關文檔

- `BUFFERING_FIX_SUMMARY.md` - 播放器緩衝問題修復說明
- `FIX_EXPO_AV_ERROR.md` - expo-av 模組錯誤解決方案
- `BUILD_APK_GUIDE.md` - APK 構建指南

---

## 📞 需要幫助？

如果問題持續存在，請提供以下信息：

1. 完整的錯誤訊息
2. `npx expo-doctor` 的輸出
3. 您的運行環境（Expo Go / 模擬器 / 實體設備）
4. Node 和 npm 版本（`node -v && npm -v`）

---

**最後更新**: 2025-10-08
**狀態**: ✅ 系統已完全重置並重新配置
