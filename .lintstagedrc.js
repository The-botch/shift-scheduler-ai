export default {
  'frontend/**/*.{js,jsx}': (filenames) => {
    const frontendFiles = filenames.map(f => f.replace('frontend/', '')).map(f => `"${f}"`)
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
