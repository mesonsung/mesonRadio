/**
 * AI 電台搜尋服務
 * AI Radio Search Service
 * 
 * 使用 AI (ChatGPT/Gemini/Grok) 直接從網路搜尋電台
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { SmartSearchService, AIProvider } from './SmartSearchService';
import { RadioBrowserService } from './RadioBrowserService';

export interface AIRadioResult {
  name: string;
  url: string;
  description: string;
  country: string;
  genre: string;
  language: string;
  bitrate?: string;
  favicon?: string;
}

export class AIRadioSearchService {
  /**
   * 使用 AI 搜尋網路電台
   * 流程：用戶輸入 → AI 理解 → AI 推薦電台名稱 → Radio Browser API 查找實際 URL
   */
  static async searchRadioStationsWithAI(userQuery: string): Promise<AIRadioResult[]> {
    try {
      console.log(`🔍 開始 AI 搜尋：${userQuery}`);
      
      // 1. 使用 AI 理解用戶需求並推薦電台名稱
      const aiRecommendations = await this.getAIRecommendations(userQuery);
      
      if (!aiRecommendations || aiRecommendations.length === 0) {
        console.log('⚠️ AI 沒有推薦結果，使用降級策略 1：智能關鍵詞');
        // 降級策略 1：提取關鍵詞直接搜尋
        const keywords = this.extractKeywords(userQuery);
        const fallbackResults: AIRadioResult[] = [];
        
        for (const keyword of keywords) {
          const stations = await this.searchRadioBrowser(keyword);
          fallbackResults.push(...stations);
          if (fallbackResults.length >= 5) break;
        }
        
        if (fallbackResults.length > 0) {
          return fallbackResults.slice(0, 10);
        }
        
        // 降級策略 2：使用原始查詢
        console.log('⚠️ 關鍵詞搜尋無結果，使用降級策略 2：原始查詢');
        return await this.searchRadioBrowser(userQuery);
      }
      
      console.log(`✅ AI 推薦了 ${aiRecommendations.length} 個電台`);
      
      // 2. 使用 AI 推薦的電台名稱，從 Radio Browser 查找實際電台
      const results: AIRadioResult[] = [];
      
      for (const recommendation of aiRecommendations) {
        try {
          console.log(`  🔎 搜尋推薦電台: ${recommendation.searchTerm}`);
          const stations = await RadioBrowserService.searchStations(recommendation.searchTerm);
          
          if (stations.length > 0) {
            console.log(`    ✅ 找到 ${stations.length} 個電台`);
            // 選擇播放量最高的電台（更可能可用）
            const bestStation = stations.sort((a, b) => {
              const votesA = parseInt(a.votes || '0');
              const votesB = parseInt(b.votes || '0');
              return votesB - votesA;
            })[0];
            
            results.push({
              name: bestStation.name,
              url: bestStation.url,
              description: recommendation.description,
              country: bestStation.country,
              genre: recommendation.genre || bestStation.tags,
              language: bestStation.language || 'unknown',
              bitrate: bestStation.bitrate || 'unknown',
              favicon: bestStation.favicon || '',
            });
          } else {
            console.log(`    ⚠️ 找不到電台: ${recommendation.searchTerm}`);
          }
        } catch (error) {
          console.error(`❌ 搜尋電台 ${recommendation.searchTerm} 失敗:`, error);
        }
      }
      
      // 3. 如果有結果，返回；否則使用降級策略
      if (results.length > 0) {
        console.log(`🎉 成功找到 ${results.length} 個電台`);
        return results;
      }
      
      console.log('⚠️ AI 推薦的電台都找不到，使用降級策略：原始查詢');
      return await this.searchRadioBrowser(userQuery);
      
    } catch (error) {
      console.error('❌ AI 電台搜尋失敗:', error);
      // 最終降級：直接搜尋
      console.log('⚠️ 使用最終降級策略：直接搜尋');
      return await this.searchRadioBrowser(userQuery);
    }
  }
  
  /**
   * 提取搜尋關鍵詞（降級策略）
   */
  private static extractKeywords(query: string): string[] {
    const keywords: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    // 常見關鍵詞映射
    const keywordMap: { [key: string]: string[] } = {
      '新聞': ['news', 'bbc', 'npr', 'cnn'],
      '音樂': ['music', 'fm', 'radio'],
      '古典': ['classical', 'classic fm'],
      '爵士': ['jazz', 'smooth jazz'],
      '搖滾': ['rock', 'classic rock'],
      '流行': ['pop', 'top 40'],
      '電子': ['electronic', 'dance'],
      '鄉村': ['country'],
      '談話': ['talk', 'talk radio'],
    };
    
    // 檢查是否包含已知關鍵詞
    for (const [chinese, english] of Object.entries(keywordMap)) {
      if (lowerQuery.includes(chinese)) {
        keywords.push(...english);
      }
    }
    
    // 如果沒有匹配，使用原始查詢
    if (keywords.length === 0) {
      keywords.push(query);
    }
    
    return keywords;
  }
  
  /**
   * 使用 AI 獲取電台推薦
   */
  private static async getAIRecommendations(userQuery: string): Promise<Array<{
    searchTerm: string;
    description: string;
    genre: string;
  }>> {
    const provider = SmartSearchService.getCurrentProvider();
    
    if (!provider || !SmartSearchService.hasAIEnabled()) {
      return [];
    }
    
    try {
      switch (provider) {
        case AIProvider.GEMINI:
          return await this.getRecommendationsFromGemini(userQuery);
        case AIProvider.CHATGPT:
          return await this.getRecommendationsFromChatGPT(userQuery);
        case AIProvider.GROK:
          return await this.getRecommendationsFromGrok(userQuery);
        default:
          return [];
      }
    } catch (error) {
      console.error(`${provider} AI 推薦失敗:`, error);
      return [];
    }
  }
  
  /**
   * 使用 Gemini 獲取推薦
   */
  private static async getRecommendationsFromGemini(userQuery: string): Promise<Array<{
    searchTerm: string;
    description: string;
    genre: string;
  }>> {
    const apiKey = SmartSearchService.getAPIKey(AIProvider.GEMINI);
    if (!apiKey) return [];
    
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      // 使用正確的模型名稱
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });
      
      const prompt = `
你是一個專業的網路電台推薦專家。用戶想要：「${userQuery}」

請推薦 3-5 個符合需求的「真實存在且流行的網路電台」。
優先推薦以下類型的知名電台：
- 新聞：BBC Radio, NPR, CNN Radio, Voice of America
- 音樂：KCRW, Radio Paradise, SomaFM, Jazz FM
- 古典音樂：Classical FM, WQXR, BBC Radio 3
- 流行音樂：Capital FM, Kiss FM, Heart Radio
- 搖滾：Classic Rock, Radio Rock

請以 JSON 格式回覆，格式如下：
[
  {
    "searchTerm": "電台英文名稱（簡短，例如 BBC 或 NPR）",
    "description": "電台中文描述",
    "genre": "類型"
  }
]

重要規則：
1. searchTerm 必須是簡短、常用的電台名稱（不超過 3 個字）
2. 優先使用縮寫（如 BBC 而不是 BBC Radio）
3. 確保是全球知名、容易搜尋到的電台
4. 只回傳 JSON 數組，不要其他文字
5. 如果不確定，推薦通用電台名稱如 "news", "classical", "jazz"
`;
      
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      console.log('Gemini AI 回應:', response);
      return this.parseAIResponse(response);
    } catch (error) {
      console.error('Gemini API 調用失敗:', error);
      return [];
    }
  }
  
  /**
   * 使用 ChatGPT 獲取推薦
   */
  private static async getRecommendationsFromChatGPT(userQuery: string): Promise<Array<{
    searchTerm: string;
    description: string;
    genre: string;
  }>> {
    const apiKey = SmartSearchService.getAPIKey(AIProvider.CHATGPT);
    if (!apiKey) return [];
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '你是一個專業的網路電台推薦專家。請推薦真實存在的網路電台，並以 JSON 格式回覆。',
          },
          {
            role: 'user',
            content: `
用戶想要：「${userQuery}」

請推薦 5-10 個符合需求的「真實存在的網路電台名稱」。

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
2. 優先推薦國際知名電台（如 BBC, NPR, KCRW 等）
3. 如果用戶指定國家/語言，優先推薦該國家/語言的電台
4. 只回傳 JSON 數組
`,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });
    
    if (!response.ok) {
      throw new Error(`ChatGPT API 錯誤: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content || '[]';
    
    return this.parseAIResponse(content);
  }
  
  /**
   * 使用 Grok 獲取推薦
   */
  private static async getRecommendationsFromGrok(userQuery: string): Promise<Array<{
    searchTerm: string;
    description: string;
    genre: string;
  }>> {
    const apiKey = SmartSearchService.getAPIKey(AIProvider.GROK);
    if (!apiKey) return [];
    
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          {
            role: 'system',
            content: '你是一個專業的網路電台推薦專家。請推薦真實存在的網路電台，並以 JSON 格式回覆。',
          },
          {
            role: 'user',
            content: `
用戶想要：「${userQuery}」

請推薦 5-10 個符合需求的「真實存在的網路電台名稱」。

請以 JSON 格式回覆：
[
  {
    "searchTerm": "實際電台名稱（英文，用於搜尋）",
    "description": "電台描述（中文）",
    "genre": "類型（新聞/音樂/談話等）"
  }
]

注意：searchTerm 應該是英文電台名稱，優先推薦國際知名電台。
`,
          },
        ],
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Grok API 錯誤: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content || '[]';
    
    return this.parseAIResponse(content);
  }
  
  /**
   * 解析 AI 回應
   */
  private static parseAIResponse(response: string): Array<{
    searchTerm: string;
    description: string;
    genre: string;
  }> {
    try {
      // 嘗試提取 JSON
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('無法從 AI 回應中提取 JSON');
        return [];
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (Array.isArray(parsed)) {
        return parsed.filter(item => 
          item.searchTerm && item.description && item.genre
        );
      }
      
      return [];
    } catch (error) {
      console.error('解析 AI 回應失敗:', error);
      return [];
    }
  }
  
  /**
   * 直接使用 Radio Browser 搜尋（降級方案）
   */
  private static async searchRadioBrowser(query: string): Promise<AIRadioResult[]> {
    try {
      const stations = await RadioBrowserService.searchStations(query);
      
      return stations.slice(0, 10).map(station => ({
        name: station.name,
        url: station.url,
        description: `來自 ${station.country} 的電台`,
        country: station.country,
        genre: station.tags || 'general',
        language: station.language || 'unknown',
        bitrate: station.bitrate || 'unknown',
        favicon: station.favicon || '',
      }));
    } catch (error) {
      console.error('Radio Browser 搜尋失敗:', error);
      return [];
    }
  }
}

