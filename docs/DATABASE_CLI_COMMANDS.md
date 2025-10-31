# データベースCLIコマンド

ターミナルからデータベースにクエリを実行するためのコマンド集です。

## 🚀 クイックスタート

```bash
# データ件数サマリー
npm run db:summary

# スタッフ一覧
npm run db:staff

# 全テーブル一覧
npm run db:tables

# レコード数確認
npm run db:count
```

## 📋 利用可能なコマンド一覧

### npm scriptsで実行

| コマンド | 説明 | 実行内容 |
|---------|------|---------|
| `npm run db:summary` | データ件数サマリー | 全テーブルのレコード数を表示 |
| `npm run db:staff` | スタッフ詳細 | スタッフ一覧（役職・給与付き）|
| `npm run db:tables` | テーブル一覧 | 全スキーマのテーブル一覧 |
| `npm run db:count` | レコード数 | テーブル別レコード数 |
| `npm run db:verify` | データ検証 | 投入データの詳細検証 |
| `npm run db:insert` | データ投入 | CSVからDMLを生成して投入 |

### 直接実行

```bash
# ヘルプ表示
node scripts/db_query.mjs

# 特定のクエリ実行
node scripts/db_query.mjs [command]
```

## 🔍 クエリ一覧

### 1. tables - 全テーブル一覧
```bash
node scripts/db_query.mjs tables
# または
npm run db:tables
```

**出力例:**
```
┌─────────┬──────────────┬─────────────────────┐
│ (index) │ table_schema │ table_name          │
├─────────┼──────────────┼─────────────────────┤
│ 0       │ 'core'       │ 'divisions'         │
│ 1       │ 'core'       │ 'roles'             │
│ 2       │ 'core'       │ 'shift_patterns'    │
│ 3       │ 'core'       │ 'skills'            │
│ 4       │ 'core'       │ 'stores'            │
│ 5       │ 'core'       │ 'tenants'           │
│ 6       │ 'hr'         │ 'staff'             │
└─────────┴──────────────┴─────────────────────┘
```

### 2. tenants - テナント一覧
```bash
node scripts/db_query.mjs tenants
```

### 3. stores - 店舗一覧
```bash
node scripts/db_query.mjs stores
```

**出力例:**
```
┌─────────┬──────────┬─────────────┬───────────────────────┬──────────────────────────────┬───────────────┬─────────────┐
│ (index) │ store_id │ store_code  │ store_name            │ address                      │ division_name │ hours       │
├─────────┼──────────┼─────────────┼───────────────────────┼──────────────────────────────┼───────────────┼─────────────┤
│ 0       │ 1        │ 'STORE001'  │ 'カフェ・ドゥ・渋谷' │ '東京都渋谷区道玄坂1-2-3'    │ '東京エリア'  │ '09:00 - 22:00' │
└─────────┴──────────┴─────────────┴───────────────────────┴──────────────────────────────┴───────────────┴─────────────┘
```

### 4. staff - スタッフ一覧（基本）
```bash
node scripts/db_query.mjs staff
```

### 5. staff-detail - スタッフ詳細
```bash
node scripts/db_query.mjs staff-detail
# または
npm run db:staff
```

**出力例:**
```
┌─────────┬────────────┬──────────────┬────────────────┬─────────────────┬───────────────────┐
│ (index) │ staff_code │ name         │ role_name      │ employment_type │ salary            │
├─────────┼────────────┼──────────────┼────────────────┼─────────────────┼───────────────────┤
│ 0       │ 'S001'     │ '田中太郎'   │ 'リーダー'     │ 'MONTHLY'       │ '月給 ¥350000.00' │
│ 1       │ 'S002'     │ '佐藤花子'   │ 'リーダー'     │ 'MONTHLY'       │ '月給 ¥280000.00' │
│ 2       │ 'S003'     │ '鈴木次郎'   │ '一般スタッフ' │ 'HOURLY'        │ '時給 ¥1100.00'   │
└─────────┴────────────┴──────────────┴────────────────┴─────────────────┴───────────────────┘
```

### 6. roles - 役職一覧
```bash
node scripts/db_query.mjs roles
```

### 7. skills - スキル一覧
```bash
node scripts/db_query.mjs skills
```

### 8. patterns - シフトパターン一覧
```bash
node scripts/db_query.mjs patterns
```

