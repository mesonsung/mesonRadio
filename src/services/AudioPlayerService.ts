/**
 * 音訊播放服務
 * Audio Player Service
 * 
 * 功能：
 * - 播放電台音訊
 * - 網路斷線自動停播
 * - 網路恢復自動續播
 */

import { Audio, AVPlaybackStatus } from 'expo-av';
import NetInfo from '@react-native-community/netinfo';
import { Station } from '@/models/Station';
import { PlaybackStatus } from '@/models/PlayerState';
import { Config } from '@/constants/config';

export class AudioPlayerService {
  private static sound: Audio.Sound | null = null;
  private static currentStation: Station | null = null;
  private static statusCallback: ((status: PlaybackStatus) => void) | null = null;
  private static isPlaying: boolean = false; // 播放鎖定標誌
  private static wasPlayingBeforeDisconnect: boolean = false; // 斷線前是否在播放
  private static networkUnsubscribe: (() => void) | null = null; // 網路監聽器取消訂閱函數

  /**
   * 初始化音訊系統
   * Initialize audio system
   */
  static async initialize(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // 開始監聽網路狀態
      this.startNetworkMonitoring();
    } catch (error) {
      console.error('Error initializing audio:', error);
      throw error;
    }
  }

  /**
   * 開始監聽網路狀態
   * Start network monitoring
   */
  private static startNetworkMonitoring(): void {
    this.networkUnsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected && state.isInternetReachable !== false;
      console.log('Network state changed:', {
        isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
      });

      if (!isConnected) {
        // 網路斷線
        this.handleNetworkDisconnect();
      } else {
        // 網路恢復
        this.handleNetworkReconnect();
      }
    });
  }

  /**
   * 處理網路斷線
   * Handle network disconnect
   */
  private static async handleNetworkDisconnect(): Promise<void> {
    try {
      // 如果正在播放，記錄狀態並停止
      if (this.isPlaying && this.sound) {
        const status = await this.sound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          console.log('網路斷線，停止播放');
          this.wasPlayingBeforeDisconnect = true;
          await this.stop();
          this.notifyStatus(PlaybackStatus.ERROR);
        }
      }
    } catch (error) {
      console.error('Error handling network disconnect:', error);
    }
  }

  /**
   * 處理網路恢復
   * Handle network reconnect
   */
  private static async handleNetworkReconnect(): Promise<void> {
    try {
      // 如果斷線前在播放，且有電台資訊，自動恢復播放
      if (this.wasPlayingBeforeDisconnect && this.currentStation && !this.isPlaying) {
        console.log('網路恢復，自動續播:', this.currentStation.name);
        this.wasPlayingBeforeDisconnect = false;
        
        // 延遲 1 秒再重連，確保網路穩定
        setTimeout(async () => {
          try {
            await this.play(this.currentStation!);
          } catch (error) {
            console.error('自動續播失敗:', error);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error handling network reconnect:', error);
    }
  }

  /**
   * 設定狀態回調
   * Set status callback
   */
  static setStatusCallback(callback: (status: PlaybackStatus) => void): void {
    this.statusCallback = callback;
  }

  /**
   * 播放電台
   * Play station
   */
  static async play(station: Station): Promise<void> {
    // 防止重複播放：如果正在處理播放請求，直接返回
    if (this.isPlaying) {
      console.log('Already playing or loading, ignoring request');
      return;
    }

    try {
      this.isPlaying = true; // 設置播放鎖定
      
      // 停止當前播放
      await this.stop();

      this.currentStation = station;
      this.notifyStatus(PlaybackStatus.LOADING);

      // 處理 Podcast URL
      if (station.type === 'podcast') {
        await this.playPodcast(station.url);
      } else {
        await this.playRadioStream(station.url);
      }
    } catch (error) {
      console.error('Error playing station:', error);
      this.notifyStatus(PlaybackStatus.ERROR);
      this.isPlaying = false; // 發生錯誤時釋放鎖定
      throw error;
    }
  }

  /**
   * 播放網路廣播流
   * Play radio stream
   */
  private static async playRadioStream(url: string): Promise<void> {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true, volume: Config.DEFAULT_VOLUME },
        this.onPlaybackStatusUpdate.bind(this)
      );

      this.sound = sound;
      await sound.playAsync();
      // 播放成功後不釋放鎖定，保持播放狀態
    } catch (error) {
      console.error('Error playing radio stream:', error);
      this.isPlaying = false; // 發生錯誤時釋放鎖定
      throw error;
    }
  }

  /**
   * 播放 Podcast
   * Play Podcast
   */
  private static async playPodcast(url: string): Promise<void> {
    try {
      // Podcast 使用相同的音訊播放方式
      await this.playRadioStream(url);
    } catch (error) {
      console.error('Error playing podcast:', error);
      throw error;
    }
  }

  /**
   * 暫停播放
   * Pause playback
   */
  static async pause(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.pauseAsync();
        this.notifyStatus(PlaybackStatus.PAUSED);
      }
    } catch (error) {
      console.error('Error pausing:', error);
      throw error;
    }
  }

  /**
   * 恢復播放
   * Resume playback
   */
  static async resume(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.playAsync();
        this.notifyStatus(PlaybackStatus.PLAYING);
      }
    } catch (error) {
      console.error('Error resuming:', error);
      throw error;
    }
  }

  /**
   * 停止播放
   * Stop playback
   */
  static async stop(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
      this.currentStation = null;
      this.isPlaying = false; // 停止時釋放鎖定
      this.notifyStatus(PlaybackStatus.IDLE);
    } catch (error) {
      console.error('Error stopping:', error);
      this.isPlaying = false; // 發生錯誤時也要釋放鎖定
      throw error;
    }
  }

  /**
   * 設定音量
   * Set volume
   */
  static async setVolume(volume: number): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.setVolumeAsync(volume);
      }
    } catch (error) {
      console.error('Error setting volume:', error);
      throw error;
    }
  }

  /**
   * 獲取當前電台
   * Get current station
   */
  static getCurrentStation(): Station | null {
    return this.currentStation;
  }

  /**
   * 播放狀態更新回調
   * Playback status update callback
   */
  private static onPlaybackStatusUpdate(status: AVPlaybackStatus): void {
    if (status.isLoaded) {
      if (status.isPlaying) {
        this.notifyStatus(PlaybackStatus.PLAYING);
      } else if (status.isBuffering) {
        this.notifyStatus(PlaybackStatus.BUFFERING);
      }
    } else if (status.error) {
      console.error('Playback error:', status.error);
      this.notifyStatus(PlaybackStatus.ERROR);
    }
  }

  /**
   * 通知狀態變更
   * Notify status change
   */
  private static notifyStatus(status: PlaybackStatus): void {
    if (this.statusCallback) {
      this.statusCallback(status);
    }
  }

  /**
   * 清理資源
   * Cleanup resources
   */
  static async cleanup(): Promise<void> {
    try {
      await this.stop();
      this.statusCallback = null;
      this.isPlaying = false; // 清理時釋放鎖定
      this.wasPlayingBeforeDisconnect = false;
      
      // 取消網路監聽
      if (this.networkUnsubscribe) {
        this.networkUnsubscribe();
        this.networkUnsubscribe = null;
      }
    } catch (error) {
      console.error('Error cleaning up:', error);
      this.isPlaying = false; // 發生錯誤時也要釋放鎖定
    }
  }

  /**
   * 獲取播放狀態
   * Get playing state
   */
  static getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

