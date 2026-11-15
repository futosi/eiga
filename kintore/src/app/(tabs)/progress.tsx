import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BarChart, LineChart } from '../../components/charts';
import { Btn, Card, IconBtn, NumInput, SectionTitle, Stat, s as ui } from '../../components/ui';
import {
  dateKey,
  fmtNum,
  fmtShortDate,
  fmtWeight,
  fromUnit,
  isCounted,
  startOfWeek,
  toUnit,
  workoutVolume,
} from '../../lib/calc';
import { useExerciseLookup, useStore } from '../../lib/store';
import { C } from '../../lib/theme';
import { PART_LABEL, PARTS, type BodyPart } from '../../lib/types';

const WEEKS = 8;

export default function Progress() {
  const workouts = useStore((s) => s.workouts);
  const unit = useStore((s) => s.settings.unit);
  const goal = useStore((s) => s.settings.weeklyGoal);
  const bodyWeights = useStore((s) => s.bodyWeights);
  const setBodyWeight = useStore((s) => s.setBodyWeight);
  const deleteBodyWeight = useStore((s) => s.deleteBodyWeight);
  const lookup = useExerciseLookup();
  const [bw, setBw] = useState<number | null>(null);

  const now = Date.now();

  // 直近 8 週（月曜始まり）。夏時間などで 1 週間が 7×24h にならない場合に備えて日付で遡る
  const weekStarts: number[] = [];
  let wk = startOfWeek(now);
  for (let i = 0; i < WEEKS; i++) {
    weekStarts.unshift(wk);
    wk = startOfWeek(wk - 86400000);
  }
  const weekly = weekStarts.map((start, i) => {
    const end = weekStarts[i + 1] ?? Infinity;
    const ws = workouts.filter((w) => w.startedAt >= start && w.startedAt < end);
    return {
      label: fmtShortDate(start),
      count: ws.length,
      volume: toUnit(
        ws.reduce((a, w) => a + workoutVolume(w), 0),
        unit,
      ),
    };
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

  const totalVolume = workouts.reduce((a, w) => a + workoutVolume(w), 0);
  const today = dateKey(now);
  const latestBw = bodyWeights[bodyWeights.length - 1];

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <ScrollView contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
        <Text style={ui.h1}>分析</Text>

        <Card style={{ marginTop: 16 }}>
          <View style={ui.row}>
            <Stat label="累計ワークアウト" value={String(workouts.length)} unit="回" />
            <Stat
              label="累計負荷量"
              value={fmtNum(Math.round(toUnit(totalVolume, unit)))}
              unit={unit}
            />
          </View>
        </Card>

        <SectionTitle>週ごとの回数</SectionTitle>
        <Card>
          <BarChart data={weekly.map((w) => ({ label: w.label, value: w.count }))} goal={goal} />
          <Text style={st.note}>点線は週の目標（{goal} 回）</Text>
        </Card>

        <SectionTitle>週ごとの総負荷量 ({unit})</SectionTitle>
        <Card>
          <BarChart data={weekly.map((w) => ({ label: w.label, value: w.volume }))} />
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
                placeholder={
                  latestBw ? `前回 ${fmtWeight(latestBw.kg, unit)} ${unit}` : `今日の体重 (${unit})`
                }
                style={{ paddingVertical: 12 }}
              />
            </View>
            <Btn
              small
              label="記録"
              disabled={!bw || bw <= 0}
              onPress={() => {
                if (bw) setBodyWeight(today, fromUnit(bw, unit));
                setBw(null);
              }}
              style={{ paddingVertical: 12 }}
            />
          </View>
          <View style={{ marginTop: 12 }}>
            <LineChart
              data={bodyWeights.slice(-30).map((b) => ({
                label: `${Number(b.date.slice(5, 7))}/${Number(b.date.slice(8, 10))}`,
                value: toUnit(b.kg, unit),
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
                  <Text style={st.bwVal}>
                    {fmtWeight(b.kg, unit)} {unit}
                  </Text>
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
  partLabel: { color: C.text, width: 52, fontSize: 14, fontWeight: '600' },
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
