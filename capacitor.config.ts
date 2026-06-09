import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shashanklearn.app',
  appName: 'ShashankLearn',
  webDir: 'dist',
  android: {
    // Allow the bundled app to reach the HLS test streams over the network.
    allowMixedContent: true,
  },
};

export default config;
