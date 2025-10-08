/**
 * mesonRadio - 網路廣播 APP
 * Internet Radio App
 */

import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, AppState } from 'react-native';
import { KeepAwake } from 'expo-keep-awake';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initializeI18n } from './src/utils/i18n';
import { AudioPlayerService } from './src/services/AudioPlayerService';
import { StorageManager } from './src/utils/StorageManager';
import { SmartSearchService } from './src/services/SmartSearchService';
import { Colors } from './src/constants/theme';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    initializeApp();

    // 監聽應用狀態變化
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      console.log('📱 App State changed:', nextAppState);
      
      // 檢查播放狀態
      const playing = AudioPlayerService.getIsPlaying();
      setIsPlaying(playing);
      
      if (nextAppState === 'background' && playing) {
        console.log('📱 App 進入後台，保持播放');
      } else if (nextAppState === 'active' && playing) {
        console.log('📱 App 返回前台，繼續播放');
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const initializeApp = async () => {
    try {
      // 初始化多語系
      await initializeI18n();

      // 初始化音訊播放器
      await AudioPlayerService.initialize();

      // 首次啟動時載入預設台灣電台
      await StorageManager.initializeDefaultStations();

      // 初始化 AI 搜尋服務
      await SmartSearchService.initialize();

      setIsReady(true);
    } catch (error) {
      console.error('Error initializing app:', error);
      setIsReady(true); // 即使錯誤也要顯示 UI
    }
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      {/* 當播放時保持喚醒 */}
      {isPlaying && <KeepAwake />}
      <AppNavigator />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});

