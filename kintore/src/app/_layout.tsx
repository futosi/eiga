import Stack from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { setupNotifications } from '../lib/platform';
import { useStore } from '../lib/store';
import { C } from '../lib/theme';

setupNotifications();

export default function RootLayout() {
  const [ready, setReady] = useState(useStore.persist.hasHydrated());
  useEffect(() => {
    if (ready) return;
    return useStore.persist.onFinishHydration(() => setReady(true));
  }, [ready]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: C.bg },
          headerTintColor: C.text,
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: C.bg },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="workout"
          options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }}
        />
        <Stack.Screen name="exercise/[id]" options={{ title: '種目' }} />
        <Stack.Screen name="history/[id]" options={{ title: 'ワークアウト' }} />
        <Stack.Screen name="routine/[id]" options={{ title: 'ルーティン' }} />
      </Stack>
    </>
  );
}
