import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ExercisePicker } from '../../components/ExercisePicker';
import { Btn, Card, IconBtn, s as ui } from '../../components/ui';
import { fmtSec, uid } from '../../lib/calc';
import { confirm } from '../../lib/platform';
import { useExerciseLookup, useStore } from '../../lib/store';
import { C } from '../../lib/theme';
import type { RoutineItem } from '../../lib/types';

export default function RoutineEdit() {
  const { id, type: typeParam } = useLocalSearchParams<{ id: string; type?: string }>();
  const existing = useStore((s) => s.routines.find((r) => r.id === id));
  const saveRoutine = useStore((s) => s.saveRoutine);
  const deleteRoutine = useStore((s) => s.deleteRoutine);
  const lookup = useExerciseLookup();

  const type = existing?.type ?? (typeParam === 'stretch' ? 'stretch' : 'train');
  const isStretch = type === 'stretch';

  const [name, setName] = useState(existing?.name ?? '');
  const [items, setItems] = useState<RoutineItem[]>(existing?.items ?? []);
  const [picker, setPicker] = useState(false);

  const holdOf = (it: RoutineItem) => it.hold ?? lookup(it.exerciseId).hold ?? 30;

  const adjust = (i: number, d: number) =>
    setItems((xs) =>
      xs.map((x, j) => {
        if (j !== i) return x;
        return isStretch
          ? { ...x, hold: Math.min(300, Math.max(5, holdOf(x) + d * 5)) }
          : { ...x, sets: Math.min(10, Math.max(1, x.sets + d)) };
      }),
    );
  const move = (i: number, d: number) =>
    setItems((xs) => {
      const j = i + d;
      if (j < 0 || j >= xs.length) return xs;
      const c = [...xs];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  const totalSec = items.reduce((a, x) => a + holdOf(x), 0);

  return (
    <View style={ui.screen}>
      <ScrollView contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
        <Text style={[ui.sub, { marginBottom: 6 }]}>{isStretch ? 'ストレッチ名' : 'メニュー名'}</Text>
        <TextInput
          accessibilityLabel="名前"
          value={name}
          onChangeText={setName}
          placeholder={isStretch ? '例: 寝る前のストレッチ' : '例: 腕立て100回'}
          placeholderTextColor={C.dim}
          style={ui.input}
          maxLength={40}
        />

        <Text style={[ui.sub, { marginTop: 20, marginBottom: 8 }]}>
          種目{isStretch && items.length > 0 ? `（合計 約${fmtSec(totalSec)}）` : ''}
        </Text>
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
                <IconBtn
                  icon="remove-circle-outline"
                  label={isStretch ? '秒数を減らす' : 'セットを減らす'}
                  size={26}
                  onPress={() => adjust(i, -1)}
                />
                <Text style={st.count}>{isStretch ? `${holdOf(it)} 秒` : `${it.sets} セット`}</Text>
                <IconBtn
                  icon="add-circle-outline"
                  label={isStretch ? '秒数を増やす' : 'セットを増やす'}
                  size={26}
                  onPress={() => adjust(i, 1)}
                />
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
            saveRoutine({ id: existing?.id ?? uid(), name: name.trim(), type, items });
            router.back();
          }}
        />
        {existing && (
          <Btn
            label="削除"
            kind="danger"
            icon="trash-outline"
            style={{ marginTop: 12 }}
            onPress={() =>
              confirm(
                '削除',
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
        initialPart={isStretch ? 'stretch' : null}
        onClose={() => setPicker(false)}
        onPick={(ex) => {
          setItems((xs) => [
            ...xs,
            isStretch ? { exerciseId: ex.id, sets: 1, hold: ex.hold ?? 30 } : { exerciseId: ex.id, sets: 3 },
          ]);
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
