#!/bin/bash

# ============================================
# AIシフトスケジューラー マルチテナント完全構築スクリプト
# 対象: Railway PostgreSQL
# 構成: 5スキーマ (core, ops, hr, analytics, audit)
# テーブル数: 31テーブル（全テーブルにtenant_id追加）
# ============================================

set -e  # エラーが発生したら即座に終了

# 色付き出力
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}🚀 AIシフトスケジューラー マルチテナント構築開始${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# DATABASE_URLの確認
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ エラー: DATABASE_URLが設定されていません${NC}"
    echo "Railway環境変数を設定してください:"
    echo "  export DATABASE_URL='postgresql://...'"
    echo "または Railway CLI経由で実行してください:"
    echo "  railway run ./scripts/db/setup_multitenant.sh"
    exit 1
fi

echo -e "${GREEN}✅ DATABASE_URL確認済み${NC}"
echo ""

# 実行モードの選択
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}📋 実行モードを選択してください${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""
echo "1. フルセットアップ（新規構築）"
echo "   - マルチテナントスキーマ作成（005）"
echo "   - RLSポリシー設定（007）"
echo ""
echo "2. 既存データ移行（既に001-004を実行済みの場合）"
echo "   - マルチテナントスキーマ作成（005）"
echo "   - 既存データ移行（006）"
echo "   - RLSポリシー設定（007）"
echo ""
echo "3. RLSのみ設定（既に005を実行済みの場合）"
echo "   - RLSポリシー設定（007）のみ"
echo ""
read -p "選択してください (1/2/3): " mode

case $mode in
    1)
        echo ""
        echo -e "${YELLOW}📝 モード1: フルセットアップ（新規構築）${NC}"
        echo ""

        # ステップ1: マルチテナントスキーマ作成
        echo -e "${YELLOW}ステップ1/2: マルチテナントスキーマ作成（31テーブル）${NC}"
        echo "   実行中: 005_create_multitenant_schema.sql"
        if psql "$DATABASE_URL" -f scripts/db/005_create_multitenant_schema.sql > /dev/null 2>&1; then
            echo -e "${GREEN}   ✅ マルチテナントスキーマ作成完了${NC}"
        else
            echo -e "${RED}   ❌ エラー: マルチテナントスキーマ作成に失敗しました${NC}"
            exit 1
        fi
        echo ""

        # ステップ2: RLSポリシー設定
        echo -e "${YELLOW}ステップ2/2: Row Level Security (RLS) ポリシー設定${NC}"
        echo "   実行中: 007_setup_rls_policies.sql"
        if psql "$DATABASE_URL" -f scripts/db/007_setup_rls_policies.sql > /dev/null 2>&1; then
            echo -e "${GREEN}   ✅ RLSポリシー設定完了${NC}"
        else
            echo -e "${RED}   ❌ エラー: RLSポリシー設定に失敗しました${NC}"
            exit 1
        fi
        echo ""
        ;;

    2)
        echo ""
        echo -e "${YELLOW}📝 モード2: 既存データ移行${NC}"
        echo ""

        # ステップ1: マルチテナントスキーマ作成
        echo -e "${YELLOW}ステップ1/3: マルチテナントスキーマ作成（31テーブル）${NC}"
        echo "   実行中: 005_create_multitenant_schema.sql"
        if psql "$DATABASE_URL" -f scripts/db/005_create_multitenant_schema.sql > /dev/null 2>&1; then
            echo -e "${GREEN}   ✅ マルチテナントスキーマ作成完了${NC}"
        else
            echo -e "${RED}   ❌ エラー: マルチテナントスキーマ作成に失敗しました${NC}"
            exit 1
        fi
        echo ""

        # ステップ2: 既存データ移行
        echo -e "${YELLOW}ステップ2/3: 既存データをマルチテナント構造に移行${NC}"
        echo "   実行中: 006_migrate_to_multitenant.sql"
        if psql "$DATABASE_URL" -f scripts/db/006_migrate_to_multitenant.sql > /dev/null 2>&1; then
            echo -e "${GREEN}   ✅ 既存データ移行完了${NC}"
        else
            echo -e "${RED}   ❌ エラー: 既存データ移行に失敗しました${NC}"
            exit 1
        fi
        echo ""

        # ステップ3: RLSポリシー設定
        echo -e "${YELLOW}ステップ3/3: Row Level Security (RLS) ポリシー設定${NC}"
        echo "   実行中: 007_setup_rls_policies.sql"
        if psql "$DATABASE_URL" -f scripts/db/007_setup_rls_policies.sql > /dev/null 2>&1; then
            echo -e "${GREEN}   ✅ RLSポリシー設定完了${NC}"
        else
            echo -e "${RED}   ❌ エラー: RLSポリシー設定に失敗しました${NC}"
            exit 1
        fi
        echo ""
        ;;

    3)
        echo ""
        echo -e "${YELLOW}📝 モード3: RLSのみ設定${NC}"
        echo ""

        # RLSポリシー設定のみ
        echo -e "${YELLOW}ステップ1/1: Row Level Security (RLS) ポリシー設定${NC}"
        echo "   実行中: 007_setup_rls_policies.sql"
        if psql "$DATABASE_URL" -f scripts/db/007_setup_rls_policies.sql > /dev/null 2>&1; then
            echo -e "${GREEN}   ✅ RLSポリシー設定完了${NC}"
        else
            echo -e "${RED}   ❌ エラー: RLSポリシー設定に失敗しました${NC}"
            exit 1
        fi
        echo ""
        ;;

    *)
        echo -e "${RED}❌ 無効な選択です。1, 2, または 3 を選択してください。${NC}"
        exit 1
        ;;
