import type { BodyPart, Equipment, Exercise, Routine } from './types';

const e = (id: string, name: string, part: BodyPart, equip: Equipment): Exercise => ({
  id,
  name,
  part,
  equip,
});

/** 標準搭載の種目。id は保存データから参照されるので変更しないこと。 */
export const BUILTIN_EXERCISES: Exercise[] = [
  // 胸
  e('bench-press', 'ベンチプレス', 'chest', 'barbell'),
  e('incline-bench-press', 'インクラインベンチプレス', 'chest', 'barbell'),
  e('db-bench-press', 'ダンベルベンチプレス', 'chest', 'dumbbell'),
  e('incline-db-press', 'インクラインダンベルプレス', 'chest', 'dumbbell'),
  e('db-fly', 'ダンベルフライ', 'chest', 'dumbbell'),
  e('chest-press', 'チェストプレス', 'chest', 'machine'),
  e('pec-fly', 'ペックフライ', 'chest', 'machine'),
  e('cable-crossover', 'ケーブルクロスオーバー', 'chest', 'cable'),
  e('push-up', '腕立て伏せ', 'chest', 'bodyweight'),
  e('dips', 'ディップス', 'chest', 'bodyweight'),
  // 背中
  e('deadlift', 'デッドリフト', 'back', 'barbell'),
  e('bent-over-row', 'ベントオーバーロウ', 'back', 'barbell'),
  e('pull-up', '懸垂（チンニング）', 'back', 'bodyweight'),
  e('lat-pulldown', 'ラットプルダウン', 'back', 'cable'),
  e('seated-row', 'シーテッドロウ', 'back', 'cable'),
  e('db-row', 'ワンハンドダンベルロウ', 'back', 'dumbbell'),
  e('t-bar-row', 'Tバーロウ', 'back', 'barbell'),
  e('machine-row', 'マシンロウ', 'back', 'machine'),
  e('back-extension', 'バックエクステンション', 'back', 'bodyweight'),
  e('shrug', 'シュラッグ', 'back', 'dumbbell'),
  // 肩
  e('overhead-press', 'オーバーヘッドプレス', 'shoulder', 'barbell'),
  e('db-shoulder-press', 'ダンベルショルダープレス', 'shoulder', 'dumbbell'),
  e('machine-shoulder-press', 'マシンショルダープレス', 'shoulder', 'machine'),
  e('side-raise', 'サイドレイズ', 'shoulder', 'dumbbell'),
  e('cable-side-raise', 'ケーブルサイドレイズ', 'shoulder', 'cable'),
  e('front-raise', 'フロントレイズ', 'shoulder', 'dumbbell'),
  e('rear-raise', 'リアレイズ', 'shoulder', 'dumbbell'),
  e('rear-delt-fly', 'リアデルトフライ', 'shoulder', 'machine'),
  e('face-pull', 'フェイスプル', 'shoulder', 'cable'),
  e('upright-row', 'アップライトロウ', 'shoulder', 'barbell'),
  // 腕
  e('barbell-curl', 'バーベルカール', 'arm', 'barbell'),
  e('db-curl', 'ダンベルカール', 'arm', 'dumbbell'),
  e('hammer-curl', 'ハンマーカール', 'arm', 'dumbbell'),
  e('incline-curl', 'インクラインカール', 'arm', 'dumbbell'),
  e('preacher-curl', 'プリーチャーカール', 'arm', 'machine'),
  e('cable-curl', 'ケーブルカール', 'arm', 'cable'),
  e('triceps-pushdown', 'トライセプスプッシュダウン', 'arm', 'cable'),
  e('skull-crusher', 'スカルクラッシャー', 'arm', 'barbell'),
  e('overhead-extension', 'オーバーヘッドエクステンション', 'arm', 'dumbbell'),
  e('close-grip-bench', 'ナローベンチプレス', 'arm', 'barbell'),
  e('wrist-curl', 'リストカール', 'arm', 'dumbbell'),
  // 脚
  e('squat', 'スクワット', 'leg', 'barbell'),
  e('front-squat', 'フロントスクワット', 'leg', 'barbell'),
  e('leg-press', 'レッグプレス', 'leg', 'machine'),
  e('hack-squat', 'ハックスクワット', 'leg', 'machine'),
  e('bulgarian-squat', 'ブルガリアンスクワット', 'leg', 'dumbbell'),
  e('lunge', 'ランジ', 'leg', 'dumbbell'),
  e('leg-extension', 'レッグエクステンション', 'leg', 'machine'),
  e('leg-curl', 'レッグカール', 'leg', 'machine'),
  e('romanian-deadlift', 'ルーマニアンデッドリフト', 'leg', 'barbell'),
  e('hip-thrust', 'ヒップスラスト', 'leg', 'barbell'),
  e('calf-raise', 'カーフレイズ', 'leg', 'machine'),
  e('adductor', 'アダクション', 'leg', 'machine'),
  e('abductor', 'アブダクション', 'leg', 'machine'),
  e('goblet-squat', 'ゴブレットスクワット', 'leg', 'dumbbell'),
  // 体幹
  e('crunch', 'クランチ', 'core', 'bodyweight'),
  e('leg-raise', 'レッグレイズ', 'core', 'bodyweight'),
  e('hanging-leg-raise', 'ハンギングレッグレイズ', 'core', 'bodyweight'),
  e('plank', 'プランク', 'core', 'bodyweight'),
  e('ab-roller', 'アブローラー', 'core', 'other'),
  e('cable-crunch', 'ケーブルクランチ', 'core', 'cable'),
  e('russian-twist', 'ロシアンツイスト', 'core', 'bodyweight'),
  e('ab-machine', 'アブドミナルマシン', 'core', 'machine'),
];

export const DEFAULT_ROUTINES: Routine[] = [
  {
    id: 'default-push',
    name: 'プッシュ（胸・肩・三頭）',
    items: [
      { exerciseId: 'bench-press', sets: 3 },
      { exerciseId: 'incline-db-press', sets: 3 },
      { exerciseId: 'db-shoulder-press', sets: 3 },
      { exerciseId: 'side-raise', sets: 3 },
      { exerciseId: 'triceps-pushdown', sets: 3 },
    ],
  },
  {
    id: 'default-pull',
    name: 'プル（背中・二頭）',
    items: [
      { exerciseId: 'deadlift', sets: 3 },
      { exerciseId: 'lat-pulldown', sets: 3 },
      { exerciseId: 'seated-row', sets: 3 },
      { exerciseId: 'face-pull', sets: 3 },
      { exerciseId: 'db-curl', sets: 3 },
    ],
  },
  {
    id: 'default-legs',
    name: 'レッグ（脚・体幹）',
    items: [
      { exerciseId: 'squat', sets: 3 },
      { exerciseId: 'leg-press', sets: 3 },
      { exerciseId: 'leg-curl', sets: 3 },
      { exerciseId: 'calf-raise', sets: 3 },
      { exerciseId: 'leg-raise', sets: 3 },
    ],
  },
];
