export default {
  server: {
    port: parseInt(process.env.PORT) || 3001,
  },
  api: {
    openai: {
      baseURL: 'https://api.openai.com/v1',
      model: process.env.VITE_OPENAI_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.VITE_OPENAI_MAX_TOKENS) || 2000,
      beta: 'assistants=v2',
    },
  },
  paths: {
    dataRoot: '/data',
    generated: '/data/generated',
    master: '/data/master',
    history: '/data/history',
  },
  files: {
    reference: [
      '/data/master/labor_law_constraints.csv',
      '/data/master/labor_management_rules.csv',
      '/data/master/shift_validation_rules.csv',
      '/data/master/stores.csv',
      '/data/master/store_constraints.csv',
      '/data/master/staff.csv',
      '/data/master/staff_skills.csv',
      '/data/master/staff_certifications.csv',
      '/data/history/shift_history_2023-2024.csv',
      '/data/history/shift_monthly_summary.csv',
    ],
  },
}
