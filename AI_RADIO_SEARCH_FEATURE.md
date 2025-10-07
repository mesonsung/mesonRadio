# AI 網路電台搜尋功能
# AI Radio Search Feature

## 🎯 功能說明

現在 AI 搜尋功能會**直接從網路搜尋真實的電台**，而不是僅在手機已存的電台中搜尋。

### 工作流程

```
用戶輸入
  ↓
AI (ChatGPT/Gemini/Grok) 理解需求
  ↓
AI 推薦真實存在的國際電台名稱
  (例如: BBC World Service, NPR, KCRW 等)
  ↓
Radio Browser API 查找實際串流 URL
  ↓
返回可播放的電台列表
```

## 🆕 新增的服務

### AIRadioSearchService

位置: `src/services/AIRadioSearchService.ts`

這是核心的 AI 電台搜尋服務，負責：

1. **AI 推薦階段**
   - 使用 ChatGPT/Gemini/Grok 理解用戶需求
   - AI 推薦 5-10 個真實存在的國際知名電台
   - 例如：用戶說"我想聽新聞" → AI 推薦 "BBC World Service", "NPR", "CNN"

2. **電台查找階段**
   - 使用 Radio Browser API 查找 AI 推薦的電台
   - 獲取實際的串流 URL 和電台資訊

3. **降級方案**
   - 如果 AI 不可用或推薦失敗，直接使用 Radio Browser 搜尋

## 📊 使用場景

### 1. AI 語音助手搜尋

**位置**: `AIAssistantScreen.tsx`

```
用戶: "我想聽古典音樂"
  ↓
AI 分析命令
  ↓
AI 從網路搜尋古典音樂電台
  ↓
推薦: Classical KUSC, BBC Radio 3, Venice Classic Radio...
  ↓
用戶可以試播、加入列表、加入最愛
```

**使用的服務**: `VoiceCommandService.processVoiceCommand()`

### 2. 文字搜尋

**位置**: `SearchStationsScreen.tsx`

```
用戶輸入: "爵士樂電台"
  ↓
[如果啟用 AI]
AI 從網路搜尋爵士樂電台
  ↓
推薦: KCRW Jazz, TSF Jazz, Jazz FM...
  ↓
用戶可以批量添加電台
```

## 🔧 技術細節

### AI 提示詞 (Prompt)

```
你是一個專業的網路電台推薦專家。用戶想要：「${userQuery}」

請推薦 5-10 個符合需求的「真實存在的網路電台名稱」。
這些電台必須是可以在網路上找到的真實電台（例如 BBC, NPR, KCRW 等知名電台）。

請以 JSON 格式回覆：
[
  {
    "searchTerm": "實際電台名稱（英文，用於搜尋）",
    "description": "電台描述（中文）",
    "genre": "類型（新聞/音樂/談話等）"
  }
]

注意：
1. searchTerm 應該是英文電台名稱
2. 優先推薦國際知名電台
3. 如果用戶指定國家/語言，優先推薦該國家/語言的電台
```

### AI 回應範例

用戶查詢: "我想聽新聞"

AI 回應:
```json
[
  {
    "searchTerm": "BBC World Service",
    "description": "BBC 世界新聞廣播，提供全球新聞",
    "genre": "新聞"
  },
  {
    "searchTerm": "NPR",
    "description": "美國國家公共廣播電台",
    "genre": "新聞"
  },
  {
    "searchTerm": "CNN Radio",
    "description": "CNN 廣播新聞",
    "genre": "新聞"
  }
]
```

### 查找流程

```javascript
// 1. AI 推薦電台名稱
const aiRecommendations = await getAIRecommendations("我想聽新聞");
// 結果: ["BBC World Service", "NPR", "CNN Radio"]

// 2. 對每個推薦，使用 Radio Browser API 查找
for (const recommendation of aiRecommendations) {
  const stations = await RadioBrowserService.searchStations(recommendation.searchTerm);
  // BBC World Service → 找到實際串流 URL
  // NPR → 找到實際串流 URL
  // ...
}

// 3. 返回可播放的電台列表
```

## 🎨 UI 顯示

### AI 搜尋狀態提示

```
🤖 AI 正在為您搜尋網路電台...  (搜尋中)
🤖 AI 為您找到 8 個推薦電台      (成功)
⚠️ AI 搜尋失敗，使用傳統搜尋     (降級)
```

