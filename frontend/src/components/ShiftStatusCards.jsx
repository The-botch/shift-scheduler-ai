/**
 * ShiftStatusCards.jsx
 * シフトダッシュボード用3カードコンポーネント
 *
 * カード:
 * - 募集状況カード（シフト希望提出状況）
 * - 第一案カード（FIRST plan）
 * - 第二案カード（SECOND plan）
 */

// アイコンコンポーネント
const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
)

const ClipboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
    />
  </svg>
)

/**
 * 募集状況カードの設定を取得
 */
const getRecruitmentCardConfig = status => {
  const configs = {
    not_started: {
      bgColor: 'from-slate-50 to-slate-100',
      borderColor: 'border-slate-300',
      iconBg: 'bg-slate-200',
      iconColor: 'text-slate-500',
      titleColor: 'text-slate-700',
      valueColor: 'text-slate-600',
      subColor: 'text-slate-500',
      progressBg: 'bg-slate-200',
      progressFill: 'bg-slate-400',
      buttonBg: 'bg-slate-400 hover:bg-slate-500',
      buttonLabel: '詳細を見る',
    },
    recruiting: {
      bgColor: 'from-green-50 to-green-100',
      borderColor: 'border-green-300',
      iconBg: 'bg-green-200',
      iconColor: 'text-green-600',
      titleColor: 'text-green-800',
      valueColor: 'text-green-700',
      subColor: 'text-green-600',
      progressBg: 'bg-green-200',
      progressFill: 'bg-green-500',
      buttonBg: 'bg-green-500 hover:bg-green-600',
      buttonLabel: '詳細を見る',
    },
    closed: {
      bgColor: 'from-orange-50 to-orange-100',
      borderColor: 'border-orange-300',
      iconBg: 'bg-orange-200',
      iconColor: 'text-orange-600',
      titleColor: 'text-orange-800',
      valueColor: 'text-orange-700',
      subColor: 'text-orange-600',
      progressBg: 'bg-orange-200',
      progressFill: 'bg-orange-500',
      buttonBg: 'bg-orange-500 hover:bg-orange-600',
      buttonLabel: '詳細を見る',
    },
    finished: {
      bgColor: 'from-slate-50 to-slate-100',
      borderColor: 'border-slate-300',
      iconBg: 'bg-slate-200',
      iconColor: 'text-slate-500',
      titleColor: 'text-slate-700',
      valueColor: 'text-slate-600',
      subColor: 'text-slate-500',
      progressBg: 'bg-slate-200',
      progressFill: 'bg-slate-400',
      buttonBg: 'bg-slate-400 hover:bg-slate-500',
      buttonLabel: '履歴を見る',
    },
  }
  return configs[status] || configs.recruiting
}

/**
 * 第一案/第二案カードの設定を取得
 */
const getPlanCardConfig = status => {
  const configs = {
    unavailable: {
      bgColor: 'from-slate-50 to-slate-100',
      borderColor: 'border-slate-300',
      iconBg: 'bg-slate-200',
      iconColor: 'text-slate-400',
      titleColor: 'text-slate-500',
      valueColor: 'text-slate-500',
      subColor: 'text-slate-400',
      buttonBg: 'bg-slate-300 cursor-not-allowed',
      buttonLabel: '作成不可',
      statusLabel: '作成不可',
      subText: '第一案承認後に作成可能',
      disabled: true,
      opacity: 'opacity-60',
    },
    not_started: {
      bgColor: 'from-slate-50 to-slate-100',
      borderColor: 'border-slate-300',
      iconBg: 'bg-slate-200',
      iconColor: 'text-slate-500',
      titleColor: 'text-slate-700',
      valueColor: 'text-slate-600',
      subColor: 'text-slate-500',
      buttonBg: 'bg-blue-500 hover:bg-blue-600',
      buttonLabel: '作成開始',
      statusLabel: '未作成',
      subText: '作成を開始してください',
      disabled: false,
      opacity: '',
    },
    draft: {
      bgColor: 'from-amber-50 to-amber-100',
      borderColor: 'border-amber-300',
      iconBg: 'bg-amber-200',
      iconColor: 'text-amber-600',
      titleColor: 'text-amber-800',
      valueColor: 'text-amber-700',
      subColor: 'text-amber-600',
      buttonBg: 'bg-amber-500 hover:bg-amber-600',
      buttonLabel: '編集を続ける',
      statusLabel: '作成中',
      subText: '下書き保存済み',
      disabled: false,
      opacity: '',
    },
    approved: {
      bgColor: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-300',
      iconBg: 'bg-blue-200',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-800',
      valueColor: 'text-blue-700',
      subColor: 'text-blue-600',
      buttonBg: 'bg-blue-500 hover:bg-blue-600',
      buttonLabel: '編集する',
      statusLabel: '承認済',
      subText: '承認済み',
      disabled: false,
      opacity: '',
    },
  }
  return configs[status] || configs.not_started
}

/**
 * 募集状況カード
 */
