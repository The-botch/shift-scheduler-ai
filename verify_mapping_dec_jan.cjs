const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:BWmHYBbEZqnptZRYmptockuomkHRWNPO@switchyard.proxy.rlwy.net:26491/railway'
});

async function run() {
  const client = await pool.connect();
  try {
    // 2025/12 SECOND と 2026/01 FIRST の両方に存在する全スタッフを取得
    const staffResult = await client.query(`
      SELECT DISTINCT s1.staff_id
      FROM ops.shifts s1
      JOIN ops.shift_plans p1 ON s1.plan_id = p1.plan_id
      WHERE p1.tenant_id = 3 AND p1.plan_year = 2025 AND p1.plan_month = 12 AND p1.plan_type = 'SECOND'
      AND EXISTS (
        SELECT 1 FROM ops.shifts s2
        JOIN ops.shift_plans p2 ON s2.plan_id = p2.plan_id
        WHERE p2.tenant_id = 3 AND p2.plan_year = 2026 AND p2.plan_month = 1 AND p2.plan_type = 'FIRST'
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
    let totalDecShifts = 0;
    let totalJanShifts = 0;
    const mismatchDetails = [];
    const staffSummary = [];

    for (const staffId of staffIds) {
      // 2025/12 SECONDのシフト（コピー元）
      const decSecond = await client.query(`
        SELECT
          s.shift_date,
          EXTRACT(DOW FROM s.shift_date) as day_of_week,
          s.start_time,
          s.end_time,
          s.store_id
        FROM ops.shifts s
        JOIN ops.shift_plans p ON s.plan_id = p.plan_id
        WHERE p.tenant_id = 3 AND p.plan_year = 2025 AND p.plan_month = 12
          AND p.plan_type = 'SECOND' AND s.staff_id = $1
        ORDER BY s.shift_date, s.start_time
      `, [staffId]);

      // 2026/01 FIRSTのシフト（コピー先）
      const janFirst = await client.query(`
        SELECT
          s.shift_date,
          EXTRACT(DOW FROM s.shift_date) as day_of_week,
          s.start_time,
          s.end_time,
          s.store_id
        FROM ops.shifts s
        JOIN ops.shift_plans p ON s.plan_id = p.plan_id
        WHERE p.tenant_id = 3 AND p.plan_year = 2026 AND p.plan_month = 1
          AND p.plan_type = 'FIRST' AND s.staff_id = $1
        ORDER BY s.shift_date, s.start_time
      `, [staffId]);

      totalDecShifts += decSecond.rows.length;
      totalJanShifts += janFirst.rows.length;

      // シフトをキーでグループ化（同じ日に複数シフトがある場合は配列で保持）
      const decByKey = {};
      for (const shift of decSecond.rows) {
        const dateStr = shift.shift_date.toISOString().slice(0,10);
        const { weekNumber, dayOfWeek } = getWeekInfo(shift.shift_date);
        const key = 'w' + weekNumber + '_d' + dayOfWeek;
        if (!decByKey[key]) decByKey[key] = [];
        decByKey[key].push({ dateStr, ...shift });
      }

      const janByKey = {};
      for (const shift of janFirst.rows) {
        const dateStr = shift.shift_date.toISOString().slice(0,10);
        const { weekNumber, dayOfWeek } = getWeekInfo(shift.shift_date);
        const key = 'w' + weekNumber + '_d' + dayOfWeek;
        if (!janByKey[key]) janByKey[key] = [];
        janByKey[key].push({ dateStr, ...shift });
      }

      // マッピング検証
      let staffMatch = 0;
      let staffMismatch = 0;
      let staffNotFound = 0;

      for (const key of Object.keys(decByKey)) {
        const decShifts = decByKey[key];
        const janShifts = janByKey[key] || [];

        // 各シフトを比較
        for (const dec of decShifts) {
          // 対応する1月のシフトを探す
          const matchingJan = janShifts.find(jan =>
            jan.start_time === dec.start_time &&
            jan.end_time === dec.end_time &&
            jan.store_id === dec.store_id
          );

          if (matchingJan) {
            staffMatch++;
            totalMatch++;
          } else if (janShifts.length > 0) {
            // 1月にシフトはあるが、時間や店舗が異なる
            staffMismatch++;
            totalMismatch++;
            mismatchDetails.push({
              staffId,
              key,
              dec: dec.dateStr + ' ' + dec.start_time + '-' + dec.end_time + ' store=' + dec.store_id,
              jan: janShifts.map(j => j.dateStr + ' ' + j.start_time + '-' + j.end_time + ' store=' + j.store_id).join(' / ')
            });
          } else {
            // 1月に対応するシフトがない
            staffNotFound++;
            totalNotFound++;
          }
        }
      }

      staffSummary.push({
        staffId,
        decCount: decSecond.rows.length,
        janCount: janFirst.rows.length,
        match: staffMatch,
        mismatch: staffMismatch,
        notFound: staffNotFound
      });
    }

    // 結果出力
    console.log('\n' + '='.repeat(70));
    console.log('全体サマリー（2025/12 SECOND → 2026/01 FIRST）');
    console.log('='.repeat(70));
    console.log('12月SECONDの総シフト数:', totalDecShifts);
    console.log('1月FIRSTの総シフト数:', totalJanShifts);
    console.log('');
    console.log('マッピング結果:');
    console.log('  ✓ 一致:', totalMatch);
    console.log('  ⚠ 不一致:', totalMismatch);
    console.log('  ✗ 12月のみ（1月に対応なし）:', totalNotFound);
    console.log('');
    if (totalDecShifts > 0) {
      console.log('一致率:', ((totalMatch / totalDecShifts) * 100).toFixed(1) + '%');
    }

    // 不一致があるスタッフ
    const problemStaff = staffSummary.filter(s => s.mismatch > 0);
    if (problemStaff.length > 0) {
      console.log('\n' + '='.repeat(70));
      console.log('不一致があるスタッフ');
      console.log('='.repeat(70));
      for (const s of problemStaff) {
        console.log('  スタッフID ' + s.staffId + ': 一致=' + s.match + ', 不一致=' + s.mismatch + ', 12月のみ=' + s.notFound);
      }
    }

    // 不一致の詳細（最大20件）
    if (mismatchDetails.length > 0) {
      console.log('\n' + '='.repeat(70));
      console.log('不一致の詳細（最大20件）');
      console.log('='.repeat(70));
      for (const d of mismatchDetails.slice(0, 20)) {
        console.log('  スタッフ' + d.staffId + ' [' + d.key + ']:');
        console.log('    12月: ' + d.dec);
        console.log('    1月: ' + d.jan);
      }
      if (mismatchDetails.length > 20) {
        console.log('  ... 他 ' + (mismatchDetails.length - 20) + ' 件');
      }
    }

    // 12月のみのシフトが多いスタッフ
    const notFoundStaff = staffSummary.filter(s => s.notFound > 0).sort((a, b) => b.notFound - a.notFound);
    if (notFoundStaff.length > 0) {
      console.log('\n' + '='.repeat(70));
      console.log('12月のみのシフトがあるスタッフ（1月に対応日がない）');
      console.log('='.repeat(70));
      for (const s of notFoundStaff.slice(0, 10)) {
        console.log('  スタッフID ' + s.staffId + ': 12月のみ=' + s.notFound + '件 (12月' + s.decCount + '件→1月' + s.janCount + '件)');
      }
    }

  } finally {
    client.release();
    pool.end();
  }
}
run().catch(console.error);
