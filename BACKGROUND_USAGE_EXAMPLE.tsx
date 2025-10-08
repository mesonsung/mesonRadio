/**
 * 背景播放使用示例
 * Background Playback Usage Example
 * 
 * 這個文件展示如何在您的組件中使用後台播放功能
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { AudioPlayerService } from '@/services/AudioPlayerService';
import { PlaybackStatus } from '@/models/PlayerState';
import type { Station } from '@/models/Station';

export default function BackgroundPlaybackExample() {
  const [status, setStatus] = useState<PlaybackStatus>(PlaybackStatus.IDLE);
  const [currentStation, setCurrentStation] = useState<Station | null>(null);

  // 範例電台數據
  const exampleStation: Station = {
    id: '1',
    name: '測試電台',
    url: 'https://example.com/stream.mp3',
    type: 'radio',
    language: 'zh-TW',
    country: 'TW',
    tags: ['music'],
  };

  // 1️⃣ 初始化音訊系統
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        console.log('🎵 初始化音訊系統...');
        await AudioPlayerService.initialize();
        console.log('✅ 音訊系統初始化成功');
        Alert.alert('成功', '音訊系統已就緒！\n已啟用：\n- 後台播放\n- 媒體通知\n- 網路重試');
      } catch (error) {
        console.error('❌ 初始化失敗:', error);
        Alert.alert('錯誤', '音訊系統初始化失敗');
      }
    };

    initializeAudio();

    // 清理資源
    return () => {
      console.log('🧹 清理音訊資源...');
      AudioPlayerService.cleanup();
    };
  }, []);

  // 2️⃣ 監聽播放狀態變化
  useEffect(() => {
    // 設置狀態回調
    AudioPlayerService.setStatusCallback((newStatus: PlaybackStatus) => {
      console.log('📊 播放狀態變化:', newStatus);
      setStatus(newStatus);
    });

    return () => {
      AudioPlayerService.setStatusCallback(() => {});
    };
  }, []);

  // 3️⃣ 播放電台
  const handlePlay = async () => {
    try {
      console.log('▶️ 開始播放:', exampleStation.name);
      await AudioPlayerService.play(exampleStation);
      setCurrentStation(exampleStation);
      
      Alert.alert(
        '播放中',
        '✅ 已開始播放\n✅ 通知已顯示\n✅ 可切換至後台\n✅ 網路自動重試已啟用'
      );
    } catch (error) {
      console.error('❌ 播放失敗:', error);
      Alert.alert('錯誤', '播放失敗');
    }
  };

  // 4️⃣ 暫停播放
  const handlePause = async () => {
    try {
      console.log('⏸️ 暫停播放');
      await AudioPlayerService.pause();
      Alert.alert('暫停', '播放已暫停\n通知狀態已更新');
    } catch (error) {
      console.error('❌ 暫停失敗:', error);
    }
  };

  // 5️⃣ 恢復播放
  const handleResume = async () => {
    try {
      console.log('▶️ 恢復播放');
      await AudioPlayerService.resume();
      Alert.alert('恢復', '播放已恢復\n通知狀態已更新');
    } catch (error) {
      console.error('❌ 恢復失敗:', error);
    }
  };

  // 6️⃣ 停止播放
  const handleStop = async () => {
    try {
      console.log('🛑 停止播放');
      await AudioPlayerService.stop();
      setCurrentStation(null);
      Alert.alert('停止', '播放已停止\n通知已隱藏');
    } catch (error) {
      console.error('❌ 停止失敗:', error);
    }
  };

  // 7️⃣ 模擬網路斷線（測試用）
  const simulateNetworkIssue = () => {
    Alert.alert(
      '測試網路重試',
      '請執行以下步驟測試：\n\n' +
      '1. 點擊「播放」按鈕\n' +
      '2. 按下 Home 鍵（應用進入後台）\n' +
      '3. 關閉 Wi-Fi 和行動網路\n' +
      '4. 等待 5-10 秒\n' +
      '5. 重新開啟網路\n' +
      '6. ✅ 應自動恢復播放'
    );
  };

  // 狀態顯示文字
  const getStatusText = () => {
    switch (status) {
      case PlaybackStatus.IDLE:
        return '閒置';
      case PlaybackStatus.LOADING:
        return '載入中...';
      case PlaybackStatus.BUFFERING:
        return '緩衝中...（自動重試）';
      case PlaybackStatus.PLAYING:
        return '▶ 播放中';
      case PlaybackStatus.PAUSED:
        return '⏸ 已暫停';
      case PlaybackStatus.ERROR:
        return '❌ 錯誤（將自動重試）';
      default:
        return '未知';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎵 背景播放測試</Text>
      
      {/* 狀態顯示 */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>當前狀態：</Text>
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>

      {/* 當前電台 */}
      {currentStation && (
        <View style={styles.stationContainer}>
          <Text style={styles.stationLabel}>正在播放：</Text>
          <Text style={styles.stationName}>{currentStation.name}</Text>
        </View>
      )}

      {/* 控制按鈕 */}
      <View style={styles.buttonContainer}>
        <Button
          title="▶️ 播放"
          onPress={handlePlay}
          disabled={status === PlaybackStatus.PLAYING}
        />
        
        <View style={styles.buttonSpacer} />
        
        <Button
          title="⏸️ 暫停"
          onPress={handlePause}
          disabled={status !== PlaybackStatus.PLAYING}
        />
        
        <View style={styles.buttonSpacer} />
        
        <Button
          title="▶️ 恢復"
          onPress={handleResume}
          disabled={status !== PlaybackStatus.PAUSED}
        />
        
        <View style={styles.buttonSpacer} />
        
        <Button
          title="🛑 停止"
          onPress={handleStop}
          disabled={status === PlaybackStatus.IDLE}
          color="red"
        />
      </View>

      {/* 測試功能 */}
      <View style={styles.testContainer}>
        <Text style={styles.testTitle}>測試功能：</Text>
        <Button
          title="📡 測試網路重試"
          onPress={simulateNetworkIssue}
        />
      </View>

      {/* 功能說明 */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>✅ 已啟用功能：</Text>
        <Text style={styles.infoItem}>• 後台持續播放</Text>
        <Text style={styles.infoItem}>• 媒體控制通知</Text>
        <Text style={styles.infoItem}>• 自動網路重試</Text>
        <Text style={styles.infoItem}>• 網路斷線自動重連</Text>
        <Text style={styles.infoItem}>• 前台服務保持運行</Text>
      </View>

      {/* 使用提示 */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 使用提示：</Text>
        <Text style={styles.tipsText}>
          1. 點擊「播放」後，可按 Home 鍵將應用切換至後台
        </Text>
        <Text style={styles.tipsText}>
          2. 通知欄會顯示媒體控制通知
        </Text>
        <Text style={styles.tipsText}>
          3. 網路斷線時會自動重試，無需手動操作
        </Text>
        <Text style={styles.tipsText}>
          4. 網路恢復時會自動重新連接
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  stationContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stationLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  buttonSpacer: {
    height: 10,
  },
  testContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoContainer: {
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2e7d32',
  },
  infoItem: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 5,
  },
  tipsContainer: {
    backgroundColor: '#fff3e0',
    padding: 15,
    borderRadius: 10,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#e65100',
  },
  tipsText: {
    fontSize: 13,
    color: '#e65100',
    marginBottom: 5,
  },
});
