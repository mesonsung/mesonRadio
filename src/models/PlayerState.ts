/**
 * 播放器狀態模型
 * Player State Model
 */

import { Station } from './Station';

export interface PlayerState {
  currentStation: Station | null;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  volume: number;
}

export enum PlaybackStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  ERROR = 'ERROR',
  BUFFERING = 'BUFFERING'
}

