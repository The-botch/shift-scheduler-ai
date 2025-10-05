#!/bin/bash

# リファクタリング自動実行スクリプト
# 実行方法: cd scripts && bash refactor.sh

set -e  # エラーが発生したら停止

echo "🚀 リファクタリング開始..."

# 作業ディレクトリを設定
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)
echo "📁 プロジェクトルート: $PROJECT_ROOT"

# ===========================
# PR#1: Prettier導入とコード整形
# ===========================
echo ""
echo "📝 PR#1: Prettier導入"
cd "$PROJECT_ROOT/frontend"

# Prettierインストール（pnpm使用）
pnpm add -D prettier

# package.jsonスクリプト更新は手動で行う必要があるため、ここでは.eslintrc.cjsを削除のみ
rm -f .eslintrc.cjs
echo "✅ 古いESLint設定ファイルを削除しました"

# ===========================
# PR#2: 設定の外部化
# ===========================
echo ""
echo "⚙️  PR#2: 設定ファイル作成"

# configディレクトリ作成
mkdir -p "$PROJECT_ROOT/frontend/config"

# default.js作成
cat > "$PROJECT_ROOT/frontend/config/default.js" << 'EOF'
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
      '/data/master/labor_law_constraints.csv',
      '/data/master/labor_management_rules.csv',
      '/data/master/shift_validation_rules.csv',
      '/data/master/stores.csv',
      '/data/master/store_constraints.csv',
      '/data/master/staff.csv',
      '/data/master/staff_skills.csv',
      '/data/master/staff_certifications.csv',
      '/data/history/shift_history_2023-2024.csv',
      '/data/history/shift_monthly_summary.csv',
    ],
  },
}
EOF

echo "✅ config/default.js を作成しました"

# ===========================
# PR#4: バックエンド分離
# ===========================
echo ""
echo "🔧 PR#4: バックエンド分離"

# backendディレクトリ作成
mkdir -p "$PROJECT_ROOT/backend/src"

# server.jsを移動
cp "$PROJECT_ROOT/frontend/server.js" "$PROJECT_ROOT/backend/src/server.js"

# backend/package.json作成
cat > "$PROJECT_ROOT/backend/package.json" << 'EOF'
{
  "name": "shift-scheduler-backend",
  "version": "1.0.0",
  "type": "module",
  "description": "AIシフト管理システム バックエンドAPI",
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js"
  },
  "dependencies": {
    "express": "^5.1.0",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "openai": "^6.1.0",
    "papaparse": "^5.5.3"
  }
}
EOF

# .envをバックエンドにコピー
cp "$PROJECT_ROOT/frontend/.env" "$PROJECT_ROOT/backend/.env" 2>/dev/null || true

echo "✅ backendディレクトリを作成しました"

# ===========================
# ドキュメント作成
# ===========================
echo ""
echo "📚 ドキュメント作成"

cat > "$PROJECT_ROOT/README.md" << 'EOF'
# AI Shift Scheduler

AIを活用した自動シフト生成・管理システム

## プロジェクト構成

```
shift-scheduler-ai/
├── frontend/          # フロントエンド（React + Vite）
│   ├── src/           # ソースコード
│   ├── public/        # 静的ファイル・データ
│   └── config/        # 設定ファイル
├── backend/           # バックエンド（Express API）
│   └── src/           # APIサーバー
└── fixtures/          # テスト用データ
```

## セットアップ

### 1. 環境変数の設定

```bash
# frontendディレクトリで.envファイルを作成
cd frontend
cp .env.example .env
# .envファイルを編集してAPI Keyを設定
```

### 2. 依存関係のインストール

```bash
# フロントエンド
cd frontend
pnpm install

# バックエンド
cd ../backend
npm install
```

### 3. 開発サーバー起動

```bash
# ターミナル1: バックエンド起動
cd backend
npm run dev

# ターミナル2: フロントエンド起動
cd frontend
pnpm run dev
```

http://localhost:5173 でアプリケーションにアクセスできます。

## 主な機能

- **AIシフト生成**: OpenAI GPT-4を使用した自動シフト作成
- **制約管理**: 労働基準法・店舗制約・スタッフスキルを考慮
- **Vector Store**: OpenAI Assistants APIによる参照データ管理
- **CSVエクスポート**: 生成されたシフトをCSV形式で出力

## 技術スタック

- **Frontend**: React 19, Vite, TailwindCSS, shadcn/ui
- **Backend**: Express, OpenAI SDK
- **AI**: OpenAI GPT-4, Assistants API v2

## ドキュメント

- [アーキテクチャ](docs/ARCHITECTURE.md)
- [セキュリティ](SECURITY.md)
- [設定](docs/CONFIGURATION.md)

## ライセンス

MIT
EOF

echo "✅ README.mdを更新しました"

# ===========================
# 最終メッセージ
# ===========================
echo ""
echo "✨ リファクタリングが完了しました！"
echo ""
echo "次のステップ:"
echo "1. frontend/package.jsonのscriptsセクションに以下を追加:"
echo '   "format": "prettier --write \"src/**/*.{js,jsx,json,css,md}\""'
echo ""
echo "2. バックエンド依存関係をインストール:"
echo "   cd backend && npm install"
echo ""
echo "3. 動作確認:"
echo "   - バックエンド: cd backend && npm run dev"
echo "   - フロントエンド: cd frontend && pnpm run dev"
echo ""
echo "4. Gitコミット:"
echo "   git add ."
echo "   git commit -m \"refactor: プロジェクト構造をリファクタリング\""
