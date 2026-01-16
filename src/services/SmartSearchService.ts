/**
 * 智能電台搜尋服務
 * Smart Station Search Service
 * 
 * 功能：
 * 1. 本地智能搜尋（關鍵字、分類、模糊匹配）
 * 2. AI 增強搜尋（Gemini、ChatGPT、Grok）
 * 3. 自動回退機制
 */

import { Station } from '@/models/Station';
import { GoogleGenerativeAI } from '@google/generative-ai';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '@/constants/config';

// AI 提供商類型
export enum AIProvider {
  GEMINI = 'gemini',
  CHATGPT = 'chatgpt',
  GROK = 'grok',
}

// AI 配置
interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

// 電台分類
export enum StationCategory {
  NEWS = 'news',           // 新聞
  MUSIC = 'music',         // 音樂
  CLASSICAL = 'classical', // 古典
  POP = 'pop',            // 流行
  TRAFFIC = 'traffic',     // 交通
  TALK = 'talk',          // 談話
  LOCAL = 'local',        // 地方
  INTERNATIONAL = 'international', // 國際
}

// 分類關鍵字映射
const CATEGORY_KEYWORDS: Record<StationCategory, string[]> = {
  [StationCategory.NEWS]: ['新聞', '資訊', 'news', '中廣新聞', 'news98', '國聲'],
  [StationCategory.MUSIC]: ['音樂', 'music', 'FM', '電台', 'radio'],
  [StationCategory.CLASSICAL]: ['古典', 'classic', '輕音樂', '奇美'],
  [StationCategory.POP]: ['流行', 'pop', 'hit', 'kiss', '非凡'],
  [StationCategory.TRAFFIC]: ['交通', 'traffic', '警廣', '治安'],
  [StationCategory.TALK]: ['談話', 'talk', '廣播'],
  [StationCategory.LOCAL]: ['地方', 'local', '城市', '每日'],
  [StationCategory.INTERNATIONAL]: ['國際', 'international', 'ICRT', 'RTI'],
};

// 搜尋結果
export interface SearchResult {
  station: Station;
  score: number;        // 匹配分數 0-100
  matchType: 'exact' | 'fuzzy' | 'category' | 'ai'; // 匹配類型
  reason?: string;      // AI 推薦原因
}

export class SmartSearchService {
  private static aiConfigs: Map<AIProvider, string> = new Map();
  private static currentProvider: AIProvider = AIProvider.GEMINI;
  private static grokModelsCache: string[] | null = null; // 快取 Grok 可用模型列表
  private static geminiModelsCache: string[] | null = null; // 快取 Gemini 可用模型列表
  private static chatgptModelsCache: string[] | null = null; // 快取 ChatGPT 可用模型列表
  private static customModels: Map<AIProvider, string> = new Map(); // 用戶自定義選擇的模型

  /**
   * 初始化服務
   */
  static async initialize(): Promise<void> {
    try {
      // 載入所有 AI 提供商的 API Keys
      const geminiKey = await AsyncStorage.getItem('@mesonRadio:geminiApiKey');
      const chatgptKey = await AsyncStorage.getItem('@mesonRadio:chatgptApiKey');
      let grokKey = await AsyncStorage.getItem('@mesonRadio:grokApiKey');
      const provider = await AsyncStorage.getItem('@mesonRadio:aiProvider');

      // 如果沒有用戶設置的 Grok API Key，嘗試使用環境變數或預設值
      // 注意：預設 API Key 應通過環境變數提供，不應硬編碼在代碼中
      if (!grokKey && Config.AI_API_KEYS.GROK && Config.AI_API_KEYS.GROK.trim()) {
        grokKey = Config.AI_API_KEYS.GROK;
        // 只有在有有效 API Key 時才保存
        await AsyncStorage.setItem('@mesonRadio:grokApiKey', grokKey);
        console.log('✅ 已使用預設的 xAI API Key（從環境變數）');
      }

      if (geminiKey) this.aiConfigs.set(AIProvider.GEMINI, geminiKey);
      if (chatgptKey) this.aiConfigs.set(AIProvider.CHATGPT, chatgptKey);
      if (grokKey) this.aiConfigs.set(AIProvider.GROK, grokKey);
      if (provider) this.currentProvider = provider as AIProvider;

      // 載入用戶自定義選擇的模型
      const geminiModel = await AsyncStorage.getItem('@mesonRadio:geminiModel');
      const chatgptModel = await AsyncStorage.getItem('@mesonRadio:chatgptModel');
      const grokModel = await AsyncStorage.getItem('@mesonRadio:grokModel');

      if (geminiModel) this.customModels.set(AIProvider.GEMINI, geminiModel);
      if (chatgptModel) this.customModels.set(AIProvider.CHATGPT, chatgptModel);
      if (grokModel) this.customModels.set(AIProvider.GROK, grokModel);
    } catch (error) {
      console.error('Error loading AI configs:', error);
    }
  }

