@echo off
echo ========================================
echo 使用 ADB 安裝 APK
echo ========================================
echo.

REM 設定 Android SDK 路徑
set ANDROID_HOME=C:\Users\xuan0\AppData\Local\Android\Sdk
set ADB=%ANDROID_HOME%\platform-tools\adb.exe

echo [1/4] 檢查 ADB 工具...
if not exist "%ADB%" (
    echo ❌ 找不到 ADB 工具！
    echo.
    echo 請安裝 Android SDK Platform Tools:
    echo https://developer.android.com/studio/releases/platform-tools
    echo.
    echo 或者在 Android Studio 中安裝：
    echo SDK Manager ^> Android SDK ^> SDK Tools ^> Android SDK Platform-Tools
    pause
    exit /b 1
)
echo ✅ ADB 工具找到: %ADB%
echo.

echo [2/4] 檢查 APK 檔案...
if not exist "android\app\build\outputs\apk\release\app-release.apk" (
    echo ❌ APK 檔案不存在！
    echo 請先建置 APK
    pause
    exit /b 1
)
echo ✅ APK 檔案找到
echo.

echo [3/4] 檢查手機連接...
"%ADB%" devices
echo.

echo [4/4] 安裝 APK 到手機...
echo 正在安裝，請稍候...
"%ADB%" install -r android\app\build\outputs\apk\release\app-release.apk

echo.
echo ========================================
if %ERRORLEVEL% EQU 0 (
    echo ✅ 安裝成功！
    echo.
    echo 📱 鎖屏播放測試步驟：
    echo.
    echo 1. 開啟 mesonRadio 應用
    echo 2. 選擇電台並播放
    echo 3. 按電源鍵鎖定螢幕
    echo 4. 音訊應該繼續播放 ⭐
    echo 5. 通知欄應顯示播放資訊
    echo.
    echo 📱 小米手機必須設定權限：
    echo    設定 ^> 應用程式 ^> mesonRadio
    echo    - 省電策略 ^> 無限制
    echo    - 自啟動 ^> 允許
    echo    - 後台彈出 ^> 允許
    echo    - 鎖屏顯示 ^> 允許
) else (
    echo ❌ 安裝失敗！
    echo.
    echo 可能的原因：
    echo 1. 手機未透過 USB 連接
    echo 2. 未啟用 USB 偵錯模式
    echo 3. 未授權此電腦
    echo 4. 手機螢幕鎖定
    echo.
    echo 解決方案：
    echo 1. 檢查 USB 資料線
    echo 2. 設定 ^> 開發者選項 ^> USB 偵錯
    echo 3. 手機上點擊「允許此電腦偵錯」
    echo 4. 保持手機螢幕解鎖
)
echo ========================================
echo.
pause

