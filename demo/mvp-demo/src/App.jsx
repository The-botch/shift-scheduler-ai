import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import './App.css'

// Screen Components
import Dashboard from './components/screens/Dashboard'
import DataImport from './components/screens/DataImport'
import FirstPlan from './components/screens/FirstPlan'
import HopeCollection from './components/screens/HopeCollection'
import StaffInput from './components/screens/StaffInput'
import Monitoring from './components/screens/Monitoring'
import SecondPlan from './components/screens/SecondPlan'
import ChatModification from './components/screens/ChatModification'

// UI Components
import { Button } from './components/ui/button'

// Stepper Component
const Stepper = ({ currentStep, onStepClick }) => {
  const steps = [
    { id: 1, title: 'ダッシュボード', description: 'システム概要' },
    { id: 2, title: 'データ導入', description: 'CSV取り込み' },
    { id: 3, title: '第1案生成', description: 'AI自動生成' },
    { id: 4, title: '希望回収設定', description: 'リンク発行' },
    { id: 5, title: 'スタッフ入力', description: 'モバイル対応' },
    { id: 6, title: 'モニタリング', description: '提出状況監視' },
    { id: 7, title: '第2案', description: '希望反映' },
    { id: 8, title: 'チャット修正', description: '微調整' },
    { id: 9, title: '確定・配布', description: '最終チェック' },
    { id: 10, title: '履歴', description: '監査・統計' }
  ]

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => onStepClick(step.id)}
              className={`flex-shrink-0 flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentStep === step.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : currentStep > step.id
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep === step.id
                  ? 'bg-white text-blue-600'
                  : currentStep > step.id
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}>
                {step.id}
              </div>
              <div className="text-left">
                <div className="font-medium">{step.title}</div>
                <div className="text-xs opacity-75">{step.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Remaining placeholder components



const FinalDistribution = ({ onNext, onPrev }) => (
  <div className="container mx-auto px-4 py-8">
    <h1 className="text-4xl font-bold mb-4">確定・配布</h1>
    <p className="text-gray-600 mb-8">最終チェック後、シフトを確定・配布します</p>
    <div className="flex justify-between">
      <Button variant="outline" onClick={onPrev}>戻る</Button>
      <Button onClick={onNext}>次へ</Button>
    </div>
  </div>
)

const History = ({ onNext, onPrev }) => (
  <div className="container mx-auto px-4 py-8">
    <h1 className="text-4xl font-bold mb-4">履歴・監査</h1>
    <p className="text-gray-600 mb-8">変更履歴と監査ログを確認できます</p>
    <div className="flex justify-between">
      <Button variant="outline" onClick={onPrev}>戻る</Button>
      <Button onClick={onNext} disabled>完了</Button>
    </div>
  </div>
)

function App() {
  const [currentStep, setCurrentStep] = useState(1)

  const nextStep = () => {
    if (currentStep < 10) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (step) => {
    setCurrentStep(step)
  }

  const renderCurrentScreen = () => {
    switch (currentStep) {
      case 1:
        return <Dashboard onNext={nextStep} />
      case 2:
        return <DataImport onNext={nextStep} onPrev={prevStep} />
      case 3:
        return <FirstPlan onNext={nextStep} onPrev={prevStep} />
      case 4:
        return <HopeCollection onNext={nextStep} onPrev={prevStep} />
      case 5:
        return <StaffInput onNext={nextStep} onPrev={prevStep} />
      case 6:
        return <Monitoring onNext={nextStep} onPrev={prevStep} />
      case 7:
        return <SecondPlan onNext={nextStep} onPrev={prevStep} />
      case 8:
        return <ChatModification onNext={nextStep} onPrev={prevStep} />
      case 9:
        return <div className="container mx-auto px-4 py-8 text-center"><h1 className="text-2xl font-bold">確定・配布</h1><p className="text-gray-600 mt-4">実装予定</p><div className="mt-8"><button onClick={prevStep} className="mr-4 px-4 py-2 border rounded">戻る</button><button onClick={nextStep} className="px-4 py-2 bg-blue-600 text-white rounded">次へ</button></div></div>
      case 10:
        return <div className="container mx-auto px-4 py-8 text-center"><h1 className="text-2xl font-bold">履歴・監査</h1><p className="text-gray-600 mt-4">実装予定</p><div className="mt-8"><button onClick={prevStep} className="mr-4 px-4 py-2 border rounded">戻る</button></div></div>
      default:
        return <Dashboard onNext={nextStep} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Stepper currentStep={currentStep} onStepClick={goToStep} />
      <AnimatePresence mode="wait">
        <div key={currentStep}>
          {renderCurrentScreen()}
        </div>
      </AnimatePresence>
    </div>
  )
}

export default App
