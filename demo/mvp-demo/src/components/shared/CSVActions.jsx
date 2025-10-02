import React from 'react'
import { Button } from '../ui/button'
import { Download, Upload } from 'lucide-react'
import { exportCSV, importCSV, generateFilename } from '../../utils/csvHelper'

const CSVActions = ({
  data,
  filename,
  onImport,
  validateFunction,
  importConfirmMessage = '既存のデータを上書きします。よろしいですか？'
}) => {
  const handleExportCSV = () => {
    const result = exportCSV(data, generateFilename(filename))
    if (result.success) {
      alert('✅ CSVファイルをエクスポートしました')
    } else {
      alert(`❌ エクスポートに失敗しました: ${result.error}`)
    }
  }

  const handleImportCSV = (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!window.confirm(importConfirmMessage)) {
      event.target.value = ''
      return
    }

    importCSV(
      file,
      (importedData) => {
        onImport(importedData)
        alert(`✅ ${importedData.length}件のデータをインポートしました`)
        event.target.value = ''
      },
      (error) => {
        alert(`❌ インポートエラー:\n${error}`)
        event.target.value = ''
      },
      validateFunction
    )
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="secondary"
        onClick={handleExportCSV}
        className="bg-white text-blue-700 hover:bg-gray-100"
      >
        <Download className="h-4 w-4 mr-2" />
        CSVエクスポート
      </Button>
      <label>
        <Button
          size="sm"
          variant="secondary"
          as="span"
          className="bg-white text-blue-700 hover:bg-gray-100 cursor-pointer"
        >
          <Upload className="h-4 w-4 mr-2" />
          CSVインポート
        </Button>
        <input
          type="file"
          accept=".csv"
          onChange={handleImportCSV}
          className="hidden"
        />
      </label>
    </div>
  )
}

export default CSVActions