esac

# 確認
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}📊 構築結果の確認${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# スキーマ数確認
echo -e "${YELLOW}スキーマ数確認中...${NC}"
SCHEMA_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name IN ('core', 'ops', 'hr', 'analytics', 'audit');" | tr -d ' ')
echo -e "${GREEN}✅ マルチテナントスキーマ数: ${SCHEMA_COUNT}/5${NC}"
echo ""

# テーブル数確認（各スキーマ別）
echo -e "${YELLOW}テーブル数確認中...${NC}"
CORE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'core';" | tr -d ' ')
HR_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'hr';" | tr -d ' ')
OPS_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'ops';" | tr -d ' ')
ANALYTICS_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'analytics';" | tr -d ' ')
AUDIT_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'audit';" | tr -d ' ')
TOTAL_COUNT=$((CORE_COUNT + HR_COUNT + OPS_COUNT + ANALYTICS_COUNT + AUDIT_COUNT))

echo -e "${GREEN}✅ テーブル数:${NC}"
echo -e "   - core: ${CORE_COUNT}テーブル"
echo -e "   - hr: ${HR_COUNT}テーブル"
echo -e "   - ops: ${OPS_COUNT}テーブル"
echo -e "   - analytics: ${ANALYTICS_COUNT}テーブル"
echo -e "   - audit: ${AUDIT_COUNT}テーブル"
echo -e "   ${CYAN}合計: ${TOTAL_COUNT}/31テーブル${NC}"
echo ""

# テナント数確認
echo -e "${YELLOW}テナント数確認中...${NC}"
TENANT_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM core.tenants;" | tr -d ' ')
echo -e "${GREEN}✅ テナント数: ${TENANT_COUNT}件${NC}"
echo ""

# テナント一覧表示
if [ "$TENANT_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}テナント一覧:${NC}"
    psql "$DATABASE_URL" -c "SELECT tenant_id, tenant_code, tenant_name, contract_plan, is_active FROM core.tenants ORDER BY tenant_id;"
    echo ""
fi

# RLS確認
echo -e "${YELLOW}Row Level Security (RLS) 状態確認中...${NC}"
RLS_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname IN ('core', 'hr', 'ops', 'analytics', 'audit') AND rowsecurity = true;" | tr -d ' ')
echo -e "${GREEN}✅ RLS有効化済みテーブル: ${RLS_COUNT}テーブル${NC}"
echo ""

# ロール確認
echo -e "${YELLOW}データベースロール確認中...${NC}"
if psql "$DATABASE_URL" -t -c "SELECT 1 FROM pg_roles WHERE rolname = 'app_role';" | grep -q 1; then
    echo -e "${GREEN}✅ app_role作成済み${NC}"
else
    echo -e "${YELLOW}⚠️  app_roleが見つかりません${NC}"
fi

if psql "$DATABASE_URL" -t -c "SELECT 1 FROM pg_roles WHERE rolname = 'admin_role';" | grep -q 1; then
    echo -e "${GREEN}✅ admin_role作成済み${NC}"
else
    echo -e "${YELLOW}⚠️  admin_roleが見つかりません${NC}"
fi
echo ""

# 最終結果判定
if [ "$SCHEMA_COUNT" -eq 5 ] && [ "$TOTAL_COUNT" -eq 31 ]; then
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}🎉 マルチテナント構築が完全に成功しました！${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo "✅ 作成されたスキーマ: core, ops, hr, analytics, audit"
    echo "✅ 作成されたテーブル: 31テーブル（全テーブルにtenant_id追加）"
    echo "✅ Row Level Security: ${RLS_COUNT}テーブルで有効化"
    echo "✅ テナント数: ${TENANT_COUNT}件"
    echo ""
    echo -e "${CYAN}============================================${NC}"
    echo -e "${CYAN}📝 次のステップ${NC}"
    echo -e "${CYAN}============================================${NC}"
    echo ""
    echo "1. アプリケーション側の実装:"
    echo "   - backend/src/db/connection.js"
    echo "     データベース接続時にset_current_tenant()を実行"
    echo ""
    echo "   例: "
    echo "   const client = await pool.connect();"
    echo "   await client.query('SELECT set_current_tenant(\$1)', [tenantId]);"
    echo ""
    echo "2. RLS動作確認:"
    echo "   railway run psql \$DATABASE_URL"
    echo "   > SELECT set_current_tenant(1);"
    echo "   > SELECT * FROM core.stores;  -- tenant_id=1のデータのみ表示"
    echo ""
    echo "3. テナント追加:"
    echo "   INSERT INTO core.tenants (tenant_code, tenant_name, ...) VALUES (...);"
    echo ""
    echo "詳細は docs/MULTITENANT_REDESIGN.md を参照してください。"
else
    echo -e "${YELLOW}============================================${NC}"
    echo -e "${YELLOW}⚠️  警告: 期待される構成と異なります${NC}"
    echo -e "${YELLOW}============================================${NC}"
    echo ""
    echo "期待値:"
    echo "  - スキーマ数: 5"
    echo "  - テーブル数: 31"
    echo ""
    echo "実際の値:"
    echo "  - スキーマ数: ${SCHEMA_COUNT}"
    echo "  - テーブル数: ${TOTAL_COUNT}"
    echo ""
    echo "SQLスクリプトを再実行するか、ログを確認してください。"
fi

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}🎉 処理完了！${NC}"
echo -e "${BLUE}============================================${NC}"