  /**
   * 設置 AI 提供商
   */
  static async setAIProvider(provider: AIProvider): Promise<void> {
    try {
      await AsyncStorage.setItem('@mesonRadio:aiProvider', provider);
      this.currentProvider = provider;
    } catch (error) {
      console.error('Error saving AI provider:', error);
      throw error;
    }
  }

  /**
   * 獲取當前 AI 提供商
   */
  static getCurrentProvider(): AIProvider {
    return this.currentProvider;
  }

  /**
   * 設置 API Key
   */
  static async setAPIKey(provider: AIProvider, apiKey: string): Promise<void> {
    try {
      const storageKey = `@mesonRadio:${provider}ApiKey`;
      await AsyncStorage.setItem(storageKey, apiKey);
      this.aiConfigs.set(provider, apiKey);
    } catch (error) {
      console.error(`Error saving ${provider} API key:`, error);
      throw error;
    }
  }

  /**
   * 獲取 API Key
   */
  static getAPIKey(provider: AIProvider): string | undefined {
    return this.aiConfigs.get(provider);
  }

  /**
   * 檢查是否有可用的 AI
   */
  static hasAIEnabled(): boolean {
    return this.aiConfigs.size > 0;
  }

  /**
   * 檢查特定提供商是否已配置
   */
  static hasProvider(provider: AIProvider): boolean {
    return this.aiConfigs.has(provider);
  }

  /**
   * 清除 API Key
   */
  static async clearAPIKey(provider: AIProvider): Promise<void> {
    try {
      const storageKey = `@mesonRadio:${provider}ApiKey`;
      await AsyncStorage.removeItem(storageKey);
      this.aiConfigs.delete(provider);
    } catch (error) {
      console.error(`Error clearing ${provider} API key:`, error);
      throw error;
    }
  }

  /**
   * 獲取所有已配置的提供商
   */
  static getConfiguredProviders(): AIProvider[] {
    return Array.from(this.aiConfigs.keys());
  }

  /**
   * 智能搜尋（主入口）
   */
  static async search(
    query: string,
    stations: Station[],
    useAI: boolean = true
  ): Promise<SearchResult[]> {
    if (!query.trim()) {
      return [];
    }

    // 1. 本地搜尋
    const localResults = this.localSearch(query, stations);

    // 2. 如果本地搜尋結果足夠好，直接返回
    if (localResults.length >= 3 && localResults[0].score >= 80) {
      return localResults;
    }

    // 3. 如果啟用 AI 且有配置，使用 AI 增強
    if (useAI && this.hasAIEnabled() && localResults.length < 3) {
      try {
        const aiResults = await this.aiEnhancedSearch(query, stations);
        // 合併結果，AI 結果優先
        return this.mergeResults(aiResults, localResults);
      } catch (error) {
        console.error('AI search failed, fallback to local:', error);
        return localResults;
      }
    }

    return localResults;
  }

