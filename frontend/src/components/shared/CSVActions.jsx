import React from 'react'
import { MESSAGES } from '../../constants/messages'
import { Button } from '../ui/button'
import { Download, Upload } from 'lucide-react'
import { exportCSV, importCSV, generateFilename } from '../../utils/csvHelper'

const CSVActions = ({
  data,
  filename,
  onImport,
  validateFunction,
  importConfirmMessage = '既存のデータを上書きします。よろしいですか？',
}) => {
  const handleExportCSV = () => {
    const result = exportCSV(data, generateFilename(filename))
    if (result.success) {
      alert(MESSAGES.SUCCESS.CSV_EXPORT)
    } else {
      alert(MESSAGES.ERROR.EXPORT_ERROR(result.error))
    }
  }

  const handleImportCSV = event => {
    const file = event.target.files[0]
    if (!file) return

    if (!window.confirm(importConfirmMessage)) {
      event.target.value = ''
      return
    }

    importCSV(
      file,
      importedData => {
        onImport(importedData)
        alert(MESSAGES.SUCCESS.CSV_IMPORT(importedData.length))
        event.target.value = ''
      },
      error => {
        alert(MESSAGES.ERROR.IMPORT_ERROR(error))
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
      <label className="cursor-pointer">
        <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-white text-blue-700 hover:bg-gray-100 border border-input">
          <Upload className="h-4 w-4" />
          CSVインポート
        </div>
        <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
      </label>
    </div>
  )
}

export default CSVActions
