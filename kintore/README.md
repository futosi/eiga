# リフトノート（筋トレ記録アプリ）

Expo (React Native) 製の iPhone 向け筋トレ記録アプリ。記録はすべて端末内に保存され、アカウント登録もサーバーも不要です。

## 機能

- ルーティン（メニュー）からワンタップで開始、または空のワークアウトを開始
- セットごとに重量 × 回数を記録。前回の値を表示し、初期値として自動入力
- セット完了で休憩タイマーが自動スタート（±15秒、スキップ、終了時にローカル通知）
- 自己ベスト（最大重量・推定1RM）を自動検出
- 種目ライブラリ 64 種目＋カスタム種目、部位フィルタと検索
- 種目ごとの推定1RM推移グラフと履歴
- 週ごとの回数・総負荷量、部位別セット数、体重の記録
- 週の目標回数と連続達成週数
- kg / lb 切り替え、JSON でのデータ書き出し

## 開発

```bash
cd kintore
npm install
npx expo start        # QR を iPhone の Expo Go で読むと実機で確認できる
npm run typecheck
npm test              # 計算ロジックのユニットテスト
npx expo export --platform web   # dist/ に Web 版を出力（ブラウザでの動作確認用）
```

構成: `src/app/`（画面・Expo Router）、`src/components/`、`src/lib/`（`store.ts` が状態と永続化、`calc.ts` が計算）。

## App Store へのリリース手順

Mac は不要です（EAS のクラウドでビルド・提出します）。必要なのは次の 2 つのアカウントです。

1. **Apple Developer Program**（年 99 USD）: https://developer.apple.com/programs/enroll/
2. **Expo アカウント**（無料枠で可）: https://expo.dev/signup

ターミナルで:

```bash
cd kintore
npx eas-cli@latest login
npx eas-cli@latest init                       # Expo プロジェクトを作成し app.json に projectId を追記
npx eas-cli@latest build --platform ios --profile production --auto-submit
```

途中で Apple ID のログインを求められます。証明書やプロビジョニングプロファイル、App Store Connect 上のアプリ登録は EAS が自動で行います。完了すると TestFlight にビルドが届きます。

その後 [App Store Connect](https://appstoreconnect.apple.com) で次を入力して「審査へ提出」します。

| 項目 | 内容 |
| --- | --- |
| 名前 | リフトノート - 筋トレ記録（同名が取られていたら変更） |
| サブタイトル | セット・重量・回数をすばやく記録 |
| カテゴリ | ヘルスケア／フィットネス |
| プライバシーポリシー URL | https://futosi.github.io/eiga/kintore/privacy.html （このブランチを main にマージすると公開される） |
| App のプライバシー | 「データを収集しない」 |
| 年齢制限 | 4+ |
| 価格 | 無料 |
| スクリーンショット | `store/screenshots/` の 5 枚（6.9 インチ用 1320×2868） |
| キーワード | 筋トレ,記録,トレーニング,ジム,ワークアウト,ベンチプレス,1RM,筋肉,メモ,ログ |

説明文:

```
リフトノートは、ジムでの筋トレをすばやく記録できるシンプルなトレーニングノートです。

■ すぐ記録できる
ルーティンを選んで開始するだけ。前回の重量と回数が最初から入っているので、変わったところだけ直してチェックを付ければ記録完了です。

■ 休憩タイマー
セットを完了すると自動でカウントダウン。アプリを閉じていても通知でお知らせします。

■ 成長が見える
種目ごとの推定1RMの推移、週ごとの総負荷量、部位別のセット数をグラフで確認。自己ベストを更新すると自動でお知らせします。

■ 続けやすい
週の目標回数と連続達成週数で、習慣化をサポートします。

■ 安心
アカウント登録は不要。記録はすべて端末の中だけに保存され、広告もトラッキングもありません。
```

### リリース前に確認してほしいこと

- `app.json` の `ios.bundleIdentifier`（`com.futosi.liftnote`）は一度リリースすると変更できません。
- 実機（Expo Go または TestFlight）で一通り触って、休憩タイマーの通知が届くことを確認してください。開発時の動作確認は Web 版で行っており、通知・バイブ・画面スリープ防止は実機でしか確認できません。
