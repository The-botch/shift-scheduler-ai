import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default {
  'frontend/**/*.{js,jsx}': (filenames) => {
    const frontendDir = path.join(__dirname, 'frontend')
    const frontendFiles = filenames.map(f => {
      const relative = path.relative(frontendDir, f)
      return `"${relative}"`
    })
    return [
      `cd frontend && npx eslint --fix ${frontendFiles.join(' ')}`,
      `cd frontend && npx prettier --write ${frontendFiles.join(' ')}`,
      'cd frontend && npm run test -- --run --bail --passWithNoTests'
    ]
  },
  'backend/**/*.js': () => [
    'cd backend && npm run test -- --run --bail --passWithNoTests'
  ]
}
