import { motion } from 'framer-motion'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { ArrowLeft, Sparkles, Upload, Edit } from 'lucide-react'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
}

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5,
}

/**
 * シフト作成方法選択画面
 * - 手動入力
 * - AI自動生成
 * - CSVインポート
 */
const ShiftCreationMethodSelector = ({ selectedShift, onBack, onSelectMethod }) => {
  const year = selectedShift?.year || new Date().getFullYear()
  const month = selectedShift?.month || new Date().getMonth() + 1

  const methods = [
    {
      id: 'copy',
      title: '新規作成',
      description: '前月のシフトをコピーして作成します（同じ曜日・週にマッピング）',
      icon: Sparkles,
      color: 'purple',
    },
    {
      id: 'csv',
      title: 'CSVインポート',
      description: 'CSVファイルからシフトデータをインポートします',
      icon: Upload,
      color: 'green',
    },
  ]

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="container mx-auto px-4 py-8"
    >
      <div className="mb-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          シフト管理に戻る
        </Button>
        <h1 className="text-3xl font-bold text-neutral-900 mt-4">
          {year}年{month}月のシフト作成
        </h1>
        <p className="text-neutral-600 mt-2">シフトの作成方法を選択してください</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {methods.map((method, index) => {
          const Icon = method.icon
          return (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className="cursor-pointer hover:shadow-xl transition-shadow border-2 hover:border-primary-400"
                onClick={() => onSelectMethod(method.id)}
              >
                <CardContent className="p-8 text-center">
                  <div
                    className={`w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-${method.color}-100 to-${method.color}-200 rounded-full flex items-center justify-center`}
                  >
                    <Icon className={`h-10 w-10 text-${method.color}-600`} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{method.title}</h3>
                  <p className="text-neutral-600 text-sm">{method.description}</p>
                  <Button className="mt-6 w-full">選択</Button>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

export default ShiftCreationMethodSelector
