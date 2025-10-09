export default {
  expo: {
    name: 'mesonRadio',
    slug: 'mesonradio',
    version: '1.0.3',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#1a1a2e',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.meson.mesonradio',
      buildNumber: '1',
      infoPlist: {
        UIBackgroundModes: ['audio'],
        NSMicrophoneUsageDescription: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#1a1a2e',
      },
      package: 'com.meson.mesonradio',
      permissions: [
        'INTERNET',
        'FOREGROUND_SERVICE',
        'FOREGROUND_SERVICE_MEDIA_PLAYBACK',
        'WAKE_LOCK',
        'ACCESS_NETWORK_STATE',
        'RECEIVE_BOOT_COMPLETED',
        'POST_NOTIFICATIONS',
      ],
      newArchEnabled: true,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      [
        'expo-av',
        {
          microphonePermission: false,
        },
      ],
      'expo-localization',
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#1a1a2e',
          sounds: [],
        },
      ],
      [
        'expo-background-fetch',
        {
          minimumInterval: 15,
        },
      ],
      'expo-task-manager',
    ],
    extra: {
      eas: {
        projectId: 'afb3c6af-1be6-4885-8f79-1414c0a9f7c8',
      },
    },
  },
};

