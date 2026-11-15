import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LineChart } from '../../components/charts';
import { Btn, Card, Empty, SectionTitle, Stat, s as ui } from '../../components/ui';
import { exerciseSessions, fmtDate, fmtShortDate, fmtVal } from '../../lib/calc';
import { confirm } from '../../lib/platform';
import { useExerciseLookup, useStore } from '../../lib/store';
import { C } from '../../lib/theme';
import { KIND_LABEL, PART_LABEL } from '../../lib/types';

export default function ExerciseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lookup = useExerciseLookup();
  const workouts = useStore((s) => s.workouts);
  const deleteCustom = useStore((s) => s.deleteCustomExercise);

  const ex = lookup(id);
  const sessions = exerciseSessions(workouts, id);
  const isTime = ex.kind === 'time';

  const chart = [...sessions]
    .reverse()
    .slice(-20)
    .map((s) => ({ label: fmtShortDate(s.date), value: s.best }));

  const best = Math.max(0, ...sessions.map((s) => s.best));
  const total = sessions.reduce((a, s) => a + s.total, 0);
  const bestDay = Math.max(0, ...sessions.map((s) => s.total));

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
      <Text style={ui.h1}>{ex.name}</Text>
      <Text style={[ui.sub, { marginTop: 4 }]}>
        {PART_LABEL[ex.part]}・{KIND_LABEL[ex.kind]}
        {ex.custom ? '・カスタム' : ''}
      </Text>

      {sessions.length === 0 ? (
        <Empty
          icon="body-outline"
          title="まだ記録がありません"
          body="この種目を記録すると、自己ベストと推移グラフが表示されます"
        />
      ) : (
        <>
          <SectionTitle>記録</SectionTitle>
          <Card>
            <Text style={[ui.sub, { marginBottom: 10 }]}>自己ベスト</Text>
            <Text style={st.bestNum}>{fmtVal(ex.kind, best)}</Text>
            <Text style={[ui.sub, { marginTop: 2, marginBottom: 14 }]}>1セットの最大</Text>
            <Stat label="1日の最大合計" value={fmtVal(ex.kind, bestDay)} />
            <View style={{ height: 12 }} />
            <Stat label="累計" value={fmtVal(ex.kind, total)} />
            <View style={{ height: 12 }} />
            <Stat label="実施した日数" value={String(sessions.length)} unit="日" />
          </Card>

          <SectionTitle>{isTime ? '1セットの最長時間の推移（秒）' : '1セットの最大回数の推移'}</SectionTitle>
          <Card>
            <LineChart data={chart} />
          </Card>

          <SectionTitle>履歴</SectionTitle>
          {sessions.map((s) => (
            <Pressable
              key={s.workoutId}
              accessibilityRole="button"
              onPress={() => router.push(`/history/${s.workoutId}`)}>
              <Card style={{ marginBottom: 10 }}>
                <Text style={st.date}>{fmtDate(s.date)}</Text>
                <Text style={st.sets}>
                  {s.sets.map((x) => fmtVal(ex.kind, x.reps ?? 0)).join('　')}
                </Text>
              </Card>
            </Pressable>
          ))}
        </>
      )}

      {ex.custom && (
        <Btn
          label="このカスタム種目を削除"
          kind="danger"
          icon="trash-outline"
          style={{ marginTop: 20 }}
          onPress={() =>
            confirm(
              '種目を削除',
              '種目一覧とメニューから削除します。過去の記録は残ります。',
              () => {
                router.back();
                deleteCustom(ex.id);
              },
              '削除する',
              true,
            )
          }
        />
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  bestNum: { color: C.accent, fontSize: 40, fontWeight: '900', fontVariant: ['tabular-nums'] },
  date: { color: C.text, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  sets: { color: C.sub, fontSize: 14, lineHeight: 21, fontVariant: ['tabular-nums'] },
});
