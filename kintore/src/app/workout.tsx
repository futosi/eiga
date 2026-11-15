import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExercisePicker } from '../components/ExercisePicker';
import { Btn, Card, IconBtn, NumInput, s as ui } from '../components/ui';
import { fmtClock, fmtWeight, fromUnit, toUnit } from '../lib/calc';
import {
  cancelRestNotification,
  confirm,
  scheduleRestNotification,
  success,
  tap,
} from '../lib/platform';
import { lastSetsOf, useExerciseLookup, useStore } from '../lib/store';
import { C } from '../lib/theme';
import type { WorkoutExercise } from '../lib/types';

function useNow(intervalMs: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export default function WorkoutScreen() {
  // 記録中は画面を消灯させない（Web では不要）
  useEffect(() => {
    if (Platform.OS === 'web') return;
    activateKeepAwakeAsync('workout').catch(() => {});
    return () => {
      deactivateKeepAwake('workout').catch(() => {});
    };
  }, []);
  const insets = useSafeAreaInsets();
  const active = useStore((s) => s.active);
  const [picker, setPicker] = useState(false);
  const addExercise = useStore((s) => s.addExerciseToActive);
  const renameActive = useStore((s) => s.renameActive);
  const finishWorkout = useStore((s) => s.finishWorkout);
  const discardWorkout = useStore((s) => s.discardWorkout);

  // 終了・破棄のときは各ハンドラが遷移先を決めるので、ここでは二重に遷移しない
  const leaving = useRef(false);
  useEffect(() => {
    if (!active && !leaving.current) router.replace('/');
  }, [active]);
  if (!active) return null;

  const leaveDiscarding = () => {
    leaving.current = true;
    cancelRestNotification();
    discardWorkout();
    router.replace('/');
  };

  const doneCount = active.exercises.reduce(
    (a, x) => a + x.sets.filter((s) => s.done && (s.reps ?? 0) > 0).length,
    0,
  );
  const openCount = active.exercises.reduce((a, x) => a + x.sets.filter((s) => !s.done).length, 0);

  const finish = () => {
    if (doneCount === 0) {
      confirm(
        '完了したセットがありません',
        'セットの右のチェックを付けると記録されます。このワークアウトを破棄しますか？',
        leaveDiscarding,
        '破棄する',
        true,
      );
      return;
    }
    const go = () => {
      leaving.current = true;
      cancelRestNotification();
      const w = finishWorkout();
      success();
      if (w) router.replace(`/history/${w.id}?done=1`);
    };
    if (openCount > 0) {
      confirm(
        'ワークアウトを終了',
        `チェックの付いていない ${openCount} セットは記録されません。終了しますか？`,
        go,
        '終了する',
      );
    } else go();
  };

  const discard = () =>
    confirm(
      'ワークアウトを破棄',
      '入力した内容は保存されません。',
      leaveDiscarding,
      '破棄する',
      true,
    );

  return (
    <SafeAreaView style={[ui.screen, { paddingTop: insets.top < 20 ? 44 : 0 }]} edges={['top', 'bottom']}>
      <View style={st.header}>
        <IconBtn
          icon="chevron-down"
          label="最小化"
          color={C.text}
          size={26}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
        <Elapsed startedAt={active.startedAt} />
        <Btn small label="終了" onPress={finish} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[ui.content, { paddingTop: 4 }]}
          keyboardShouldPersistTaps="handled">
          <TextInput
            accessibilityLabel="ワークアウト名"
            value={active.name}
            onChangeText={renameActive}
            placeholder="ワークアウト名"
            placeholderTextColor={C.dim}
            style={st.title}
          />

          {active.exercises.map((we) => (
            <ExerciseCard key={we.id} we={we} />
          ))}

          {active.exercises.length === 0 && (
            <Text style={[ui.sub, { textAlign: 'center', marginVertical: 28 }]}>
              種目を追加して記録を始めましょう
            </Text>
          )}

          <Btn label="種目を追加" icon="add" kind="soft" onPress={() => setPicker(true)} />
          <Btn label="ワークアウトを破棄" kind="danger" onPress={discard} style={{ marginTop: 12 }} />
        </ScrollView>
        <RestBar />
      </KeyboardAvoidingView>

      <ExercisePicker
        visible={picker}
        onClose={() => setPicker(false)}
        onPick={(ex) => {
          addExercise(ex.id);
          setPicker(false);
        }}
      />
    </SafeAreaView>
  );
}

