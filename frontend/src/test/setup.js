import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// テスト後のクリーンアップ
afterEach(() => {
  cleanup()
})
