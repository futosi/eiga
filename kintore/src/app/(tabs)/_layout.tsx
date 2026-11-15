import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { IconName } from '../../components/ui';
import { C } from '../../lib/theme';

const icon =
  (name: IconName) =>
  ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={name} size={size} color={color as string} />
  );

export default function TabsLayout() {
  const { bottom } = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.dim,
        tabBarStyle: {
          backgroundColor: C.bg,
          borderTopColor: C.border,
          height: 58 + bottom,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        sceneStyle: { backgroundColor: C.bg },
      }}>
      <Tabs.Screen name="index" options={{ title: 'ホーム', tabBarIcon: icon('body') }} />
      <Tabs.Screen name="history" options={{ title: '履歴', tabBarIcon: icon('calendar') }} />
      <Tabs.Screen name="exercises" options={{ title: '種目', tabBarIcon: icon('list') }} />
      <Tabs.Screen name="progress" options={{ title: '分析', tabBarIcon: icon('stats-chart') }} />
      <Tabs.Screen name="settings" options={{ title: '設定', tabBarIcon: icon('settings-sharp') }} />
    </Tabs>
  );
}
