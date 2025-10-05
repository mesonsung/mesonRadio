/**
 * Radio Browser API 服務
 * Radio Browser API Service
 * 
 * 使用多個備用伺服器，自動容錯切換
 */

import axios from 'axios';
import { SearchResult } from '@/models/Station';
import { Config } from '@/constants/config';

interface RadioBrowserStation {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  favicon: string;
  country: string;
  language: string;
  tags: string;
  votes: number;
}

export class RadioBrowserService {
  // 多個備用伺服器節點
  private static servers = [
    'https://de1.api.radio-browser.info',
    'https://at1.api.radio-browser.info',
    'https://nl1.api.radio-browser.info',
    'https://fr1.api.radio-browser.info',
  ];
  
  private static currentServerIndex = 0;
  private static baseURL = this.servers[0];

  /**
   * 自動切換到下一個伺服器
   */
  private static switchToNextServer(): void {
    this.currentServerIndex = (this.currentServerIndex + 1) % this.servers.length;
    this.baseURL = this.servers[this.currentServerIndex];
    console.log(`Switched to server: ${this.baseURL}`);
  }

  /**
   * 帶容錯的 API 請求
   */
  private static async requestWithFallback<T>(
    makeRequest: (baseURL: string) => Promise<T>
  ): Promise<T> {
    const maxRetries = this.servers.length;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await makeRequest(this.baseURL);
      } catch (error: any) {
        console.error(`Request failed on ${this.baseURL}:`, error.message);
        
        // 如果不是最後一次嘗試，切換伺服器
        if (i < maxRetries - 1) {
          this.switchToNextServer();
          console.log(`Retrying with ${this.baseURL}...`);
        } else {
          // 所有伺服器都失敗了
          throw new Error('所有 Radio Browser 伺服器都無法連接，請稍後再試');
        }
      }
    }
    
    throw new Error('搜尋失敗');
  }

  /**
   * 搜尋電台
   * Search stations
   */
  static async searchStations(query: string): Promise<SearchResult[]> {
    return this.requestWithFallback(async (baseURL) => {
      const response = await axios.get<RadioBrowserStation[]>(
        `${baseURL}/json/stations/search`,
        {
          params: {
            name: query,
            limit: Config.MAX_SEARCH_RESULTS,
            hidebroken: true,
            order: 'votes',
            reverse: true,
          },
          timeout: 10000, // 10秒超時
        }
      );

      return response.data.map(station => ({
        name: station.name,
        url: station.url_resolved || station.url,
        favicon: station.favicon,
        country: station.country,
        language: station.language,
        tags: station.tags ? station.tags.split(',') : [],
      }));
    });
  }

  /**
   * 按國家搜尋電台
   * Search stations by country
   */
  static async searchByCountry(country: string): Promise<SearchResult[]> {
    return this.requestWithFallback(async (baseURL) => {
      const response = await axios.get<RadioBrowserStation[]>(
        `${baseURL}/json/stations/bycountry/${encodeURIComponent(country)}`,
        {
          params: {
            limit: Config.MAX_SEARCH_RESULTS,
            hidebroken: true,
            order: 'votes',
            reverse: true,
          },
          timeout: 10000,
        }
      );

      return response.data.map(station => ({
        name: station.name,
        url: station.url_resolved || station.url,
        favicon: station.favicon,
        country: station.country,
        language: station.language,
        tags: station.tags ? station.tags.split(',') : [],
      }));
    });
  }

  /**
   * 按語言搜尋電台
   * Search stations by language
   */
  static async searchByLanguage(language: string): Promise<SearchResult[]> {
    return this.requestWithFallback(async (baseURL) => {
      const response = await axios.get<RadioBrowserStation[]>(
        `${baseURL}/json/stations/bylanguage/${encodeURIComponent(language)}`,
        {
          params: {
            limit: Config.MAX_SEARCH_RESULTS,
            hidebroken: true,
            order: 'votes',
            reverse: true,
          },
          timeout: 10000,
        }
      );

      return response.data.map(station => ({
        name: station.name,
        url: station.url_resolved || station.url,
        favicon: station.favicon,
        country: station.country,
        language: station.language,
        tags: station.tags ? station.tags.split(',') : [],
      }));
    });
  }

  /**
   * 按標籤搜尋電台
   * Search stations by tag
   */
  static async searchByTag(tag: string): Promise<SearchResult[]> {
    return this.requestWithFallback(async (baseURL) => {
      const response = await axios.get<RadioBrowserStation[]>(
        `${baseURL}/json/stations/bytag/${encodeURIComponent(tag)}`,
        {
          params: {
            limit: Config.MAX_SEARCH_RESULTS,
            hidebroken: true,
            order: 'votes',
            reverse: true,
          },
          timeout: 10000,
        }
      );

      return response.data.map(station => ({
        name: station.name,
        url: station.url_resolved || station.url,
        favicon: station.favicon,
        country: station.country,
        language: station.language,
        tags: station.tags ? station.tags.split(',') : [],
      }));
    });
  }
}

