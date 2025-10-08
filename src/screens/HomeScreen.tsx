/**
 * 首頁畫面
 * Home Screen
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, InteractionManager } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PlayerControls } from '@/components/PlayerControls';
import { EmptyState } from '@/components/EmptyState';
import { AudioPlayerService } from '@/services/AudioPlayerService';
import { StorageManager } from '@/utils/StorageManager';
import { Station } from '@/models/Station';
import { PlaybackStatus } from '@/models/PlayerState';
import { Colors, Spacing } from '@/constants/theme';
import { t } from '@/utils/i18n';

export const HomeScreen: React.FC = () => {
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>(PlaybackStatus.IDLE);
  const [favoriteStations, setFavoriteStations] = useState<Station[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // 只設置狀態回調，不重複初始化（App.tsx 已初始化）
    AudioPlayerService.setStatusCallback(handleStatusChange);
    
    // 載入初始數據
    loadData();

    // 不需要 cleanup - 讓播放器在後台繼續運行
    return () => {
      // 只清除狀態回調，不停止播放
      AudioPlayerService.setStatusCallback(() => {});
    };
  }, []);

  // 每次頁面獲得焦點時重新載入資料
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // 移除 initializePlayer - 不需要在這裡重複初始化

  const loadData = async () => {
    try {
      const station = await StorageManager.getCurrentStation();
      setCurrentStation(station);

      const favorites = await StorageManager.getFavoriteStations();
      setFavoriteStations(favorites);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleStatusChange = (status: PlaybackStatus) => {
    setPlaybackStatus(status);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handlePlayPause = async () => {
    // 使用 InteractionManager 確保在主線程執行，避免線程錯誤
    InteractionManager.runAfterInteractions(async () => {
      try {
        if (playbackStatus === PlaybackStatus.PLAYING) {
          await AudioPlayerService.pause();
        } else if (playbackStatus === PlaybackStatus.PAUSED) {
          await AudioPlayerService.resume();
        } else if (currentStation) {
          await AudioPlayerService.play(currentStation);
        }
      } catch (error) {
        console.error('Error toggling playback:', error);
      }
    });
  };

  const handleStop = async () => {
    // 使用 InteractionManager 確保在主線程執行，避免線程錯誤
    InteractionManager.runAfterInteractions(async () => {
      try {
        await AudioPlayerService.stop();
      } catch (error) {
        console.error('Error stopping playback:', error);
      }
    });
  };

  const handlePrevious = async () => {
    try {
      if (favoriteStations.length === 0) return;

      const currentIndex = currentStation
        ? favoriteStations.findIndex(s => s.id === currentStation.id)
        : -1;
      
      const previousIndex =
        currentIndex <= 0 ? favoriteStations.length - 1 : currentIndex - 1;
      
      const previousStation = favoriteStations[previousIndex];
      setCurrentStation(previousStation);
      await StorageManager.setCurrentStation(previousStation);
      
      // 使用 InteractionManager 確保在主線程執行
      InteractionManager.runAfterInteractions(async () => {
        try {
          await AudioPlayerService.play(previousStation);
        } catch (error) {
          console.error('Error playing station:', error);
        }
      });
    } catch (error) {
      console.error('Error playing previous station:', error);
    }
  };

  const handleNext = async () => {
    try {
      if (favoriteStations.length === 0) return;

      const currentIndex = currentStation
        ? favoriteStations.findIndex(s => s.id === currentStation.id)
        : -1;
      
      const nextIndex =
        currentIndex >= favoriteStations.length - 1 ? 0 : currentIndex + 1;
      
      const nextStation = favoriteStations[nextIndex];
      setCurrentStation(nextStation);
      await StorageManager.setCurrentStation(nextStation);
      
      // 使用 InteractionManager 確保在主線程執行
      InteractionManager.runAfterInteractions(async () => {
        try {
          await AudioPlayerService.play(nextStation);
        } catch (error) {
          console.error('Error playing station:', error);
        }
      });
    } catch (error) {
      console.error('Error playing next station:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        <PlayerControls
          status={playbackStatus}
          stationName={currentStation?.name || null}
          onPlayPause={handlePlayPause}
          onStop={handleStop}
          onPrevious={handlePrevious}
          onNext={handleNext}
          canNavigate={favoriteStations.length > 0}
        />

        {!currentStation && (
          <EmptyState
            icon="radio-outline"
            title={t('home.noStation')}
            description={t('home.selectStation')}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: Spacing.md,
    flexGrow: 1,
  },
});

