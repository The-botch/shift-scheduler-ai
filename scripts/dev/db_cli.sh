#!/bin/bash

# Railway PostgreSQLへのCLI接続スクリプト

# 接続情報
export PGHOST="mainline.proxy.rlwy.net"
export PGPORT="50142"
export PGDATABASE="railway"
export PGUSER="postgres"
export PGPASSWORD="gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe"

echo "🔌 Railway PostgreSQLへ接続中..."
echo ""
echo "接続情報:"
echo "  Host: ${PGHOST}"
echo "  Port: ${PGPORT}"
echo "  Database: ${PGDATABASE}"
echo "  User: ${PGUSER}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "便利なコマンド:"
echo "  \\dt core.*          - coreスキーマのテーブル一覧"
echo "  \\dt hr.*            - hrスキーマのテーブル一覧"
echo "  \\d core.stores      - storesテーブルの構造"
echo "  \\x                  - 拡張表示モード切り替え"
echo "  \\q                  - 終了"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# psqlで接続
psql
