/**
 * 音訊播放服務
 * Audio Player Service
 * 
 * 功能：
 * - 播放電台音訊
 * - 自動重連機制
 * - 持續播放直到使用者停止
 */

import { Audio, AVPlaybackStatus, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Station } from '@/models/Station';
import { PlaybackStatus } from '@/models/PlayerState';
import { Config } from '@/constants/config';
import { MediaNotificationService } from './MediaNotificationService';
import { BackgroundTaskService } from './BackgroundTaskService';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

export class AudioPlayerService {
  private static sound: Audio.Sound | null = null;
  private static currentStation: Station | null = null;
  private static statusCallback: ((status: PlaybackStatus) => void) | null = null;
  private static isPlaying: boolean = false; // 播放鎖定標誌
  private static shouldKeepPlaying: boolean = false; // 是否應該持續播放
  private static retryCount: number = 0; // 重試次數
  private static retryTimeout: NodeJS.Timeout | null = null; // 重試計時器
  private static isUserStopped: boolean = false; // 是否由使用者停止
  private static isBuffering: boolean = false; // 是否正在緩衝
  private static lastBufferUpdate: number = 0; // 上次緩衝更新時間
  private static bufferingStartTime: number = 0; // 緩衝開始時間
  private static bufferingTimeoutId: NodeJS.Timeout | null = null; // 緩衝超時計時器
  private static lastPlayingTime: number = 0; // 上次播放時間
  private static bufferingCheckInterval: NodeJS.Timeout | null = null; // 緩衝檢查計時器

  /**
   * 初始化音訊系統
   * Initialize audio system
   */
  static async initialize(): Promise<void> {
    try {
      // 初始化音訊系統 - 配置屏幕關閉時繼續播放
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        // Android 中斷模式：不暫停播放
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        // iOS 中斷模式：混音或繼續播放
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      });

      // 初始化媒體通知服務
      await MediaNotificationService.initialize();

      // 初始化後台任務服務
      await BackgroundTaskService.initialize();

      // 設置網路狀態變化回調
      BackgroundTaskService.setNetworkCallback((isConnected) => {
        console.log('📡 網路連接狀態變化:', isConnected ? '已連接' : '已斷開');
        
        // 如果網路恢復且應該持續播放，嘗試重新連接
        if (isConnected && this.shouldKeepPlaying && !this.isUserStopped && !this.isPlaying) {
          console.log('🔄 網路恢復，嘗試重新連接...');
          this.handlePlaybackError(new Error('Network reconnected'));
        }
      });

