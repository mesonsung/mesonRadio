# 修復 expo-av 模組錯誤
# Fix expo-av Module Error

## 錯誤信息
```
Failed to resolve plugin for module "expo-av" relative to "/home/meson/Meson/mesonRadio"
```

## 已執行的修復步驟

### 1. ✅ 重新安裝依賴
```bash
npm install
```
已成功執行，所有依賴已重新安裝。

### 2. ✅ 清除緩存並重啟
```bash
npx expo start --clear
```
已在後台執行，這會清除 Metro bundler 的緩存。

## 如果問題仍然存在

### 選項 1: 完全清理並重建（推薦）

```bash
# 停止所有正在運行的進程
# 然後執行：

# 刪除 node_modules 和緩存
rm -rf node_modules
rm -rf .expo
rm -rf android/.gradle
rm -rf android/app/build

# 清除 npm 緩存
npm cache clean --force

# 重新安裝
npm install

# 重新啟動
npx expo start --clear
```

### 選項 2: 使用 Expo Doctor 診斷

```bash
npx expo-doctor
```

這會檢查項目配置並提供修復建議。

### 選項 3: 預編譯（Prebuild）

如果您要在實體設備或模擬器上運行，可能需要執行預編譯：

```bash
npx expo prebuild --clean
```

## 檢查點

### 1. 確認 expo-av 在 package.json 中
✅ 已確認：`"expo-av": "~16.0.7"`

### 2. 檢查 Node 版本
當前：Node v20.14.0

**注意**：某些包需要 Node >= 20.19.4，但應該不影響 expo-av 的使用。如果需要，可以升級 Node：
```bash
nvm install 20.19.4
nvm use 20.19.4
```

### 3. 檢查 babel.config.js

確保 `babel.config.js` 包含正確的預設：

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      // ... 其他插件
    ]
  };
};
```

## 常見原因和解決方案

### 原因 1: Metro Bundler 緩存問題
**解決**: `npx expo start --clear` ✅ 已執行

### 原因 2: node_modules 損壞
**解決**: 刪除並重新安裝 node_modules

### 原因 3: Babel 配置問題
**解決**: 檢查 babel.config.js 是否正確

### 原因 4: 平台特定問題
**解決**: 
- **Android**: `cd android && ./gradlew clean && cd ..`
- **iOS**: `cd ios && pod install && cd ..`

## 測試修復

啟動開發服務器後，嘗試：

```bash
# 在另一個終端
npx expo start

# 然後在 Expo Go 中打開應用
# 或者
npx expo run:android  # Android
npx expo run:ios      # iOS
```

## 額外信息

### 依賴警告
您的項目有一些依賴警告，但不影響 expo-av 的使用：
- 某些 deprecated 包（不影響功能）
- 5 個安全漏洞（可選修復）

如果需要修復安全漏洞：
```bash
npm audit fix
# 或強制修復（可能有破壞性更改）
npm audit fix --force
```

### 相關檔案
- ✅ `package.json` - 包含 expo-av ~16.0.7
- ✅ `babel.config.js` - Babel 配置
- ✅ `app.config.js` - Expo 配置

## 如果一切正常

當 `npx expo start --clear` 完成後：
1. 看到 Metro bundler 啟動
2. 看到 QR code
3. 沒有看到 expo-av 錯誤

那麼問題已解決！✅

## 需要幫助？

如果問題仍然存在，請提供：
1. 完整的錯誤信息
2. `npx expo-doctor` 的輸出
3. 您使用的運行方式（Expo Go / 開發構建 / 模擬器）
