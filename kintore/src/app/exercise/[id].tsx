import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LineChart } from '../../components/charts';
import { Btn, Card, Empty, SectionTitle, Stat, s as ui } from '../../components/ui';
import { exerciseSessions, fmtDate, fmtNum, fmtShortDate, fmtWeight, toUnit } from '../../lib/calc';
import { confirm } from '../../lib/platform';
import { useExerciseLookup, useStore } from '../../lib/store';
import { C } from '../../lib/theme';
import { EQUIP_LABEL, PART_LABEL } from '../../lib/types';

export default function ExerciseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lookup = useExerciseLookup();
  const workouts = useStore((s) => s.workouts);
  const unit = useStore((s) => s.settings.unit);
  const deleteCustom = useStore((s) => s.deleteCustomExercise);

  const ex = lookup(id);
  const sessions = exerciseSessions(workouts, id);
  const weighted = sessions.some((s) => s.maxWeight > 0);

  const chart = [...sessions]
    .reverse()
    .slice(-20)
    .map((s) => ({
      label: fmtShortDate(s.date),
      value: weighted ? toUnit(s.bestE1rm, unit) : Math.max(...s.sets.map((x) => x.reps ?? 0)),
    }));

  const maxW = Math.max(0, ...sessions.map((s) => s.maxWeight));
  const max1 = Math.max(0, ...sessions.map((s) => s.bestE1rm));
  const maxV = Math.max(0, ...sessions.map((s) => s.volume));
  const maxReps = Math.max(0, ...sessions.flatMap((s) => s.sets.map((x) => x.reps ?? 0)));

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
      <Text style={ui.h1}>{ex.name}</Text>
      <Text style={[ui.sub, { marginTop: 4 }]}>
        {PART_LABEL[ex.part]}・{EQUIP_LABEL[ex.equip]}
        {ex.custom ? '・カスタム' : ''}
      </Text>

      {sessions.length === 0 ? (
        <Empty
          icon="barbell-outline"
          title="まだ記録がありません"
          body="この種目をワークアウトで記録すると、自己ベストと推移グラフが表示されます"
        />
      ) : (
        <>
          <SectionTitle>自己ベスト</SectionTitle>
          <Card>
            {weighted ? (
              <View style={ui.row}>
                <Stat label="最大重量" value={fmtWeight(maxW, unit)} unit={unit} />
                <Stat label="推定1RM" value={fmtWeight(max1, unit)} unit={unit} />
                <Stat label="最大負荷量" value={fmtNum(Math.round(toUnit(maxV, unit)))} unit={unit} />
              </View>
            ) : (
              <View style={ui.row}>
                <Stat label="最大回数" value={String(maxReps)} unit="回" />
                <Stat label="実施回数" value={String(sessions.length)} unit="回" />
              </View>
            )}
          </Card>

          <SectionTitle>{weighted ? `推定1RMの推移 (${unit})` : '最大回数の推移'}</SectionTitle>
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
                  {s.sets
                    .map((x) =>
                      (x.weight ?? 0) > 0
                        ? `${fmtWeight(x.weight ?? 0, unit)}${unit}×${x.reps}`
                        : `${x.reps}回`,
                    )
                    .join('　')}
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
              '種目一覧とルーティンから削除します。過去の記録は残ります。',
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
  date: { color: C.text, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  sets: { color: C.sub, fontSize: 14, lineHeight: 21, fontVariant: ['tabular-nums'] },
});
