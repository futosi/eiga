import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Modal, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExerciseFilterBar, ExerciseRow, useExerciseFilter } from '../../components/ExercisePicker';
import { Btn, Chip, Empty, IconBtn, s as ui } from '../../components/ui';
import { useStore } from '../../lib/store';
import { C } from '../../lib/theme';
import { PART_LABEL, PARTS, type BodyPart, type Kind } from '../../lib/types';

export default function Exercises() {
  const f = useExerciseFilter();
  const [adding, setAdding] = useState(false);

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
        <View style={[ui.row, { justifyContent: 'space-between', marginBottom: 12 }]}>
          <Text style={ui.h1}>種目</Text>
          <Btn small kind="soft" icon="add" label="カスタム種目" onPress={() => setAdding(true)} />
        </View>
        <ExerciseFilterBar {...f} />
        <FlatList
          data={f.list}
          keyExtractor={(e) => e.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item }) => (
            <ExerciseRow ex={item} onPress={() => router.push(`/exercise/${item.id}`)} />
          )}
          ListEmptyComponent={<Empty icon="search" title="見つかりません" />}
        />
      </View>
      <AddExerciseModal visible={adding} onClose={() => setAdding(false)} />
    </SafeAreaView>
  );
}

function AddExerciseModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const add = useStore((s) => s.addCustomExercise);
  const [name, setName] = useState('');
  const [part, setPart] = useState<BodyPart>('chest');
  const [kind, setKind] = useState<Kind>('reps');

  const close = () => {
    setName('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <ScrollView style={ui.screen} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <View style={[ui.row, { justifyContent: 'space-between', marginBottom: 16 }]}>
          <Text style={{ color: C.text, fontSize: 20, fontWeight: '800' }}>カスタム種目を追加</Text>
          <IconBtn icon="close" label="閉じる" onPress={close} color={C.text} size={26} />
        </View>

        <Text style={[ui.sub, { marginBottom: 6 }]}>種目名</Text>
        <TextInput
          accessibilityLabel="種目名"
          value={name}
          onChangeText={setName}
          placeholder="例: アーチャー腕立て伏せ"
          placeholderTextColor={C.dim}
          style={ui.input}
          maxLength={40}
        />

        <Text style={[ui.sub, { marginTop: 18, marginBottom: 8 }]}>部位</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {PARTS.map((p) => (
            <Chip key={p} label={PART_LABEL[p]} active={part === p} onPress={() => setPart(p)} />
          ))}
        </View>

        <Text style={[ui.sub, { marginTop: 18, marginBottom: 8 }]}>数え方</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(['reps', 'time'] as const).map((k) => (
            <Chip key={k} label={k === 'reps' ? '回数' : '時間（秒）'} active={kind === k} onPress={() => setKind(k)} />
          ))}
        </View>

        <Btn
          label="追加する"
          disabled={!name.trim()}
          style={{ marginTop: 28 }}
          onPress={() => {
            add({ name: name.trim(), part, kind, hold: kind === 'time' ? 30 : undefined });
            close();
          }}
        />
      </ScrollView>
    </Modal>
  );
}