  /**
   * 本地搜尋
   */
  static localSearch(query: string, stations: Station[]): SearchResult[] {
    const normalizedQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    for (const station of stations) {
      const stationName = station.name.toLowerCase();
      let score = 0;
      let matchType: SearchResult['matchType'] = 'fuzzy';

      // 1. 完全匹配（最高分）
      if (stationName === normalizedQuery) {
        score = 100;
        matchType = 'exact';
      }
      // 2. 開頭匹配
      else if (stationName.startsWith(normalizedQuery)) {
        score = 90;
        matchType = 'exact';
      }
      // 3. 包含匹配
      else if (stationName.includes(normalizedQuery)) {
        score = 80;
        matchType = 'fuzzy';
      }
      // 4. 分類匹配
      else {
        const categoryScore = this.matchCategory(normalizedQuery, station);
        if (categoryScore > 0) {
          score = categoryScore;
          matchType = 'category';
        }
      }

      // 5. 模糊匹配（單字）
      if (score === 0) {
        const words = normalizedQuery.split(/\s+/);
        let matchedWords = 0;
        for (const word of words) {
          if (word.length > 0 && stationName.includes(word)) {
            matchedWords++;
          }
        }
        if (matchedWords > 0) {
          score = Math.min(70, (matchedWords / words.length) * 70);
          matchType = 'fuzzy';
        }
      }

      if (score > 0) {
        results.push({
          station,
          score,
          matchType,
        });
      }
    }

    // 按分數排序
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * 分類匹配
   */
  private static matchCategory(query: string, station: Station): number {
    const stationName = station.name.toLowerCase();
    
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      // 檢查查詢是否匹配分類關鍵字
      const queryMatchesCategory = keywords.some(kw => 
        query.toLowerCase().includes(kw.toLowerCase())
      );

      if (queryMatchesCategory) {
        // 檢查電台名稱是否屬於該分類
        const stationMatchesCategory = keywords.some(kw =>
          stationName.includes(kw.toLowerCase())
        );

        if (stationMatchesCategory) {
          return 70; // 分類匹配分數
        }
      }
    }

    return 0;
  }

  /**
   * AI 增強搜尋（支援多個提供商）
   */
  private static async aiEnhancedSearch(
    query: string,
    stations: Station[]
  ): Promise<SearchResult[]> {
    const provider = this.currentProvider;
    const apiKey = this.getAPIKey(provider);

    if (!apiKey) {
      throw new Error(`${provider} API key not configured`);
    }

    try {
      switch (provider) {
        case AIProvider.GEMINI:
          return await this.searchWithGemini(query, stations, apiKey);
        case AIProvider.CHATGPT:
          return await this.searchWithChatGPT(query, stations, apiKey);
        case AIProvider.GROK:
          return await this.searchWithGrok(query, stations, apiKey);
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }
    } catch (error) {
      console.error(`${provider} API error:`, error);
      throw error;
    }
  }

  /**
   * 獲取 Gemini 可用模型列表（公開方法，供UI使用）
   */
  static async getAvailableGeminiModels(apiKey?: string): Promise<string[]> {
    const key = apiKey || this.getAPIKey(AIProvider.GEMINI);
    if (!key) return [];
    return await this.getGeminiModels(key);
  }

  /**
   * 獲取 ChatGPT 可用模型列表（公開方法，供UI使用）
   */
  static async getAvailableChatGPTModels(apiKey?: string): Promise<string[]> {
    const key = apiKey || this.getAPIKey(AIProvider.CHATGPT);
    if (!key) return [];
    return await this.getChatGPTModels(key);
  }

  /**
   * 獲取 Grok 可用模型列表（公開方法，供UI使用）
   */
  static async getAvailableGrokModels(apiKey?: string): Promise<string[]> {
    const key = apiKey || this.getAPIKey(AIProvider.GROK);
    if (!key) return [];
    return await this.getGrokModels(key);
  }

