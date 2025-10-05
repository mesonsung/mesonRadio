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

  /**
   * 初始化服務
   */
  static async initialize(): Promise<void> {
    try {
      // 載入所有 AI 提供商的 API Keys
      const geminiKey = await AsyncStorage.getItem('@mesonRadio:geminiApiKey');
      const chatgptKey = await AsyncStorage.getItem('@mesonRadio:chatgptApiKey');
      const grokKey = await AsyncStorage.getItem('@mesonRadio:grokApiKey');
      const provider = await AsyncStorage.getItem('@mesonRadio:aiProvider');

      if (geminiKey) this.aiConfigs.set(AIProvider.GEMINI, geminiKey);
      if (chatgptKey) this.aiConfigs.set(AIProvider.CHATGPT, chatgptKey);
      if (grokKey) this.aiConfigs.set(AIProvider.GROK, grokKey);
      if (provider) this.currentProvider = provider as AIProvider;
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
   * 使用 Gemini 搜尋
   */
  private static async searchWithGemini(
    query: string,
    stations: Station[],
    apiKey: string
  ): Promise<SearchResult[]> {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 使用最新的 Gemini 2.5 Flash 模型
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = this.buildPrompt(query, stations);
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    return this.parseAIResponse(response, stations);
  }

  /**
   * 使用 ChatGPT 搜尋
   */
  private static async searchWithChatGPT(
    query: string,
    stations: Station[],
    apiKey: string
  ): Promise<SearchResult[]> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // 便宜快速的模型
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
      throw new Error(`ChatGPT API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return this.parseAIResponse(aiResponse, stations);
  }

  /**
   * 使用 Grok 搜尋
   */
  private static async searchWithGrok(
    query: string,
    stations: Station[],
    apiKey: string
  ): Promise<SearchResult[]> {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-beta', // Grok 模型
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
      throw new Error(`Grok API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return this.parseAIResponse(aiResponse, stations);
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

