# 🔌 API 仕様書

## Base URL
- 開発: `http://localhost:8000/api/`
- 本番: `https://shift-scheduler-ai.railway.app/api/`

## 認証
```http
Authorization: Bearer <jwt_token>
```

## エンドポイント一覧

### 📤 ファイルアップロード

#### CSV アップロード
```http
POST /api/upload/csv/
Content-Type: multipart/form-data

{
  "file": <csv_file>,
  "type": "staff" | "availability" | "constraints"
}
```

**レスポンス:**
```json
{
  "status": "success",
  "message": "3 records imported",
  "data": {
    "imported_count": 3,
    "errors": []
  }
}
```

### 🤖 シフト生成

#### シフト自動生成
```http
POST /api/shifts/generate/
Content-Type: application/json

{
  "start_date": "2024-12-01",
  "end_date": "2024-12-07",
  "constraints": {
    "min_staff_per_shift": 2,
    "max_hours_per_day": 8
  }
}
```

**レスポンス:**
```json
{
  "status": "success",
  "shift_plan": {
    "id": "plan_123",
    "shifts": [
      {
        "date": "2024-12-01",
        "start_time": "09:00",
        "end_time": "17:00",
        "staff_id": 1,
        "staff_name": "田中太郎",
        "role": "スタッフ"
      }
    ],
    "metrics": {
      "total_hours": 40,
      "labor_cost": 32000,
      "coverage_score": 0.95
    }
  }
}
```

#### シフト更新
```http
PATCH /api/shifts/<plan_id>/
Content-Type: application/json

{
  "updates": [
    {
      "shift_id": "shift_123",
      "staff_id": 2,
      "start_time": "10:00"
    }
  ]
}
```

### 💬 音声・チャット

#### 音声指示処理
```http
POST /api/voice/process/
Content-Type: application/json

{
  "audio_text": "田中さんを火曜日の朝に変更して",
  "current_plan_id": "plan_123"
}
```

**レスポンス:**
```json
{
  "status": "success",
  "interpretation": {
    "action": "move_staff",
    "staff_name": "田中さん",
    "target_date": "2024-12-03",
    "target_time": "morning"
  },
  "preview": {
    "changes": [
      {
        "type": "moved",
        "staff": "田中太郎",
        "from": "2024-12-01 14:00",
        "to": "2024-12-03 09:00"
      }
    ]
  }
}
```

### 📥 エクスポート

#### CSV出力
```http
GET /api/shifts/<plan_id>/export/?format=csv
```

#### Excel出力
```http
GET /api/shifts/<plan_id>/export/?format=xlsx
```

## エラーレスポンス

```json
{
  "status": "error",
  "error_code": "VALIDATION_ERROR",
  "message": "Invalid staff data",
  "details": {
    "field": "max_hours_week",
    "issue": "Must be a positive integer"
  }
}
```

### エラーコード一覧

- `VALIDATION_ERROR`: 入力データのバリデーションエラー
- `AI_SERVICE_ERROR`: OpenAI API関連エラー
- `OPTIMIZATION_ERROR`: シフト最適化処理エラー
- `FILE_FORMAT_ERROR`: CSVファイル形式エラー
- `RESOURCE_NOT_FOUND`: 指定されたリソースが見つからない