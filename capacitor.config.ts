import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.chravel',
  appName: 'Chravel',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
