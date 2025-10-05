#!/usr/bin/env python3
"""
mesonRadio SVG to PNG 轉換工具
使用 cairosvg 將 SVG 轉換成 PNG
"""

import os
import sys

print("🎨 mesonRadio 圖片轉換工具 (Python)")
print("=" * 50)
print()

# 檢查是否安裝 cairosvg
try:
    import cairosvg
    print("✅ cairosvg 已安裝")
except ImportError:
    print("❌ 錯誤：未安裝 cairosvg")
    print()
    print("安裝方法：")
    print("  pip3 install cairosvg")
    print("  或")
    print("  pip install cairosvg")
    print()
    sys.exit(1)

# 切換到 assets 目錄
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

print(f"📂 當前目錄：{os.getcwd()}")
print()

# 定義轉換任務
conversions = [
    {"input": "icon.svg", "output": "icon.png", "width": 1024, "height": 1024},
    {"input": "adaptive-icon.svg", "output": "adaptive-icon.png", "width": 1024, "height": 1024},
    {"input": "splash.svg", "output": "splash.png", "width": 1242, "height": 2436},
    {"input": "favicon.svg", "output": "favicon.png", "width": 48, "height": 48},
]

success_count = 0
fail_count = 0

# 執行轉換
for conv in conversions:
    input_file = conv["input"]
    output_file = conv["output"]
    width = conv["width"]
    height = conv["height"]
    
    if not os.path.exists(input_file):
        print(f"❌ 錯誤：找不到檔案 {input_file}")
        fail_count += 1
        continue
    
    try:
        print(f"🔄 轉換 {input_file} → {output_file} ({width}×{height})")
        
        cairosvg.svg2png(
            url=input_file,
            write_to=output_file,
            output_width=width,
            output_height=height
        )
        
        # 顯示檔案大小
        size_bytes = os.path.getsize(output_file)
        size_kb = size_bytes / 1024
        print(f"   ✅ 完成 ({size_kb:.2f} KB)")
        success_count += 1
        
    except Exception as e:
        print(f"   ❌ 錯誤：{str(e)}")
        fail_count += 1

print()
print(f"🎉 轉換完成！成功：{success_count}，失敗：{fail_count}")
print()

if success_count > 0:
    print("📋 生成的檔案：")
    for conv in conversions:
        output_file = conv["output"]
        if os.path.exists(output_file):
            size_bytes = os.path.getsize(output_file)
            size_kb = size_bytes / 1024
            print(f"   - {output_file} ({size_kb:.2f} KB)")

print()
print("下一步：")
print("1. 檢查生成的 PNG 檔案")
print('2. 執行 "npm install" 安裝依賴')
print('3. 執行 "npm start" 測試應用')
print()

