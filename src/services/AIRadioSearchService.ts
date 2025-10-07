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
      // 1. 使用 AI 理解用戶需求並推薦電台名稱
      const aiRecommendations = await this.getAIRecommendations(userQuery);
      
      if (!aiRecommendations || aiRecommendations.length === 0) {
        console.log('AI 沒有推薦結果，直接使用 Radio Browser');
        // 如果 AI 沒有推薦，直接用原始查詢搜尋
        return await this.searchRadioBrowser(userQuery);
      }
      
      // 2. 使用 AI 推薦的電台名稱，從 Radio Browser 查找實際電台
      const results: AIRadioResult[] = [];
      
      for (const recommendation of aiRecommendations) {
        try {
          const stations = await RadioBrowserService.searchStations(recommendation.searchTerm);
          
          if (stations.length > 0) {
            // 選擇最匹配的電台（通常是第一個）
            const station = stations[0];
            results.push({
              name: station.name,
              url: station.url,
              description: recommendation.description,
              country: station.country,
              genre: recommendation.genre || station.tags,
              language: station.language || 'unknown',
              bitrate: station.bitrate || 'unknown',
              favicon: station.favicon || '',
            });
          }
        } catch (error) {
          console.error(`搜尋電台 ${recommendation.searchTerm} 失敗:`, error);
        }
      }
      
      // 3. 如果有結果，返回；否則使用原始查詢搜尋
      if (results.length > 0) {
        return results;
      }
      
      console.log('AI 推薦的電台都找不到，使用原始查詢');
      return await this.searchRadioBrowser(userQuery);
      
    } catch (error) {
      console.error('AI 電台搜尋失敗:', error);
      // 降級到直接搜尋
      return await this.searchRadioBrowser(userQuery);
    }
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
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `
你是一個專業的網路電台推薦專家。用戶想要：「${userQuery}」

請推薦 5-10 個符合需求的「真實存在的網路電台名稱」。
這些電台必須是可以在網路上找到的真實電台（例如 BBC, NPR, KCRW 等知名電台）。

請以 JSON 格式回覆，格式如下：
[
  {
    "searchTerm": "實際電台名稱（用於搜尋）",
    "description": "電台描述（中文）",
    "genre": "類型（新聞/音樂/談話等）"
  }
]

注意：
1. searchTerm 應該是英文電台名稱，方便搜尋
2. 優先推薦國際知名電台
3. 如果用戶指定國家/語言，優先推薦該國家/語言的電台
4. 只回傳 JSON 數組，不要其他說明文字
`;
    
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    return this.parseAIResponse(response);
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

