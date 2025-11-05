# LINEチャットボット シフト希望登録システム 要件定義

## 1. システム概要

LINEグループ内のチャットボットを通じて、スタッフがシフト希望を登録できるシステム。
メッセージを送信すると自動的にバックエンドに連携され、データベースに保存される。

## 2. システムアーキテクチャ

### 2.1 全体構成

```
[LINEアプリ]
    ↓ (Messaging API)
[LINE Platform (webhook)]
    ↓ (HTTPS POST)
[バックエンドAPI (/api/webhook/line)]
    ↓
[シフト希望登録サービス]
    ↓
[PostgreSQL (ops.shift_preferences)]
```

### 2.2 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロント | LINE Messaging API |
| バックエンド | Node.js + Express.js |
| データベース | PostgreSQL |
| 認証 | LINE Signature Validation |
| 自然言語処理 | 正規表現 / OpenAI API (オプション) |

## 3. LINE側の設定要件

### 3.1 必要なLINE設定

1. **LINE Developers アカウント**
   - https://developers.line.biz/ja/ でアカウント作成
   - プロバイダー作成
   - Messaging API チャネル作成

2. **Messaging API設定**
   ```
   Channel ID: (自動発行)
   Channel Secret: (自動発行) → 環境変数に保存
   Channel Access Token: (発行) → 環境変数に保存
   ```

3. **Webhook URL設定**
   ```
   Webhook URL: https://your-domain.com/api/webhook/line
   Use webhook: ON
   ```

4. **ボット基本設定**
   ```
   応答メッセージ: OFF (カスタムロジックを使用)
   Webhook再送: ON
   グループ・複数人トークへの参加: ON
   ```

### 3.2 環境変数設定

```bash
# .env ファイルに追加
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
LINE_CHANNEL_SECRET=your_channel_secret
LINE_BOT_ENABLED=true
```

## 4. データフロー詳細

### 4.1 メッセージ受信フロー

```
1. ユーザーがLINEグループでメッセージ送信
   例: "5月1日 休み希望"

2. LINE Platform → Webhook POST
   POST /api/webhook/line
   Headers:
     - x-line-signature: (署名)
   Body:
     {
       "events": [{
         "type": "message",
         "message": {
           "type": "text",
           "text": "5月1日 休み希望"
         },
         "source": {
           "type": "group",
           "groupId": "xxx",
           "userId": "yyy"
         }
       }]
     }

3. バックエンドで署名検証
   - LINE_CHANNEL_SECRET を使用してHMAC-SHA256検証

4. メッセージ解析
   - 日付抽出: "5月1日" → 2025-05-01
   - 希望タイプ判定: "休み" → "day_off"

5. スタッフ特定
   - LINE User ID → DB staff_id へマッピング
   - 事前にスタッフとLINE User IDを紐付け必要

6. データベース登録
   INSERT INTO ops.shift_preferences (
     tenant_id, staff_id, preference_date,
     preference_type, status, created_at
   )

7. LINE返信
   - 成功: "5月1日の休み希望を登録しました"
   - 失敗: "登録に失敗しました。日付を確認してください"
```

### 4.2 エラーハンドリング

| エラーケース | 処理 | 返信メッセージ |
|-------------|------|--------------|
| 署名検証失敗 | 403エラー返却 | (返信なし) |
| 日付抽出失敗 | 400エラーログ | "日付の形式が正しくありません" |
| スタッフ未登録 | 404エラーログ | "あなたのアカウントが登録されていません" |
| DB接続エラー | 500エラーログ | "システムエラーが発生しました" |
| 重複登録 | 409警告ログ | "既に登録済みです" |

## 5. データベーススキーマ

### 5.1 既存テーブル: ops.shift_preferences

```sql
-- 既存のシフト希望テーブル
CREATE TABLE ops.shift_preferences (
  preference_id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  staff_id INTEGER NOT NULL,
  preference_date DATE NOT NULL,
  preference_type VARCHAR(20), -- 'day_off', 'preferred', 'unavailable'
  start_time TIME,
  end_time TIME,
  priority INTEGER,
  reason TEXT,
  status VARCHAR(20), -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id),
  FOREIGN KEY (staff_id) REFERENCES hr.staff(staff_id)
);
```

