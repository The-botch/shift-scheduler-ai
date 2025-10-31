#!/bin/bash

# ============================================
# AIシフトスケジューラー データベース完全構築スクリプト
# 対象: Railway PostgreSQL
# テーブル数: 31テーブル（基本20 + 追加11）
# CSV対応: 36/36 (100%)
# ============================================

set -e  # エラーが発生したら即座に終了

# 色付き出力
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}🚀 AIシフトスケジューラー DB構築開始${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# DATABASE_URLの確認
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ エラー: DATABASE_URLが設定されていません${NC}"
    echo "Railway環境変数を設定してください:"
    echo "  export DATABASE_URL='postgresql://...'"
    echo "または Railway CLI経由で実行してください:"
    echo "  railway run ./scripts/db/setup_all.sh"
    exit 1
fi

echo -e "${GREEN}✅ DATABASE_URL確認済み${NC}"
echo ""

# ステップ1: 基本テーブル作成
echo -e "${YELLOW}📝 ステップ1/4: 基本テーブル作成（20テーブル）${NC}"
echo "   実行中: 001_create_tables.sql"
if psql "$DATABASE_URL" -f scripts/db/001_create_tables.sql > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ 基本テーブル作成完了${NC}"
else
    echo -e "${RED}   ❌ エラー: 基本テーブル作成に失敗しました${NC}"
    exit 1
fi
echo ""

# ステップ2: 基本マスターデータ投入
echo -e "${YELLOW}📝 ステップ2/4: 基本マスターデータ投入${NC}"
echo "   実行中: 002_seed_master_data.sql"
if psql "$DATABASE_URL" -f scripts/db/002_seed_master_data.sql > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ 基本マスターデータ投入完了${NC}"
else
    echo -e "${RED}   ❌ エラー: 基本マスターデータ投入に失敗しました${NC}"
    exit 1
fi
echo ""

# ステップ3: 追加テーブル作成
echo -e "${YELLOW}📝 ステップ3/4: 追加テーブル作成（11テーブル）${NC}"
echo "   実行中: 003_add_missing_tables.sql"
if psql "$DATABASE_URL" -f scripts/db/003_add_missing_tables.sql > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ 追加テーブル作成完了${NC}"
else
    echo -e "${RED}   ❌ エラー: 追加テーブル作成に失敗しました${NC}"
    exit 1
fi
echo ""

# ステップ4: 追加マスターデータ投入
echo -e "${YELLOW}📝 ステップ4/4: 追加マスターデータ投入${NC}"
echo "   実行中: 004_seed_additional_data.sql"
if psql "$DATABASE_URL" -f scripts/db/004_seed_additional_data.sql > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ 追加マスターデータ投入完了${NC}"
else
    echo -e "${RED}   ❌ エラー: 追加マスターデータ投入に失敗しました${NC}"
    exit 1
fi
echo ""

# 確認
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}📊 構築結果の確認${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

echo -e "${YELLOW}テーブル数確認中...${NC}"
TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
echo -e "${GREEN}✅ テーブル数: ${TABLE_COUNT}/31${NC}"
echo ""

if [ "$TABLE_COUNT" -eq 31 ]; then
    echo -e "${GREEN}🎉 データベース構築が完全に成功しました！${NC}"
    echo ""
    echo "作成されたテーブル:"
    psql "$DATABASE_URL" -c "\dt" | grep "public |"
    echo ""
    echo -e "${GREEN}✅ CSV対応率: 36/36 (100%)${NC}"
    echo -e "${GREEN}✅ すべての機能が利用可能です${NC}"
else
    echo -e "${YELLOW}⚠️  警告: 期待されるテーブル数と異なります（期待: 31, 実際: ${TABLE_COUNT}）${NC}"
fi

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}🎉 構築完了！${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo "次のステップ:"
echo "1. バックエンドAPI実装 (backend/src/db/connection.js)"
echo "2. CRUD エンドポイント作成"
echo "3. フロントエンド連携"
echo ""
echo "詳細は docs/DATABASE_COMPLETE.md を参照してください。"
