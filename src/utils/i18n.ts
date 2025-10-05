/**
 * 多語系支援
 * Multi-language Support
 */

import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '@/constants/config';

// 繁體中文
const zh_TW = {
  common: {
    appName: 'mesonRadio',
    ok: '確定',
    cancel: '取消',
    save: '儲存',
    delete: '刪除',
    edit: '編輯',
    add: '新增',
    search: '搜尋',
    loading: '載入中...',
    error: '錯誤',
    success: '成功',
    confirm: '確認',
    back: '返回',
  },
  tabs: {
    home: '首頁',
    stations: '電台',
    favorites: '我的最愛',
    settings: '設定',
  },
  home: {
    title: 'mesonRadio',
    nowPlaying: '正在播放',
    noStation: '尚未選擇電台',
    selectStation: '請選擇一個電台開始播放',
  },
  stations: {
    title: '電台管理',
    myStations: '我的電台',
    addStation: '新增電台',
    searchStations: '搜尋電台',
    noStations: '尚未新增任何電台',
    addFirst: '點擊下方按鈕新增您的第一個電台',
    stationName: '電台名稱',
    stationUrl: '電台網址',
    stationType: '電台類型',
    radioStream: '網路廣播',
    podcast: 'Podcast',
    deleteConfirm: '確定要刪除這個電台嗎？',
    deleteSuccess: '電台已刪除',
    addSuccess: '電台已新增',
    updateSuccess: '電台已更新',
    selectIcon: '選擇圖示',
    manualAdd: '手動輸入',
    autoSearch: '自動搜尋',
  },
  favorites: {
    title: '我的最愛',
    noFavorites: '尚未加入任何最愛電台',
    addFavorites: '在電台列表中點擊星號圖示將電台加入最愛',
    addedToFavorites: '已加入最愛',
    removedFromFavorites: '已從最愛移除',
  },
  player: {
    play: '播放',
    pause: '暫停',
    stop: '停止',
    previous: '上一個',
    next: '下一個',
    volume: '音量',
    loading: '正在載入...',
    buffering: '緩衝中...',
    error: '播放錯誤',
    errorMessage: '無法播放此電台，請檢查網址是否正確',
    noFavorites: '沒有最愛電台可切換',
  },
  search: {
    title: '搜尋電台',
    searchPlaceholder: '輸入電台名稱、國家或標籤',
    results: '搜尋結果',
    noResults: '找不到相關電台',
    searching: '搜尋中...',
    selectAll: '全選',
    deselectAll: '取消全選',
    addSelected: '新增選取的電台',
    selected: '已選取',
  },
  settings: {
    title: '設定',
    language: '語言',
    about: '關於',
    version: '版本',
    chineseTraditional: '繁體中文',
    english: 'English',
    vietnamese: 'Tiếng Việt',
  },
};

// English
const en = {
  common: {
    appName: 'mesonRadio',
    ok: 'OK',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    confirm: 'Confirm',
    back: 'Back',
  },
  tabs: {
    home: 'Home',
    stations: 'Stations',
    favorites: 'Favorites',
    settings: 'Settings',
  },
  home: {
    title: 'mesonRadio',
    nowPlaying: 'Now Playing',
    noStation: 'No Station Selected',
    selectStation: 'Please select a station to start playing',
  },
  stations: {
    title: 'Station Management',
    myStations: 'My Stations',
    addStation: 'Add Station',
    searchStations: 'Search Stations',
    noStations: 'No stations added yet',
    addFirst: 'Tap the button below to add your first station',
    stationName: 'Station Name',
    stationUrl: 'Station URL',
    stationType: 'Station Type',
    radioStream: 'Radio Stream',
    podcast: 'Podcast',
    deleteConfirm: 'Are you sure you want to delete this station?',
    deleteSuccess: 'Station deleted',
    addSuccess: 'Station added',
    updateSuccess: 'Station updated',
    selectIcon: 'Select Icon',
    manualAdd: 'Manual Input',
    autoSearch: 'Auto Search',
  },
  favorites: {
    title: 'Favorites',
    noFavorites: 'No favorite stations yet',
    addFavorites: 'Tap the star icon in station list to add favorites',
    addedToFavorites: 'Added to favorites',
    removedFromFavorites: 'Removed from favorites',
  },
  player: {
    play: 'Play',
    pause: 'Pause',
    stop: 'Stop',
    previous: 'Previous',
    next: 'Next',
    volume: 'Volume',
    loading: 'Loading...',
    buffering: 'Buffering...',
    error: 'Playback Error',
    errorMessage: 'Unable to play this station, please check the URL',
    noFavorites: 'No favorite stations to switch',
  },
  search: {
    title: 'Search Stations',
    searchPlaceholder: 'Enter station name, country or tags',
    results: 'Search Results',
    noResults: 'No stations found',
    searching: 'Searching...',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    addSelected: 'Add Selected Stations',
    selected: 'Selected',
  },
  settings: {
    title: 'Settings',
    language: 'Language',
    about: 'About',
    version: 'Version',
    chineseTraditional: '繁體中文',
    english: 'English',
    vietnamese: 'Tiếng Việt',
  },
};

