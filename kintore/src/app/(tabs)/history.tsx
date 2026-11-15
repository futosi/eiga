import { router } from 'expo-router';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Empty, s as ui } from '../../components/ui';
import { WorkoutSummary } from '../../components/WorkoutSummary';
import { useStore } from '../../lib/store';
import { C } from '../../lib/theme';
import type { Workout } from '../../lib/types';

export default function History() {
  const workouts = useStore((s) => s.workouts);

  const sections: { title: string; data: Workout[] }[] = [];
  for (const w of workouts) {
    const d = new Date(w.startedAt);
    const title = `${d.getFullYear()}年${d.getMonth() + 1}月`;
    const last = sections[sections.length - 1];
    if (last?.title === title) last.data.push(w);
    else sections.push({ title, data: [w] });
  }

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <SectionList
        sections={sections}
        keyExtractor={(w) => w.id}
        contentContainerStyle={ui.content}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={<Text style={ui.h1}>履歴</Text>}
        renderSectionHeader={({ section }) => (
          <View style={st.month}>
            <Text style={st.monthText}>{section.title}</Text>
            <Text style={ui.sub}>{section.data.length} 回</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/history/${item.id}`)}
            style={({ pressed }) => [{ marginBottom: 12 }, pressed && { opacity: 0.7 }]}>
            <WorkoutSummary workout={item} compact />
          </Pressable>
        )}
        ListEmptyComponent={
          <Empty
            icon="calendar-outline"
            title="まだ記録がありません"
            body="ホームからワークアウトを開始すると、ここに履歴が残ります"
          />
        }
      />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  month: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 20,
    marginBottom: 10,
  },
  monthText: { color: C.text, fontSize: 17, fontWeight: '800' },
});
