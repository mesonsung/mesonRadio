/**
 * 電台管理畫面
 * Stations Management Screen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  Alert,
  TextInput,
  ActivityIndicator,
  InteractionManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { StationCard } from '@/components/StationCard';
import { EmptyState } from '@/components/EmptyState';
import { StorageManager } from '@/utils/StorageManager';
import { AudioPlayerService } from '@/services/AudioPlayerService';
import { SmartSearchService } from '@/services/SmartSearchService';
import { Station } from '@/models/Station';
import { Colors, Spacing, BorderRadius, FontSizes, IconSizes } from '@/constants/theme';
import { t } from '@/utils/i18n';

interface StationsScreenProps {
  navigation: any;
}

type SortOption = 'name' | 'date' | 'favorite';

export const StationsScreen: React.FC<StationsScreenProps> = ({ navigation }) => {
  const [allStations, setAllStations] = useState<Station[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [isAISearching, setIsAISearching] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadStations();
    }, [])
  );

  const loadStations = async () => {
    try {
      const loadedStations = await StorageManager.getStations();
      setAllStations(loadedStations);

      const current = AudioPlayerService.getCurrentStation();
      setCurrentStation(current);
    } catch (error) {
      console.error('Error loading stations:', error);
    }
  };

  // 當 allStations、searchQuery 或 sortBy 改變時，更新顯示的電台列表
  useEffect(() => {
    if (searchQuery.trim() && SmartSearchService.hasAIEnabled()) {
      // 如果有搜尋關鍵字且 AI 已啟用，使用 AI 搜尋
      performAISearch();
    } else {
      // 否則使用本地搜尋
      filterAndSortStations();
    }
  }, [allStations, searchQuery, sortBy]);

  const performAISearch = async () => {
    if (!searchQuery.trim()) {
      filterAndSortStations();
      return;
    }

    setIsAISearching(true);
    try {
      const searchResults = await SmartSearchService.search(
        searchQuery.trim(),
        allStations,
        true // 使用 AI
      );

      // 將搜尋結果轉換為電台陣列
      const aiFilteredStations = searchResults.map(result => result.station);
      
      // 應用排序
      const sorted = sortStations(aiFilteredStations, sortBy);
      setStations(sorted);
    } catch (error) {
      console.error('AI search error:', error);
      // AI 搜尋失敗時回退到本地搜尋
      filterAndSortStations();
    } finally {
      setIsAISearching(false);
    }
  };

  const filterAndSortStations = () => {
    let filtered = [...allStations];

    // 1. 搜尋過濾
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(station =>
        station.name.toLowerCase().includes(query) ||
        station.url.toLowerCase().includes(query)
      );
    }

    // 2. 排序
    const sorted = sortStations(filtered, sortBy);
    setStations(sorted);
  };

  const sortStations = (stationList: Station[], option: SortOption): Station[] => {
    return [...stationList].sort((a, b) => {
      switch (option) {
        case 'name':
          return a.name.localeCompare(b.name, 'zh-TW');
        case 'favorite':
          if (a.isFavorite === b.isFavorite) {
            return b.createdAt - a.createdAt;
          }
          return a.isFavorite ? -1 : 1;
        case 'date':
        default:
          return b.createdAt - a.createdAt;
      }
    });
  };

  const handleSortChange = (option: SortOption) => {
    setSortBy(option);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStations();
    setRefreshing(false);
  };

  const handleStationPress = async (station: Station) => {
    try {
      await StorageManager.setCurrentStation(station);
      setCurrentStation(station);
      
      // 使用 InteractionManager 確保在主線程執行，避免線程錯誤
      InteractionManager.runAfterInteractions(async () => {
        try {
          await AudioPlayerService.play(station);
        } catch (error) {
          Alert.alert(t('common.error'), t('player.errorMessage'));
        }
      });
    } catch (error) {
      Alert.alert(t('common.error'), t('player.errorMessage'));
    }
  };

  const handleToggleFavorite = async (station: Station) => {
    try {
      await StorageManager.toggleFavorite(station.id);
      await loadStations();
      Alert.alert(
        t('common.success'),
        station.isFavorite
          ? t('favorites.removedFromFavorites')
          : t('favorites.addedToFavorites')
      );
    } catch (error) {
      Alert.alert(t('common.error'), String(error));
    }
  };

  const handleEdit = (station: Station) => {
    navigation.navigate('EditStation', { station });
  };

  const handleDelete = (station: Station) => {
    Alert.alert(
      t('common.confirm'),
      t('stations.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageManager.deleteStation(station.id);
              await loadStations();
              Alert.alert(t('common.success'), t('stations.deleteSuccess'));
            } catch (error) {
              Alert.alert(t('common.error'), String(error));
            }
          },
        },
      ]
    );
  };

  const handleAddStation = () => {
    navigation.navigate('AddStation');
  };

  const renderStation = ({ item }: { item: Station }) => (
    <StationCard
      station={item}
      onPress={() => handleStationPress(item)}
      onToggleFavorite={() => handleToggleFavorite(item)}
      onEdit={() => handleEdit(item)}
      onDelete={() => handleDelete(item)}
      isPlaying={currentStation?.id === item.id}
    />
  );

  return (
    <View style={styles.container}>
      {/* 搜尋框 */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={IconSizes.md} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={
            SmartSearchService.hasAIEnabled()
              ? "🤖 AI 智能搜尋（試試：找新聞台）"
              : "搜尋電台名稱或網址..."
          }
          placeholderTextColor={Colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {isAISearching && (
          <ActivityIndicator size="small" color={Colors.primary} style={styles.searchLoading} />
        )}
        {searchQuery.length > 0 && !isAISearching && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={IconSizes.md} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
        {SmartSearchService.hasAIEnabled() && (
          <Ionicons 
            name="sparkles" 
            size={IconSizes.sm} 
            color={Colors.primary} 
            style={styles.aiIndicator}
          />
        )}
      </View>

      {/* 排序選項 */}
      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'date' && styles.sortButtonActive]}
          onPress={() => handleSortChange('date')}
        >
          <Ionicons name="time-outline" size={IconSizes.sm} color={sortBy === 'date' ? Colors.text : Colors.textSecondary} />
          <Text style={[styles.sortButtonText, sortBy === 'date' && styles.sortButtonTextActive]}>
            最新
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
          onPress={() => handleSortChange('name')}
        >
          <Ionicons name="text-outline" size={IconSizes.sm} color={sortBy === 'name' ? Colors.text : Colors.textSecondary} />
          <Text style={[styles.sortButtonText, sortBy === 'name' && styles.sortButtonTextActive]}>
            名稱
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'favorite' && styles.sortButtonActive]}
          onPress={() => handleSortChange('favorite')}
        >
          <Ionicons name="star-outline" size={IconSizes.sm} color={sortBy === 'favorite' ? Colors.text : Colors.textSecondary} />
          <Text style={[styles.sortButtonText, sortBy === 'favorite' && styles.sortButtonTextActive]}>
            最愛
          </Text>
        </TouchableOpacity>
      </View>

      {/* 電台列表 */}
      <FlatList
        data={stations}
        renderItem={renderStation}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <EmptyState
            icon="radio-outline"
            title={searchQuery ? '找不到符合的電台' : t('stations.noStations')}
            description={searchQuery ? '試試其他關鍵字' : t('stations.addFirst')}
          />
        }
      />

      {/* 新增按鈕 */}
      <TouchableOpacity style={styles.fab} onPress={handleAddStation}>
        <Ionicons name="add" size={IconSizes.lg} color={Colors.text} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchLoading: {
    marginRight: Spacing.sm,
  },
  aiIndicator: {
    marginLeft: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.text,
    padding: Spacing.xs,
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  sortButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sortButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  sortButtonTextActive: {
    color: Colors.text,
    fontWeight: '600',
  },
  listContent: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

