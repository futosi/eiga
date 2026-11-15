export type BodyPart = 'chest' | 'back' | 'shoulder' | 'arm' | 'leg' | 'core' | 'full' | 'stretch';

/** reps = 回数を数える種目、time = 秒数（保持時間）を測る種目 */
export type Kind = 'reps' | 'time';

export interface Exercise {
  id: string;
  name: string;
  part: BodyPart;
  kind: Kind;
  /** time 種目の標準の秒数 */
  hold?: number;
  custom?: boolean;
}

export interface SetEntry {
  id: string;
  /** 回数。kind が time の種目では秒数 */
  reps: number | null;
  done: boolean;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  sets: SetEntry[];
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
  /** 1セットの最大回数（time 種目は最長秒数） */
  value: number;
}

export interface RoutineItem {
  exerciseId: string;
  sets: number;
  /** ストレッチで 1 回保持する秒数 */
  hold?: number;
}

export interface Routine {
  id: string;
  name: string;
  type: 'train' | 'stretch';
  items: RoutineItem[];
}

export interface BodyWeight {
  /** YYYY-MM-DD */
  date: string;
  kg: number;
}

export interface Settings {
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
  full: '全身',
  stretch: 'ストレッチ',
};

export const KIND_LABEL: Record<Kind, string> = {
  reps: '回数',
  time: '時間',
};

export const PARTS = Object.keys(PART_LABEL) as BodyPart[];
