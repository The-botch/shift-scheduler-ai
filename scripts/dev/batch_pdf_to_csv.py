#!/usr/bin/env python3
"""
すべてのシフトPDFを一括でCSVに変換するスクリプト
"""

import pdfplumber
import csv
import re
from pathlib import Path
from datetime import datetime


def pdf_to_csv(pdf_path, output_csv_path):
    """
    PDFをCSVに変換
    """
    print(f"Processing: {pdf_path.name}")

    try:
        with pdfplumber.open(pdf_path) as pdf:
            # 最初のページを処理
            first_page = pdf.pages[0]
            text = first_page.extract_text()

            if not text:
                print(f"  ⚠️  Error: Could not extract text from {pdf_path.name}")
                return False

            # PDFファイル名から店舗情報と年月を抽出
            filename = pdf_path.stem
            # 例: シフト表_20251001-20251031_Stand+Banh+Mi
            # または: 改3シフト表_20251001-20251031_Atelier
            parts = filename.split('_')
            if len(parts) >= 3:
                date_range = parts[1]  # 20251001-20251031
                store_name_raw = parts[2].replace('+', ' ')  # Stand Banh Mi

                # 年月を抽出
                year_month_start = date_range.split('-')[0][:6]  # 202510
                plan_year = year_month_start[:4]  # 2025
                plan_month = year_month_start[4:6]  # 10
            else:
                plan_year = "2025"
                plan_month = "10"
                store_name_raw = "Unknown"

            # CSVファイルを書き込み（データベーススキーマ対応版）
            with open(output_csv_path, 'w', newline='', encoding='utf-8') as csvfile:
                fieldnames = [
                    'tenant_code',      # テナントコード（後でマッピング）
                    'store_name',       # 店舗名（PDFファイル名から）
                    'plan_year',        # 計画年
                    'plan_month',       # 計画月
                    'shift_date',       # シフト日付（YYYY-MM-DD）
                    'staff_name',       # スタッフ名
                    'employment_type',  # 雇用形態（社員/アルバイト）
                    'work_location',    # 勤務場所（他店舗の場合）
                    'start_time',       # 開始時刻（HH:MM）
                    'end_time',         # 終了時刻（HH:MM）
                    'break_minutes',    # 休憩時間（分）
                    'notes'             # 備考
                ]
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()

                # テーブルとして抽出を試みる
                tables = first_page.extract_tables()

                if not tables:
                    print(f"  ⚠️  Warning: No tables found in {pdf_path.name}")
                    return False

                row_count = 0

                # テーブルが見つかった場合
                for table in tables:
                    if not table:
                        continue

                    # ヘッダー行（スタッフ名）
                    header_row = table[0] if table else []
                    staff_names = []

                    # 不要な列名をスキップ
                    skip_keywords = ['日付', '自由ヶ丘', '自由が丘', 'のシフト', 'L\'Atelier', 'Stand', 'Banh', 'Mi', 'COME', 'SHIBUYA', 'Bo', 'Bun']

                    for cell in header_row:
                        if cell and cell.strip():
                            # スキップ対象かチェック
                            should_skip = any(keyword in cell for keyword in skip_keywords)
                            if should_skip:
                                continue

                            # 社員区分を判定
                            is_employee = '(社員)' in cell or '社員' in cell
                            name = cell.replace('(社員)', '').strip()
                            if name and name not in ['日付 / 日', '']:
                                staff_names.append({
                                    'name': name,
                                    'is_employee': '社員' if is_employee else 'アルバイト'
                                })

                    # データ行を処理
                    for row in table[1:]:
                        if not row or len(row) < 2:
                            continue

                        # 日付セルを解析
                        date_cell = row[0]
                        if not date_cell:
                            continue

                        date_match = re.match(r'(\d+/\d+)\s*\(([^\)]+)\)', str(date_cell))
                        if not date_match:
                            continue

                        date_str = date_match.group(1)
                        weekday = date_match.group(2)

                        # 日付をフォーマット (2025-10-01 形式)
                        month, day = date_str.split('/')
                        full_date = f"2025-{month.zfill(2)}-{day.zfill(2)}"

                        # 各スタッフのシフトセルを処理
                        for i, cell in enumerate(row[1:], start=0):
                            if i >= len(staff_names):
                                break

                            if not cell or cell.strip() in ['/', '-', '']:
                                continue

                            staff = staff_names[i]
                            cell_text = str(cell).strip()

                            # 時間パターンを抽出
                            time_pattern = r'(\d{1,2}:\d{2})〜(\d{1,2}:\d{2})'
                            time_matches = re.findall(time_pattern, cell_text)

                            if time_matches:
                                for start_time, end_time in time_matches:
                                    # 勤務場所を抽出（時間の前にある文字列）
                                    location_match = re.search(r'([^\d:]+)(?=\d{1,2}:\d{2})', cell_text)
                                    location = location_match.group(1).strip() if location_match else ""

                                    # 雇用形態を英語化
                                    employment_type_en = 'MONTHLY' if staff['is_employee'] == '社員' else 'HOURLY'

                                    # 休憩時間を計算（デフォルト60分、5時間以下なら0分）
                                    # 時間を分に変換
                                    start_parts = start_time.split(':')
                                    end_parts = end_time.split(':')
                                    start_minutes = int(start_parts[0]) * 60 + int(start_parts[1])
                                    end_minutes = int(end_parts[0]) * 60 + int(end_parts[1])

                                    # 終了時刻が翌日にまたがる場合（例: 27:00）
                                    if end_minutes < start_minutes:
                                        end_minutes += 24 * 60

                                    work_duration_minutes = end_minutes - start_minutes

                                    # 5時間（300分）以下なら休憩なし、超える場合は60分休憩
                                    break_mins = 0 if work_duration_minutes <= 300 else 60

                                    writer.writerow({
                                        'tenant_code': 'STAND_BANH_MI',  # 固定値（後で調整可能）
                                        'store_name': store_name_raw,
                                        'plan_year': plan_year,
                                        'plan_month': plan_month,
                                        'shift_date': full_date,
                                        'staff_name': staff['name'],
                                        'employment_type': employment_type_en,
                                        'work_location': location,
                                        'start_time': start_time,
                                        'end_time': end_time,
                                        'break_minutes': break_mins,
                                        'notes': ''
                                    })
                                    row_count += 1

                print(f"  ✅ CSV created: {output_csv_path.name} ({row_count} shifts)")
                return True

    except Exception as e:
        print(f"  ❌ Error processing {pdf_path.name}: {str(e)}")
        return False


