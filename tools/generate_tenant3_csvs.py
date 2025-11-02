#!/usr/bin/env python3
"""
テナント3用のCSVファイル（労働時間実績、給与明細、売上実績、売上予測）を生成
"""
import csv
import random
from pathlib import Path
from datetime import datetime, timedelta
import sys
import os
import psycopg2
from dotenv import load_dotenv

# データベース接続を取得
def get_db_connection():
    """データベース接続を取得"""
    # .envファイルを読み込み
    root = Path(__file__).parent.parent
    env_path = root / '.env'
    load_dotenv(env_path)

    conn = psycopg2.connect(
        host=os.getenv('PGHOST', 'localhost'),
        port=os.getenv('PGPORT', '5432'),
        database=os.getenv('PGDATABASE', 'railway'),
        user=os.getenv('PGUSER', 'postgres'),
        password=os.getenv('PGPASSWORD')
    )
    return conn

# マスターデータを取得
def load_master_data(tenant_id=3):
    """データベースからマスターデータを取得"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 店舗マスタ取得
    cursor.execute("""
        SELECT store_id, store_code, store_name
        FROM core.stores
        WHERE tenant_id = %s
        ORDER BY store_id
    """, (tenant_id,))

    stores = {}
    store_name_to_id = {}
    for row in cursor.fetchall():
        store_id, store_code, store_name = row
        stores[store_code] = store_id
        store_name_to_id[store_name] = store_id

    # スタッフマスタ取得
    cursor.execute("""
        SELECT staff_id, name, store_id
        FROM hr.staff
        WHERE tenant_id = %s
        ORDER BY staff_id
    """, (tenant_id,))

    staff = {}
    for row in cursor.fetchall():
        staff_id, name, store_id = row
        staff[name] = {'staff_id': staff_id, 'store_id': store_id}

    cursor.close()
    conn.close()

    return stores, store_name_to_id, staff

# シフトCSVから読み込んだデータを基に各CSVを生成
def load_shift_csv(csv_path):
    """シフトCSVを読み込む"""
    shifts = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            shifts.append(row)
    return shifts

def generate_work_hours_csv(shifts, output_path, staff_map):
    """労働時間実績CSVを生成"""
    print(f"\n🔄 労働時間実績CSV生成中...")

    rows = []
    shift_counter = 1

    for shift in shifts:
        # シフトIDを生成
        shift_date = shift['shift_date'].replace('-', '')
        shift_id = f"SH{shift_date}_{shift_counter:04d}"
        shift_counter += 1

        # 日付をパース
        date_obj = datetime.strptime(shift['shift_date'], '%Y-%m-%d')
        year = date_obj.year
        month = date_obj.month
        day = date_obj.day

        # 開始・終了時刻
        start_time = shift['start_time']
        end_time = shift['end_time']

        # 予定時間を計算
        start_h, start_m = map(int, start_time.split(':'))
        end_h, end_m = map(int, end_time.split(':'))

        start_minutes = start_h * 60 + start_m
        end_minutes = end_h * 60 + end_m

        # 翌日またぎの処理
        if end_minutes < start_minutes:
            end_minutes += 24 * 60

        work_minutes = end_minutes - start_minutes
        break_mins = int(shift.get('break_minutes', 0))
        scheduled_hours = round((work_minutes - break_mins) / 60, 1)

        # 実績時間（予定時間に対して±5分のランダムな変動を追加）
        actual_variance = random.randint(-5, 10)  # 遅刻より残業が多い傾向
        actual_minutes = work_minutes + actual_variance
        actual_hours = round((actual_minutes - break_mins) / 60, 1)

        # 残業分を計算
        overtime_minutes = max(0, actual_variance)

        # 遅刻・早退フラグ（5%の確率）
        is_late = random.random() < 0.05 and actual_variance < -2
        is_early_leave = random.random() < 0.03 and actual_variance < -2

        # 備考
        notes = ''
        if is_late:
            notes = '遅刻'
        elif is_early_leave:
            notes = '早退'

        # 実際の開始・終了時刻
        actual_start_minutes = start_minutes + (actual_variance if is_late else 0)
        actual_end_minutes = end_minutes + (actual_variance if not is_early_leave else 0)

        actual_start_h = (actual_start_minutes // 60) % 24
        actual_start_m = actual_start_minutes % 60
        actual_end_h = (actual_end_minutes // 60) % 24
        actual_end_m = actual_end_minutes % 60

        actual_start = f"{actual_start_h:02d}:{actual_start_m:02d}"
        actual_end = f"{actual_end_h:02d}:{actual_end_m:02d}"

        # スタッフ名からstaff_idを取得
        staff_name = shift['staff_name']
        staff_id = staff_map.get(staff_name, {}).get('staff_id', '')

        rows.append({
            'shift_id': shift_id,
            'year': year,
            'month': month,
            'date': day,
            'staff_id': staff_id,
            'staff_name': staff_name,
            'scheduled_start': start_time,
            'scheduled_end': end_time,
            'actual_start': actual_start,
            'actual_end': actual_end,
            'scheduled_hours': scheduled_hours,
            'actual_hours': actual_hours,
            'break_minutes': break_mins,
            'overtime_minutes': overtime_minutes,
            'is_late': 'TRUE' if is_late else 'FALSE',
            'is_early_leave': 'TRUE' if is_early_leave else 'FALSE',
            'notes': notes
        })

    # CSVに書き込み
    fieldnames = [
        'shift_id', 'year', 'month', 'date', 'staff_id', 'staff_name',
        'scheduled_start', 'scheduled_end', 'actual_start', 'actual_end',
        'scheduled_hours', 'actual_hours', 'break_minutes', 'overtime_minutes',
        'is_late', 'is_early_leave', 'notes'
    ]

    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"  ✅ {len(rows):,} 件の労働時間データを生成")
    return rows

def generate_payroll_csv(work_hours, output_path, staff_map):
    """給与明細CSVを生成"""
    print(f"\n🔄 給与明細CSV生成中...")

    # スタッフ別・年月別に集計
    payroll_map = {}

    for wh in work_hours:
        key = (wh['staff_name'], wh['year'], wh['month'])

        if key not in payroll_map:
            payroll_map[key] = {
                'staff_name': wh['staff_name'],
                'year': wh['year'],
                'month': wh['month'],
                'total_hours': 0,
                'overtime_hours': 0,
                'days_worked': 0
            }

        payroll_map[key]['total_hours'] += wh['actual_hours']
        payroll_map[key]['overtime_hours'] += wh['overtime_minutes'] / 60
        payroll_map[key]['days_worked'] += 1

    rows = []
    payroll_id = 1

    for key, data in payroll_map.items():
        staff_name, year, month = key

        # 基本給（時給1,200円と仮定、社員は月給制）
        # 簡易的に全員時給制として計算
        hourly_rate = 1200
        base_salary = int(data['total_hours'] * hourly_rate)

        # 残業手当（1.25倍）
        overtime_pay = int(data['overtime_hours'] * hourly_rate * 1.25)

        # 通勤手当（一律1日500円）
        commute_allowance = data['days_worked'] * 500

        # その他手当
        other_allowances = 0

        # 総支給額
        gross_salary = base_salary + overtime_pay + commute_allowance + other_allowances

        # 健康保険（総支給額の5%）
        health_insurance = int(gross_salary * 0.05)

        # 厚生年金（総支給額の9%）
        pension_insurance = int(gross_salary * 0.09)

        # 雇用保険（総支給額の0.3%）
        employment_insurance = int(gross_salary * 0.003)

        # 所得税（総支給額の3%）
        income_tax = int(gross_salary * 0.03)

        # 住民税（総支給額の3%）
        resident_tax = int(gross_salary * 0.03)

        # 総控除額
        total_deduction = health_insurance + pension_insurance + employment_insurance + income_tax + resident_tax

        # 手取り額
        net_salary = gross_salary - total_deduction

        # スタッフ名から staff_idを取得
        staff_info = staff_map.get(staff_name, {})
        staff_id_val = staff_info.get('staff_id', '')

        rows.append({
            'payroll_id': f"PAY{year}{month:02d}_{payroll_id:04d}",
            'year': year,
            'month': month,
            'staff_id': staff_id_val,
            'staff_name': staff_name,
            'work_days': data['days_worked'],
            'work_hours': round(data['total_hours'], 1),
            'base_salary': base_salary,
            'overtime_pay': overtime_pay,
            'commute_allowance': commute_allowance,
            'other_allowances': other_allowances,
            'gross_salary': gross_salary,
            'health_insurance': health_insurance,
            'pension_insurance': pension_insurance,
            'employment_insurance': employment_insurance,
            'income_tax': income_tax,
            'resident_tax': resident_tax,
            'total_deduction': total_deduction,
            'net_salary': net_salary,
            'payment_date': f"{year}-{month:02d}-25",
            'payment_status': 'PAID',
            'notes': ''
        })

        payroll_id += 1

    # CSVに書き込み
    fieldnames = [
        'payroll_id', 'year', 'month', 'staff_id', 'staff_name',
        'work_days', 'work_hours', 'base_salary', 'overtime_pay',
        'commute_allowance', 'other_allowances', 'gross_salary',
        'health_insurance', 'pension_insurance', 'employment_insurance',
        'income_tax', 'resident_tax', 'total_deduction', 'net_salary',
        'payment_date', 'payment_status', 'notes'
    ]

    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"  ✅ {len(rows):,} 件の給与明細データを生成")
    return rows

def generate_sales_csv(shifts, output_path_actual, output_path_forecast, store_name_to_id):
    """売上実績・予測CSVを生成"""
    print(f"\n🔄 売上実績・予測CSV生成中...")

    # 店舗別・年月別に集計
    store_month_map = {}

    for shift in shifts:
        date_obj = datetime.strptime(shift['shift_date'], '%Y-%m-%d')
        year = date_obj.year
        month = date_obj.month
        store = shift['store_name']

        key = (store, year, month)

        if key not in store_month_map:
            store_month_map[key] = {
                'store_name': store,
                'year': year,
                'month': month,
                'shift_count': 0
            }

        store_month_map[key]['shift_count'] += 1

    actual_rows = []
    forecast_rows = []
    actual_id = 1
    forecast_id = 1

    for key, data in sorted(store_month_map.items()):
        store, year, month = key
        # 店舗名から store_id を直接取得
        store_id = store_name_to_id.get(store)

        # 売上を推定（シフト件数 × 1日平均売上）
        # 1シフト = 約4時間、店舗売上 = 約12,000円/時間と仮定
        estimated_sales = data['shift_count'] * 4 * 12000

        # 実績売上（予測に対して±10%の変動）
        actual_sales = int(estimated_sales * random.uniform(0.9, 1.1))

        # 日平均
        days_in_month = 30 if month in [4, 6, 9, 11] else (28 if month == 2 else 31)
        daily_average = int(actual_sales / days_in_month)

        # 計画比
        plan_ratio = random.uniform(-5, 5)
        notes_actual = f"計画比{plan_ratio:+.1f}%"

        actual_rows.append({
            'actual_id': f"SA{year}{month:02d}_{actual_id:02d}",
            'year': year,
            'month': month,
            'store_id': store_id,
            'actual_sales': actual_sales,
            'daily_average': daily_average,
            'notes': notes_actual
        })
        actual_id += 1

        # 予測売上（実績より少し低め）
        forecasted_sales = int(actual_sales * 0.95)

        # 人件費（売上の30%目標）
        required_labor_cost = int(forecasted_sales * 0.30)

        # 必要時間（時給1,200円として）
        required_hours = int(required_labor_cost / 1200)

        forecast_rows.append({
            'forecast_id': f"SF{year}{month:02d}_{forecast_id:02d}",
            'year': year,
            'month': month,
            'store_id': store_id,
            'forecasted_sales': forecasted_sales,
            'required_labor_cost': required_labor_cost,
            'required_hours': required_hours,
            'notes': '通常営業・人件費率30%'
        })
        forecast_id += 1

    # 売上実績CSV書き込み
    fieldnames_actual = [
        'actual_id', 'year', 'month', 'store_id', 'actual_sales', 'daily_average', 'notes'
    ]

    with open(output_path_actual, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames_actual)
        writer.writeheader()
        writer.writerows(actual_rows)

    print(f"  ✅ {len(actual_rows):,} 件の売上実績データを生成")

    # 売上予測CSV書き込み
    fieldnames_forecast = [
        'forecast_id', 'year', 'month', 'store_id', 'forecasted_sales',
        'required_labor_cost', 'required_hours', 'notes'
    ]

    with open(output_path_forecast, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames_forecast)
        writer.writeheader()
        writer.writerows(forecast_rows)

    print(f"  ✅ {len(forecast_rows):,} 件の売上予測データを生成")

def main():
    # 入力・出力パス
    root = Path(__file__).parent.parent
    shift_csv = root / "fixtures" / "shift_pdfs" / "csv_output" / "シフト.csv"
    output_dir = root / "fixtures"

    # 出力ファイル
    work_hours_csv = output_dir / "work_hours_import_tenant3.csv"
    payroll_csv = output_dir / "payroll_tenant3.csv"
    sales_actual_csv = output_dir / "sales_actual_tenant3.csv"
    sales_forecast_csv = output_dir / "sales_forecast_tenant3.csv"

    print(f"\n{'='*60}")
    print(f"🏭 テナント3用CSV生成スクリプト")
    print(f"{'='*60}\n")
    print(f"入力: {shift_csv}")
    print(f"出力ディレクトリ: {output_dir}\n")

    # シフトCSVを読み込み
    if not shift_csv.exists():
        print(f"❌ エラー: シフトCSVが見つかりません: {shift_csv}")
        sys.exit(1)

    shifts = load_shift_csv(shift_csv)
    print(f"✅ {len(shifts):,} 件のシフトデータを読み込み\n")

    # データベースからマスターデータを取得
    print("📊 データベースからマスターデータを取得中...")
    stores, store_name_to_id, staff = load_master_data()
    print(f"  店舗: {len(stores)} 件")
    print(f"  スタッフ: {len(staff)} 件\n")

    # 各CSVを生成
    work_hours = generate_work_hours_csv(shifts, work_hours_csv, staff)
    payroll = generate_payroll_csv(work_hours, payroll_csv, staff)
    generate_sales_csv(shifts, sales_actual_csv, sales_forecast_csv, store_name_to_id)

    print(f"\n{'='*60}")
    print(f"✅ すべてのCSVファイル生成完了！")
    print(f"{'='*60}\n")
    print(f"生成されたファイル:")
    print(f"  📄 {work_hours_csv.name}")
    print(f"  📄 {payroll_csv.name}")
    print(f"  📄 {sales_actual_csv.name}")
    print(f"  📄 {sales_forecast_csv.name}\n")

if __name__ == "__main__":
    main()
