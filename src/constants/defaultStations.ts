/**
 * 預設台灣電台列表
 * Default Taiwan Radio Stations
 * 使用 HTTP/HTTPS 串流協定，與 expo-av 完全相容
 */

import { StationFormData } from '@/models/Station';

export const DEFAULT_TAIWAN_STATIONS: StationFormData[] = [
  // 新聞資訊
  {
    name: 'News98 新聞網',
    url: 'https://stream.rcs.revma.com/srn5f9kmwxhvv',
    type: 'radio',
  },
  {
    name: '中廣新聞網',
    url: 'https://n12.rcs.revma.com/fgtx07f3qtzuv',
    type: 'radio',
  },
  {
    name: '國聲廣播 AM1179',
    url: 'http://43.254.16.40:8000/CH.AM1179',
    type: 'radio',
  },

  // 音樂頻道
  {
    name: '非凡音廣播電台 FM98.5',
    url: 'http://43.254.16.40:8000/TC.FM98.5',
    type: 'radio',
  },
  {
    name: '每日廣播電台 FM98.7',
    url: 'http://43.254.16.40:8000/TC.FM98.7',
    type: 'radio',
  },
  {
    name: '城市廣播 FM98.3',
    url: 'http://fm983.cityfm.tw:8080/983.mp3',
    type: 'radio',
  },
  {
    name: '古典音樂台',
    url: 'http://59.120.88.155:8000/live.mp3',
    type: 'radio',
  },

  // 交通資訊
  {
    name: '警廣 全國治安交通網',
    url: 'https://stream.pbs.gov.tw/live/PBS/playlist.m3u8',
    type: 'radio',
  },
];

