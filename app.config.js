export default {
  expo: {
    name: 'mesonRadio',
    slug: 'mesonradio',
    version: '1.0.0',
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
      versionCode: 1,
      permissions: [
        'INTERNET',
        'FOREGROUND_SERVICE',
        'WAKE_LOCK',
      ],
      newArchEnabled: false,
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
    ],
    extra: {
      eas: {
        projectId: 'your-project-id-here',
      },
    },
  },
};

