/**
 * 我的最愛畫面
 * Favorites Screen
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, InteractionManager } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StationCard } from '@/components/StationCard';
import { EmptyState } from '@/components/EmptyState';
import { StorageManager } from '@/utils/StorageManager';
import { AudioPlayerService } from '@/services/AudioPlayerService';
import { Station } from '@/models/Station';
import { Colors, Spacing } from '@/constants/theme';
import { t } from '@/utils/i18n';

export const FavoritesScreen: React.FC = () => {
  const [favorites, setFavorites] = useState<Station[]>([]);
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    try {
      const favoriteStations = await StorageManager.getFavoriteStations();
      setFavorites(favoriteStations);

      const current = AudioPlayerService.getCurrentStation();
      setCurrentStation(current);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
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
      await loadFavorites();
      Alert.alert(t('common.success'), t('favorites.removedFromFavorites'));
    } catch (error) {
      Alert.alert(t('common.error'), String(error));
    }
  };

  const renderStation = ({ item }: { item: Station }) => (
    <StationCard
      station={item}
      onPress={() => handleStationPress(item)}
      onToggleFavorite={() => handleToggleFavorite(item)}
      isPlaying={currentStation?.id === item.id}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        renderItem={renderStation}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <EmptyState
            icon="star-outline"
            title={t('favorites.noFavorites')}
            description={t('favorites.addFavorites')}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: Spacing.md,
    flexGrow: 1,
  },
});

