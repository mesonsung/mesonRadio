#!/bin/bash

# 播放中斷診斷腳本
# Playback Interruption Debug Script

echo "🔍 播放中斷診斷工具"
echo "===================="
echo ""

# 檢查設備連接
if ! adb devices | grep -q "device$"; then
    echo "❌ 未檢測到 Android 設備"
    echo "請確保："
    echo "  1. 設備已連接"
    echo "  2. USB 調試已啟用"
    echo "  3. 已授權電腦調試"
    exit 1
fi

echo "✅ 設備已連接"
echo ""

# 獲取設備信息
echo "📱 設備信息:"
echo "  型號: $(adb shell getprop ro.product.model)"
echo "  Android 版本: $(adb shell getprop ro.build.version.release)"
echo ""

# 檢查應用是否安裝
if ! adb shell pm list packages | grep -q "com.meson.mesonradio"; then
    echo "❌ 應用未安裝"
    echo "請先安裝: adb install -r android/app/build/outputs/apk/release/app-release.apk"
    exit 1
fi

echo "✅ 應用已安裝"
echo ""

# 檢查電池優化
echo "🔋 電池優化狀態:"
if adb shell dumpsys deviceidle whitelist 2>/dev/null | grep -q "com.meson.mesonradio"; then
    echo "  ✅ 應用在白名單中（不會被優化）"
else
    echo "  ⚠️  應用可能被電池優化"
    echo "  建議: 設置 > 應用 > mesonRadio > 電池 > 不限制"
fi
echo ""

# 清除舊日誌
echo "🧹 清除舊日誌..."
adb logcat -c
echo ""

# 啟動應用
echo "🚀 啟動應用..."
adb shell am start -n com.meson.mesonradio/.MainActivity
sleep 3
echo ""

echo "📊 監控關鍵日誌（請在應用中開始播放）"
echo "   提示: 開始播放後，鎖定屏幕測試"
echo "   按 Ctrl+C 停止監控"
echo "===================="
echo ""

# 監控關鍵日誌
adb logcat | grep --line-buffered -E "Keep Awake|AudioPlayer|📱 通知|✅|❌|⚠️|播放|暫停|停止|killed|Buffering|網路|重試" | while read -r line; do
    # 高亮重要信息
    if echo "$line" | grep -q "Keep Awake"; then
        echo -e "\033[1;32m$line\033[0m"  # 綠色
    elif echo "$line" | grep -q "❌\|錯誤\|killed\|停止"; then
        echo -e "\033[1;31m$line\033[0m"  # 紅色
    elif echo "$line" | grep -q "⚠️\|警告\|Buffering"; then
        echo -e "\033[1;33m$line\033[0m"  # 黃色
    else
        echo "$line"
    fi
done

