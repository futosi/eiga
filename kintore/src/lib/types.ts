export type BodyPart = 'chest' | 'back' | 'shoulder' | 'arm' | 'leg' | 'core' | 'other';
export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'other';

export interface Exercise {
  id: string;
  name: string;
  part: BodyPart;
  equip: Equipment;
  custom?: boolean;
}

export interface SetEntry {
  id: string;
  /** 常に kg で保存 */
  weight: number | null;
  reps: number | null;
  done: boolean;
  warmup?: boolean;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  sets: SetEntry[];
  note?: string;
}

export interface Workout {
  id: string;
  name: string;
  startedAt: number;
  finishedAt: number | null;
  exercises: WorkoutExercise[];
  /** 完了時に検出した自己ベスト */
  prs?: PR[];
}

export interface PR {
  exerciseId: string;
  kind: 'weight' | 'e1rm';
  value: number;
}

export interface RoutineItem {
  exerciseId: string;
  sets: number;
}

export interface Routine {
  id: string;
  name: string;
  items: RoutineItem[];
}

export interface BodyWeight {
  /** YYYY-MM-DD */
  date: string;
  kg: number;
}

export interface Settings {
  unit: 'kg' | 'lb';
  restSec: number;
  weeklyGoal: number;
}

export const PART_LABEL: Record<BodyPart, string> = {
  chest: '胸',
  back: '背中',
  shoulder: '肩',
  arm: '腕',
  leg: '脚',
  core: '体幹',
  other: 'その他',
};

export const EQUIP_LABEL: Record<Equipment, string> = {
  barbell: 'バーベル',
  dumbbell: 'ダンベル',
  machine: 'マシン',
  cable: 'ケーブル',
  bodyweight: '自重',
  other: 'その他',
};

export const PARTS = Object.keys(PART_LABEL) as BodyPart[];
export const EQUIPS = Object.keys(EQUIP_LABEL) as Equipment[];
