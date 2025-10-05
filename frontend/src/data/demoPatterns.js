// デモ用の修正パターンとシフトデータ

export const demoPatterns = {
  '田中さんの月曜日を休みにしてください': {
    changes: [{ date: 1, action: 'remove', staff: '田中' }],
    response: '田中さんの月曜日（9/1）のシフトを削除しました。代替スタッフの配置も調整済みです。'
  },
  '午前のシフトを1人増やしてください': {
    changes: [{ date: 2, action: 'add', staff: '高橋', time: '9-13', skill: 4 }],
    response: '火曜日の午前シフトに高橋さん（9:00-13:00）を追加しました。'
  },
  '土日のベテランスタッフを増やしてください': {
    changes: [
      { date: 6, action: 'add', staff: '佐藤', time: '9-17', skill: 5 },
      { date: 7, action: 'add', staff: '田中', time: '9-17', skill: 4 }
    ],
    response: '土曜日に佐藤さん、日曜日に田中さんを追加配置しました。ベテランスタッフの配置を強化しています。'
  },
  '連続勤務を3日以内に制限してください': {
    changes: [{ date: 4, action: 'remove', staff: '田中' }],
    response: '田中さんの木曜日のシフトを削除し、連続勤務を3日以内に調整しました。'
  },
  '佐藤さんの水曜日を夜勤に変更してください': {
    changes: [{ date: 3, action: 'modify', staff: '佐藤', time: '17-21', skill: 5 }],
    response: '佐藤さんの水曜日のシフトを夜勤（17:00-21:00）に変更しました。'
  }
}

export const initialShiftData = [
  { date: 1, shifts: [{ name: '田中', time: '9-17', skill: 4, changed: false }] },
  { date: 2, shifts: [{ name: '佐藤', time: '13-21', skill: 5, changed: false }, { name: '山田', time: '9-15', skill: 3, changed: false }] },
  { date: 3, shifts: [{ name: '鈴木', time: '10-18', skill: 4, changed: false }] },
  { date: 4, shifts: [{ name: '田中', time: '9-17', skill: 4, changed: false }, { name: '佐藤', time: '17-21', skill: 5, changed: false }] },
  { date: 5, shifts: [{ name: '山田', time: '9-15', skill: 3, changed: false }, { name: '高橋', time: '15-21', skill: 4, changed: false }] },
  { date: 6, shifts: [{ name: '佐藤', time: '10-18', skill: 5, changed: false }, { name: '田中', time: '18-22', skill: 4, changed: false }] },
  { date: 7, shifts: [{ name: '鈴木', time: '9-17', skill: 4, changed: false }, { name: '山田', time: '17-21', skill: 3, changed: false }] }
]

export const firstPlanShiftData = [
  { date: 1, shifts: [{ name: '田中', time: '9-17', skill: 4 }] },
  { date: 2, shifts: [{ name: '佐藤', time: '13-21', skill: 5 }, { name: '山田', time: '9-13', skill: 3 }] },
  { date: 3, shifts: [{ name: '鈴木', time: '10-18', skill: 4 }] },
  { date: 4, shifts: [{ name: '高橋', time: '9-17', skill: 4 }, { name: '田中', time: '17-21', skill: 4 }] },
  { date: 5, shifts: [{ name: '佐藤', time: '9-15', skill: 5 }] },
  { date: 6, shifts: [{ name: '山田', time: '13-21', skill: 3 }, { name: '鈴木', time: '9-13', skill: 4 }] },
  { date: 7, shifts: [{ name: '高橋', time: '10-18', skill: 4 }] },
  { date: 8, shifts: [{ name: '田中', time: '9-17', skill: 4 }] },
  { date: 9, shifts: [{ name: '佐藤', time: '13-21', skill: 5 }, { name: '山田', time: '9-13', skill: 3 }] },
  { date: 10, shifts: [{ name: '鈴木', time: '10-18', skill: 4 }] },
  { date: 11, shifts: [{ name: '高橋', time: '9-17', skill: 4 }, { name: '田中', time: '17-21', skill: 4 }] },
  { date: 12, shifts: [{ name: '佐藤', time: '9-15', skill: 5 }] },
  { date: 13, shifts: [{ name: '山田', time: '13-21', skill: 3 }, { name: '鈴木', time: '9-13', skill: 4 }] },
  { date: 14, shifts: [{ name: '高橋', time: '10-18', skill: 4 }] },
  { date: 15, shifts: [{ name: '田中', time: '9-17', skill: 4 }] },
  { date: 16, shifts: [{ name: '佐藤', time: '13-21', skill: 5 }, { name: '山田', time: '9-13', skill: 3 }] },
  { date: 17, shifts: [{ name: '鈴木', time: '10-18', skill: 4 }] },
  { date: 18, shifts: [{ name: '高橋', time: '9-17', skill: 4 }, { name: '田中', time: '17-21', skill: 4 }] },
  { date: 19, shifts: [{ name: '佐藤', time: '9-15', skill: 5 }] },
  { date: 20, shifts: [{ name: '山田', time: '13-21', skill: 3 }, { name: '鈴木', time: '9-13', skill: 4 }] },
  { date: 21, shifts: [{ name: '高橋', time: '10-18', skill: 4 }] },
  { date: 22, shifts: [{ name: '田中', time: '9-17', skill: 4 }] },
  { date: 23, shifts: [{ name: '佐藤', time: '13-21', skill: 5 }, { name: '山田', time: '9-13', skill: 3 }] },
  { date: 24, shifts: [{ name: '鈴木', time: '10-18', skill: 4 }] },
  { date: 25, shifts: [{ name: '高橋', time: '9-17', skill: 4 }, { name: '田中', time: '17-21', skill: 4 }] },
  { date: 26, shifts: [{ name: '佐藤', time: '9-15', skill: 5 }] },
  { date: 27, shifts: [{ name: '山田', time: '13-21', skill: 3 }, { name: '鈴木', time: '9-13', skill: 4 }] },
  { date: 28, shifts: [{ name: '高橋', time: '10-18', skill: 4 }] },
  { date: 29, shifts: [{ name: '田中', time: '9-17', skill: 4 }] },
  { date: 30, shifts: [{ name: '佐藤', time: '13-21', skill: 5 }, { name: '山田', time: '9-13', skill: 3 }] }
]

