import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { fmtDate, fmtDuration, fmtSec, fmtVal, isCounted, workoutTotals } from '../lib/calc';
import { useExerciseLookup } from '../lib/store';
import { C } from '../lib/theme';
import type { Workout } from '../lib/types';
import { Card, Stat, s as ui } from './ui';

/** 履歴一覧のカード（compact）と詳細画面のヘッダーで共用する */
export function WorkoutSummary({ workout: w, compact }: { workout: Workout; compact?: boolean }) {
  const lookup = useExerciseLookup();
  const prCount = w.prs?.length ?? 0;
  const t = workoutTotals(w, (id) => lookup(id).kind);

  return (
    <Card>
      <View style={[ui.row, { justifyContent: 'space-between' }]}>
        <Text style={st.name} numberOfLines={1}>
          {w.name}
        </Text>
        {prCount > 0 && (
          <View style={st.pr}>
            <Ionicons name="trophy" size={13} color={C.gold} />
            <Text style={st.prText}>自己ベスト {prCount}</Text>
          </View>
        )}
      </View>
      <Text style={[ui.sub, { marginTop: 2 }]}>{fmtDate(w.startedAt)}</Text>

      <View style={[ui.row, { marginTop: 12 }]}>
        <Stat label="時間" value={fmtDuration((w.finishedAt ?? w.startedAt) - w.startedAt)} />
        {t.reps > 0 && <Stat label="合計回数" value={String(t.reps)} unit="回" />}
        {t.seconds > 0 && <Stat label="保持時間" value={fmtSec(t.seconds)} />}
        <Stat label="セット" value={String(t.sets)} />
      </View>

      {compact && (
        <View style={{ marginTop: 12, gap: 3 }}>
          {w.exercises.slice(0, 4).map((x) => {
            const ex = lookup(x.exerciseId);
            const sets = x.sets.filter(isCounted);
            const best = Math.max(0, ...sets.map((s) => s.reps ?? 0));
            return (
              <View key={x.id} style={[ui.row, { justifyContent: 'space-between' }]}>
                <Text style={st.line} numberOfLines={1}>
                  {ex.name}
                </Text>
                <Text style={st.lineRight}>
                  {sets.length > 1 ? `${sets.length}セット 最大` : ''}
                  {fmtVal(ex.kind, best)}
                </Text>
              </View>
            );
          })}
          {w.exercises.length > 4 && (
            <Text style={st.lineRight}>ほか {w.exercises.length - 4} 種目</Text>
          )}
        </View>
      )}
    </Card>
  );
}

const st = StyleSheet.create({
  name: { color: C.text, fontSize: 17, fontWeight: '800', flex: 1 },
  pr: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2E2610',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  prText: { color: C.gold, fontSize: 12, fontWeight: '700' },
  line: { color: C.sub, fontSize: 14, flex: 1 },
  lineRight: { color: C.dim, fontSize: 13, fontVariant: ['tabular-nums'] },
});
