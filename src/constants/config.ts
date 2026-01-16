/**
 * 應用配置
 * Application Configuration
 */

export const Config = {
  // Radio Browser API for searching stations (最新端點)
  RADIO_BROWSER_API: 'https://de1.api.radio-browser.info/json',
  
  // Storage keys
  STORAGE_KEYS: {
    STATIONS: '@mesonRadio:stations',
    CURRENT_STATION: '@mesonRadio:currentStation',
    FAVORITES: '@mesonRadio:favorites',
    LANGUAGE: '@mesonRadio:language',
    VOLUME: '@mesonRadio:volume',
    INITIALIZED: '@mesonRadio:initialized',
  },
  
  // Default values
  DEFAULT_VOLUME: 1.0,
  MAX_SEARCH_RESULTS: 50,
  
  // Audio settings
  AUDIO_SETTINGS: {
    shouldPlay: true,
    shouldCorrectPitch: true,
    volume: 1.0,
    rate: 1.0,
    // 啟用漸進式下載和緩衝
    progressUpdateIntervalMillis: 500, // 緩衝狀態更新間隔
  },
  
  // Buffer settings (緩衝設定)
  BUFFER_CONFIG: {
    // Android 特定緩衝配置
    androidImplementation: 'MediaPlayer', // 或 'SimpleExoPlayer'
    // 緩衝策略
    preferredForwardBufferDuration: 5000, // 前向緩衝 5 秒
    // 狀態更新頻率
    progressUpdateInterval: 500, // 500ms 更新一次緩衝狀態
  },
  
  // Network retry settings
  NETWORK_RETRY: {
    maxAttemptsPerRequest: 3, // 每次請求的網路重試次數
    retryDelayBase: 500, // 基礎重試延遲（毫秒）
    streamRetryInterval: 2000, // 串流重試固定間隔（毫秒）- 每 2 秒一次（更積極）
    enableInfiniteRetry: true, // 啟用無限重試
    bufferingTimeout: 15000, // 緩衝超時時間（15秒，更短以便更快重試）
  },

  // AI API Keys (預設值，僅在用戶未設置時使用)
  // 注意：敏感資訊不應硬編碼在代碼中
  // 預設 API Key 應通過環境變數、.env 文件或運行時配置提供
  // 用戶應在應用中通過「設定」→「AI 設定」手動配置 API Key
  // 
  // 如需設置預設 API Key，請使用環境變數：
  // - 創建 .env 文件（已在 .gitignore 中）
  // - 設置 EXPO_PUBLIC_GROK_API_KEY=your-key-here
  // - 或在 app.config.js 的 extra 中配置
  AI_API_KEYS: {
    GROK: (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GROK_API_KEY) || '', // 從環境變數讀取
  },
};

