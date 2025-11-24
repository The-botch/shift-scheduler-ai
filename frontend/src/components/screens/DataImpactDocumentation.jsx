import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  BookOpen,
  Database,
  Users,
  Store,
  Calendar,
  Settings,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '../ui/button'

const DataImpactDocumentation = ({ onPrev }) => {
  const [selectedCategory, setSelectedCategory] = useState('overview')

  const impactLevels = {
    low: {
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      label: '低影響',
    },
    medium: {
      icon: Info,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      label: '中影響',
    },
    high: {
      icon: AlertTriangle,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      label: '高影響',
    },
    critical: {
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      label: '最高影響',
    },
  }

  const masterDataItems = [
    {
      id: 'tenant',
      name: 'テナント（企業）',
      icon: Database,
      fields: [
        {
          name: 'テナント名',
          impact: 'low',
          description: '表示のみに影響。システム動作に影響なし。',
        },
        {
          name: '契約プラン',
          impact: 'medium',
          description:
            '機能制限に影響。上位プランへの変更は安全、下位プランへの変更は機能制限が発生。',
        },
        {
          name: '上限値（店舗数/スタッフ数）',
          impact: 'high',
          description: '既存データが上限を超える場合はエラー。必ず既存データ数を確認してから変更。',
        },
        {
          name: 'テナント削除',
          impact: 'critical',
          description: '⚠️ 全関連データが削除されます。絶対に実行しないでください。',
        },
      ],
      relatedTables: ['全テーブル'],
      relatedScreens: ['全画面'],
    },
    {
      id: 'store',
      name: '店舗',
      icon: Store,
      fields: [
        { name: '店舗名', impact: 'low', description: '表示のみに影響。' },
        { name: '店舗コード', impact: 'low', description: '表示・検索に影響。' },
        {
          name: '営業時間',
          impact: 'medium',
          description: 'シフトパターンとの整合性チェックが必要。矛盾がある場合は警告表示。',
        },
        { name: '住所・連絡先', impact: 'low', description: '表示のみに影響。' },
        {
          name: '店舗削除',
          impact: 'critical',
          description: '⚠️ 所属スタッフとシフトデータの再配置が必要。削除前に必ず確認。',
        },
      ],
      relatedTables: ['hr.staff', 'ops.shift_plans', 'ops.shifts', 'core.shift_patterns'],
      relatedScreens: ['シフト管理', 'スタッフ管理', 'ダッシュボード'],
      warnings: [
        '営業時間を変更する場合、既存のシフトパターンとの矛盾がないか確認してください。',
        '店舗を削除する場合、所属スタッフを別の店舗に移動してください。',
      ],
    },
    {
      id: 'staff',
      name: 'スタッフ',
      icon: Users,
      fields: [
        { name: '氏名・連絡先', impact: 'low', description: '表示のみに影響。' },
        { name: 'スタッフコード', impact: 'low', description: '検索に影響。' },
        {
          name: '時給',
          impact: 'high',
          description: '⚠️ 既存シフトの人件費再計算が必要。変更後は必ずシフト計画の人件費を確認。',
        },
        {
          name: '月給',
          impact: 'high',
          description: '⚠️ 給与計算に影響。変更後は給与データを確認。',
        },
        {
          name: '雇用形態',
          impact: 'high',
          description: '⚠️ 労働時間制約が変更されます。既存シフトが制約違反になる可能性あり。',
        },
        {
          name: '所属店舗',
          impact: 'critical',
          description: '⚠️ 既存のシフト割当を見直す必要があります。変更前に必ずシフト状況を確認。',
        },
        {
          name: '退職日',
          impact: 'critical',
          description:
            '⚠️ 未来のシフトから自動削除されます。シフトに穴が開くため、管理者に通知が必要。',
        },
        {
          name: 'スタッフ削除',
          impact: 'critical',
          description: '⚠️ シフトデータとの関連削除が必要。論理削除を推奨。',
        },
      ],
      relatedTables: ['ops.shifts', 'ops.shift_preferences', 'hr.staff_skills', 'hr.payroll'],
      relatedScreens: ['シフト管理', 'スタッフ管理', 'ダッシュボード', '予実管理'],
      warnings: [
        '時給を変更した場合、既存の未確定シフトの人件費を再計算してください。',
        '雇用形態を変更した場合、労働時間制約をチェックしてください。',
        '店舗を変更する場合、既存のシフト割当を確認してください。',
        '退職日を設定する場合、未来のシフトから削除されることを管理者に通知してください。',
      ],
      procedures: [
        {
          title: 'スタッフ時給変更の手順',
          steps: [
            'スタッフ管理画面で時給を変更',
            '変更対象のスタッフが割り当てられているシフト計画を確認',
            'シフト管理画面で該当月の人件費合計を確認',
            '予算を超えている場合はシフトを調整',
          ],
        },
        {
          title: 'スタッフ退職処理の手順',
          steps: [
            'スタッフ管理画面で退職日を設定',
            'シフト管理画面で未来のシフトを確認（自動削除されます）',
            '削除されたシフトの穴を埋めるため、他のスタッフに再割当',
            '管理者に退職とシフト調整を通知',
          ],
        },
      ],
    },
    {
      id: 'role',
      name: '役職',
      icon: ShieldAlert,
      fields: [
        { name: '役職名', impact: 'low', description: '表示のみに影響。' },
        { name: '表示順序', impact: 'low', description: 'ソート順に影響。' },
        {
          name: '役職削除',
          impact: 'medium',
          description: '使用中のスタッフがいる場合は削除不可。未使用の場合のみ論理削除可能。',
        },
      ],
      relatedTables: ['hr.staff'],
      relatedScreens: ['スタッフ管理', 'マスター管理'],
      warnings: ['削除前に、その役職を使用しているスタッフがいないか確認してください。'],
    },
    {
      id: 'skill',
      name: 'スキル',
      icon: Settings,
      fields: [
        { name: 'スキル名', impact: 'low', description: '表示のみに影響。' },
        { name: 'カテゴリ', impact: 'low', description: 'グルーピング表示に影響。' },
        {
          name: 'スキル削除',
          impact: 'medium',
          description: 'スタッフスキルとの関連削除が必要。AI生成時のスキルマッチングに影響。',
        },
      ],
      relatedTables: ['hr.staff_skills', 'ops.shifts.assigned_skills'],
      relatedScreens: ['スタッフ管理', 'マスター管理', 'AI生成'],
      warnings: [
        'スキルを削除すると、スタッフのスキル情報も削除されます。',
        'AI自動生成時のスキルマッチングに影響があります。',
      ],
    },
    {
      id: 'employment_type',
      name: '雇用形態',
      icon: Users,
      fields: [
        { name: '雇用形態名', impact: 'low', description: '表示のみに影響。' },
        {
          name: '給与タイプ（時給/月給）',
          impact: 'high',
          description: '⚠️ 給与計算ロジックに影響。変更は慎重に。',
        },
        {
          name: '雇用形態削除',
          impact: 'medium',
          description: '使用中のスタッフがいる場合は削除不可。',
        },
      ],
      relatedTables: ['hr.staff', 'hr.payroll'],
      relatedScreens: ['スタッフ管理', '給与計算'],
      warnings: [
        '給与タイプを変更すると、給与計算ロジックが変わります。必ず確認してから変更してください。',
      ],
    },
    {
      id: 'shift_pattern',
      name: 'シフトパターン',
      icon: Calendar,
      fields: [
        { name: 'パターン名（早番/遅番等）', impact: 'low', description: '表示のみに影響。' },
        { name: 'パターンコード', impact: 'low', description: '表示のみに影響。' },
        {
          name: '開始時間・終了時間',
          impact: 'medium',
          description:
            '既存シフトには影響なし。新規登録時のみ適用。店舗営業時間との整合性確認が必要。',
        },
        {
          name: '休憩時間',
          impact: 'medium',
          description: '既存シフトには影響なし。新規登録時のみ適用。',
        },
        {
          name: 'パターン削除',
          impact: 'medium',
          description: '使用中のシフトがある場合は削除不可。',
        },
      ],
      relatedTables: ['ops.shifts'],
      relatedScreens: ['シフト管理', 'マスター管理'],
      warnings: [
        'シフトパターンの時間を変更しても、既存のシフトには影響しません。',
        '削除前に、そのパターンを使用しているシフトがないか確認してください。',
      ],
    },
    {
      id: 'shift_plan',
      name: 'シフト計画',
      icon: Calendar,
      fields: [
        { name: '計画名', impact: 'low', description: '表示のみに影響。' },
        { name: 'ステータス', impact: 'medium', description: 'UI表示とボタン制御に影響。' },
        {
          name: '年月',
          impact: 'critical',
          description: '⚠️ 絶対に変更しないでください。日付整合性が破綻します。',
        },
        {
          name: '計画削除',
          impact: 'critical',
          description: '⚠️ 全シフトデータが削除されます。実行前に必ず確認。',
        },
      ],
      relatedTables: ['ops.shifts', 'ops.shift_issues'],
      relatedScreens: ['シフト管理', 'ダッシュボード', '履歴'],
      warnings: [
        'シフト計画の年月は絶対に変更しないでください。',
        '削除する場合、全シフトデータが削除されることを理解してください。',
      ],
    },
    {
      id: 'shift',
      name: 'シフト（実績/計画）',
      icon: Calendar,
      fields: [
        {
          name: 'シフト日付',
          impact: 'critical',
          description: '⚠️ 月別集計が狂います。基本的に変更不可。',
        },
        {
          name: '開始時間・終了時間',
          impact: 'high',
          description: '⚠️ 労働時間と人件費の再計算が必要。',
        },
        { name: '休憩時間', impact: 'high', description: '⚠️ 実労働時間の再計算が必要。' },
        {
          name: '割当スタッフ',
          impact: 'high',
          description: '⚠️ スキル要件との整合性チェックが必要。',
        },
        {
          name: 'シフト削除',
          impact: 'high',
          description: '⚠️ カバレッジスコアの再計算が必要。シフトの穴が開きます。',
        },
      ],
      relatedTables: ['hr.staff', 'ops.shift_plans', 'core.shift_patterns'],
      relatedScreens: ['シフト管理', 'ダッシュボード', 'モニタリング'],
      warnings: [
        'シフト時間を変更した場合、人件費を再計算してください。',
        'スタッフを変更する場合、必要なスキルを持っているか確認してください。',
        'シフトを削除すると、カバレッジが不足する可能性があります。',
      ],
    },
  ]

  const impactCategories = [
    {
      id: 'low',
      name: '低影響（表示のみ）',
      icon: CheckCircle,
      color: 'green',
      items: [
        'テナント名変更',
        '店舗名変更',
        'スタッフ名変更',
        '役職名変更',
        'スキル名変更',
        '雇用形態名変更',
        'シフトパターン名変更',
      ],
      description:
        'これらの変更は表示にのみ影響し、システムの動作や計算には影響しません。安全に変更できます。',
    },
    {
      id: 'medium',
      name: '中影響（一部再計算必要）',
      icon: Info,
      color: 'yellow',
      items: [
        '店舗営業時間変更 → シフトパターンとの整合性チェック',
        'シフトパターンの時間変更 → 新規シフト登録のみ影響',
        '役職・スキル削除 → 使用中チェック必要',
        'シフト希望の追加・変更 → AI生成時の考慮',
      ],
      description: '一部のデータや画面に影響があります。変更後は関連データを確認してください。',
    },
    {
      id: 'high',
      name: '高影響（再計算・再検証必要）',
      icon: AlertTriangle,
      color: 'orange',
      items: [
        'スタッフ時給変更 → 既存シフトの人件費再計算',
        'スタッフ雇用形態変更 → 労働時間制約の再検証',
        'シフト時間変更 → 労働時間・人件費再計算',
        'シフト削除 → カバレッジスコア再計算',
        '店舗削除 → スタッフ・シフトの再配置',
      ],
      description:
        '重要なデータに影響があります。変更前に影響範囲を確認し、変更後は必ず再計算してください。',
    },
    {
      id: 'critical',
      name: '最高影響（データ整合性リスク）',
      icon: XCircle,
      color: 'red',
      items: [
        'スタッフ店舗変更 → 既存シフト割当の見直し',
        'スタッフ退職日設定 → 未来のシフトから削除',
        'シフト計画削除 → 全シフトデータの削除',
        'シフト計画の年月変更 → 日付整合性の破綻（非推奨）',
        'テナント削除 → 全関連データのカスケード削除',
      ],
      description:
        'データ整合性に重大な影響があります。実行前に必ず管理者に確認し、バックアップを取ってください。',
    },
  ]

  const renderImpactBadge = impact => {
    const level = impactLevels[impact]
    const Icon = level.icon
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${level.bg} ${level.color} ${level.border} border`}
      >
        <Icon className="h-3 w-3" />
        {level.label}
      </span>
    )
  }

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">このドキュメントについて</h3>
            <p className="text-sm text-blue-800">
              マスターデータを変更する際の影響範囲と注意点をまとめています。
              データ修正前に必ず確認し、影響範囲を理解してから作業を行ってください。
            </p>
          </div>
        </div>
      </div>

      {impactCategories.map(category => {
        const Icon = category.icon
        return (
          <div
            key={category.id}
            className={`bg-${category.color}-50 border border-${category.color}-200 rounded-lg p-4`}
          >
            <div className="flex items-start gap-3 mb-3">
              <Icon className={`h-5 w-5 text-${category.color}-600 mt-0.5`} />
              <div>
                <h3 className={`font-semibold text-${category.color}-900 mb-1`}>{category.name}</h3>
                <p className={`text-sm text-${category.color}-800 mb-2`}>{category.description}</p>
              </div>
            </div>
            <ul className="space-y-1 ml-8">
              {category.items.map((item, idx) => (
                <li key={idx} className={`text-sm text-${category.color}-700`}>
                  • {item}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )

  const renderMasterDataDetail = () => {
    const selectedItem = masterDataItems.find(item => item.id === selectedCategory)
    if (!selectedItem) return null

    const Icon = selectedItem.icon

    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{selectedItem.name}</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">影響するテーブル</h3>
              <div className="flex flex-wrap gap-2">
                {selectedItem.relatedTables.map((table, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-md font-mono"
                  >
                    {table}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">影響する画面</h3>
              <div className="flex flex-wrap gap-2">
                {selectedItem.relatedScreens.map((screen, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">
                    {screen}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">項目別影響度</h3>
          <div className="space-y-3">
            {selectedItem.fields.map((field, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-slate-800">{field.name}</h4>
                  {renderImpactBadge(field.impact)}
                </div>
                <p className="text-sm text-slate-600">{field.description}</p>
              </div>
            ))}
          </div>
        </div>

        {selectedItem.warnings && selectedItem.warnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <h3 className="text-lg font-semibold text-yellow-900">注意事項</h3>
            </div>
            <ul className="space-y-2 ml-8">
              {selectedItem.warnings.map((warning, idx) => (
                <li key={idx} className="text-sm text-yellow-800">
                  ⚠️ {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {selectedItem.procedures && selectedItem.procedures.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">推奨手順</h3>
            <div className="space-y-4">
              {selectedItem.procedures.map((procedure, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-slate-800 mb-2">{procedure.title}</h4>
                  <ol className="space-y-1">
                    {procedure.steps.map((step, stepIdx) => (
                      <li key={stepIdx} className="text-sm text-slate-600">
                        {stepIdx + 1}. {step}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* ヘッダー */}
          <div className="mb-6">
            <Button variant="ghost" onClick={onPrev} className="mb-4">
              ← 戻る
            </Button>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">データ影響範囲ドキュメント</h1>
                <p className="text-slate-600">マスターデータ変更時の影響範囲と注意点</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* 左サイドバー：カテゴリ選択 */}
            <div className="col-span-3">
              <div className="bg-white rounded-lg border border-slate-200 p-4 sticky top-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">カテゴリ</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory('overview')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedCategory === 'overview'
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      概要
                    </div>
                  </button>
                  {masterDataItems.map(item => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedCategory(item.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedCategory === item.id
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {item.name}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* メインコンテンツ */}
            <div className="col-span-9">
              {selectedCategory === 'overview' ? renderOverview() : renderMasterDataDetail()}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default DataImpactDocumentation
