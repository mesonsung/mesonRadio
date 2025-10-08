@echo off
echo ========================================
echo 建置 mesonRadio APK
echo ========================================
echo.

echo [1/3] 切換到 Android 目錄...
cd android

echo.
echo [2/3] 開始建置 Release APK...
echo 這可能需要 5-10 分鐘，請耐心等待...
call gradlew.bat assembleRelease

echo.
echo [3/3] 建置完成！
echo.
echo ========================================
echo APK 位置:
echo android\app\build\outputs\apk\release\app-release.apk
echo ========================================
echo.

cd ..
pause
