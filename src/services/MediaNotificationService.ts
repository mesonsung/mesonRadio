/**
 * 媒體通知服務
 * Media Notification Service
 * 
 * 功能：
 * - 在後台顯示媒體播放控制通知
 * - 保持應用在後台運行
 * - 提供播放/暫停/停止控制
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Station } from '@/models/Station';

// 配置通知處理器
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false, // 媒體通知不需要彈窗
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export class MediaNotificationService {
  private static notificationId: string | null = null;
  private static channelId: string = 'media-playback';
  
  /**
   * 初始化通知服務
   * Initialize notification service
   */
  static async initialize(): Promise<void> {
    try {
      // 請求通知權限
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('通知權限未授予');
        return;
      }

      // Android: 創建通知頻道（最高優先級，模擬前台服務）
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(this.channelId, {
          name: '媒體播放',
          importance: Notifications.AndroidImportance.MAX, // ⭐ 改為 MAX
          sound: null, // 不播放聲音
          vibrationPattern: null, // 不震動
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: true, // ⭐ 允許繞過勿擾模式
          enableLights: false,
          enableVibrate: false,
          showBadge: false,
        });
      }

      console.log('✅ 通知服務初始化成功');
    } catch (error) {
      console.error('❌ 通知服務初始化失敗:', error);
    }
  }

  /**
   * 顯示正在播放的通知
   * Show now playing notification
   */
  static async showNowPlaying(station: Station, isPlaying: boolean): Promise<void> {
    try {
      const notification: Notifications.NotificationContentInput = {
        title: station.name,
        body: isPlaying ? '正在播放...' : '已暫停',
        data: {
          stationId: station.id,
          stationName: station.name,
          stationUrl: station.url,
          isPlaying,
        },
        priority: Platform.OS === 'android' 
          ? Notifications.AndroidNotificationPriority.MAX // ⭐ 改為 MAX
          : undefined,
        sound: null,
        vibrate: [],
        badge: 0,
        categoryIdentifier: 'media-control',
        ...(Platform.OS === 'android' && {
          // Android 特定配置 - 模擬前台服務行為
          sticky: true,        // ⭐ 無法滑動移除
          ongoing: true,       // ⭐ 持續通知（類似前台服務）
          autoCancel: false,   // ⭐ 點擊不自動取消
          channelId: this.channelId,
          color: '#1a1a2e',    // 通知顏色
        }),
      };

      // 如果已有通知，則更新；否則創建新通知
      if (this.notificationId) {
        await Notifications.dismissNotificationAsync(this.notificationId);
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: notification,
        trigger: null, // 立即顯示
      });

      this.notificationId = identifier;
      console.log('📱 通知已顯示:', station.name, isPlaying ? '播放中' : '已暫停');
    } catch (error) {
      console.error('❌ 顯示通知失敗:', error);
    }
  }

  /**
   * 更新通知狀態
   * Update notification status
   */
  static async updateNotification(station: Station, status: string): Promise<void> {
    try {
      if (!this.notificationId) {
        await this.showNowPlaying(station, status === 'playing');
        return;
      }

      // 重新調度通知以更新內容
      await this.showNowPlaying(station, status === 'playing');
    } catch (error) {
      console.error('❌ 更新通知失敗:', error);
    }
  }

  /**
   * 隱藏通知
   * Hide notification
   */
  static async hideNotification(): Promise<void> {
    try {
      if (this.notificationId) {
        await Notifications.dismissNotificationAsync(this.notificationId);
        this.notificationId = null;
        console.log('📱 通知已隱藏');
      }
    } catch (error) {
      console.error('❌ 隱藏通知失敗:', error);
    }
  }

  /**
   * 設置通知點擊監聽器
   * Set notification tap listener
   */
  static addNotificationTapListener(
    handler: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener((response) => {
      handler(response.notification);
    });
  }

  /**
   * 清理資源
   * Cleanup resources
   */
  static async cleanup(): Promise<void> {
    try {
      await this.hideNotification();
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('❌ 清理通知失敗:', error);
    }
  }
}
