#!/usr/bin/env python3
"""
シフトPDFをCSVに変換するスクリプト
"""

import pdfplumber
import csv
import re
import sys
from pathlib import Path
from datetime import datetime


def extract_staff_info(header_text):
    """
    ヘッダーからスタッフ情報を抽出
    Returns: List of tuples (staff_name, is_employee)
    """
    staff_list = []
    # ヘッダー行からスタッフ名を抽出（社員）表記を含む
    staff_pattern = r'([^\s]+(?:\s+[^\s]+)?)\(社員\)|([^\s]+(?:\s+[^\s]+)?)'

    # 簡易的なパース（実際のPDFの構造に応じて調整が必要）
    parts = header_text.split()
    for i, part in enumerate(parts):
        if '社員' in part:
            name = part.replace('(社員)', '')
            staff_list.append((name, True))
        elif part not in ['自由ヶ丘', 'L\'Atelier', 'de', 'Stand', 'Banh', 'Mi', '年', '月', '日', 'のシフト']:
            # スタッフ名と思われるもの
            if i > 0 and not any(keyword in part for keyword in ['/', '〜', ':', '10']):
                staff_list.append((part, False))

    return staff_list


def parse_shift_line(line, date_str):
    """
    シフト行を解析してデータを抽出
    """
    shifts = []

    # 日付と曜日を抽出
    date_match = re.match(r'(\d+/\d+)\s*\(([^\)]+)\)', line)
    if not date_match:
        return shifts

    date = date_match.group(1)
    weekday = date_match.group(2)

    # 年を追加して完全な日付にする
    year = "2025"
    month_day = date.replace('/', '-')
    if len(month_day.split('-')[1]) == 1:
        month_day = month_day.split('-')[0] + '-0' + month_day.split('-')[1]
    if len(month_day.split('-')[0]) == 1:
        month_day = '0' + month_day
    full_date = f"{year}-{month_day}"

    # 残りの部分からシフト情報を抽出
    shift_part = line[date_match.end():]

    # パターン: 場所 + 時間 (例: 自由が丘9:00〜23:30)
    shift_pattern = r'([^0-9]+)?(\d{1,2}:\d{2})〜(\d{1,2}:\d{2})'

    for match in re.finditer(shift_pattern, shift_part):
        location = match.group(1).strip() if match.group(1) else ""
        start_time = match.group(2)
        end_time = match.group(3)

        shifts.append({
            'date': full_date,
            'weekday': weekday,
            'location': location,
            'start_time': start_time,
            'end_time': end_time
        })

    return shifts


def pdf_to_csv(pdf_path, output_csv_path):
    """
    PDFをCSVに変換
    """
    print(f"Processing: {pdf_path}")

    with pdfplumber.open(pdf_path) as pdf:
        # 最初のページを処理
        first_page = pdf.pages[0]
        text = first_page.extract_text()

        if not text:
            print("Error: Could not extract text from PDF")
            return

        lines = text.split('\n')

        # CSVファイルを書き込み
        with open(output_csv_path, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['日付', '曜日', 'スタッフ名', '社員区分', '勤務場所', '開始時刻', '終了時刻']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()

            # シンプルな実装: テーブルとして抽出を試みる
            tables = first_page.extract_tables()

            if tables:
                # テーブルが見つかった場合
                for table in tables:
                    if not table:
                        continue

                    # ヘッダー行（スタッフ名）
                    header_row = table[0] if table else []
                    staff_names = []

                    # 不要な列名をスキップ
                    skip_keywords = ['日付', '自由ヶ丘', '自由が丘', 'のシフト', 'L\'Atelier', 'Stand', 'Banh', 'Mi']

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

                                    writer.writerow({
                                        '日付': full_date,
                                        '曜日': weekday,
                                        'スタッフ名': staff['name'],
                                        '社員区分': staff['is_employee'],
                                        '勤務場所': location,
                                        '開始時刻': start_time,
                                        '終了時刻': end_time
                                    })

    print(f"CSV created: {output_csv_path}")


if __name__ == "__main__":
    # サンプルPDFのパス
    pdf_path = Path(__file__).parent.parent / "fixtures" / "shift_pdfs" / "改3シフト表_20251001-20251031_Atelier.pdf"
    output_path = Path(__file__).parent.parent / "fixtures" / "shift_pdfs" / "output_sample.csv"

    if len(sys.argv) > 1:
        pdf_path = Path(sys.argv[1])

    if len(sys.argv) > 2:
        output_path = Path(sys.argv[2])
    else:
        output_path = pdf_path.with_suffix('.csv')

    if not pdf_path.exists():
        print(f"Error: PDF file not found: {pdf_path}")
        sys.exit(1)

    pdf_to_csv(pdf_path, output_path)
