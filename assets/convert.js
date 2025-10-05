#!/usr/bin/env node

/**
 * mesonRadio 圖片轉換腳本（Node.js 版本）
 * 需要安裝 sharp: npm install -g sharp
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 mesonRadio 圖片轉換工具 (Node.js)');
console.log('=====================================');
console.log('');
console.log('⚠️  注意：此腳本需要安裝 sharp 套件');
console.log('');
console.log('安裝方法：');
console.log('  npm install sharp');
console.log('  或');
console.log('  npm install -g sharp');
console.log('');
console.log('如果遇到問題，請使用線上工具轉換（參考 CONVERT_IMAGES.md）');
console.log('');

// 嘗試載入 sharp
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('❌ 錯誤：未找到 sharp 套件');
  console.error('');
  console.error('請執行：npm install sharp');
  console.error('');
  process.exit(1);
}

const assetsDir = __dirname;

const conversions = [
  { input: 'icon.svg', output: 'icon.png', width: 1024, height: 1024 },
  { input: 'adaptive-icon.svg', output: 'adaptive-icon.png', width: 1024, height: 1024 },
  { input: 'splash.svg', output: 'splash.png', width: 1242, height: 2436 },
  { input: 'favicon.svg', output: 'favicon.png', width: 48, height: 48 },
];

async function convertImage(input, output, width, height) {
  const inputPath = path.join(assetsDir, input);
  const outputPath = path.join(assetsDir, output);

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ 錯誤：找不到檔案 ${input}`);
    return false;
  }

  try {
    console.log(`🔄 轉換 ${input} → ${output} (${width}×${height})`);
    
    await sharp(inputPath)
      .resize(width, height, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    
    const stats = fs.statSync(outputPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`   ✅ 完成 (${sizeKB} KB)`);
    return true;
  } catch (error) {
    console.error(`   ❌ 錯誤：${error.message}`);
    return false;
  }
}

async function main() {
  console.log(`📂 當前目錄：${assetsDir}`);
  console.log('');

  let successCount = 0;
  let failCount = 0;

  for (const conversion of conversions) {
    const success = await convertImage(
      conversion.input,
      conversion.output,
      conversion.width,
      conversion.height
    );
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('');
  console.log(`🎉 轉換完成！成功：${successCount}，失敗：${failCount}`);
  console.log('');

  if (successCount > 0) {
    console.log('📋 生成的檔案：');
    conversions.forEach(({ output }) => {
      const outputPath = path.join(assetsDir, output);
      if (fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`   - ${output} (${sizeKB} KB)`);
      }
    });
  }

  console.log('');
  console.log('下一步：');
  console.log('1. 檢查生成的 PNG 檔案');
  console.log('2. 執行 "npm start" 測試應用');
  console.log('3. 建置應用："eas build --platform android"');
  console.log('');
}

main().catch(error => {
  console.error('❌ 發生錯誤：', error);
  process.exit(1);
});

