import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Download,
  ChevronLeft, 
  ArrowRight
} from 'lucide-react'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
}

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5
}

const DataImport = ({ onNext, onPrev }) => {
  const [uploadStatus, setUploadStatus] = useState('idle') // idle, uploading, completed
  const [uploadProgress, setUploadProgress] = useState(0)
  const [validationResults, setValidationResults] = useState(null)

  const handleFileUpload = () => {
    setUploadStatus('uploading')
    setUploadProgress(0)

    // シミュレートされたアップロードプロセス
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploadStatus('completed')
          setValidationResults({
            totalRows: 12,
            validRows: 10,
            warnings: 2,
            errors: 0,
            fileName: 'staff_data.csv',
            fileSize: '2.4 KB'
          })
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="container mx-auto px-4 py-8"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
          データ導入（CSV）
        </h1>
        <p className="text-lg text-gray-600">スタッフ情報とシフト制約をCSVファイルから取り込みます</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* アップロード画面 */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2 text-blue-600" />
              CSVファイルアップロード
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {uploadStatus === 'idle' && (
              <motion.div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                whileHover={{ scale: 1.02 }}
                onClick={handleFileUpload}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  ファイルをドラッグ&ドロップ
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  または クリックしてファイルを選択
                </p>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  ファイルを選択
                </Button>
              </motion.div>
            )}

            {uploadStatus === 'uploading' && (
              <div className="text-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
                />
                <p className="text-lg font-medium text-gray-700 mb-4">アップロード中...</p>
                <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                <p className="text-sm text-gray-500 mt-2">{uploadProgress}% 完了</p>
              </div>
            )}

            {uploadStatus === 'completed' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">アップロード完了</p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                  <p className="text-sm text-green-800">
                    <strong>ファイル名:</strong> {validationResults?.fileName}
                  </p>
                  <p className="text-sm text-green-800">
                    <strong>サイズ:</strong> {validationResults?.fileSize}
                  </p>
                  <p className="text-sm text-green-800">
                    <strong>総行数:</strong> {validationResults?.totalRows}行
                  </p>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* 必須項目・サンプル */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-purple-600" />
              必須項目とサンプル
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">必須項目</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  氏名（name）
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  スキルレベル（skill_level: 1-5）
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  勤務可能時間帯（available_hours）
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  週最大勤務時間（max_hours_per_week）
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-3">データ形式例</h4>
              <div className="bg-gray-50 border rounded-lg p-3 text-xs font-mono">
                <div className="text-gray-600">name,skill_level,available_hours,max_hours_per_week</div>
                <div>田中太郎,4,9-17,40</div>
                <div>佐藤花子,5,13-21,35</div>
                <div>山田次郎,3,9-15,30</div>
              </div>
            </div>

            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              サンプルCSVをダウンロード
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 検証結果 */}
      {validationResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                検証結果
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{validationResults.validRows}</p>
                  <p className="text-sm text-green-800">有効データ</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{validationResults.warnings}</p>
                  <p className="text-sm text-yellow-800">警告</p>
                </div>
                <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{validationResults.errors}</p>
                  <p className="text-sm text-red-800">エラー</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span>列チェック: OK</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span>データ行数: {validationResults.totalRows}名分</span>
                </div>
                <div className="flex items-center text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                  <span>スキル判定欠落: 2名（自動補完予定）</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ナビゲーション */}
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onPrev} size="lg">
          <ChevronLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
        {uploadStatus === 'completed' && (
          <Button onClick={onNext} size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            第1案生成へ
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.div>
  )
}

export default DataImport
