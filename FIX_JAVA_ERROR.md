# 快速修復 JAVA_HOME 錯誤 ⚡
# Quick Fix for JAVA_HOME Error

## 🚨 錯誤訊息

```
ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
```

---

## ✅ 3 種解決方案

### 方案 1: 自動設定（最快，推薦）⚡

**以管理員身份**執行 PowerShell：

```powershell
# 1. 允許執行腳本（只需一次）
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 2. 執行自動設定腳本
.\setup-java.ps1
```

腳本會：
- 檢測已安裝的 JDK
- 自動設定 JAVA_HOME
- 自動更新 PATH
- 如果沒安裝 JDK，會開啟下載頁面

---

### 方案 2: 使用 EAS Build（不需要 Java）🎯

**完全不需要設定 Java！**

```bash
# 安裝 EAS CLI
npm install -g eas-cli

# 登入
eas login

# 建置（使用 Docker 容器，包含所有工具）
npm run build:apk
```

✨ **這是最簡單的方式！**

---

### 方案 3: 手動安裝 Java

#### Step 1: 下載 JDK

選擇其中一個：

**選項 A: Eclipse Temurin（推薦）**
- 網址：https://adoptium.net/
- 下載 **Temurin 17 (LTS)** → **Windows x64** → **MSI installer**
- 安裝時勾選 ✅ **"Set JAVA_HOME variable"**

**選項 B: Microsoft OpenJDK**
- 網址：https://learn.microsoft.com/en-us/java/openjdk/download
- 下載 **OpenJDK 17 LTS** → **Windows x64** → **MSI**

#### Step 2: 安裝

- 雙擊 `.msi` 檔案
- 點擊 Next → Next → Install
- 記住安裝路徑

#### Step 3: 設定環境變數（如果沒自動設定）

**使用 PowerShell（管理員）：**

```powershell
# 設定 JAVA_HOME（替換為您的實際路徑）
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.0.12-hotspot", [System.EnvironmentVariableTarget]::Machine)

# 更新 PATH
$currentPath = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::Machine)
$newPath = "$env:JAVA_HOME\bin;$currentPath"
[System.Environment]::SetEnvironmentVariable("Path", $newPath, [System.EnvironmentVariableTarget]::Machine)
```

**或使用圖形界面：**

1. 按 `Win + R`，輸入 `sysdm.cpl`，按 Enter
2. 「進階」→「環境變數」
3. 新增系統變數：
   - 名稱：`JAVA_HOME`
   - 值：您的 JDK 路徑
4. 編輯 `Path`，新增：`%JAVA_HOME%\bin`

#### Step 4: 驗證

重新開啟終端，執行：

```bash
java -version
echo %JAVA_HOME%
```

---

## 🔄 重新建置

設定完成後：

```bash
# 重新開啟終端視窗
# 然後執行
npm run build:apk
```

---

## 📋 快速檢查清單

- [ ] 已安裝 JDK 17 或更高版本
- [ ] JAVA_HOME 已設定
- [ ] PATH 包含 `%JAVA_HOME%\bin`
- [ ] 已重新開啟終端
- [ ] `java -version` 可以執行

---

## 💡 我的建議

| 情況 | 建議方案 |
|------|---------|
| 想最快建置 | 方案 2: EAS Build |
| 願意設定環境 | 方案 1: 自動腳本 |
| 有經驗的開發者 | 方案 3: 手動安裝 |

---

## 🆘 還是不行？

### 常見問題：

**Q: 執行腳本顯示「無法執行」**
```powershell
# 解決方法：允許執行腳本
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Q: 設定後還是找不到 Java**
- 確認已**完全關閉**所有終端視窗
- 重新啟動 VS Code
- 最後手段：重新啟動電腦

**Q: 不想設定 Java**
- 使用方案 2 (EAS Build)，完全不需要 Java！

---

## 📚 詳細文檔

需要更多資訊？查看：
- `SETUP_JAVA.md` - 完整 Java 設定指南
- `BUILD_APK_GUIDE.md` - APK 建置指南
- `QUICK_BUILD.md` - 快速建置指南
- `DYNAMIC_IMPORT_FIX.md` - Dynamic Import 問題修復

---

## 🔧 其他常見建置錯誤

### 錯誤：Unable to resolve module async-require.js

**原因：** 使用了 React Native 不支援的動態 `import()`

**解決：** 已經修復！所有動態 import 已改為靜態 import

詳見：`DYNAMIC_IMPORT_FIX.md`

---

**最快的方式：**
```bash
npm install -g eas-cli
eas login
npm run build:apk
```

就這麼簡單！✨

