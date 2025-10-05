# 圖片轉換指南

## ✅ 已生成的 SVG 檔案

我已經為您生成了以下 SVG 格式的預設圖片：

- ✅ `icon.svg` - 應用圖示（1024×1024）
- ✅ `adaptive-icon.svg` - Android 適應圖示（1024×1024）
- ✅ `splash.svg` - 啟動畫面（1242×2436）
- ✅ `favicon.svg` - Web 圖示（48×48）

## 🎨 設計說明

**主題**：無線電廣播塔
- 📻 中央的廣播塔象徵電台
- 📡 發射的信號波代表廣播傳輸
- 🌊 背景的同心圓代表無線電波擴散

**顏色方案**：
- 背景：`#1a1a2e`（深藍黑）
- 主色：`#06b6d4`（青色）- 代表科技感
- 強調色：`#f59e0b`（橙色）- 代表信號和能量
- 文字：`#e8e8e8`（淺灰）

## 🔄 轉換成 PNG 格式

### 方法 1：使用線上工具（最簡單）

1. **訪問以下任一網站**：
   - https://svgtopng.com/
   - https://cloudconvert.com/svg-to-png
   - https://convertio.co/svg-png/

2. **上傳並轉換**：
   - 上傳 `icon.svg` → 設定尺寸 1024×1024 → 下載為 `icon.png`
   - 上傳 `adaptive-icon.svg` → 設定尺寸 1024×1024 → 下載為 `adaptive-icon.png`
   - 上傳 `splash.svg` → 設定尺寸 1242×2436 → 下載為 `splash.png`
   - 上傳 `favicon.svg` → 設定尺寸 48×48 → 下載為 `favicon.png`

3. **放回 assets 目錄**：
   將下載的 PNG 檔案放回 `/home/meson/mesonRadio/assets/` 目錄

### 方法 2：使用 ImageMagick（命令行）

如果您的系統已安裝 ImageMagick：

```bash
cd /home/meson/mesonRadio/assets

# 轉換 icon
convert -background none -size 1024x1024 icon.svg icon.png

# 轉換 adaptive-icon
convert -background none -size 1024x1024 adaptive-icon.svg adaptive-icon.png

# 轉換 splash
convert -background none -size 1242x2436 splash.svg splash.png

# 轉換 favicon
convert -background none -size 48x48 favicon.svg favicon.png
```

### 方法 3：使用 Inkscape（命令行）

如果您的系統已安裝 Inkscape：

```bash
cd /home/meson/mesonRadio/assets

# 轉換 icon
inkscape icon.svg --export-type=png --export-width=1024 --export-height=1024 --export-filename=icon.png

# 轉換 adaptive-icon
inkscape adaptive-icon.svg --export-type=png --export-width=1024 --export-height=1024 --export-filename=adaptive-icon.png

# 轉換 splash
inkscape splash.svg --export-type=png --export-width=1242 --export-height=2436 --export-filename=splash.png

# 轉換 favicon
inkscape favicon.svg --export-type=png --export-width=48 --export-height=48 --export-filename=favicon.png
```

### 方法 4：使用 Node.js 腳本

安裝依賴：
```bash
npm install -g sharp-cli
```

轉換圖片：
```bash
cd /home/meson/mesonRadio/assets

sharp -i icon.svg -o icon.png --width 1024 --height 1024
sharp -i adaptive-icon.svg -o adaptive-icon.png --width 1024 --height 1024
sharp -i splash.svg -o splash.png --width 1242 --height 2436
sharp -i favicon.svg -o favicon.png --width 48 --height 48
```

## ✅ 驗證檔案

轉換完成後，確保以下檔案存在：

```bash
cd /home/meson/mesonRadio/assets
ls -lh *.png
```

應該看到：
- ✅ icon.png (1024×1024 px)
- ✅ adaptive-icon.png (1024×1024 px)
- ✅ splash.png (1242×2436 px)
- ✅ favicon.png (48×48 px)

## 🎨 自訂設計（選用）

如果您想修改設計：

1. **編輯 SVG 檔案**：
   - 使用文字編輯器直接修改 SVG 程式碼
   - 或使用 [Figma](https://figma.com)、[Inkscape](https://inkscape.org/) 等工具

2. **修改顏色**：
   - 在 SVG 檔案中搜尋顏色代碼（如 `#06b6d4`）並替換
   - 主色：`#06b6d4`
   - 強調色：`#f59e0b`
   - 背景：`#1a1a2e`

3. **修改形狀**：
   - 調整 SVG 路徑和形狀參數
   - 保持尺寸比例一致

## 🚀 完成後

PNG 檔案準備好後：

1. **測試應用**：
   ```bash
   cd /home/meson/mesonRadio
   npm start
   ```

2. **建置應用**：
   ```bash
   eas build --platform android --profile preview
   ```

3. **查看效果**：
   - 圖示會顯示在應用列表中
   - 啟動畫面會在應用啟動時顯示

## 📐 檔案規格總結

| 檔案 | 尺寸 | 格式 | 用途 |
|------|------|------|------|
| icon.png | 1024×1024 px | PNG (32-bit) | 主要應用圖示 |
| adaptive-icon.png | 1024×1024 px | PNG (32-bit) | Android 適應圖示 |
| splash.png | 1242×2436 px | PNG (32-bit) | 啟動畫面 |
| favicon.png | 48×48 px | PNG (32-bit) | Web 圖示 |

## 💡 提示

- SVG 檔案可以在任何文字編輯器中查看和編輯
- PNG 轉換後的檔案大小通常在 50-200 KB
- 保留 SVG 檔案作為原始檔，方便未來修改
- 如果不滿意預設設計，可以隨時使用設計工具重新設計

## 🆘 需要幫助？

如果轉換遇到問題：
1. 使用線上工具（方法 1）最簡單可靠
2. 確保轉換時保持透明背景
3. 檢查輸出檔案的尺寸是否正確

---

**已完成**：✅ SVG 檔案已生成  
**待完成**：⚠️ 轉換成 PNG 格式

轉換完成後，您的應用就可以正式測試和發布了！🎉

