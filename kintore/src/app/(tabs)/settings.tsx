import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Btn, Card, Chip, IconBtn, SectionTitle, s as ui } from '../../components/ui';
import { confirm, notify } from '../../lib/platform';
import { useStore } from '../../lib/store';
import { C } from '../../lib/theme';

const REST_OPTIONS = [0, 60, 90, 120, 180, 240];
const PRIVACY_URL = 'https://futosi.github.io/eiga/kintore/privacy.html';

export default function Settings() {
  const settings = useStore((s) => s.settings);
  const update = useStore((s) => s.updateSettings);
  const resetAll = useStore((s) => s.resetAll);

  const exportData = async () => {
    const { workouts, routines, customExercises, bodyWeights } = useStore.getState();
    const json = JSON.stringify(
      { app: 'liftnote', exportedAt: new Date().toISOString(), workouts, routines, customExercises, bodyWeights },
      null,
      2,
    );
    try {
      await Share.share({ message: json, title: 'リフトノートのデータ' });
    } catch {
      notify('書き出しに失敗しました');
    }
  };

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <ScrollView contentContainerStyle={ui.content}>
        <Text style={ui.h1}>設定</Text>

        <SectionTitle>重量の単位</SectionTitle>
        <View style={[ui.row, { gap: 8 }]}>
          {(['kg', 'lb'] as const).map((u) => (
            <Chip key={u} label={u} active={settings.unit === u} onPress={() => update({ unit: u })} />
          ))}
        </View>

        <SectionTitle>休憩タイマー</SectionTitle>
        <Text style={[ui.sub, { marginBottom: 10 }]}>セットを完了すると自動でカウントダウンを開始します</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {REST_OPTIONS.map((sec) => (
            <Chip
              key={sec}
              label={sec === 0 ? 'オフ' : sec % 60 === 0 ? `${sec / 60}分` : `${sec}秒`}
              active={settings.restSec === sec}
              onPress={() => update({ restSec: sec })}
            />
          ))}
        </View>

        <SectionTitle>週の目標回数</SectionTitle>
        <Card>
          <View style={[ui.row, { justifyContent: 'space-between' }]}>
            <IconBtn
              icon="remove-circle-outline"
              label="目標を減らす"
              size={30}
              onPress={() => update({ weeklyGoal: Math.max(1, settings.weeklyGoal - 1) })}
            />
            <Text style={{ color: C.text, fontSize: 22, fontWeight: '800' }}>
              週 {settings.weeklyGoal} 回
            </Text>
            <IconBtn
              icon="add-circle-outline"
              label="目標を増やす"
              size={30}
              onPress={() => update({ weeklyGoal: Math.min(7, settings.weeklyGoal + 1) })}
            />
          </View>
        </Card>

        <SectionTitle>データ</SectionTitle>
        <Text style={[ui.sub, { marginBottom: 10 }]}>
          記録はこの端末の中だけに保存されます。機種変更の前に書き出しておくと安心です。
        </Text>
        <Btn label="データを書き出す (JSON)" icon="share-outline" kind="ghost" onPress={exportData} />
        <Btn
          label="すべてのデータを削除"
          icon="trash-outline"
          kind="danger"
          style={{ marginTop: 12 }}
          onPress={() =>
            confirm(
              'すべてのデータを削除',
              'ワークアウトの履歴、ルーティン、カスタム種目、体重の記録をすべて削除します。元に戻せません。',
              resetAll,
              '削除する',
              true,
            )
          }
        />

        <SectionTitle>このアプリについて</SectionTitle>
        <Btn
          label="プライバシーポリシー"
          icon="document-text-outline"
          kind="ghost"
          onPress={() => Linking.openURL(PRIVACY_URL)}
        />
        <Text style={[ui.sub, { textAlign: 'center', marginTop: 20 }]}>
          リフトノート v{Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
