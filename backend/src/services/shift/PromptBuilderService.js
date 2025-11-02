/**
 * プロンプト生成サービス
 * マスターデータをAI用プロンプトに変換
 */
class PromptBuilderService {
  /**
   * マスターデータをAI用プロンプトに変換
   * @param {Object} masterData - collectMasterDataの結果
   * @returns {Object} {system, user} プロンプト
   */
  buildPrompt(masterData) {
    return {
      system: this.buildSystemPrompt(),
      user: this.buildUserPrompt(masterData)
    }
  }

  /**
   * システムプロンプト生成
   */
  buildSystemPrompt() {
    return `あなたはシフト作成の専門家です。
労働基準法を遵守し、店舗の営業に必要な人員を確保しながら、最適なシフトを作成してください。

**重要な制約**:
1. 週の労働時間は40時間以内 (正社員は月173時間以内)
2. 連続勤務日数は6日以内
3. 営業時間中は常時最低2名以上のスタッフを配置
4. 各スタッフの雇用形態に応じた適切な勤務時間を設定

**出力形式**: 必ずJSON形式で以下のスキーマに従ってください。
{
  "shifts": [
    {
      "staff_id": number,
      "shift_date": "YYYY-MM-DD",
      "pattern_id": number,
      "start_time": "HH:MM:SS",
      "end_time": "HH:MM:SS",
      "break_minutes": number
    }
  ]
}

**注意事項**:
- shift_dateは必ず指定された年月の範囲内にしてください
- start_timeとend_timeは24時間形式で記載してください
- すべてのスタッフに公平にシフトを割り当ててください`
  }

  /**
   * ユーザープロンプト生成
   */
  buildUserPrompt(masterData) {
    const { staff, shiftPatterns, constraints, storeInfo, period } = masterData

    return `## シフト作成依頼

【対象期間】
${period.year}年${period.month}月 (${period.daysInMonth}日間)

【店舗情報】
- 店舗名: ${storeInfo?.store_name || '未設定'}
- 営業時間: ${storeInfo?.business_hours_start || '09:00'} - ${storeInfo?.business_hours_end || '22:00'}

【スタッフ情報】(${staff.length}名)
${this.formatStaff(staff)}

【利用可能なシフトパターン】(${shiftPatterns.length}種類)
${this.formatShiftPatterns(shiftPatterns)}

【制約条件】
${this.formatConstraints(constraints)}

**タスク**:
上記の情報をもとに、${period.year}年${period.month}月(${period.daysInMonth}日間)のシフトを作成してください。
各スタッフの雇用形態に応じて適切な勤務時間を設定し、すべての制約を満たすようにしてください。`
  }

  /**
   * スタッフ情報をフォーマット
   */
  formatStaff(staff) {
    if (!staff || staff.length === 0) {
      return '  スタッフ情報がありません'
    }

    return staff.map((s, index) => {
      const hourlyInfo = s.hourly_rate
        ? `時給${s.hourly_rate}円`
        : s.monthly_salary
        ? `月給${s.monthly_salary}円`
        : '時給未設定'

      return `${index + 1}. ${s.name} (ID: ${s.staff_id})
   - 雇用形態: ${s.employment_type || '未設定'}
   - ${hourlyInfo}
   - 役職: ${s.role_name || '一般'}`
    }).join('\n\n')
  }

  /**
   * シフトパターンをフォーマット
   */
  formatShiftPatterns(patterns) {
    if (!patterns || patterns.length === 0) {
      return '  シフトパターンが登録されていません'
    }

    return patterns.map((p, index) => {
      return `${index + 1}. ${p.pattern_name} (ID: ${p.pattern_id})
   - 時間: ${p.start_time} - ${p.end_time}
   - 休憩: ${p.break_minutes}分`
    }).join('\n\n')
  }

  /**
   * 制約条件をフォーマット
   */
  formatConstraints(constraints) {
    const { labor, store } = constraints

    let formatted = '【労働法制約】\n'
    if (labor && labor.length > 0) {
      formatted += labor.map(c => {
        return `- ${c.constraint_name}: ${c.description || c.constraint_rule}`
      }).join('\n')
    } else {
      formatted += '- 週の労働時間: 40時間以内\n'
      formatted += '- 連続勤務日数: 6日以内'
    }

    formatted += '\n\n【店舗制約】\n'
    if (store && store.length > 0) {
      formatted += store.map(c => {
        return `- ${c.constraint_type}: ${c.constraint_value} (${c.description || ''})`
      }).join('\n')
    } else {
      formatted += '- 営業時間中は常時2名以上配置'
    }

    return formatted
  }
}

export default PromptBuilderService
