import uuid
import hashlib
import hmac
import json
import csv
from pathlib import Path
from django.conf import settings
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import JSONParser
from .models import ShiftRequest, StaffAvailability, WebhookLog
from .serializers import (
    ShiftRequestSerializer,
    ShiftRequestInputSerializer,
    StaffAvailabilitySerializer,
    WebhookLogSerializer
)
from .ai_service import AIService


class ShiftRequestViewSet(viewsets.ModelViewSet):
    """シフト希望リクエスト管理"""
    queryset = ShiftRequest.objects.all()
    serializer_class = ShiftRequestSerializer
    parser_classes = (JSONParser,)

    @action(detail=False, methods=['post'])
    def submit(self, request):
        """汎用シフト希望受付エンドポイント（LINEとWeb両方対応）"""

        # Webhookログを記録
        webhook_log = WebhookLog.objects.create(
            source=request.data.get('source', 'unknown'),
            endpoint='/api/gateway/shift-requests/submit/',
            method=request.method,
            headers=dict(request.headers),
            payload=request.data
        )

        try:
            # 入力データのバリデーション
            input_serializer = ShiftRequestInputSerializer(data=request.data)
            if not input_serializer.is_valid():
                webhook_log.response_status = 400
                webhook_log.error_message = str(input_serializer.errors)
                webhook_log.save()
                return Response(
                    {'error': input_serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )

            validated_data = input_serializer.validated_data

            # リクエストIDを生成（重複チェック）
            request_id = self._generate_request_id(
                validated_data['source'],
                validated_data['source_user_id'],
                validated_data['target_month']
            )

            # ShiftRequestを作成
            shift_request = ShiftRequest.objects.create(
                request_id=request_id,
                source=validated_data['source'],
                source_user_id=validated_data['source_user_id'],
                staff_id=validated_data.get('staff_id', ''),
                staff_name=validated_data.get('staff_name', ''),
                target_month=validated_data['target_month'],
                shift_data=validated_data['shift_data'],
                raw_payload=request.data,
                notes=validated_data.get('notes', ''),
                status='pending'
            )

            # Availabilitiesを作成（オプション）
            availabilities_data = validated_data.get('availabilities', [])
            if availabilities_data:
                for availability_item in availabilities_data:
                    StaffAvailability.objects.create(
                        shift_request=shift_request,
                        staff_id=availability_item.get('staff_id', validated_data.get('staff_id', '')),
                        staff_name=availability_item.get('staff_name', validated_data.get('staff_name', '')),
                        date=availability_item['date'],
                        available_from=availability_item.get('available_from'),
                        available_to=availability_item.get('available_to'),
                        preference=availability_item.get('preference', 'available'),
                        note=availability_item.get('note', '')
                    )

            # レスポンスを返す
            response_serializer = ShiftRequestSerializer(shift_request)
            response_data = {
                'success': True,
                'message': 'シフト希望を受け付けました',
                'request': response_serializer.data
            }

            webhook_log.response_status = 200
            webhook_log.response_body = response_data
            webhook_log.save()

            return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            webhook_log.response_status = 500
            webhook_log.error_message = str(e)
            webhook_log.save()
            return Response(
                {'error': f'シフト希望の処理中にエラーが発生しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def line_webhook(self, request):
        """LINE Webhook専用エンドポイント"""

        # LINE署名検証（本番環境では必須）
        # signature = request.headers.get('X-Line-Signature')
        # if not self._verify_line_signature(request.body, signature):
        #     return Response(
        #         {'error': '署名検証に失敗しました'},
        #         status=status.HTTP_403_FORBIDDEN
        #     )

        # Webhookログを記録
        webhook_log = WebhookLog.objects.create(
            source='line',
            endpoint='/api/gateway/shift-requests/line_webhook/',
            method=request.method,
            headers=dict(request.headers),
            payload=request.data
        )

        try:
            # LINEメッセージからシフト希望データを抽出
            # 実際のLINEメッセージフォーマットに合わせて実装
            events = request.data.get('events', [])

            if not events:
                return Response({'message': 'イベントがありません'}, status=status.HTTP_200_OK)

            for event in events:
                if event.get('type') == 'message':
                    message = event.get('message', {})
                    user_id = event.get('source', {}).get('userId')

                    # メッセージからシフト希望を解析（簡易版）
                    # 実際にはより高度な解析が必要
                    shift_data = self._parse_line_message(message)

                    if shift_data:
                        # submitエンドポイントに転送
                        submit_data = {
                            'source': 'line',
                            'source_user_id': user_id,
                            'target_month': shift_data.get('target_month'),
                            'shift_data': shift_data,
                            'notes': f"LINEメッセージから自動登録: {message.get('text', '')}"
                        }

                        # 内部的にsubmitを呼び出し
                        internal_request = type('Request', (), {
                            'data': submit_data,
                            'method': 'POST',
                            'headers': request.headers
                        })()

                        return self.submit(internal_request)

            webhook_log.response_status = 200
            webhook_log.save()
            return Response({'message': '処理完了'}, status=status.HTTP_200_OK)

        except Exception as e:
            webhook_log.response_status = 500
            webhook_log.error_message = str(e)
            webhook_log.save()
            return Response(
                {'error': f'LINE Webhookの処理中にエラーが発生しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def list_by_status(self, request):
        """ステータス別のシフト希望一覧取得"""
        status_filter = request.query_params.get('status', 'pending')
        requests = self.get_queryset().filter(status=status_filter)
        serializer = self.get_serializer(requests, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def list_by_month(self, request):
        """月別のシフト希望一覧取得"""
        target_month = request.query_params.get('month')
        if not target_month:
            return Response(
                {'error': 'monthパラメータは必須です（YYYY-MM形式）'},
                status=status.HTTP_400_BAD_REQUEST
            )

        requests = self.get_queryset().filter(target_month=target_month)
        serializer = self.get_serializer(requests, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """シフト希望のステータス更新"""
        shift_request = self.get_object()
        new_status = request.data.get('status')

        if new_status not in dict(ShiftRequest.STATUS_CHOICES):
            return Response(
                {'error': '無効なステータスです'},
                status=status.HTTP_400_BAD_REQUEST
            )

        old_status = shift_request.status
        shift_request.status = new_status
        if new_status in ['processed', 'approved']:
            shift_request.processed_at = timezone.now()

        shift_request.save()

        # 承認されたらCSVに保存
        if new_status == 'approved' and old_status != 'approved':
            try:
                self._save_to_csv(shift_request)
            except Exception as e:
                # CSVの保存に失敗してもステータス更新は成功扱い
                pass

        serializer = self.get_serializer(shift_request)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def export_to_csv(self, request, pk=None):
        """シフト希望をCSVにエクスポート"""
        shift_request = self.get_object()

        try:
            csv_path = self._save_to_csv(shift_request)
            return Response({
                'success': True,
                'message': 'CSVファイルに保存しました',
                'file_path': str(csv_path)
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'CSVへの保存中にエラーが発生しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def export_all_approved_to_csv(self, request):
        """承認済みシフト希望を一括CSVエクスポート"""
        target_month = request.data.get('target_month')

        if target_month:
            requests = ShiftRequest.objects.filter(
                status='approved',
                target_month=target_month
            )
        else:
            requests = ShiftRequest.objects.filter(status='approved')

        exported_count = 0
        errors = []

        for shift_request in requests:
            try:
                self._save_to_csv(shift_request)
                exported_count += 1
            except Exception as e:
                errors.append({
                    'request_id': shift_request.request_id,
                    'error': str(e)
                })

        return Response({
            'success': True,
            'exported_count': exported_count,
            'total_count': requests.count(),
            'errors': errors
        }, status=status.HTTP_200_OK)

    def _generate_request_id(self, source, user_id, target_month):
        """リクエストIDを生成"""
        timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
        unique_str = f"{source}_{user_id}_{target_month}_{timestamp}"
        hash_str = hashlib.md5(unique_str.encode()).hexdigest()[:8]
        return f"SR{timestamp}{hash_str}"

    def _verify_line_signature(self, body, signature):
        """LINE署名検証"""
        # 本番環境ではLINEチャネルシークレットを使用
        channel_secret = getattr(settings, 'LINE_CHANNEL_SECRET', '')
        if not channel_secret:
            return True  # 開発環境では検証スキップ

        hash_value = hmac.new(
            channel_secret.encode('utf-8'),
            body,
            hashlib.sha256
        ).digest()

        return hmac.compare_digest(hash_value, signature.encode('utf-8'))

    def _parse_line_message(self, message):
        """LINEメッセージからシフト希望データを解析"""
        # 簡易的な実装例
        # 実際にはより高度な自然言語処理やフォーマット解析が必要

        text = message.get('text', '')

        # 例: "2024年11月のシフト希望: 1日休み、5日午前のみ、10日終日OK"
        # このテキストを解析してJSONに変換

        return {
            'target_month': '2024-11',  # メッセージから抽出
            'raw_text': text,
            'preferences': []  # パースしたシフト希望
        }

    def _save_to_csv(self, shift_request):
        """シフト希望をCSVファイルに保存"""
        csv_data_dir = getattr(settings, 'CSV_DATA_DIR', None)
        if not csv_data_dir:
            raise Exception('CSV_DATA_DIRが設定されていません')

        csv_data_path = Path(csv_data_dir)
        transactions_dir = csv_data_path / 'transactions'

        # transactionsディレクトリが存在しない場合は作成
        if not transactions_dir.exists():
            transactions_dir.mkdir(parents=True, exist_ok=True)

        # ファイル名: shift_preferences_YYYY_MM.csv
        year_month = shift_request.target_month.replace('-', '_')
        csv_filename = f'shift_preferences_{year_month}.csv'
        csv_file_path = transactions_dir / csv_filename

        # CSVデータを準備
        csv_rows = []

        # shift_dataからpreferencesを抽出
        preferences = shift_request.shift_data.get('preferences', [])

        for pref in preferences:
            csv_rows.append({
                'request_id': shift_request.request_id,
                'staff_id': shift_request.staff_id or '',
                'staff_name': shift_request.staff_name or '',
                'date': pref.get('date', ''),
                'preference': pref.get('preference', 'available'),
                'time_slot': pref.get('time', ''),
                'available_from': pref.get('available_from', ''),
                'available_to': pref.get('available_to', ''),
                'note': pref.get('note', ''),
                'source': shift_request.source,
                'submitted_at': shift_request.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'approved_at': shift_request.processed_at.strftime('%Y-%m-%d %H:%M:%S') if shift_request.processed_at else ''
            })

        # availabilitiesも追加
        for availability in shift_request.availabilities.all():
            csv_rows.append({
                'request_id': shift_request.request_id,
                'staff_id': availability.staff_id,
                'staff_name': availability.staff_name,
                'date': availability.date.strftime('%Y-%m-%d'),
                'preference': availability.preference,
                'time_slot': '',
                'available_from': availability.available_from.strftime('%H:%M') if availability.available_from else '',
                'available_to': availability.available_to.strftime('%H:%M') if availability.available_to else '',
                'note': availability.note or '',
                'source': shift_request.source,
                'submitted_at': shift_request.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'approved_at': shift_request.processed_at.strftime('%Y-%m-%d %H:%M:%S') if shift_request.processed_at else ''
            })

        # データがない場合はスキップ
        if not csv_rows:
            raise Exception('保存するシフト希望データがありません')

        # 既存CSVファイルを読み込み（存在する場合）
        existing_rows = []
        if csv_file_path.exists():
            with open(csv_file_path, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                existing_rows = list(reader)

        # 重複チェック: 同じrequest_idのデータは削除
        existing_rows = [row for row in existing_rows if row.get('request_id') != shift_request.request_id]

        # 新しいデータを追加
        all_rows = existing_rows + csv_rows

        # CSVに書き込み
        if all_rows:
            fieldnames = [
                'request_id', 'staff_id', 'staff_name', 'date', 'preference',
                'time_slot', 'available_from', 'available_to', 'note',
                'source', 'submitted_at', 'approved_at'
            ]

            with open(csv_file_path, 'w', encoding='utf-8-sig', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(all_rows)

        return csv_file_path


class StaffAvailabilityViewSet(viewsets.ModelViewSet):
    """スタッフ稼働可能情報管理"""
    queryset = StaffAvailability.objects.all()
    serializer_class = StaffAvailabilitySerializer

    @action(detail=False, methods=['get'])
    def by_staff(self, request):
        """スタッフID別の稼働可能情報取得"""
        staff_id = request.query_params.get('staff_id')
        if not staff_id:
            return Response(
                {'error': 'staff_idパラメータは必須です'},
                status=status.HTTP_400_BAD_REQUEST
            )

        availabilities = self.get_queryset().filter(staff_id=staff_id)
        serializer = self.get_serializer(availabilities, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_date_range(self, request):
        """日付範囲での稼働可能情報取得"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if not start_date or not end_date:
            return Response(
                {'error': 'start_dateとend_dateパラメータは必須です'},
                status=status.HTTP_400_BAD_REQUEST
            )

        availabilities = self.get_queryset().filter(
            date__gte=start_date,
            date__lte=end_date
        )
        serializer = self.get_serializer(availabilities, many=True)
        return Response(serializer.data)


class WebhookLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Webhookログ閲覧（デバッグ用）"""
    queryset = WebhookLog.objects.all()
    serializer_class = WebhookLogSerializer

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """最近のログを取得"""
        limit = int(request.query_params.get('limit', 50))
        logs = self.get_queryset()[:limit]
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)
