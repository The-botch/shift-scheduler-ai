"""
OpenAI GPT-4 API呼び出しサービス
"""
from openai import OpenAI
from django.conf import settings


class AIService:
    """AI サービスクラス"""

    def __init__(self):
        api_key = getattr(settings, 'OPENAI_API_KEY', '')
        if not api_key:
            raise ValueError('OPENAI_API_KEYが設定されていません')
        self.client = OpenAI(api_key=api_key)

    def chat(self, messages, model="gpt-4", temperature=0.7, max_tokens=None):
        """
        GPT-4との対話

        Args:
            messages: メッセージリスト [{"role": "user", "content": "..."}]
            model: 使用するモデル（デフォルト: gpt-4）
            temperature: 応答のランダム性 (0.0-2.0)
            max_tokens: 最大トークン数

        Returns:
            dict: レスポンス内容
        """
        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )

            return {
                'success': True,
                'message': response.choices[0].message.content,
                'model': response.model,
                'usage': {
                    'prompt_tokens': response.usage.prompt_tokens,
                    'completion_tokens': response.usage.completion_tokens,
                    'total_tokens': response.usage.total_tokens
                },
                'finish_reason': response.choices[0].finish_reason
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def analyze_shift_request(self, text):
        """
        シフト希望テキストを解析

        Args:
            text: シフト希望の自然言語テキスト

        Returns:
            dict: 解析結果
        """
        system_prompt = """
あなたはシフト希望を解析するAIアシスタントです。
ユーザーから送られたシフト希望のテキストを解析し、以下のJSON形式で返してください：

{
  "target_month": "YYYY-MM",
  "preferences": [
    {
      "date": "YYYY-MM-DD",
      "preference": "preferred/available/unavailable/off",
      "time": "morning/afternoon/evening/night/全日",
      "note": "備考"
    }
  ]
}

preference の値：
- preferred: 希望（その日に働きたい）
- available: 可能（働けます）
- unavailable: 不可（働けません）
- off: 休み希望

time の値：
- morning: 午前（9:00-13:00）
- afternoon: 午後（13:00-18:00）
- evening: 夕方（18:00-22:00）
- night: 深夜（22:00-翌5:00）
- 全日: 終日OK
"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"以下のシフト希望を解析してください：\n{text}"}
        ]

        return self.chat(messages, temperature=0.3)

    def generate_shift_pattern(self, constraints):
        """
        制約条件からシフトパターンを生成

        Args:
            constraints: 制約条件の辞書

        Returns:
            dict: 生成されたシフトパターン
        """
        system_prompt = """
あなたはシフト作成を支援するAIアシスタントです。
与えられた制約条件を元に、最適なシフトパターンを提案してください。
"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"以下の制約条件でシフトパターンを提案してください：\n{constraints}"}
        ]

        return self.chat(messages, temperature=0.5)
