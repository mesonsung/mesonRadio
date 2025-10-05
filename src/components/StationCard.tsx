/**
 * 電台卡片組件
 * Station Card Component
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Station } from '@/models/Station';
import { Colors, Spacing, BorderRadius, FontSizes, IconSizes } from '@/constants/theme';

interface StationCardProps {
  station: Station;
  onPress: () => void;
  onToggleFavorite: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isPlaying?: boolean;
}

export const StationCard: React.FC<StationCardProps> = ({
  station,
  onPress,
  onToggleFavorite,
  onEdit,
  onDelete,
  isPlaying = false,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, isPlaying && styles.containerPlaying]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {station.icon ? (
          <Image source={{ uri: station.icon }} style={styles.icon} />
        ) : (
          <View style={styles.iconPlaceholder}>
            <Ionicons
              name={station.type === 'youtube' ? 'logo-youtube' : 'radio'}
              size={IconSizes.lg}
              color={Colors.textSecondary}
            />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {station.name}
        </Text>
        <Text style={styles.url} numberOfLines={1}>
          {station.url}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onToggleFavorite}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={station.isFavorite ? 'star' : 'star-outline'}
            size={IconSizes.md}
            color={station.isFavorite ? Colors.favorite : Colors.textSecondary}
          />
        </TouchableOpacity>

        {onEdit && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onEdit}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="create-outline" size={IconSizes.md} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}

        {onDelete && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={IconSizes.md} color={Colors.error} />
          </TouchableOpacity>
        )}
      </View>

      {isPlaying && (
        <View style={styles.playingIndicator}>
          <Ionicons name="musical-notes" size={IconSizes.sm} color={Colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  containerPlaying: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  iconContainer: {
    marginRight: Spacing.md,
  },
  icon: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
  },
  iconPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  name: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  url: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: Spacing.sm,
  },
  playingIndicator: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
});

