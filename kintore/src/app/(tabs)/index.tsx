import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Btn, Card, IconBtn, SectionTitle, s as ui } from '../../components/ui';
import { dateKey, fmtSec, startOfDay, startOfWeek, totalOf, weekStreak } from '../../lib/calc';
import { MAIN_EXERCISE_IDS } from '../../lib/exercises';
import { confirm } from '../../lib/platform';
import { useExerciseLookup, useStore } from '../../lib/store';
import { C } from '../../lib/theme';
import type { Routine } from '../../lib/types';

const DOW = ['月', '火', '水', '木', '金', '土', '日'];

export default function Home() {
  const workouts = useStore((s) => s.workouts);
  const routines = useStore((s) => s.routines);
  const active = useStore((s) => s.active);
  const goal = useStore((s) => s.settings.weeklyGoal);
  const startWorkout = useStore((s) => s.startWorkout);
  const lookup = useExerciseLookup();

  const now = Date.now();
  const wk = startOfWeek(now);
  const thisWeek = workouts.filter((w) => w.startedAt >= wk);
  const doneDays = new Set(thisWeek.map((w) => dateKey(w.startedAt)));
  const streak = weekStreak(workouts, goal, now);
  const today = dateKey(now);
  const dayStart = startOfDay(now);

  const trainRoutines = routines.filter((r) => r.type === 'train');
  const stretchRoutines = routines.filter((r) => r.type === 'stretch');

  const begin = (opts?: { routine?: Routine; exerciseIds?: string[] }) => {
    const go = () => {
      startWorkout(opts);
      router.push('/workout');
    };
    if (active) {
      confirm('進行中のトレーニングがあります', '破棄して新しく始めますか？', go, '新しく始める', true);
    } else go();
  };

  const stretchSeconds = (r: Routine) =>
    r.items.reduce((a, i) => a + (i.hold ?? lookup(i.exerciseId).hold ?? 30), 0);

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <ScrollView contentContainerStyle={ui.content}>
        <Text style={ui.h1}>自重ノート</Text>

        <Card style={{ marginTop: 16 }}>
          <View style={[ui.row, { justifyContent: 'space-between' }]}>
            <View>
              <Text style={ui.sub}>今週の記録</Text>
              <Text style={st.big}>
                {thisWeek.length}
                <Text style={st.bigSub}> / {goal} 回</Text>
              </Text>
            </View>
            {streak > 0 && (
              <View style={st.streak}>
                <Ionicons name="flame" size={16} color={C.gold} />
                <Text style={st.streakText}>{streak}週連続</Text>
              </View>
            )}
          </View>
          <View style={st.days}>
            {DOW.map((d, i) => {
              const key = dateKey(wk + i * 86400000 + 43200000);
              const done = doneDays.has(key);
              return (
                <View key={d} style={{ alignItems: 'center', gap: 6 }}>
                  <Text style={[st.dow, key === today && { color: C.text }]}>{d}</Text>
                  <View
                    style={[
                      st.dot,
                      done && { backgroundColor: C.accent, borderColor: C.accent },
                      key === today && !done && { borderColor: C.sub },
                    ]}>
                    {done && <Ionicons name="checkmark" size={16} color={C.onAccent} />}
                  </View>
                </View>
              );
            })}
          </View>
        </Card>

        {active && (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/workout')}
            style={st.resume}>
            <Ionicons name="play-circle" size={28} color={C.onAccent} />
            <View style={{ flex: 1 }}>
              <Text style={st.resumeTitle}>進行中: {active.name}</Text>
              <Text style={st.resumeSub}>タップして再開</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.onAccent} />
          </Pressable>
        )}

        <SectionTitle>すぐ記録</SectionTitle>
        <View style={[ui.row, { gap: 12 }]}>
          {MAIN_EXERCISE_IDS.map((id) => {
            const ex = lookup(id);
            const todayTotal = totalOf(workouts, id, dayStart);
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityLabel={`${ex.name}を記録`}
                onPress={() => begin({ exerciseIds: [id] })}
                style={({ pressed }) => [st.quick, pressed && { opacity: 0.7 }]}>
                <Text style={st.quickName}>{ex.name}</Text>
                <Text style={st.quickToday}>
                  今日 <Text style={st.quickNum}>{todayTotal}</Text> 回
                </Text>
                <View style={st.quickGo}>
                  <Ionicons name="add" size={18} color={C.onAccent} />
                  <Text style={st.quickGoText}>記録する</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        {!active && (
          <Btn
            label="自由に種目を選んで始める"
            icon="add"
            kind="ghost"
            onPress={() => begin()}
            style={{ marginTop: 12 }}
          />
        )}

        <SectionTitle
          right={
            <Btn
              small
              kind="soft"
              icon="add"
              label="新規"
              onPress={() => router.push('/routine/new?type=train')}
            />
          }>
          メニュー
        </SectionTitle>
        {trainRoutines.map((r) => (
          <Card key={r.id} style={{ marginBottom: 12 }}>
            <View style={[ui.row, { justifyContent: 'space-between' }]}>
              <Text style={st.routineName}>{r.name}</Text>
              <IconBtn
                icon="ellipsis-horizontal"
                label={`${r.name}を編集`}
                onPress={() => router.push(`/routine/${r.id}`)}
              />
            </View>
            <Text style={st.routineBody} numberOfLines={2}>
              {r.items.map((i) => lookup(i.exerciseId).name).join('、') || '種目なし'}
            </Text>
            <Btn
              small
              kind="soft"
              label="このメニューで開始"
              onPress={() => begin({ routine: r })}
              style={{ marginTop: 12 }}
            />
          </Card>
        ))}

        <SectionTitle
          right={
            <Btn
              small
              kind="soft"
              icon="add"
              label="新規"
              onPress={() => router.push('/routine/new?type=stretch')}
            />
          }>
          ストレッチ
        </SectionTitle>
        {stretchRoutines.map((r) => (
          <Card key={r.id} style={{ marginBottom: 12 }}>
            <View style={[ui.row, { justifyContent: 'space-between' }]}>
              <Text style={st.routineName}>{r.name}</Text>
              <IconBtn
                icon="ellipsis-horizontal"
                label={`${r.name}を編集`}
                onPress={() => router.push(`/routine/${r.id}`)}
              />
            </View>
            <Text style={st.routineBody}>
              {r.items.length}種目・約{fmtSec(stretchSeconds(r))}
            </Text>
            <Btn
              small
              kind="soft"
              icon="play"
              label="ストレッチを始める"
              onPress={() => router.push(`/stretch?id=${r.id}`)}
              style={{ marginTop: 12 }}
            />
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  big: { color: C.text, fontSize: 34, fontWeight: '900', fontVariant: ['tabular-nums'] },
  bigSub: { color: C.sub, fontSize: 16, fontWeight: '600' },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2E2610',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  streakText: { color: C.gold, fontWeight: '700', fontSize: 13 },
  days: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  dow: { color: C.dim, fontSize: 12, fontWeight: '600' },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resume: {
    marginTop: 16,
    backgroundColor: C.accent,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resumeTitle: { color: C.onAccent, fontSize: 16, fontWeight: '800' },
  resumeSub: { color: C.onAccent, fontSize: 12, opacity: 0.7 },
  quick: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 6,
  },
  quickName: { color: C.text, fontSize: 18, fontWeight: '900' },
  quickToday: { color: C.sub, fontSize: 13 },
  quickNum: { color: C.accent, fontSize: 22, fontWeight: '900', fontVariant: ['tabular-nums'] },
  quickGo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 6,
  },
  quickGoText: { color: C.onAccent, fontWeight: '800', fontSize: 15 },
  routineName: { color: C.text, fontSize: 17, fontWeight: '800', flex: 1 },
  routineBody: { color: C.sub, fontSize: 13, marginTop: 6, lineHeight: 19 },
});
