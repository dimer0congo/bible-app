import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SettingsProvider } from '../context/SettingsContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { createTables, seedDatabase } from '../services/DatabaseService';

// // Prevent the splash screen from auto-hiding before asset loading is complete.
// SplashScreen.preventAutoHideAsync().catch(() => {
//   /* reloading the app might trigger some race conditions, ignore them */
// });

function RootLayoutNav() {
  const { theme } = useTheme();

  return (
    <NavigationThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="reader/[...ref]" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        await createTables();
        await seedDatabase();
      } catch (e) {
        console.warn(e);
      } finally {
        if (loaded) {
          await SplashScreen.hideAsync();
        }
      }
    }
    prepare();
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SettingsProvider>
          <ThemeProvider>
            <RootLayoutNav />
          </ThemeProvider>
        </SettingsProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
