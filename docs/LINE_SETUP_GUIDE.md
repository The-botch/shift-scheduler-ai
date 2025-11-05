# LINE連携 セットアップガイド

## 前提条件

- Node.js 18以上
- PostgreSQL 14以上
- HTTPS対応のサーバー（LINE Webhook要件）

## 1. LINE Developers 設定

### 1.1 アカウント作成

1. https://developers.line.biz/ja/ にアクセス
2. LINEアカウントでログイン
3. 「プロバイダー」を作成
4. 「Messaging API」チャネルを作成

### 1.2 Messaging API 設定

1. **チャネルアクセストークン発行**
   - チャネル基本設定 → チャネルアクセストークン
   - 「発行」ボタンをクリック
   - トークンをコピー（環境変数に設定）

2. **Webhook設定**
   ```
   Webhook URL: https://your-domain.com/api/webhook/line
   Webhookの利用: ON
   ```

3. **応答設定**
   ```
   応答メッセージ: OFF
   Webhook再送: ON
   グループ・複数人トークへの参加: ON
   ```

### 1.3 チャネルシークレット取得

- チャネル基本設定 → Channel Secret
- シークレットをコピー（環境変数に設定）

## 2. データベースセットアップ

### 2.1 マイグレーション実行

```bash
cd backend

# PostgreSQLに接続
psql -U postgres -d shift_scheduler

# マイグレーションSQL実行
\i migrations/007_line_integration_tables.sql
```

### 2.2 テーブル確認

```sql
-- テーブル作成確認
\dt hr.staff_line_accounts
\dt ops.line_message_logs

-- スタッフとLINE連携テーブル
SELECT * FROM hr.staff_line_accounts;

-- メッセージログテーブル
SELECT * FROM ops.line_message_logs LIMIT 10;
```

## 3. 環境変数設定

### 3.1 .envファイル編集

```bash
# backend/.env に追加
LINE_BOT_ENABLED=true
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_from_line_developers
LINE_CHANNEL_SECRET=your_channel_secret_from_line_developers
```

### 3.2 設定確認

```bash
# .envファイルが正しく読み込まれているか確認
node -e "require('dotenv').config(); console.log('TOKEN:', process.env.LINE_CHANNEL_ACCESS_TOKEN ? '✓ Set' : '✗ Not set'); console.log('SECRET:', process.env.LINE_CHANNEL_SECRET ? '✓ Set' : '✗ Not set');"
```

## 4. バックエンド実装

### 4.1 server.jsにルーター追加

`backend/src/server.js` を編集:

```javascript
import lineWebhookRouter from './routes/lineWebhook.js';

// ... 既存のコード ...

// LINE Webhook ルーター
app.use('/api/webhook/line', lineWebhookRouter);

// ... 既存のコード ...
```

### 4.2 サーバー起動

```bash
cd backend
npm start
```

### 4.3 ヘルスチェック

```bash
# ローカル確認
curl http://localhost:3001/api/webhook/line/health

# 期待される出力:
# {
#   "success": true,
#   "botEnabled": true,
#   "hasToken": true,
#   "hasSecret": true
# }
```

## 5. HTTPS設定（本番環境）

LINE WebhookはHTTPS必須です。

### 5.1 SSL証明書取得（Let's Encrypt）

```bash
# Certbotインストール（Ubuntu/Debian）
sudo apt-get update
sudo apt-get install certbot

# SSL証明書取得
sudo certbot certonly --standalone -d your-domain.com
```

### 5.2 Nginxリバースプロキシ設定

