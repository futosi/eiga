import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { detectPRs, isCounted, uid } from './calc';
import { BUILTIN_EXERCISES, DEFAULT_ROUTINES } from './exercises';
import type {
  BodyWeight,
  Exercise,
  Routine,
  SetEntry,
  Settings,
  Workout,
  WorkoutExercise,
} from './types';

interface StartOptions {
  routine?: Routine;
  exerciseIds?: string[];
  name?: string;
}

interface State {
  customExercises: Exercise[];
  routines: Routine[];
  /** 完了済みワークアウト（新しい順） */
  workouts: Workout[];
  active: Workout | null;
  restEndsAt: number | null;
  restTotal: number;
  bodyWeights: BodyWeight[];
  settings: Settings;

  startWorkout: (opts?: StartOptions) => void;
  repeatWorkout: (w: Workout) => void;
  discardWorkout: () => void;
  finishWorkout: () => Workout | null;
  /** ストレッチなど、外で作った記録をそのまま保存する */
  addWorkout: (w: Workout) => void;
  renameActive: (name: string) => void;
  addExerciseToActive: (exerciseId: string) => void;
  removeExerciseFromActive: (weId: string) => void;
  addSet: (weId: string) => void;
  removeSet: (weId: string, setId: string) => void;
  updateSet: (weId: string, setId: string, patch: Partial<SetEntry>) => void;
  toggleSet: (weId: string, setId: string) => boolean;

  startRest: (sec?: number) => void;
  adjustRest: (deltaSec: number) => void;
  stopRest: () => void;