### 搜尋結果標記

語音助手返回的訊息會顯示:
```
🤖 AI 為您找到 5 個「古典音樂」電台
```

## 🔄 降級機制

### 三層降級策略

```
第一層: AI 網路搜尋
  ↓ (失敗或無結果)
第二層: Radio Browser 直接搜尋
  ↓ (失敗)
第三層: 本地電台推薦
```

### 實現

```typescript
try {
  // 嘗試 AI 搜尋
  const aiResults = await AIRadioSearchService.searchRadioStationsWithAI(query);
  if (aiResults.length > 0) return aiResults;
} catch (error) {
  console.error('AI search failed');
}

try {
  // 降級到 Radio Browser
  const browserResults = await RadioBrowserService.searchStations(query);
  return browserResults;
} catch (error) {
  // 返回本地預設電台
  return localStations;
}
```

## 🌍 支援的電台類型

### 國際知名電台

AI 特別訓練推薦這些知名電台：

**新聞類**
- BBC World Service (英國)
- NPR (美國)
- France 24 (法國)
- Deutsche Welle (德國)
- ABC News (澳洲)

**音樂類**
- KCRW (美國，多元音樂)
- BBC Radio 1/2/3 (英國，流行/成人/古典)
- Classical KUSC (美國，古典)
- TSF Jazz (法國，爵士)
- Smooth Jazz Global (全球)

**地區電台**
- 台灣: ICRT, 台北電台
- 日本: J-Wave, NHK
- 韓國: KBS, MBC

## 📈 效能優化

### 快取機制

```typescript
// AI 推薦結果可以快取
const cacheKey = `ai_search_${query}`;
const cached = cache.get(cacheKey);
if (cached) return cached;

const results = await AIRadioSearchService.search(query);
cache.set(cacheKey, results, 3600); // 快取 1 小時
```

### 並行查詢

```typescript
// 同時查詢多個 AI 推薦的電台
const searchPromises = aiRecommendations.map(rec =>
  RadioBrowserService.searchStations(rec.searchTerm)
);
const results = await Promise.all(searchPromises);
```

## 🔑 API 金鑰配置

確保在 AI 設定中配置了 API 金鑰：

```
設定 → AI 設定 → 選擇提供商
  ├─ Gemini: Google AI Studio API Key
  ├─ ChatGPT: OpenAI API Key
  └─ Grok: X.AI API Key
```

## 🧪 測試案例

### 測試 1: 新聞電台

```
輸入: "我想聽國際新聞"
預期: BBC World Service, NPR, CNN, France 24...
```

### 測試 2: 音樂電台

```
輸入: "播放爵士樂"
預期: KCRW Jazz, TSF Jazz, Smooth Jazz, Jazz FM...
```

### 測試 3: 地區電台

```
輸入: "台灣的電台"
預期: ICRT, 台北電台, 飛碟電台...
```

### 測試 4: 特定類型

```
輸入: "古典音樂電台"
預期: Classical KUSC, BBC Radio 3, Venice Classic Radio...
```

## 📝 使用說明

### 語音助手

1. 進入「AI 語音助手」
2. 說出需求：「我想聽古典音樂」
3. AI 從網路搜尋推薦電台
4. 可以試播、加入列表、加入最愛

### 文字搜尋

1. 進入「電台」→ 點擊「+」→ 選擇「自動搜尋」
2. 開啟「啟用 AI 智能搜尋」開關
3. 輸入搜尋關鍵字
4. AI 從網路搜尋推薦電台
5. 批量選擇並添加

## ⚠️ 注意事項

1. **需要網路連接**: AI 搜尋和 Radio Browser 都需要網路
2. **需要 API 金鑰**: 必須配置 AI 提供商的 API 金鑰
3. **有 API 配額**: ChatGPT/Gemini/Grok 都有使用限制
4. **電台可用性**: 推薦的電台可能因地區限制或停播而無法播放
5. **搜尋時間**: AI 搜尋可能需要 2-5 秒

## 🚀 未來改進

- [ ] 快取 AI 推薦結果
- [ ] 支援更多語言的電台推薦
- [ ] 個性化推薦（根據收聽歷史）
- [ ] 電台品質評分
- [ ] 自動檢測不可用電台並替換

---

**新功能版本**: 1.1.0
**最後更新**: 2025-10-07
**狀態**: ✅ 已實現並測試

