import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d9c0215e88d846a69a5c576b251630eb',
  appName: 'tudo-faz-hub',
  webDir: 'dist',
  server: {
    url: 'https://d9c0215e-88d8-46a6-9a5c-576b251630eb.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;