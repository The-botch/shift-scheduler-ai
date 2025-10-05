# バックエンドAPI ドキュメント

## 概要

このバックエンドAPIは、OpenAI Assistants APIへのプロキシとCSV処理機能を提供します。

- **ベースURL**: `http://localhost:3001`
- **OpenAPIスペック**: `openapi.yaml`

## アーキテクチャ

```
フロントエンド → バックエンド (プロキシ) → OpenAI API
                ↓
           CSV処理・保存
```

### レイヤー構成

- **Routes** (`/src/routes`): APIエンドポイント定義
- **Services** (`/src/services`): ビジネスロジック
- **Utils** (`/src/utils`): ユーティリティ関数

## エンドポイント一覧

### 1. ChatGPT API

#### POST `/api/openai/chat/completions`
Chat Completions APIへのプロキシ

**リクエスト例:**
```bash
curl -X POST http://localhost:3001/api/openai/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "system", "content": "あなたはシフト管理の専門家です"},
      {"role": "user", "content": "2024年11月のシフトを作成してください"}
    ],
    "temperature": 0.7,
    "max_tokens": 2000
  }'
```

**レスポンス例:**
```json
{
  "id": "chatcmpl-123",
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "シフト案を作成いたします..."
    }
  }],
  "usage": {
    "prompt_tokens": 50,
    "completion_tokens": 200,
    "total_tokens": 250
  }
}
```

---

### 2. Vector Store管理

#### POST `/api/openai/vector_stores`
Vector Storeを作成

**リクエスト例:**
```bash
curl -X POST http://localhost:3001/api/openai/vector_stores \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Staff Master Data"
  }'
```

**レスポンス例:**
```json
{
  "id": "vs_abc123",
  "name": "Staff Master Data",
  "created_at": 1699564800
}
```

#### POST `/api/openai/vector_stores/{vectorStoreId}/files`
Vector StoreにFileを追加

**リクエスト例:**
```bash
curl -X POST http://localhost:3001/api/openai/vector_stores/vs_abc123/files \
  -H "Content-Type: application/json" \
  -d '{
    "file_id": "file-xyz789"
  }'
```

---

### 3. ファイル管理

#### POST `/api/openai/files`
CSVファイルをJSON変換してアップロード

**重要な機能:**
- フロントエンドの`public/`ディレクトリからCSVを読み込み
- Papa Parseで自動的にJSON形式に変換
- OpenAIに`.json`拡張子でアップロード
- 一時ファイルは自動削除

**リクエスト例:**
```bash
curl -X POST http://localhost:3001/api/openai/files \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "data/master/staff.csv"
  }'
```

**レスポンス例:**
```json
{
  "id": "file-xyz789",
  "filename": "staff.json",
  "purpose": "assistants",
  "bytes": 12345
}
```

#### GET `/api/openai/files/{fileId}/content`
ファイルコンテンツをダウンロード

**リクエスト例:**
```bash
curl http://localhost:3001/api/openai/files/file-xyz789/content
```

---

### 4. Assistant管理

#### POST `/api/openai/assistants`
Assistantを作成

**リクエスト例:**
```bash
curl -X POST http://localhost:3001/api/openai/assistants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Shift Scheduler Assistant",
    "instructions": "あなたはシフト管理の専門家です。スタッフの希望やスキル、労働基準法を考慮してシフトを作成してください。",
    "model": "gpt-4-turbo-preview",
    "tools": [{"type": "file_search"}],
    "tool_resources": {
      "file_search": {
        "vector_store_ids": ["vs_abc123"]
      }
    }
  }'
```

**レスポンス例:**
```json
{
  "id": "asst_def456",
  "name": "Shift Scheduler Assistant",
  "model": "gpt-4-turbo-preview",
  "instructions": "あなたはシフト管理の専門家です...",
  "tools": [{"type": "file_search"}]
}
```

---

### 5. Thread管理

#### POST `/api/openai/threads`
Threadを作成

**リクエスト例:**
```bash
curl -X POST http://localhost:3001/api/openai/threads \
  -H "Content-Type: application/json" \
  -d '{}'
```

**レスポンス例:**
```json
{
  "id": "thread_ghi789",
  "created_at": 1699564800
}
```

---

### 6. Message管理

#### POST `/api/openai/threads/{threadId}/messages`
Messageを追加

**リクエスト例:**
```bash
curl -X POST http://localhost:3001/api/openai/threads/thread_ghi789/messages \
  -H "Content-Type: application/json" \
  -d '{
    "role": "user",
    "content": "2024年11月のシフトを作成してください"
  }'
```

#### GET `/api/openai/threads/{threadId}/messages`
Message一覧を取得

**リクエスト例:**
```bash
curl http://localhost:3001/api/openai/threads/thread_ghi789/messages
```

**レスポンス例:**
```json
{
  "data": [
    {
      "id": "msg_001",
      "role": "assistant",
      "content": [
        {
          "type": "text",
          "text": {
            "value": "シフト案を作成しました..."
          }
        }
      ]
    },
    {
      "id": "msg_002",
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": {
            "value": "2024年11月のシフトを作成してください"
          }
        }
      ]
    }
  ]
}
```

---

### 7. Run管理

#### POST `/api/openai/threads/{threadId}/runs`
Runを実行

**リクエスト例:**
```bash
curl -X POST http://localhost:3001/api/openai/threads/thread_ghi789/runs \
  -H "Content-Type: application/json" \
  -d '{
    "assistant_id": "asst_def456"
  }'
```

**レスポンス例:**
```json
{
  "id": "run_jkl012",
  "status": "queued",
  "thread_id": "thread_ghi789",
  "assistant_id": "asst_def456"
}
```

