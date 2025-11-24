// テスト実行前のセットアップ
// OpenAI API keyがない場合はテスト用のダミーkeyを設定
if (!process.env.OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = 'test-api-key-for-testing'
}
