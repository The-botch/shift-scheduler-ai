import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { 
  Link, 
  Send, 
  Mail, 
  MessageSquare, 
  QrCode, 
  Share2,
  CheckCircle,
  Copy,
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

const HopeCollection = ({ onNext, onPrev }) => {
  const [linkGenerated, setLinkGenerated] = useState(false)
  const [deadline, setDeadline] = useState('2024-09-20')
  const [reminderSettings, setReminderSettings] = useState({
    email: true,
    sms: false,
    push: true
  })

  const generateLink = () => {
    setLinkGenerated(true)
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
          希望回収設定
        </h1>
        <p className="text-lg text-gray-600">スタッフ希望シフト収集の設定と管理</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* リンク生成 */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Link className="h-5 w-5 mr-2 text-blue-600" />
              希望入力リンク生成
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">締切日時</label>
              <input 
                type="datetime-local" 
                value={deadline + 'T23:59'}
                onChange={(e) => setDeadline(e.target.value.split('T')[0])}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">リマインダー設定</label>
              <div className="space-y-3">
                {Object.entries(reminderSettings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="capitalize">{key === 'email' ? 'メール' : key === 'sms' ? 'SMS' : 'プッシュ通知'}</span>
                    <button
                      onClick={() => setReminderSettings(prev => ({...prev, [key]: !value}))}
                      className={`w-12 h-6 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={generateLink} 
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              disabled={linkGenerated}
            >
              {linkGenerated ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  リンク生成完了
                </>
              ) : (
                <>
                  <Link className="mr-2 h-4 w-4" />
                  希望入力リンクを生成
                </>
              )}
            </Button>

            {linkGenerated && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <p className="text-sm text-green-800 mb-2">生成されたリンク:</p>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-2 bg-white border rounded text-xs">
                    https://shift.example.com/request/abc123
                  </code>
                  <Button size="sm" variant="outline">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* 配布方法 */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Send className="h-5 w-5 mr-2 text-purple-600" />
              配布方法
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-20 flex-col">
                <Mail className="h-6 w-6 mb-2" />
                メール送信
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <MessageSquare className="h-6 w-6 mb-2" />
                SMS送信
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <QrCode className="h-6 w-6 mb-2" />
                QRコード
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Share2 className="h-6 w-6 mb-2" />
                SNS共有
              </Button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">配布予定スタッフ</h4>
              <div className="space-y-2">
                {['田中太郎', '佐藤花子', '山田次郎', '鈴木美咲'].map((name, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span>{name}</span>
                    <div className="flex space-x-1">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <MessageSquare className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ナビゲーション */}
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onPrev} size="lg">
          <ChevronLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
        <Button onClick={onNext} size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          スタッフ入力画面へ
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}

export default HopeCollection
