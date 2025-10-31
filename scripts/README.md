# スクリプトディレクトリ構成

このディレクトリは、用途別に3つのサブディレクトリに分かれています。

## 📁 ディレクトリ構造

```
scripts/
├── setup/          # 🚀 イニシャルセットアップ用（必須・Gitコミット対象）
├── dev/            # 🔧 開発・デバッグ用ツール（Gitコミット対象）
├── legacy/         # 📦 過去の資産・参考用（Gitコミット非推奨）
└── README.md       # このファイル
```

---

## 🚀 setup/ - イニシャルセットアップ（必須）

新規開発者がリポジトリをクローンして最初に実行するスクリプト群です。

### DDL/DML
- **`schema.sql`** - 全30テーブルのDDL定義（マスター17 + トランザクション13）
- **`seed_data.sql`** - マスターデータシードデータ（テナント、Division、店舗、役職、スキル、雇用形態、シフトパターンなど）
- **`seed_transaction_data.sql`** - トランザクションデータシードデータ（4,911件：シフト、需要予測、給与など）

### セットアップスクリプト
- **`setup_fresh_db.mjs`** - データベース完全セットアップ（drop → schema.sql → seed_data.sql）
- **`import_all_17_masters.mjs`** - 全15個のマスターCSVファイルをDBに投入
- **`verify_setup.mjs`** - データベースセットアップの検証

### 使い方

```bash
# 環境変数設定
export DATABASE_URL="postgresql://user:password@host:port/database"

# 1. データベース完全セットアップ（DDL + マスターデータ）
node scripts/setup/setup_fresh_db.mjs

# 2. 詳細マスターデータ投入（CSVファイル）
node scripts/setup/import_all_17_masters.mjs

# 3. トランザクションデータ投入（オプション）
psql $DATABASE_URL -f scripts/setup/seed_transaction_data.sql

# 4. セットアップ検証
node scripts/setup/verify_setup.mjs
```

---

## 🔧 dev/ - 開発・デバッグ用ツール

開発中にデータ確認やデバッグで使用する便利ツール群です。

### データ確認
- **`check_staff.mjs`** - スタッフマスター一覧表示
- **`check_schema_match.mjs`** - 実際のDBスキーマとDDLの整合性チェック
- **`test_db_connection.mjs`** - データベース接続テスト

### データ操作
- **`drop_all.sql`** - データベース完全クリア用SQL
- **`import_all_csv_to_db.mjs`** - 全CSVデータ（10テーブル）をDBに投入
- **`cleanup_all_transaction_data.mjs`** - トランザクションデータ全削除
- **`import_all_shifts.mjs`** - シフト.csvの全データをops.shiftsテーブルに投入
- **`import_shift_sample.mjs`** - シフトサンプルデータ投入
- **`import_shifts_100.mjs`** - シフト100件投入
- **`test_transactions_setup.mjs`** - トランザクションテーブルセットアップテスト

### DML生成
- **`export_transaction_dml_from_db.mjs`** - データベースからトランザクションDML生成
- **`generate_transaction_dml_file.mjs`** - CSVファイルからトランザクションDML生成（参考用）

### ユーティリティ
- **`db_query.mjs`** - 汎用データベースクエリ実行ツール
- **`db_cli.sh`** - データベースCLI接続スクリプト

### PDF/CSV変換
- **`pdf_to_csv.py`** - PDFからCSV変換
- **`batch_pdf_to_csv.py`** - PDFバッチ変換

### 使い方

```bash
# スタッフマスター確認
DATABASE_URL="..." node scripts/dev/check_staff.mjs

# スキーマ整合性チェック
DATABASE_URL="..." node scripts/dev/check_schema_match.mjs

# データベース接続テスト
DATABASE_URL="..." node scripts/dev/test_db_connection.mjs
```

---

## 📦 legacy/ - 過去の資産・参考用

古いスクリプトや使用しなくなったファイル群です。削除候補ですが、参考用に保持しています。

### 内容
- `setup_database.mjs` - 旧セットアップスクリプト
- `schema_generated.sql` - 実際のDBから自動生成したスキーマ（制約なし）
- `drop_transaction_tables.sql` - トランザクションテーブル削除SQL
- `drop_extra_masters.mjs` - 不要マスター削除スクリプト
- `transactions.sql` - トランザクションテーブルDDL（未使用）
- `setup_all.sh` - 旧セットアップシェルスクリプト
- `setup_multitenant.sh` - 旧マルチテナントセットアップ
- その他

**注意**: このディレクトリのファイルは今後削除される可能性があります。

---

## 📊 データベース構成（17マスターテーブル）

### core スキーマ (7テーブル)
1. `tenants` - テナント
2. `divisions` - 部門・エリア
3. `stores` - 店舗
4. `roles` - 役職
5. `skills` - スキル
6. `employment_types` - 雇用形態
7. `shift_patterns` - シフトパターン

### hr スキーマ (6テーブル)
1. `staff` - スタッフ
2. `staff_skills` - スタッフスキル
3. `staff_certifications` - スタッフ資格
4. `commute_allowance` - 通勤手当
5. `insurance_rates` - 保険料率
6. `tax_brackets` - 税率

### ops スキーマ (4テーブル)
1. `labor_law_constraints` - 労働基準法制約
2. `labor_management_rules` - 労務管理ルール
3. `shift_validation_rules` - シフト検証ルール
4. `store_constraints` - 店舗制約

---

## 🎯 スクリプト作成時のルール

新しいスクリプトを作成する場合は、以下のルールに従ってください：

### setup/ に入れるべきもの
- 初回セットアップで**絶対に必要**なスクリプト
- DDL/DML（schema.sql, seed_data.sql）
- 新規開発者が最初に実行するスクリプト

### dev/ に入れるべきもの
- 開発中に**便利だが必須ではない**ツール
- データ確認・デバッグスクリプト
- テスト用データ投入スクリプト
- PDF/CSV変換などのユーティリティ

### legacy/ に入れるべきもの
- **使用しなくなった**古いスクリプト
- 参考用に残しておきたいファイル
- 将来削除される可能性があるもの

---

## ⚠️ 注意事項

1. **setup/** のスクリプトは本番環境でも使用されるため、慎重に変更してください
2. **dev/** のスクリプトは自由に作成・変更可能ですが、setup/ のスクリプトに依存させないでください
3. **legacy/** のファイルは新規開発では使用しないでください
4. 新しいスクリプトを作成した際は、このREADME.mdも更新してください