### 5.2 新規テーブル: hr.staff_line_accounts

```sql
-- スタッフとLINE User IDの紐付けテーブル
CREATE TABLE hr.staff_line_accounts (
  staff_line_id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  staff_id INTEGER NOT NULL,
  line_user_id VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255),
  linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id),
  FOREIGN KEY (staff_id) REFERENCES hr.staff(staff_id),
  UNIQUE(tenant_id, staff_id)
);

CREATE INDEX idx_staff_line_accounts_user_id ON hr.staff_line_accounts(line_user_id);
CREATE INDEX idx_staff_line_accounts_staff_id ON hr.staff_line_accounts(staff_id);
```

### 5.3 新規テーブル: ops.line_message_logs

```sql
-- LINEメッセージログテーブル（監査・デバッグ用）
CREATE TABLE ops.line_message_logs (
  log_id SERIAL PRIMARY KEY,
  tenant_id INTEGER,
  line_user_id VARCHAR(255),
  staff_id INTEGER,
  group_id VARCHAR(255),
  message_type VARCHAR(50),
  message_text TEXT,
  parsed_intent VARCHAR(50),
  parsed_data JSONB,
  response_text TEXT,
  status VARCHAR(20), -- 'success', 'failed', 'ignored'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_line_message_logs_created ON ops.line_message_logs(created_at);
CREATE INDEX idx_line_message_logs_staff ON ops.line_message_logs(staff_id);
```

## 6. メッセージパターン定義

### 6.1 サポートするメッセージ形式

| パターン | 例 | 解析結果 |
|---------|-----|---------|
| 休み希望 | "5/1 休み希望" | type: day_off, date: 2025-05-01 |
| 休み希望 | "5月1日 休みたいです" | type: day_off, date: 2025-05-01 |
| 勤務希望 | "5/2 9:00-17:00 出勤可" | type: preferred, date: 2025-05-02, start: 09:00, end: 17:00 |
| 勤務不可 | "5/3 17時以降不可" | type: unavailable, date: 2025-05-03, start: 17:00 |
| 範囲指定 | "5/1-5/3 休み希望" | 各日付に対してday_off登録 |
| 複数日 | "5/1,5/3,5/5 休み" | 各日付に対してday_off登録 |

### 6.2 正規表現パターン

```javascript
// 日付パターン
const DATE_PATTERNS = [
  /(\d{1,2})\/(\d{1,2})/,           // 5/1
  /(\d{1,2})月(\d{1,2})日/,          // 5月1日
  /(\d{4})-(\d{1,2})-(\d{1,2})/,    // 2025-05-01
];

// 希望タイプパターン
const PREFERENCE_TYPES = {
  day_off: ['休み', '休', '休日', '有給', '公休'],
  preferred: ['出勤', '勤務', '可能', 'OK', 'ok'],
  unavailable: ['不可', 'NG', 'ng', '無理'],
};

// 時刻パターン
const TIME_PATTERN = /(\d{1,2}):(\d{2})/g;  // 9:00, 17:30
```

## 7. API エンドポイント設計

### 7.1 Webhook エンドポイント

```
POST /api/webhook/line
```

**Request Headers:**
```
x-line-signature: {HMAC-SHA256 signature}
Content-Type: application/json
```

**Request Body:**
```json
{
  "destination": "Uxxxx",
  "events": [{
    "type": "message",
    "message": {
      "type": "text",
      "id": "xxxxx",
      "text": "5月1日 休み希望"
    },
    "timestamp": 1234567890,
    "source": {
      "type": "group",
      "groupId": "Cxxxx",
      "userId": "Uxxxx"
    },
    "replyToken": "xxxxx"
  }]
}
```

**Response:**
```json
{
  "success": true
}
```

### 7.2 スタッフ紐付けエンドポイント

```
POST /api/staff/link-line
```

**Request Body:**
```json
{
  "tenant_id": 1,
  "staff_id": 123,
  "line_user_id": "Uxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "staff_line_id": 1,
    "staff_id": 123,
    "line_user_id": "Uxxxx",
    "linked_at": "2025-01-05T10:00:00Z"
  }
}
```

### 7.3 シフト希望確認エンドポイント（既存）