**出力例:**
```
┌─────────┬──────────────┬──────────────┬────────────┬──────────┬───────────────┬────────────┐
│ (index) │ pattern_code │ pattern_name │ start_time │ end_time │ break_minutes │ work_hours │
├─────────┼──────────────┼──────────────┼────────────┼──────────┼───────────────┼────────────┤
│ 0       │ 'EARLY'      │ '早番'       │ '09:00:00' │ '17:00:00' │ 60          │ '7.00'     │
│ 1       │ 'MID'        │ '中番'       │ '13:00:00' │ '21:00:00' │ 60          │ '7.00'     │
│ 2       │ 'LATE'       │ '遅番'       │ '17:00:00' │ '22:00:00' │ 0           │ '5.00'     │
└─────────┴──────────────┴──────────────┴────────────┴──────────┴───────────────┴────────────┘
```

### 9. summary - データ件数サマリー
```bash
node scripts/db_query.mjs summary
# または
npm run db:summary
```

**出力例:**
```
┌─────────┬─────────┬───────────┬────────┬───────┬────────┬────────────────┬───────┐
│ (index) │ tenants │ divisions │ stores │ roles │ skills │ shift_patterns │ staff │
├─────────┼─────────┼───────────┼────────┼───────┼────────┼────────────────┼───────┤
│ 0       │ '1'     │ '1'       │ '1'    │ '4'   │ '4'    │ '6'            │ '10'  │
└─────────┴─────────┴───────────┴────────┴───────┴────────┴────────────────┴───────┘
```

### 10. count - 全テーブルレコード数
```bash
node scripts/db_query.mjs count
# または
npm run db:count
```

### 11. salary - 人件費サマリー
```bash
node scripts/db_query.mjs salary
```

**出力例:**
```
┌─────────┬─────────────────┬─────────────┬────────────────────────┬──────────────┐
│ (index) │ employment_type │ staff_count │ total_monthly_cost     │ average      │
├─────────┼─────────────────┼─────────────┼────────────────────────┼──────────────┤
│ 0       │ 'MONTHLY'       │ '3'         │ '¥950,000'             │ '¥316,667'   │
│ 1       │ 'HOURLY'        │ '7'         │ '¥750,400 (想定)'      │ '¥1,064'     │
└─────────┴─────────────────┴─────────────┴────────────────────────┴──────────────┘
```

## 🛠️ カスタムクエリの実行

### 方法1: Node.jsスクリプト経由

`scripts/db_query.mjs` にクエリを追加することで、新しいコマンドを追加できます。

```javascript
const QUERIES = {
  // ... 既存のクエリ

  'your-query': {
    name: '🔍 カスタムクエリ',
    sql: `
      SELECT * FROM your_table
      WHERE condition = true;
    `
  }
};
```

### 方法2: 直接SQLを実行

一時的なクエリを実行したい場合は、新しいスクリプトを作成：

```javascript
import pg from 'pg';
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL
});

await client.connect();
const result = await client.query('SELECT * FROM core.stores');
console.table(result.rows);
await client.end();
```

## 📝 サンプルクエリ集

詳細なサンプルクエリは [`docs/SAMPLE_QUERIES.md`](./SAMPLE_QUERIES.md) を参照してください。

- 集計・分析クエリ
- 結合クエリ
- 日付・期間関連クエリ
- 実務的なクエリ
- データ品質チェック

## 🔧 トラブルシューティング

### エラー: "connect ECONNREFUSED"

データベース接続情報が正しいか確認してください。

```bash
# 環境変数の確認
echo $DATABASE_URL

# .envファイルの確認
cat .env
```

### エラー: "permission denied"

スクリプトに実行権限を付与してください。

```bash
chmod +x scripts/db_query.mjs
chmod +x scripts/db_cli.sh
```

### データが表示されない

データが投入されているか確認してください。

```bash
npm run db:summary
npm run db:verify
```

データがない場合は、投入スクリプトを実行：

```bash
npm run db:insert
```

## 🎯 よく使うコマンド

```bash
# 1. データ全体の確認
npm run db:summary

# 2. スタッフ情報の確認
npm run db:staff

# 3. テーブル一覧
npm run db:tables

# 4. レコード数確認
npm run db:count

# 5. 詳細な検証
npm run db:verify
```

## 🌐 GUIツールとの併用

これらのCLIコマンドは、GUIツール（TablePlus、DBeaver、pgAdminなど）と併用できます。

**GUIツール接続情報:**
- Host: `mainline.proxy.rlwy.net`
- Port: `50142`
- Database: `railway`
- User: `postgres`
- Password: (`.env` ファイル参照)

詳細は [`docs/DATABASE_CONNECTION.md`](./DATABASE_CONNECTION.md) を参照してください。
