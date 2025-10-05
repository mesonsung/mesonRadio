/**
 * 儲存管理工具類
 * Storage Manager Utility Class
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Station } from '@/models/Station';
import { Config } from '@/constants/config';
import { DEFAULT_TAIWAN_STATIONS } from '@/constants/defaultStations';

export class StorageManager {
  /**
   * 初始化預設電台（首次啟動時）
   * Initialize default stations on first launch
   */
  static async initializeDefaultStations(): Promise<void> {
    try {
      const hasInitialized = await AsyncStorage.getItem(Config.STORAGE_KEYS.INITIALIZED);
      if (hasInitialized) {
        return; // 已經初始化過，不再重複
      }

      console.log('首次啟動，載入台灣預設電台...');
      
      // 添加所有預設電台
      for (const stationData of DEFAULT_TAIWAN_STATIONS) {
        await this.addStation({
          ...stationData,
          isFavorite: false,
        });
      }

      // 標記為已初始化
      await AsyncStorage.setItem(Config.STORAGE_KEYS.INITIALIZED, 'true');
      console.log('預設電台載入完成！');
    } catch (error) {
      console.error('Error initializing default stations:', error);
    }
  }
  /**
   * 獲取所有電台
   * Get all stations
   */
  static async getStations(): Promise<Station[]> {
    try {
      const data = await AsyncStorage.getItem(Config.STORAGE_KEYS.STATIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting stations:', error);
      return [];
    }
  }

  /**
   * 儲存電台列表
   * Save stations list
   */
  static async saveStations(stations: Station[]): Promise<void> {
    try {
      await AsyncStorage.setItem(Config.STORAGE_KEYS.STATIONS, JSON.stringify(stations));
    } catch (error) {
      console.error('Error saving stations:', error);
      throw error;
    }
  }

  /**
   * 新增電台
   * Add station
   */
  static async addStation(station: Omit<Station, 'id' | 'createdAt' | 'updatedAt'>): Promise<Station> {
    try {
      const stations = await this.getStations();
      const newStation: Station = {
        ...station,
        id: Date.now().toString(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      stations.push(newStation);
      await this.saveStations(stations);
      return newStation;
    } catch (error) {
      console.error('Error adding station:', error);
      throw error;
    }
  }

  /**
   * 更新電台
   * Update station
   */
  static async updateStation(id: string, updates: Partial<Station>): Promise<void> {
    try {
      const stations = await this.getStations();
      const index = stations.findIndex(s => s.id === id);
      if (index !== -1) {
        stations[index] = {
          ...stations[index],
          ...updates,
          updatedAt: Date.now(),
        };
        await this.saveStations(stations);
      }
    } catch (error) {
      console.error('Error updating station:', error);
      throw error;
    }
  }

  /**
   * 刪除電台
   * Delete station
   */
  static async deleteStation(id: string): Promise<void> {
    try {
      const stations = await this.getStations();
      const filtered = stations.filter(s => s.id !== id);
      await this.saveStations(filtered);
    } catch (error) {
      console.error('Error deleting station:', error);
      throw error;
    }
  }

  /**
   * 切換最愛狀態
   * Toggle favorite status
   */
  static async toggleFavorite(id: string): Promise<void> {
    try {
      const stations = await this.getStations();
      const station = stations.find(s => s.id === id);
      if (station) {
        station.isFavorite = !station.isFavorite;
        station.updatedAt = Date.now();
        await this.saveStations(stations);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }

  /**
   * 獲取最愛電台
   * Get favorite stations
   */
  static async getFavoriteStations(): Promise<Station[]> {
    try {
      const stations = await this.getStations();
      return stations.filter(s => s.isFavorite);
    } catch (error) {
      console.error('Error getting favorite stations:', error);
      return [];
    }
  }

  /**
   * 獲取當前播放的電台
   * Get current playing station
   */
  static async getCurrentStation(): Promise<Station | null> {
    try {
      const data = await AsyncStorage.getItem(Config.STORAGE_KEYS.CURRENT_STATION);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting current station:', error);
      return null;
    }
  }

  /**
   * 儲存當前播放的電台
   * Save current playing station
   */
  static async setCurrentStation(station: Station | null): Promise<void> {
    try {
      if (station) {
        await AsyncStorage.setItem(Config.STORAGE_KEYS.CURRENT_STATION, JSON.stringify(station));
      } else {
        await AsyncStorage.removeItem(Config.STORAGE_KEYS.CURRENT_STATION);
      }
    } catch (error) {
      console.error('Error setting current station:', error);
      throw error;
    }
  }

  /**
   * 獲取音量設定
   * Get volume setting
   */
  static async getVolume(): Promise<number> {
    try {
      const data = await AsyncStorage.getItem(Config.STORAGE_KEYS.VOLUME);
      return data ? parseFloat(data) : Config.DEFAULT_VOLUME;
    } catch (error) {
      console.error('Error getting volume:', error);
      return Config.DEFAULT_VOLUME;
    }
  }

  /**
   * 儲存音量設定
   * Save volume setting
   */
  static async setVolume(volume: number): Promise<void> {
    try {
      await AsyncStorage.setItem(Config.STORAGE_KEYS.VOLUME, volume.toString());
    } catch (error) {
      console.error('Error setting volume:', error);
      throw error;
    }
  }
}

