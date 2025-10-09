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
import { ForegroundService } from './ForegroundService';
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
  private static lastNotificationStatus: string = ''; // 追踪上次通知状态
  private static notificationUpdateTimer: NodeJS.Timeout | null = null; // 防抖计时器
  private static healthCheckInterval: NodeJS.Timeout | null = null; // 健康檢查計時器
  private static lastHealthCheckTime: number = 0; // 上次健康檢查時間
  private static isInitializing: boolean = false; // 正在初始化標誌（防止多個播放實體）
  private static playLock: boolean = false; // 播放方法鎖（防止並發調用）

  /**
   * 初始化音訊系統
   * Initialize audio system
   */
  static async initialize(): Promise<void> {
    try {
      // 初始化音訊系統 - 配置屏幕關閉時繼續播放
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,        // ⭐ 關鍵：後台繼續播放
        playsInSilentModeIOS: true,           // iOS 靜音模式下播放
        shouldDuckAndroid: false,              // Android 不降低其他音訊
        playThroughEarpieceAndroid: false,    // 不使用聽筒播放
        // Android 中斷模式：降低其他音訊音量（更穩定）
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        // iOS 中斷模式：降低其他音訊音量
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
      });
      
      console.log('✅ 音訊模式已配置（後台播放、屏幕關閉播放）');

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
      // 🔒 防止並發調用 - 如果已經在處理播放請求，忽略新請求
      if (this.playLock) {
        console.log('⚠️ Play already in progress, ignoring duplicate request');
        return;
      }
      
      this.playLock = true;
      console.log('🔒 Play lock acquired for station:', station.name);
      
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
      } finally {
        // 延遲釋放鎖，確保播放器完全初始化
        setTimeout(() => {
          this.playLock = false;
          console.log('🔓 Play lock released');
        }, 1000); // 1秒後釋放鎖
      }
    } catch (error) {
      console.error('Error playing station:', error);
      this.playLock = false; // 發生錯誤時立即釋放鎖
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
        
        // 🔒 防止多個播放實體同時初始化
        if (this.isInitializing) {
          console.log('⚠️ Sound initialization already in progress, waiting...');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // 如果還在初始化，跳過此次嘗試
          if (this.isInitializing) {
            console.log('⚠️ Still initializing, skipping duplicate attempt');
            continue;
          }
        }
        
        this.isInitializing = true;
        console.log('🔒 Sound initialization lock acquired');
        
        try {
          // 清理舊的 sound 對象
          if (this.sound) {
            try {
              await this.sound.unloadAsync();
              console.log('✅ Previous sound instance unloaded');
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
          console.log('✅ Sound instance created successfully');
          
          // 設置音頻會話為活躍狀態
          await sound.setStatusAsync({
            shouldPlay: true,
            volume: Config.DEFAULT_VOLUME,
          });
          
          await sound.playAsync();
          console.log('✅ 流媒體播放成功');

          // ⭐ 關鍵：激活保持喚醒（防止屏幕關閉時停止播放）
          try {
            await activateKeepAwakeAsync('audio-playback');
            console.log('✅ Keep Awake 已激活（屏幕關閉時繼續播放）');
          } catch (error) {
            console.warn('⚠️ Keep Awake 激活失敗:', error);
          }

          // ⭐⭐⭐ 啟動前台服務（最強保護）
          try {
            await ForegroundService.start(this.currentStation?.name || 'mesonRadio');
          } catch (error) {
            console.warn('⚠️ 前台服務啟動失敗:', error);
          }

          // 啟動健康檢查
          this.startHealthCheck();
          
          // 顯示媒體通知
          if (this.currentStation) {
            await MediaNotificationService.showNowPlaying(this.currentStation, true);
          }
          
          // 播放成功後保持播放狀態
          return; // 成功，退出重試循環
        } finally {
          // 🔓 釋放初始化鎖
          this.isInitializing = false;
          console.log('🔓 Sound initialization lock released');
        }
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
    this.stopHealthCheck(); // 停止健康檢查
    
      // 清除防抖計時器
      if (this.notificationUpdateTimer) {
        clearTimeout(this.notificationUpdateTimer);
        this.notificationUpdateTimer = null;
      }
      this.lastNotificationStatus = '';

      // 停用保持喚醒
      try {
        deactivateKeepAwake('audio-playback');
        console.log('✅ Keep Awake 已停用');
      } catch (error) {
        console.warn('⚠️ Keep Awake 停用失敗:', error);
      }

      // ⭐⭐⭐ 停止前台服務
      try {
        await ForegroundService.stop();
      } catch (error) {
        console.warn('⚠️ 前台服務停止失敗:', error);
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
      // 🔓 確保清除初始化鎖
      this.isInitializing = false;
      
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
        console.log('✅ Sound instance stopped and unloaded');
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
      this.sound = null; // 確保清除 sound 引用
      this.isInitializing = false; // 確保清除初始化鎖
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
        
        // 更新通知狀態（使用防抖，避免頻繁更新）
        this.updateNotificationDebounced('playing');
      } else if (status.isBuffering) {
        // Native 緩衝區需要更多數據
        if (!this.isBuffering) {
          const timeSinceLastPlaying = this.lastPlayingTime > 0 ? Date.now() - this.lastPlayingTime : 0;
          console.log(`⏸️ Buffering: waiting for more data from network... (${Math.floor(timeSinceLastPlaying / 1000)}s since last playing)`);
          this.isBuffering = true;
          this.startBufferingTimeout(); // 啟動緩衝超時檢測
        }
        this.notifyStatus(PlaybackStatus.BUFFERING);
        
        // 緩衝狀態不更新通知（避免頻繁閃爍）
        // 只在長時間緩衝時才更新
        // this.updateNotificationDebounced('buffering');
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
   * 防抖更新通知
   * Debounced notification update
   */
  private static updateNotificationDebounced(status: string): void {
    // 如果狀態未改變，不更新
    if (status === this.lastNotificationStatus) {
      return;
    }

    // 清除之前的計時器
    if (this.notificationUpdateTimer) {
      clearTimeout(this.notificationUpdateTimer);
    }

    // 設置新的計時器（500ms 防抖）
    this.notificationUpdateTimer = setTimeout(() => {
      if (this.currentStation && status !== this.lastNotificationStatus) {
        this.lastNotificationStatus = status;
        MediaNotificationService.updateNotification(this.currentStation, status)
          .catch(console.error);
      }
      this.notificationUpdateTimer = null;
    }, 500); // 500ms 防抖延遲
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
   * 啟動健康檢查
   * Start health check - 定期檢查播放狀態並自動恢復
   */
  private static startHealthCheck(): void {
    // 清除之前的健康檢查
    this.stopHealthCheck();
    
    console.log('🏥 啟動播放健康檢查（每30秒）');
    
    this.lastHealthCheckTime = Date.now();
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        const now = Date.now();
        
        // 如果應該播放但實際沒有在播放
        if (this.shouldKeepPlaying && !this.isUserStopped) {
          // 檢查是否有 sound 實例
          if (!this.sound) {
            console.warn('⚠️ 健康檢查: sound 實例不存在，嘗試恢復...');
            await this.startPlayback();
            this.lastHealthCheckTime = now;
            return;
          }
          
          // 檢查播放狀態
          try {
            const status = await this.sound.getStatusAsync();
            
            if (!status.isLoaded) {
              console.warn('⚠️ 健康檢查: sound 未加載，嘗試恢復...');
              await this.startPlayback();
            } else if (!status.isPlaying && !status.isBuffering && this.shouldKeepPlaying) {
              console.warn('⚠️ 健康檢查: 應該播放但已停止，嘗試恢復...');
              // 檢查是否長時間未播放（超過1分鐘）
              const timeSinceLastPlaying = this.lastPlayingTime > 0 ? now - this.lastPlayingTime : 0;
              if (timeSinceLastPlaying > 60000) {
                console.warn(`⚠️ 已停止播放 ${Math.floor(timeSinceLastPlaying / 1000)} 秒，強制恢復`);
                await this.startPlayback();
              }
            } else if (status.isPlaying) {
              // 播放正常，更新最後播放時間
              this.lastPlayingTime = now;
            }
          } catch (statusError) {
            console.error('❌ 健康檢查: 獲取狀態失敗', statusError);
            // 如果無法獲取狀態，可能 sound 實例已損壞，嘗試重新創建
            await this.startPlayback();
          }
        }
        
        this.lastHealthCheckTime = now;
      } catch (error) {
        console.error('❌ 健康檢查出錯:', error);
      }
    }, 30000); // 每30秒檢查一次
  }

  /**
   * 停止健康檢查
   * Stop health check
   */
  private static stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('🏥 健康檢查已停止');
    }
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
      console.log('🧹 Starting cleanup...');
      
      this.isUserStopped = true;
      this.shouldKeepPlaying = false;
      
      // 🔓 釋放所有鎖
      this.playLock = false;
      this.isInitializing = false;
      console.log('🔓 All locks released');
      
      this.clearRetryTimeout();
      this.clearBufferingTimeout();
      this.clearBufferingCheck();
      this.stopHealthCheck(); // 停止健康檢查
      
      // 清除防抖計時器
      if (this.notificationUpdateTimer) {
        clearTimeout(this.notificationUpdateTimer);
        this.notificationUpdateTimer = null;
      }
      this.lastNotificationStatus = '';
      
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
      
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('Error cleaning up:', error);
      this.isPlaying = false;
      this.playLock = false;
      this.isInitializing = false;
      this.sound = null;
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

