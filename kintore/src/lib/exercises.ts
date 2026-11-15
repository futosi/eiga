import type { BodyPart, Exercise, Routine } from './types';

const r = (id: string, name: string, part: BodyPart): Exercise => ({ id, name, part, kind: 'reps' });
const t = (id: string, name: string, part: BodyPart, hold: number): Exercise => ({
  id,
  name,
  part,
  kind: 'time',
  hold,
});

/** 標準搭載の種目。id は保存データから参照されるので変更しないこと。 */
export const BUILTIN_EXERCISES: Exercise[] = [
  // 腕立て伏せ（胸・肩・腕）
  r('push-up', '腕立て伏せ', 'chest'),
  r('knee-push-up', '膝つき腕立て伏せ', 'chest'),
  r('wide-push-up', 'ワイド腕立て伏せ', 'chest'),
  r('incline-push-up', 'インクライン腕立て伏せ（手を高く）', 'chest'),
  r('decline-push-up', 'デクライン腕立て伏せ（足を高く）', 'chest'),
  r('diamond-push-up', 'ダイヤモンド腕立て伏せ', 'arm'),
  r('close-push-up', 'ナロー腕立て伏せ', 'arm'),
  r('pike-push-up', 'パイクプッシュアップ', 'shoulder'),
  r('dips', 'ディップス（椅子）', 'arm'),
  // 背中
  r('pull-up', '懸垂', 'back'),
  r('chin-up', 'チンアップ（逆手懸垂）', 'back'),
  r('inverted-row', 'インバーテッドロウ', 'back'),
  r('superman', 'スーパーマン', 'back'),
  // スクワット・脚
  r('squat', 'スクワット', 'leg'),
  r('wide-squat', 'ワイドスクワット', 'leg'),
  r('jump-squat', 'ジャンプスクワット', 'leg'),
  r('bulgarian-squat', 'ブルガリアンスクワット（片足）', 'leg'),
  r('lunge', 'ランジ', 'leg'),
  r('reverse-lunge', 'リバースランジ', 'leg'),
  r('step-up', 'ステップアップ', 'leg'),
  r('hip-raise', 'ヒップリフト', 'leg'),
  r('calf-raise', 'カーフレイズ', 'leg'),
  t('wall-sit', 'ウォールシット', 'leg', 30),
  // 体幹
  t('plank', 'プランク', 'core', 30),
  t('side-plank-l', 'サイドプランク（左）', 'core', 20),
  t('side-plank-r', 'サイドプランク（右）', 'core', 20),
  t('hollow-hold', 'ホローホールド', 'core', 20),
  r('crunch', 'クランチ', 'core'),
  r('leg-raise', 'レッグレイズ', 'core'),
  r('bicycle-crunch', 'バイシクルクランチ', 'core'),
  r('mountain-climber', 'マウンテンクライマー', 'core'),
  r('russian-twist', 'ロシアンツイスト', 'core'),
  // 全身
  r('burpee', 'バーピー', 'full'),
  r('jumping-jack', 'ジャンピングジャック', 'full'),
  t('high-knees', 'ハイニー（もも上げ）', 'full', 30),
  // ストレッチ（秒数で保持）
  t('st-neck-l', '首のストレッチ（左）', 'stretch', 20),
  t('st-neck-r', '首のストレッチ（右）', 'stretch', 20),
  t('st-shoulder-l', '肩のストレッチ（左）', 'stretch', 30),
  t('st-shoulder-r', '肩のストレッチ（右）', 'stretch', 30),
  t('st-chest', '胸のストレッチ（壁・ドア）', 'stretch', 30),
  t('st-triceps-l', '二の腕のストレッチ（左）', 'stretch', 20),
  t('st-triceps-r', '二の腕のストレッチ（右）', 'stretch', 20),
  t('st-cat-cow', 'キャット＆カウ', 'stretch', 30),
  t('st-child', '子供のポーズ', 'stretch', 40),
  t('st-cobra', 'コブラのポーズ', 'stretch', 30),
  t('st-twist-l', '腰のひねり（左）', 'stretch', 30),
  t('st-twist-r', '腰のひねり（右）', 'stretch', 30),
  t('st-hamstring', '前屈（もも裏）', 'stretch', 40),
  t('st-quad-l', '太もも前（左）', 'stretch', 30),
  t('st-quad-r', '太もも前（右）', 'stretch', 30),
  t('st-hip-flexor-l', '股関節の前（左）', 'stretch', 30),
  t('st-hip-flexor-r', '股関節の前（右）', 'stretch', 30),
  t('st-glute-l', 'お尻のストレッチ（左）', 'stretch', 30),
  t('st-glute-r', 'お尻のストレッチ（右）', 'stretch', 30),
  t('st-calf-l', 'ふくらはぎ（左）', 'stretch', 30),
  t('st-calf-r', 'ふくらはぎ（右）', 'stretch', 30),
  t('st-butterfly', '内もものストレッチ（あぐら）', 'stretch', 40),
];

const train = (id: string, name: string, items: [string, number][]): Routine => ({
  id,
  name,
  type: 'train',
  items: items.map(([exerciseId, sets]) => ({ exerciseId, sets })),
});

const stretch = (id: string, name: string, ids: string[]): Routine => ({
  id,
  name,
  type: 'stretch',
  items: ids.map((exerciseId) => ({ exerciseId, sets: 1 })),
});

export const DEFAULT_ROUTINES: Routine[] = [
  train('default-main', '腕立て＆スクワット', [
    ['push-up', 3],
    ['squat', 3],
  ]),
  train('default-upper', '上半身', [
    ['push-up', 3],
    ['wide-push-up', 3],
    ['pike-push-up', 3],
    ['dips', 3],
    ['plank', 3],
  ]),
  train('default-lower', '下半身', [
    ['squat', 3],
    ['bulgarian-squat', 3],
    ['lunge', 3],
    ['hip-raise', 3],
    ['calf-raise', 3],
  ]),
  train('default-core', '体幹', [
    ['plank', 3],
    ['crunch', 3],
    ['leg-raise', 3],
    ['side-plank-l', 2],
    ['side-plank-r', 2],
  ]),
  stretch('default-stretch-all', '全身ストレッチ', [
    'st-neck-l',
    'st-neck-r',
    'st-shoulder-l',
    'st-shoulder-r',
    'st-chest',
    'st-cat-cow',
    'st-cobra',
    'st-child',
    'st-twist-l',
    'st-twist-r',
    'st-hamstring',
    'st-quad-l',
    'st-quad-r',
    'st-glute-l',
    'st-glute-r',
    'st-calf-l',
    'st-calf-r',
  ]),
  stretch('default-stretch-lower', '下半身ストレッチ', [
    'st-hamstring',
    'st-quad-l',
    'st-quad-r',
    'st-hip-flexor-l',
    'st-hip-flexor-r',
    'st-glute-l',
    'st-glute-r',
    'st-calf-l',
    'st-calf-r',
    'st-butterfly',
  ]),
  stretch('default-stretch-upper', '上半身ストレッチ', [
    'st-neck-l',
    'st-neck-r',
    'st-shoulder-l',
    'st-shoulder-r',
    'st-chest',
    'st-triceps-l',
    'st-triceps-r',
    'st-cat-cow',
    'st-child',
  ]),
];

/** 主役の 2 種目（ホームのクイック記録・分析で使う） */
export const MAIN_EXERCISE_IDS = ['push-up', 'squat'] as const;
