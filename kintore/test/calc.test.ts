import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  detectPRs,
  e1rm,
  exerciseSessions,
  fromUnit,
  startOfWeek,
  toUnit,
  weekStreak,
  workoutVolume,
} from '../src/lib/calc.ts';
import type { Workout } from '../src/lib/types.ts';

let n = 0;
const wk = (startedAt: number, sets: [number, number, boolean?][], exerciseId = 'bench-press'): Workout => ({
  id: `w${n++}`,
  name: 't',
  startedAt,
  finishedAt: startedAt + 3600000,
  exercises: [
    {
      id: `e${n++}`,
      exerciseId,
      sets: sets.map(([weight, reps, done = true]) => ({ id: `s${n++}`, weight, reps, done })),
    },
  ],
});

test('e1rm: Epley, 1回はそのまま', () => {
  assert.equal(e1rm(100, 1), 100);
  assert.equal(e1rm(100, 10), 100 * (1 + 10 / 30));
  assert.equal(e1rm(0, 10), 0);
});

test('単位変換は往復で値が変わらない', () => {
  assert.equal(toUnit(fromUnit(135, 'lb'), 'lb'), 135);
  assert.equal(toUnit(60, 'kg'), 60);
});

test('総負荷量は完了セットだけ数える', () => {
  assert.equal(workoutVolume(wk(0, [[60, 10], [60, 8], [100, 5, false]])), 60 * 10 + 60 * 8);
});

test('自己ベスト: 初回は対象外、重量更新と1RM更新を検出', () => {
  const first = wk(1, [[60, 10]]);
  assert.deepEqual(detectPRs(first, []), []);
  assert.deepEqual(detectPRs(wk(2, [[62.5, 8]]), [first]), [
    { exerciseId: 'bench-press', kind: 'weight', value: 62.5 },
  ]);
  const byReps = detectPRs(wk(3, [[60, 12]]), [first]);
  assert.equal(byReps[0].kind, 'e1rm');
  assert.deepEqual(detectPRs(wk(4, [[60, 10]]), [first]), []);
});

test('種目の履歴は新しい順', () => {
  const ws = [wk(100, [[50, 5]]), wk(300, [[70, 5]]), wk(200, [[60, 5]], 'squat')];
  assert.deepEqual(exerciseSessions(ws, 'bench-press').map((s) => s.maxWeight), [70, 50]);
});

test('週は月曜始まり、連続週数を数える', () => {
  const sun = new Date(2026, 10, 15, 12).getTime(); // 日曜
  assert.equal(new Date(startOfWeek(sun)).getDate(), 9);
  const day = 86400000;
  const ws = [wk(sun, [[1, 1]]), wk(sun - 7 * day, [[1, 1]]), wk(sun - 14 * day, [[1, 1]])];
  assert.equal(weekStreak(ws, 1, sun), 3);
  assert.equal(weekStreak(ws, 2, sun), 0);
  // 今週が未達でも先週までの連続は維持
  assert.equal(weekStreak(ws.slice(1), 1, sun), 2);
});
