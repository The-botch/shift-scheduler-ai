"""
AI関連のAPIエンドポイント
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import JSONParser
from .ai_service import AIService


class AIViewSet(viewsets.ViewSet):
    """AI機能のAPIエンドポイント"""
    parser_classes = (JSONParser,)

    @action(detail=False, methods=['post'])
    def chat(self, request):
        """
        GPT-4との汎用対話API

        Request Body:
        {
            "messages": [
                {"role": "system", "content": "..."},
                {"role": "user", "content": "..."}
            ],
            "model": "gpt-4",  // optional
            "temperature": 0.7,  // optional
            "max_tokens": 1000  // optional
        }
        """
        messages = request.data.get('messages', [])
        model = request.data.get('model', 'gpt-4')
        temperature = request.data.get('temperature', 0.7)
        max_tokens = request.data.get('max_tokens')

        if not messages:
            return Response(
                {'error': 'messagesパラメータは必須です'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            ai_service = AIService()
            result = ai_service.chat(
                messages=messages,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens
            )

            if result.get('success'):
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(
                    {'error': result.get('error')},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'AIサービスの呼び出し中にエラーが発生しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def simple_chat(self, request):
        """
        シンプルな対話API（1メッセージ）

        Request Body:
        {
            "message": "こんにちは",
            "model": "gpt-4"  // optional
        }
        """
        message = request.data.get('message', '')
        model = request.data.get('model', 'gpt-4')

        if not message:
            return Response(
                {'error': 'messageパラメータは必須です'},
                status=status.HTTP_400_BAD_REQUEST
            )

        messages = [
            {"role": "user", "content": message}
        ]

        try:
            ai_service = AIService()
            result = ai_service.chat(messages=messages, model=model)

            if result.get('success'):
                return Response({
                    'message': result['message'],
                    'usage': result['usage']
                }, status=status.HTTP_200_OK)
            else:
                return Response(
                    {'error': result.get('error')},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Exception as e:
            return Response(
                {'error': f'AIサービスの呼び出し中にエラーが発生しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def analyze_shift(self, request):
        """
        シフト希望テキストを解析

        Request Body:
        {
            "text": "11月は1日と5日休みたいです。10日は午前中のみOKです。"
        }
        """
        text = request.data.get('text', '')

        if not text:
            return Response(
                {'error': 'textパラメータは必須です'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            ai_service = AIService()
            result = ai_service.analyze_shift_request(text)

            if result.get('success'):
                return Response({
                    'analysis': result['message'],
                    'usage': result['usage']
                }, status=status.HTTP_200_OK)
            else:
                return Response(
                    {'error': result.get('error')},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Exception as e:
            return Response(
                {'error': f'シフト希望の解析中にエラーが発生しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def health_check(self, request):
        """
        AI機能のヘルスチェック
        """
        try:
            ai_service = AIService()
            return Response({
                'status': 'ok',
                'message': 'AIサービスは利用可能です'
            }, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'予期しないエラー: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