function Elapsed({ startedAt }: { startedAt: number }) {
  const now = useNow(1000);
  return (
    <View style={ui.row}>
      <Ionicons name="time-outline" size={16} color={C.sub} />
      <Text style={st.elapsed}> {fmtClock((now - startedAt) / 1000)}</Text>
    </View>
  );
}

function ExerciseCard({ we }: { we: WorkoutExercise }) {
  const lookup = useExerciseLookup();
  const unit = useStore((s) => s.settings.unit);
  const workouts = useStore((s) => s.workouts);
  const addSet = useStore((s) => s.addSet);
  const removeSet = useStore((s) => s.removeSet);
  const updateSet = useStore((s) => s.updateSet);
  const toggleSet = useStore((s) => s.toggleSet);
  const startRest = useStore((s) => s.startRest);
  const restSec = useStore((s) => s.settings.restSec);
  const removeExercise = useStore((s) => s.removeExerciseFromActive);

  const ex = lookup(we.exerciseId);
  const prev = lastSetsOf(workouts, we.exerciseId);

  return (
    <Card style={{ marginBottom: 14, paddingHorizontal: 12 }}>
      <View style={[ui.row, { justifyContent: 'space-between', marginBottom: 8 }]}>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push(`/exercise/${ex.id}`)}
          style={{ flex: 1 }}>
          <Text style={st.exName}>{ex.name}</Text>
        </Pressable>
        <IconBtn
          icon="trash-outline"
          label={`${ex.name}を削除`}
          size={20}
          onPress={() =>
            confirm('種目を削除', `${ex.name} をこのワークアウトから外しますか？`, () =>
              removeExercise(we.id),
            )
          }
        />
      </View>

      <View style={st.setRow}>
        <Text style={[st.th, st.cNo]} numberOfLines={1}>
          セット
        </Text>
        <Text style={[st.th, st.cPrev]}>前回</Text>
        <Text style={[st.th, st.cIn]}>{unit}</Text>
        <Text style={[st.th, st.cIn]}>回</Text>
        <View style={st.cChk} />
      </View>

      {we.sets.map((set, i) => {
        const p = prev[i];
        return (
          <View key={set.id} style={[st.setRow, set.done && st.setDone]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`セット${i + 1}を削除`}
              style={st.cNo}
              onLongPress={() => removeSet(we.id, set.id)}
              onPress={() =>
                confirm('セットを削除', `セット ${i + 1} を削除しますか？`, () =>
                  removeSet(we.id, set.id),
                )
              }>
              <Text style={st.setNo}>{i + 1}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="前回の値を入力"
              style={st.cPrev}
              disabled={!p}
              onPress={() => p && updateSet(we.id, set.id, { weight: p.weight, reps: p.reps })}>
              <Text style={st.prev} numberOfLines={1}>
                {p ? `${fmtWeight(p.weight ?? 0, unit)} × ${p.reps}` : '—'}
              </Text>
            </Pressable>
            <View style={st.cIn}>
              <NumInput
                label={`${ex.name} セット${i + 1} 重量`}
                decimal
                value={set.weight == null ? null : toUnit(set.weight, unit)}
                onChange={(v) =>
                  updateSet(we.id, set.id, { weight: v == null ? null : fromUnit(v, unit) })
                }
                placeholder="0"
              />
            </View>
            <View style={st.cIn}>
              <NumInput
                label={`${ex.name} セット${i + 1} 回数`}
                value={set.reps}
                onChange={(v) => updateSet(we.id, set.id, { reps: v })}
                placeholder="0"
              />
            </View>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel={`${ex.name} セット${i + 1} 完了`}
              accessibilityState={{ checked: set.done }}
              style={st.cChk}
              onPress={() => {
                if (!set.done && !(set.reps && set.reps > 0)) return; // 回数未入力は完了にしない
                tap();
                if (toggleSet(we.id, set.id)) {
                  startRest();
                  scheduleRestNotification(restSec);
                }
              }}>
              <View style={[st.check, set.done && { backgroundColor: C.accent, borderColor: C.accent }]}>
                <Ionicons name="checkmark" size={18} color={set.done ? C.onAccent : C.dim} />
              </View>
            </Pressable>
          </View>
        );
      })}

      <Btn
        small
        kind="ghost"
        icon="add"
        label="セットを追加"
        onPress={() => addSet(we.id)}
        style={{ marginTop: 8 }}
      />
    </Card>
  );
}