`/etc/nginx/sites-available/shift-scheduler`:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location /api/webhook/line {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Nginx設定有効化
sudo ln -s /etc/nginx/sites-available/shift-scheduler /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 6. LINE Bot グループ招待

### 6.1 Bot を友だち追加

1. LINE Developers Console → チャネル → Messaging API
2. QRコードをスキャンして友だち追加

### 6.2 グループに招待

1. LINEアプリでグループ作成
2. Bot を招待
3. Bot がメンバーになったことを確認

## 7. スタッフとLINE連携

### 7.1 LINE User ID取得

スタッフに以下のメッセージをグループで送信してもらう:

```
@ボット名 登録
```

バックエンドログに LINE User ID が出力される:

```
LINE message received: { lineUserId: 'U1234567890abcdef', messageText: '登録' }
```

### 7.2 データベースに登録

```sql
-- スタッフとLINE User IDを紐付け
INSERT INTO hr.staff_line_accounts (tenant_id, staff_id, line_user_id, display_name)
VALUES (1, 123, 'U1234567890abcdef', '山田太郎');
```

または、管理画面（今後実装予定）から登録。

## 8. テスト

### 8.1 シフト希望登録テスト

LINEグループで以下を送信:

```
5月1日 休み希望
```

期待される応答:

```
✅ 2025-05-01の休みを登録しました

登録件数: 1件
```

### 8.2 データベース確認

```sql
-- シフト希望が登録されたか確認
SELECT * FROM ops.shift_preferences
WHERE staff_id = 123
ORDER BY created_at DESC
LIMIT 5;

-- LINEメッセージログ確認
SELECT * FROM ops.line_message_logs
ORDER BY created_at DESC
LIMIT 10;
```

### 8.3 ログ確認

```bash
# バックエンドログ確認
tail -f backend/logs/app.log

# 期待されるログ:
# LINE message received: { lineUserId: 'Uxxxx', messageText: '5月1日 休み希望' }
# Shift preference registered: { staff_id: 123, dates: ['2025-05-01'], type: 'day_off' }
```

## 9. トラブルシューティング

### 9.1 Webhookが届かない

**症状**: LINEからメッセージを送ってもバックエンドにリクエストが来ない

**確認事項**:
1. Webhook URLが正しく設定されているか
2. HTTPSでアクセス可能か
3. Firewall設定でポート443が開いているか

```bash
# Webhook URL確認
curl -I https://your-domain.com/api/webhook/line/health
```

### 9.2 署名検証エラー

**症状**: `Invalid signature` エラーが出る

**原因**: Channel Secret が間違っている

**対処**:
```bash
# .envファイル確認
cat backend/.env | grep LINE_CHANNEL_SECRET

# 正しいシークレットを設定
LINE_CHANNEL_SECRET=正しいシークレット
```

### 9.3 スタッフ未登録エラー

**症状**: `あなたのLINEアカウントはまだ登録されていません` と返信される

**対処**:
```sql
-- LINE User ID確認
SELECT * FROM ops.line_message_logs
WHERE message_text LIKE '%登録%'
ORDER BY created_at DESC
LIMIT 1;

-- スタッフ登録
INSERT INTO hr.staff_line_accounts (tenant_id, staff_id, line_user_id, display_name)
VALUES (1, スタッフID, 'Uから始まるUser ID', 'スタッフ名');
```

### 9.4 日付解析エラー

**症状**: `日付の形式が正しくありません` と返信される

**対処**: サポートされている形式を案内
```
正しい形式例:
- 5/1 休み希望
- 5月1日 休み希望
- 2025-05-01 休み希望
```

## 10. 運用Tips

### 10.1 定期メンテナンス

```bash
# 90日以上前のログ削除（月次実行）
psql -U postgres -d shift_scheduler -c "
DELETE FROM ops.line_message_logs
WHERE created_at < CURRENT_DATE - INTERVAL '90 days';
"
```

### 10.2 監視設定

CloudWatch / Datadog / Prometheus などで以下を監視:

```sql
-- エラー率監視
SELECT
  DATE(created_at) as date,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  ROUND(COUNT(*) FILTER (WHERE status = 'failed')::numeric / COUNT(*) * 100, 2) as error_rate
FROM ops.line_message_logs
WHERE created_at >= CURRENT_DATE - 7
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 10.3 バックアップ

```bash
# 毎日実行するバックアップスクリプト
pg_dump -U postgres -d shift_scheduler -t hr.staff_line_accounts -t ops.line_message_logs > backup_$(date +%Y%m%d).sql
```

## 11. 次のステップ

- [ ] リッチメニュー実装
- [ ] AI自然言語処理追加（OpenAI API）
- [ ] 画像アップロード対応（OCR）
- [ ] プッシュ通知機能（シフト確定通知）
- [ ] 管理画面でのLINE連携管理

## 参考リンク

- [LINE Messaging API リファレンス](https://developers.line.biz/ja/reference/messaging-api/)
- [Webhook イベントオブジェクト](https://developers.line.biz/ja/reference/messaging-api/#webhook-event-objects)
- [署名検証](https://developers.line.biz/ja/reference/messaging-api/#signature-validation)
