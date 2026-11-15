import { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { fmtNum } from '../lib/calc';
import { C } from '../lib/theme';

export interface Point {
  label: string;
  value: number;
}

const H = 170;
const PAD = { l: 38, r: 12, t: 12, b: 22 };

const FONT = Platform.OS === 'web' ? 'system-ui, sans-serif' : undefined;

/** 目盛りが 0 / 中間 / 最大 の 3 本になるので、最大値を 2×(1,2,5×10^n) に丸める */
function niceMax(max: number): number {
  if (max <= 0) return 2;
  const half = max / 2;
  const pow = Math.pow(10, Math.floor(Math.log10(half)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((v) => v >= half - 1e-9) ?? 10 * pow;
  return Math.max(2, step * 2);
}

function niceRange(values: number[], fromZero: boolean): [number, number] {
  if (fromZero) return [0, niceMax(Math.max(...values))];
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const pad = (max - min) * 0.1;
  return [Math.max(0, min - pad), max + pad];
}

function useWidth() {
  const [w, setW] = useState(0);
  return { w, onLayout: (e: { nativeEvent: { layout: { width: number } } }) => setW(e.nativeEvent.layout.width) };
}

function Axis({ w, lo, hi }: { w: number; lo: number; hi: number }) {
  const ticks = [0, 0.5, 1];
  return (
    <>
      {ticks.map((t) => {
        const y = PAD.t + (H - PAD.t - PAD.b) * (1 - t);
        return (
          <Line key={t} x1={PAD.l} x2={w - PAD.r} y1={y} y2={y} stroke={C.border} strokeWidth={1} />
        );
      })}
      {ticks.map((t) => {
        const y = PAD.t + (H - PAD.t - PAD.b) * (1 - t);
        const v = lo + (hi - lo) * t;
        return (
          <SvgText key={`l${t}`} x={PAD.l - 6} y={y + 4} fill={C.dim} fontSize={10} fontFamily={FONT} textAnchor="end">
            {v >= 1000
              ? `${fmtNum(Math.round(v / 100) / 10)}k`
              : fmtNum(hi - lo < 10 ? Math.round(v * 10) / 10 : Math.round(v))}
          </SvgText>
        );
      })}
    </>
  );
}

function XLabels({ data, x }: { data: Point[]; x: (i: number) => number }) {
  // ラベルが重ならないよう最大5個に間引く
  const step = Math.max(1, Math.ceil(data.length / 5));
  return (
    <>
      {data.map((d, i) =>
        i % step === 0 || i === data.length - 1 ? (
          i !== data.length - 1 && data.length - 1 - i < step ? null : (
            <SvgText key={i} x={x(i)} y={H - 6} fill={C.dim} fontSize={10} fontFamily={FONT} textAnchor="middle">
              {d.label}
            </SvgText>
          )
        ) : null,
      )}
    </>
  );
}

export function LineChart({ data }: { data: Point[] }) {
  const { w, onLayout } = useWidth();
  if (data.length < 2) {
    return <ChartPlaceholder text="2回以上記録するとグラフが表示されます" />;
  }
  const [lo, hi] = niceRange(
    data.map((d) => d.value),
    false,
  );
  const iw = w - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (iw * i) / (data.length - 1);
  const y = (v: number) => PAD.t + ih * (1 - (v - lo) / (hi - lo));
  const path = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join('');
  return (
    <View onLayout={onLayout} style={{ height: H }}>
      {w > 0 && (
        <Svg width={w} height={H}>
          <Axis w={w} lo={lo} hi={hi} />
          <Path d={path} stroke={C.accent} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
          {data.length <= 30 &&
            data.map((d, i) => <Circle key={i} cx={x(i)} cy={y(d.value)} r={3} fill={C.accent} />)}
          <XLabels data={data} x={x} />
        </Svg>
      )}
    </View>
  );
}

export function BarChart({ data, goal }: { data: Point[]; goal?: number }) {
  const { w, onLayout } = useWidth();
  const [lo, hi] = niceRange([...data.map((d) => d.value), goal ?? 0], true);
  const iw = w - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const slot = iw / Math.max(1, data.length);
  const bw = Math.min(28, slot * 0.6);
  const x = (i: number) => PAD.l + slot * (i + 0.5);
  const y = (v: number) => PAD.t + ih * (1 - (v - lo) / (hi - lo));
  return (
    <View onLayout={onLayout} style={{ height: H }}>
      {w > 0 && (
        <Svg width={w} height={H}>
          <Axis w={w} lo={lo} hi={hi} />
          {data.map((d, i) =>
            d.value > 0 ? (
              <Rect
                key={i}
                x={x(i) - bw / 2}
                y={y(d.value)}
                width={bw}
                height={Math.max(2, PAD.t + ih - y(d.value))}
                rx={4}
                fill={goal != null && d.value < goal ? '#7B9523' : C.accent}
              />
            ) : null,
          )}
          {goal != null && goal > 0 && (
            <Line
              x1={PAD.l}
              x2={w - PAD.r}
              y1={y(goal)}
              y2={y(goal)}
              stroke={C.sub}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          )}
          <XLabels data={data} x={x} />
        </Svg>
      )}
    </View>
  );
}

function ChartPlaceholder({ text }: { text: string }) {
  return (
    <View style={{ height: 90, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: C.dim, fontSize: 13 }}>{text}</Text>
    </View>
  );
}
