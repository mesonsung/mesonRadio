@echo off
echo ========================================
echo 清理並重新建置 mesonRadio
echo ========================================
echo.

echo [1/4] 清理 Android 建置快取...
cd android
call gradlew.bat clean
cd ..

echo.
echo [2/4] 清理 npm 快取...
npm cache clean --force

echo.
echo [3/4] 重新安裝相依套件...
npm install

echo.
echo [4/4] 啟動建置...
npm run android

echo.
echo ========================================
echo 建置完成！
echo ========================================
pause