#### GET `/api/openai/threads/{threadId}/runs/{runId}`
Run状態を取得

**リクエスト例:**
```bash
curl http://localhost:3001/api/openai/threads/thread_ghi789/runs/run_jkl012
```

**レスポンス例:**
```json
{
  "id": "run_jkl012",
  "status": "completed",
  "completed_at": 1699565000
}
```

**Run Status一覧:**
- `queued`: 待機中
- `in_progress`: 実行中
- `completed`: 完了
- `failed`: 失敗
- `cancelled`: キャンセル
- `expired`: 期限切れ

---

### 8. CSV処理

#### POST `/api/save-csv`
CSVファイルを保存

**保存先:** `frontend/public/data/generated/{filename}`

**リクエスト例:**
```bash
curl -X POST http://localhost:3001/api/save-csv \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "shift_2024_11.csv",
    "content": "name,date,shift,start,end\nJohn Doe,2024-11-01,Morning,09:00,17:00\nJane Smith,2024-11-01,Evening,13:00,21:00"
  }'
```

**レスポンス例:**
```json
{
  "success": true,
  "message": "File saved successfully",
  "filepath": "/data/generated/shift_2024_11.csv"
}
```

**エラーレスポンス例:**
```json
{
  "error": "filename and content are required"
}
```

---

## フロントエンドからの使用例

### OpenAIClientを使用

```javascript
import { OpenAIClient } from './infrastructure/api/OpenAIClient'

const client = new OpenAIClient('http://localhost:3001')

// Chat Completions
const response = await client.sendChatCompletion([
  { role: 'user', content: 'シフトを作成してください' }
], { model: 'gpt-4' })

// Vector Store作成
const vectorStore = await client.createVectorStore('Staff Data')

// ファイルアップロード (CSV→JSON自動変換)
const file = await client.uploadFile('data/master/staff.csv')

// Assistant作成
const assistant = await client.createAssistant({
  name: 'Shift Assistant',
  instructions: '...',
  model: 'gpt-4-turbo-preview',
  tools: [{ type: 'file_search' }],
  tool_resources: {
    file_search: { vector_store_ids: [vectorStore.id] }
  }
})

// Thread & Run
const thread = await client.createThread()
await client.addMessage(thread.id, 'user', 'シフトを作成')
const run = await client.createRun(thread.id, assistant.id)

// Run完了待機
let runStatus
do {
  await new Promise(resolve => setTimeout(resolve, 1000))
  runStatus = await client.getRunStatus(thread.id, run.id)
} while (runStatus.status === 'in_progress' || runStatus.status === 'queued')

// メッセージ取得
const messages = await client.getMessages(thread.id)
```

---

## 環境変数

`.env`ファイルに以下を設定:

```env
VITE_OPENAI_API_KEY=sk-proj-...
```

---

## エラーハンドリング

### エラーレスポンス形式

```json
{
  "error": "エラーメッセージの詳細"
}
```

### 一般的なエラー

- **400 Bad Request**: リクエストパラメータ不足
- **404 Not Found**: ファイルが見つからない
- **500 Internal Server Error**: OpenAI APIエラー、ファイルシステムエラー等

### ログ

サーバーログは `backend/src/server.log` に記録されます:

```
[2024-11-05T10:30:00.000Z] 🚀 Backend server running on http://localhost:3001
[2024-11-05T10:30:00.001Z] 📡 OpenAI API Proxy enabled
[2024-11-05T10:30:15.123Z] ✅ ファイルアップロード成功: staff.json → file-xyz789
```

---

## テスト

テストスイート: 30テスト (全通過)

```bash
npm test              # テスト実行
npm run test:watch    # ウォッチモード
npm run test:coverage # カバレッジ計測
```

### テストファイル

- `src/services/fileService.test.js` - CSV処理テスト
- `src/services/openaiService.test.js` - OpenAI設定テスト
- `src/routes/openai.test.js` - OpenAI APIルートテスト
- `src/routes/csv.test.js` - CSVルートテスト

---

## 開発

### サーバー起動

```bash
npm run dev    # 開発モード (ホットリロード)
npm start      # 本番モード
```

### 構成

```
backend/
├── src/
│   ├── server.js              # Expressサーバー
│   ├── routes/
│   │   ├── openai.js          # OpenAI APIルート (11エンドポイント)
│   │   └── csv.js             # CSVルート
│   ├── services/
│   │   ├── openaiService.js   # OpenAI SDK設定
│   │   └── fileService.js     # ファイル処理
│   └── utils/
│       └── logger.js          # ログ管理
├── openapi.yaml               # OpenAPI 3.0スペック
├── API.md                     # このドキュメント
├── vitest.config.js           # テスト設定
└── package.json
```

---

## セキュリティ

### APIキー管理

- OpenAI APIキーはバックエンドの`.env`で管理
- フロントエンドからは直接OpenAI APIにアクセスしない
- バックエンドがプロキシとして機能

### CORS設定

デフォルトで全オリジンを許可（開発環境用）:

```javascript
app.use(cors())
```

本番環境では特定のオリジンのみ許可するよう変更してください。

---

## トラブルシューティング

### ファイルアップロードエラー

**エラー:** `ファイルが見つかりません: /path/to/file.csv`

**解決策:**
- ファイルパスが`frontend/public/`からの相対パスであることを確認
- ファイルが実際に存在することを確認

### OpenAI APIエラー

**エラー:** `401 Unauthorized`

**解決策:**
- `.env`ファイルの`VITE_OPENAI_API_KEY`が正しく設定されているか確認
- APIキーが有効か確認

### ポート競合

**エラー:** `Port 3001 is already in use`

**解決策:**
```bash
lsof -ti:3001 | xargs kill  # ポート3001を使用中のプロセスを終了
```