// Vietnamese
const vi = {
  common: {
    appName: 'mesonRadio',
    ok: 'OK',
    cancel: 'Hủy',
    save: 'Lưu',
    delete: 'Xóa',
    edit: 'Sửa',
    add: 'Thêm',
    search: 'Tìm kiếm',
    loading: 'Đang tải...',
    error: 'Lỗi',
    success: 'Thành công',
    confirm: 'Xác nhận',
    back: 'Quay lại',
  },
  tabs: {
    home: 'Trang chủ',
    stations: 'Đài',
    favorites: 'Yêu thích',
    settings: 'Cài đặt',
  },
  home: {
    title: 'mesonRadio',
    nowPlaying: 'Đang phát',
    noStation: 'Chưa chọn đài',
    selectStation: 'Vui lòng chọn một đài để bắt đầu phát',
  },
  stations: {
    title: 'Quản lý đài',
    myStations: 'Đài của tôi',
    addStation: 'Thêm đài',
    searchStations: 'Tìm đài',
    noStations: 'Chưa có đài nào',
    addFirst: 'Nhấn nút bên dưới để thêm đài đầu tiên',
    stationName: 'Tên đài',
    stationUrl: 'URL đài',
    stationType: 'Loại đài',
    radioStream: 'Đài phát thanh',
    podcast: 'Podcast',
    deleteConfirm: 'Bạn có chắc chắn muốn xóa đài này?',
    deleteSuccess: 'Đã xóa đài',
    addSuccess: 'Đã thêm đài',
    updateSuccess: 'Đã cập nhật đài',
    selectIcon: 'Chọn biểu tượng',
    manualAdd: 'Nhập thủ công',
    autoSearch: 'Tự động tìm',
  },
  favorites: {
    title: 'Yêu thích',
    noFavorites: 'Chưa có đài yêu thích',
    addFavorites: 'Nhấn biểu tượng ngôi sao trong danh sách đài để thêm vào yêu thích',
    addedToFavorites: 'Đã thêm vào yêu thích',
    removedFromFavorites: 'Đã xóa khỏi yêu thích',
  },
  player: {
    play: 'Phát',
    pause: 'Tạm dừng',
    stop: 'Dừng',
    previous: 'Trước',
    next: 'Sau',
    volume: 'Âm lượng',
    loading: 'Đang tải...',
    buffering: 'Đang đệm...',
    error: 'Lỗi phát',
    errorMessage: 'Không thể phát đài này, vui lòng kiểm tra URL',
    noFavorites: 'Không có đài yêu thích để chuyển',
  },
  search: {
    title: 'Tìm đài',
    searchPlaceholder: 'Nhập tên đài, quốc gia hoặc thẻ',
    results: 'Kết quả tìm kiếm',
    noResults: 'Không tìm thấy đài',
    searching: 'Đang tìm...',
    selectAll: 'Chọn tất cả',
    deselectAll: 'Bỏ chọn tất cả',
    addSelected: 'Thêm đài đã chọn',
    selected: 'Đã chọn',
  },
  settings: {
    title: 'Cài đặt',
    language: 'Ngôn ngữ',
    about: 'Về ứng dụng',
    version: 'Phiên bản',
    chineseTraditional: '繁體中文',
    english: 'English',
    vietnamese: 'Tiếng Việt',
  },
};

const i18n = new I18n({ 'zh-TW': zh_TW, en, vi });

// Set default locale to Traditional Chinese
i18n.defaultLocale = 'zh-TW';
i18n.locale = 'zh-TW';
i18n.enableFallback = true;

export const initializeI18n = async (): Promise<void> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(Config.STORAGE_KEYS.LANGUAGE);
    if (savedLanguage) {
      i18n.locale = savedLanguage;
    } else {
      // Auto-detect device language
      const deviceLocale = Localization.locale || Localization.getLocales()?.[0]?.languageTag || 'zh-TW';
      if (deviceLocale && deviceLocale.startsWith('zh')) {
        i18n.locale = 'zh-TW';
      } else if (deviceLocale && deviceLocale.startsWith('vi')) {
        i18n.locale = 'vi';
      } else {
        i18n.locale = 'en';
      }
    }
  } catch (error) {
    console.error('Error initializing i18n:', error);
    // 發生錯誤時使用預設語言
    i18n.locale = 'zh-TW';
  }
};

// 語言變更監聽器
type LanguageChangeListener = (language: string) => void;
let languageChangeListeners: LanguageChangeListener[] = [];

export const addLanguageChangeListener = (listener: LanguageChangeListener): (() => void) => {
  languageChangeListeners.push(listener);
  // 返回移除監聽器的函數
  return () => {
    languageChangeListeners = languageChangeListeners.filter(l => l !== listener);
  };
};

export const changeLanguage = async (language: string): Promise<void> => {
  try {
    i18n.locale = language;
    await AsyncStorage.setItem(Config.STORAGE_KEYS.LANGUAGE, language);
    // 通知所有監聽器
    languageChangeListeners.forEach(listener => listener(language));
  } catch (error) {
    console.error('Error changing language:', error);
    throw error;
  }
};

export const t = (key: string, options?: object): string => {
  return i18n.t(key, options);
};

export default i18n;