const RecruitmentCard = ({ recruitmentStatus, onClick }) => {
  const config = getRecruitmentCardConfig(recruitmentStatus.status)

  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-br ${config.bgColor} border-2 ${config.borderColor} rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
    >
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 ${config.iconBg} rounded-full flex items-center justify-center`}>
          <span className={config.iconColor}>
            <ClockIcon />
          </span>
        </div>
        <span className={`text-base font-semibold ${config.titleColor}`}>シフト募集</span>
      </div>

      {/* ステータス */}
      <div className={`text-2xl font-bold ${config.valueColor} mb-1`}>
        {recruitmentStatus.statusLabel}
      </div>
      <div className={`text-sm ${config.subColor} mb-3`}>{recruitmentStatus.deadline}</div>

      {/* プログレスバー */}
      <div className="flex items-center gap-2 mb-1">
        <div className={`flex-1 ${config.progressBg} rounded-full h-2`}>
          <div
            className={`${config.progressFill} h-2 rounded-full transition-all duration-300`}
            style={{ width: `${recruitmentStatus.submissionRate}%` }}
          />
        </div>
        <span className={`text-xs ${config.valueColor} font-medium`}>
          {recruitmentStatus.submissionRate}%
        </span>
      </div>
      <div className={`text-xs ${config.subColor}`}>
        {recruitmentStatus.submittedCount}/{recruitmentStatus.totalCount}名が提出済み
      </div>

      {/* ボタン */}
      <div className="mt-3">
        <button
          className={`w-full ${config.buttonBg} text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors`}
        >
          {config.buttonLabel} &rarr;
        </button>
      </div>
    </div>
  )
}

/**
 * 第一案カード
 */
const FirstPlanCard = ({ firstPlanStatus, onClick }) => {
  const config = getPlanCardConfig(firstPlanStatus.status)

  return (
    <div
      onClick={!config.disabled ? onClick : undefined}
      className={`bg-gradient-to-br ${config.bgColor} border-2 ${config.borderColor} rounded-xl p-5 shadow-sm ${
        !config.disabled ? 'hover:shadow-md cursor-pointer' : ''
      } transition-shadow ${config.opacity}`}
    >
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 ${config.iconBg} rounded-full flex items-center justify-center`}>
          <span className={config.iconColor}>
            <DocumentIcon />
          </span>
        </div>
        <span className={`text-base font-semibold ${config.titleColor}`}>第一案</span>
      </div>

      {/* ステータス */}
      <div className={`text-2xl font-bold ${config.valueColor} mb-1`}>{config.statusLabel}</div>
      <div className={`text-sm ${config.subColor} mb-3`}>{config.subText}</div>

      {/* ボタン */}
      <div className="mt-3">
        <button
          disabled={config.disabled}
          className={`w-full ${config.buttonBg} text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors ${
            config.disabled ? 'text-slate-500' : ''
          }`}
        >
          {config.buttonLabel} {!config.disabled && <>&rarr;</>}
        </button>
      </div>
    </div>
  )
}

/**
 * 第二案カード
 */
const SecondPlanCard = ({ secondPlanStatus, onClick }) => {
  const config = getPlanCardConfig(secondPlanStatus.status)

  return (
    <div
      onClick={!config.disabled ? onClick : undefined}
      className={`bg-gradient-to-br ${config.bgColor} border-2 ${config.borderColor} rounded-xl p-5 shadow-sm ${
        !config.disabled ? 'hover:shadow-md cursor-pointer' : ''
      } transition-shadow ${config.opacity}`}
    >
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 ${config.iconBg} rounded-full flex items-center justify-center`}>
          <span className={config.iconColor}>
            <ClipboardIcon />
          </span>
        </div>
        <span className={`text-base font-semibold ${config.titleColor}`}>第二案</span>
      </div>

      {/* ステータス */}
      <div className={`text-2xl font-bold ${config.valueColor} mb-1`}>{config.statusLabel}</div>
      <div className={`text-sm ${config.subColor} mb-3`}>{config.subText}</div>

      {/* ボタン */}
      <div className="mt-3">
        <button
          disabled={config.disabled}
          className={`w-full ${config.buttonBg} text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors ${
            config.disabled ? 'text-slate-500' : ''
          }`}
        >
          {config.buttonLabel} {!config.disabled && <>&rarr;</>}
        </button>
      </div>
    </div>
  )
}

/**
 * シフトステータスカードコンポーネント
 * @param {Object} props
 * @param {number} props.year - 対象年
 * @param {number} props.month - 対象月
 * @param {Object} props.recruitmentStatus - 募集状況データ
 * @param {Object} props.firstPlanStatus - 第一案ステータスデータ
 * @param {Object} props.secondPlanStatus - 第二案ステータスデータ
 * @param {Function} props.onRecruitmentClick - 募集状況カードクリック時
 * @param {Function} props.onFirstPlanClick - 第一案カードクリック時
 * @param {Function} props.onSecondPlanClick - 第二案カードクリック時
 */
const ShiftStatusCards = ({
  recruitmentStatus,
  firstPlanStatus,
  secondPlanStatus,
  onRecruitmentClick,
  onFirstPlanClick,
  onSecondPlanClick,
}) => {
  return (
    <div className="grid grid-cols-3 gap-5 max-w-5xl w-full">
      <RecruitmentCard recruitmentStatus={recruitmentStatus} onClick={onRecruitmentClick} />
      <FirstPlanCard firstPlanStatus={firstPlanStatus} onClick={onFirstPlanClick} />
      <SecondPlanCard secondPlanStatus={secondPlanStatus} onClick={onSecondPlanClick} />
    </div>
  )
}

export default ShiftStatusCards
