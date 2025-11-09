# データベースセットアップ

このディレクトリには、データベースのスキーマ定義とセットアップスクリプトが含まれています。

## ディレクトリ構造

```
database/
├── ddl/
│   └── schema.sql                    # DDL（スキーマ定義）
│
├── dml/
│   ├── 01_core_master.sql            # coreスキーママスターデータ
│   ├── 02_hr_master.sql              # hrスキーママスターデータ
│   └── 03_ops_master.sql             # opsスキーママスターデータ
│
└── setup/
    ├── setup.mjs                     # メインセットアップスクリプト
    ├── setup_tenant3_test_data.mjs   # Tenant3シフトデータ登録
    └── README.md                     # このファイル
```

## セットアップ方法

### 前提条件

- PostgreSQL 15+がインストールされていること
- `backend/.env`にDATABASE_URLが設定されていること

### 開発環境セットアップ

最小限のマスターデータのみ登録します。

```bash
cd scripts/database/setup
node setup.mjs --env dev
```

**実行内容:**
1. DDL: `schema.sql` - 全テーブル作成
2. DML: `01_core_master.sql` - coreスキーママスター
3. DML: `02_hr_master.sql` - hrスキーママスター
4. DML: `03_ops_master.sql` - opsスキーママスター

### デモ環境セットアップ

マスターデータ + Tenant3の充実したシフトデータを登録します。

```bash
cd scripts/database/setup
node setup.mjs --env demo
```

**実行内容:**
1. DDL: `schema.sql`
2. DML: 01, 02, 03_master.sql
3. Script: `setup_tenant3_test_data.mjs` - 51名のスタッフ + 3077件のシフト登録

## ファイル詳細

### DDL

#### `ddl/schema.sql`

全てのテーブル定義が含まれています:
- Part 1: マスターテーブル定義
- Part 2: トランザクションテーブル定義
- Part 3: インデックスと制約
- Part 4: トリガー
- **Part 5: マイグレーション** (後から追加されたテーブル)
  - LINE連携テーブル
  - plan_typeカラム追加

### DML

#### `dml/01_core_master.sql` - coreスキーマ

- テナント (tenant_id=3, Stand Banh Mi)
- 事業部 (デフォルト部門)
- 雇用形態 (正社員、アルバイト)
- 役職 (アルバイト、社員)
- 店舗 (COME、Atelier、SHIBUYA、Stand Banh Mi、Stand Bo Bun)
- シフトパターン (早番、中番、遅番、通し)
- スキル (調理基礎、調理上級、接客、レジ、マネジメント)

#### `dml/02_hr_master.sql` - hrスキーマ

- 税率区分 (7段階の累進課税)
- 社会保険料率 (健康保険、厚生年金、雇用保険、労災保険)
- 通勤手当 (距離別5段階)
- スタッフ (簡易版: テストスタッフのみ)

#### `dml/03_ops_master.sql` - opsスキーマ

- 労働法制約 (7種類: 週間労働時間、日労働時間等)
- 労務管理ルール (5種類: 残業アラート、連続勤務等)
- 店舗制約 (各店舗の営業時間・最低人数)
- シフト検証ルール (6種類: 重複チェック、休憩時間等)
- シフト種別 (通常、早番、遅番、中番)

### セットアップスクリプト

#### `setup/setup.mjs`

メインセットアップスクリプト。環境に応じてDDL/DMLを順番に実行します。

**オプション:**
- `--env dev` - 開発環境
- `--env demo` - デモ環境
- `--help` - ヘルプ表示

#### `setup/setup_tenant3_test_data.mjs`

Tenant3（Stand Banh Mi）の充実したテストデータを登録します:
- 51名のスタッフ（CSVから抽出）
- 3077件のシフトデータ（CSV: `fixtures/shift_pdfs/csv_output/シフト.csv`）

**使い方:**
```bash
# setup.mjs --env demoの中で自動実行されます

# または単独で実行:
node setup_tenant3_test_data.mjs register
node setup_tenant3_test_data.mjs delete  # データ削除
```

## トラブルシューティング

### データベース接続エラー

```
Error: connect ECONNREFUSED
```

**解決方法:**
1. `backend/.env`のDATABASE_URLを確認
2. PostgreSQLが起動しているか確認

### 既存データとの競合

```
ERROR: duplicate key value violates unique constraint
```

**解決方法:**

既存データを削除してから再実行:

```bash
# Tenant3のデータを削除
node setup_tenant3_test_data.mjs delete

# 再度セットアップ
node setup.mjs --env dev
```

### SQL構文エラー

```
ERROR: syntax error at or near
```

**解決方法:**
1. PostgreSQLのバージョンを確認 (15+推奨)
2. SQLファイルの文法を確認

## データ修正が必要な場合

### マスターデータを修正したい

1. 該当するSQLファイルを編集:
   - `dml/01_core_master.sql` - coreスキーマ
   - `dml/02_hr_master.sql` - hrスキーマ
   - `dml/03_ops_master.sql` - opsスキーマ

2. データベースを再セットアップ:
   ```bash
   node setup.mjs --env dev
   ```

### スキーマを変更したい

1. `ddl/schema.sql`を編集
2. 再セットアップ:
   ```bash
   node setup.mjs --env dev
   ```

## 参照ファイル

セットアップスクリプトが参照する外部ファイル:

1. **backend/.env** - データベース接続文字列 (DATABASE_URL)
2. **fixtures/shift_pdfs/csv_output/シフト.csv** - シフトデータ (3077件)

これらのファイルが存在しない場合、エラーになります。

## 注意事項

- **Tenant ID = 3で固定**: 全てのマスターデータはtenant_id=3で登録されます
- **本番環境では実行しないこと**: このスクリプトはテスト/開発環境専用です
- **データ削除機能**: `setup_tenant3_test_data.mjs delete`で削除できますが、本番では使用しないでください
