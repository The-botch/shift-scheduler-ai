# シフトPDF→CSV変換ツール

シフト表のPDFファイルを解析して、データベースに取り込める形式のCSVファイルに変換するツールです。

## 機能

- PDFファイルから自動でシフトデータを抽出
- 複数のPDFファイルを1つのCSVファイルに統合
- サブディレクトリを再帰的に検索して処理
- データベーススキーマに対応したCSVフォーマットで出力

## セットアップ

### 1. 仮想環境の作成（初回のみ）

```bash
cd /path/to/shift-scheduler-ai
python3 -m venv venv
```

### 2. 仮想環境の有効化

```bash
source venv/bin/activate
```

### 3. 依存パッケージのインストール

```bash
pip install -r tools/requirements.txt
```

## 使い方

### 基本的な使い方

デフォルト設定で実行（`fixtures/shift_pdfs/pdf_output/` 配下のすべてのPDFを変換）:

```bash
python tools/pdf_to_csv.py
```

### カスタムディレクトリを指定

```bash
python tools/pdf_to_csv.py <PDFディレクトリ> <出力CSVファイル>
```

**例:**
```bash
python tools/pdf_to_csv.py ./pdf_files ./output/シフト.csv
```

## 入力ファイル形式

### PDFファイルの配置

PDFファイルは以下のいずれかの構造で配置できます:

**パターン1: フラット構造**
```
pdf_output/
  ├── シフト表_20251001-20251031_Stand+Banh+Mi.pdf
  ├── シフト表_20251001-20251031_Stand+Bo+Bun.pdf
  └── ...
```

**パターン2: 月別サブディレクトリ（推奨）**
```
pdf_output/
  ├── 2025_07/
  │   ├── シフト表_20250701-20250731_COME.pdf
  │   └── ...
  ├── 2025_08/
  │   ├── シフト表_20250801-20250831_COME.pdf
  │   └── ...
  └── ...
```

### PDFファイル名の形式

ファイル名から店舗名と期間を自動抽出します:

```
[改/改2/改3]シフト表_YYYYMMDD-YYYYMMDD_店舗名.pdf
```

**例:**
- `シフト表_20251001-20251031_Stand+Banh+Mi.pdf`
- `改シフト表_20251001-20251031_COME.pdf`
- `改3シフト表_20251001-20251031_Atelier.pdf`

## 出力CSVフォーマット

出力されるCSVファイルは以下の形式です（データベーススキーマに対応）:

| 列名 | 説明 | 例 |
|------|------|-----|
| tenant_code | テナントコード | STAND_BANH_MI |
| store_name | 店舗名 | Atelier |
| plan_year | 計画年 | 2025 |
| plan_month | 計画月 | 10 |
| shift_date | シフト日付 | 2025-10-01 |
| staff_name | スタッフ名 | 武根 太一 |
| employment_type | 雇用形態 | MONTHLY / HOURLY |
| work_location | 勤務場所 | 自由が丘 |
| start_time | 開始時刻 | 09:00 |
| end_time | 終了時刻 | 23:30 |
| break_minutes | 休憩時間（分） | 60 |
| notes | 備考 | |

### サンプル出力

```csv
tenant_code,store_name,plan_year,plan_month,shift_date,staff_name,employment_type,work_location,start_time,end_time,break_minutes,notes
STAND_BANH_MI,Atelier,2025,10,2025-10-01,武根 太一,MONTHLY,自由が丘,9:00,23:30,60,
STAND_BANH_MI,Atelier,2025,10,2025-10-01,サー,MONTHLY,,9:00,23:30,60,
STAND_BANH_MI,Atelier,2025,10,2025-10-01,秋元梢,MONTHLY,渋谷,9:00,23:30,60,
```

## 処理内容

### 1. PDFからのデータ抽出

- テーブル構造を自動認識
- ヘッダー行からスタッフ名と社員区分を抽出
- 各セルから日付、勤務時間、勤務場所を抽出

### 2. データ変換

- **雇用形態**: 「社員」→ `MONTHLY`、「アルバイト」→ `HOURLY`
- **日付**: `M/D` → `YYYY-MM-DD` 形式に変換
- **休憩時間**: 勤務時間5時間以下は0分、超える場合は60分として自動計算

### 3. CSV統合

- 複数のPDFファイルから抽出したデータを1つのCSVファイルに統合
- 店舗別、年月別に自動集計して統計情報を表示

## 出力例

```
============================================================
🔄 PDF→CSV一括変換＆統合スクリプト
============================================================

入力ディレクトリ: fixtures/shift_pdfs/pdf_output
出力CSVファイル: fixtures/shift_pdfs/csv_output/シフト.csv
検出PDFファイル数: 25

処理中: 2025_07/シフト表_20250701-20250731_COME.pdf
  ✅ 111 シフト抽出
処理中: 2025_07/シフト表_20250701-20250731_SHIBUYA.pdf
  ✅ 114 シフト抽出
...

============================================================
✅ 変換・統合完了！
============================================================

出力ファイル: fixtures/shift_pdfs/csv_output/シフト.csv
総シフト件数: 3,077 件

📊 統計情報:

  店舗別シフト件数:
    Atelier: 696 件
    COME: 590 件
    SHIBUYA: 800 件
    Stand Banh Mi: 696 件
    Stand Bo Bun: 295 件

  年月別シフト件数:
    2025-07: 542 件
    2025-08: 637 件
    2025-09: 583 件
    2025-10: 629 件
    2025-11: 686 件

  雇用形態別シフト件数:
    HOURLY: 1,674 件
    MONTHLY: 1,403 件
```

## トラブルシューティング

### PDFが読み込めない

- PDFファイルが破損していないか確認
- PDFファイル名が正しい形式か確認
- ファイルの読み取り権限があるか確認

### データが正しく抽出されない

- PDFのテーブル構造が想定と異なる可能性があります
- サンプルPDFで動作確認してから実行してください

### 文字化けが発生する

- 出力CSVの文字エンコーディングはUTF-8です
- Excelで開く場合は、インポート時に文字コードを指定してください

## データベースへのインポート

生成されたCSVファイルは、以下のテーブルにインポート可能です:

- `core.tenants` - テナント情報
- `core.stores` - 店舗情報
- `hr.staff` - スタッフ情報
- `ops.shift_plans` - シフト計画
- `ops.shifts` - シフトデータ

詳細は `/scripts/db/005_create_multitenant_schema.sql` を参照してください。

## 開発情報

### 依存パッケージ

- **pdfplumber**: PDFファイルからテキストとテーブルを抽出

### スクリプト構成

- `pdf_to_csv.py`: メインスクリプト
- `requirements.txt`: 依存パッケージリスト

## ライセンス

このツールはプロジェクト内部での利用を想定しています。

## 更新履歴

- **2025-10-31**: 初版リリース
  - PDFからCSVへの一括変換機能
  - サブディレクトリ対応
  - データベーススキーマ対応
