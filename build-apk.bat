@echo off
REM ========================================
REM mesonRadio APK 建置腳本 (Windows)
REM ========================================

echo.
echo ========================================
echo   mesonRadio APK 建置工具
echo ========================================
echo.
echo 請選擇建置方式：
echo.
echo [1] EAS Build 本地建置 (推薦，最簡單)
echo [2] Gradle Debug 建置 (需要 Android SDK)
echo [3] Gradle Release 建置 (需要 Android SDK)
echo [4] 安裝 EAS CLI
echo [5] 退出
echo.

set /p choice="請輸入選項 (1-5): "

if "%choice%"=="1" goto eas_build
if "%choice%"=="2" goto gradle_debug
if "%choice%"=="3" goto gradle_release
if "%choice%"=="4" goto install_eas
if "%choice%"=="5" goto end
goto invalid

:eas_build
echo.
echo ========================================
echo 使用 EAS Build 建置 APK...
echo ========================================
echo.
echo 檢查 EAS CLI...
where eas >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [錯誤] 找不到 EAS CLI
    echo 請先執行選項 4 安裝 EAS CLI
    pause
    goto end
)

echo.
echo 開始建置預覽版 APK...
echo 這可能需要 10-20 分鐘...
echo.

eas build -p android --profile preview --local

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   建置成功！✅
    echo ========================================
    echo.
    echo APK 檔案位置：專案根目錄
    echo 檔案名稱：mesonradio-*.apk
    echo.
) else (
    echo.
    echo ========================================
    echo   建置失敗 ❌
    echo ========================================
    echo.
    echo 請檢查錯誤訊息並重試
    echo.
)
pause
goto end

:gradle_debug
echo.
echo ========================================
echo 使用 Gradle 建置 Debug APK...
echo ========================================
echo.

if not exist "android" (
    echo [錯誤] 找不到 android 目錄
    echo 請先執行: npx expo prebuild --platform android
    pause
    goto end
)

cd android
echo 開始建置 Debug APK...
call gradlew.bat assembleDebug

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   建置成功！✅
    echo ========================================
    echo.
    echo APK 位置：android\app\build\outputs\apk\debug\app-debug.apk
    echo.
) else (
    echo.
    echo ========================================
    echo   建置失敗 ❌
    echo ========================================
    echo.
)

cd ..
pause
goto end

:gradle_release
echo.
echo ========================================
echo 使用 Gradle 建置 Release APK...
echo ========================================
echo.

if not exist "android" (
    echo [錯誤] 找不到 android 目錄
    echo 請先執行: npx expo prebuild --platform android
    pause
    goto end
)

cd android
echo 開始建置 Release APK...
call gradlew.bat assembleRelease

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   建置成功！✅
    echo ========================================
    echo.
    echo APK 位置：android\app\build\outputs\apk\release\app-release.apk
    echo.
) else (
    echo.
    echo ========================================
    echo   建置失敗 ❌
    echo ========================================
    echo.
)

cd ..
pause
goto end

:install_eas
echo.
echo ========================================
echo 安裝 EAS CLI...
echo ========================================
echo.
call npm install -g eas-cli

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   安裝成功！✅
    echo ========================================
    echo.
    echo 請執行以下命令登入：
    echo   eas login
    echo.
) else (
    echo.
    echo ========================================
    echo   安裝失敗 ❌
    echo ========================================
    echo.
)
pause
goto end

:invalid
echo.
echo [錯誤] 無效的選項
pause
goto end

:end
echo.
echo 感謝使用 mesonRadio 建置工具！
echo.

