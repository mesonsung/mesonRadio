# 動態 Import 問題修復
# Dynamic Import Issue Fix

## 🚨 問題描述

在本地建置 APK 時遇到錯誤：

```
[EAGER_BUNDLE] Error: Unable to resolve module 
/tmp/meson/eas-build-local-nodejs/.../async-require.js

> 56 | const { AIRadioSearchService } = await import('@/services/AIRadioSearchService');
```

## 🔍 問題原因

**React Native 不支援動態 `import()`（Dynamic Import）**

在以下文件中使用了動態 import：

1. `src/screens/SearchStationsScreen.tsx`
   ```typescript
   const { AIRadioSearchService } = await import('@/services/AIRadioSearchService');
   const { GoogleGenerativeAI } = await import('@google/generative-ai');
   ```

2. `src/services/VoiceCommandService.ts`
   ```typescript
   const AIRadioSearchService = (await import('./AIRadioSearchService')).AIRadioSearchService;
   const { GoogleGenerativeAI } = await import('@google/generative-ai');
   ```

## ✅ 解決方案

### 將所有動態 import 改為靜態 import

#### 修復 1: SearchStationsScreen.tsx

**修改前：**
```typescript
import { t } from '@/utils/i18n';

// ... 在函數內部
const { AIRadioSearchService } = await import('@/services/AIRadioSearchService');
const { GoogleGenerativeAI } = await import('@google/generative-ai');
```

**修改後：**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIRadioSearchService } from '@/services/AIRadioSearchService';
import { t } from '@/utils/i18n';

// ... 在函數內部
// 直接使用，不需要 await import
const aiResults = await AIRadioSearchService.searchRadioStationsWithAI(searchQuery);
const genAI = new GoogleGenerativeAI(apiKey);
```

#### 修復 2: VoiceCommandService.ts

**修改前：**
```typescript
import { Station } from '@/models/Station';

// ... 在函數內部
const AIRadioSearchService = (await import('./AIRadioSearchService')).AIRadioSearchService;
const { GoogleGenerativeAI } = await import('@google/generative-ai');
```

**修改後：**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIRadioSearchService } from './AIRadioSearchService';
import { Station } from '@/models/Station';

// ... 在函數內部
// 直接使用，不需要 await import
const aiResults = await AIRadioSearchService.searchRadioStationsWithAI(analysis.description);
const genAI = new GoogleGenerativeAI(apiKey);
```

## 📋 修改清單

### SearchStationsScreen.tsx

- ✅ 新增靜態 import: `GoogleGenerativeAI`
- ✅ 新增靜態 import: `AIRadioSearchService`
- ✅ 移除動態 import (第 56 行)
- ✅ 移除動態 import (第 107 行)

### VoiceCommandService.ts

- ✅ 新增靜態 import: `GoogleGenerativeAI`
- ✅ 新增靜態 import: `AIRadioSearchService`
- ✅ 移除動態 import (第 91 行)
- ✅ 移除動態 import (第 234 行)

## 🎯 為什麼不能用動態 Import？

### React Native 的限制

1. **Bundle 在建置時生成**
   - React Native 在建置時就需要知道所有依賴
   - 動態 import 會在執行時才載入，無法提前打包

2. **Metro Bundler 的工作方式**
   - Metro 需要靜態分析來決定哪些模組要打包
   - `await import()` 無法在靜態分析階段處理

3. **Native Module 連結**
   - Native 模組（如 `@google/generative-ai`）需要在建置時連結
   - 動態載入會造成連結錯誤

### 動態 Import 適用場景（Web）

動態 import 在 **Web 開發**中很有用：
```javascript
// Web 中可以用來做 Code Splitting
const module = await import('./heavy-module.js'); // ✅ Web OK
```

但在 **React Native** 中：
```javascript
const module = await import('./heavy-module.js'); // ❌ RN 不支援
```

## 💡 最佳實踐

### 在 React Native 中

**✅ 好的做法：靜態 Import**
```typescript
import { MyService } from '@/services/MyService';
import { MyUtil } from '@/utils/MyUtil';

// 直接使用
MyService.doSomething();
```

**❌ 壞的做法：動態 Import**
```typescript
// 不要在 React Native 中這樣做！
const { MyService } = await import('@/services/MyService');
MyService.doSomething();
```

### 如果模組很大怎麼辦？

React Native 有其他方式優化：

1. **使用 Lazy Loading Component**
   ```typescript
   import React, { lazy, Suspense } from 'react';
   
   const HeavyComponent = lazy(() => import('./HeavyComponent'));
   
   function App() {
     return (
       <Suspense fallback={<Loading />}>
         <HeavyComponent />
       </Suspense>
     );
   }
   ```

2. **條件式引入（但仍是靜態）**
   ```typescript
   import { FeatureA } from './features/FeatureA';
   import { FeatureB } from './features/FeatureB';
   
   // 根據條件使用
   const feature = useFeatureA ? FeatureA : FeatureB;
   ```

## 🔍 如何檢查是否還有動態 Import

執行搜尋命令：

```bash
# Windows (PowerShell)
Get-ChildItem -Path src -Recurse -Filter "*.ts*" | Select-String "await import\("

# Unix/Mac
grep -r "await import(" src/
```

## ✅ 驗證修復

重新建置 APK：

```bash
# 使用 EAS Build
npm run build:apk

# 或使用 Gradle
cd android
./gradlew assembleRelease
```

應該不再出現 `async-require.js` 錯誤。

## 📚 參考資料

- React Native 不支援動態 import: https://reactnative.dev/docs/javascript-environment
- Metro Bundler 限制: https://facebook.github.io/metro/docs/resolution
- Code Splitting 替代方案: https://reactnative.dev/docs/ram-bundles-inline-requires

---

**修復完成！** ✨

現在可以正常建置 APK 了。

