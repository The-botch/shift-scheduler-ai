const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:BWmHYBbEZqnptZRYmptockuomkHRWNPO@switchyard.proxy.rlwy.net:26491/railway'
});

async function run() {
  const client = await pool.connect();
  try {
    // 2026/01 SECOND と 2026/02 FIRST の両方に存在する全スタッフを取得
    const staffResult = await client.query(`
      SELECT DISTINCT s1.staff_id
      FROM ops.shifts s1
      JOIN ops.shift_plans p1 ON s1.plan_id = p1.plan_id
      WHERE p1.tenant_id = 3 AND p1.plan_year = 2026 AND p1.plan_month = 1 AND p1.plan_type = 'SECOND'
      AND EXISTS (
        SELECT 1 FROM ops.shifts s2
        JOIN ops.shift_plans p2 ON s2.plan_id = p2.plan_id
        WHERE p2.tenant_id = 3 AND p2.plan_year = 2026 AND p2.plan_month = 2 AND p2.plan_type = 'FIRST'
        AND s2.staff_id = s1.staff_id
      )
      ORDER BY s1.staff_id
    `);

    const staffIds = staffResult.rows.map(r => r.staff_id);
    console.log('検証対象スタッフ数:', staffIds.length);
    console.log('スタッフID一覧:', staffIds.join(', '));

    // 曜日名
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

    // 週番号を計算する関数
    const getWeekInfo = (dateStr) => {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = date.getMonth();
      const dayOfWeek = date.getDay();
      const dayOfMonth = date.getDate();

      let weekCount = 0;
      for (let d = 1; d <= dayOfMonth; d++) {
        const checkDate = new Date(year, month, d);
        if (checkDate.getDay() === dayOfWeek) {
          weekCount++;
        }
      }
      return { weekNumber: weekCount, dayOfWeek };
    };

    // 全体の集計
    let totalMatch = 0;
    let totalMismatch = 0;
    let totalNotFound = 0;
    let totalJanShifts = 0;
    let totalFebShifts = 0;
    const mismatchDetails = [];
    const staffSummary = [];

    for (const staffId of staffIds) {
      // 2026/01 SECONDのシフト（コピー元）
      const janSecond = await client.query(`
        SELECT
          s.shift_date,
          EXTRACT(DOW FROM s.shift_date) as day_of_week,
          s.start_time,
          s.end_time,
          s.store_id
        FROM ops.shifts s
        JOIN ops.shift_plans p ON s.plan_id = p.plan_id
        WHERE p.tenant_id = 3 AND p.plan_year = 2026 AND p.plan_month = 1
          AND p.plan_type = 'SECOND' AND s.staff_id = $1
        ORDER BY s.shift_date, s.start_time
      `, [staffId]);

      // 2026/02 FIRSTのシフト（コピー先）
      const febFirst = await client.query(`
        SELECT
          s.shift_date,
          EXTRACT(DOW FROM s.shift_date) as day_of_week,
          s.start_time,
          s.end_time,
          s.store_id
        FROM ops.shifts s
        JOIN ops.shift_plans p ON s.plan_id = p.plan_id
        WHERE p.tenant_id = 3 AND p.plan_year = 2026 AND p.plan_month = 2
          AND p.plan_type = 'FIRST' AND s.staff_id = $1
        ORDER BY s.shift_date, s.start_time
      `, [staffId]);

      totalJanShifts += janSecond.rows.length;
      totalFebShifts += febFirst.rows.length;

      // シフトをキーでグループ化（同じ日に複数シフトがある場合は配列で保持）
      const janByKey = {};
      for (const shift of janSecond.rows) {
        const dateStr = shift.shift_date.toISOString().slice(0,10);
        const { weekNumber, dayOfWeek } = getWeekInfo(shift.shift_date);
        const key = 'w' + weekNumber + '_d' + dayOfWeek;
        if (!janByKey[key]) janByKey[key] = [];
        janByKey[key].push({ dateStr, ...shift });
      }

      const febByKey = {};
      for (const shift of febFirst.rows) {
        const dateStr = shift.shift_date.toISOString().slice(0,10);
        const { weekNumber, dayOfWeek } = getWeekInfo(shift.shift_date);
        const key = 'w' + weekNumber + '_d' + dayOfWeek;
        if (!febByKey[key]) febByKey[key] = [];
        febByKey[key].push({ dateStr, ...shift });
      }

      // マッピング検証
      let staffMatch = 0;
      let staffMismatch = 0;
      let staffNotFound = 0;

      for (const key of Object.keys(janByKey)) {
        const janShifts = janByKey[key];
        const febShifts = febByKey[key] || [];

        // 各シフトを比較
        for (const jan of janShifts) {
          // 対応する2月のシフトを探す
          const matchingFeb = febShifts.find(feb =>
            feb.start_time === jan.start_time &&
            feb.end_time === jan.end_time &&
            feb.store_id === jan.store_id
          );

          if (matchingFeb) {
            staffMatch++;
            totalMatch++;
          } else if (febShifts.length > 0) {
            // 2月にシフトはあるが、時間や店舗が異なる
            staffMismatch++;
            totalMismatch++;
            mismatchDetails.push({
              staffId,
              key,
              jan: jan.dateStr + ' ' + jan.start_time + '-' + jan.end_time + ' store=' + jan.store_id,
              feb: febShifts.map(f => f.dateStr + ' ' + f.start_time + '-' + f.end_time + ' store=' + f.store_id).join(' / ')
            });
          } else {
            // 2月に対応するシフトがない
            staffNotFound++;
            totalNotFound++;
          }
        }
      }

      staffSummary.push({
        staffId,
        janCount: janSecond.rows.length,
        febCount: febFirst.rows.length,
        match: staffMatch,
        mismatch: staffMismatch,
        notFound: staffNotFound
      });
    }

    // 結果出力
    console.log('\n' + '='.repeat(70));
    console.log('全体サマリー');
    console.log('='.repeat(70));
    console.log('1月SECONDの総シフト数:', totalJanShifts);
    console.log('2月FIRSTの総シフト数:', totalFebShifts);
    console.log('');
    console.log('マッピング結果:');
    console.log('  ✓ 一致:', totalMatch);
    console.log('  ⚠ 不一致:', totalMismatch);
    console.log('  ✗ 1月のみ（2月に対応なし）:', totalNotFound);
    console.log('');
    console.log('一致率:', ((totalMatch / totalJanShifts) * 100).toFixed(1) + '%');

    // 不一致があるスタッフ
    const problemStaff = staffSummary.filter(s => s.mismatch > 0);
    if (problemStaff.length > 0) {
      console.log('\n' + '='.repeat(70));
      console.log('不一致があるスタッフ');
      console.log('='.repeat(70));
      for (const s of problemStaff) {
        console.log('  スタッフID ' + s.staffId + ': 一致=' + s.match + ', 不一致=' + s.mismatch + ', 1月のみ=' + s.notFound);
      }
    }

    // 不一致の詳細（最初の10件）
    if (mismatchDetails.length > 0) {
      console.log('\n' + '='.repeat(70));
      console.log('不一致の詳細（最大20件）');
      console.log('='.repeat(70));
      for (const d of mismatchDetails.slice(0, 20)) {
        console.log('  スタッフ' + d.staffId + ' [' + d.key + ']:');
        console.log('    1月: ' + d.jan);
        console.log('    2月: ' + d.feb);
      }
      if (mismatchDetails.length > 20) {
        console.log('  ... 他 ' + (mismatchDetails.length - 20) + ' 件');
      }
    }

    // 1月のみのシフトが多いスタッフ
    const notFoundStaff = staffSummary.filter(s => s.notFound > 0).sort((a, b) => b.notFound - a.notFound);
    if (notFoundStaff.length > 0) {
      console.log('\n' + '='.repeat(70));
      console.log('1月のみのシフトがあるスタッフ（2月に対応日がない）');
      console.log('='.repeat(70));
      for (const s of notFoundStaff.slice(0, 10)) {
        console.log('  スタッフID ' + s.staffId + ': 1月のみ=' + s.notFound + '件 (1月' + s.janCount + '件→2月' + s.febCount + '件)');
      }
    }

  } finally {
    client.release();
    pool.end();
  }
}
run().catch(console.error);
