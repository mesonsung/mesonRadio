@echo off
echo ========================================
echo 檢查 APK 建置狀態
echo ========================================
echo.

if exist "android\app\build\outputs\apk\release\app-release.apk" (
    echo ✅ APK 建置完成！
    echo.
    echo 📍 檔案位置:
    dir "android\app\build\outputs\apk\release\app-release.apk"
    echo.
    echo ========================================
    echo 📱 安裝到手機:
    echo.
    echo 方法 1 - 直接安裝（推薦）:
    echo    cd android
    echo    gradlew.bat installRelease
    echo.
    echo 方法 2 - 手動安裝:
    echo    1. 複製 app-release.apk 到手機
    echo    2. 在手機上點擊安裝
    echo.
    echo ========================================
    echo 📖 測試指南請查看:
    echo    鎖屏播放測試指南.md
    echo ========================================
) else (
    echo ⏳ APK 還在建置中...
    echo.
    echo 建置過程通常需要 10-20 分鐘
    echo 請耐心等待，或查看 PowerShell 視窗的輸出
    echo.
    echo 💡 提示: 你可以每隔幾分鐘執行這個腳本來檢查進度
)

echo.
pause

