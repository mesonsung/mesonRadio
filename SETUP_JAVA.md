# 設置 Java 環境指南
# Java Setup Guide for Android Build

## 🎯 問題說明

錯誤訊息：
```
ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
```

這表示您的系統缺少 Java 開發環境 (JDK)。

---

## ✅ 解決方案（Windows）

### 步驟 1: 下載並安裝 JDK

#### 選項 A: Microsoft OpenJDK（推薦）

1. **下載 Microsoft Build of OpenJDK 17**
   - 網址：https://learn.microsoft.com/en-us/java/openjdk/download
   - 選擇：**OpenJDK 17 LTS** → **Windows** → **x64** → **MSI installer**

2. **執行安裝程式**
   - 雙擊下載的 `.msi` 檔案
   - 點擊 "Next" → "Next" → "Install"
   - 記住安裝路徑（通常是 `C:\Program Files\Microsoft\jdk-17.0.x-hotspot\`）

#### 選項 B: Oracle JDK

1. 網址：https://www.oracle.com/java/technologies/downloads/
2. 選擇 **Java 17** 或更高版本
3. 下載 Windows x64 Installer
4. 執行安裝

#### 選項 C: Adoptium Eclipse Temurin（推薦，開源）

1. 網址：https://adoptium.net/
2. 選擇 **Temurin 17 (LTS)**
3. 選擇 **Windows x64**
4. 下載 `.msi` 安裝程式
5. 執行安裝，勾選 "Set JAVA_HOME variable"

---

### 步驟 2: 設定環境變數

#### 方法 A: 使用安裝程式自動設定（最簡單）

如果使用 Adoptium 並勾選了 "Set JAVA_HOME"，會自動設定。

#### 方法 B: 手動設定

1. **找到 JDK 安裝路徑**
   
   通常在以下位置之一：
   ```
   C:\Program Files\Microsoft\jdk-17.0.xx-hotspot\
   C:\Program Files\Java\jdk-17
   C:\Program Files\Eclipse Adoptium\jdk-17.0.xx-hotspot\
   ```

2. **設定 JAVA_HOME**

   **使用 PowerShell（管理員權限）：**
   ```powershell
   # 設定系統環境變數（永久）
   [System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Microsoft\jdk-17.0.12-hotspot", [System.EnvironmentVariableTarget]::Machine)
   
   # 或設定使用者環境變數
   [System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Microsoft\jdk-17.0.12-hotspot", [System.EnvironmentVariableTarget]::User)
   ```
   
   ⚠️ **記得替換為您實際的 JDK 路徑！**

   **或使用圖形介面：**
   
   1. 按 `Win + R`，輸入 `sysdm.cpl`，按 Enter
   2. 點擊「進階」標籤
   3. 點擊「環境變數」
   4. 在「系統變數」區域，點擊「新增」
      - 變數名稱：`JAVA_HOME`
      - 變數值：您的 JDK 安裝路徑（例如：`C:\Program Files\Microsoft\jdk-17.0.12-hotspot`）
   5. 點擊「確定」

3. **更新 PATH 環境變數**

   在同一個「環境變數」視窗：
   
   1. 找到並選擇「Path」變數
   2. 點擊「編輯」
   3. 點擊「新增」
   4. 輸入：`%JAVA_HOME%\bin`
   5. 點擊「確定」

4. **重啟終端機**
   
   關閉所有 PowerShell/命令提示字元視窗，重新開啟。

---

### 步驟 3: 驗證安裝

開啟新的 PowerShell 或命令提示字元，執行：

```bash
# 檢查 Java 版本
java -version

# 應該顯示類似：
# openjdk version "17.0.12" 2024-07-16 LTS
# OpenJDK Runtime Environment Microsoft-9388408 (build 17.0.12+7-LTS)
# OpenJDK 64-Bit Server VM Microsoft-9388408 (build 17.0.12+7-LTS, mixed mode, sharing)

# 檢查 JAVA_HOME
echo %JAVA_HOME%

# 應該顯示您的 JDK 路徑
```

---

### 步驟 4: 重新建置

現在可以重新嘗試建置：

```bash
npm run build:apk
```

---

## 🍎 macOS 設定

### 安裝 JDK

```bash
# 使用 Homebrew
brew install openjdk@17

# 或下載 Temurin
# https://adoptium.net/
```

### 設定環境變數

編輯 `~/.zshrc` 或 `~/.bash_profile`：

```bash
# 添加以下內容
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export PATH=$JAVA_HOME/bin:$PATH
```

重新載入：
```bash
source ~/.zshrc
```

---

## 🐧 Linux 設定

### Ubuntu/Debian

```bash
# 安裝 OpenJDK 17
sudo apt update
sudo apt install openjdk-17-jdk

# 設定 JAVA_HOME
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc
echo 'export PATH=$JAVA_HOME/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Fedora/RHEL

```bash
sudo dnf install java-17-openjdk-devel
```

---

## 🔧 快速設定腳本（Windows PowerShell）

將以下內容儲存為 `setup-java.ps1`：

```powershell
# 檢查是否以管理員身份執行
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Warning "請以管理員身份執行此腳本！"
    Write-Host "按任意鍵退出..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Java 環境設定工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 檢查 Java 是否已安裝
$javaInstalled = $false
try {
    $javaVersion = java -version 2>&1
    if ($javaVersion -match "version") {
        Write-Host "✅ 已安裝 Java:" -ForegroundColor Green
        Write-Host $javaVersion
        $javaInstalled = $true
    }
} catch {
    Write-Host "❌ 未找到 Java" -ForegroundColor Red
}

Write-Host ""

# 如果未安裝，提供下載連結
if (-not $javaInstalled) {
    Write-Host "請先下載並安裝 JDK：" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "選項 1 (推薦): Microsoft OpenJDK" -ForegroundColor Cyan
    Write-Host "https://learn.microsoft.com/en-us/java/openjdk/download" -ForegroundColor Blue
    Write-Host ""
    Write-Host "選項 2: Eclipse Temurin" -ForegroundColor Cyan
    Write-Host "https://adoptium.net/" -ForegroundColor Blue
    Write-Host ""
    Write-Host "安裝後請重新執行此腳本" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "按任意鍵開啟瀏覽器..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Start-Process "https://adoptium.net/"
    exit
}

# 尋找 JDK 路徑
Write-Host "正在搜尋 JDK 安裝路徑..." -ForegroundColor Yellow

$possiblePaths = @(
    "C:\Program Files\Microsoft\jdk-*",
    "C:\Program Files\Java\jdk-*",
    "C:\Program Files\Eclipse Adoptium\jdk-*",
    "C:\Program Files\AdoptOpenJDK\jdk-*"
)

$jdkPath = $null
foreach ($pattern in $possiblePaths) {
    $paths = Get-ChildItem -Path $pattern -Directory -ErrorAction SilentlyContinue | Sort-Object -Descending
    if ($paths) {
        $jdkPath = $paths[0].FullName
        break
    }
}

if (-not $jdkPath) {
    Write-Host "❌ 無法自動找到 JDK 路徑" -ForegroundColor Red
    Write-Host ""
    $jdkPath = Read-Host "請手動輸入 JDK 安裝路徑"
}

Write-Host ""
Write-Host "找到 JDK 路徑: $jdkPath" -ForegroundColor Green
Write-Host ""

# 設定 JAVA_HOME
Write-Host "設定 JAVA_HOME 環境變數..." -ForegroundColor Yellow
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", $jdkPath, [System.EnvironmentVariableTarget]::Machine)

# 更新 PATH
Write-Host "更新 PATH 環境變數..." -ForegroundColor Yellow
$currentPath = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::Machine)
$javaBin = "$jdkPath\bin"

if ($currentPath -notlike "*$javaBin*") {
    $newPath = "$javaBin;$currentPath"
    [System.Environment]::SetEnvironmentVariable("Path", $newPath, [System.EnvironmentVariableTarget]::Machine)
    Write-Host "✅ PATH 已更新" -ForegroundColor Green
} else {
    Write-Host "✅ PATH 已包含 Java" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   設定完成！✅" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "請關閉所有終端視窗並重新開啟" -ForegroundColor Yellow
Write-Host "然後執行: java -version" -ForegroundColor Cyan
Write-Host ""
Write-Host "按任意鍵退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
```

執行方式：
```powershell
# 以管理員身份執行 PowerShell
# 右鍵點擊 PowerShell → 以系統管理員身份執行

# 允許執行腳本（只需一次）
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 執行腳本
.\setup-java.ps1
```

---

## 🚨 常見問題

### Q: 設定後還是顯示找不到 Java？

**A:** 確保：
1. 重新開啟所有終端視窗
2. 重新啟動 VS Code
3. 甚至重新啟動電腦

### Q: 應該安裝哪個版本的 Java？

**A:** 
- 推薦：**Java 17 LTS**
- 最低要求：Java 11
- 也可以使用：Java 21 LTS

### Q: JAVA_HOME 路徑應該指向哪裡？

**A:** 應該指向 JDK 的根目錄，例如：
```
正確 ✅: C:\Program Files\Microsoft\jdk-17.0.12-hotspot
錯誤 ❌: C:\Program Files\Microsoft\jdk-17.0.12-hotspot\bin
```

### Q: 我已經安裝了 Java，為什麼還是不行？

**A:** 可能原因：
1. 只安裝了 JRE（Java 運行環境），需要 JDK（開發工具包）
2. JAVA_HOME 沒有正確設定
3. PATH 沒有包含 `%JAVA_HOME%\bin`
4. 沒有重啟終端

---

## 💡 替代方案：使用 EAS Build（不需要 Java）

如果不想設定 Java 環境，可以使用 EAS Build：

```bash
# 這個方法不需要 Java！
npm install -g eas-cli
eas login
eas build -p android --profile preview --local
```

EAS 會使用 Docker 容器建置，容器內已包含所有必要工具。

---

## ✅ 驗證清單

完成設定後，確認：

- [ ] `java -version` 顯示版本資訊
- [ ] `echo %JAVA_HOME%` 顯示正確路徑
- [ ] 重新開啟了所有終端視窗
- [ ] 可以成功執行 `npm run build:apk`

---

**設定完成後，返回建置指南：`BUILD_APK_GUIDE.md`**

