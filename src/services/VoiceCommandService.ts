/**
 * 語音命令服務
 * Voice Command Service
 * 
 * 功能：
 * - 語音識別
 * - AI 分析命令
 * - 自動搜尋並播放電台
 */

import * as Speech from 'expo-speech';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SmartSearchService, AIProvider } from './SmartSearchService';
import { RadioBrowserService } from './RadioBrowserService';
import { AIRadioSearchService } from './AIRadioSearchService';
import { AudioPlayerService } from './AudioPlayerService';
import { StorageManager } from '@/utils/StorageManager';
import { Station } from '@/models/Station';

export interface VoiceCommandResult {
  success: boolean;
  message: string;
  stations?: Array<{
    name: string;
    url: string;
    favicon: string;
    country: string;
    tags: string;
  }>;
  query?: string;
}

export class VoiceCommandService {
  private static isListening: boolean = false;

  /**
   * 初始化語音識別
   * 注意：由於 @react-native-voice/voice 在 Expo Go 中不可用，
   * 我們使用文本輸入作為替代方案
   */
  static async initialize(): Promise<void> {
    console.log('語音服務初始化完成（使用文本輸入模式）');
  }

  /**
   * 開始語音識別（模擬版本）
   * 實際使用文本輸入框代替
   */
  static async startListening(): Promise<string> {
    // 這個方法將由 UI 層的文本輸入框觸發
    // 返回空字符串，實際文本由 UI 提供
    return '';
  }

  /**
   * 停止語音識別
   */
  static async stopListening(): Promise<void> {
    this.isListening = false;
  }

  /**
   * 語音播報
   */
  static async speak(text: string): Promise<void> {
    try {
      await Speech.speak(text, {
        language: 'zh-TW',
        pitch: 1.0,
        rate: 0.9,
      });
    } catch (error) {
      console.error('語音播報失敗:', error);
    }
  }

  /**
   * 處理語音命令 - 使用 AI 從網路搜尋電台
   */
  static async processVoiceCommand(command: string): Promise<VoiceCommandResult> {
    try {
      // 使用 AI 分析命令
      const analysis = await this.analyzeCommand(command);
      
      if (!analysis.intent || !analysis.keyword) {
        return {
          success: false,
          message: '抱歉，我不太理解你的需求。請試著說「我想聽新聞」或「播放古典音樂」',
        };
      }

      // 使用 AI 從網路搜尋電台（新功能！）
      console.log(`使用 AI 搜尋網路電台：${analysis.description}`);
      const aiResults = await AIRadioSearchService.searchRadioStationsWithAI(analysis.description);
      
      if (aiResults.length > 0) {
        const stations = aiResults.map(station => ({
          name: station.name,
          url: station.url,
          favicon: station.favicon || '',
          country: station.country,
          tags: station.genre,
        }));
        
        return {
          success: true,
          message: `🤖 AI 為您找到 ${stations.length} 個「${analysis.description}」電台`,
          stations,
          query: analysis.description,
        };
      }

      // 如果 AI 搜尋沒有結果，降級到傳統搜尋
      console.log('AI 搜尋無結果，使用傳統搜尋');
      
      // 嘗試 Radio Browser API
      try {
        const searchResults = await RadioBrowserService.searchStations(analysis.keyword);
        
        if (searchResults.length === 0) {
          return {
            success: false,
            message: `找不到符合「${analysis.description}」的電台，請試試其他關鍵字`,
          };
        }

        // 返回搜尋結果（取前 10 個）
        const stations = searchResults.slice(0, 10).map(station => ({
          name: station.name,
          url: station.url,
          favicon: station.favicon,
          country: station.country,
          tags: station.tags,
        }));

        return {
          success: true,
          message: `找到 ${stations.length} 個「${analysis.description}」電台`,
          stations,
          query: analysis.description,
        };
      } catch (apiError) {
        // Radio Browser API 失敗，返回本地建議
        return {
          success: false,
          message: `無法連接電台資料庫。建議使用「電台列表」中的預設台灣電台，或手動新增電台`,
        };
      }
    } catch (error) {
      console.error('處理語音命令失敗:', error);
      return {
        success: false,
        message: '處理命令時發生錯誤，請重試',
      };
    }
  }

  /**
   * 從本地預設電台搜尋
   */
  private static async searchLocalStations(keyword: string, description: string): Promise<Array<{
    name: string;
    url: string;
    favicon: string;
    country: string;
    tags: string;
  }>> {
    try {
      // 獲取所有已儲存的電台
      const allStations = await StorageManager.getStations();
      
      const lowerKeyword = keyword.toLowerCase();
      const results: Array<{
        name: string;
        url: string;
        favicon: string;
        country: string;
        tags: string;
      }> = [];
      
      // 搜尋匹配的電台
      for (const station of allStations) {
        const stationName = station.name.toLowerCase();
        
        // 新聞相關
        if (lowerKeyword.includes('news') && 
            (stationName.includes('新聞') || stationName.includes('news') || 
             stationName.includes('資訊') || stationName.includes('治安'))) {
          results.push({
            name: station.name,
            url: station.url,
            favicon: station.icon || '',
            country: 'Taiwan',
            tags: 'news',
          });
        }
        
        // 音樂相關
        if ((lowerKeyword.includes('music') || lowerKeyword.includes('classical') || 
             lowerKeyword.includes('jazz') || lowerKeyword.includes('pop')) &&
            (stationName.includes('音樂') || stationName.includes('古典') || 
             stationName.includes('音廣') || stationName.includes('城市'))) {
          results.push({
            name: station.name,
            url: station.url,
            favicon: station.icon || '',
            country: 'Taiwan',
            tags: 'music',
          });
        }
      }
      
      return results.slice(0, 10);
    } catch (error) {
      console.error('本地搜尋失敗:', error);
      return [];
    }
  }