  /**
   * 獲取 Gemini 可用模型列表
   */
  private static async getGeminiModels(apiKey: string): Promise<string[]> {
    // 如果已有快取，直接返回
    if (this.geminiModelsCache && this.geminiModelsCache.length > 0) {
      return this.geminiModelsCache;
    }

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
            this.geminiModelsCache = models;
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
        // 解析模型列表
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
              return b.localeCompare(a); // 字母順序倒序
            });
        }

        if (models.length > 0) {
          this.geminiModelsCache = models;
          // 保存到快取
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
    this.geminiModelsCache = defaultModels;
    return defaultModels;
  }

  /**
   * 獲取 ChatGPT 可用模型列表
   */
  private static async getChatGPTModels(apiKey: string): Promise<string[]> {
    // 如果已有快取，直接返回
    if (this.chatgptModelsCache && this.chatgptModelsCache.length > 0) {
      return this.chatgptModelsCache;
    }

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
            this.chatgptModelsCache = models;
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
        // 解析模型列表（OpenAI 格式）
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
          this.chatgptModelsCache = models;
          // 保存到快取
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
    this.chatgptModelsCache = defaultModels;
    return defaultModels;
  }

  /**
   * 設置自定義模型（用戶選擇的模型）
   */
  static async setCustomModel(provider: AIProvider, modelName: string): Promise<void> {
    try {
      const storageKey = `@mesonRadio:${provider}Model`;
      await AsyncStorage.setItem(storageKey, modelName);
      this.customModels.set(provider, modelName);
      console.log(`✅ 已設置 ${provider} 的自定義模型: ${modelName}`);
    } catch (error) {
      console.error(`Error saving ${provider} custom model:`, error);
      throw error;
    }
  }

  /**
   * 獲取自定義模型（用戶選擇的模型）
   */
  static getCustomModel(provider: AIProvider): string | undefined {
    return this.customModels.get(provider);
  }

  /**
   * 清除自定義模型（恢復為自動選擇）
   */
  static async clearCustomModel(provider: AIProvider): Promise<void> {
    try {
      const storageKey = `@mesonRadio:${provider}Model`;
      await AsyncStorage.removeItem(storageKey);
      this.customModels.delete(provider);
      console.log(`✅ 已清除 ${provider} 的自定義模型`);
    } catch (error) {
      console.error(`Error clearing ${provider} custom model:`, error);
      throw error;
    }
  }

  /**
   * 清除模型快取（用於強制刷新）
   */
  static async clearModelsCache(provider?: AIProvider): Promise<void> {
    if (provider === AIProvider.GEMINI || !provider) {
      this.geminiModelsCache = null;
      await AsyncStorage.removeItem('@mesonRadio:geminiModels');
      await AsyncStorage.removeItem('@mesonRadio:geminiModelsTime');
    }
    if (provider === AIProvider.CHATGPT || !provider) {
      this.chatgptModelsCache = null;
      await AsyncStorage.removeItem('@mesonRadio:chatgptModels');
      await AsyncStorage.removeItem('@mesonRadio:chatgptModelsTime');
    }
    if (provider === AIProvider.GROK || !provider) {
      this.grokModelsCache = null;
      await AsyncStorage.removeItem('@mesonRadio:grokModels');
      await AsyncStorage.removeItem('@mesonRadio:grokModelsTime');
    }
    console.log('✅ 已清除模型快取');
  }

  /**
>>>>>>> 99cfb686d0b7f75dd5fab96cab46ed6cc5e9013e
   * 使用 Gemini 搜尋
   */
  private static async searchWithGemini(
    query: string,
    stations: Station[],
    apiKey: string
  ): Promise<SearchResult[]> {
    // 獲取可用模型列表
    const allModels = await this.getGeminiModels(apiKey);
    
    // 如果用戶選擇了自定義模型，優先使用
    const customModel = this.getCustomModel(AIProvider.GEMINI);
    const models = customModel && allModels.includes(customModel)
      ? [customModel, ...allModels.filter(m => m !== customModel)]
      : allModels;
    
    let lastError: Error | null = null;
    
    for (const modelName of models) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = this.buildPrompt(query, stations);
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        console.log(`✅ Gemini API 成功（使用模型: ${modelName}）`);
        return this.parseAIResponse(response, stations);
      } catch (error) {
        // 如果是最後一個模型，拋出錯誤
        if (modelName === models[models.length - 1]) {
          if (error instanceof Error) {
            console.error('Gemini API 調用失敗:', error.message);
            throw error;
          }
          throw new Error(`Gemini API 未知錯誤: ${error}`);
        }
        // 否則記錄錯誤並嘗試下一個模型
        lastError = error instanceof Error ? error : new Error(String(error));
        console.log(`⚠️ 模型 ${modelName} 失敗，嘗試下一個模型...`);
      }
    }
    
    // 如果所有模型都失敗，拋出最後一個錯誤
    throw lastError || new Error('所有 Gemini 模型都無法使用');
  }

  /**
   * 使用 ChatGPT 搜尋
   */
  private static async searchWithChatGPT(
    query: string,
    stations: Station[],
    apiKey: string
  ): Promise<SearchResult[]> {
    // 獲取可用模型列表
    const allModels = await this.getChatGPTModels(apiKey);
    
    // 如果用戶選擇了自定義模型，優先使用
    const customModel = this.getCustomModel(AIProvider.CHATGPT);
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
                content: '你是一個專業的台灣電台推薦助手。請根據用戶需求推薦電台，並以 JSON 格式回覆。',
              },
              {
                role: 'user',
                content: this.buildPrompt(query, stations),
              },
            ],
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `ChatGPT API error (模型: ${modelName}): ${response.status}`;
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
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error('ChatGPT API 回應格式錯誤：缺少 choices 或 message');
        }
        
        const aiResponse = data.choices[0].message.content;
        if (!aiResponse) {
          throw new Error('ChatGPT API 回應為空');
        }

        console.log(`✅ ChatGPT API 成功（使用模型: ${modelName}）`);
        return this.parseAIResponse(aiResponse, stations);
      } catch (error) {
        // 如果是最後一個模型，拋出錯誤
        if (modelName === models[models.length - 1]) {
          if (error instanceof Error) {
            console.error('ChatGPT API 調用失敗:', error.message);
            throw error;
          }
          throw new Error(`ChatGPT API 未知錯誤: ${error}`);
        }
        // 否則記錄錯誤並嘗試下一個模型
        lastError = error instanceof Error ? error : new Error(String(error));
        console.log(`⚠️ 模型 ${modelName} 失敗，嘗試下一個模型...`);
      }
    }
    
    // 如果所有模型都失敗，拋出最後一個錯誤
    throw lastError || new Error('所有 ChatGPT 模型都無法使用');
  }

  /**
   * 獲取 Grok 可用模型列表
   */
  private static async getGrokModels(apiKey: string): Promise<string[]> {
    // 如果已有快取，直接返回
    if (this.grokModelsCache && this.grokModelsCache.length > 0) {
      return this.grokModelsCache;
    }

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
            this.grokModelsCache = models;
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
                if (name.includes('grok-4')) return 5;
                if (name.includes('grok-3')) return 4;
                if (name.includes('grok-2')) return 3;
                if (name.includes('grok-beta')) return 2;
                return 1;
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
                if (name.includes('grok-4')) return 5;
                if (name.includes('grok-3')) return 4;
                if (name.includes('grok-2')) return 3;
                if (name.includes('grok-beta')) return 2;
                return 1;
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
                if (name.includes('grok-4')) return 5;
                if (name.includes('grok-3')) return 4;
                if (name.includes('grok-2')) return 3;
                if (name.includes('grok-beta')) return 2;
                return 1;
              };
              return getVersion(b) - getVersion(a);
            });
        }

        if (models.length > 0) {
          this.grokModelsCache = models;
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
    this.grokModelsCache = defaultModels;
    return defaultModels;
  }
  /**
   * 使用 Grok 搜尋
   */
  private static async searchWithGrok(
    query: string,
    stations: Station[],
    apiKey: string
  ): Promise<SearchResult[]> {
    // 獲取可用模型列表（會自動使用快取或從 API 獲取）
    const allModels = await this.getGrokModels(apiKey);
    
    // 如果用戶選擇了自定義模型，優先使用
    const customModel = this.getCustomModel(AIProvider.GROK);
    const models = customModel && allModels.includes(customModel)
      ? [customModel, ...allModels.filter(m => m !== customModel)]
      : allModels;
    
    let lastError: Error | null = null;
    
    for (const model of models) {
      try {
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
                content: '你是一個專業的台灣電台推薦助手。請根據用戶需求推薦電台，並以 JSON 格式回覆。',
              },
              {
                role: 'user',
                content: this.buildPrompt(query, stations),
              },
            ],
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `Grok API error (模型: ${model}): ${response.status}`;
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
          
          throw new Error(errorMessage);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error('Grok API 回應格式錯誤：缺少 choices 或 message');
        }
        
        const aiResponse = data.choices[0].message.content;
        if (!aiResponse) {
          throw new Error('Grok API 回應為空');
        }

        console.log(`✅ Grok API 成功（使用模型: ${model}）`);
        return this.parseAIResponse(aiResponse, stations);
      } catch (error) {
        // 如果是最後一個模型，拋出錯誤
        if (model === models[models.length - 1]) {
          if (error instanceof Error) {
            console.error('Grok API 調用失敗:', error.message);
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
  }

  /**
   * 構建 AI 提示詞
   */
  private static buildPrompt(query: string, stations: Station[]): string {
    const stationList = stations.map((s, i) => 
      `${i + 1}. ${s.name} (${s.type})`
    ).join('\n');

    return `你是一個專業的台灣電台推薦助手。根據用戶的需求，從以下電台列表中推薦最符合的電台。

電台列表：
${stationList}

用戶需求：「${query}」

請以 JSON 格式回覆，格式如下：
{
  "recommendations": [
    {
      "index": 電台編號（從1開始）,
      "reason": "推薦原因（繁體中文，20字內）",
      "confidence": 信心分數（0-100）
    }
  ]
}

規則：
1. 最多推薦 5 個電台
2. 按相關性排序（最相關的在前）
3. 信心分數：完全匹配 90-100，部分匹配 70-89，可能相關 50-69
4. 如果沒有相關電台，返回空陣列
5. 只返回 JSON，不要其他文字`;
  }

  /**
   * 解析 AI 回應
   */
  private static parseAIResponse(
    response: string,
    stations: Station[]
  ): SearchResult[] {
    // 解析 JSON 回應
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const aiResponse = JSON.parse(jsonMatch[0]);
    const recommendations = aiResponse.recommendations || [];

    // 轉換為 SearchResult
    const results: SearchResult[] = recommendations
      .filter((rec: any) => rec.index > 0 && rec.index <= stations.length)
      .map((rec: any) => ({
        station: stations[rec.index - 1],
        score: rec.confidence || 60,
        matchType: 'ai' as const,
        reason: rec.reason,
      }));

    return results;
  }

  /**
   * 合併搜尋結果
   */
  private static mergeResults(
    aiResults: SearchResult[],
    localResults: SearchResult[]
  ): SearchResult[] {
    const merged = [...aiResults];
    const aiStationIds = new Set(aiResults.map(r => r.station.id));

    // 添加本地結果中未包含的高分項目
    for (const result of localResults) {
      if (!aiStationIds.has(result.station.id) && result.score >= 70) {
        merged.push(result);
      }
    }

    // 按分數排序
    return merged.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  /**
   * 獲取電台分類
   */
  static getStationCategory(station: Station): StationCategory[] {
    const categories: StationCategory[] = [];
    const name = station.name.toLowerCase();

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(kw => name.includes(kw.toLowerCase()))) {
        categories.push(category as StationCategory);
      }
    }

    return categories.length > 0 ? categories : [StationCategory.MUSIC];
  }

  /**
   * 獲取搜尋建議
   */
  static getSuggestions(): string[] {
    return [
      '新聞台',
      '音樂電台',
      '古典音樂',
      '流行音樂',
      '交通資訊',
      '輕鬆的音樂',
      '適合開車聽的電台',
      '英文電台',
    ];
  }
}

