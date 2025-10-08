/**
 * 前台服務接口
 * Foreground Service Interface
 */

import { NativeModules, Platform } from 'react-native';

const { AudioForegroundService } = NativeModules;

export class ForegroundService {
  private static isRunning: boolean = false;

  /**
   * 啟動前台服務
   */
  static async start(stationName: string): Promise<void> {
    try {
      if (Platform.OS !== 'android') {
        return;
      }

      if (!AudioForegroundService) {
        console.warn('⚠️ 前台服務模組未找到');
        return;
      }

      if (this.isRunning) {
        return;
      }

      await AudioForegroundService.startService(stationName);
      this.isRunning = true;
      console.log('✅ 前台服務已啟動（防止鎖屏後被殺掉）');
    } catch (error) {
      console.error('❌ 啟動前台服務失敗:', error);
    }
  }

  /**
   * 停止前台服務
   */
  static async stop(): Promise<void> {
    try {
      if (Platform.OS !== 'android') {
        return;
      }

      if (!AudioForegroundService) {
        return;
      }

      if (!this.isRunning) {
        return;
      }

      await AudioForegroundService.stopService();
      this.isRunning = false;
      console.log('✅ 前台服務已停止');
    } catch (error) {
      console.error('❌ 停止前台服務失敗:', error);
    }
  }
}