export const secondPlanShiftData = [
  { date: 1, shifts: [{ name: '田中', time: '13-21', skill: 4, preferred: true }] },
  { date: 2, shifts: [{ name: '佐藤', time: '9-17', skill: 5, preferred: true }, { name: '山田', time: '17-21', skill: 3, preferred: false }] },
  { date: 3, shifts: [{ name: '鈴木', time: '9-17', skill: 4, preferred: true }] },
  { date: 4, shifts: [{ name: '高橋', time: '9-15', skill: 4, preferred: true }, { name: '田中', time: '15-21', skill: 4, preferred: true }] },
  { date: 5, shifts: [{ name: '佐藤', time: '10-18', skill: 5, preferred: true }] },
  { date: 6, shifts: [{ name: '山田', time: '9-15', skill: 3, preferred: true }, { name: '鈴木', time: '15-21', skill: 4, preferred: false }] },
  { date: 7, shifts: [{ name: '高橋', time: '10-18', skill: 4, preferred: true }] },
  { date: 8, shifts: [{ name: '田中', time: '9-17', skill: 4, preferred: true }] },
  { date: 9, shifts: [{ name: '佐藤', time: '13-21', skill: 5, preferred: true }, { name: '山田', time: '9-13', skill: 3, preferred: true }] },
  { date: 10, shifts: [{ name: '鈴木', time: '10-18', skill: 4, preferred: true }] },
  { date: 11, shifts: [{ name: '高橋', time: '9-17', skill: 4, preferred: true }, { name: '田中', time: '17-21', skill: 4, preferred: false }] },
  { date: 12, shifts: [{ name: '佐藤', time: '9-15', skill: 5, preferred: true }] },
  { date: 13, shifts: [{ name: '山田', time: '13-21', skill: 3, preferred: true }, { name: '鈴木', time: '9-13', skill: 4, preferred: true }] },
  { date: 14, shifts: [{ name: '高橋', time: '10-18', skill: 4, preferred: true }] },
  { date: 15, shifts: [{ name: '田中', time: '9-15', skill: 4, preferred: true }] },
  { date: 16, shifts: [{ name: '佐藤', time: '15-21', skill: 5, preferred: true }, { name: '山田', time: '9-15', skill: 3, preferred: true }] },
  { date: 17, shifts: [{ name: '鈴木', time: '9-17', skill: 4, preferred: true }] },
  { date: 18, shifts: [{ name: '高橋', time: '13-21', skill: 4, preferred: true }, { name: '田中', time: '9-13', skill: 4, preferred: true }] },
  { date: 19, shifts: [{ name: '佐藤', time: '10-18', skill: 5, preferred: true }] },
  { date: 20, shifts: [{ name: '山田', time: '9-15', skill: 3, preferred: true }, { name: '鈴木', time: '15-21', skill: 4, preferred: true }] },
  { date: 21, shifts: [{ name: '高橋', time: '9-17', skill: 4, preferred: true }] },
  { date: 22, shifts: [{ name: '田中', time: '13-21', skill: 4, preferred: true }] },
  { date: 23, shifts: [{ name: '佐藤', time: '9-15', skill: 5, preferred: true }, { name: '山田', time: '15-21', skill: 3, preferred: false }] },
  { date: 24, shifts: [{ name: '鈴木', time: '10-18', skill: 4, preferred: true }] },
  { date: 25, shifts: [{ name: '高橋', time: '9-17', skill: 4, preferred: true }, { name: '田中', time: '17-21', skill: 4, preferred: true }] },
  { date: 26, shifts: [{ name: '佐藤', time: '13-21', skill: 5, preferred: true }] },
  { date: 27, shifts: [{ name: '山田', time: '9-15', skill: 3, preferred: true }, { name: '鈴木', time: '15-21', skill: 4, preferred: true }] },
  { date: 28, shifts: [{ name: '高橋', time: '10-18', skill: 4, preferred: true }] },
  { date: 29, shifts: [{ name: '田中', time: '9-17', skill: 4, preferred: true }] },
  { date: 30, shifts: [{ name: '佐藤', time: '15-21', skill: 5, preferred: true }, { name: '山田', time: '9-15', skill: 3, preferred: true }] }
]