      console.log('✅ 音訊系統初始化成功（含後台支持）');
    } catch (error) {
      console.error('Error initializing audio:', error);
      throw error;
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
    try {
      console.log('User triggered play for station:', station.name);
      
      // 清除重試計時器
      this.clearRetryTimeout();
      
      // 重置狀態
      this.isUserStopped = false;
      this.shouldKeepPlaying = true;
      this.retryCount = 0;
      
      // 停止當前播放（不重置 shouldKeepPlaying）
      await this.stopInternal();

      this.currentStation = station;
      this.isPlaying = true;
      
      // 開始播放
      await this.startPlayback();
    } catch (error) {
      console.error('Error playing station:', error);
      this.handlePlaybackError(error);
    }
  }

  /**
   * 開始播放流程
   * Start playback process
   */
  private static async startPlayback(): Promise<void> {
    if (!this.currentStation || this.isUserStopped) {
      return;
    }

    try {
      this.notifyStatus(PlaybackStatus.LOADING);
      console.log(`Starting playback (attempt ${this.retryCount + 1}):`, this.currentStation.name);

      // 處理 Podcast URL
      if (this.currentStation.type === 'podcast') {
        await this.playPodcast(this.currentStation.url);
      } else {
        await this.playRadioStream(this.currentStation.url);
      }

      // 播放成功，重置重試計數
      this.retryCount = 0;
    } catch (error) {
      console.error('Error in startPlayback:', error);
      this.handlePlaybackError(error);
    }
  }

  /**
   * 播放網路廣播流（帶網路重試）
   * Play radio stream with network retry
   */
  private static async playRadioStream(url: string): Promise<void> {
    const maxNetworkRetries = Config.NETWORK_RETRY.maxAttemptsPerRequest;
    const baseDelay = Config.NETWORK_RETRY.retryDelayBase;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxNetworkRetries; attempt++) {
      try {
        console.log(`Network attempt ${attempt}/${maxNetworkRetries} for URL: ${url}`);
        
        // 清理舊的 sound 對象
        if (this.sound) {
          try {
            await this.sound.unloadAsync();
          } catch (e) {
            console.log('Error unloading previous sound:', e);
          }
          this.sound = null;
        }

        // 創建音訊對象，設置流式播放和緩衝參數
        const { sound } = await Audio.Sound.createAsync(
          { 
            uri: url,
            // 使用漸進式下載模式，支持流式播放
            overrideFileExtensionAndroid: 'mp3', // 優化 Android 流式播放
          },
          { 
            shouldPlay: true, 
            volume: Config.DEFAULT_VOLUME,
            // 緩衝狀態更新間隔
            progressUpdateIntervalMillis: Config.BUFFER_CONFIG.progressUpdateInterval,
            positionMillis: 0,
            // 音質設定
            rate: 1.0,
            shouldCorrectPitch: true,
            pitchCorrectionQuality: Audio.PitchCorrectionQuality.High,
            // 允許在背景播放
            isLooping: false,
          },
          this.onPlaybackStatusUpdate.bind(this)
        );

        this.sound = sound;
        await sound.playAsync();
        console.log('Stream playing successfully');
        
        // 激活保持喚醒（防止屏幕關閉時停止播放）
        try {
          await activateKeepAwakeAsync('audio-playback');
          console.log('✅ Keep Awake 已激活（屏幕關閉時繼續播放）');
        } catch (error) {
          console.warn('⚠️ Keep Awake 激活失敗:', error);
        }
        
        // 顯示媒體通知
        if (this.currentStation) {
          await MediaNotificationService.showNowPlaying(this.currentStation, true);
        }
        
        // 播放成功後保持播放狀態
        return; // 成功，退出重試循環
      } catch (error) {
        lastError = error;
        console.error(`Network attempt ${attempt} failed:`, error);
        
        // 如果不是最後一次嘗試，短暫等待後重試
        if (attempt < maxNetworkRetries) {
          const retryDelay = baseDelay * attempt;
          console.log(`Waiting ${retryDelay}ms before network retry...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    // 所有網路重試都失敗，拋出錯誤讓上層重試機制接手
    console.error('All network attempts failed, will retry at stream level');
    throw lastError || new Error('Network request failed');
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
        
        // 更新通知狀態
        if (this.currentStation) {
          await MediaNotificationService.showNowPlaying(this.currentStation, false);
        }
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
        
        // 更新通知狀態
        if (this.currentStation) {
          await MediaNotificationService.showNowPlaying(this.currentStation, true);
        }
      }
    } catch (error) {
      console.error('Error resuming:', error);
      throw error;
    }
  }

  /**
   * 停止播放（使用者觸發）
   * Stop playback (user triggered)
   */
  static async stop(): Promise<void> {
    console.log('🛑 User stopped playback');
    this.isUserStopped = true;
    this.shouldKeepPlaying = false;
    this.clearRetryTimeout();
    this.clearBufferingTimeout();
    this.clearBufferingCheck();
    
    // 停用保持喚醒
    try {
      deactivateKeepAwake('audio-playback');
      console.log('✅ Keep Awake 已停用');
    } catch (error) {
      console.warn('⚠️ Keep Awake 停用失敗:', error);
    }
    
    // 隱藏媒體通知
    await MediaNotificationService.hideNotification();
    
    await this.stopInternal();
  }

  /**
   * 內部停止播放方法
   * Internal stop method
   */
  private static async stopInternal(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
      this.isPlaying = false;
      
      // 只有在使用者停止時才清除電台和通知 IDLE
      if (this.isUserStopped) {
        this.currentStation = null;
        this.notifyStatus(PlaybackStatus.IDLE);
      }
    } catch (error) {
      console.error('Error stopping:', error);
      this.isPlaying = false;
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
   * 
   * 監控流媒體緩衝狀態：
   * - 網路接收數據 → Native Buffer → 解碼器 → 播放
   * - isBuffering: Native 層緩衝區需要更多數據
   * - playableDurationMillis: 已緩衝的可播放時長
   */
  private static onPlaybackStatusUpdate(status: AVPlaybackStatus): void {
    if (status.isLoaded) {
      // 記錄緩衝資訊（用於診斷）
      const now = Date.now();
      if (now - this.lastBufferUpdate > 2000) { // 每 2 秒記錄一次
        const bufferInfo = {
          isPlaying: status.isPlaying,
          isBuffering: status.isBuffering,
          playableDuration: status.playableDurationMillis || 0,
          position: status.positionMillis || 0,
          duration: status.durationMillis || 0,
        };
        console.log('Buffer status:', bufferInfo);
        this.lastBufferUpdate = now;
      }

      if (status.isPlaying) {
        // 正在從緩衝區播放數據
        if (this.isBuffering) {
          const bufferingDuration = Date.now() - this.bufferingStartTime;
          console.log(`✅ Buffer filled after ${bufferingDuration}ms, resuming playback`);
          this.isBuffering = false;
          this.clearBufferingTimeout(); // 清除緩衝超時計時器
          this.clearBufferingCheck(); // 清除緩衝檢查計時器
        }
        this.lastPlayingTime = Date.now();
        this.notifyStatus(PlaybackStatus.PLAYING);
        
        // 更新通知狀態
        if (this.currentStation) {
          MediaNotificationService.updateNotification(this.currentStation, 'playing').catch(console.error);
        }
      } else if (status.isBuffering) {
        // Native 緩衝區需要更多數據
        if (!this.isBuffering) {
          const timeSinceLastPlaying = this.lastPlayingTime > 0 ? Date.now() - this.lastPlayingTime : 0;
          console.log(`⏸️ Buffering: waiting for more data from network... (${Math.floor(timeSinceLastPlaying / 1000)}s since last playing)`);
          this.isBuffering = true;
          this.startBufferingTimeout(); // 啟動緩衝超時檢測
        }
        this.notifyStatus(PlaybackStatus.BUFFERING);
        
        // 更新通知狀態
        if (this.currentStation) {
          MediaNotificationService.updateNotification(this.currentStation, 'buffering').catch(console.error);
        }
      } else if (status.didJustFinish) {
        // 串流結束，嘗試重連
        console.log('📡 Stream finished, attempting to reconnect...');
        this.clearBufferingTimeout();
        this.clearBufferingCheck();
        this.handlePlaybackError(new Error('Stream ended'));
      }
    } else if (status.error) {
      console.error('Playback error:', status.error);
      this.handlePlaybackError(new Error(status.error));
    }
  }

  /**
   * 處理播放錯誤
   * Handle playback error
   */
  private static handlePlaybackError(error: any): void {
    console.log('⚠️ Handling playback error:', error.message || error);

    // 清除緩衝相關計時器
    this.clearBufferingTimeout();
    this.clearBufferingCheck();

    // 如果使用者已停止，不嘗試重連
    if (this.isUserStopped || !this.shouldKeepPlaying) {
      console.log('❌ User stopped or should not keep playing, not retrying');
      this.notifyStatus(PlaybackStatus.ERROR);
      return;
    }

    // 固定間隔重試（從配置讀取）
    const delay = Config.NETWORK_RETRY.streamRetryInterval;
    this.retryCount++;

    console.log(`🔄 Scheduling retry #${this.retryCount} in ${delay}ms (${delay/1000} seconds)`);
    this.notifyStatus(PlaybackStatus.BUFFERING);

    // 清除之前的計時器
    this.clearRetryTimeout();

    // 設定重試計時器
    this.retryTimeout = setTimeout(async () => {
      if (this.shouldKeepPlaying && !this.isUserStopped) {
        console.log(`▶️ Executing retry #${this.retryCount}...`);
        await this.startPlayback();
      }
    }, delay);
  }

  /**
   * 清除重試計時器
   * Clear retry timeout
   */
  private static clearRetryTimeout(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  /**
   * 啟動緩衝超時檢測
   * Start buffering timeout detection
   */
  private static startBufferingTimeout(): void {
    // 清除之前的計時器
    this.clearBufferingTimeout();
    
    this.bufferingStartTime = Date.now();
    const timeout = Config.NETWORK_RETRY.bufferingTimeout || 15000;
    
    this.bufferingTimeoutId = setTimeout(() => {
      const bufferingDuration = Date.now() - this.bufferingStartTime;
      console.warn(`⚠️ Buffering timeout after ${bufferingDuration}ms, restarting playback...`);
      
      // 緩衝超時，嘗試重新播放
      if (this.shouldKeepPlaying && !this.isUserStopped) {
        this.handlePlaybackError(new Error('Buffering timeout'));
      }
    }, timeout);

    // 啟動定期檢查（每 5 秒檢查一次）
    this.startBufferingCheck();
  }

  /**
   * 啟動定期緩衝檢查
   * Start periodic buffering check
   */
  private static startBufferingCheck(): void {
    this.clearBufferingCheck();
    
    this.bufferingCheckInterval = setInterval(() => {
      if (this.isBuffering && this.shouldKeepPlaying && !this.isUserStopped) {
        const bufferingDuration = Date.now() - this.bufferingStartTime;
        console.log(`🔄 Still buffering... Duration: ${Math.floor(bufferingDuration / 1000)}s`);
        
        // 如果緩衝超過 10 秒，嘗試重新連接
        if (bufferingDuration > 10000) {
          console.warn(`⚠️ Buffering too long (${Math.floor(bufferingDuration / 1000)}s), attempting reconnect...`);
          this.clearBufferingTimeout();
          this.clearBufferingCheck();
          this.handlePlaybackError(new Error('Prolonged buffering'));
        }
      }
    }, 5000); // 每 5 秒檢查一次
  }

  /**
   * 清除緩衝檢查計時器
   * Clear buffering check interval
   */
  private static clearBufferingCheck(): void {
    if (this.bufferingCheckInterval) {
      clearInterval(this.bufferingCheckInterval);
      this.bufferingCheckInterval = null;
    }
  }

  /**
   * 清除緩衝超時計時器
   * Clear buffering timeout
   */
  private static clearBufferingTimeout(): void {
    if (this.bufferingTimeoutId) {
      clearTimeout(this.bufferingTimeoutId);
      this.bufferingTimeoutId = null;
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
      this.isUserStopped = true;
      this.shouldKeepPlaying = false;
      this.clearRetryTimeout();
      this.clearBufferingTimeout();
      this.clearBufferingCheck();
      
      // 停用保持喚醒
      try {
        deactivateKeepAwake('audio-playback');
      } catch (error) {
        console.warn('Keep Awake cleanup warning:', error);
      }
      
      // 清理通知服務
      await MediaNotificationService.cleanup();
      
      // 清理後台任務服務
      await BackgroundTaskService.cleanup();
      
      await this.stopInternal();
      this.statusCallback = null;
      this.retryCount = 0;
    } catch (error) {
      console.error('Error cleaning up:', error);
      this.isPlaying = false;
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

