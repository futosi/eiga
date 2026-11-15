import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { C, R } from '../lib/theme';

export type IconName = keyof typeof Ionicons.glyphMap;

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Btn({
  label,
  onPress,
  kind = 'primary',
  icon,
  small,
  style,
  disabled,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost' | 'danger' | 'soft';
  icon?: IconName;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  const fg =
    kind === 'primary' ? C.onAccent : kind === 'danger' ? C.danger : kind === 'soft' ? C.accent : C.text;
  const bg =
    kind === 'primary' ? C.accent : kind === 'soft' ? C.accentDim : kind === 'danger' ? '#2A1517' : C.card2;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.btn,
        small && s.btnSmall,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
        style,
      ]}>
      {icon && <Ionicons name={icon} size={small ? 16 : 18} color={fg} />}
      <Text style={[s.btnText, small && { fontSize: 14 }, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function IconBtn({
  icon,
  onPress,
  label,
  color = C.sub,
  size = 22,
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
  color?: string;
  size?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, padding: 4 })}>
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={[s.chip, active && { backgroundColor: C.accent, borderColor: C.accent }]}>
      <Text style={[s.chipText, active && { color: C.onAccent }]}>{label}</Text>
    </Pressable>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionText}>{children}</Text>
      {right}
    </View>
  );
}

export function Empty({ icon, title, body }: { icon: IconName; title: string; body?: string }) {
  return (
    <View style={s.empty}>
      <Ionicons name={icon} size={44} color={C.dim} />
      <Text style={s.emptyTitle}>{title}</Text>
      {body ? <Text style={s.emptyBody}>{body}</Text> : null}
    </View>
  );
}

export function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>
        {value}
        {unit ? <Text style={s.statUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

/** 数値入力。入力途中（"60." など）を壊さないよう文字列をローカルに持つ。 */
export function NumInput({
  value,
  onChange,
  placeholder,
  decimal,
  style,
  label,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  decimal?: boolean;
  style?: StyleProp<TextStyle>;
  label: string;
}) {
  const fmt = (v: number | null) => (v == null ? '' : String(v));
  const [text, setText] = useState(fmt(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(fmt(value));
  }, [value, focused]);

  return (
    <TextInput
      accessibilityLabel={label}
      value={text}
      onChangeText={(t) => {
        const cleaned = decimal
          ? t.replace(',', '.').replace(/[^0-9.]/g, '')
          : t.replace(/[^0-9]/g, '');
        setText(cleaned);
        const n = parseFloat(cleaned);
        onChange(cleaned === '' || Number.isNaN(n) ? null : n);
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
      placeholder={placeholder}
      placeholderTextColor={C.dim}
      selectTextOnFocus
      maxLength={6}
      style={[s.numInput, style]}
    />
  );
}

export const s = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: R.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: R.md,
  },
  btnSmall: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: R.sm },
  btnText: { fontSize: 16, fontWeight: '700' },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  chipText: { color: C.sub, fontSize: 14, fontWeight: '600' },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 10,
  },
  sectionText: { color: C.text, fontSize: 18, fontWeight: '800' },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 8 },
  emptyTitle: { color: C.text, fontSize: 16, fontWeight: '700', marginTop: 4 },
  emptyBody: { color: C.sub, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  statLabel: { color: C.sub, fontSize: 12, marginBottom: 2 },
  statValue: { color: C.text, fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  statUnit: { color: C.sub, fontSize: 12, fontWeight: '600' },
  numInput: {
    backgroundColor: C.card2,
    color: C.text,
    borderRadius: R.sm,
    paddingVertical: 8,
    paddingHorizontal: 4,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 0,
  },
  input: {
    backgroundColor: C.card2,
    color: C.text,
    borderRadius: R.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  screen: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 48 },
  h1: { color: C.text, fontSize: 28, fontWeight: '900' },
  sub: { color: C.sub, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
