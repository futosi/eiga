import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  detectPRs,
  exerciseSessions,
  fmtSec,
  fmtVal,
  startOfWeek,
  totalOf,
  weekStreak,
  workoutTotals,
} from '../src/lib/calc.ts';
import { BUILTIN_EXERCISES, DEFAULT_ROUTINES } from '../src/lib/exercises.ts';
import type { Workout } from '../src/lib/types.ts';

let n = 0;
const wk = (startedAt: number, sets: [number, boolean?][], exerciseId = 'push-up'): Workout => ({
  id: `w${n++}`,
  name: 't',
  startedAt,
  finishedAt: startedAt + 3600000,
  exercises: [
    {
      id: `e${n++}`,
      exerciseId,
      sets: sets.map(([reps, done = true]) => ({ id: `s${n++}`, reps, done })),
    },
  ],
});

test('表示: 回数と秒数', () => {
  assert.equal(fmtVal('reps', 20), '20回');
  assert.equal(fmtVal('time', 45), '45秒');
  assert.equal(fmtSec(90), '1分30秒');
  assert.equal(fmtSec(120), '2分');
});

test('合計は完了セットだけ。回数と秒数は分けて数える', () => {
  const w = wk(0, [[20], [15], [10, false]]);
  const kind = (id: string) => (id === 'plank' ? ('time' as const) : ('reps' as const));
  assert.deepEqual(workoutTotals(w, kind), { reps: 35, seconds: 0, sets: 2 });
  assert.deepEqual(workoutTotals(wk(0, [[30], [40]], 'plank'), kind), { reps: 0, seconds: 70, sets: 2 });
});

test('自己ベスト: 初回は対象外、1セットの最大が増えたときだけ', () => {
  const first = wk(1, [[20], [18]]);
  assert.deepEqual(detectPRs(first, []), []);
  assert.deepEqual(detectPRs(wk(2, [[21]]), [first]), [{ exerciseId: 'push-up', value: 21 }]);
  assert.deepEqual(detectPRs(wk(3, [[20]]), [first]), []);
  assert.deepEqual(detectPRs(wk(4, [[50, false]]), [first]), []);
});

test('種目の履歴は新しい順、合計は期間で絞れる', () => {
  const ws = [wk(100, [[10]]), wk(300, [[25], [20]]), wk(200, [[30]], 'squat')];
  const s = exerciseSessions(ws, 'push-up');
  assert.deepEqual(s.map((x) => x.best), [25, 10]);
  assert.equal(s[0].total, 45);
  assert.equal(totalOf(ws, 'push-up'), 55);
  assert.equal(totalOf(ws, 'push-up', 150), 45);
});

test('週は月曜始まり、連続週数を数える', () => {
  const sun = new Date(2026, 10, 15, 12).getTime(); // 日曜
  assert.equal(new Date(startOfWeek(sun)).getDate(), 9);
  const day = 86400000;
  const ws = [wk(sun, [[1]]), wk(sun - 7 * day, [[1]]), wk(sun - 14 * day, [[1]])];
  assert.equal(weekStreak(ws, 1, sun), 3);
  assert.equal(weekStreak(ws, 2, sun), 0);
  assert.equal(weekStreak(ws.slice(1), 1, sun), 2);
});

test('標準データ: id が重複せず、メニューは存在する種目だけを参照する', () => {
  const ids = BUILTIN_EXERCISES.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const e of BUILTIN_EXERCISES) if (e.kind === 'time') assert.ok((e.hold ?? 0) > 0, e.id);
  for (const r of DEFAULT_ROUTINES)
    for (const it of r.items) assert.ok(ids.includes(it.exerciseId), `${r.id}: ${it.exerciseId}`);
  for (const r of DEFAULT_ROUTINES.filter((x) => x.type === 'stretch'))
    for (const it of r.items)
      assert.equal(BUILTIN_EXERCISES.find((e) => e.id === it.exerciseId)?.part, 'stretch', it.exerciseId);
});
