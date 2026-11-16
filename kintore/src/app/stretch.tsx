import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Stack from 'expo-router/stack';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HowToView } from '../components/HowToView';
import { Btn, Empty, s as ui } from '../components/ui';
import { fmtSec, uid } from '../lib/calc';
import { confirm, success, tap } from '../lib/platform';
import { useExerciseLookup, useStore } from '../lib/store';
import { C } from '../lib/theme';
import type { Workout } from '../lib/types';

const PREP_SEC = 5;

type Phase = 'prep' | 'hold';

/** ストレッチを順番に、秒数どおりカウントダウンして進めるガイド画面 */
export default function StretchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const routine = useStore((s) => s.routines.find((r) => r.id === id));
  const addWorkout = useStore((s) => s.addWorkout);
  const lookup = useExerciseLookup();

  const steps = useMemo(
    () =>
      (routine?.items ?? []).map((it) => {
        const ex = lookup(it.exerciseId);
        return { exerciseId: it.exerciseId, name: ex.name, hold: it.hold ?? ex.hold ?? 30 };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [routine],
  );

  const startedAt = useRef(Date.now());
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('prep');
  const [endsAt, setEndsAt] = useState(() => Date.now() + PREP_SEC * 1000);
  const [pausedLeft, setPausedLeft] = useState<number | null>(null);
  const [held, setHeld] = useState<number[]>([]);
  const [now, setNow] = useState(Date.now());
  const leaving = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    activateKeepAwakeAsync('stretch').catch(() => {});
    return () => {
      deactivateKeepAwake('stretch').catch(() => {});
    };
  }, []);

  const paused = pausedLeft != null;
  const remainMs = paused ? pausedLeft : endsAt - now;
  const remain = Math.max(0, Math.ceil(remainMs / 1000));
  const step = steps[idx];

  const save = (heldSecs: number[]) => {
    const exercises = steps
      .map((s, i) => ({
        id: uid(),
        exerciseId: s.exerciseId,
        sets: heldSecs[i] > 0 ? [{ id: uid(), reps: heldSecs[i], done: true }] : [],
      }))
      .filter((x) => x.sets.length > 0);
    leaving.current = true;
    if (exercises.length === 0) {
      router.replace('/');
      return;
    }
    const w: Workout = {
      id: uid(),
      name: routine?.name ?? 'ストレッチ',
      startedAt: startedAt.current,
      finishedAt: Date.now(),
      exercises,
    };
    addWorkout(w);
    success();
    router.replace(`/history/${w.id}?done=1`);
  };

  const goNext = (heldSecs: number[]) => {
    if (idx + 1 >= steps.length) {
      save(heldSecs);
      return;
    }
    const t = Date.now();
    setNow(t);
    setIdx(idx + 1);
    setPhase('prep');
    setEndsAt(t + PREP_SEC * 1000);
  };

  // 時間になったら次の段階へ
  const handled = useRef('');
  useEffect(() => {
    if (!step || paused || remainMs > 0) return;
    const key = `${idx}-${phase}`;
    if (handled.current === key) return;
    handled.current = key;
    if (phase === 'prep') {
      tap();
      const t = Date.now();
      setNow(t);
      setPhase('hold');
      setEndsAt(t + step.hold * 1000);
    } else {
      success();
      const next = [...held];
      next[idx] = step.hold;
      setHeld(next);
      goNext(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainMs, paused, phase, idx, step]);

  if (!routine || steps.length === 0) {
    return <Empty icon="alert-circle-outline" title="ストレッチが見つかりません" />;
  }

  const togglePause = () => {
    if (paused) {
      setNow(Date.now());
      setEndsAt(Date.now() + (pausedLeft ?? 0));
      setPausedLeft(null);
    } else setPausedLeft(Math.max(0, endsAt - Date.now()));
  };

  const skip = () => {
    // スキップした種目は記録しない（準備中のスキップも同じ）
    goNext(held);
  };

  const quit = () => {
    const wasPaused = paused;
    if (!wasPaused) setPausedLeft(Math.max(0, endsAt - Date.now()));
    const doneAny = held.some((h) => h > 0);
    confirm(
      'ストレッチを終了',
      doneAny ? 'ここまでの分を記録して終了しますか？' : '記録せずに終了しますか？',
      () => save(held),
      doneAny ? '記録して終了' : '終了する',
    );
    // 確認をやめた場合は一時停止のまま残る。再開は「つづける」で行う。
  };

  const total = phase === 'prep' ? PREP_SEC : step.hold;
  const progress = Math.min(1, Math.max(0, 1 - remainMs / (total * 1000)));
  const next = steps[idx + 1];
  const remainingTotal =
    remain + (phase === 'prep' ? step.hold : 0) + steps.slice(idx + 1).reduce((a, s) => a + s.hold, 0);

  return (
    <SafeAreaView style={ui.screen} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerBackVisible: false,
          title: routine.name,
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="ストレッチを終了"
              hitSlop={14}
              onPress={quit}
              style={st.navBtn}>
              <Ionicons name="close" size={28} color={C.text} />
            </Pressable>
          ),
        }}
      />

      <ScrollView contentContainerStyle={st.body}>
        <Text style={st.counter}>
          {idx + 1} / {steps.length}　・　残り約{fmtSec(remainingTotal)}
        </Text>

        <Text style={[st.phase, phase === 'prep' && { color: C.gold }]}>
          {paused ? '一時停止中' : phase === 'prep' ? '準備してください' : 'キープ'}
        </Text>
        <Text style={st.name} accessibilityRole="header">
          {step.name}
        </Text>

        <View style={st.ring}>
          <Text style={st.time} accessibilityLabel={`残り${remain}秒`}>
            {remain}
          </Text>
          <Text style={st.sec}>秒</Text>
        </View>

        <View style={st.track}>
          <View
            style={[
              st.fill,
              { width: `${progress * 100}%`, backgroundColor: phase === 'prep' ? C.gold : C.accent },
            ]}
          />
        </View>

        <Text style={st.next}>{next ? `次: ${next.name}` : '次: 最後の種目です'}</Text>

        <View style={{ alignSelf: 'stretch', marginTop: 8 }}>
          <HowToView exerciseId={step.exerciseId} name={step.name} collapsible figureWidth={190} />
        </View>
      </ScrollView>

      <View style={st.controls}>
        <Btn
          label={paused ? 'つづける' : '一時停止'}
          icon={paused ? 'play' : 'pause'}
          kind="ghost"
          onPress={togglePause}
          style={{ flex: 1 }}
        />
        <Btn label="スキップ" icon="play-skip-forward" kind="ghost" onPress={skip} style={{ flex: 1 }} />
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  navBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  body: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  counter: { color: C.sub, fontSize: 14, fontVariant: ['tabular-nums'] },
  phase: { color: C.accent, fontSize: 16, fontWeight: '800' },
  name: { color: C.text, fontSize: 28, fontWeight: '900', textAlign: 'center' },
  ring: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 6,
    borderColor: C.card2,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  time: { color: C.text, fontSize: 72, fontWeight: '900', fontVariant: ['tabular-nums'] },
  sec: { color: C.sub, fontSize: 16, marginTop: -8 },
  track: { width: '100%', height: 8, borderRadius: 4, backgroundColor: C.card2, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  next: { color: C.sub, fontSize: 15, textAlign: 'center' },
  controls: { flexDirection: 'row', gap: 12, padding: 16 },
});
