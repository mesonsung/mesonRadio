@echo off
chcp 65001 > nul
echo ========================================
echo 使用 Expo Go 啟動 mesonRadio
echo ========================================
echo.
echo 這是最簡單的測試方式，無需編譯原生應用
echo.
echo 步驟：
echo 1. 在手機上安裝 Expo Go 應用
echo    - Android: https://play.google.com/store/apps/details?id=host.exp.exponent
echo    - iOS: https://apps.apple.com/app/expo-go/id982107779
echo.
echo 2. 確保手機和電腦在同一個 Wi-Fi 網路
echo.
echo 3. 掃描即將顯示的二維碼
echo.
pause

echo.
echo 正在啟動 Expo 開發服務器...
echo.

call npx expo start

pause

