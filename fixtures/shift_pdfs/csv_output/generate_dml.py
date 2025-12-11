#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
shift_all_data_updated.csvからDMLを生成するスクリプト
第2案（SECOND）の承認済み（APPROVED）データを作成
"""
import csv
import os
from datetime import datetime
from collections import defaultdict

# 定数
TENANT_ID = 3
PATTERN_ID = 1

# 店舗名 → store_id マッピング
STORE_NAME_TO_ID = {
    'COME 麻布台': 6,  # COME
    'Atelier': 7,      # ATELIER
    'Stand Banh Mi': 8,  # STAND_BANH_MI
    'Stand Bo Bun': 9,   # STAND_BO_BUN
    'Stand Pho You': 10, # SPY
    'Tipsy Tiger': 11,   # TT
    'SHIBUYA': 10,  # SHIBUYAは一旦Stand Pho Youと同じIDに（後で調整）
}

def generate_staff_mapping(csv_file):
    """スタッフ名から staff_id へのマッピングを生成"""
    staff_names = set()

    with open(csv_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            staff_names.add(row['スタッフ名'])

    # スタッフ名をソートして採番
    staff_mapping = {}
    for i, name in enumerate(sorted(staff_names), start=301):
        staff_mapping[name] = i

    return staff_mapping

def parse_time(time_str):
    """時刻文字列をHH:MM形式に変換（24時間超過対応）"""
    parts = time_str.split(':')
    if len(parts) >= 2:
        return f"{parts[0]}:{parts[1]}"
    return time_str

def calculate_total_hours(start_time, end_time, break_minutes):
    """勤務時間を計算"""
    try:
        start_h, start_m = map(int, start_time.split(':'))
        end_h, end_m = map(int, end_time.split(':'))

        start_minutes = start_h * 60 + start_m
        end_minutes = end_h * 60 + end_m

        work_minutes = end_minutes - start_minutes - break_minutes
        total_hours = work_minutes / 60.0

        return round(total_hours, 2)
    except:
        return 0.00

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_file = os.path.join(script_dir, 'shift_all_data_updated.csv')
    output_file = os.path.join(script_dir, 'insert_shifts_second_plan.sql')

    # スタッフIDマッピングを生成
    print("📋 スタッフIDマッピングを生成中...")
    staff_mapping = generate_staff_mapping(input_file)
    print(f"✅ {len(staff_mapping)}名のスタッフをマッピングしました")

    # データを読み込み
    shifts_by_store_month = defaultdict(list)

    with open(input_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            date_obj = datetime.strptime(row['日付'], '%Y-%m-%d')
            year = date_obj.year
            month = date_obj.month
            store_name = row['店舗名']

            key = (store_name, year, month)
            shifts_by_store_month[key].append(row)

    print(f"📊 {len(shifts_by_store_month)}個の店舗・月の組み合わせを検出")

    # SQL生成
    sql_lines = []
    sql_lines.append("-- ============================================")
    sql_lines.append("-- シフトデータ（第2案・承認済み）")
    sql_lines.append(f"-- 生成日時: {datetime.now().isoformat()}")
    sql_lines.append(f"-- tenant_id: {TENANT_ID}")
    sql_lines.append("-- ============================================")
    sql_lines.append("")

    # shift_plansを生成
    sql_lines.append("-- ============================================")
    sql_lines.append("-- shift_plans INSERT文")
    sql_lines.append("-- ============================================")
    sql_lines.append("")

    plan_id_counter = 201  # plan_idは201から開始
    plan_mappings = {}

    for (store_name, year, month), shifts in sorted(shifts_by_store_month.items()):
        store_id = STORE_NAME_TO_ID.get(store_name)
        if not store_id:
            print(f"⚠️  店舗名 '{store_name}' のstore_idが見つかりません")
            continue

        # 期間の開始日と終了日を取得
        dates = [datetime.strptime(s['日付'], '%Y-%m-%d') for s in shifts]
        period_start = min(dates).strftime('%Y-%m-%d')
        period_end = max(dates).strftime('%Y-%m-%d')

        plan_code = f"SECOND-{year}{month:02d}-{store_id}"
        plan_name = f"{year}年{month}月 第2案 ({store_name})"

        sql = f"""INSERT INTO ops.shift_plans (
    plan_id, tenant_id, store_id, plan_year, plan_month, plan_code, plan_name,
    period_start, period_end, status, plan_type, generation_type,
    created_at, updated_at
) VALUES (
    {plan_id_counter}, {TENANT_ID}, {store_id}, {year}, {month}, '{plan_code}', '{plan_name}',
    '{period_start}', '{period_end}', 'APPROVED', 'SECOND', 'MANUAL',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);"""

        sql_lines.append(sql)
        sql_lines.append("")

        # マッピングを保存
        plan_mappings[(store_name, year, month)] = plan_id_counter
        plan_id_counter += 1

    # shiftsを生成
    sql_lines.append("-- ============================================")
    sql_lines.append("-- shifts INSERT文")
    sql_lines.append("-- ============================================")
    sql_lines.append("")

    shift_count = 0
    for (store_name, year, month), shifts in sorted(shifts_by_store_month.items()):
        store_id = STORE_NAME_TO_ID.get(store_name)
        if not store_id:
            continue

        plan_id = plan_mappings[(store_name, year, month)]

        sql_lines.append(f"-- {store_name} {year}年{month}月")

        for shift in shifts:
            staff_name = shift['スタッフ名']
            staff_id = staff_mapping.get(staff_name)

            if not staff_id:
                print(f"⚠️  スタッフ名 '{staff_name}' のstaff_idが見つかりません")
                continue

            shift_date = shift['日付']
            start_time = parse_time(shift['開始時刻'])
            end_time = parse_time(shift['終了時刻'])
            break_minutes = int(shift['休憩時間'])
            total_hours = calculate_total_hours(start_time, end_time, break_minutes)

            sql = f"""INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    {TENANT_ID}, {store_id}, {plan_id}, {staff_id}, '{shift_date}', {PATTERN_ID},
    '{start_time}', '{end_time}', {break_minutes}, {total_hours},
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);"""

            sql_lines.append(sql)
            shift_count += 1

        sql_lines.append("")

    # ファイルに書き込み
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))

    print(f"\n✅ DML生成完了")
    print(f"📁 出力ファイル: {output_file}")
    print(f"📊 統計:")
    print(f"   - shift_plans: {len(plan_mappings)}件")
    print(f"   - shifts: {shift_count}件")
    print(f"   - スタッフ数: {len(staff_mapping)}名")
    print(f"\n💡 スタッフIDマッピング（最初の10名）:")
    for name, staff_id in sorted(staff_mapping.items())[:10]:
        print(f"   {staff_id}: {name}")
    print(f"   ...")

if __name__ == '__main__':
    main()
