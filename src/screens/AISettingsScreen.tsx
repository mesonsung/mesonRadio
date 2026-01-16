/**
 * AI 設定頁面
 * AI Settings Screen
 * 
 * 支援 Gemini、ChatGPT、Grok 三種 AI 提供商
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, IconSizes, Spacing, BorderRadius, FontSizes } from '@/constants/theme';
import { SmartSearchService, AIProvider } from '@/services/SmartSearchService';

interface ProviderConfig {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  website: string;
  freeQuota: string;
  cost: string;
}

const PROVIDERS: Record<AIProvider, ProviderConfig> = {
  [AIProvider.GEMINI]: {
    name: 'Google Gemini',
    icon: 'logo-google',
    color: '#4285F4',
    website: 'https://aistudio.google.com/app/apikey',
    freeQuota: '每天 1500 次',
    cost: '免費額度最高',
  },
  [AIProvider.CHATGPT]: {
    name: 'ChatGPT (OpenAI)',
    icon: 'chatbubble-ellipses',
    color: '#10A37F',
    website: 'https://platform.openai.com/api-keys',
    freeQuota: '$5 免費額度',
    cost: '極低（$0.15/1M tokens）',
  },
  [AIProvider.GROK]: {
    name: 'Grok (xAI)',
    icon: 'flash',
    color: '#000000',
    website: 'https://console.x.ai',
    freeQuota: '待公布',
    cost: '待公布',
  },
};

export const AISettingsScreen: React.FC = () => {
  const [currentProvider, setCurrentProvider] = useState<AIProvider>(AIProvider.GEMINI);
  const [apiKeys, setApiKeys] = useState<Map<AIProvider, string>>(new Map());
  const [tempApiKey, setTempApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    await SmartSearchService.initialize();
    const provider = SmartSearchService.getCurrentProvider();
    setCurrentProvider(provider);

    // 載入所有 API Keys 狀態
    const keys = new Map<AIProvider, string>();
    for (const p of Object.values(AIProvider)) {
      const key = SmartSearchService.getAPIKey(p);
      if (key) keys.set(p, key);
    }
    setApiKeys(keys);

    // 載入當前提供商的模型設定
    await loadModelsForProvider(provider);
  };

  const loadModelsForProvider = async (provider: AIProvider) => {
    const apiKey = SmartSearchService.getAPIKey(provider);
    if (!apiKey) {
      setAvailableModels([]);
      setSelectedModel('');
      return;
    }

    setIsLoadingModels(true);
    try {
      let models: string[] = [];
      switch (provider) {
        case AIProvider.GEMINI:
          models = await SmartSearchService.getAvailableGeminiModels(apiKey);
          break;
        case AIProvider.CHATGPT:
          models = await SmartSearchService.getAvailableChatGPTModels(apiKey);
          break;
        case AIProvider.GROK:
          models = await SmartSearchService.getAvailableGrokModels(apiKey);
          break;
      }
      setAvailableModels(models);

      // 載入用戶選擇的模型
      const customModel = SmartSearchService.getCustomModel(provider);
      setSelectedModel(customModel || '');
    } catch (error) {
      console.error('載入模型列表失敗:', error);
      setAvailableModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleProviderChange = async (provider: AIProvider) => {
    setCurrentProvider(provider);
    await SmartSearchService.setAIProvider(provider);
    setTempApiKey('');
    setShowApiKey(false);
    await loadModelsForProvider(provider);
  };

  const handleModelSelect = async (modelName: string) => {
    try {
      if (modelName) {
        await SmartSearchService.setCustomModel(currentProvider, modelName);
        setSelectedModel(modelName);
        Alert.alert('成功', `已設置使用模型：${modelName}`);
      } else {
        await SmartSearchService.clearCustomModel(currentProvider);
        setSelectedModel('');
        Alert.alert('成功', '已恢復為自動選擇模型');
      }
      setShowModelPicker(false);
    } catch (error) {
      Alert.alert('錯誤', '設置模型失敗，請重試');
    }
  };

  const handleClearModel = async () => {
    Alert.alert(
      '確認',
      '確定要清除自定義模型設定嗎？將恢復為自動選擇。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          style: 'destructive',
          onPress: async () => {
            try {
              await SmartSearchService.clearCustomModel(currentProvider);
              setSelectedModel('');
              Alert.alert('成功', '已清除自定義模型設定');
            } catch (error) {
              Alert.alert('錯誤', '清除失敗');
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!tempApiKey.trim()) {
      Alert.alert('錯誤', '請輸入 API Key');
      return;
    }

    try {
      setIsSaving(true);
      await SmartSearchService.setAPIKey(currentProvider, tempApiKey.trim());
      
      // 更新本地狀態
      const newKeys = new Map(apiKeys);
      newKeys.set(currentProvider, tempApiKey.trim());
      setApiKeys(newKeys);
      setTempApiKey('');
      
      // 重新載入模型列表
      await loadModelsForProvider(currentProvider);
      
      Alert.alert('成功', `${PROVIDERS[currentProvider].name} API Key 已保存！`);
    } catch (error) {
      Alert.alert('錯誤', '保存失敗，請重試');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = (provider: AIProvider) => {
    Alert.alert(
      '確認',
      `確定要清除 ${PROVIDERS[provider].name} 的 API Key 嗎？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          style: 'destructive',
          onPress: async () => {
            try {
              await SmartSearchService.clearAPIKey(provider);
              const newKeys = new Map(apiKeys);
              newKeys.delete(provider);
              setApiKeys(newKeys);
              setTempApiKey('');
              Alert.alert('成功', 'API Key 已清除');
            } catch (error) {
              Alert.alert('錯誤', '清除失敗');
            }
          },
        },
      ]
    );
  };

  const openWebsite = (url: string) => {
    Linking.openURL(url);
  };

  const isProviderConfigured = (provider: AIProvider) => {
    return apiKeys.has(provider);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 狀態卡片 */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Ionicons
            name={apiKeys.size > 0 ? 'checkmark-circle' : 'alert-circle'}
            size={IconSizes.xl}
            color={apiKeys.size > 0 ? Colors.success : Colors.textSecondary}
          />
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>
              {apiKeys.size > 0 ? `AI 搜尋已啟用 (${apiKeys.size}/3)` : 'AI 搜尋未啟用'}
            </Text>
            <Text style={styles.statusDescription}>
              {apiKeys.size > 0
                ? `當前使用：${PROVIDERS[currentProvider].name}`
                : '選擇並配置 AI 提供商以啟用智能搜尋'}
            </Text>
          </View>
        </View>
      </View>

      {/* AI 提供商選擇 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>選擇 AI 提供商</Text>
        <View style={styles.providersContainer}>
          {Object.entries(PROVIDERS).map(([provider, config]) => (
            <TouchableOpacity
              key={provider}
              style={[
                styles.providerCard,
                currentProvider === provider && styles.providerCardActive,
                isProviderConfigured(provider as AIProvider) && styles.providerCardConfigured,
              ]}
              onPress={() => handleProviderChange(provider as AIProvider)}
            >
              <View style={styles.providerHeader}>
                <Ionicons
                  name={config.icon}
                  size={IconSizes.lg}
                  color={currentProvider === provider ? config.color : Colors.textSecondary}
                />
                {isProviderConfigured(provider as AIProvider) && (
                  <View style={styles.configuredBadge}>
                    <Ionicons name="checkmark" size={12} color={Colors.text} />
                  </View>
                )}
              </View>
              <Text style={[
                styles.providerName,
                currentProvider === provider && styles.providerNameActive,
              ]}>
                {config.name}
              </Text>
              <Text style={styles.providerQuota}>{config.freeQuota}</Text>
              <Text style={styles.providerCost}>{config.cost}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 當前提供商配置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          配置 {PROVIDERS[currentProvider].name}
        </Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={`輸入 ${PROVIDERS[currentProvider].name} API Key`}
            placeholderTextColor={Colors.placeholder}
            value={tempApiKey}
            onChangeText={setTempApiKey}
            secureTextEntry={!showApiKey}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowApiKey(!showApiKey)}
          >
            <Ionicons
              name={showApiKey ? 'eye-off' : 'eye'}
              size={IconSizes.md}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => openWebsite(PROVIDERS[currentProvider].website)}
        >
          <Ionicons name="open-outline" size={IconSizes.sm} color={Colors.primary} />
          <Text style={styles.linkButtonText}>
            前往 {PROVIDERS[currentProvider].name} 獲取 API Key
          </Text>
        </TouchableOpacity>

<<<<<<< HEAD
=======
        {/* 模型選擇 */}
        {isProviderConfigured(currentProvider) && (
          <View style={styles.modelSection}>
            <Text style={styles.modelSectionTitle}>選擇 AI 模型</Text>
            <Text style={styles.modelSectionDescription}>
              選擇要使用的具體模型，或留空使用自動選擇（推薦最新版本）
            </Text>
            
            {isLoadingModels ? (
              <View style={styles.modelLoadingContainer}>
                <Text style={styles.modelLoadingText}>載入模型列表中...</Text>
              </View>
            ) : availableModels.length > 0 ? (
              <>
                <TouchableOpacity
                  style={styles.modelSelector}
                  onPress={() => setShowModelPicker(!showModelPicker)}
                >
                  <View style={styles.modelSelectorContent}>
                    <Ionicons name="cube" size={IconSizes.md} color={Colors.primary} />
                    <Text style={styles.modelSelectorText}>
                      {selectedModel || '自動選擇（推薦最新版本）'}
                    </Text>
                  </View>
                  <Ionicons
                    name={showModelPicker ? 'chevron-up' : 'chevron-down'}
                    size={IconSizes.md}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>

                {showModelPicker && (
                  <View style={styles.modelListContainer}>
                    <ScrollView style={styles.modelList} nestedScrollEnabled>
                      <TouchableOpacity
                        style={[
                          styles.modelItem,
                          !selectedModel && styles.modelItemSelected,
                        ]}
                        onPress={() => handleModelSelect('')}
                      >
                        <Text style={[
                          styles.modelItemText,
                          !selectedModel && styles.modelItemTextSelected,
                        ]}>
                          自動選擇（推薦最新版本）
                        </Text>
                        {!selectedModel && (
                          <Ionicons name="checkmark" size={IconSizes.sm} color={Colors.primary} />
                        )}
                      </TouchableOpacity>
                      {availableModels.map((model) => (
                        <TouchableOpacity
                          key={model}
                          style={[
                            styles.modelItem,
                            selectedModel === model && styles.modelItemSelected,
                          ]}
                          onPress={() => handleModelSelect(model)}
                        >
                          <Text style={[
                            styles.modelItemText,
                            selectedModel === model && styles.modelItemTextSelected,
                          ]}>
                            {model}
                          </Text>
                          {selectedModel === model && (
                            <Ionicons name="checkmark" size={IconSizes.sm} color={Colors.primary} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {selectedModel && (
                  <TouchableOpacity
                    style={styles.clearModelButton}
                    onPress={handleClearModel}
                  >
                    <Ionicons name="close-circle" size={IconSizes.sm} color={Colors.error} />
                    <Text style={styles.clearModelButtonText}>清除自定義模型</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={styles.modelEmptyContainer}>
                <Text style={styles.modelEmptyText}>
                  無法載入模型列表，將使用預設模型
                </Text>
              </View>
            )}
          </View>
        )}

>>>>>>> 99cfb686d0b7f75dd5fab96cab46ed6cc5e9013e
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.saveButton, isSaving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Ionicons name="save" size={IconSizes.md} color={Colors.text} />
            <Text style={styles.buttonText}>
              {isSaving ? '保存中...' : '保存設定'}
            </Text>
          </TouchableOpacity>

          {isProviderConfigured(currentProvider) && (
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={() => handleClear(currentProvider)}
            >
              <Ionicons name="trash" size={IconSizes.md} color={Colors.error} />
              <Text style={[styles.buttonText, styles.clearButtonText]}>清除</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 比較表格 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI 提供商比較</Text>
        <View style={styles.compareTable}>
          <View style={styles.compareRow}>
            <Text style={styles.compareLabel}>提供商</Text>
            <Text style={styles.compareLabel}>免費額度</Text>
            <Text style={styles.compareLabel}>成本</Text>
          </View>
          {Object.entries(PROVIDERS).map(([provider, config]) => (
            <View key={provider} style={styles.compareRow}>
              <Text style={styles.compareCell}>{config.name}</Text>
              <Text style={styles.compareCell}>{config.freeQuota}</Text>
              <Text style={styles.compareCell}>{config.cost}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 使用說明 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>使用說明</Text>
        <View style={styles.stepContainer}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>
              選擇一個 AI 提供商（推薦 Gemini，免費額度最高）
            </Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>
              點擊「前往獲取 API Key」創建帳號
            </Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>
              複製 API Key 並貼上到輸入框
            </Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <Text style={styles.stepText}>
              保存後即可使用 AI 智能搜尋
            </Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>5</Text>
            </View>
            <Text style={styles.stepText}>
              可配置多個提供商，切換使用
            </Text>
          </View>
        </View>
      </View>

      {/* 注意事項 */}
      <View style={[styles.section, styles.noteSection]}>
        <Ionicons name="information-circle" size={IconSizes.md} color={Colors.warning} />
        <View style={styles.noteContent}>
          <Text style={styles.noteTitle}>注意事項</Text>
          <Text style={styles.noteText}>
            • API Key 僅保存在你的裝置上，我們不會收集{'\n'}
            • 推薦 Gemini：免費額度最高（每天 1500 次）{'\n'}
            • ChatGPT：$5 免費額度，超出後成本極低{'\n'}
            • Grok：最新 AI，需要 X Premium 訂閱{'\n'}
            • 沒有 API Key 仍可使用本地搜尋功能
          </Text>
        </View>
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
    padding: 16,
  },
  statusCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  providersContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  providerCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  providerCardActive: {
    borderColor: Colors.primary,
  },
  providerCardConfigured: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  providerHeader: {
    position: 'relative',
    marginBottom: 8,
  },
  configuredBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.success,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  providerNameActive: {
    color: Colors.primary,
  },
  providerQuota: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 2,
  },
  providerCost: {
    fontSize: 10,
    color: Colors.success,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    height: 48,
    color: Colors.text,
    fontSize: 14,
  },
  eyeButton: {
    padding: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 16,
  },
  linkButtonText: {
    fontSize: 14,
    color: Colors.primary,
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  clearButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  clearButtonText: {
    color: Colors.error,
  },
  compareTable: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    overflow: 'hidden',
  },
  compareRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  compareLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  compareCell: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    padding: 10,
  },
  stepContainer: {
    gap: 12,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  noteSection: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  noteContent: {
    marginLeft: 12,
    flex: 1,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warning,
    marginBottom: 8,
  },
  noteText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
<<<<<<< HEAD
=======
  modelSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.background,
  },
  modelSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  modelSectionDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 16,
  },
  modelLoadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  modelLoadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  modelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  modelSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modelSelectorText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
    flex: 1,
  },
  modelListContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    maxHeight: 200,
    marginBottom: 8,
  },
  modelList: {
    maxHeight: 200,
  },
  modelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  modelItemSelected: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  modelItemText: {
    fontSize: 13,
    color: Colors.text,
    flex: 1,
  },
  modelItemTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  clearModelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    marginTop: 4,
  },
  clearModelButtonText: {
    fontSize: 12,
    color: Colors.error,
    marginLeft: 4,
  },
  modelEmptyContainer: {
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 8,
  },
  modelEmptyText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
>>>>>>> 99cfb686d0b7f75dd5fab96cab46ed6cc5e9013e
});
