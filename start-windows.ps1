# mesonRadio Windows 啟動腳本 (PowerShell)
# 使用方法：在專案目錄按右鍵 -> 在終端機開啟 -> 執行 .\start-windows.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   mesonRadio - Windows 啟動腳本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 檢查 Node.js 是否安裝
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "[✓] Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "[✓] npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "[✗] 找不到 Node.js！" -ForegroundColor Red
    Write-Host "請先安裝 Node.js: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "按 Enter 鍵退出"
    exit 1
}

Write-Host ""

# 導航到腳本所在目錄
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "[1/3] 當前目錄: $PWD" -ForegroundColor Yellow
Write-Host ""

# 檢查 node_modules 是否存在
if (-Not (Test-Path "node_modules")) {
    Write-Host "[!] 未找到 node_modules 目錄" -ForegroundColor Yellow
    Write-Host "[→] 正在安裝依賴..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[✗] 依賴安裝失敗！" -ForegroundColor Red
        Read-Host "按 Enter 鍵退出"
        exit 1
    }
    Write-Host "[✓] 依賴安裝完成" -ForegroundColor Green
    Write-Host ""
}

Write-Host "[2/3] 檢查依賴完成" -ForegroundColor Green
Write-Host "[3/3] 啟動開發伺服器..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " 請用 Expo Go 掃描下方的 QR Code" -ForegroundColor White
Write-Host " - 確保手機和電腦在同一 Wi-Fi" -ForegroundColor White
Write-Host " - Android: Google Play 安裝 Expo Go" -ForegroundColor White
Write-Host " - iOS: App Store 安裝 Expo Go" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 啟動 Expo
npm start

