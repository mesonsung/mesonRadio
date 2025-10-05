#!/bin/bash

# mesonRadio 快速啟動腳本

echo "🎵 mesonRadio - 快速啟動"
echo "========================"
echo ""

# 載入 Node.js
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 錯誤：無法載入 Node.js"
    echo "請執行：source ~/.bashrc"
    exit 1
fi

echo "✅ Node.js $(node --version)"
echo "✅ npm $(npm --version)"
echo ""

# 檢查依賴
if [ ! -d "node_modules" ]; then
    echo "📦 首次運行，正在安裝依賴..."
    npm install
    echo ""
fi

# 啟動應用
echo "🚀 啟動 mesonRadio..."
echo ""
echo "接下來："
echo "1. 在手機安裝 Expo Go"
echo "2. 掃描下方的 QR Code"
echo "3. 開始使用 mesonRadio！"
echo ""
echo "═══════════════════════════════════════════════"
echo ""

npm start

