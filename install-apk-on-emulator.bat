@echo off
echo ========================================
echo 使用模擬器安裝 APK
echo ========================================
echo.

REM 設定 Android SDK 路徑
set ANDROID_HOME=C:\Users\xuan0\AppData\Local\Android\Sdk
set ADB=%ANDROID_HOME%\platform-tools\adb.exe
set EMULATOR=%ANDROID_HOME%\emulator\emulator.exe

echo [1/5] 檢查工具...
if not exist "%ADB%" (
    echo ❌ 找不到 ADB 工具！
    pause
    exit /b 1
)
if not exist "%EMULATOR%" (
    echo ❌ 找不到模擬器工具！
    pause
    exit /b 1
)
echo ✅ 工具檢查完成
echo.

echo [2/5] 檢查 APK 檔案...
if not exist "android\app\build\outputs\apk\release\app-release.apk" (
    echo ❌ APK 檔案不存在！
    echo 請先建置 APK: npm run build:android:release
    pause
    exit /b 1
)
echo ✅ APK 檔案找到
echo.

echo [3/5] 檢查已連接的設備...
"%ADB%" devices
echo.

REM 檢查是否有設備連接
"%ADB%" devices | findstr /C:"device" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ 發現已連接的設備/模擬器
    goto :install
)

echo [4/5] 啟動模擬器...
echo 正在列出可用的 AVD...
"%EMULATOR%" -list-avds
echo.

REM 嘗試啟動第一個可用的 AVD
for /f "tokens=*" %%i in ('"%EMULATOR%" -list-avds') do (
    echo 正在啟動模擬器: %%i
    start "" "%EMULATOR%" -avd %%i
    echo 等待模擬器啟動（30秒）...
    timeout /t 30 /nobreak >nul
    
    REM 等待設備連接
    echo 等待設備連接...
    :wait_device
    "%ADB%" wait-for-device
    timeout /t 5 /nobreak >nul
    "%ADB%" devices | findstr /C:"device" >nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ 模擬器已連接
        goto :install
    )
    goto :wait_device
)

echo ❌ 沒有找到可用的 AVD
echo 請在 Android Studio 中創建一個 AVD
pause
exit /b 1

:install
echo.
echo [5/5] 安裝 APK 到模擬器...
echo 正在安裝，請稍候...
"%ADB%" install -r android\app\build\outputs\apk\release\app-release.apk

echo.
echo ========================================
if %ERRORLEVEL% EQU 0 (
    echo ✅ 安裝成功！
    echo.
    echo 📱 可以在模擬器中打開 mesonRadio 應用
) else (
    echo ❌ 安裝失敗！
    echo.
    echo 可能的原因：
    echo 1. 模擬器未完全啟動
    echo 2. APK 檔案損壞
    echo 3. 模擬器空間不足
)
echo ========================================
echo.
pause
