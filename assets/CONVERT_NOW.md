# 🚀 立即轉換 SVG 到 PNG

## 當前狀況

您的系統缺少以下工具：
- ❌ ImageMagick
- ❌ Node.js/npm
- ❌ pip3 (Python 套件管理器)
- ❌ cairosvg

## ✅ 最佳解決方案：使用線上工具（1 分鐘/圖片）

### 🌐 推薦網站（任選一個）

1. **https://svgtopng.com/** ⭐ 最簡單
2. **https://cloudconvert.com/svg-to-png**
3. **https://convertio.co/svg-png/**
4. **https://online-converting.com/image/convert2png/**

### 📝 操作步驟

#### 第 1 步：icon.png
1. 訪問 https://svgtopng.com/
2. 點擊 "Upload SVG" 或拖放 `icon.svg`
3. 設定尺寸：**1024 × 1024** px
4. 點擊 "Convert" 下載 `icon.png`
5. 將檔案移到 `/home/meson/mesonRadio/assets/` 目錄

#### 第 2 步：adaptive-icon.png
1. 上傳 `adaptive-icon.svg`
2. 設定尺寸：**1024 × 1024** px
3. 下載 `adaptive-icon.png`
4. 移到 assets 目錄

#### 第 3 步：splash.png
1. 上傳 `splash.svg`
2. 設定尺寸：**1242 × 2436** px
3. 下載 `splash.png`
4. 移到 assets 目錄

#### 第 4 步：favicon.png
1. 上傳 `favicon.svg`
2. 設定尺寸：**48 × 48** px
3. 下載 `favicon.png`
4. 移到 assets 目錄

⏱️ **總時間：約 5 分鐘**

## 🔧 替代方案：安裝轉換工具

### 方案 A：安裝 ImageMagick（推薦）

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install imagemagick

# 然後執行
cd /home/meson/mesonRadio/assets
./convert.sh
```

### 方案 B：安裝 Python 套件

```bash
# 安裝 pip
sudo apt install python3-pip

# 安裝 cairosvg
pip3 install cairosvg

# 然後執行
cd /home/meson/mesonRadio/assets
python3 convert.py
```

### 方案 C：安裝 Inkscape

```bash
# Ubuntu/Debian
sudo apt install inkscape

# 然後手動轉換每個檔案
cd /home/meson/mesonRadio/assets
inkscape icon.svg --export-type=png --export-width=1024 --export-filename=icon.png
inkscape adaptive-icon.svg --export-type=png --export-width=1024 --export-filename=adaptive-icon.png
inkscape splash.svg --export-type=png --export-width=1242 --export-filename=splash.png
inkscape favicon.svg --export-type=png --export-width=48 --export-filename=favicon.png
```

## ✅ 驗證轉換結果

轉換完成後，檢查檔案：

```bash
cd /home/meson/mesonRadio/assets
ls -lh *.png
```

應該看到 4 個 PNG 檔案：
- icon.png (~50-150 KB)
- adaptive-icon.png (~50-150 KB)
- splash.png (~100-300 KB)
- favicon.png (~5-15 KB)

## 🎉 完成後

```bash
cd /home/meson/mesonRadio
npm install   # 安裝依賴（如果尚未安裝）
npm start     # 啟動應用
```

---

**建議**：使用線上工具最簡單快速，無需安裝任何軟體！

