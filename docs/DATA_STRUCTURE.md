# 📊 データ構造仕様

## CSV入力フォーマット

### staff.csv (必須)
```csv
staff_id,name,role,max_hours_week,min_hours_week,hourly_rate
1,田中太郎,スタッフ,40,20,1200
2,佐藤花子,リーダー,32,24,1500
3,鈴木次郎,アルバイト,20,8,1000
```

### availability.csv (必須)
```csv
staff_id,date,start_time,end_time,willingness
1,2024-12-01,09:00,17:00,prefer
1,2024-12-02,09:00,17:00,available
2,2024-12-01,13:00,21:00,prefer
```

**willingness値:**
- `prefer`: 希望
- `available`: 可能
- `unavailable`: 不可

### constraints.csv (オプション)
```csv
constraint_type,staff_ids,description,priority
must_not_overlap,"1,2","田中さんと佐藤さんは同じ時間にしない",high
min_staff_per_hour,all,"各時間帯最低2名",medium
max_consecutive_days,"3","鈴木さんは連続3日まで",high
```

### demand.csv (オプション)
```csv
date,hour,required_staff,notes
2024-12-01,09,2,開店準備
2024-12-01,12,4,ランチタイム
2024-12-01,18,3,ディナータイム
```

## データベースモデル

### Staff (スタッフ)
```python
class Staff(models.Model):
    staff_id = models.IntegerField(unique=True)
    name = models.CharField(max_length=100)
    role = models.CharField(max_length=50)
    max_hours_week = models.IntegerField()
    min_hours_week = models.IntegerField(default=0)
    hourly_rate = models.DecimalField(max_digits=6, decimal_places=0)
    skills = models.JSONField(default=list)  # ['cashier', 'cook']
    created_at = models.DateTimeField(auto_now_add=True)
```

### Availability (希望シフト)
```python
class Availability(models.Model):
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    willingness = models.CharField(
        max_length=20,
        choices=[
            ('prefer', '希望'),
            ('available', '可能'),  
            ('unavailable', '不可')
        ]
    )
```

### ShiftPlan (シフト案)
```python
class ShiftPlan(models.Model):
    plan_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=[
            ('draft', '下書き'),
            ('pending', '承認待ち'),
            ('approved', '承認済み'),
            ('published', '公開済み')
        ]
    )
    ai_generated_at = models.DateTimeField()
    approved_at = models.DateTimeField(null=True)
    metrics = models.JSONField(default=dict)
```

### Shift (個別シフト)
```python
class Shift(models.Model):
    plan = models.ForeignKey(ShiftPlan, on_delete=models.CASCADE)
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    break_minutes = models.IntegerField(default=60)
    role_assigned = models.CharField(max_length=50)
    is_modified = models.BooleanField(default=False)  # AI生成から変更されたか
```

## JSON出力フォーマット

### シフト計画レスポンス
```json
{
  "plan_id": "plan_20241201_001",
  "name": "12月第1週シフト",
  "period": {
    "start_date": "2024-12-01",
    "end_date": "2024-12-07"
  },
  "shifts": [
    {
      "shift_id": "shift_001",
      "date": "2024-12-01",
      "start_time": "09:00",
      "end_time": "17:00",
      "staff": {
        "staff_id": 1,
        "name": "田中太郎",
        "role": "スタッフ"
      },
      "break_minutes": 60,
      "total_hours": 7.0,
      "is_modified": false
    }
  ],
  "metrics": {
    "total_labor_hours": 168,
    "total_labor_cost": 201600,
    "average_hours_per_staff": 21.0,
    "coverage_score": 0.95,
    "constraint_violations": 0
  },
  "ai_insights": [
    "繁忙時間帯の人員配置を最適化しました",
    "全スタッフの希望シフトを90%反映できました"
  ]
}
```

### 差分情報
```json
{
  "changes": [
    {
      "type": "added",
      "shift": {
        "date": "2024-12-02",
        "staff_name": "新田次郎",
        "start_time": "10:00",
        "end_time": "16:00"
      }
    },
    {
      "type": "modified",
      "shift_id": "shift_001",
      "changes": {
        "start_time": {"from": "09:00", "to": "10:00"}
      }
    },
    {
      "type": "removed",
      "shift": {
        "date": "2024-12-03",
        "staff_name": "田中太郎",
        "start_time": "14:00"
      }
    }
  ]
}
```

## バリデーションルール

### 基本制約
- 1日の労働時間: 最大8時間
- 週の労働時間: スタッフのmax_hours_week以下
- 休憩時間: 6時間以上勤務で1時間以上
- 勤務間隔: 最低11時間空ける

### ビジネスルール
- 各時間帯の最低人数確保
- スキル要件（レジ担当、調理担当など）
- 同じスタッフの連続勤務日数制限
- 特定スタッフの同時勤務制限