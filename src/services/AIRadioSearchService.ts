/**
 * AI 電台搜尋服務
 * AI Radio Search Service
 * 
 * 使用 AI (ChatGPT/Gemini/Grok) 直接從網路搜尋電台
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
<<<<<<< HEAD
=======
   * 獲取 Gemini 可用模型列表
   */
  private static async getGeminiModels(apiKey: string): Promise<string[]> {
    // 嘗試從快取載入
    try {
      const cached = await AsyncStorage.getItem('@mesonRadio:geminiModels');
      if (cached) {
        const models = JSON.parse(cached);
        const cacheTime = await AsyncStorage.getItem('@mesonRadio:geminiModelsTime');
        if (cacheTime) {
          const age = Date.now() - parseInt(cacheTime, 10);
          // 快取有效期 24 小時
          if (age < 24 * 60 * 60 * 1000 && models.length > 0) {
            console.log(`✅ 使用快取的 Gemini 模型列表（${models.length} 個模型）`);
            return models;
          }
        }
      }
    } catch (error) {
      console.log('⚠️ 讀取 Gemini 模型快取失敗:', error);
    }

    // 嘗試從 API 獲取可用模型
    try {
      console.log('🔍 嘗試從 API 獲取 Gemini 可用模型列表...');
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        let models: string[] = [];
        
        if (Array.isArray(data.models)) {
          // 過濾並排序 Gemini 模型（優先使用最新版本）
          models = data.models
            .map((model: any) => model.name?.replace('models/', '') || model.name)
            .filter((name: string) => name && (name.startsWith('gemini') || name.startsWith('models/gemini')))
            .map((name: string) => name.replace('models/', ''))
            .sort((a: string, b: string) => {
              // 優先順序：gemini-3 > gemini-2.5 > gemini-2 > gemini-1.5 > gemini-pro
              const getVersion = (name: string): number => {
                if (name.includes('gemini-3')) return 5;
                if (name.includes('gemini-2.5')) return 4;
                if (name.includes('gemini-2')) return 3;
                if (name.includes('gemini-1.5')) return 2;
                if (name.includes('gemini-pro')) return 1;
                return 0;
              };
              const versionDiff = getVersion(b) - getVersion(a);
              if (versionDiff !== 0) return versionDiff;
              // 同版本內，pro > flash > 其他
              if (a.includes('pro') && !b.includes('pro')) return -1;
              if (!a.includes('pro') && b.includes('pro')) return 1;
              if (a.includes('flash') && !b.includes('flash')) return -1;
              if (!a.includes('flash') && b.includes('flash')) return 1;
              return b.localeCompare(a);
            });
        }

        if (models.length > 0) {
          await AsyncStorage.setItem('@mesonRadio:geminiModels', JSON.stringify(models));
          await AsyncStorage.setItem('@mesonRadio:geminiModelsTime', Date.now().toString());
          console.log(`✅ 成功獲取 ${models.length} 個 Gemini 模型: ${models.join(', ')}`);
          return models;
        }
      } else {
        console.log(`⚠️ 無法從 API 獲取 Gemini 模型列表 (${response.status})，使用預設模型`);
      }
    } catch (error) {
      console.log('⚠️ 獲取 Gemini 模型列表失敗，使用預設模型:', error);
    }

    // 如果 API 獲取失敗，使用預設模型列表（最新優先）
    const defaultModels = [
      'gemini-3-pro',          // 最新 Gemini 3 系列（2025年）
      'gemini-3-flash',        // Gemini 3 快速版
      'gemini-2.5-flash',      // Gemini 2.5 快速模型（2024年底）
      'gemini-2.5-pro',        // Gemini 2.5 高級模型
      'gemini-1.5-flash',      // 穩定快速模型
      'gemini-1.5-pro',        // 穩定高級模型
      'gemini-pro',            // 舊版備用
    ];
    return defaultModels;
  }

  /**
>>>>>>> 99cfb686d0b7f75dd5fab96cab46ed6cc5e9013e
   * 使用 Gemini 獲取推薦
   */
  private static async getRecommendationsFromGemini(userQuery: string): Promise<Array<{
    searchTerm: string;
    description: string;
    genre: string;
  }>> {
    const apiKey = SmartSearchService.getAPIKey(AIProvider.GEMINI);
    if (!apiKey) return [];
    
<<<<<<< HEAD
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
=======
    // 獲取可用模型列表
    const allModels = await this.getGeminiModels(apiKey);
    
    // 如果用戶選擇了自定義模型，優先使用
    const customModel = SmartSearchService.getCustomModel(AIProvider.GEMINI);
    const models = customModel && allModels.includes(customModel)
      ? [customModel, ...allModels.filter(m => m !== customModel)]
      : allModels;
    
    let lastError: Error | null = null;
    
    for (const modelName of models) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        });
