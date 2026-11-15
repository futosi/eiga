import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Btn, Card, Empty, s as ui } from '../../components/ui';
import { WorkoutSummary } from '../../components/WorkoutSummary';
import { e1rm, fmtWeight, uid } from '../../lib/calc';
import { confirm, notify } from '../../lib/platform';
import { useExerciseLookup, useStore } from '../../lib/store';
import { C } from '../../lib/theme';

export default function WorkoutDetail() {
  const { id, done } = useLocalSearchParams<{ id: string; done?: string }>();
  const w = useStore((s) => s.workouts.find((x) => x.id === id));
  const unit = useStore((s) => s.settings.unit);
  const active = useStore((s) => s.active);
  const deleteWorkout = useStore((s) => s.deleteWorkout);
  const repeatWorkout = useStore((s) => s.repeatWorkout);
  const saveRoutine = useStore((s) => s.saveRoutine);
  const lookup = useExerciseLookup();

  if (!w) return <Empty icon="alert-circle-outline" title="ワークアウトが見つかりません" />;

  const repeat = () => {
    const go = () => {
      repeatWorkout(w);
      router.push('/workout');
    };
    if (active) confirm('進行中のワークアウトがあります', '破棄して新しく始めますか？', go, '新しく始める', true);
    else go();
  };

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
      {done === '1' && (
        <View style={st.banner}>
          <Ionicons name="checkmark-circle" size={22} color={C.accent} />
          <Text style={st.bannerText}>おつかれさまでした！記録を保存しました</Text>
        </View>
      )}

      <WorkoutSummary workout={w} />

      {(w.prs?.length ?? 0) > 0 && (
        <Card style={{ marginTop: 12, borderColor: '#5C4A12' }}>
          <View style={[ui.row, { gap: 6, marginBottom: 8 }]}>
            <Ionicons name="trophy" size={18} color={C.gold} />
            <Text style={{ color: C.gold, fontSize: 16, fontWeight: '800' }}>自己ベスト更新</Text>
          </View>
          {w.prs!.map((pr) => (
            <Text key={pr.exerciseId + pr.kind} style={st.prLine}>
              {lookup(pr.exerciseId).name}：{pr.kind === 'weight' ? '最大重量' : '推定1RM'}{' '}
              {fmtWeight(pr.value, unit)}
              {unit}
            </Text>
          ))}
        </Card>
      )}

      {w.exercises.map((x) => {
        const ex = lookup(x.exerciseId);
        return (
          <Card key={x.id} style={{ marginTop: 12 }}>
            <Pressable accessibilityRole="link" onPress={() => router.push(`/exercise/${ex.id}`)}>
              <Text style={st.exName}>{ex.name}</Text>
            </Pressable>
            {x.sets.map((s, i) => (
              <View key={s.id} style={st.setRow}>
                <Text style={st.setNo}>{i + 1}</Text>
                <Text style={st.setMain}>
                  {fmtWeight(s.weight ?? 0, unit)} {unit} × {s.reps} 回
                </Text>
                <Text style={st.setSub}>
                  {(s.weight ?? 0) > 0
                    ? `1RM ${fmtWeight(e1rm(s.weight ?? 0, s.reps ?? 0), unit)}`
                    : ''}
                </Text>
              </View>
            ))}
          </Card>
        );
      })}

      <Btn label="同じメニューでもう一度" icon="repeat" onPress={repeat} style={{ marginTop: 20 }} />
      <Btn
        label="ルーティンとして保存"
        icon="bookmark-outline"
        kind="ghost"
        style={{ marginTop: 12 }}
        onPress={() => {
          saveRoutine({
            id: uid(),
            name: w.name,
            items: w.exercises.map((x) => ({ exerciseId: x.exerciseId, sets: x.sets.length })),
          });
          notify('ルーティンに保存しました', 'ホーム画面から開始できます');
        }}
      />
      <Btn
        label="この記録を削除"
        icon="trash-outline"
        kind="danger"
        style={{ marginTop: 12 }}
        onPress={() =>
          confirm(
            '記録を削除',
            'このワークアウトの記録を削除します。元に戻せません。',
            () => {
              router.canGoBack() ? router.back() : router.replace('/history');
              deleteWorkout(w.id);
            },
            '削除する',
            true,
          )
        }
      />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.accentDim,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  bannerText: { color: C.accent, fontWeight: '700', fontSize: 14 },
  prLine: { color: C.text, fontSize: 14, lineHeight: 22 },
  exName: { color: C.accent, fontSize: 16, fontWeight: '800', marginBottom: 8 },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, gap: 12 },
  setNo: { color: C.dim, width: 20, fontWeight: '700', textAlign: 'center' },
  setMain: { color: C.text, fontSize: 15, fontWeight: '600', flex: 1, fontVariant: ['tabular-nums'] },
  setSub: { color: C.dim, fontSize: 13, fontVariant: ['tabular-nums'] },
});
