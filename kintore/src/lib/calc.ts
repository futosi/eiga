import type { PR, SetEntry, Workout } from './types';

const LB_PER_KG = 2.20462262;

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/** kg → 表示単位の数値（小数1桁まで） */
export function toUnit(kg: number, unit: 'kg' | 'lb'): number {
  const v = unit === 'lb' ? kg * LB_PER_KG : kg;
  return Math.round(v * 10) / 10;
}

export function fromUnit(v: number, unit: 'kg' | 'lb'): number {
  return unit === 'lb' ? v / LB_PER_KG : v;
}

export function fmtNum(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

export function fmtWeight(kg: number, unit: 'kg' | 'lb'): string {
  return fmtNum(toUnit(kg, unit));
}

/** 推定1RM (Epley)。回数が多いほど誤差が大きいので 12 回までを対象にする。 */
export function e1rm(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + Math.min(reps, 12) / 30);
}

export const isCounted = (s: SetEntry) => s.done && !s.warmup && (s.reps ?? 0) > 0;

export function setVolume(s: SetEntry): number {
  return isCounted(s) ? (s.weight ?? 0) * (s.reps ?? 0) : 0;
}

export function workoutVolume(w: Workout): number {
  return w.exercises.reduce((a, ex) => a + ex.sets.reduce((b, s) => b + setVolume(s), 0), 0);
}

export function workoutSetCount(w: Workout): number {
  return w.exercises.reduce((a, ex) => a + ex.sets.filter(isCounted).length, 0);
}

export interface ExerciseSession {
  workoutId: string;
  date: number;
  sets: SetEntry[];
  maxWeight: number;
  bestE1rm: number;
  volume: number;
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
    out.push({
      workoutId: w.id,
      date: w.startedAt,
      sets,
      maxWeight: Math.max(...sets.map((s) => s.weight ?? 0)),
      bestE1rm: Math.max(...sets.map((s) => e1rm(s.weight ?? 0, s.reps ?? 0))),
      volume: sets.reduce((a, s) => a + setVolume(s), 0),
    });
  }
  return out.sort((a, b) => b.date - a.date);
}

/** 完了したワークアウトで更新された自己ベストを検出する */
export function detectPRs(finished: Workout, previous: Workout[]): PR[] {
  const prs: PR[] = [];
  const seen = new Set<string>();
  for (const ex of finished.exercises) {
    if (seen.has(ex.exerciseId)) continue;
    seen.add(ex.exerciseId);
    const now = exerciseSessions([finished], ex.exerciseId)[0];
    if (!now || now.maxWeight <= 0) continue;
    const past = exerciseSessions(previous, ex.exerciseId);
    if (!past.length) continue; // 初回は自己ベスト扱いにしない
    const pastW = Math.max(...past.map((p) => p.maxWeight));
    const pastE = Math.max(...past.map((p) => p.bestE1rm));
    if (now.maxWeight > pastW) prs.push({ exerciseId: ex.exerciseId, kind: 'weight', value: now.maxWeight });
    else if (now.bestE1rm > pastE + 0.01)
      prs.push({ exerciseId: ex.exerciseId, kind: 'e1rm', value: now.bestE1rm });
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
