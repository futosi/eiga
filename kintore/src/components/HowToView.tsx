import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line } from 'react-native-svg';

import { HOWTO } from '../lib/howto';
import { FLOOR_Y, POSES, type PoseKey } from '../lib/poses';
import { C } from '../lib/theme';
import { Btn } from './ui';

/** 棒人形のイラスト。効いている部位は黄緑で強調する。 */
export function PoseFigure({
  pose,
  mirror,
  width = 200,
}: {
  pose: PoseKey;
  mirror?: boolean;
  width?: number;
}) {
  const p = POSES[pose];
  const h = (width * 140) / 200;
  return (
    <Svg width={width} height={h} viewBox="0 0 200 140" accessibilityLabel="姿勢のイラスト">
      <G transform={mirror ? 'translate(200 0) scale(-1 1)' : undefined}>
        {!p.noFloor && (
          <Line x1={10} y1={FLOOR_Y} x2={190} y2={FLOOR_Y} stroke={C.border} strokeWidth={3} strokeLinecap="round" />
        )}
        {p.props?.map((s, i) => (
          <Line key={`p${i}`} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} stroke={C.border} strokeWidth={8} strokeLinecap="round" />
        ))}
        {p.body.map((s, i) => (
          <Line
            key={i}
            x1={s[0]}
            y1={s[1]}
            x2={s[2]}
            y2={s[3]}
            stroke={s[4] ? C.accent : C.text}
            strokeWidth={7}
            strokeLinecap="round"
          />
        ))}
        <Circle cx={p.head[0]} cy={p.head[1]} r={p.head[2] ?? 10} fill={C.text} />
      </G>
    </Svg>
  );
}

export function videoSearchUrl(name: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} やり方`)}`;
}

/** 種目のやり方（イラスト・効く場所・手順・コツ）。collapsible なら手順は開閉式。 */
export function HowToView({
  exerciseId,
  name,
  collapsible,
  figureWidth = 220,
}: {
  exerciseId: string;
  name: string;
  collapsible?: boolean;
  figureWidth?: number;
}) {
  const how = HOWTO[exerciseId];
  const [open, setOpen] = useState(!collapsible);
  if (!how) return null;

  return (
    <View style={st.wrap}>
      <View style={st.figure}>
        <PoseFigure pose={how.pose} mirror={how.mirror} width={figureWidth} />
      </View>
      <Text style={st.target}>
        効く場所：<Text style={st.targetVal}>{how.target}</Text>
      </Text>

      {collapsible && (
        <Btn
          small
          kind="ghost"
          icon={open ? 'chevron-up' : 'chevron-down'}
          label={open ? 'やり方を閉じる' : 'やり方を見る'}
          onPress={() => setOpen(!open)}
          style={{ alignSelf: 'center', marginTop: 4 }}
        />
      )}

      {open && (
        <View style={st.steps}>
          {how.steps.map((t, i) => (
            <View key={i} style={st.step}>
              <Text style={st.num}>{i + 1}</Text>
              <Text style={st.stepText}>{t}</Text>
            </View>
          ))}
          {how.tip && <Text style={st.tip}>💡 {how.tip}</Text>}
          <Text style={st.caution}>痛みを感じたら、無理せずやめてください。</Text>
          <Btn
            small
            kind="soft"
            icon="logo-youtube"
            label="動画で見る"
            onPress={() => Linking.openURL(videoSearchUrl(name))}
            style={{ marginTop: 4 }}
          />
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { alignItems: 'stretch' },
  figure: {
    alignItems: 'center',
    backgroundColor: C.card2,
    borderRadius: 14,
    paddingVertical: 10,
  },
  target: { color: C.sub, fontSize: 14, marginTop: 10, textAlign: 'center' },
  targetVal: { color: C.text, fontWeight: '800' },
  steps: { marginTop: 12, gap: 10 },
  step: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  num: {
    color: C.onAccent,
    backgroundColor: C.accent,
    width: 22,
    height: 22,
    lineHeight: 22,
    borderRadius: 11,
    textAlign: 'center',
    overflow: 'hidden',
    fontSize: 13,
    fontWeight: '800',
  },
  stepText: { color: C.text, fontSize: 15, lineHeight: 22, flex: 1 },
  tip: { color: C.sub, fontSize: 13, lineHeight: 20, marginTop: 2 },
  caution: { color: C.dim, fontSize: 12 },
});
