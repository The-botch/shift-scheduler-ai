/**
 * Alert呼び出しを一括でMESSAGES参照に置き換えるスクリプト
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 置換マッピング（ハードコードされたメッセージ → MESSAGESパス）
const replacements = [
  // App.jsx
  {
    from: "alert('このシフトは確定済みのため、閲覧のみ可能です')",
    to: "alert(MESSAGES.INFO.VIEW_ONLY)",
    file: 'frontend/src/App.jsx',
  },

  // CSVActions.jsx
  {
    from: "alert('✅ CSVファイルをエクスポートしました')",
    to: "alert(MESSAGES.SUCCESS.CSV_EXPORT)",
    file: 'frontend/src/components/shared/CSVActions.jsx',
  },
  {
    from: /alert\(`❌ エクスポートに失敗しました: \$\{result\.error\}`\)/g,
    to: "alert(MESSAGES.ERROR.EXPORT_ERROR(result.error))",
    file: 'frontend/src/components/shared/CSVActions.jsx',
  },
  {
    from: /alert\(`✅ \$\{importedData\.length\}件のデータをインポートしました`\)/g,
    to: "alert(MESSAGES.SUCCESS.CSV_IMPORT(importedData.length))",
    file: 'frontend/src/components/shared/CSVActions.jsx',
  },
  {
    from: /alert\(`❌ インポートエラー:\\n\$\{error\}`\)/g,
    to: "alert(MESSAGES.ERROR.IMPORT_ERROR(error))",
    file: 'frontend/src/components/shared/CSVActions.jsx',
  },

  // DraftShiftEditor.jsx
  {
    from: "alert('シフトデータの読み込みに失敗しました。')",
    to: "alert(MESSAGES.ERROR.SHIFT_DATA_LOAD_FAILED)",
    file: 'frontend/src/components/screens/DraftShiftEditor.jsx',
  },
  {
    from: "alert('変更がありません。')",
    to: "alert(MESSAGES.SUCCESS.NO_CHANGES)",
    file: 'frontend/src/components/screens/DraftShiftEditor.jsx',
  },
  {
    from: "alert(isAlreadyApproved ? '変更を保存しました。' : '第1案を承認しました。')",
    to: "alert(isAlreadyApproved ? MESSAGES.SUCCESS.SAVED : MESSAGES.SUCCESS.APPROVE_FIRST_PLAN)",
    file: 'frontend/src/components/screens/DraftShiftEditor.jsx',
  },
  {
    from: "alert('変更の保存または承認に失敗しました。')",
    to: "alert(MESSAGES.ERROR.SAVE_APPROVE_FAILED)",
    file: 'frontend/src/components/screens/DraftShiftEditor.jsx',
  },

  // SecondPlan.jsx
  {
    from: "alert('データの読み込みに失敗しました')",
    to: "alert(MESSAGES.ERROR.LOAD_FAILED)",
    file: 'frontend/src/components/screens/SecondPlan.jsx',
  },
  {
    from: "alert('第2案データの読み込みに失敗しました。CSVファイルを確認してください。')",
    to: "alert(MESSAGES.ERROR.SECOND_PLAN_LOAD_FAILED)",
    file: 'frontend/src/components/screens/SecondPlan.jsx',
  },
  {
    from: "alert('シフトの更新に失敗しました')",
    to: "alert(MESSAGES.ERROR.SHIFT_UPDATE_FAILED)",
    file: 'frontend/src/components/screens/SecondPlan.jsx',
  },
  {
    from: "alert('シフトの削除に失敗しました')",
    to: "alert(MESSAGES.ERROR.SHIFT_DELETE_FAILED)",
    file: 'frontend/src/components/screens/SecondPlan.jsx',
  },
  {
    from: /alert\(`\$\{successCount\}件の修正を適用しました。\$\{errorCount\}件の修正に失敗しました。`\)/g,
    to: "alert(MESSAGES.SUCCESS.AI_MODIFICATION_APPLIED_WITH_ERRORS(successCount, errorCount))",
    file: 'frontend/src/components/screens/SecondPlan.jsx',
  },
  {
    from: /alert\(`\$\{successCount\}件の修正を適用しました。`\)/g,
    to: "alert(MESSAGES.SUCCESS.AI_MODIFICATION_APPLIED(successCount))",
    file: 'frontend/src/components/screens/SecondPlan.jsx',
  },
  {
    from: "alert('修正の適用中にエラーが発生しました')",
    to: "alert(MESSAGES.ERROR.AI_MODIFICATION_FAILED)",
    file: 'frontend/src/components/screens/SecondPlan.jsx',
  },
  {
    from: "alert('シフト計画IDが見つかりません')",
    to: "alert(MESSAGES.ERROR.NO_PLAN_ID)",
    file: 'frontend/src/components/screens/SecondPlan.jsx',
  },
  {
    from: "alert('第2案を承認しました')",
    to: "alert(MESSAGES.SUCCESS.APPROVE_SECOND_PLAN)",
    file: 'frontend/src/components/screens/SecondPlan.jsx',
  },
  {
    from: "alert('第2案の承認中にエラーが発生しました')",
    to: "alert(MESSAGES.ERROR.SHIFT_APPROVE_FAILED)",
    file: 'frontend/src/components/screens/SecondPlan.jsx',
  },

  // History.jsx
  {
    from: "alert('エクスポートするデータがありません')",
    to: "alert(MESSAGES.ERROR.NO_EXPORT_DATA)",
    file: 'frontend/src/components/screens/History.jsx',
  },
  {
    from: /alert\(`❌ エクスポートに失敗しました: \$\{result\.error\}`\)/g,
    to: "alert(MESSAGES.ERROR.EXPORT_ERROR(result.error))",
    file: 'frontend/src/components/screens/History.jsx',
  },
  {
    from: /alert\(`✅ 実績データ \$\{results\.data\.length\}件をインポートしました`\)/g,
    to: "alert(MESSAGES.SUCCESS.ACTUAL_DATA_IMPORT(results.data.length))",
    file: 'frontend/src/components/screens/History.jsx',
  },
  {
    from: "alert('❌ 有効なデータが見つかりませんでした')",
    to: "alert(MESSAGES.ERROR.NO_VALID_DATA)",
    file: 'frontend/src/components/screens/History.jsx',
  },
  {
    from: /alert\(`❌ インポートエラー: \$\{error\.message\}`\)/g,
    to: "alert(MESSAGES.ERROR.IMPORT_ERROR_SHORT(error.message))",
    file: 'frontend/src/components/screens/History.jsx',
  },
  {
    from: "alert('予定データが見つかりません')",
    to: "alert(MESSAGES.ERROR.PLANNED_SHIFT_NOT_FOUND)",
    file: 'frontend/src/components/screens/History.jsx',
  },

  // LineShiftInput.jsx
  {
    from: "alert('シフト希望を登録しました！')",
    to: "alert(MESSAGES.SUCCESS.SHIFT_REQUEST_REGISTERED)",
    file: 'frontend/src/components/screens/LineShiftInput.jsx',
  },
  {
    from: /alert\(`シフト希望の登録に失敗しました。\\n\$\{error\.message\}`\)/g,
    to: "alert(MESSAGES.ERROR.SHIFT_REQUEST_FAILED(error.message))",
    file: 'frontend/src/components/screens/LineShiftInput.jsx',
  },

  // ConstraintManagement.jsx
  {
    from: "alert('✅ CSVファイルをエクスポートしました')",
    to: "alert(MESSAGES.SUCCESS.CSV_EXPORT)",
    file: 'frontend/src/components/screens/ConstraintManagement.jsx',
  },
  {
    from: /alert\(`❌ エクスポートに失敗しました: \$\{result\.error\}`\)/g,
    to: "alert(MESSAGES.ERROR.EXPORT_ERROR(result.error))",
    file: 'frontend/src/components/screens/ConstraintManagement.jsx',
  },
  {
    from: /alert\(`✅ \$\{data\.length\}件の制約データをインポートしました`\)/g,
    to: "alert(MESSAGES.SUCCESS.CONSTRAINT_IMPORT(data.length))",
    file: 'frontend/src/components/screens/ConstraintManagement.jsx',
  },
  {
    from: /alert\(`❌ インポートエラー:\\n\$\{error\}`\)/g,
    to: "alert(MESSAGES.ERROR.IMPORT_ERROR(error))",
    file: 'frontend/src/components/screens/ConstraintManagement.jsx',
  },

  // BudgetActualManagement.jsx
  {
    from: "alert('サンプルデータの読み込みに失敗しました')",
    to: "alert(MESSAGES.ERROR.SAMPLE_DATA_LOAD_FAILED)",
    file: 'frontend/src/components/screens/BudgetActualManagement.jsx',
  },
  {
    from: "alert('データを削除しました')",
    to: "alert(MESSAGES.SUCCESS.DELETE)",
    file: 'frontend/src/components/screens/BudgetActualManagement.jsx',
  },
  {
    from: "alert('削除に失敗しました')",
    to: "alert(MESSAGES.ERROR.DELETE_FAILED_SIMPLE)",
    file: 'frontend/src/components/screens/BudgetActualManagement.jsx',
  },
  {
    from: "alert('予実分析には、売上予測・労働時間実績・給与明細・売上実績の全てのデータが必要です。')",
    to: "alert(MESSAGES.ERROR.REQUIRED_DATA_MISSING)",
    file: 'frontend/src/components/screens/BudgetActualManagement.jsx',
  },
  {
    from: "alert('労働時間実績データがありません。')",
    to: "alert(MESSAGES.ERROR.WORK_HOURS_DATA_MISSING)",
    file: 'frontend/src/components/screens/BudgetActualManagement.jsx',
  },
  {
    from: "alert('給与明細データがありません。')",
    to: "alert(MESSAGES.ERROR.PAYROLL_DATA_MISSING)",
    file: 'frontend/src/components/screens/BudgetActualManagement.jsx',
  },
  {
    from: "alert('予定シフトデータがありません。この月のシフト作成履歴が見つかりませんでした。')",
    to: "alert(MESSAGES.ERROR.PLANNED_SHIFT_HISTORY_NOT_FOUND)",
    file: 'frontend/src/components/screens/BudgetActualManagement.jsx',
  },
  {
    from: "alert('差分分析に失敗しました')",
    to: "alert(MESSAGES.ERROR.ANALYSIS_FAILED)",
    file: 'frontend/src/components/screens/BudgetActualManagement.jsx',
  },
]

// ファイルを処理する関数
function processFile(filePath, fileReplacements) {
  const fullPath = path.join(__dirname, '..', filePath)

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`)
    return false
  }

  let content = fs.readFileSync(fullPath, 'utf-8')
  let changed = false
  let changeCount = 0

  // importチェック
  const hasMessagesImport = content.includes("import { MESSAGES }") || content.includes("import { getMessage, MESSAGES }")

  // 置換実行
  for (const { from, to } of fileReplacements) {
    if (from instanceof RegExp) {
      if (from.test(content)) {
        content = content.replace(from, to)
        changed = true
        changeCount++
      }
    } else {
      if (content.includes(from)) {
        content = content.replace(from, to)
        changed = true
        changeCount++
      }
    }
  }

  if (changed) {
    // MESSAGESのimportを追加（まだない場合）
    if (!hasMessagesImport) {
      // ファイルの場所に応じてimportパスを決定
      let importPath = '../constants/messages'
      if (filePath.includes('/components/shared/')) {
        importPath = '../../constants/messages'
      } else if (filePath.includes('/components/screens/')) {
        importPath = '../../constants/messages'
      }

      // React importの後に追加
      const importPattern = /^(import .* from ['"]react['"].*$)/m
      if (importPattern.test(content)) {
        content = content.replace(
          importPattern,
          `$1\nimport { MESSAGES } from '${importPath}'`
        )
      } else {
        // React importがない場合は先頭に追加
        content = `import { MESSAGES } from '${importPath}'\n` + content
      }
    }

    fs.writeFileSync(fullPath, content, 'utf-8')
    console.log(`✅ Updated ${filePath} (${changeCount} replacements)`)
    return true
  } else {
    console.log(`⏭️  No changes needed for ${filePath}`)
    return false
  }
}

// メイン処理
console.log('🚀 Starting alert() migration to MESSAGES...\n')

// ファイルごとにグループ化
const fileGroups = replacements.reduce((acc, replacement) => {
  const file = replacement.file
  if (!acc[file]) {
    acc[file] = []
  }
  acc[file].push(replacement)
  return acc
}, {})

let totalFiles = 0
let updatedFiles = 0

for (const [file, fileReplacements] of Object.entries(fileGroups)) {
  totalFiles++
  if (processFile(file, fileReplacements)) {
    updatedFiles++
  }
}

console.log(`\n✨ Migration complete!`)
console.log(`📊 Updated ${updatedFiles}/${totalFiles} files`)
