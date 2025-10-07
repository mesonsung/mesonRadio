# 本地建置 APK 指南
# Local APK Build Guide

## 🎯 兩種建置方式

### 方法 1: EAS Build 本地建置（推薦，最簡單）✨

使用 EAS CLI 在本地建置，無需配置 Android Studio。

#### 步驟：

1. **安裝 EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **登入 Expo 帳號**（如果沒有，會引導您註冊）
   ```bash
   eas login
   ```

3. **配置專案**（首次需要）
   ```bash
   eas build:configure
   ```

4. **本地建置 APK**
   ```bash
   eas build --platform android --profile preview --local
   ```

   或是簡短版本：
   ```bash
   eas build -p android --profile preview --local
   ```

5. **等待建置完成**
   - 建置時間：約 5-15 分鐘（取決於電腦效能）
   - APK 會儲存在專案根目錄

6. **找到 APK**
   - 位置：專案根目錄
   - 檔名：`mesonradio-xxx.apk`（xxx 是版本號或 hash）

#### 不同建置類型：

```bash
# 預覽版 APK（用於測試）
eas build -p android --profile preview --local

# 生產版 APK
eas build -p android --profile production --local

# 開發版 APK
eas build -p android --profile development --local
```

#### 優點：
- ✅ 不需要安裝 Android Studio
- ✅ 不需要配置 Android SDK
- ✅ 自動處理所有依賴
- ✅ 簡單快速

#### 缺點：
- ⚠️ 需要 Expo 帳號（免費）
- ⚠️ 第一次需要下載 Docker 映像（較慢）

---

### 方法 2: 使用 Gradle 直接建置（進階）

如果您已經有 Android 開發環境。

#### 前置需求：

1. **安裝 Java Development Kit (JDK)**
   - JDK 17 或更高版本
   - 下載：https://adoptium.net/
   
   **快速設定（Windows）：**
   ```powershell
   # 以管理員身份執行 PowerShell
   .\setup-java.ps1
   ```
   
   詳細說明請見：`SETUP_JAVA.md`

2. **安裝 Android Studio**（或至少 Android SDK）
   - 下載：https://developer.android.com/studio

3. **設定環境變數**
   ```bash
   # Windows (PowerShell)
   $env:ANDROID_HOME = "C:\Users\你的用戶名\AppData\Local\Android\Sdk"
   $env:PATH = "$env:ANDROID_HOME\platform-tools;$env:PATH"
   
   # macOS/Linux
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

#### 建置步驟：

1. **安裝依賴**
   ```bash
   npm install
   ```

2. **預建置（Pre-build）**
   ```bash
   npx expo prebuild --platform android
   ```

3. **進入 Android 目錄**
   ```bash
   cd android
   ```

4. **建置 APK**
   
   **Debug APK（測試用）：**
   ```bash
   # Windows
   .\gradlew.bat assembleDebug
   
   # macOS/Linux
   ./gradlew assembleDebug
   ```
   
   APK 位置：`android/app/build/outputs/apk/debug/app-debug.apk`

   **Release APK（正式版）：**
   ```bash
   # Windows
   .\gradlew.bat assembleRelease
   
   # macOS/Linux
   ./gradlew assembleRelease
   ```
   
   APK 位置：`android/app/build/outputs/apk/release/app-release.apk`

5. **返回專案根目錄**
   ```bash
   cd ..
   ```

#### 優點：
- ✅ 完全本地建置
- ✅ 不需要網路連接（首次後）
- ✅ 可以自訂建置配置
- ✅ 更快的建置速度（配置好後）

#### 缺點：
- ⚠️ 需要安裝和配置 Android 開發環境
- ⚠️ 設定複雜
- ⚠️ 需要解決依賴問題

---

## 📦 APK 類型說明

### Debug APK
- 用途：開發測試
- 大小：較大（~50-100MB）
- 效能：較慢
- 簽名：使用 debug keystore

### Release APK
- 用途：正式發布
- 大小：較小（經過優化）
- 效能：最佳化
- 簽名：需要正式簽名檔

### Preview APK（EAS）
- 用途：內部測試
- 大小：中等
- 效能：接近 Release
- 簽名：EAS 自動處理

---

## 🚀 快速開始（推薦）

如果您是第一次建置，建議使用 **方法 1**：

```bash
# 1. 安裝 EAS CLI
npm install -g eas-cli

# 2. 登入
eas login

# 3. 建置
eas build -p android --profile preview --local

# 4. 等待完成，APK 會在專案根目錄
```

---

## 📱 安裝 APK 到手機

### 方法 A：USB 連接

1. 啟用手機的「開發者選項」和「USB 偵錯」
2. 用 USB 連接手機到電腦
3. 使用 ADB 安裝：
   ```bash
   adb install 你的apk檔名.apk
   ```

### 方法 B：直接傳輸

1. 將 APK 檔案傳到手機（Email、雲端、藍牙等）
2. 在手機上開啟 APK 檔案
3. 允許「安裝未知來源的應用程式」
4. 點擊「安裝」

---

## 🔧 常見問題

### Q: 建置失敗怎麼辦？

**EAS 建置失敗：**
```bash
# 清除快取重試
eas build -p android --profile preview --local --clear-cache
```

**Gradle 建置失敗：**
```bash
# 清除 Gradle 快取
cd android
./gradlew clean
cd ..

# 重新安裝依賴
rm -rf node_modules
npm install
```

### Q: APK 太大怎麼辦？

1. 使用 Release 建置（會自動優化）
2. 啟用 ProGuard/R8 混淆
3. 移除未使用的資源

### Q: APK 無法安裝？

1. 確認手機允許安裝未知來源應用
2. 確認 APK 沒有損壞
3. 嘗試解除安裝舊版本再安裝

### Q: 需要簽名嗎？

- **測試用**：不需要，使用 debug 簽名即可
- **發布到 Google Play**：需要正式簽名
- **EAS 建置**：會自動處理簽名

---

## 📊 建置時間參考

| 方法 | 首次建置 | 後續建置 |
|------|---------|---------|
| EAS Local | 10-20 分鐘 | 5-10 分鐘 |
| Gradle Debug | 5-15 分鐘 | 2-5 分鐘 |
| Gradle Release | 10-20 分鐘 | 5-10 分鐘 |

---

## 💡 建議

1. **第一次建置**：使用 EAS Local（最簡單）
2. **經常建置**：配置 Gradle 環境（更快）
3. **正式發布**：使用 EAS Cloud 或簽名的 Release APK

---

## 📝 參考資料

- [EAS Build 文檔](https://docs.expo.dev/build/setup/)
- [Expo Prebuild](https://docs.expo.dev/workflow/prebuild/)
- [Android Gradle Plugin](https://developer.android.com/studio/build)

---

**最後更新**: 2025-10-07
**測試狀態**: ✅ 已驗證

