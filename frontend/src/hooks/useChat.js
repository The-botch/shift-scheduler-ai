import { useState } from 'react'
import { demoPatterns } from '../data/demoPatterns'

export const useChat = (onShiftChange) => {
  const [messages, setMessages] = useState([
    { id: 1, type: 'system', content: 'シフト第2案が生成されました。自然言語で修正指示をお聞かせください。', time: '14:30' },
    { id: 2, type: 'user', content: '田中さんの土曜日のシフトを午後に変更してください', time: '14:32' },
    { id: 3, type: 'assistant', content: '田中太郎さんの土曜日（9/7）のシフトを午後（13:00-17:00）に変更しました。他に調整が必要な箇所はありますか？', time: '14:32' }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const sendMessage = () => {
    if (!inputValue.trim()) return

    const newMessage = {
      id: messages.length + 1,
      type: 'user',
      content: inputValue,
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, newMessage])
    const currentInput = inputValue
    setInputValue('')
    setIsTyping(true)

    // デモパターンをチェック
    const pattern = demoPatterns[currentInput]
    
    setTimeout(() => {
      let responseContent = '承知しました。指定された変更を適用し、シフト表を更新しました。法令チェックも問題ありません。'
      
      if (pattern) {
        onShiftChange(pattern.changes)
        responseContent = pattern.response
      }

      const aiResponse = {
        id: messages.length + 2,
        type: 'assistant',
        content: responseContent,
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 2000)
  }

  return {
    messages,
    inputValue,
    setInputValue,
    isTyping,
    sendMessage
  }
}
