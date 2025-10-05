/**
 * 新增電台畫面
 * Add Station Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { StorageManager } from '@/utils/StorageManager';
import { Station } from '@/models/Station';
import { Colors, Spacing, BorderRadius, FontSizes, IconSizes } from '@/constants/theme';
import { t } from '@/utils/i18n';

interface AddStationScreenProps {
  navigation: any;
  route?: any;
}

export const AddStationScreen: React.FC<AddStationScreenProps> = ({ navigation, route }) => {
  const editStation: Station | undefined = route?.params?.station;
  const isEditMode = !!editStation;

  const [name, setName] = useState(editStation?.name || '');
  const [url, setUrl] = useState(editStation?.url || '');
  const [icon, setIcon] = useState<string | undefined>(editStation?.icon);
  const [type, setType] = useState<'radio' | 'podcast'>(editStation?.type || 'radio');
  const [loading, setLoading] = useState(false);

  // 當編輯模式時，設置初始值
  useEffect(() => {
    if (editStation) {
      setName(editStation.name);
      setUrl(editStation.url);
      setIcon(editStation.icon);
      setType(editStation.type);
    }
  }, [editStation]);

  const handleSelectIcon = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setIcon(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (error) {
      Alert.alert(t('common.error'), String(error));
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), '請輸入電台名稱');
      return;
    }

    if (!url.trim()) {
      Alert.alert(t('common.error'), '請輸入電台網址');
      return;
    }

    setLoading(true);
    try {
      if (isEditMode && editStation) {
        // 編輯模式：更新現有電台
        await StorageManager.updateStation(editStation.id, {
          ...editStation,
          name: name.trim(),
          url: url.trim(),
          icon,
          type,
        });
        Alert.alert(t('common.success'), t('stations.updateSuccess'));
      } else {
        // 新增模式：創建新電台
        await StorageManager.addStation({
          name: name.trim(),
          url: url.trim(),
          icon,
          type,
          isFavorite: false,
        });
        Alert.alert(t('common.success'), t('stations.addSuccess'));
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert(t('common.error'), String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchStations = () => {
    navigation.navigate('SearchStations');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {!isEditMode && (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.methodButton, styles.methodButtonPrimary]}
            onPress={handleSearchStations}
          >
            <Ionicons name="search" size={IconSizes.md} color={Colors.text} />
            <Text style={styles.methodButtonText}>{t('stations.autoSearch')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>
        {isEditMode ? t('common.edit') : t('stations.manualAdd')}
      </Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('stations.stationName')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="例如：台灣廣播電台"
            placeholderTextColor={Colors.placeholder}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('stations.stationUrl')}</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="https://..."
            placeholderTextColor={Colors.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('stations.stationType')}</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeButton, type === 'radio' && styles.typeButtonActive]}
              onPress={() => setType('radio')}
            >
              <Ionicons
                name="radio"
                size={IconSizes.md}
                color={type === 'radio' ? Colors.text : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  type === 'radio' && styles.typeButtonTextActive,
                ]}
              >
                {t('stations.radioStream')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, type === 'podcast' && styles.typeButtonActive]}
              onPress={() => setType('podcast')}
            >
              <Ionicons
                name="mic"
                size={IconSizes.md}
                color={type === 'podcast' ? Colors.text : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  type === 'podcast' && styles.typeButtonTextActive,
                ]}
              >
                {t('stations.podcast')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('stations.selectIcon')}</Text>
          <TouchableOpacity style={styles.iconPicker} onPress={handleSelectIcon}>
            {icon ? (
              <Image source={{ uri: icon }} style={styles.iconPreview} />
            ) : (
              <View style={styles.iconPlaceholder}>
                <Ionicons name="image-outline" size={IconSizes.lg} color={Colors.textSecondary} />
              </View>
            )}
            <Text style={styles.iconPickerText}>點擊選擇圖示</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.text} />
          ) : (
            <>
              <Ionicons name="checkmark" size={IconSizes.md} color={Colors.text} />
              <Text style={styles.saveButtonText}>{t('common.save')}</Text>
            </>
          )}
        </TouchableOpacity>
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
  buttonRow: {
    marginBottom: Spacing.lg,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.card,
  },
  methodButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  methodButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  form: {
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  typeButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  typeButtonText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  typeButtonTextActive: {
    color: Colors.text,
    fontWeight: '600',
  },
  typeButtonDisabled: {
    opacity: 0.5,
  },
  iconPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  iconPreview: {
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
  iconPickerText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
});