  /**
   * 使用 AI 分析命令
   */
  private static async analyzeCommand(command: string): Promise<{
    intent: string;
    keyword: string;
    description: string;
  }> {
    try {
      const apiKey = SmartSearchService.getAPIKey(SmartSearchService.getCurrentProvider());
      if (!apiKey) {
        throw new Error('未配置 AI API Key');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      
      // 使用最新的 Gemini 2.5 Flash 模型（快速且強大）
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `你是一個智能電台助手。分析用戶的語音命令，判斷他們想聽什麼類型的電台。

用戶說：「${command}」

請以 JSON 格式回覆，包含：
{
  "intent": "播放意圖（如：listen_news, listen_music, listen_classical）",
  "keyword": "適合搜尋的英文關鍵字（如：news, classical, jazz, pop）",
  "description": "中文描述（如：新聞、古典音樂、爵士樂）"
}

常見意圖對應：
- 新聞/資訊 → keyword: "news"
- 古典音樂 → keyword: "classical"
- 流行音樂 → keyword: "pop"
- 爵士樂 → keyword: "jazz"
- 搖滾樂 → keyword: "rock"
- 電子音樂 → keyword: "electronic"
- 特定國家（如：日本） → keyword: "japan"

只返回 JSON，不要其他文字：`;

      const result = await model.generateContent(prompt);
      const response = result.response.text().trim();
      
      // 解析 JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI 回應格式錯誤');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      return analysis;
    } catch (error) {
      console.error('AI 分析失敗:', error);
      throw error;
    }
  }

  /**
   * 分析操作命令（試播、加入列表、加入最愛）
   */
  static analyzeActionCommand(command: string): {
    action: 'play' | 'add' | 'favorite' | 'next' | 'previous' | 'back' | null;
    number?: number;
  } {
    const lowerCommand = command.toLowerCase().trim();
    
    // 試播命令
    if (
      lowerCommand.includes('試播') ||
      lowerCommand.includes('播放') ||
      lowerCommand.includes('聽聽看') ||
      lowerCommand.includes('試聽') ||
      lowerCommand.match(/播.*這個/) ||
      lowerCommand === '播'
    ) {
      return { action: 'play', number: this.extractNumber(command) };
    }
    
    // 加入列表命令
    if (
      lowerCommand.includes('加入列表') ||
      lowerCommand.includes('加入電台') ||
      lowerCommand.includes('新增') ||
      lowerCommand.includes('收藏') ||
      lowerCommand.match(/加.*這個/)
    ) {
      return { action: 'add', number: this.extractNumber(command) };
    }
    
    // 加入最愛命令
    if (
      lowerCommand.includes('最愛') ||
      lowerCommand.includes('我的最愛') ||
      lowerCommand.includes('加到最愛') ||
      lowerCommand.match(/星.*這個/)
    ) {
      return { action: 'favorite', number: this.extractNumber(command) };
    }
    
    // 下一個
    if (
      lowerCommand.includes('下一個') ||
      lowerCommand.includes('下一台') ||
      lowerCommand.includes('換下一個')
    ) {
      return { action: 'next' };
    }
    
    // 上一個
    if (
      lowerCommand.includes('上一個') ||
      lowerCommand.includes('上一台') ||
      lowerCommand.includes('前一個')
    ) {
      return { action: 'previous' };
    }
    
    // 返回/重新搜尋
    if (
      lowerCommand.includes('返回') ||
      lowerCommand.includes('重新搜尋') ||
      lowerCommand.includes('再搜一次') ||
      lowerCommand.includes('重新找')
    ) {
      return { action: 'back' };
    }
    
    return { action: null };
  }

  /**
   * 從命令中提取數字
   */
  private static extractNumber(command: string): number | undefined {
    // 中文數字映射
    const chineseNumbers: { [key: string]: number } = {
      '一': 1, '第一': 1, '1': 1,
      '二': 2, '第二': 2, '2': 2,
      '三': 3, '第三': 3, '3': 3,
      '四': 4, '第四': 4, '4': 4,
      '五': 5, '第五': 5, '5': 5,
      '六': 6, '第六': 6, '6': 6,
      '七': 7, '第七': 7, '7': 7,
      '八': 8, '第八': 8, '8': 8,
      '九': 9, '第九': 9, '9': 9,
      '十': 10, '第十': 10, '10': 10,
    };
    
    // 檢查中文數字
    for (const [key, value] of Object.entries(chineseNumbers)) {
      if (command.includes(key)) {
        return value;
      }
    }
    
    // 檢查阿拉伯數字
    const match = command.match(/\d+/);
    if (match) {
      return parseInt(match[0], 10);
    }
    
    return undefined;
  }

  /**
   * 清理資源
   */
  static async cleanup(): Promise<void> {
    try {
      await this.stopListening();
      await Speech.stop();
    } catch (error) {
      console.error('清理資源失敗:', error);
    }
  }

  /**
   * 檢查是否正在監聽
   */
  static isCurrentlyListening(): boolean {
    return this.isListening;
  }
}

