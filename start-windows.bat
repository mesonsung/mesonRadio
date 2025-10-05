@echo off
REM mesonRadio Windows 啟動腳本
REM 使用方法：直接雙擊此檔案即可啟動

echo ========================================
echo    mesonRadio - Windows 啟動腳本
echo ========================================
echo.

REM 檢查 Node.js 是否安裝
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [錯誤] 找不到 Node.js！
    echo 請先安裝 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] 檢查環境...
node --version
npm --version
echo.

REM 導航到正確的目錄
cd /d "%~dp0"
echo [2/3] 當前目錄: %CD%
echo.

REM 檢查 node_modules 是否存在
if not exist "node_modules\" (
    echo [警告] 未找到 node_modules 目錄
    echo [安裝] 正在安裝依賴...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [錯誤] 依賴安裝失敗！
        pause
        exit /b 1
    )
    echo.
)

echo [3/3] 啟動開發伺服器...
echo.
echo ========================================
echo  請用 Expo Go 掃描下方的 QR Code
echo  - 確保手機和電腦在同一 Wi-Fi
echo  - Android: Google Play 安裝 Expo Go
echo  - iOS: App Store 安裝 Expo Go
echo ========================================
echo.

REM 啟動 Expo（使用 --clear 清除快取，--yes 自動回答問題）
call npx expo start --clear

REM 如果失敗，顯示錯誤訊息
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [錯誤] 開發伺服器啟動失敗！
    echo.
    echo 可能的原因：
    echo 1. 端口 8081 被占用 - 請嘗試關閉其他 Expo/React Native 進程
    echo 2. 依賴未正確安裝 - 請嘗試執行: npm install
    echo 3. 快取問題 - 已自動清除快取
    echo.
    echo 請查看上方的錯誤訊息以了解詳情。
    echo.
)

pause

