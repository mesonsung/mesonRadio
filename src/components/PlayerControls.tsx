/**
 * 播放器控制組件
 * Player Controls Component
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes, IconSizes } from '@/constants/theme';
import { PlaybackStatus } from '@/models/PlayerState';
import { t } from '@/utils/i18n';

interface PlayerControlsProps {
  status: PlaybackStatus;
  stationName: string | null;
  onPlayPause: () => void;
  onStop: () => void;
  onPrevious: () => void;
  onNext: () => void;
  canNavigate: boolean;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  status,
  stationName,
  onPlayPause,
  onStop,
  onPrevious,
  onNext,
  canNavigate,
}) => {
  const isPlaying = status === PlaybackStatus.PLAYING;
  const isLoading = status === PlaybackStatus.LOADING;
  const isBuffering = status === PlaybackStatus.BUFFERING;
  const isError = status === PlaybackStatus.ERROR;
  const isActive = isPlaying || isBuffering; // 正在播放或緩衝中

  const getStatusText = (): string => {
    switch (status) {
      case PlaybackStatus.PLAYING:
        return t('home.nowPlaying');
      case PlaybackStatus.LOADING:
        return t('player.loading');
      case PlaybackStatus.BUFFERING:
        return t('player.buffering');
      case PlaybackStatus.ERROR:
        return t('player.error');
      case PlaybackStatus.PAUSED:
        return t('player.pause');
      default:
        return t('home.noStation');
    }
  };

  const renderMainButton = () => {
    if (isBuffering) {
      return (
        <TouchableOpacity
          style={[styles.mainButton, styles.mainButtonBuffering]}
          onPress={onPlayPause}
        >
          <ActivityIndicator size="large" color={Colors.primary} />
        </TouchableOpacity>
      );
    }
    
    if (isLoading) {
      return (
        <View style={styles.mainButton}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }
    
    return (
      <TouchableOpacity
        style={[styles.mainButton, isPlaying && styles.mainButtonPlaying]}
        onPress={onPlayPause}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={IconSizes.xl}
          color={Colors.text}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{getStatusText()}</Text>
        {stationName && (
          <Text style={styles.stationName} numberOfLines={1}>
            {stationName}
          </Text>
        )}
        {isError && (
          <Text style={styles.errorText}>{t('player.errorMessage')}</Text>
        )}
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, (!canNavigate || isLoading) && styles.controlButtonDisabled]}
          onPress={onPrevious}
          disabled={!canNavigate || isLoading}
        >
          <Ionicons
            name="play-skip-back"
            size={IconSizes.lg}
            color={canNavigate && !isLoading ? Colors.text : Colors.disabled}
          />
        </TouchableOpacity>

        {/* 主播放按鈕 */}
        {renderMainButton()}

        <TouchableOpacity
          style={[styles.controlButton, (!canNavigate || isLoading) && styles.controlButtonDisabled]}
          onPress={onNext}
          disabled={!canNavigate || isLoading}
        >
          <Ionicons
            name="play-skip-forward"
            size={IconSizes.lg}
            color={canNavigate && !isLoading ? Colors.text : Colors.disabled}
          />
        </TouchableOpacity>
      </View>

      {/* 在緩衝或播放時都顯示停止按鈕，讓使用者能隨時停止 */}
      {(isActive || status === PlaybackStatus.PAUSED) && (
        <TouchableOpacity style={styles.stopButton} onPress={onStop}>
          <Ionicons name="stop" size={IconSizes.md} color={Colors.error} />
          <Text style={styles.stopText}>{t('player.stop')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  statusText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  stationName: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  errorText: {
    fontSize: FontSizes.sm,
    color: Colors.error,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  mainButton: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainButtonPlaying: {
    backgroundColor: Colors.primary,
  },
  mainButtonBuffering: {
    backgroundColor: Colors.surface,
  },
  stopButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
    padding: Spacing.sm,
  },
  stopText: {
    fontSize: FontSizes.md,
    color: Colors.error,
    marginLeft: Spacing.sm,
  },
});

