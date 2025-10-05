/**
 * 應用配置
 * Application Configuration
 */

export const Config = {
  // Radio Browser API for searching stations
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
  },
};

