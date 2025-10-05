/**
 * 設定畫面
 * Settings Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { changeLanguage, t } from '@/utils/i18n';
import i18n from '@/utils/i18n';
import { Colors, Spacing, BorderRadius, FontSizes, IconSizes } from '@/constants/theme';

interface SettingsScreenProps {
  navigation?: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const [currentLanguage, setCurrentLanguage] = useState(i18n.locale);
  const [forceUpdate, setForceUpdate] = useState(0);

  const languages = [
    { code: 'zh-TW', name: t('settings.chineseTraditional'), icon: '🇹🇼' },
    { code: 'en', name: t('settings.english'), icon: '🇬🇧' },
    { code: 'vi', name: t('settings.vietnamese'), icon: '🇻🇳' },
  ];

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await changeLanguage(languageCode);
      setCurrentLanguage(languageCode);
      // 不需要手動更新，語言變更會自動觸發整個應用重新渲染
    } catch (error) {
      Alert.alert(t('common.error'), String(error));
    }
  };

  const handleAbout = () => {
    Alert.alert(
      'mesonRadio',
      '版本 1.0.0\n\n一個簡單易用的網路廣播播放器\n支援傳統網路廣播與 YouTube 音訊串流\n\n© 2025 mesonRadio'
    );
  };

  const handleAISettings = () => {
    navigation?.navigate('AISettings');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* AI 智能搜尋 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI 功能</Text>
        <TouchableOpacity style={styles.settingItem} onPress={handleAISettings}>
          <View style={styles.settingItemLeft}>
            <Ionicons name="sparkles" size={IconSizes.md} color={Colors.primary} />
            <View>
              <Text style={styles.settingItemText}>AI 智能搜尋</Text>
              <Text style={styles.settingItemSubtext}>配置 Gemini / ChatGPT / Grok</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={IconSizes.md} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* 語言設定 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        {languages.map(lang => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.settingItem,
              currentLanguage === lang.code && styles.settingItemActive,
            ]}
            onPress={() => handleLanguageChange(lang.code)}
          >
            <View style={styles.settingItemLeft}>
              <Text style={styles.languageIcon}>{lang.icon}</Text>
              <Text style={styles.settingItemText}>{lang.name}</Text>
            </View>
            {currentLanguage === lang.code && (
              <Ionicons name="checkmark" size={IconSizes.md} color={Colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* 關於 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
        <TouchableOpacity style={styles.settingItem} onPress={handleAbout}>
          <View style={styles.settingItemLeft}>
            <Ionicons name="information-circle-outline" size={IconSizes.md} color={Colors.text} />
            <Text style={styles.settingItemText}>mesonRadio</Text>
          </View>
          <Text style={styles.versionText}>v1.0.0</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Ionicons name="radio" size={IconSizes.xl} color={Colors.primary} />
        <Text style={styles.infoTitle}>mesonRadio</Text>
        <Text style={styles.infoDescription}>
          享受來自世界各地的廣播電台{'\n'}
          無廣告 • 免費 • 開源
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  settingItemActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  settingItemText: {
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  settingItemSubtext: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  languageIcon: {
    fontSize: FontSizes.xl,
  },
  versionText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  infoSection: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
    padding: Spacing.xl,
  },
  infoTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  infoDescription: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: FontSizes.md * 1.5,
  },
});

