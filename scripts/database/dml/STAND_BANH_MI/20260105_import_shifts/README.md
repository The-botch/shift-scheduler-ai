# シフトデータインポート

## 店舗IDマッピング

| work_location | store_id | store_name |
|--------------|----------|------------|
| 麻布台 | 6 | COME 麻布台 |
| 自由が丘 | 7 | Atelier |
| 学大 | 8 | Stand Banh Mi |
| 祐天寺 | 9 | Stand Bo Bun |
| pho | 10 | Stand Pho Yo |
| 渋谷 | 10 | SHIBUYA (Stand Pho Yo) |
| TT | 11 | Tipsy Tiger (※要確認) |

## 使用方法

1. `insert_shift_plans.sql` を実行してshift_plansを作成
2. `insert_shifts.sql` を実行してシフトデータを登録
