#!/bin/bash

# AIシフト最適化システム - ディレクトリ構造作成スクリプト
set -e

PROJECT_NAME="shift-scheduler-ai"
echo "🚀 $PROJECT_NAME ディレクトリ構造作成開始..."

echo "📚 ドキュメントディレクトリ作成..."
mkdir -p docs

echo "🎨 フロントエンドディレクトリ作成..."
mkdir -p frontend/public/images
mkdir -p frontend/src/app/dashboard/components
mkdir -p frontend/src/app/shift-create/components
mkdir -p frontend/src/app/shift-edit/components  
mkdir -p frontend/src/app/api/health
mkdir -p frontend/src/components/{ui,layout,shift,forms}
mkdir -p frontend/src/{lib,hooks,types,styles}
mkdir -p frontend/__tests__/{components,pages,utils}
mkdir -p frontend/.vercel

echo "⚙️  バックエンドディレクトリ作成..."
mkdir -p backend/config/settings
mkdir -p backend/apps/core/migrations
mkdir -p backend/apps/staff/migrations
mkdir -p backend/apps/shifts/migrations
mkdir -p backend/apps/ai_engine/{services,prompts,migrations}
mkdir -p backend/apps/csv_handler/migrations
mkdir -p backend/apps/analytics/migrations
mkdir -p backend/tests/{fixtures,unit,integration,e2e}
mkdir -p backend/{fixtures,scripts,staticfiles}

echo "📊 データディレクトリ作成..."
mkdir -p data/csv_templates
mkdir -p data/sample_data/{restaurant_a,retail_store_b,cafe_c}
mkdir -p data/schemas

echo "🔧 スクリプトディレクトリ作成..."
mkdir -p scripts

echo "🐙 GitHub設定ディレクトリ作成..."
mkdir -p .github/{workflows,ISSUE_TEMPLATE}

echo "💻 VS Code設定ディレクトリ作成..."
mkdir -p .vscode

echo "🚀 デプロイ設定ディレクトリ作成..."
mkdir -p deploy/docker/{frontend,backend}
mkdir -p deploy/{vercel,railway,nginx}

echo "✅ ディレクトリ構造作成完了！"
echo ""
echo "📁 作成されたディレクトリ構造:"
tree $PROJECT_NAME 2>/dev/null || find $PROJECT_NAME -type d | sed 's/[^-][^\/]*\//  /g;s/^  //'
echo ""
echo "次のステップ:"
echo "1. cd $PROJECT_NAME"  
echo "2. git init"
echo "3. 必要なファイルを各ディレクトリに作成"
echo "4. frontend/ で Next.js プロジェクト初期化"
echo "5. backend/ で Django プロジェクト初期化"
echo ""
echo "🎉 Ready to code!"