  deleteWorkout: (id: string) => void;
  saveRoutine: (r: Routine) => void;
  deleteRoutine: (id: string) => void;
  addCustomExercise: (e: Omit<Exercise, 'id' | 'custom'>) => Exercise;
  deleteCustomExercise: (id: string) => void;
  setBodyWeight: (date: string, kg: number) => void;
  deleteBodyWeight: (date: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetAll: () => void;
}

const newSet = (reps: number | null = null): SetEntry => ({ id: uid(), reps, done: false });

function findIn(custom: Exercise[], id: string): Exercise | undefined {
  return BUILTIN_EXERCISES.find((x) => x.id === id) ?? custom.find((x) => x.id === id);
}

/** 直近の同種目のセット（前回値の表示・初期値に使う） */
export function lastSetsOf(workouts: Workout[], exerciseId: string): SetEntry[] {
  for (const w of workouts) {
    const sets = w.exercises
      .filter((x) => x.exerciseId === exerciseId)
      .flatMap((x) => x.sets)
      .filter(isCounted);
    if (sets.length) return sets;
  }
  return [];
}

function buildExercise(
  workouts: Workout[],
  custom: Exercise[],
  exerciseId: string,
  count: number,
): WorkoutExercise {
  const prev = lastSetsOf(workouts, exerciseId);
  const ex = findIn(custom, exerciseId);
  const n = Math.max(1, count);
  return {
    id: uid(),
    exerciseId,
    sets: Array.from({ length: n }, (_, i) => {
      const p = prev[Math.min(i, prev.length - 1)];
      return newSet(p?.reps ?? (ex?.kind === 'time' ? (ex.hold ?? null) : null));
    }),
  };
}

const mapActiveExercise = (
  s: State,
  weId: string,
  fn: (we: WorkoutExercise) => WorkoutExercise,
): Partial<State> =>
  s.active
    ? {
        active: {
          ...s.active,
          exercises: s.active.exercises.map((x) => (x.id === weId ? fn(x) : x)),
        },
      }
    : {};

const initial = {
  customExercises: [] as Exercise[],
  routines: DEFAULT_ROUTINES,
  workouts: [] as Workout[],
  active: null as Workout | null,
  restEndsAt: null as number | null,
  restTotal: 0,
  bodyWeights: [] as BodyWeight[],
  settings: { restSec: 60, weeklyGoal: 4 } as Settings,
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial,

      startWorkout: (opts = {}) => {
        const { workouts, customExercises } = get();
        const items =
          opts.routine?.items ?? (opts.exerciseIds ?? []).map((exerciseId) => ({ exerciseId, sets: 3 }));
        set({
          active: {
            id: uid(),
            name: opts.routine?.name ?? opts.name ?? defaultWorkoutName(),
            startedAt: Date.now(),
            finishedAt: null,
            exercises: items.map((it) => buildExercise(workouts, customExercises, it.exerciseId, it.sets)),
          },
          restEndsAt: null,
        });
      },

      repeatWorkout: (w) => {
        const { workouts, customExercises } = get();
        set({
          active: {
            id: uid(),
            name: w.name,
            startedAt: Date.now(),
            finishedAt: null,
            exercises: w.exercises.map((x) =>
              buildExercise(workouts, customExercises, x.exerciseId, x.sets.length),
            ),
          },
          restEndsAt: null,
        });
      },

      discardWorkout: () => set({ active: null, restEndsAt: null }),

      finishWorkout: () => {
        const { active, workouts } = get();
        if (!active) return null;
        // 完了チェックの付いたセットだけを残す
        const exercises = active.exercises
          .map((x) => ({ ...x, sets: x.sets.filter(isCounted) }))
          .filter((x) => x.sets.length > 0);
        const finished: Workout = { ...active, exercises, finishedAt: Date.now() };
        finished.prs = detectPRs(finished, workouts);
        set({ workouts: [finished, ...workouts], active: null, restEndsAt: null });
        return finished;
      },

      addWorkout: (w) =>
        set((s) => ({
          workouts: [w, ...s.workouts].sort((a, b) => b.startedAt - a.startedAt),
        })),

      renameActive: (name) => set((s) => (s.active ? { active: { ...s.active, name } } : {})),

      addExerciseToActive: (exerciseId) =>
        set((s) =>
          s.active
            ? {
                active: {
                  ...s.active,
                  exercises: [
                    ...s.active.exercises,
                    buildExercise(s.workouts, s.customExercises, exerciseId, 3),
                  ],
                },
              }
            : {},
        ),

      removeExerciseFromActive: (weId) =>
        set((s) =>
          s.active
            ? {
                active: {
                  ...s.active,
                  exercises: s.active.exercises.filter((x) => x.id !== weId),
                },
              }
            : {},
        ),

      addSet: (weId) =>
        set((s) =>
          mapActiveExercise(s, weId, (we) => {
            const last = we.sets[we.sets.length - 1];
            return { ...we, sets: [...we.sets, newSet(last?.reps ?? null)] };
          }),
        ),

      removeSet: (weId, setId) =>
        set((s) =>
          mapActiveExercise(s, weId, (we) => ({
            ...we,
            sets: we.sets.filter((x) => x.id !== setId),
          })),
        ),

      updateSet: (weId, setId, patch) =>
        set((s) =>
          mapActiveExercise(s, weId, (we) => ({
            ...we,
            sets: we.sets.map((x) => (x.id === setId ? { ...x, ...patch } : x)),
          })),
        ),

      toggleSet: (weId, setId) => {
        const cur = get()
          .active?.exercises.find((x) => x.id === weId)
          ?.sets.find((x) => x.id === setId);
        if (!cur) return false;
        const done = !cur.done;
        get().updateSet(weId, setId, { done });
        return done;
      },

      startRest: (sec) => {
        const total = sec ?? get().settings.restSec;
        if (total <= 0) return;
        set({ restEndsAt: Date.now() + total * 1000, restTotal: total });
      },
      adjustRest: (delta) =>
        set((s) =>
          s.restEndsAt
            ? {
                restEndsAt: Math.max(Date.now(), s.restEndsAt + delta * 1000),
                restTotal: Math.max(1, s.restTotal + delta),
              }
            : {},
        ),
      stopRest: () => set({ restEndsAt: null }),

      deleteWorkout: (id) => set((s) => ({ workouts: s.workouts.filter((w) => w.id !== id) })),

      saveRoutine: (r) =>
        set((s) => ({
          routines: s.routines.some((x) => x.id === r.id)
            ? s.routines.map((x) => (x.id === r.id ? r : x))
            : [...s.routines, r],
        })),
      deleteRoutine: (id) => set((s) => ({ routines: s.routines.filter((r) => r.id !== id) })),

      addCustomExercise: (e) => {
        const ex: Exercise = { ...e, id: 'c-' + uid(), custom: true };
        set((s) => ({ customExercises: [...s.customExercises, ex] }));
        return ex;
      },
      // 履歴から参照されている可能性があるので、記録は残したまま一覧からだけ消す
      deleteCustomExercise: (id) =>
        set((s) => ({
          customExercises: s.customExercises.filter((x) => x.id !== id),
          routines: s.routines.map((r) => ({
            ...r,
            items: r.items.filter((i) => i.exerciseId !== id),
          })),
        })),

      setBodyWeight: (date, kg) =>
        set((s) => ({
          bodyWeights: [...s.bodyWeights.filter((b) => b.date !== date), { date, kg }].sort((a, b) =>
            a.date < b.date ? -1 : 1,
          ),
        })),
      deleteBodyWeight: (date) =>
        set((s) => ({ bodyWeights: s.bodyWeights.filter((b) => b.date !== date) })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      resetAll: () => set({ ...initial }),
    }),
    {
      name: 'jijuu-note-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

function defaultWorkoutName(): string {
  const h = new Date().getHours();
  if (h < 11) return '朝のトレーニング';
  if (h < 17) return '昼のトレーニング';
  return '夜のトレーニング';
}

export function useExercises(): Exercise[] {
  const custom = useStore((s) => s.customExercises);
  return custom.length ? [...BUILTIN_EXERCISES, ...custom] : BUILTIN_EXERCISES;
}

export function findExercise(custom: Exercise[], id: string): Exercise {
  return (
    findIn(custom, id) ?? { id, name: '削除された種目', part: 'full', kind: 'reps' }
  );
}

export function useExerciseLookup(): (id: string) => Exercise {
  const custom = useStore((s) => s.customExercises);
  return (id) => findExercise(custom, id);
}
