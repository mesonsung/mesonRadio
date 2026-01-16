/**
 * 預設台灣電台列表
 * Default Taiwan Radio Stations
 * 使用 HTTP/HTTPS 串流協定，與 expo-av 完全相容
 * 
 * 最後更新：2025-01-XX
 * 已驗證所有電台 URL 有效性
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
    name: 'RTI 中央廣播',
    url: 'https://streamak0138.akamaized.net/live0138lh-mbm9/_definst_/rti3/chunklist.m3u8',
    type: 'radio',
  },
  {
    name: '警察廣播電台',
    url: 'http://stream.pbs.gov.tw:1935/live/TPS/playlist.m3u8',
    type: 'radio',
  },

  // 音樂頻道
  {
    name: '古典音樂台 FM 97.7',
    url: 'http://59.120.88.155:8000/live.mp3',
    type: 'radio',
  },
  {
    name: 'TAIWAN LOUNGE RADIO',
    url: 'https://azuracast.conceptradio.fr/radio/8030/stream.mp3',
    type: 'radio',
  },
  {
    name: '1766線上電台-音樂頻道',
    url: 'http://livestream.1766.today:1769/live1.mp3',
    type: 'radio',
  },
  {
    name: 'Kiss Radio 99.9',
    url: 'https://www.kiss.com.tw/test/hichannel2.php?api=1',
    type: 'radio',
  },

  // 綜合頻道
  {
    name: '台北廣播電台',
    url: 'https://stream.ginnet.cloud/live0130lo-yfyo/_definst_/fm/playlist.m3u8',
    type: 'radio',
  },
  {
    name: '台北廣播電台 AM',
    url: 'https://stream.ginnet.cloud/live0130lo-yfyo/_definst_/am/playlist.m3u8',
    type: 'radio',
  },
];

