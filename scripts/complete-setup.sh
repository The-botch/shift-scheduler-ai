#!/bin/bash

# リファクタリング完了スクリプト
# 実行方法: bash scripts/complete-setup.sh

set -e  # エラーが発生したら停止

echo "🚀 セットアップ完了スクリプト開始..."

# プロジェクトルートに移動
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)
echo "📁 プロジェクトルート: $PROJECT_ROOT"

# ===========================
# Step 1: server.jsをbackendにコピー
# ===========================
echo ""
echo "📋 Step 1: server.jsをbackendにコピー"

if [ ! -d "$PROJECT_ROOT/backend/src" ]; then
  mkdir -p "$PROJECT_ROOT/backend/src"
fi

cp "$PROJECT_ROOT/frontend/server.js" "$PROJECT_ROOT/backend/src/server.js"
echo "✅ server.jsをコピーしました"

# パスを修正
echo "🔧 ファイルパスを修正中..."

# macOS用のsed（-i ''が必要）
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s|path.join(__dirname, 'public'|path.join(__dirname, '../frontend/public'|g" "$PROJECT_ROOT/backend/src/server.js"
else
  # Linux用のsed
  sed -i "s|path.join(__dirname, 'public'|path.join(__dirname, '../frontend/public'|g" "$PROJECT_ROOT/backend/src/server.js"
fi

echo "✅ パスを修正しました"

# ===========================
# Step 2: .envをbackendにコピー
# ===========================
echo ""
echo "🔐 Step 2: .envファイルをコピー"

if [ -f "$PROJECT_ROOT/frontend/.env" ]; then
  cp "$PROJECT_ROOT/frontend/.env" "$PROJECT_ROOT/backend/.env"
  echo "✅ .envをコピーしました"
else
  echo "⚠️  frontend/.envが見つかりません"
  echo "   frontend/.env.exampleから.envを作成してください"
fi

# ===========================
# Step 3: バックエンド依存関係インストール
# ===========================
echo ""
echo "📦 Step 3: バックエンド依存関係をインストール"

cd "$PROJECT_ROOT/backend"
npm install

echo "✅ バックエンドのインストールが完了しました"

# ===========================
# Step 4: package.jsonスクリプト確認
# ===========================
echo ""
echo "📝 Step 4: package.jsonの確認"

cd "$PROJECT_ROOT/frontend"

# package.jsonにformat scriptが含まれているか確認
if grep -q '"format"' package.json; then
  echo "✅ format scriptは既に存在します"
else
  echo "⚠️  package.jsonに以下のスクリプトを手動で追加してください:"
  echo '   "format": "prettier --write \"src/**/*.{js,jsx,json,css,md}\"",'
  echo '   "format:check": "prettier --check \"src/**/*.{js,jsx,json,css,md}\""'
fi

# ===========================
# 完了
# ===========================
echo ""
echo "✨ セットアップ完了！"
echo ""
echo "次のステップ:"
echo "1. バックエンド起動:"
echo "   cd backend && npm run dev"
echo ""
echo "2. フロントエンド起動（別ターミナル）:"
echo "   cd frontend && npm run dev"
echo ""
echo "3. ブラウザで確認:"
echo "   http://localhost:5173"
echo ""
echo "詳細は QUICK_START.md を参照してください"