>>>>>>> 99cfb686d0b7f75dd5fab96cab46ed6cc5e9013e
      
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
      
<<<<<<< HEAD
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
=======
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        
        console.log(`✅ Gemini API 成功（使用模型: ${modelName}）`);
        return this.parseAIResponse(response);
      } catch (error) {
        // 如果是最後一個模型，返回空數組
        if (modelName === models[models.length - 1]) {
          console.error('Gemini API 調用失敗:', error);
          return [];
        }
        // 否則記錄錯誤並嘗試下一個模型
        lastError = error instanceof Error ? error : new Error(String(error));
        console.log(`⚠️ 模型 ${modelName} 失敗，嘗試下一個模型...`);
      }
    }
    
    // 如果所有模型都失敗，返回空數組
    console.error('所有 Gemini 模型都無法使用');
    return [];
  }
  
  /**
   * 獲取 ChatGPT 可用模型列表
   */
  private static async getChatGPTModels(apiKey: string): Promise<string[]> {
    // 嘗試從快取載入
    try {
      const cached = await AsyncStorage.getItem('@mesonRadio:chatgptModels');
      if (cached) {
        const models = JSON.parse(cached);
        const cacheTime = await AsyncStorage.getItem('@mesonRadio:chatgptModelsTime');
        if (cacheTime) {
          const age = Date.now() - parseInt(cacheTime, 10);
          // 快取有效期 24 小時
          if (age < 24 * 60 * 60 * 1000 && models.length > 0) {
            console.log(`✅ 使用快取的 ChatGPT 模型列表（${models.length} 個模型）`);
            return models;
          }
        }
      }
    } catch (error) {
      console.log('⚠️ 讀取 ChatGPT 模型快取失敗:', error);
    }

    // 嘗試從 API 獲取可用模型
    try {
      console.log('🔍 嘗試從 API 獲取 ChatGPT 可用模型列表...');
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        let models: string[] = [];
        
        if (Array.isArray(data.data)) {
          // 過濾並排序 ChatGPT 模型（優先使用最新版本）
          models = data.data
            .map((model: any) => model.id)
            .filter((id: string) => id && (id.startsWith('gpt-5') || id.startsWith('gpt-4') || id.startsWith('gpt-3.5') || id.startsWith('o')))
            .sort((a: string, b: string) => {
              // 優先順序：gpt-5 > o系列 > gpt-4o > gpt-4 > gpt-3.5
              const getPriority = (name: string): number => {
                if (name.startsWith('gpt-5')) return 6;
                if (name.startsWith('o')) return 5; // o3, o4-mini 等推理模型
                if (name.startsWith('gpt-4o')) return 4;
                if (name.startsWith('gpt-4')) return 3;
                if (name.startsWith('gpt-3.5')) return 2;
                return 1;
              };
              const priorityDiff = getPriority(b) - getPriority(a);
              if (priorityDiff !== 0) return priorityDiff;
              // 同優先級內，按字母順序倒序（較新的在前）
              return b.localeCompare(a);
            });
        }

        if (models.length > 0) {
          await AsyncStorage.setItem('@mesonRadio:chatgptModels', JSON.stringify(models));
          await AsyncStorage.setItem('@mesonRadio:chatgptModelsTime', Date.now().toString());
          console.log(`✅ 成功獲取 ${models.length} 個 ChatGPT 模型: ${models.slice(0, 5).join(', ')}...`);
          return models;
        }
      } else {
        console.log(`⚠️ 無法從 API 獲取 ChatGPT 模型列表 (${response.status})，使用預設模型`);
      }
    } catch (error) {
      console.log('⚠️ 獲取 ChatGPT 模型列表失敗，使用預設模型:', error);
    }

    // 如果 API 獲取失敗，使用預設模型列表（最新優先）
    const defaultModels = [
      'gpt-5',                // 最新 GPT-5 系列（2025年）
      'gpt-5-mini',           // GPT-5 輕量版
      'gpt-4o',               // GPT-4o 系列（2024年中）
      'gpt-4o-mini',          // GPT-4o 輕量版本
      'gpt-4-turbo',          // GPT-4 Turbo
      'gpt-4',                // GPT-4 標準版
      'gpt-3.5-turbo',        // 舊版備用
    ];
    return defaultModels;
  }

  /**
>>>>>>> 99cfb686d0b7f75dd5fab96cab46ed6cc5e9013e
   * 使用 ChatGPT 獲取推薦
   */
  private static async getRecommendationsFromChatGPT(userQuery: string): Promise<Array<{
    searchTerm: string;
    description: string;
    genre: string;
  }>> {
    const apiKey = SmartSearchService.getAPIKey(AIProvider.CHATGPT);
    if (!apiKey) return [];
    
<<<<<<< HEAD
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
=======
    // 獲取可用模型列表
    const allModels = await this.getChatGPTModels(apiKey);
    
    // 如果用戶選擇了自定義模型，優先使用
    const customModel = SmartSearchService.getCustomModel(AIProvider.CHATGPT);
    const models = customModel && allModels.includes(customModel)
      ? [customModel, ...allModels.filter(m => m !== customModel)]
      : allModels;
    
    let lastError: Error | null = null;
    
    for (const modelName of models) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              {
                role: 'system',
                content: '你是一個專業的網路電台推薦專家。請推薦真實存在的網路電台，並以 JSON 格式回覆。',
              },
              {
                role: 'user',
                content: `
用戶想要：「${userQuery}」

請推薦 3-5 個符合需求的「真實存在的網路電台名稱」。
>>>>>>> 99cfb686d0b7f75dd5fab96cab46ed6cc5e9013e

請以 JSON 格式回覆：
[
  {
    "searchTerm": "實際電台名稱（英文，用於搜尋）",
    "description": "電台描述（中文）",
    "genre": "類型（新聞/音樂/談話等）"
  }
]

注意：
<<<<<<< HEAD
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
=======
1. searchTerm 應該是簡短、常用的英文電台名稱（如 BBC, NPR, KCRW）
2. 優先推薦國際知名電台
3. 只回傳 JSON 數組，不要其他文字
`,
              },
            ],
            temperature: 0.7,
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `ChatGPT API 錯誤 (模型: ${modelName}): ${response.status}`;
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error?.message) {
              errorMessage = `ChatGPT API 錯誤 (模型: ${modelName}): ${errorData.error.message}`;
            }
          } catch {
            errorMessage = `ChatGPT API 錯誤 (模型: ${modelName}): ${response.status} - ${errorText.substring(0, 100)}`;
          }
          
          // 如果是模型不存在的錯誤（404 或 400），嘗試下一個模型
          if (response.status === 404 || (response.status === 400 && errorText.includes('model'))) {
            console.log(`⚠️ 模型 ${modelName} 不可用，嘗試下一個模型...`);
            lastError = new Error(errorMessage);
            continue;
          }
          
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        const content = data.choices[0]?.message?.content || '[]';
        
        console.log(`✅ ChatGPT API 成功（使用模型: ${modelName}）`);
        return this.parseAIResponse(content);
      } catch (error) {
        // 如果是最後一個模型，返回空數組
        if (modelName === models[models.length - 1]) {
          console.error('ChatGPT API 調用失敗:', error);
          return [];
        }
        // 否則記錄錯誤並嘗試下一個模型
        lastError = error instanceof Error ? error : new Error(String(error));
        console.log(`⚠️ 模型 ${modelName} 失敗，嘗試下一個模型...`);
      }
    }
    
    // 如果所有模型都失敗，返回空數組
    console.error('所有 ChatGPT 模型都無法使用');
    return [];
  }
  
  /**
   * 獲取 Grok 可用模型列表
   */
  private static async getGrokModels(apiKey: string): Promise<string[]> {
    // 嘗試從快取載入
    try {
      const cached = await AsyncStorage.getItem('@mesonRadio:grokModels');
      if (cached) {
        const models = JSON.parse(cached);
        const cacheTime = await AsyncStorage.getItem('@mesonRadio:grokModelsTime');
        if (cacheTime) {
          const age = Date.now() - parseInt(cacheTime, 10);
          // 快取有效期 24 小時
          if (age < 24 * 60 * 60 * 1000 && models.length > 0) {
            console.log(`✅ 使用快取的 Grok 模型列表（${models.length} 個模型）`);
            return models;
          }
        }
      }
    } catch (error) {
      console.log('⚠️ 讀取 Grok 模型快取失敗:', error);
    }

    // 嘗試從 API 獲取可用模型
    try {
      console.log('🔍 嘗試從 API 獲取 Grok 可用模型列表...');
      const response = await fetch('https://api.x.ai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // 解析模型列表（格式可能類似 OpenAI）
        let models: string[] = [];
        
        if (Array.isArray(data.data)) {
          // OpenAI 格式：{ data: [{ id: 'grok-4', ... }, ...] }
          models = data.data
            .map((model: any) => model.id || model.name)
            .filter((id: string) => id && id.startsWith('grok'))
            .sort((a: string, b: string) => {
              // 優先順序：grok-4 > grok-3 > grok-2 > grok-beta
              const getVersion = (name: string): number => {
                if (name.includes('grok-4')) return 4;
                if (name.includes('grok-3')) return 3;
                if (name.includes('grok-2')) return 2;
                if (name.includes('grok-beta')) return 1;
                return 0;
              };
              const versionDiff = getVersion(b) - getVersion(a);
              if (versionDiff !== 0) return versionDiff;
              // 同版本內，按字母順序倒序（較新的在前）
              return b.localeCompare(a);
            });
        } else if (Array.isArray(data.models)) {
          // 其他可能的格式：{ models: ['grok-4', ...] }
          models = data.models
            .filter((id: string) => id && id.startsWith('grok'))
            .sort((a: string, b: string) => {
              const getVersion = (name: string): number => {
                if (name.includes('grok-4')) return 4;
                if (name.includes('grok-3')) return 3;
                if (name.includes('grok-2')) return 2;
                if (name.includes('grok-beta')) return 1;
                return 0;
              };
              return getVersion(b) - getVersion(a);
            });
        } else if (Array.isArray(data)) {
          // 直接是數組格式
          models = data
            .map((model: any) => model.id || model.name || model)
            .filter((id: string) => id && id.startsWith('grok'))
            .sort((a: string, b: string) => {
              const getVersion = (name: string): number => {
                if (name.includes('grok-4')) return 4;
                if (name.includes('grok-3')) return 3;
                if (name.includes('grok-2')) return 2;
                if (name.includes('grok-beta')) return 1;
                return 0;
              };
              return getVersion(b) - getVersion(a);
            });
        }

        if (models.length > 0) {
          // 保存到快取
          await AsyncStorage.setItem('@mesonRadio:grokModels', JSON.stringify(models));
          await AsyncStorage.setItem('@mesonRadio:grokModelsTime', Date.now().toString());
          console.log(`✅ 成功獲取 ${models.length} 個 Grok 模型: ${models.join(', ')}`);
          return models;
        }
      } else {
        console.log(`⚠️ 無法從 API 獲取模型列表 (${response.status})，使用預設模型`);
      }
    } catch (error) {
      console.log('⚠️ 獲取 Grok 模型列表失敗，使用預設模型:', error);
    }

    // 如果 API 獲取失敗，使用預設模型列表（最新優先）
    const defaultModels = [
      'grok-4',               // 最新 Grok 4 系列（2025年）
      'grok-4-fast',          // Grok 4 快速版
      'grok-3',               // Grok 3 系列
      'grok-3-mini',          // Grok 3 輕量版
      'grok-2-1212',          // Grok 2 最新版本（2024年12月）
      'grok-2-latest',        // Grok 2 最新版
      'grok-2',               // Grok 2 標準版
      'grok-beta',            // 舊版備用
    ];
    return defaultModels;
  }

  /**
>>>>>>> 99cfb686d0b7f75dd5fab96cab46ed6cc5e9013e
   * 使用 Grok 獲取推薦
   */
  private static async getRecommendationsFromGrok(userQuery: string): Promise<Array<{
    searchTerm: string;
    description: string;
    genre: string;
  }>> {
    const apiKey = SmartSearchService.getAPIKey(AIProvider.GROK);
<<<<<<< HEAD
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
=======
    if (!apiKey) {
      console.error('❌ Grok API Key 未配置');
      return [];
    }
    
    // 獲取可用模型列表（會自動使用快取或從 API 獲取）
    const allModels = await this.getGrokModels(apiKey);
    
    // 如果用戶選擇了自定義模型，優先使用
    const customModel = SmartSearchService.getCustomModel(AIProvider.GROK);
    const models = customModel && allModels.includes(customModel)
      ? [customModel, ...allModels.filter(m => m !== customModel)]
      : allModels;
    
    let lastError: Error | null = null;
    
    for (const model of models) {
      try {
        console.log(`🔍 使用 Grok API 搜尋電台（模型: ${model}）...`);
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'system',
                content: '你是一個專業的網路電台推薦專家。請推薦真實存在的網路電台，並以 JSON 格式回覆。',
              },
              {
                role: 'user',
                content: `
用戶想要：「${userQuery}」

請推薦 3-5 個符合需求的「真實存在的網路電台名稱」。
>>>>>>> 99cfb686d0b7f75dd5fab96cab46ed6cc5e9013e

請以 JSON 格式回覆：
[
  {
    "searchTerm": "實際電台名稱（英文，用於搜尋）",
    "description": "電台描述（中文）",
    "genre": "類型（新聞/音樂/談話等）"
  }
]

<<<<<<< HEAD
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
=======
注意：
1. searchTerm 應該是簡短、常用的英文電台名稱（如 BBC, NPR, KCRW）
2. 優先推薦國際知名電台
3. 只回傳 JSON 數組，不要其他文字
`,
              },
            ],
            temperature: 0.7,
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `Grok API 錯誤 (模型: ${model}): ${response.status}`;
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error?.message) {
              errorMessage = `Grok API 錯誤 (模型: ${model}): ${errorData.error.message}`;
            }
          } catch {
            errorMessage = `Grok API 錯誤 (模型: ${model}): ${response.status} - ${errorText.substring(0, 100)}`;
          }
          
          // 如果是模型不存在的錯誤（404 或 400），嘗試下一個模型
          if (response.status === 404 || (response.status === 400 && errorText.includes('model'))) {
            console.log(`⚠️ 模型 ${model} 不可用，嘗試下一個模型...`);
            lastError = new Error(errorMessage);
            continue;
          }
          
          console.error(`❌ ${errorMessage}`);
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          console.error('❌ Grok API 回應格式錯誤：缺少 choices 或 message');
          throw new Error('Grok API 回應格式錯誤');
        }
        
        const content = data.choices[0].message.content;
        if (!content) {
          console.error('❌ Grok API 回應為空');
          throw new Error('Grok API 回應為空');
        }
        
        console.log(`✅ Grok API 回應成功（使用模型: ${model}）`);
        return this.parseAIResponse(content);
      } catch (error) {
        // 如果是最後一個模型，拋出錯誤
        if (model === models[models.length - 1]) {
          console.error('❌ 所有 Grok 模型都失敗:', error);
          if (error instanceof Error) {
            throw error;
          }
          throw new Error(`Grok API 未知錯誤: ${error}`);
        }
        // 否則記錄錯誤並嘗試下一個模型
        lastError = error instanceof Error ? error : new Error(String(error));
        console.log(`⚠️ 模型 ${model} 失敗，嘗試下一個模型...`);
      }
    }
    
    // 如果所有模型都失敗，拋出最後一個錯誤
    throw lastError || new Error('所有 Grok 模型都無法使用');
>>>>>>> 99cfb686d0b7f75dd5fab96cab46ed6cc5e9013e
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

