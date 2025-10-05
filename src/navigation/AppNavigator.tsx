/**
 * 應用導航器
 * App Navigator
 */

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '@/screens/HomeScreen';
import { StationsScreen } from '@/screens/StationsScreen';
import { FavoritesScreen } from '@/screens/FavoritesScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { AddStationScreen } from '@/screens/AddStationScreen';
import { SearchStationsScreen } from '@/screens/SearchStationsScreen';
import { AISettingsScreen } from '@/screens/AISettingsScreen';
import { AIAssistantScreen } from '@/screens/AIAssistantScreen';
import { Colors, FontSizes } from '@/constants/theme';
import { t, addLanguageChangeListener } from '@/utils/i18n';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const StationsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.surface,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="StationsList"
        component={StationsScreen}
        options={{ title: t('stations.title') }}
      />
      <Stack.Screen
        name="AddStation"
        component={AddStationScreen}
        options={{ title: t('stations.addStation') }}
      />
      <Stack.Screen
        name="EditStation"
        component={AddStationScreen}
        options={{ title: t('common.edit') }}
      />
      <Stack.Screen
        name="SearchStations"
        component={SearchStationsScreen}
        options={{ title: t('search.title') }}
      />
    </Stack.Navigator>
  );
};

const SettingsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.surface,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="SettingsList"
        component={SettingsScreen}
        options={{ title: t('tabs.settings') }}
      />
      <Stack.Screen
        name="AISettings"
        component={AISettingsScreen}
        options={{ title: 'AI 智能搜尋' }}
      />
    </Stack.Navigator>
  );
};

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'radio';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Stations') {
            iconName = focused ? 'radio' : 'radio-outline';
          } else if (route.name === 'AIAssistant') {
            iconName = focused ? 'sparkles' : 'sparkles-outline';
          } else if (route.name === 'Favorites') {
            iconName = focused ? 'star' : 'star-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: FontSizes.xs,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: Colors.surface,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: t('tabs.home') }}
      />
      <Tab.Screen
        name="Stations"
        component={StationsStack}
        options={{ title: t('tabs.stations'), headerShown: false }}
      />
      <Tab.Screen
        name="AIAssistant"
        component={AIAssistantScreen}
        options={{ title: 'AI 助手' }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ title: t('tabs.favorites') }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStack}
        options={{ title: t('tabs.settings'), headerShown: false }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const [language, setLanguage] = useState('zh-TW');

  useEffect(() => {
    // 監聽語言變更
    const removeListener = addLanguageChangeListener((newLanguage) => {
      setLanguage(newLanguage);
    });

    // 清除監聽器
    return () => {
      removeListener();
    };
  }, []);

  return (
    <NavigationContainer
      key={language} // 強制重新渲染整個導航
      theme={{
        dark: true,
        colors: {
          primary: Colors.primary,
          background: Colors.background,
          card: Colors.surface,
          text: Colors.text,
          border: Colors.border,
          notification: Colors.error,
        },
      }}
    >
      <MainTabs />
    </NavigationContainer>
  );
};