```
GET /api/shifts/preferences?staff_id=123&year=2025&month=5
```

## 8. セキュリティ要件

### 8.1 認証・認可

| 項目 | 実装方法 |
|-----|---------|
| Webhook検証 | LINE Signature検証（HMAC-SHA256） |
| スタッフ認証 | LINE User ID → staff_id マッピング |
| テナント分離 | テナントIDベースのデータ分離 |
| HTTPS必須 | SSL/TLS証明書（Let's Encrypt推奨） |

### 8.2 レート制限

```javascript
// レート制限設定例
const rateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分
  max: 30, // 最大30リクエスト/分
  message: 'リクエストが多すぎます。しばらく待ってからお試しください。'
});

router.post('/webhook/line', rateLimiter, handleLineWebhook);
```

### 8.3 データ保護

- 個人情報（LINE User ID、メッセージ内容）の暗号化保存
- ログローテーション（90日で自動削除）
- GDPR/個人情報保護法準拠

## 9. 実装手順

### Phase 1: 基本セットアップ（1-2日）
1. LINE Developers アカウント作成
2. Messaging API チャネル作成
3. Webhook URL設定
4. 環境変数設定

### Phase 2: データベース準備（1日）
1. staff_line_accounts テーブル作成
2. line_message_logs テーブル作成
3. マイグレーションスクリプト作成

### Phase 3: バックエンド実装（3-5日）
1. Webhook エンドポイント実装
2. 署名検証実装
3. メッセージパーサー実装
4. シフト希望登録処理実装
5. エラーハンドリング実装

### Phase 4: テスト（2-3日）
1. 単体テスト
2. 統合テスト
3. LINE環境でのE2Eテスト

### Phase 5: 運用準備（1-2日）
1. ログ監視設定
2. アラート設定
3. ドキュメント作成

## 10. 運用要件

### 10.1 監視項目

| 項目 | 閾値 | アラート |
|-----|------|---------|
| Webhook応答時間 | >3秒 | Slack通知 |
| エラー率 | >5% | メール通知 |
| DB接続エラー | 1回 | 即座に通知 |
| 署名検証失敗 | 連続5回 | セキュリティアラート |

### 10.2 バックアップ

- シフト希望データ: 毎日バックアップ
- メッセージログ: 週次バックアップ
- 設定データ: リアルタイムレプリケーション

### 10.3 ログ保持期間

- メッセージログ: 90日
- エラーログ: 1年
- アクセスログ: 30日

## 11. ユーザーマニュアル（スタッフ向け）

### 使い方

1. **初回設定**
   - 管理者がLINEアカウントとスタッフIDを紐付け
   - グループにボットを招待

2. **シフト希望登録**
   ```
   例1: 5/1 休み希望
   例2: 5月10日 9:00-17:00 出勤可
   例3: 5/15-5/20 休み希望
   ```

3. **登録確認**
   - ボットから確認メッセージが返信される
   - Webダッシュボードでも確認可能

### トラブルシューティング

| 問題 | 原因 | 解決方法 |
|-----|------|---------|
| 反応しない | ボットがグループにいない | ボットを招待 |
| 登録できない | 日付形式が間違っている | "5/1"または"5月1日"形式で入力 |
| アカウント未登録エラー | LINE連携されていない | 管理者に連絡 |

## 12. コスト見積もり

### 12.1 LINE Messaging API

| プラン | 料金 | 無料メッセージ数 |
|-------|------|----------------|
| フリー | ¥0 | 500通/月 |
| プロ | ¥5,000/月 | 30,000通/月 |

### 12.2 サーバーコスト

- 既存インフラに追加 (追加コストなし)
- ストレージ増加: 約5GB/年 (メッセージログ)

## 13. 将来の拡張案

1. **AI自然言語処理**
   - OpenAI API統合で柔軟な入力に対応
   - 曖昧な表現の解釈

2. **リッチメニュー**
   - ボタンUIでの希望登録
   - カレンダー選択UI

3. **通知機能**
   - シフト確定時の自動通知
   - リマインダー機能

4. **多言語対応**
   - 英語、中国語など
   - 自動翻訳機能

5. **画像認識**
   - 手書きメモの画像をアップロード
   - OCRで自動テキスト化
