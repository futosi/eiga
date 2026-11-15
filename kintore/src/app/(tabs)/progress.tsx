import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BarChart, LineChart } from '../../components/charts';
import { Btn, Card, IconBtn, NumInput, SectionTitle, Stat, s as ui } from '../../components/ui';
import {
  dateKey,
  fmtNum,
  fmtSec,
  fmtShortDate,
  isCounted,
  startOfWeek,
  totalOf,
  workoutTotals,
} from '../../lib/calc';
import { MAIN_EXERCISE_IDS } from '../../lib/exercises';
import { useExerciseLookup, useStore } from '../../lib/store';
import { C } from '../../lib/theme';
import { PART_LABEL, PARTS, type BodyPart } from '../../lib/types';

const WEEKS = 8;

export default function Progress() {
  const workouts = useStore((s) => s.workouts);
  const goal = useStore((s) => s.settings.weeklyGoal);
  const bodyWeights = useStore((s) => s.bodyWeights);
  const setBodyWeight = useStore((s) => s.setBodyWeight);
  const deleteBodyWeight = useStore((s) => s.deleteBodyWeight);
  const lookup = useExerciseLookup();
  const [bw, setBw] = useState<number | null>(null);

  const now = Date.now();

  // 直近 8 週（月曜始まり）。1 週間が 7×24h にならない場合に備えて日付で遡る
  const weekStarts: number[] = [];
  let wk = startOfWeek(now);
  for (let i = 0; i < WEEKS; i++) {
    weekStarts.unshift(wk);
    wk = startOfWeek(wk - 86400000);
  }
  const weekly = weekStarts.map((start, i) => {
    const end = weekStarts[i + 1] ?? Infinity;
    const ws = workouts.filter((w) => w.startedAt >= start && w.startedAt < end);
    let reps = 0;
    let stretchSec = 0;
    for (const w of ws) {
      reps += workoutTotals(w, (id) => lookup(id).kind).reps;
      for (const x of w.exercises)
        if (lookup(x.exerciseId).part === 'stretch')
          stretchSec += x.sets.filter(isCounted).reduce((a, s) => a + (s.reps ?? 0), 0);
    }
    return { label: fmtShortDate(start), count: ws.length, reps, stretchMin: Math.round(stretchSec / 6) / 10 };
  });

  const since = now - 30 * 86400000;
  const partSets = new Map<BodyPart, number>();
  for (const w of workouts) {
    if (w.startedAt < since) continue;
    for (const x of w.exercises) {
      const p = lookup(x.exerciseId).part;
      partSets.set(p, (partSets.get(p) ?? 0) + x.sets.filter(isCounted).length);
    }
  }
  const maxPart = Math.max(1, ...partSets.values());

  const stretchTotal = workouts.reduce(
    (a, w) =>
      a +
      w.exercises
        .filter((x) => lookup(x.exerciseId).part === 'stretch')
        .reduce((b, x) => b + x.sets.filter(isCounted).reduce((c, s) => c + (s.reps ?? 0), 0), 0),
    0,
  );

  const today = dateKey(now);
  const latestBw = bodyWeights[bodyWeights.length - 1];

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <ScrollView contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
        <Text style={ui.h1}>分析</Text>

        <Card style={{ marginTop: 16 }}>
          <Text style={[ui.sub, { marginBottom: 10 }]}>これまでの累計</Text>
          <View style={ui.row}>
            {MAIN_EXERCISE_IDS.map((id) => (
              <Stat key={id} label={lookup(id).name} value={fmtNum(totalOf(workouts, id))} unit="回" />
            ))}
          </View>
          <View style={[ui.row, { marginTop: 14 }]}>
            <Stat label="トレーニング" value={String(workouts.length)} unit="回" />
            <Stat label="ストレッチ" value={fmtSec(stretchTotal)} />
          </View>
        </Card>

        <SectionTitle>週ごとの記録回数</SectionTitle>
        <Card>
          <BarChart data={weekly.map((w) => ({ label: w.label, value: w.count }))} goal={goal} />
          <Text style={st.note}>点線は週の目標（{goal} 回）</Text>
        </Card>

        <SectionTitle>週ごとの合計回数</SectionTitle>
        <Card>
          <BarChart data={weekly.map((w) => ({ label: w.label, value: w.reps }))} />
        </Card>

        <SectionTitle>週ごとのストレッチ時間（分）</SectionTitle>
        <Card>
          <BarChart data={weekly.map((w) => ({ label: w.label, value: w.stretchMin }))} />
        </Card>

        <SectionTitle>部位別セット数（直近30日）</SectionTitle>
        <Card style={{ gap: 10 }}>
          {PARTS.map((p) => {
            const n = partSets.get(p) ?? 0;
            return (
              <View key={p} style={[ui.row, { gap: 10 }]}>
                <Text style={st.partLabel}>{PART_LABEL[p]}</Text>
                <View style={st.track}>
                  <View style={[st.fill, { width: `${(n / maxPart) * 100}%` }]} />
                </View>
                <Text style={st.partNum}>{n}</Text>
              </View>
            );
          })}
        </Card>

        <SectionTitle>体重</SectionTitle>
        <Card>
          <View style={[ui.row, { gap: 10 }]}>
            <View style={{ flex: 1 }}>
              <NumInput
                label="今日の体重"
                decimal
                value={bw}
                onChange={setBw}
                placeholder={latestBw ? `前回 ${latestBw.kg} kg` : '今日の体重 (kg)'}
                style={{ paddingVertical: 12 }}
              />
            </View>
            <Btn
              small
              label="記録"
              disabled={!bw || bw <= 0}
              onPress={() => {
                if (bw) setBodyWeight(today, bw);
                setBw(null);
              }}
              style={{ paddingVertical: 12 }}
            />
          </View>
          <View style={{ marginTop: 12 }}>
            <LineChart
              data={bodyWeights.slice(-30).map((b) => ({
                label: `${Number(b.date.slice(5, 7))}/${Number(b.date.slice(8, 10))}`,
                value: b.kg,
              }))}
            />
          </View>
          {[...bodyWeights]
            .reverse()
            .slice(0, 5)
            .map((b) => (
              <View key={b.date} style={st.bwRow}>
                <Text style={ui.sub}>{b.date.replace(/-/g, '/')}</Text>
                <View style={[ui.row, { gap: 12 }]}>
                  <Text style={st.bwVal}>{b.kg} kg</Text>
                  <IconBtn
                    icon="close"
                    size={18}
                    label={`${b.date}の体重を削除`}
                    onPress={() => deleteBodyWeight(b.date)}
                  />
                </View>
              </View>
            ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  note: { color: C.dim, fontSize: 12, marginTop: 4, textAlign: 'right' },
  partLabel: { color: C.text, width: 80, fontSize: 14, fontWeight: '600' },
  track: { flex: 1, height: 10, borderRadius: 5, backgroundColor: C.card2, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5, backgroundColor: C.accent },
  partNum: {
    color: C.sub,
    width: 30,
    textAlign: 'right',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  bwRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },
  bwVal: { color: C.text, fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
