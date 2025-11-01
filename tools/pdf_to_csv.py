#!/usr/bin/env python3
"""
すべてのシフトPDFを変換して1つのCSVファイルにまとめるスクリプト
サブディレクトリ内のPDFファイルも再帰的に処理
"""

import pdfplumber
import csv
import re
from pathlib import Path
import sys
import unicodedata


def normalize_staff_name(name):
    """
    スタッフ名を正規化して重複を防ぐ
    - Unicode正規化（NFKC）で異体字を統一
    - 「（社員）」「(社員)」を削除
    - 前後の空白を削除
    """
    if not name:
        return ""

    # Unicode正規化（NFKC: 互換文字を標準形に変換）
    normalized = unicodedata.normalize('NFKC', name)

    # 「（社員）」「(社員)」を削除
    normalized = normalized.replace('（社員）', '').replace('(社員)', '')
    normalized = normalized.replace('社員', '')  # 括弧なしの「社員」も削除

    # 前後の空白を削除
    normalized = normalized.strip()

    return normalized


def pdf_to_data_rows(pdf_path):
    """
    PDFから行データを抽出
    """
    rows = []

    try:
        with pdfplumber.open(pdf_path) as pdf:
            # 最初のページを処理
            first_page = pdf.pages[0]
            text = first_page.extract_text()

            if not text:
                print(f"  ⚠️  Warning: Could not extract text from {pdf_path.name}")
                return rows

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

            # テーブルとして抽出を試みる
            tables = first_page.extract_tables()

            if not tables:
                return rows

            # テーブルが見つかった場合
            for table in tables:
                if not table:
                    continue

                # ヘッダー行（スタッフ名）
                header_row = table[0] if table else []
                staff_names = []

                # 不要な列名をスキップ（店舗名や勤務地名を含む）
                skip_keywords = ['日付', '自由ヶ丘', '自由が丘', '祐天寺', '学大', '学⼤', '麻布台', '⿇布台', '渋谷', '渋⾕',
                                'のシフト', 'L\'Atelier', 'Stand', 'Banh', 'Mi', 'COME', 'SHIBUYA', 'Bo', 'Bun']

                for cell in header_row:
                    if cell and cell.strip():
                        # スキップ対象かチェック
                        should_skip = any(keyword in cell for keyword in skip_keywords)
                        if should_skip:
                            continue

                        # 社員区分を判定（正規化前の元データで判定）
                        is_employee = '(社員)' in cell or '社員' in cell or '（社員）' in cell

                        # 名前を正規化
                        name = normalize_staff_name(cell)

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
                    full_date = f"{plan_year}-{month.zfill(2)}-{day.zfill(2)}"

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

                                rows.append({
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

    except Exception as e:
        print(f"  ❌ Error processing {pdf_path.name}: {str(e)}")

    return rows


def convert_all_pdfs_to_single_csv(pdf_root_dir, output_csv):
    """
    指定ディレクトリ配下のすべてのPDFを1つのCSVにまとめる
    """
    pdf_root = Path(pdf_root_dir)

    if not pdf_root.exists():
        print(f"Error: Directory not found: {pdf_root_dir}")
        return False

    # すべてのPDFファイルを再帰的に取得
    pdf_files = sorted(pdf_root.rglob("*.pdf"))

    if not pdf_files:
        print(f"No PDF files found in {pdf_root_dir}")
        return False

    print(f"\n{'='*60}")
    print(f"🔄 PDF→CSV一括変換＆統合スクリプト")
    print(f"{'='*60}\n")
    print(f"入力ディレクトリ: {pdf_root}")
    print(f"出力CSVファイル: {output_csv}")
    print(f"検出PDFファイル数: {len(pdf_files)}\n")

    # 統合用のデータ
    all_rows = []

    for pdf_file in pdf_files:
        # 相対パスを表示
        rel_path = pdf_file.relative_to(pdf_root)
        print(f"処理中: {rel_path}")

        # PDFからデータを抽出
        rows = pdf_to_data_rows(pdf_file)
        all_rows.extend(rows)

        print(f"  ✅ {len(rows)} シフト抽出")

    # CSVファイルに書き込み
    output_path = Path(output_csv)
    fieldnames = [
        'tenant_code', 'store_name', 'plan_year', 'plan_month',
        'shift_date', 'staff_name', 'employment_type', 'work_location',
        'start_time', 'end_time', 'break_minutes', 'notes'
    ]

    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_rows)

    print(f"\n{'='*60}")
    print(f"✅ 変換・統合完了！")
    print(f"{'='*60}\n")
    print(f"出力ファイル: {output_path}")
    print(f"総シフト件数: {len(all_rows):,} 件\n")

    # 統計情報を表示
    print("📊 統計情報:")

    # 店舗別集計
    store_counts = {}
    for row in all_rows:
        store = row['store_name']
        store_counts[store] = store_counts.get(store, 0) + 1

    print("\n  店舗別シフト件数:")
    for store, count in sorted(store_counts.items()):
        print(f"    {store}: {count:,} 件")

    # 年月別集計
    period_counts = {}
    for row in all_rows:
        period = f"{row['plan_year']}-{row['plan_month'].zfill(2)}"
        period_counts[period] = period_counts.get(period, 0) + 1

    print("\n  年月別シフト件数:")
    for period, count in sorted(period_counts.items()):
        print(f"    {period}: {count:,} 件")

    # 雇用形態別集計
    employment_counts = {}
    for row in all_rows:
        emp_type = row['employment_type']
        employment_counts[emp_type] = employment_counts.get(emp_type, 0) + 1

    print("\n  雇用形態別シフト件数:")
    for emp_type, count in sorted(employment_counts.items()):
        print(f"    {emp_type}: {count:,} 件")

    print(f"\n{'='*60}\n")

    return True


if __name__ == "__main__":
    # デフォルトのディレクトリとファイル名
    default_pdf_dir = Path(__file__).parent.parent / "fixtures" / "shift_pdfs" / "pdf_output"
    default_csv_output = Path(__file__).parent.parent / "fixtures" / "shift_pdfs" / "csv_output" / "シフト.csv"

    pdf_dir = sys.argv[1] if len(sys.argv) > 1 else default_pdf_dir
    csv_output = sys.argv[2] if len(sys.argv) > 2 else default_csv_output

    if convert_all_pdfs_to_single_csv(pdf_dir, csv_output):
        print("✅ 処理が正常に完了しました。")
        print(f"\n📁 出力ファイル:")
        print(f"  {csv_output}\n")
    else:
        print("❌ 処理に失敗しました。")
        sys.exit(1)