def batch_convert_pdfs(input_dir, output_dir=None):
    """
    指定ディレクトリ内のすべてのPDFをCSVに変換
    """
    input_path = Path(input_dir)

    if not input_path.exists():
        print(f"Error: Directory not found: {input_dir}")
        return

    # 出力ディレクトリ
    if output_dir:
        output_path = Path(output_dir)
    else:
        output_path = input_path / "csv_output"

    # 出力ディレクトリを作成
    output_path.mkdir(exist_ok=True)

    # すべてのPDFファイルを取得
    pdf_files = sorted(input_path.glob("*.pdf"))

    if not pdf_files:
        print(f"No PDF files found in {input_dir}")
        return

    print(f"\n{'='*60}")
    print(f"Found {len(pdf_files)} PDF files")
    print(f"Output directory: {output_path}")
    print(f"{'='*60}\n")

    success_count = 0
    fail_count = 0

    for pdf_file in pdf_files:
        # 出力ファイル名を生成
        csv_filename = pdf_file.stem + ".csv"
        csv_path = output_path / csv_filename

        # 変換実行
        if pdf_to_csv(pdf_file, csv_path):
            success_count += 1
        else:
            fail_count += 1

    print(f"\n{'='*60}")
    print(f"Conversion completed!")
    print(f"  ✅ Success: {success_count} files")
    if fail_count > 0:
        print(f"  ❌ Failed:  {fail_count} files")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    # デフォルトのディレクトリ
    default_input = Path(__file__).parent.parent / "fixtures" / "shift_pdfs"

    print("🔄 Batch PDF to CSV Converter")
    print("=" * 60)

    batch_convert_pdfs(default_input)
