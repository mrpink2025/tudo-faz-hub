import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style as StatusBarStyle } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export function useNativeApp() {
  const [isNative, setIsNative] = useState(false);
  const [appState, setAppState] = useState('active');

  useEffect(() => {
    const setupNative = async () => {
      if (Capacitor.isNativePlatform()) {
        setIsNative(true);

        // Configure status bar
        try {
          await StatusBar.setStyle({ style: StatusBarStyle.Default });
          await StatusBar.setBackgroundColor({ color: '#1e40af' });
        } catch (error) {
          console.log('StatusBar not available:', error);
        }

        // Hide splash screen after app loads
        try {
          await SplashScreen.hide();
        } catch (error) {
          console.log('SplashScreen not available:', error);
        }

        // Listen to app state changes
        App.addListener('appStateChange', ({ isActive }) => {
          setAppState(isActive ? 'active' : 'background');
        });

        // Handle back button
        App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            App.exitApp();
          }
        });
      }
    };

    setupNative();

    return () => {
      if (Capacitor.isNativePlatform()) {
        App.removeAllListeners();
      }
    };
  }, []);

  const hideKeyboard = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Keyboard.hide();
      } catch (error) {
        console.log('Keyboard not available:', error);
      }
    }
  };

  const hapticFeedback = async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style });
      } catch (error) {
        console.log('Haptics not available:', error);
      }
    }
  };

  const exitApp = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await App.exitApp();
      } catch (error) {
        console.log('App exit not available:', error);
      }
    }
  };

  return {
    isNative,
    appState,
    hideKeyboard,
    hapticFeedback,
    exitApp
  };
}