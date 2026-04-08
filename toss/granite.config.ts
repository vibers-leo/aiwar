import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'aiwar',
  brand: {
    displayName: 'AGI War',
    primaryColor: '#1B1B2F',
    icon: 'https://vibers.co.kr/favicon.ico',
  },
  web: {
    host: 'localhost',
    port: 3420,
    commands: { dev: 'vite', build: 'vite build' },
  },
  permissions: [],
  webViewProps: { type: 'partner' },
});
