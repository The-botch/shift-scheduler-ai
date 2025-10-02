import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import {
  ChevronLeft,
  Send,
  CheckCircle,
  MessageSquare,
  Calendar,
  Users,
  Bell
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

const FinalDistribution = ({ onNext, onPrev }) => {
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSend = () => {
    setIsSending(true)
    setTimeout(() => {
      setIsSending(false)
      setSent(true)
    }, 2000)
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
          確定・配布
        </h1>
        <p className="text-lg text-gray-600">シフトを確定してLINEで配布します</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左側：確定前チェック */}
        <div className="space-y-6">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                最終チェック
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-sm font-medium text-green-800">法令遵守</span>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">OK</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-sm font-medium text-green-800">人員配置</span>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">OK</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-sm font-medium text-green-800">希望反映率</span>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">92%</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-sm font-medium text-green-800">コスト</span>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">¥485,000</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                配布対象
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span className="text-sm text-blue-800">総スタッフ数</span>
                  <span className="text-sm font-bold text-blue-900">12名</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span className="text-sm text-blue-800">配布方法</span>
                  <span className="text-sm font-bold text-blue-900">LINE通知</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span className="text-sm text-blue-800">対象月</span>
                  <span className="text-sm font-bold text-blue-900">2024年10月</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {!sent && (
            <Button
              onClick={handleSend}
              disabled={isSending}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-lg py-6"
            >
              {isSending ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mr-2"
                  >
                    <Send className="h-5 w-5" />
                  </motion.div>
                  送信中...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  LINEで配布する
                </>
              )}
            </Button>
          )}

          {sent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 bg-green-50 border-2 border-green-300 rounded-lg text-center"
            >
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-green-800 mb-2">配布完了！</h3>
              <p className="text-sm text-green-700">全スタッフにLINEで通知を送信しました</p>
            </motion.div>
          )}
        </div>

        {/* 右側：LINE通知プレビュー（スマホ風） */}
        <div className="flex justify-center items-start">
          <div className="w-full max-w-[375px]">
            <Card className="shadow-2xl border-2 border-gray-300 rounded-[2.5rem] overflow-hidden">
              {/* スマホヘッダー */}
              <div className="bg-green-600 text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  <span className="font-bold">シフト管理Bot</span>
                </div>
                <Bell className="h-5 w-5" />
              </div>

              <CardContent className="p-0 bg-gray-100 min-h-[600px]">
                {/* LINEメッセージ風UI */}
                <div className="p-4 space-y-3">
                  {/* システムメッセージ */}
                  <div className="text-center">
                    <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">
                      2024年9月28日
                    </span>
                  </div>

                  {/* Botからのメッセージ */}
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm">
                        <p className="text-sm text-gray-800 mb-2">
                          <strong>10月のシフトが確定しました！</strong>
                        </p>
                        <p className="text-sm text-gray-600 mb-3">
                          あなたのシフトを確認してください。
                        </p>
                        <div className="bg-green-50 border border-green-200 rounded p-2 mb-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-green-700">勤務日数</span>
                            <span className="text-sm font-bold text-green-800">15日</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-green-700">総労働時間</span>
                            <span className="text-sm font-bold text-green-800">120時間</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          シフトを確認
                        </Button>
                      </div>
                      <span className="text-xs text-gray-400 mt-1 block">14:35</span>
                    </div>
                  </div>

                  {sent && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2"
                    >
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm">
                          <p className="text-sm text-gray-800">
                            ✅ 確認済み
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 mt-1 block">たった今</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default FinalDistribution
