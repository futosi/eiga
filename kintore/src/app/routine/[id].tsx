import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ExercisePicker } from '../../components/ExercisePicker';
import { Btn, Card, IconBtn, s as ui } from '../../components/ui';
import { uid } from '../../lib/calc';
import { confirm } from '../../lib/platform';
import { useExerciseLookup, useStore } from '../../lib/store';
import { C } from '../../lib/theme';
import type { RoutineItem } from '../../lib/types';

export default function RoutineEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const existing = useStore((s) => s.routines.find((r) => r.id === id));
  const saveRoutine = useStore((s) => s.saveRoutine);
  const deleteRoutine = useStore((s) => s.deleteRoutine);
  const lookup = useExerciseLookup();

  const [name, setName] = useState(existing?.name ?? '');
  const [items, setItems] = useState<RoutineItem[]>(existing?.items ?? []);
  const [picker, setPicker] = useState(false);

  const setCount = (i: number, d: number) =>
    setItems((xs) =>
      xs.map((x, j) => (j === i ? { ...x, sets: Math.min(10, Math.max(1, x.sets + d)) } : x)),
    );
  const move = (i: number, d: number) =>
    setItems((xs) => {
      const j = i + d;
      if (j < 0 || j >= xs.length) return xs;
      const c = [...xs];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  return (
    <View style={ui.screen}>
      <ScrollView contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
        <Text style={[ui.sub, { marginBottom: 6 }]}>ルーティン名</Text>
        <TextInput
          accessibilityLabel="ルーティン名"
          value={name}
          onChangeText={setName}
          placeholder="例: 胸の日"
          placeholderTextColor={C.dim}
          style={ui.input}
          maxLength={40}
        />

        <Text style={[ui.sub, { marginTop: 20, marginBottom: 8 }]}>種目</Text>
        {items.map((it, i) => (
          <Card key={`${it.exerciseId}-${i}`} style={{ marginBottom: 10, padding: 12 }}>
            <View style={[ui.row, { justifyContent: 'space-between' }]}>
              <Text style={st.name} numberOfLines={1}>
                {lookup(it.exerciseId).name}
              </Text>
              <IconBtn
                icon="close"
                label="種目を外す"
                onPress={() => setItems((xs) => xs.filter((_, j) => j !== i))}
              />
            </View>
            <View style={[ui.row, { justifyContent: 'space-between', marginTop: 8 }]}>
              <View style={[ui.row, { gap: 10 }]}>
                <IconBtn icon="remove-circle-outline" label="セットを減らす" size={26} onPress={() => setCount(i, -1)} />
                <Text style={st.count}>{it.sets} セット</Text>
                <IconBtn icon="add-circle-outline" label="セットを増やす" size={26} onPress={() => setCount(i, 1)} />
              </View>
              <View style={[ui.row, { gap: 10 }]}>
                <IconBtn icon="arrow-up" label="上へ" onPress={() => move(i, -1)} />
                <IconBtn icon="arrow-down" label="下へ" onPress={() => move(i, 1)} />
              </View>
            </View>
          </Card>
        ))}

        <Btn label="種目を追加" icon="add" kind="soft" onPress={() => setPicker(true)} />

        <Btn
          label="保存"
          disabled={!name.trim() || items.length === 0}
          style={{ marginTop: 24 }}
          onPress={() => {
            saveRoutine({ id: existing?.id ?? uid(), name: name.trim(), items });
            router.back();
          }}
        />
        {existing && (
          <Btn
            label="ルーティンを削除"
            kind="danger"
            icon="trash-outline"
            style={{ marginTop: 12 }}
            onPress={() =>
              confirm(
                'ルーティンを削除',
                `「${existing.name}」を削除します。過去の記録は残ります。`,
                () => {
                  router.back();
                  deleteRoutine(existing.id);
                },
                '削除する',
                true,
              )
            }
          />
        )}
      </ScrollView>

      <ExercisePicker
        visible={picker}
        onClose={() => setPicker(false)}
        onPick={(ex) => {
          setItems((xs) => [...xs, { exerciseId: ex.id, sets: 3 }]);
          setPicker(false);
        }}
      />
    </View>
  );
}

const st = StyleSheet.create({
  name: { color: C.text, fontSize: 16, fontWeight: '700', flex: 1 },
  count: { color: C.text, fontSize: 15, fontWeight: '700', minWidth: 64, textAlign: 'center' },
});
