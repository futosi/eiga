import type { Kind, PR, SetEntry, Workout } from './types';

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const isCounted = (s: SetEntry) => s.done && (s.reps ?? 0) > 0;

export function fmtSec(v: number): string {
  const m = Math.floor(v / 60);
  const s = Math.round(v % 60);
  if (m === 0) return `${s}秒`;
  return s === 0 ? `${m}分` : `${m}分${s}秒`;
}

/** 回数は「20回」、時間は「45秒」「1分30秒」 */
export function fmtVal(kind: Kind, v: number): string {
  return kind === 'time' ? fmtSec(v) : `${v}回`;
}

export interface Totals {
  reps: number;
  seconds: number;
  sets: number;
}

export function workoutTotals(w: Workout, kindOf: (exerciseId: string) => Kind): Totals {
  const t: Totals = { reps: 0, seconds: 0, sets: 0 };
  for (const ex of w.exercises) {
    const kind = kindOf(ex.exerciseId);
    for (const s of ex.sets) {
      if (!isCounted(s)) continue;
      t.sets++;
      if (kind === 'time') t.seconds += s.reps ?? 0;
      else t.reps += s.reps ?? 0;
    }
  }
  return t;
}

export interface ExerciseSession {
  workoutId: string;
  date: number;
  sets: SetEntry[];
  /** 1セットの最大（回数または秒） */
  best: number;
  total: number;
}

/** ある種目の実施履歴（新しい順） */
export function exerciseSessions(workouts: Workout[], exerciseId: string): ExerciseSession[] {
  const out: ExerciseSession[] = [];
  for (const w of workouts) {
    const sets = w.exercises
      .filter((x) => x.exerciseId === exerciseId)
      .flatMap((x) => x.sets)
      .filter(isCounted);
    if (!sets.length) continue;
    const vals = sets.map((s) => s.reps ?? 0);
    out.push({
      workoutId: w.id,
      date: w.startedAt,
      sets,
      best: Math.max(...vals),
      total: vals.reduce((a, b) => a + b, 0),
    });
  }
  return out.sort((a, b) => b.date - a.date);
}

/** 期間内の合計（回数または秒） */
export function totalOf(workouts: Workout[], exerciseId: string, since = 0): number {
  let sum = 0;
  for (const w of workouts) {
    if (w.startedAt < since) continue;
    for (const ex of w.exercises) {
      if (ex.exerciseId !== exerciseId) continue;
      for (const s of ex.sets) if (isCounted(s)) sum += s.reps ?? 0;
    }
  }
  return sum;
}

/** 完了したワークアウトで更新された自己ベスト（1セットの最大）を検出する */
export function detectPRs(finished: Workout, previous: Workout[]): PR[] {
  const prs: PR[] = [];
  const seen = new Set<string>();
  for (const ex of finished.exercises) {
    if (seen.has(ex.exerciseId)) continue;
    seen.add(ex.exerciseId);
    const now = exerciseSessions([finished], ex.exerciseId)[0];
    if (!now) continue;
    const past = exerciseSessions(previous, ex.exerciseId);
    if (!past.length) continue; // 初回は自己ベスト扱いにしない
    if (now.best > Math.max(...past.map((p) => p.best))) {
      prs.push({ exerciseId: ex.exerciseId, value: now.best });
    }
  }
  return prs;
}

// ---- 日付 ----

export function startOfWeek(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // 月曜始まり
  d.setDate(d.getDate() - dow);
  return d.getTime();
}

export function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function dateKey(t: number): string {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const DOW = ['日', '月', '火', '水', '木', '金', '土'];

export function fmtDate(t: number): string {
  const d = new Date(t);
  return `${d.getMonth() + 1}月${d.getDate()}日(${DOW[d.getDay()]})`;
}

export function fmtShortDate(t: number): string {
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function fmtDuration(ms: number): string {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m < 60) return `${m}分`;
  return `${Math.floor(m / 60)}時間${m % 60}分`;
}

export function fmtClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** 連続達成週数（今週が未達でも先週まで続いていればカウント） */
export function weekStreak(workouts: Workout[], goal: number, now = Date.now()): number {
  const counts = new Map<number, number>();
  for (const w of workouts) {
    const k = startOfWeek(w.startedAt);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const prevWeek = (t: number) => startOfWeek(t - 86400000);
  let wk = startOfWeek(now);
  let streak = 0;
  if ((counts.get(wk) ?? 0) >= goal) streak++;
  wk = prevWeek(wk);
  while ((counts.get(wk) ?? 0) >= goal) {
    streak++;
    wk = prevWeek(wk);
  }
  return streak;
}

export function fmtNum(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}
