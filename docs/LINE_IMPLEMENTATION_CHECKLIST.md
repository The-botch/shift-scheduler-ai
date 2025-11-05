# LINE連携 実装チェックリスト

## 📋 実装前の準備

- [ ] LINE Developers アカウント作成
- [ ] プロバイダー作成
- [ ] Messaging API チャネル作成
- [ ] Channel Access Token 発行
- [ ] Channel Secret 取得
- [ ] HTTPSドメイン準備（本番環境）

## 🗄️ データベース

- [ ] マイグレーションファイル確認
  - `migrations/007_line_integration_tables.sql`
- [ ] マイグレーション実行
  - `psql -d shift_scheduler -f migrations/007_line_integration_tables.sql`
- [ ] テーブル作成確認
  - `hr.staff_line_accounts`
  - `ops.line_message_logs`

## ⚙️ 環境設定

- [ ] .envファイルに追加
  ```bash
  LINE_BOT_ENABLED=true
  LINE_CHANNEL_ACCESS_TOKEN=xxx
  LINE_CHANNEL_SECRET=xxx
  ```
- [ ] 環境変数読み込み確認

## 💻 バックエンド実装

- [ ] lineWebhook.js ファイル配置
  - `backend/src/routes/lineWebhook.js`
- [ ] server.js にルーター追加
  ```javascript
  import lineWebhookRouter from './routes/lineWebhook.js';
  app.use('/api/webhook/line', lineWebhookRouter);
  ```
- [ ] サーバー起動確認
  - `npm start`
- [ ] ヘルスチェック
  - `curl http://localhost:3001/api/webhook/line/health`

## 🌐 LINE設定

- [ ] Webhook URL設定
  - `https://your-domain.com/api/webhook/line`
- [ ] Webhookの利用: ON
- [ ] 応答メッセージ: OFF
- [ ] Webhook再送: ON
- [ ] グループトークへの参加: ON

## 🔐 HTTPS設定（本番環境）

- [ ] SSL証明書取得（Let's Encrypt）
- [ ] Nginxリバースプロキシ設定
- [ ] Firewall設定（ポート443開放）
- [ ] DNS設定確認

## 👥 スタッフ連携

- [ ] LINEグループ作成
- [ ] Botを友だち追加
- [ ] Botをグループに招待
- [ ] スタッフのLINE User ID取得
- [ ] DBにスタッフ連携データ登録
  ```sql
  INSERT INTO hr.staff_line_accounts (tenant_id, staff_id, line_user_id, display_name)
  VALUES (1, スタッフID, 'LINE User ID', 'スタッフ名');
  ```

## 🧪 テスト

### 基本機能テスト

- [ ] シフト希望登録テスト
  - メッセージ: "5月1日 休み希望"
  - 期待: 成功メッセージ返信
- [ ] データベース登録確認
  ```sql
  SELECT * FROM ops.shift_preferences ORDER BY created_at DESC LIMIT 1;
  ```
- [ ] メッセージログ確認
  ```sql
  SELECT * FROM ops.line_message_logs ORDER BY created_at DESC LIMIT 1;
  ```

### エラーハンドリングテスト

- [ ] 未登録スタッフのメッセージ送信
  - 期待: "アカウント未登録"メッセージ
- [ ] 不正な日付形式
  - メッセージ: "あああ 休み"
  - 期待: "日付の形式が正しくありません"
- [ ] 署名検証エラー
  - 不正なリクエスト送信
  - 期待: 403エラー

### パフォーマンステスト

- [ ] 連続メッセージ送信
  - 10件連続送信
  - 期待: すべて正常処理
- [ ] 範囲指定テスト
  - メッセージ: "5/1-5/10 休み希望"
  - 期待: 10件登録

## 📊 監視設定

- [ ] エラーログ監視設定
- [ ] Webhook応答時間監視
- [ ] データベース容量監視
- [ ] アラート設定
  - エラー率 > 5%
  - 応答時間 > 3秒

## 🔄 運用準備

- [ ] バックアップスクリプト作成
- [ ] ログローテーション設定
- [ ] 古いログ削除スクリプト（90日）
- [ ] 運用マニュアル作成

## 📝 ドキュメント

- [ ] システム要件定義書
  - `docs/LINE_INTEGRATION_REQUIREMENTS.md`
- [ ] セットアップガイド
  - `docs/LINE_SETUP_GUIDE.md`
- [ ] ユーザーマニュアル
- [ ] トラブルシューティングガイド

## 🚀 デプロイ

- [ ] ステージング環境デプロイ
- [ ] ステージング環境テスト
- [ ] 本番環境デプロイ
- [ ] 本番環境テスト
- [ ] ロールバック手順確認

## 📱 スタッフ向け案内

- [ ] 使い方ガイド作成
- [ ] サンプルメッセージ集作成
- [ ] FAQ作成
- [ ] スタッフ説明会実施

---

## ✅ 完了確認

すべてのチェックボックスにチェックが入ったら、LINE連携の実装は完了です。

### 最終確認テスト

1. 実際のスタッフがLINEグループでメッセージ送信
2. Botが正しく応答
3. シフト希望がDBに登録
4. 管理画面でシフト希望が表示

### トラブル時の連絡先

- 技術担当: [担当者名]
- LINE公式サポート: https://www.linebiz.com/jp/contact/
