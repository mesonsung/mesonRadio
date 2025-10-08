# Android 依賴衝突修復
# Android Dependency Conflict Fix

**日期**: 2025-10-08

## 🐛 問題描述

編譯時出現錯誤：
```
Execution failed for task ':app:checkReleaseDuplicateClasses'.
> Duplicate class android.support.v4.app.INotificationSideChannel found in modules 
  core-1.16.0.aar (androidx.core:core:1.16.0) and 
  support-compat-28.0.0.aar (com.android.support:support-compat:28.0.0)
```

### 根本原因

項目中同時存在：
- **新的 AndroidX 庫** (androidx.core:core:1.16.0)
- **舊的 Support 庫** (com.android.support:support-compat:28.0.0)

這是因為某些第三方依賴包仍在使用舊的 Support 庫，與項目的 AndroidX 產生衝突。

## ✅ 解決方案

### 1. 啟用 Jetifier

**文件**: `android/gradle.properties`

添加：
```properties
# Automatically convert third-party libraries to use AndroidX
android.enableJetifier=true
```

**作用**: Jetifier 會自動將第三方庫中的舊 Support 庫引用轉換為 AndroidX。

### 2. 排除舊依賴

**文件**: `android/app/build.gradle`

在 `dependencies` 區塊前添加：
```gradle
// 排除旧的 Support 库，避免与 AndroidX 冲突
configurations.all {
    exclude group: 'com.android.support', module: 'support-compat'
    exclude group: 'com.android.support', module: 'support-v4'
    exclude group: 'com.android.support', module: 'versionedparcelable'
}
```

**作用**: 強制排除舊的 Support 庫，防止它們被引入項目。

## 📝 修改的文件

### 1. `android/gradle.properties`

**修改前**:
```properties
android.useAndroidX=true
```

**修改後**:
```properties
android.useAndroidX=true
# Automatically convert third-party libraries to use AndroidX
android.enableJetifier=true
```

### 2. `android/app/build.gradle`

**修改前**:
```gradle
dependencies {
    implementation("com.facebook.react:react-android")
    // ...
}
```

**修改後**:
```gradle
// 排除舊的 Support 庫，避免與 AndroidX 衝突
configurations.all {
    exclude group: 'com.android.support', module: 'support-compat'
    exclude group: 'com.android.support', module: 'support-v4'
    exclude group: 'com.android.support', module: 'versionedparcelable'
}

dependencies {
    implementation("com.facebook.react:react-android")
    // ...
}
```

## 🔧 如何重新編譯

### 方法 1: 使用 npm（推薦）

```bash
cd /home/meson/Meson/mesonRadio

# 清理緩存
rm -rf android/app/build android/.gradle

# 重新編譯
npm run android
```

### 方法 2: 使用 Gradle

```bash
cd /home/meson/Meson/mesonRadio/android

# 設置 Android SDK 路徑（如果需要）
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools

# 清理
./gradlew clean

# 編譯 Debug 版本
./gradlew assembleDebug

# 或編譯 Release 版本
./gradlew assembleRelease
```

## 📊 技術細節

### AndroidX vs Support 庫

| 庫類型 | 包名前綴 | 狀態 | 版本 |
|--------|----------|------|------|
| **Support 庫** | `android.support.*` | ❌ 已廢棄 | 28.0.0 (最後版本) |
| **AndroidX** | `androidx.*` | ✅ 維護中 | 持續更新 |

### Jetifier 工作原理

```
第三方庫依賴
    ↓
android.support.v4.*
    ↓
[Jetifier 轉換]
    ↓
androidx.core.*
    ↓
項目使用 AndroidX
```

### 依賴排除策略

```gradle
configurations.all {
    // 方法 1: 排除特定模組
    exclude group: 'com.android.support', module: 'support-compat'
    
    // 方法 2: 排除整個組（如果需要）
    // exclude group: 'com.android.support'
}
```

## ⚠️ 常見問題

### Q1: 為什麼需要 Jetifier？

A: 因為某些第三方庫可能還沒有更新到 AndroidX，Jetifier 可以自動轉換這些庫的依賴。

### Q2: 會影響應用性能嗎？

A: 不會。Jetifier 只在編譯時工作，不影響運行時性能。

### Q3: 如果仍然有衝突怎麼辦？

A: 可以嘗試：
1. 更新所有依賴到最新版本
2. 檢查 `package.json` 中是否有舊版本的庫
3. 使用 `./gradlew app:dependencies` 檢查依賴樹

### Q4: Android SDK 找不到？

A: 設置環境變量：
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

## 🎯 驗證修復

### 成功標誌

編譯應該成功完成：
```
BUILD SUCCESSFUL in 2m 30s
```

### 失敗標誌

如果仍然看到：
```
Duplicate class ... found in modules ...
```

則需要檢查是否有其他未排除的衝突庫。

## 📚 相關資源

- [AndroidX 遷移指南](https://developer.android.com/jetpack/androidx/migrate)
- [Jetifier 文檔](https://developer.android.com/studio/command-line/jetifier)
- [Gradle 依賴管理](https://docs.gradle.org/current/userguide/dependency_management.html)

## ✅ 檢查清單

修復後檢查：

- [x] `android/gradle.properties` 包含 `android.enableJetifier=true`
- [x] `android/app/build.gradle` 包含依賴排除配置
- [ ] 清理了舊的構建文件
- [ ] 重新編譯成功
- [ ] APK 可以正常安裝和運行

---

**修復完成！** 請重新編譯測試。🎉

如果編譯成功，繼續測試：
1. ✅ 屏幕解鎖不會多個播放器
2. ✅ 屏幕關閉後繼續播放
3. ✅ 後台播放穩定

