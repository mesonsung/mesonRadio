/**
 * AI 語音助手畫面
 * AI Voice Assistant Screen
 * 
 * 功能：
 * - 語音命令收聽電台
 * - AI 智能識別並播放
 * - 實時反饋和動畫
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Alert,
  FlatList,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { VoiceCommandService } from '@/services/VoiceCommandService';
import { SmartSearchService } from '@/services/SmartSearchService';
import { AudioPlayerService } from '@/services/AudioPlayerService';
import { StorageManager } from '@/utils/StorageManager';
import { Colors, Spacing, BorderRadius, FontSizes, IconSizes } from '@/constants/theme';
import { t } from '@/utils/i18n';

interface AIAssistantScreenProps {
  navigation: any;
}

interface StationResult {
  name: string;
  url: string;
  favicon: string;
  country: string;
  tags: string;
}

export const AIAssistantScreen: React.FC<AIAssistantScreenProps> = ({ navigation }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('按下按鈕，說出你想聽的電台');
  const [recognizedText, setRecognizedText] = useState('');
  const [searchResults, setSearchResults] = useState<StationResult[]>([]);
  const [playingUrl, setPlayingUrl] = useState<string>('');
  const [isVoiceControlMode, setIsVoiceControlMode] = useState(false);
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [commandInput, setCommandInput] = useState('');
  const [showVoiceHint, setShowVoiceHint] = useState(false);
  
  // 動畫
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 初始化語音服務
    initializeVoiceService();
  }, []);

  // 頁面離開時停止試播
  useFocusEffect(
    useCallback(() => {
      // 頁面進入時
      return () => {
        // 頁面離開時：停止試播
        if (playingUrl) {
          AudioPlayerService.stop();
          setPlayingUrl('');
        }
        VoiceCommandService.cleanup();
      };
    }, [playingUrl])
  );

  useEffect(() => {
    if (isListening) {
      startPulseAnimation();
      startWaveAnimation();
    } else {
      stopAnimations();
    }
  }, [isListening]);

  const initializeVoiceService = async () => {
    try {
      await VoiceCommandService.initialize();
    } catch (error) {
      console.error('初始化語音服務失敗:', error);
      Alert.alert('錯誤', '無法初始化語音識別功能');
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startWaveAnimation = () => {
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopAnimations = () => {
    pulseAnim.stopAnimation();
    waveAnim.stopAnimation();
    pulseAnim.setValue(1);
    waveAnim.setValue(0);
  };

  const handleTextCommand = async () => {
    if (!commandInput.trim()) {
      Alert.alert('提示', '請輸入搜尋指令');
      return;
    }

    // 檢查 AI 配置
    if (!SmartSearchService.hasAIEnabled()) {
      Alert.alert(
        '未配置 AI',
        '請先到設定頁面配置 AI API Key',
        [
          { text: '取消', style: 'cancel' },
          { 
            text: '前往設定', 
            onPress: () => navigation.navigate('Settings', { screen: 'AISettings' })
          },
        ]
      );
      return;
    }

    try {
      const userCommand = commandInput.trim();
      setRecognizedText(userCommand);
      setCommandInput('');
      setIsProcessing(true);
      setStatusMessage('AI 正在分析你的需求...');

      await VoiceCommandService.speak('正在搜尋');

      // 處理命令
      const result = await VoiceCommandService.processVoiceCommand(userCommand);

      setIsProcessing(false);

      if (result.success && result.stations) {
        setStatusMessage(result.message);
        setSearchResults(result.stations);
        await VoiceCommandService.speak(result.message);
      } else {
        setStatusMessage(result.message);
        setSearchResults([]);
        await VoiceCommandService.speak(result.message);
        
        // 5 秒後重置
        setTimeout(() => {
          setStatusMessage('輸入你想聽的電台，例如：新聞、古典音樂');
          setRecognizedText('');
        }, 5000);
      }
    } catch (error) {
      console.error('命令處理失敗:', error);
      setIsProcessing(false);
      setStatusMessage('處理失敗，請重試');
    }
  };

  const handleStop = async () => {
    try {
      await VoiceCommandService.stopListening();
      setIsListening(false);
      setIsProcessing(false);
      setStatusMessage('已取消');
      
      setTimeout(() => {
        setStatusMessage('按下按鈕，說出你想聽的電台');
        setRecognizedText('');
      }, 2000);
    } catch (error) {
      console.error('停止語音識別失敗:', error);
    }
  };

  // 即時試播/停止
  const handlePlayPreview = async (station: StationResult) => {
    try {
      // 如果正在播放同一個電台，則停止
      if (playingUrl === station.url) {
        await AudioPlayerService.stop();
        setPlayingUrl('');
        await VoiceCommandService.speak('已停止播放');
        return;
      }
      
      // 播放新電台
      setPlayingUrl(station.url);
      
      // 創建臨時電台物件用於播放（不加入列表）
      const tempStation = {
        id: 'temp_' + Date.now(),
        name: station.name,
        url: station.url,
        icon: station.favicon,
        type: 'radio' as const,
        isFavorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      await AudioPlayerService.play(tempStation);
      await VoiceCommandService.speak(`正在試播：${station.name}`);
    } catch (error) {
      console.error('播放失敗:', error);
      Alert.alert('播放失敗', '無法播放此電台');
    }
  };

  // 加入電台列表
  const handleAddToList = async (station: StationResult) => {
    try {
      const newStation = await StorageManager.addStation({
        name: station.name,
        url: station.url,
        icon: station.favicon,
        type: 'radio',
        isFavorite: false,
      });
      
      Alert.alert('成功', `已將「${station.name}」加入電台列表`);
      await VoiceCommandService.speak('已加入電台列表');
    } catch (error) {
      console.error('加入列表失敗:', error);
      Alert.alert('失敗', '加入電台列表失敗');
    }
  };

  // 加入最愛
  const handleAddToFavorites = async (station: StationResult) => {
    try {
      const newStation = await StorageManager.addStation({
        name: station.name,
        url: station.url,
        icon: station.favicon,
        type: 'radio',
        isFavorite: true,
      });
      
      Alert.alert('成功', `已將「${station.name}」加入最愛`);
      await VoiceCommandService.speak('已加入最愛');
    } catch (error) {
      console.error('加入最愛失敗:', error);
      Alert.alert('失敗', '加入最愛失敗');
    }
  };

  // 重新搜尋
  const handleNewSearch = () => {
    setSearchResults([]);
    setRecognizedText('');
    setStatusMessage('按下按鈕，說出你想聽的電台');
    setPlayingUrl('');
    setIsVoiceControlMode(false);
    setCurrentStationIndex(0);
  };

  // 開啟文本控制模式
  const handleEnableVoiceControl = async () => {
    setIsVoiceControlMode(true);
    await VoiceCommandService.speak('命令控制已開啟');
  };

  // 處理控制命令
  const handleControlCommand = async (command: string) => {
    if (!command.trim()) return;

    try {
      setRecognizedText(command);
      
      // 分析命令
      const { action, number } = VoiceCommandService.analyzeActionCommand(command);
      
      if (action === 'back') {
        handleNewSearch();
        await VoiceCommandService.speak('返回搜尋頁面');
        return;
      }
      
      if (action === 'next') {
        if (currentStationIndex < searchResults.length - 1) {
          const nextIndex = currentStationIndex + 1;
          setCurrentStationIndex(nextIndex);
          await handlePlayPreview(searchResults[nextIndex]);
        } else {
          await VoiceCommandService.speak('已經是最後一個了');
        }
        return;
      }
      
      if (action === 'previous') {
        if (currentStationIndex > 0) {
          const prevIndex = currentStationIndex - 1;
          setCurrentStationIndex(prevIndex);
          await handlePlayPreview(searchResults[prevIndex]);
        } else {
          await VoiceCommandService.speak('已經是第一個了');
        }
        return;
      }
      
      const targetIndex = number ? number - 1 : currentStationIndex;
      
      if (targetIndex < 0 || targetIndex >= searchResults.length) {
        await VoiceCommandService.speak('找不到這個電台');
        return;
      }
      
      const targetStation = searchResults[targetIndex];
      setCurrentStationIndex(targetIndex);
      
      switch (action) {
        case 'play':
          await handlePlayPreview(targetStation);
          break;
        case 'add':
          await handleAddToList(targetStation);
          break;
        case 'favorite':
          await handleAddToFavorites(targetStation);
          break;
        default:
          await VoiceCommandService.speak('我不太理解，請說試播、加入列表、或加入最愛');
      }
    } catch (error) {
      console.error('命令處理失敗:', error);
    }
  };

  // 關閉語音控制
  const handleDisableVoiceControl = async () => {
    setIsVoiceControlMode(false);
    await VoiceCommandService.stopListening();
    await VoiceCommandService.speak('語音控制已關閉');
  };

  const inputRef = useRef<any>(null);

  const handleMicPress = () => {
    // 聚焦輸入框，讓鍵盤彈出
    inputRef.current?.focus();
    // 顯示提示
    setShowVoiceHint(true);
    // 3秒後自動隱藏提示
    setTimeout(() => {
      setShowVoiceHint(false);
    }, 3000);
  };

  const renderCommandInput = () => {
    if (isProcessing) {
      return (
        <View style={styles.voiceButtonContainer}>
          <View style={styles.processingButton}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        </View>
      );
    }

    return (
      <View>
        <View style={styles.commandInputContainer}>
          <TouchableOpacity onPress={handleMicPress} style={styles.micButton}>
            <Ionicons name="mic" size={IconSizes.md} color={Colors.primary} />
          </TouchableOpacity>
          <TextInput
            ref={inputRef}
            style={styles.commandInput}
            value={commandInput}
            onChangeText={setCommandInput}
            placeholder="輸入指令，例如：我想聽新聞"
            placeholderTextColor={Colors.placeholder}
            onSubmitEditing={handleTextCommand}
            returnKeyType="search"
            autoFocus={false}
            keyboardType="default"
            onFocus={() => setShowVoiceHint(false)}
          />
          <TouchableOpacity
            style={styles.commandButton}
            onPress={handleTextCommand}
            disabled={!commandInput.trim()}
          >
            <Ionicons name="send" size={IconSizes.lg} color={Colors.text} />
          </TouchableOpacity>
        </View>
        
        {/* 語音提示 */}
        {showVoiceHint && (
          <View style={styles.voiceHintBanner}>
            <Ionicons name="arrow-down" size={IconSizes.md} color={Colors.primary} />
            <Text style={styles.voiceHintText}>👇 點擊鍵盤上的 🎤 麥克風使用語音輸入</Text>
          </View>
        )}
      </View>
    );
  };

  const renderStationItem = ({ item, index }: { item: StationResult; index: number }) => {
    const isPlaying = playingUrl === item.url;
    const isCurrent = index === currentStationIndex;
    
    return (
      <View style={[styles.stationItem, isCurrent && styles.stationItemCurrent]}>
        {isCurrent && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>正在操作</Text>
          </View>
        )}
        <View style={styles.stationInfo}>
          <View style={styles.stationNumberBadge}>
            <Text style={styles.stationNumber}>{index + 1}</Text>
          </View>
          {item.favicon ? (
            <Image
              source={{ uri: item.favicon }}
              style={styles.stationIcon}
              defaultSource={require('../../assets/icon.png')}
            />
          ) : (
            <View style={[styles.stationIcon, styles.stationIconPlaceholder]}>
              <Ionicons name="radio" size={IconSizes.md} color={Colors.textSecondary} />
            </View>
          )}
          <View style={styles.stationDetails}>
            <Text style={styles.stationName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.stationMeta} numberOfLines={1}>
              {item.country && `📍 ${item.country}`}
              {item.tags && ` • ${item.tags}`}
            </Text>
          </View>
        </View>
        
        <View style={styles.stationActions}>
          <TouchableOpacity
            style={[styles.actionButton, isPlaying && styles.actionButtonActive]}
            onPress={() => handlePlayPreview(item)}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={IconSizes.md}
              color={isPlaying ? Colors.primary : Colors.text}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleAddToList(item)}
          >
            <Ionicons name="add-circle-outline" size={IconSizes.md} color={Colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleAddToFavorites(item)}
          >
            <Ionicons name="star-outline" size={IconSizes.md} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {searchResults.length === 0 ? (
        <>
          {/* 標題 */}
          <View style={styles.header}>
            <Ionicons name="sparkles" size={IconSizes.xl} color={Colors.primary} />
            <Text style={styles.title}>AI 智能助手</Text>
            <Text style={styles.subtitle}>輸入你想聽的電台類型</Text>
          </View>

          {/* 命令輸入 */}
          {renderCommandInput()}

          {/* 狀態訊息 */}
          <View style={styles.statusContainer}>
            <Text style={styles.statusMessage}>{statusMessage}</Text>
            {recognizedText && (
              <View style={styles.recognizedTextContainer}>
                <Ionicons name="chatbubble-ellipses" size={IconSizes.md} color={Colors.primary} />
                <Text style={styles.recognizedText}>「{recognizedText}」</Text>
              </View>
            )}
          </View>

          {/* 使用提示 */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 試試這些指令：</Text>
            <View style={styles.tipsList}>
              <Text style={styles.tipItem}>• "我想聽新聞"</Text>
              <Text style={styles.tipItem}>• "播放古典音樂"</Text>
              <Text style={styles.tipItem}>• "找爵士樂電台"</Text>
              <Text style={styles.tipItem}>• "我想聽日本的流行音樂"</Text>
            </View>
          </View>

          {/* AI 設定按鈕 */}
          {!SmartSearchService.hasAIEnabled() && (
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate('Settings', { screen: 'AISettings' })}
            >
              <Ionicons name="settings" size={IconSizes.md} color={Colors.text} />
              <Text style={styles.settingsButtonText}>前往配置 AI</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <>
          {/* 搜尋結果標題 */}
          <View style={styles.resultsHeader}>
            <View style={styles.resultsHeaderLeft}>
              <Ionicons name="search" size={IconSizes.lg} color={Colors.primary} />
              <View>
                <Text style={styles.resultsTitle}>{statusMessage}</Text>
                {recognizedText && (
                  <Text style={styles.resultsSubtitle}>「{recognizedText}」</Text>
                )}
              </View>
            </View>
            <View style={styles.headerButtons}>
              {playingUrl && (
                <TouchableOpacity 
                  onPress={async () => {
                    await AudioPlayerService.stop();
                    setPlayingUrl('');
                  }} 
                  style={styles.stopButton}
                >
                  <Ionicons name="stop-circle" size={IconSizes.md} color={Colors.error} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleNewSearch} style={styles.newSearchButton}>
                <Ionicons name="refresh" size={IconSizes.md} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 操作說明 */}
          <View style={styles.instructionsBar}>
            <View style={styles.instructionItem}>
              <Ionicons name="play" size={IconSizes.sm} color={Colors.textSecondary} />
              <Text style={styles.instructionText}>試播</Text>
            </View>
            <View style={styles.instructionItem}>
              <Ionicons name="add-circle-outline" size={IconSizes.sm} color={Colors.textSecondary} />
              <Text style={styles.instructionText}>加入列表</Text>
            </View>
            <View style={styles.instructionItem}>
              <Ionicons name="star-outline" size={IconSizes.sm} color={Colors.textSecondary} />
              <Text style={styles.instructionText}>加入最愛</Text>
            </View>
          </View>

          {/* 搜尋結果列表 */}
          <FlatList
            data={searchResults}
            renderItem={renderStationItem}
            keyExtractor={(item, index) => `${item.url}_${index}`}
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl * 2,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  voiceButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginVertical: Spacing.xl,
  },
  voiceButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  listeningButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  voiceButtonInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  waveCircle: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: Colors.error,
  },
  statusContainer: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  statusMessage: {
    fontSize: FontSizes.lg,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  recognizedTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  recognizedText: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontStyle: 'italic',
  },
  tipsContainer: {
    backgroundColor: Colors.card,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  tipsTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  tipsList: {
    gap: Spacing.sm,
  },
  tipItem: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  settingsButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resultsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stopButton: {
    padding: Spacing.sm,
  },
  resultsTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  resultsSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  newSearchButton: {
    padding: Spacing.sm,
  },
  instructionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  instructionText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  resultsList: {
    padding: Spacing.md,
  },
  stationItem: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  stationIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
  },
  stationIconPlaceholder: {
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stationDetails: {
    flex: 1,
  },
  stationName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  stationMeta: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  stationActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    minWidth: 48,
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: Colors.primary + '20',
  },
  voiceControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    gap: Spacing.md,
  },
  voiceControlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  voiceControlButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  voiceControlActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    flex: 1,
  },
  voiceControlActiveText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  voiceControlStopButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.error + '20',
  },
  voiceControlBadge: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  voiceHint: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  stationItemCurrent: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primary + '10',
  },
  currentBadge: {
    position: 'absolute',
    top: -8,
    right: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    zIndex: 1,
  },
  currentBadgeText: {
    fontSize: FontSizes.xs,
    color: Colors.text,
    fontWeight: '600',
  },
  stationNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  stationNumber: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
    color: Colors.text,
  },
  commandInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    gap: Spacing.sm,
  },
  micButton: {
    padding: Spacing.xs,
  },
  commandInput: {
    flex: 1,
    fontSize: FontSizes.lg,
    color: Colors.text,
    paddingVertical: Spacing.md,
  },
  commandButton: {
    padding: Spacing.md,
    marginLeft: Spacing.sm,
  },
  controlInput: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.text,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  commandSendButton: {
    padding: Spacing.md,
    marginLeft: Spacing.sm,
  },
  voiceHintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '20',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  voiceHintText: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: '600',
  },
});

