# 設定ガイド

## 環境変数

### 必須の環境変数

#### OpenAI API設定

```bash
# OpenAI APIキー（必須）
# 取得先: https://platform.openai.com/api-keys
VITE_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# 使用するモデル（推奨: gpt-4）
VITE_OPENAI_MODEL=gpt-4

# 最大トークン数
VITE_OPENAI_MAX_TOKENS=2000
```

#### GitHub設定（デプロイ用、オプション）

```bash
# GitHub Personal Access Token
# 取得先: https://github.com/settings/tokens
# 必要なスコープ: repo
GH_TOKEN=ghp_xxxxxxxxxxxxx
```

### 環境別設定

#### ローカル開発環境

1. `.env.example`をコピー:
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. `.env`を編集してAPIキーを設定

#### 本番環境（Vercel/Railway/Netlify）

ホスティングサービスの環境変数設定画面で以下を設定:

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `VITE_OPENAI_API_KEY` | `sk-proj-...` | OpenAI APIキー |
| `VITE_OPENAI_MODEL` | `gpt-4` | 使用モデル |
| `VITE_OPENAI_MAX_TOKENS` | `2000` | 最大トークン数 |

## アプリケーション設定

### frontend/config/default.js

```javascript
export default {
  server: {
    port: parseInt(process.env.PORT) || 3001,
  },
  api: {
    openai: {
      baseURL: 'https://api.openai.com/v1',
      model: process.env.VITE_OPENAI_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.VITE_OPENAI_MAX_TOKENS) || 2000,
      beta: 'assistants=v2',
    },
  },
  paths: {
    dataRoot: '/data',
    generated: '/data/generated',
    master: '/data/master',
    history: '/data/history',
  },
  files: {
    reference: [
      // Vector Storeにアップロードする参照ファイル一覧
      '/data/master/labor_law_constraints.csv',
      '/data/master/labor_management_rules.csv',
      // ... 他のファイル
    ],
  },
}
```

### 設定のカスタマイズ

環境ごとに設定を変更する場合:

1. `config/local.js`、`config/production.js`などを作成
2. `default.js`の値を上書き
3. 環境変数`NODE_ENV`で切り替え

```javascript
// config/production.js
export default {
  api: {
    openai: {
      maxTokens: 4000,  // 本番では多めに設定
    },
  },
}
```

## データファイル設定

### 参照データの配置

すべてのCSVファイルは`frontend/public/data/`配下に配置:

```
frontend/public/data/
├── master/           # マスタデータ
│   ├── labor_law_constraints.csv
│   ├── stores.csv
│   ├── staff.csv
│   └── ...
├── history/          # 履歴データ
│   ├── shift_history_2023-2024.csv
│   └── shift_monthly_summary.csv
└── generated/        # AIが生成したシフト（自動作成）
    └── shift_202411_xxxxx.csv
```

### CSV フォーマット

#### スタッフマスタ (staff.csv)

```csv
staff_id,staff_name,hire_date,employment_type,skills,certifications
S001,山田太郎,2020-04-01,正社員,レジ・接客・在庫管理,衛生管理者
S002,佐藤花子,2021-06-15,パート,レジ・接客,なし
```

#### 店舗マスタ (stores.csv)

```csv
store_id,store_name,location,open_time,close_time,required_staff
ST001,渋谷店,東京都渋谷区,09:00,22:00,10
ST002,新宿店,東京都新宿区,10:00,21:00,8
```

## トラブルシューティング

### APIキーが無効

**症状**: `Invalid API Key` エラー

**解決策**:
1. `.env`ファイルのAPIキーを確認
2. APIキーの先頭が`sk-proj-`または`sk-`で始まっているか確認
3. OpenAIのダッシュボードで有効なキーか確認

### Vector Store作成に失敗

**症状**: ファイルアップロードエラー

**解決策**:
1. CSVファイルのパスが正しいか確認
2. ファイルが存在するか確認: `ls frontend/public/data/master/`
3. バックエンドサーバーが起動しているか確認

### シフト生成が遅い

**原因**:
- GPT-4は応答に時間がかかる（30-60秒程度）
- 大量のデータを処理している

**対策**:
- `VITE_OPENAI_MODEL=gpt-3.5-turbo`に変更（速度優先）
- 参照ファイル数を減らす

## セキュリティ設定

### 秘密情報の管理

**禁止事項**:
- `.env`ファイルをGitにコミットしない
- APIキーをコードに直接記述しない
- APIキーを公開リポジトリに含めない

**推奨事項**:
- GitHub Secretsを使用
- 本番環境ではホスティングサービスの環境変数機能を使用
- API キーは定期的にローテーション

## デプロイ設定

### Vercel

1. プロジェクトをGitHubにプッシュ
2. Vercelでインポート
3. 環境変数を設定（Settings > Environment Variables）
4. デプロイ

### Railway

1. `backend`ディレクトリをデプロイ
2. 環境変数を設定
3. ポート番号を`PORT`環境変数で指定

### Netlify

フロントエンドのみ（静的サイト）:
1. `frontend`をビルド: `pnpm run build`
2. `dist`ディレクトリをデプロイ

**注意**: バックエンドは別途デプロイが必要

## 参考リンク

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [dotenv Documentation](https://github.com/motdotla/dotenv)
