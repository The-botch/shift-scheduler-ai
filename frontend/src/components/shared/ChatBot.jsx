import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { MessageSquare, X, Send, Minimize2, Maximize2, Loader2, User, Bot } from 'lucide-react'
import {
  createThread,
  addMessage,
  createRun,
  getRunStatus,
  getMessages,
} from '../../utils/assistantClient'

/**
 * AI対話チャットボット（右下固定表示）
 */
const ChatBot = ({ assistantId, onClose }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [threadId, setThreadId] = useState(null)
  const messagesEndRef = useRef(null)

  // メッセージリストを最下部にスクロール
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Thread初期化
  useEffect(() => {
    const initThread = async () => {
      if (isOpen && !threadId) {
        try {
          const thread = await createThread()
          setThreadId(thread.id)
        } catch (error) {
          console.error('Thread作成エラー:', error)
        }
      }
    }
    initThread()
  }, [isOpen, threadId])

  // メッセージ送信
  const handleSend = async () => {
    if (!inputText.trim() || !threadId || !assistantId) return

    const userMessage = {
      role: 'user',
      content: inputText,
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    try {
      // 1. メッセージ追加
      await addMessage(threadId, inputText)

      // 2. Run実行
      const run = await createRun(threadId, assistantId)

      // 3. Run完了待ち
      let runStatus = run
      let pollCount = 0
      const maxPolls = 120 // 最大120秒（2分）待機

      while (
        runStatus.status !== 'completed' &&
        runStatus.status !== 'failed' &&
        pollCount < maxPolls
      ) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        runStatus = await getRunStatus(threadId, run.id)
        pollCount++
      }

      if (runStatus.status === 'failed') {
        throw new Error(`Run失敗: ${runStatus.last_error?.message || '不明なエラー'}`)
      }

      if (pollCount >= maxPolls) {
        throw new Error('タイムアウト: AI応答が2分以内に完了しませんでした')
      }

      // 4. 応答取得
      const messagesResponse = await getMessages(threadId)
      const assistantMessage = messagesResponse.data[0]
      const textContent = assistantMessage.content.find(c => c.type === 'text')

      if (textContent) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: textContent.text.value,
            timestamp: new Date().toISOString(),
          },
        ])
      }
    } catch (error) {
      console.error('メッセージ送信エラー:', error)
      setMessages(prev => [
        ...prev,
        {
          role: 'error',
          content: `エラー: ${error.message}`,
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Enterキーで送信
  const handleKeyPress = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* フローティングボタン（チャット閉じている時） */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
              size="icon"
            >
              <MessageSquare className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* チャットウィンドウ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-50"
            style={{
              width: isMinimized ? '320px' : '400px',
              height: isMinimized ? '60px' : '600px',
            }}
          >
            <Card className="h-full flex flex-col shadow-2xl border-2 border-blue-500">
              {/* ヘッダー */}
              <CardHeader className="flex flex-row items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-700">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-white" />
                  <CardTitle className="text-white text-base">AI対話アシスタント</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => setIsMinimized(!isMinimized)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-blue-800"
                  >
                    {isMinimized ? (
                      <Maximize2 className="h-4 w-4" />
                    ) : (
                      <Minimize2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    onClick={() => setIsOpen(false)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-blue-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              {/* メッセージエリア */}
              {!isMinimized && (
                <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                  {/* メッセージリスト */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages.length === 0 && (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <div className="text-center">
                          <Bot className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">シフト作成についてお聞きください</p>
                        </div>
                      </div>
                    )}

                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <Bot className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                        )}

                        <div
                          className={`max-w-[75%] rounded-lg px-4 py-2 ${
                            msg.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : msg.role === 'error'
                                ? 'bg-red-100 text-red-800 border border-red-300'
                                : 'bg-white text-gray-800 border border-gray-200'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}
                          >
                            {new Date(msg.timestamp).toLocaleTimeString('ja-JP', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>

                        {msg.role === 'user' && (
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                              <User className="h-5 w-5 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex justify-start gap-2">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Bot className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="bg-white text-gray-800 border border-gray-200 rounded-lg px-4 py-2">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            <span className="text-sm">回答を生成中...</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* 入力エリア */}
                  <div className="border-t border-gray-200 p-4 bg-white">
                    <div className="flex gap-2">
                      <textarea
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="メッセージを入力... (Shift+Enterで改行)"
                        className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        disabled={isLoading || !threadId || !assistantId}
                      />
                      <Button
                        onClick={handleSend}
                        disabled={!inputText.trim() || isLoading || !threadId || !assistantId}
                        className="bg-blue-600 hover:bg-blue-700 self-end"
                        size="icon"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {!assistantId && (
                      <p className="text-xs text-red-500 mt-2">
                        Assistant IDが設定されていません。開発者ツールでセットアップしてください。
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default ChatBot
