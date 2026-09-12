import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Suspense, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { initializeDatabase } from '@/db/initialize';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

function BootScreen() {
  return (
    <View style={styles.boot}>
      <ActivityIndicator size="large" color={colors.accent} />
      <AppText variant="body" color={colors.inkSecondary}>
        Preparing your local study data…
      </AppText>
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <Suspense fallback={<BootScreen />}>
          <SQLiteProvider databaseName="az900-prep.db" onInit={initializeDatabase} useSuspense>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShadowVisible: false,
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.ink,
                headerTitleStyle: { fontWeight: '600', color: colors.ink },
                contentStyle: { backgroundColor: colors.background },
                headerBackTitle: 'Back',
              }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="practice/setup" options={{ title: 'Practice setup' }} />
              <Stack.Screen name="practice/session" options={{ title: 'Practice', headerBackVisible: false }} />
              <Stack.Screen name="practice/results" options={{ title: 'Practice results' }} />
              <Stack.Screen name="exam/session" options={{ title: 'Mock exam', headerBackVisible: false }} />
              <Stack.Screen name="exam/results" options={{ title: 'Exam results' }} />
              <Stack.Screen name="exam/review" options={{ title: 'Review answers' }} />
              <Stack.Screen name="review" options={{ title: 'Review mistakes' }} />
            </Stack>
          </SQLiteProvider>
        </Suspense>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: colors.background,
  },
});
