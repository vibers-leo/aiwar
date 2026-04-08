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
      './plugins/withXcode26Fix',
      // TODO: Firebase Console에서 iOS 앱 등록 후 GoogleService-Info.plist의 REVERSED_CLIENT_ID 추가
      // ['@react-native-google-signin/google-signin', { iosUrlScheme: 'com.googleusercontent.apps.XXXX' }],
    ],
    extra: {
      eas: {
        projectId: '50d3cf61-9962-4ba2-a0ea-775d5fa69af2',
      },
    },
  },
};
