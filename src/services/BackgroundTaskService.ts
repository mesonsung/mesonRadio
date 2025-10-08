/**
 * 後台任務服務
 * Background Task Service
 * 
 * 功能：
 * - 註冊後台任務，保持網路連接
 * - 在應用進入後台時繼續執行網路重試
 * - 監控網路狀態變化
 */

import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

const BACKGROUND_FETCH_TASK = 'background-audio-task';

export class BackgroundTaskService {
  private static isRegistered: boolean = false;
  private static networkCallback: ((isConnected: boolean) => void) | null = null;
  private static unsubscribeNetInfo: (() => void) | null = null;

  /**
   * 初始化後台任務服務
   * Initialize background task service
   */
  static async initialize(): Promise<void> {
    try {
      console.log('🔧 初始化後台任務服務...');

      // 註冊任務定義
      this.defineBackgroundTask();

      // 註冊後台獲取任務
      await this.registerBackgroundFetch();

      // 設置網路監聽
      this.setupNetworkMonitoring();

      console.log('✅ 後台任務服務初始化成功');
    } catch (error) {
      console.error('❌ 後台任務服務初始化失敗:', error);
    }
  }

  /**
   * 定義後台任務
   * Define background task
   */
  private static defineBackgroundTask(): void {
    TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
      try {
        console.log('🔄 後台任務執行中...');
        
        // 檢查網路連接狀態
        const netInfo = await NetInfo.fetch();
        console.log('📡 網路狀態:', {
          isConnected: netInfo.isConnected,
          isInternetReachable: netInfo.isInternetReachable,
          type: netInfo.type,
        });

        // 觸發網路狀態回調（如果有）
        if (this.networkCallback && netInfo.isConnected !== null) {
          this.networkCallback(netInfo.isConnected);
        }

        // 返回成功結果
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error('❌ 後台任務執行失敗:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });
  }

  /**
   * 註冊後台獲取任務
   * Register background fetch task
   */
  private static async registerBackgroundFetch(): Promise<void> {
    try {
      // 檢查任務是否已註冊
      const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(
        BACKGROUND_FETCH_TASK
      );

      if (isTaskRegistered) {
        console.log('⚠️ 後台任務已註冊');
        this.isRegistered = true;
        return;
      }

      // 註冊後台獲取任務
      const options = {
        minimumInterval: Platform.OS === 'android' ? 15 * 60 : 60, // Android: 15分鐘, iOS: 1分鐘
        stopOnTerminate: false, // 應用終止時不停止任務
        startOnBoot: true, // 設備重啟後自動啟動（僅 Android）
      };
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, options);

      this.isRegistered = true;
      console.log('✅ 後台獲取任務已註冊');
    } catch (error) {
      console.error('❌ 註冊後台獲取任務失敗:', error);
      throw error;
    }
  }

  /**
   * 取消註冊後台任務
   * Unregister background task
   */
  static async unregister(): Promise<void> {
    try {
      const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(
        BACKGROUND_FETCH_TASK
      );

      if (isTaskRegistered) {
        await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
        this.isRegistered = false;
        console.log('✅ 後台任務已取消註冊');
      }
    } catch (error) {
      console.error('❌ 取消註冊後台任務失敗:', error);
    }
  }

  /**
   * 設置網路監聽
   * Setup network monitoring
   */
  private static setupNetworkMonitoring(): void {
    try {
      // 取消之前的訂閱
      if (this.unsubscribeNetInfo) {
        this.unsubscribeNetInfo();
      }

      // 訂閱網路狀態變化
      this.unsubscribeNetInfo = NetInfo.addEventListener((state) => {
        console.log('📡 網路狀態變化:', {
          isConnected: state.isConnected,
          isInternetReachable: state.isInternetReachable,
          type: state.type,
        });

        // 觸發回調
        if (this.networkCallback && state.isConnected !== null) {
          this.networkCallback(state.isConnected);
        }
      });

      console.log('✅ 網路監聽已設置');
    } catch (error) {
      console.error('❌ 設置網路監聽失敗:', error);
    }
  }

  /**
   * 設置網路狀態變化回調
   * Set network status change callback
   */
  static setNetworkCallback(callback: (isConnected: boolean) => void): void {
    this.networkCallback = callback;
  }

  /**
   * 獲取當前網路狀態
   * Get current network status
   */
  static async getNetworkStatus(): Promise<{
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
    type: string;
  }> {
    try {
      const state = await NetInfo.fetch();
      return {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      };
    } catch (error) {
      console.error('❌ 獲取網路狀態失敗:', error);
      return {
        isConnected: null,
        isInternetReachable: null,
        type: 'unknown',
      };
    }
  }

  /**
   * 檢查後台任務狀態
   * Check background task status
   */
  static async getTaskStatus(): Promise<BackgroundFetch.BackgroundFetchStatus | null> {
    try {
      const status = await BackgroundFetch.getStatusAsync();
      
      if (status !== null) {
        const statusMap: { [key: number]: string } = {
          [BackgroundFetch.BackgroundFetchStatus.Restricted]: 'Restricted',
          [BackgroundFetch.BackgroundFetchStatus.Denied]: 'Denied',
          [BackgroundFetch.BackgroundFetchStatus.Available]: 'Available',
        };
        console.log('📊 後台任務狀態:', statusMap[status] || 'Unknown');
      }
      
      return status;
    } catch (error) {
      console.error('❌ 獲取任務狀態失敗:', error);
      return null;
    }
  }

  /**
   * 清理資源
   * Cleanup resources
   */
  static async cleanup(): Promise<void> {
    try {
      // 取消網路監聽
      if (this.unsubscribeNetInfo) {
        this.unsubscribeNetInfo();
        this.unsubscribeNetInfo = null;
      }

      // 清空回調
      this.networkCallback = null;

      // 可選：取消註冊後台任務（通常不需要，讓任務繼續運行）
      // await this.unregister();

      console.log('✅ 後台任務服務已清理');
    } catch (error) {
      console.error('❌ 清理後台任務服務失敗:', error);
    }
  }

  /**
   * 檢查是否已註冊
   * Check if registered
   */
  static isTaskRegistered(): boolean {
    return this.isRegistered;
  }
}
