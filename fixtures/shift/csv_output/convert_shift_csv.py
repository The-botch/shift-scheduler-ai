#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import csv
from datetime import datetime
import sys
import os

# 曜日マッピング
WEEKDAY_MAP = {
    0: '月', 1: '火', 2: '水', 3: '木', 4: '金', 5: '土', 6: '日'
}

# 雇用形態から役職へのマッピング
EMPLOYMENT_TO_ROLE = {
    'MONTHLY': '社員',
    'HOURLY': 'アルバイト',
    'FULL_TIME': '社員',
    'PART_TIME': 'アルバイト'
}

# store_nameのマッピング（work_locationも考慮）
def get_store_display_name(store_name, work_location):
    """店舗名を決定する"""
    if work_location and work_location != '〜':
        # work_locationが指定されている場合はそれを使用
        location_map = {
            '⿇布台': 'COME 麻布台',
            '麻布台': 'COME 麻布台',
            '⾃由が丘': 'Atelier',
            '自由が丘': 'Atelier',
            '渋⾕': 'SHIBUYA',
            '渋谷': 'SHIBUYA',
            '学⼤': 'Stand Banh Mi',
            '学大': 'Stand Banh Mi',
            '祐天寺': 'Stand Bo Bun',
        }
        if work_location in location_map:
            return location_map[work_location]

    # store_nameから判定
    if 'Atelier' in store_name or 'atelier' in store_name.lower():
        return 'Atelier'
    elif 'SHIBUYA' in store_name:
        return 'SHIBUYA'
    elif 'COME' in store_name:
        return 'COME 麻布台'
    elif 'Banh Mi' in store_name or 'BANH_MI' in store_name:
        return 'Stand Banh Mi'
    elif 'Bo Bun' in store_name or 'BO_BUN' in store_name:
        return 'Stand Bo Bun'

    return store_name

def format_time(time_str):
    """時刻をHH:MM:SS形式に変換"""
    if not time_str or time_str.strip() == '':
        return '00:00:00'

    # 既にHH:MM:SS形式の場合
    if time_str.count(':') == 2:
        return time_str

    # H:MM または HH:MM 形式の場合
    parts = time_str.split(':')
    if len(parts) == 2:
        hour = parts[0].zfill(2)
        minute = parts[1].zfill(2)
        return f"{hour}:{minute}:00"

    return time_str

def main():
    # スクリプトと同じディレクトリのファイルを参照
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_file = os.path.join(script_dir, 'シフト.csv')
    output_file = os.path.join(script_dir, 'shift_all_data_updated.csv')

    rows = []
    seen_shifts = set()  # 重複チェック用
    duplicate_count = 0

    # 入力CSVを読み込む
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # 全てのデータを処理
            if row['plan_year'] and row['plan_month']:
                # 日付から曜日を取得
                date_obj = datetime.strptime(row['shift_date'], '%Y-%m-%d')
                weekday = WEEKDAY_MAP[date_obj.weekday()]

                # 店舗名を決定
                store_display_name = get_store_display_name(row['store_name'], row['work_location'])

                # 役職を決定
                role = EMPLOYMENT_TO_ROLE.get(row['employment_type'], row['employment_type'])

                # 時刻をフォーマット
                start_time = format_time(row['start_time'])
                end_time = format_time(row['end_time'])

                # 重複チェック用のキー（日付、スタッフ名、開始時刻、終了時刻）
                # 店舗が別でも時間が被っていたら削除
                shift_key = (
                    row['shift_date'],
                    row['staff_name'],
                    start_time,
                    end_time
                )

                # 既に同じシフトがある場合はスキップ
                if shift_key in seen_shifts:
                    duplicate_count += 1
                    continue

                seen_shifts.add(shift_key)

                # 新しい行を作成
                new_row = {
                    '日付': row['shift_date'],
                    '曜日': weekday,
                    '店舗名': store_display_name,
                    'スタッフ名': row['staff_name'],
                    '役職': role,
                    '開始時刻': start_time,
                    '終了時刻': end_time,
                    '休憩時間': row['break_minutes'],
                    '勤務時間': '0'  # デフォルト値
                }

                rows.append(new_row)

    # 日付と店舗名でソート
    rows.sort(key=lambda x: (x['日付'], x['店舗名'], x['スタッフ名']))

    # 出力CSVを書き込む
    with open(output_file, 'w', encoding='utf-8-sig', newline='') as f:
        fieldnames = ['日付', '曜日', '店舗名', 'スタッフ名', '役職', '開始時刻', '終了時刻', '休憩時間', '勤務時間']
        writer = csv.DictWriter(f, fieldnames=fieldnames)

        writer.writeheader()
        writer.writerows(rows)

    print(f"✅ 変換完了: {len(rows)}行のデータを出力しました")
    print(f"🗑️  重複削除: {duplicate_count}件の重複シフトを除外しました")
    print(f"📁 出力ファイル: {output_file}")

if __name__ == '__main__':
    main()
