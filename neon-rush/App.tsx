import React, { useEffect, useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { storage } from './src/services/StorageService';
import { iapService } from './src/services/IAPService';
import { adService } from './src/services/AdService';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const onReady = useCallback(async () => {
    try {
      const data = await storage.load();
      adService.setAdsEnabled(!data.removeAds);
      await iapService.init();
    } catch (e) {
      console.warn('App init error:', e);
    } finally {
      await SplashScreen.hideAsync();
    }
  }, []);

  useEffect(() => {
    onReady();
  }, [onReady]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