function RestBar() {
  const restEndsAt = useStore((s) => s.restEndsAt);
  const restTotal = useStore((s) => s.restTotal);
  const adjustRest = useStore((s) => s.adjustRest);
  const stopRest = useStore((s) => s.stopRest);
  const now = useNow(250);
  const fired = useRef<number | null>(null);

  const remain = restEndsAt ? (restEndsAt - now) / 1000 : 0;

  useEffect(() => {
    if (restEndsAt && remain <= 0 && fired.current !== restEndsAt) {
      fired.current = restEndsAt;
      success();
      stopRest();
    }
  }, [restEndsAt, remain, stopRest]);

  if (!restEndsAt || remain <= 0) return null;

  const adjust = (d: number) => {
    adjustRest(d);
    const next = useStore.getState().restEndsAt;
    if (next) scheduleRestNotification((next - Date.now()) / 1000);
  };

  return (
    <View style={st.rest}>
      <View style={[st.restFill, { width: `${Math.min(100, (remain / restTotal) * 100)}%` }]} />
      <Btn small kind="ghost" label="-15秒" onPress={() => adjust(-15)} />
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={st.restLabel}>休憩</Text>
        <Text style={st.restTime}>{fmtClock(Math.ceil(remain))}</Text>
      </View>
      <Btn small kind="ghost" label="+15秒" onPress={() => adjust(15)} />
      <Btn
        small
        label="スキップ"
        onPress={() => {
          cancelRestNotification();
          stopRest();
        }}
      />
    </View>
  );
}

const st = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  elapsed: { color: C.text, fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
  title: { color: C.text, fontSize: 24, fontWeight: '900', paddingVertical: 8, marginBottom: 8 },
  exName: { color: C.accent, fontSize: 17, fontWeight: '800' },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  setDone: { backgroundColor: C.accentDim },
  th: { color: C.dim, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  cNo: { width: 42, alignItems: 'center' },
  cPrev: { flex: 1.3, alignItems: 'center' },
  cIn: { flex: 1 },
  cChk: { width: 40, alignItems: 'center' },
  setNo: {
    color: C.text,
    fontWeight: '800',
    fontSize: 15,
    backgroundColor: C.card2,
    width: 28,
    height: 28,
    lineHeight: 28,
    borderRadius: 8,
    textAlign: 'center',
    overflow: 'hidden',
  },
  prev: { color: C.sub, fontSize: 14, fontVariant: ['tabular-nums'] },
  check: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    overflow: 'hidden',
  },
  restFill: { position: 'absolute', left: 0, top: 0, height: 3, backgroundColor: C.accent },
  restLabel: { color: C.sub, fontSize: 11, fontWeight: '600' },
  restTime: { color: C.text, fontSize: 22, fontWeight: '900', fontVariant: ['tabular-nums'] },
});
