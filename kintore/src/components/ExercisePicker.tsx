import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useExercises } from '../lib/store';
import { C } from '../lib/theme';
import { KIND_LABEL, PART_LABEL, PARTS, type BodyPart, type Exercise } from '../lib/types';
import { Chip, Empty, IconBtn, s as ui } from './ui';

export function useExerciseFilter(initialPart: BodyPart | null = null) {
  const all = useExercises();
  const [q, setQ] = useState('');
  const [part, setPart] = useState<BodyPart | null>(initialPart);
  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    return all.filter(
      (e) => (!part || e.part === part) && (!k || e.name.toLowerCase().includes(k)),
    );
  }, [all, q, part]);
  return { q, setQ, part, setPart, list };
}

export function ExerciseFilterBar({
  q,
  setQ,
  part,
  setPart,
}: Pick<ReturnType<typeof useExerciseFilter>, 'q' | 'setQ' | 'part' | 'setPart'>) {
  return (
    <View>
      <View style={st.search}>
        <Ionicons name="search" size={18} color={C.dim} />
        <TextInput
          accessibilityLabel="種目を検索"
          value={q}
          onChangeText={setQ}
          placeholder="種目を検索"
          placeholderTextColor={C.dim}
          style={st.searchInput}
          autoCorrect={false}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 12 }}>
        <Chip label="すべて" active={!part} onPress={() => setPart(null)} />
        {PARTS.map((p) => (
          <Chip key={p} label={PART_LABEL[p]} active={part === p} onPress={() => setPart(p)} />
        ))}
      </ScrollView>
    </View>
  );
}

export function ExerciseRow({
  ex,
  onPress,
  right,
}: {
  ex: Exercise;
  onPress: () => void;
  right?: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [st.row, pressed && { opacity: 0.6 }]}>
      <View style={st.badge}>
        <Text style={st.badgeText}>{PART_LABEL[ex.part].slice(0, 1)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={st.name}>{ex.name}</Text>
        <Text style={st.meta}>
          {PART_LABEL[ex.part]}・{KIND_LABEL[ex.kind]}
          {ex.custom ? '・カスタム' : ''}
        </Text>
      </View>
      {right ?? <Ionicons name="chevron-forward" size={18} color={C.dim} />}
    </Pressable>
  );
}

export function ExercisePicker({
  visible,
  onClose,
  onPick,
  initialPart = null,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (ex: Exercise) => void;
  initialPart?: BodyPart | null;
}) {
  const f = useExerciseFilter(initialPart);
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[ui.screen, { padding: 16 }]}>
        <View style={[ui.row, { justifyContent: 'space-between', marginBottom: 12 }]}>
          <Text style={{ color: C.text, fontSize: 20, fontWeight: '800' }}>種目を追加</Text>
          <IconBtn icon="close" label="閉じる" onPress={onClose} color={C.text} size={26} />
        </View>
        <ExerciseFilterBar {...f} />
        <FlatList
          data={f.list}
          keyExtractor={(e) => e.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <ExerciseRow
              ex={item}
              onPress={() => onPick(item)}
              right={<Ionicons name="add-circle" size={24} color={C.accent} />}
            />
          )}
          ListEmptyComponent={
            <Empty
              icon="search"
              title="見つかりません"
              body="「種目」タブからオリジナルの種目を追加できます"
            />
          }
        />
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: { flex: 1, color: C.text, fontSize: 16, paddingVertical: 11 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  badge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: C.accent, fontWeight: '800', fontSize: 15 },
  name: { color: C.text, fontSize: 16, fontWeight: '600' },
  meta: { color: C.sub, fontSize: 12, marginTop: 2 },
});
