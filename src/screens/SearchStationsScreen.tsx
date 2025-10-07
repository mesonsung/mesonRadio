/**
 * 搜尋電台畫面
 * Search Stations Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RadioBrowserService } from '@/services/RadioBrowserService';
import { SmartSearchService } from '@/services/SmartSearchService';
import { AIRadioSearchService } from '@/services/AIRadioSearchService';
import { StorageManager } from '@/utils/StorageManager';
import { SearchResult } from '@/models/Station';
import { Colors, Spacing, BorderRadius, FontSizes, IconSizes } from '@/constants/theme';
import { t } from '@/utils/i18n';

interface SearchStationsScreenProps {
  navigation: any;
}

export const SearchStationsScreen: React.FC<SearchStationsScreenProps> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedStations, setSelectedStations] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [useAI, setUseAI] = useState(SmartSearchService.hasAIEnabled());
  const [aiSuggestion, setAiSuggestion] = useState<string>('');

  const handleSearch = async () => {
    if (!query.trim()) {
      Alert.alert(t('common.error'), '請輸入搜尋關鍵字');
      return;
    }

    setLoading(true);
    setAiSuggestion('');
    
    try {
      let searchQuery = query.trim();
      
      // 如果啟用 AI，使用 AI 從網路搜尋電台（新功能！）
      if (useAI && SmartSearchService.hasAIEnabled()) {
        try {
          setAiSuggestion('🤖 AI 正在為您搜尋網路電台...');
          
          const aiResults = await AIRadioSearchService.searchRadioStationsWithAI(searchQuery);
          
          if (aiResults.length > 0) {
            // 將 AI 搜尋結果轉換為 SearchResult 格式
            const searchResults = aiResults.map(station => ({
              id: station.url,
              name: station.name,
              url: station.url,
              favicon: station.favicon || '',
              country: station.country,
              language: station.language,
              tags: station.genre,
              votes: 0,
              bitrate: station.bitrate || 'unknown',
            }));
            
            setResults(searchResults);
            setSelectedStations(new Set());
            setAiSuggestion(`🤖 AI 為您找到 ${searchResults.length} 個推薦電台`);
            return;
          } else {
            setAiSuggestion('🤖 AI 搜尋無結果，使用傳統搜尋...');
          }
        } catch (error) {
          console.error('AI search failed:', error);
          setAiSuggestion('⚠️ AI 搜尋失敗，使用傳統搜尋');
        }
      }
      
      // 使用傳統的 Radio Browser 搜尋
      const searchResults = await RadioBrowserService.searchStations(searchQuery);
      setResults(searchResults);
      setSelectedStations(new Set());

      if (searchResults.length === 0) {
        Alert.alert(t('search.noResults'), '請嘗試其他關鍵字');
      }
    } catch (error) {
      Alert.alert(t('common.error'), String(error));
    } finally {
      setLoading(false);
    }
  };

  const optimizeSearchWithAI = async (userQuery: string): Promise<string | null> => {
    try {
      const apiKey = SmartSearchService.getAPIKey(SmartSearchService.getCurrentProvider());
      if (!apiKey) return null;

      // 使用 Gemini 優化搜尋關鍵字
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `你是一個電台搜尋助手。用戶想要搜尋電台，請將用戶的需求轉換為適合搜尋的英文關鍵字。

用戶需求：「${userQuery}」

請分析用戶想要什麼類型的電台，然後回覆最合適的英文搜尋關鍵字。

規則：
1. 如果是中文描述，轉換為英文關鍵字
2. 只返回關鍵字，不要解釋
3. 如果是新聞台，返回 "news"
4. 如果是音樂台，返回 "music" 或具體類型如 "classical", "pop", "jazz"
5. 如果是地區，返回地區名稱（如 "taiwan", "japan", "usa"）
6. 盡量簡短，1-3 個英文單字

只回覆關鍵字，不要其他文字：`;

      const result = await model.generateContent(prompt);
      const response = result.response.text().trim();
      
      // 清理回應，只取第一行
      const optimizedQuery = response.split('\n')[0].trim().toLowerCase();
      
      return optimizedQuery || null;
    } catch (error) {
      console.error('AI optimization error:', error);
      return null;
    }
  };

  const toggleStation = (index: number) => {
    const newSelected = new Set(selectedStations);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedStations(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedStations.size === results.length) {
      setSelectedStations(new Set());
    } else {
      setSelectedStations(new Set(results.map((_, index) => index)));
    }
  };

  const handleAddSelected = async () => {
    if (selectedStations.size === 0) {
      Alert.alert(t('common.error'), '請至少選擇一個電台');
      return;
    }

    setSaving(true);
    try {
      const selectedResults = Array.from(selectedStations).map(index => results[index]);

      for (const result of selectedResults) {
        await StorageManager.addStation({
          name: result.name,
          url: result.url,
          icon: result.favicon,
          type: 'radio',
          isFavorite: false,
        });
      }

      Alert.alert(
        t('common.success'),
        `已新增 ${selectedStations.size} 個電台`
      );
      navigation.goBack();
    } catch (error) {
      Alert.alert(t('common.error'), String(error));
    } finally {
      setSaving(false);
    }
  };

  const renderStation = ({ item, index }: { item: SearchResult; index: number }) => {
    const isSelected = selectedStations.has(index);

    return (
      <TouchableOpacity
        style={[styles.resultItem, isSelected && styles.resultItemSelected]}
        onPress={() => toggleStation(index)}
      >
        <View style={styles.resultIconContainer}>
          {item.favicon ? (
            <Image source={{ uri: item.favicon }} style={styles.resultIcon} />
          ) : (
            <View style={styles.resultIconPlaceholder}>
              <Ionicons name="radio" size={IconSizes.md} color={Colors.textSecondary} />
            </View>
          )}
        </View>

        <View style={styles.resultContent}>
          <Text style={styles.resultName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.resultInfo} numberOfLines={1}>
            {item.country && `${item.country} • `}
            {item.language}
          </Text>
        </View>

        <Ionicons
          name={isSelected ? 'checkmark-circle' : 'checkmark-circle-outline'}
          size={IconSizes.md}
          color={isSelected ? Colors.success : Colors.textSecondary}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={IconSizes.md} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={
              useAI 
                ? "🤖 AI 智能搜尋（如：我想聽新聞）"
                : t('search.searchPlaceholder')
            }
            placeholderTextColor={Colors.placeholder}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {useAI && (
            <Ionicons name="sparkles" size={IconSizes.sm} color={Colors.primary} />
          )}
        </View>
        
        {SmartSearchService.hasAIEnabled() && (
          <TouchableOpacity
            style={[styles.aiToggle, useAI && styles.aiToggleActive]}
            onPress={() => setUseAI(!useAI)}
          >
            <Ionicons 
              name={useAI ? "sparkles" : "sparkles-outline"} 
              size={IconSizes.sm} 
              color={useAI ? Colors.text : Colors.textSecondary} 
            />
            <Text style={[styles.aiToggleText, useAI && styles.aiToggleTextActive]}>
              {useAI ? 'AI 開啟' : 'AI 關閉'}
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.text} />
          ) : (
            <Text style={styles.searchButtonText}>{t('common.search')}</Text>
          )}
        </TouchableOpacity>
      </View>

      {aiSuggestion && (
        <View style={styles.aiSuggestionContainer}>
          <Text style={styles.aiSuggestionText}>{aiSuggestion}</Text>
        </View>
      )}

      {results.length > 0 && (
        <View style={styles.toolbar}>
          <Text style={styles.toolbarText}>
            {t('search.selected')}: {selectedStations.size}
          </Text>
          <View style={styles.toolbarButtons}>
            <TouchableOpacity style={styles.toolbarButton} onPress={handleSelectAll}>
              <Text style={styles.toolbarButtonText}>
                {selectedStations.size === results.length
                  ? t('search.deselectAll')
                  : t('search.selectAll')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolbarButton, styles.toolbarButtonPrimary]}
              onPress={handleAddSelected}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.text} />
              ) : (
                <Text style={styles.toolbarButtonTextPrimary}>
                  {t('search.addSelected')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={results}
        renderItem={renderStation}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  aiToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aiToggleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  aiToggleText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  aiToggleTextActive: {
    color: Colors.text,
    fontWeight: '600',
  },
  aiSuggestionContainer: {
    backgroundColor: 'rgba(14, 116, 144, 0.2)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  aiSuggestionText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    minWidth: 80,
  },
  searchButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  toolbarText: {
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  toolbarButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  toolbarButton: {
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.card,
  },
  toolbarButtonPrimary: {
    backgroundColor: Colors.success,
  },
  toolbarButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  toolbarButtonTextPrimary: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  listContent: {
    padding: Spacing.md,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  resultItemSelected: {
    borderColor: Colors.success,
  },
  resultIconContainer: {
    marginRight: Spacing.md,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
  },
  resultIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  resultName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  resultInfo: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
});

