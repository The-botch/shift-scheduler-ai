import path from 'path'

export default {
  'frontend/**/*.{js,jsx}': (filenames) => {
    const frontendFiles = filenames.map(f => {
      const relative = path.relative('frontend', f)
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
