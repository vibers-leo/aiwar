export default {
  expo: {
    name: 'AI 워',
    slug: 'vibers-aiwar',
    scheme: 'aiwar',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#050505',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.vibers.aiwar',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#050505',
      },
      package: 'com.vibers.aiwar',
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-secure-store',
      'expo-asset',
    ],
    extra: {
      eas: {
        projectId: '',
      },
    },
  },
};
