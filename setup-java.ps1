# ========================================
# Java 環境自動設定腳本
# Java Environment Setup Script
# ========================================

# 檢查是否以管理員身份執行
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Java 環境設定工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not $isAdmin) {
    Write-Host "⚠️  此腳本需要管理員權限" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "請以管理員身份重新執行：" -ForegroundColor Yellow
    Write-Host "1. 右鍵點擊 PowerShell" -ForegroundColor White
    Write-Host "2. 選擇「以系統管理員身份執行」" -ForegroundColor White
    Write-Host "3. 執行: .\setup-java.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "按任意鍵退出..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

# 檢查 Java 是否已安裝
Write-Host "檢查 Java 安裝狀態..." -ForegroundColor Yellow
$javaInstalled = $false
$javaVersion = ""

try {
    $output = java -version 2>&1
    if ($output -match "version") {
        $javaInstalled = $true
        $javaVersion = ($output | Select-String -Pattern 'version "([^"]+)"').Matches.Groups[1].Value
        Write-Host "✅ 已安裝 Java 版本: $javaVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ 未找到 Java" -ForegroundColor Red
}

Write-Host ""

# 如果未安裝，提供下載指引
if (-not $javaInstalled) {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "   Java 尚未安裝" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "請選擇下載來源：" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "[1] Microsoft OpenJDK 17 (推薦)" -ForegroundColor Cyan
    Write-Host "    https://learn.microsoft.com/en-us/java/openjdk/download" -ForegroundColor Gray
    Write-Host ""
    Write-Host "[2] Eclipse Temurin 17 (推薦)" -ForegroundColor Cyan
    Write-Host "    https://adoptium.net/" -ForegroundColor Gray
    Write-Host ""
    Write-Host "[3] 取消" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "請輸入選項 (1-3)"
    
    switch ($choice) {
        "1" {
            Write-Host ""
            Write-Host "正在開啟 Microsoft OpenJDK 下載頁面..." -ForegroundColor Green
            Start-Process "https://learn.microsoft.com/en-us/java/openjdk/download"
        }
        "2" {
            Write-Host ""
            Write-Host "正在開啟 Eclipse Temurin 下載頁面..." -ForegroundColor Green
            Start-Process "https://adoptium.net/"
        }
        default {
            Write-Host "已取消" -ForegroundColor Yellow
            exit
        }
    }
    
    Write-Host ""
    Write-Host "請下載並安裝 JDK，然後重新執行此腳本" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "安裝建議：" -ForegroundColor Cyan
    Write-Host "- 選擇 JDK 17 LTS 版本" -ForegroundColor White
    Write-Host "- 使用預設安裝路徑" -ForegroundColor White
    Write-Host "- Temurin 記得勾選 'Set JAVA_HOME variable'" -ForegroundColor White
    Write-Host ""
    Write-Host "按任意鍵退出..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

# 尋找 JDK 安裝路徑
Write-Host "正在搜尋 JDK 安裝路徑..." -ForegroundColor Yellow
Write-Host ""

$possiblePaths = @(
    "C:\Program Files\Microsoft\jdk-*",
    "C:\Program Files\Java\jdk-*",
    "C:\Program Files\Eclipse Adoptium\jdk-*",
    "C:\Program Files\AdoptOpenJDK\jdk-*",
    "C:\Program Files\OpenJDK\jdk-*"
)

$jdkPath = $null
$foundPaths = @()

foreach ($pattern in $possiblePaths) {
    $paths = Get-ChildItem -Path $pattern -Directory -ErrorAction SilentlyContinue | Sort-Object -Descending
    foreach ($path in $paths) {
        $foundPaths += $path.FullName
    }
}

if ($foundPaths.Count -eq 0) {
    Write-Host "❌ 無法自動找到 JDK 路徑" -ForegroundColor Red
    Write-Host ""
    Write-Host "請手動輸入 JDK 安裝路徑" -ForegroundColor Yellow
    Write-Host "例如: C:\Program Files\Microsoft\jdk-17.0.12-hotspot" -ForegroundColor Gray
    Write-Host ""
    $jdkPath = Read-Host "JDK 路徑"
    
    if (-not (Test-Path $jdkPath)) {
        Write-Host ""
        Write-Host "❌ 路徑不存在: $jdkPath" -ForegroundColor Red
        Write-Host "按任意鍵退出..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit
    }
} elseif ($foundPaths.Count -eq 1) {
    $jdkPath = $foundPaths[0]
    Write-Host "找到 JDK: $jdkPath" -ForegroundColor Green
} else {
    Write-Host "找到多個 JDK 安裝：" -ForegroundColor Cyan
    Write-Host ""
    for ($i = 0; $i -lt $foundPaths.Count; $i++) {
        Write-Host "[$($i + 1)] $($foundPaths[$i])" -ForegroundColor White
    }
    Write-Host ""
    $selection = Read-Host "請選擇要使用的 JDK (1-$($foundPaths.Count))"
    
    $index = [int]$selection - 1
    if ($index -ge 0 -and $index -lt $foundPaths.Count) {
        $jdkPath = $foundPaths[$index]
    } else {
        Write-Host "無效的選擇" -ForegroundColor Red
        exit
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   開始設定環境變數" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 設定 JAVA_HOME
Write-Host "設定 JAVA_HOME = $jdkPath" -ForegroundColor Yellow
try {
    [System.Environment]::SetEnvironmentVariable("JAVA_HOME", $jdkPath, [System.EnvironmentVariableTarget]::Machine)
    Write-Host "✅ JAVA_HOME 設定成功" -ForegroundColor Green
} catch {
    Write-Host "❌ JAVA_HOME 設定失敗: $_" -ForegroundColor Red
}

Write-Host ""

# 更新 PATH
Write-Host "更新 PATH 環境變數..." -ForegroundColor Yellow
$currentPath = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::Machine)
$javaBin = "$jdkPath\bin"

if ($currentPath -like "*$javaBin*") {
    Write-Host "✅ PATH 已包含 $javaBin" -ForegroundColor Green
} else {
    try {
        $newPath = "$javaBin;$currentPath"
        [System.Environment]::SetEnvironmentVariable("Path", $newPath, [System.EnvironmentVariableTarget]::Machine)
        Write-Host "✅ PATH 更新成功" -ForegroundColor Green
    } catch {
        Write-Host "❌ PATH 更新失敗: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   設定完成！✅" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "環境變數設定摘要：" -ForegroundColor Cyan
Write-Host "  JAVA_HOME = $jdkPath" -ForegroundColor White
Write-Host "  PATH 包含 = $javaBin" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  重要：請執行以下步驟" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 關閉所有終端視窗（PowerShell、CMD、VS Code 終端）" -ForegroundColor White
Write-Host "2. 重新開啟終端" -ForegroundColor White
Write-Host "3. 執行驗證命令：" -ForegroundColor White
Write-Host "   java -version" -ForegroundColor Cyan
Write-Host "   echo `$env:JAVA_HOME" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. 然後可以建置 APK：" -ForegroundColor White
Write-Host "   npm run build:apk" -ForegroundColor Cyan
Write-Host ""
Write-Host "按任意鍵退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

