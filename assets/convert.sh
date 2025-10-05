#!/bin/bash

# mesonRadio 圖片轉換腳本
# 使用 ImageMagick 將 SVG 轉換成 PNG

echo "🎨 mesonRadio 圖片轉換工具"
echo "=========================="
echo ""

# 檢查是否安裝 ImageMagick
if ! command -v convert &> /dev/null; then
    echo "❌ 錯誤：未安裝 ImageMagick"
    echo ""
    echo "請安裝 ImageMagick："
    echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  macOS: brew install imagemagick"
    echo "  或使用線上工具轉換（參考 CONVERT_IMAGES.md）"
    echo ""
    exit 1
fi

# 切換到 assets 目錄
cd "$(dirname "$0")"

echo "📂 當前目錄：$(pwd)"
echo ""

# 轉換 icon.svg
echo "🔄 轉換 icon.svg → icon.png (1024×1024)"
convert -background none -size 1024x1024 icon.svg icon.png
echo "   ✅ 完成"

# 轉換 adaptive-icon.svg
echo "🔄 轉換 adaptive-icon.svg → adaptive-icon.png (1024×1024)"
convert -background none -size 1024x1024 adaptive-icon.svg adaptive-icon.png
echo "   ✅ 完成"

# 轉換 splash.svg
echo "🔄 轉換 splash.svg → splash.png (1242×2436)"
convert -background none -size 1242x2436 splash.svg splash.png
echo "   ✅ 完成"

# 轉換 favicon.svg
echo "🔄 轉換 favicon.svg → favicon.png (48×48)"
convert -background none -size 48x48 favicon.svg favicon.png
echo "   ✅ 完成"

echo ""
echo "🎉 所有圖片轉換完成！"
echo ""
echo "📋 生成的檔案："
ls -lh icon.png adaptive-icon.png splash.png favicon.png 2>/dev/null || echo "   部分檔案可能未生成"

echo ""
echo "下一步："
echo "1. 檢查生成的 PNG 檔案"
echo "2. 執行 'npm start' 測試應用"
echo "3. 建置應用：'eas build --platform android'"
echo ""

