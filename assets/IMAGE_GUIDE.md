# 🎨 圖片資源快速指南

## ✅ 已完成

我已經為您生成了以下預設圖片（SVG 格式）：

| 檔案 | 尺寸 | 狀態 | 說明 |
|------|------|------|------|
| ✅ icon.svg | 1024×1024 | 已生成 | 應用主圖示 |
| ✅ adaptive-icon.svg | 1024×1024 | 已生成 | Android 適應圖示 |
| ✅ splash.svg | 1242×2436 | 已生成 | 啟動畫面 |
| ✅ favicon.svg | 48×48 | 已生成 | Web 圖示 |

## 🎨 設計特色

**圖示設計**：
- 📡 中央廣播塔（象徵電台）
- 📻 發射的信號波（橙色曲線）
- 🌊 背景同心圓（代表無線電波）
- 🎨 深色主題搭配青色和橙色

**顏色**：
- 背景：深藍黑 (#1a1a2e)
- 主色：青色 (#06b6d4) - 科技感
- 強調：橙色 (#f59e0b) - 能量感

## 🔄 轉換成 PNG（3 種方法）

### 方法 1：線上工具（⭐ 推薦，最簡單）

1. 訪問：https://svgtopng.com/
2. 上傳 SVG 檔案
3. 設定正確尺寸
4. 下載 PNG 檔案
5. 放回 assets 目錄

### 方法 2：使用轉換腳本

```bash
# 如果已安裝 ImageMagick
cd /home/meson/mesonRadio/assets
./convert.sh

# 或使用 Node.js 版本（需安裝 sharp）
npm install sharp
node convert.js
```

### 方法 3：Expo 自動處理

Expo 可以直接使用 SVG 檔案（實驗性功能），但建議轉換成 PNG 以確保兼容性。

## 📋 轉換後的檔案清單

需要生成以下 PNG 檔案：

- ⬜ icon.png (1024×1024 px)
- ⬜ adaptive-icon.png (1024×1024 px)  
- ⬜ splash.png (1242×2436 px)
- ⬜ favicon.png (48×48 px)

## ⚡ 快速開始

**最快的方法**：

1. 打開瀏覽器：https://svgtopng.com/
2. 依次上傳 4 個 SVG 檔案
3. 下載對應的 PNG 檔案
4. 放回 assets 目錄
5. 完成！

**估計時間**：5 分鐘

## 🚀 完成後

PNG 檔案準備好後：

```bash
cd /home/meson/mesonRadio
npm start
```

您會看到：
- ✨ 應用圖示顯示在 Expo Go 中
- ✨ 啟動畫面在應用啟動時顯示

## 🎨 自訂設計（選用）

如果您想修改設計：

1. **直接編輯 SVG**：
   - 用文字編輯器打開 SVG 檔案
   - 修改顏色代碼（如 #06b6d4）
   - 儲存並重新轉換

2. **使用設計工具**：
   - Figma（線上）：https://figma.com
   - Inkscape（桌面）：https://inkscape.org

## 📁 檔案位置

```
/home/meson/mesonRadio/assets/
├── ✅ icon.svg              (已生成)
├── ✅ adaptive-icon.svg     (已生成)
├── ✅ splash.svg            (已生成)
├── ✅ favicon.svg           (已生成)
├── ⬜ icon.png              (需轉換)
├── ⬜ adaptive-icon.png     (需轉換)
├── ⬜ splash.png            (需轉換)
├── ⬜ favicon.png           (需轉換)
├── 📖 CONVERT_IMAGES.md     (詳細說明)
├── 📖 IMAGE_GUIDE.md        (本檔案)
├── 🔧 convert.sh            (轉換腳本)
└── 🔧 convert.js            (Node.js 腳本)
```

## ❓ 常見問題

**Q: 可以直接使用 SVG 嗎？**  
A: Expo 部分支援，但建議轉換成 PNG 以確保兼容性。

**Q: 轉換失敗怎麼辦？**  
A: 使用線上工具是最可靠的方法。

**Q: 圖片太大？**  
A: PNG 檔案通常在 50-200 KB，是正常的。

**Q: 可以更改設計嗎？**  
A: 可以！編輯 SVG 檔案後重新轉換即可。

**Q: 為什麼需要 4 個不同的圖片？**  
A: 
- icon.png - 應用圖示（iOS 和 Android）
- adaptive-icon.png - Android 特殊圖示格式
- splash.png - 啟動時的全螢幕畫面
- favicon.png - Web 版本的小圖示

## 🆘 需要幫助？

詳細說明請參考：`CONVERT_IMAGES.md`

---

**當前狀態**：✅ SVG 已生成，⚠️ 需轉換成 PNG

**下一步**：使用線上工具轉換 SVG → PNG（5 分鐘）

**完成後**：執行 `npm start` 測試應用 🎉

