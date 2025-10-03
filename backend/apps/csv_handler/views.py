import csv
import io
import os
from pathlib import Path
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import CSVUpload
from .serializers import CSVUploadSerializer, CSVFileUploadSerializer


class CSVUploadViewSet(viewsets.ModelViewSet):
    """CSVファイルのアップロードと履歴管理"""
    queryset = CSVUpload.objects.all()
    serializer_class = CSVUploadSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    @action(detail=False, methods=['post'])
    def upload(self, request):
        """CSVファイルをアップロードして解析"""
        serializer = CSVFileUploadSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'error': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        file = serializer.validated_data['file']
        file_type = serializer.validated_data['file_type']

        # CSVアップロード記録を作成
        csv_upload = CSVUpload.objects.create(
            file_name=file.name,
            file_type=file_type,
            status='processing'
        )

        try:
            # CSVファイルを読み込んで解析
            decoded_file = file.read().decode('utf-8-sig')  # BOM対応
            csv_data = csv.DictReader(io.StringIO(decoded_file))

            rows = list(csv_data)

            # データを返す
            csv_upload.rows_processed = len(rows)
            csv_upload.status = 'success'
            csv_upload.save()

            return Response({
                'id': csv_upload.id,
                'file_name': csv_upload.file_name,
                'file_type': file_type,
                'rows_processed': len(rows),
                'data': rows,
                'columns': csv_data.fieldnames if hasattr(csv_data, 'fieldnames') else []
            }, status=status.HTTP_200_OK)

        except Exception as e:
            csv_upload.status = 'failed'
            csv_upload.error_message = str(e)
            csv_upload.save()

            return Response({
                'error': f'CSVファイルの処理中にエラーが発生しました: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def history(self, request):
        """アップロード履歴を取得"""
        uploads = self.get_queryset()
        serializer = self.get_serializer(uploads, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def list_files(self, request):
        """利用可能なCSVファイルの一覧を取得"""
        csv_data_dir = getattr(settings, 'CSV_DATA_DIR', None)
        if not csv_data_dir:
            return Response(
                {'error': 'CSV_DATA_DIRが設定されていません'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        csv_data_path = Path(csv_data_dir)
        if not csv_data_path.exists():
            return Response(
                {'error': 'CSVデータディレクトリが見つかりません'},
                status=status.HTTP_404_NOT_FOUND
            )

        # 全カテゴリをスキャン
        categories = {}
        for category_dir in csv_data_path.iterdir():
            if category_dir.is_dir():
                category_name = category_dir.name
                csv_files = []

                for csv_file in category_dir.glob('*.csv'):
                    if csv_file.is_file():
                        csv_files.append({
                            'filename': csv_file.name,
                            'size': csv_file.stat().st_size,
                            'modified': csv_file.stat().st_mtime
                        })

                if csv_files:
                    categories[category_name] = csv_files

        return Response({
            'total_categories': len(categories),
            'categories': categories
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def file(self, request):
        """既存のCSVファイルを取得"""
        category = request.query_params.get('category')  # master, transactions, history, etc.
        filename = request.query_params.get('filename')  # staff.csv, shift.csv, etc.

        if not category or not filename:
            return Response(
                {'error': 'categoryとfilenameパラメータは必須です'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # セキュリティ: パストラバーサル攻撃を防ぐ
        if '..' in category or '..' in filename:
            return Response(
                {'error': '不正なパスが指定されました'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ファイルパスを構築
        csv_data_dir = getattr(settings, 'CSV_DATA_DIR', None)
        if not csv_data_dir:
            return Response(
                {'error': 'CSV_DATA_DIRが設定されていません'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        file_path = Path(csv_data_dir) / category / filename

        # ファイルの存在確認
        if not file_path.exists():
            return Response(
                {'error': f'ファイルが見つかりません: {category}/{filename}'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not file_path.is_file():
            return Response(
                {'error': '指定されたパスはファイルではありません'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # CSVファイルを読み込んで解析
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                csv_data = csv.DictReader(f)
                rows = list(csv_data)
                columns = csv_data.fieldnames if hasattr(csv_data, 'fieldnames') else []

            return Response({
                'category': category,
                'filename': filename,
                'rows': len(rows),
                'data': rows,
                'columns': columns
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': f'CSVファイルの読み込み中にエラーが発生しました: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def all_files(self, request):
        """全てのCSVファイルのデータを一括取得"""
        csv_data_dir = getattr(settings, 'CSV_DATA_DIR', None)
        if not csv_data_dir:
            return Response(
                {'error': 'CSV_DATA_DIRが設定されていません'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        csv_data_path = Path(csv_data_dir)
        if not csv_data_path.exists():
            return Response(
                {'error': 'CSVデータディレクトリが見つかりません'},
                status=status.HTTP_404_NOT_FOUND
            )

        all_data = {}

        # 全カテゴリをスキャン
        for category_dir in csv_data_path.iterdir():
            if category_dir.is_dir():
                category_name = category_dir.name
                all_data[category_name] = {}

                for csv_file in category_dir.glob('*.csv'):
                    if csv_file.is_file():
                        try:
                            with open(csv_file, 'r', encoding='utf-8-sig') as f:
                                csv_data = csv.DictReader(f)
                                rows = list(csv_data)
                                columns = csv_data.fieldnames if hasattr(csv_data, 'fieldnames') else []

                            all_data[category_name][csv_file.name] = {
                                'rows': len(rows),
                                'data': rows,
                                'columns': columns
                            }
                        except Exception as e:
                            all_data[category_name][csv_file.name] = {
                                'error': str(e)
                            }

        return Response(all_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post', 'put'])
    def save_file(self, request):
        """CSVファイルを保存（新規作成または上書き）"""
        category = request.data.get('category')
        filename = request.data.get('filename')
        data = request.data.get('data')  # list of dicts
        columns = request.data.get('columns')  # list of column names (optional)

        if not category or not filename or not data:
            return Response(
                {'error': 'category, filename, dataパラメータは必須です'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # セキュリティ: パストラバーサル攻撃を防ぐ
        if '..' in category or '..' in filename:
            return Response(
                {'error': '不正なパスが指定されました'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not filename.endswith('.csv'):
            return Response(
                {'error': 'ファイル名は.csvで終わる必要があります'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ファイルパスを構築
        csv_data_dir = getattr(settings, 'CSV_DATA_DIR', None)
        if not csv_data_dir:
            return Response(
                {'error': 'CSV_DATA_DIRが設定されていません'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        category_path = Path(csv_data_dir) / category
        file_path = category_path / filename

        # カテゴリディレクトリが存在しない場合は作成
        if not category_path.exists():
            category_path.mkdir(parents=True, exist_ok=True)

        try:
            # CSVファイルに書き込み
            with open(file_path, 'w', encoding='utf-8-sig', newline='') as f:
                if not data:
                    return Response(
                        {'error': 'データが空です'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # カラム名を取得（指定されていない場合は最初の行から取得）
                if columns:
                    fieldnames = columns
                else:
                    fieldnames = list(data[0].keys())

                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(data)

            return Response({
                'success': True,
                'category': category,
                'filename': filename,
                'rows': len(data),
                'message': 'CSVファイルを保存しました'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': f'CSVファイルの保存中にエラーが発生しました: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['delete'])
    def delete_file(self, request):
        """CSVファイルを削除"""
        category = request.query_params.get('category')
        filename = request.query_params.get('filename')

        if not category or not filename:
            return Response(
                {'error': 'categoryとfilenameパラメータは必須です'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # セキュリティ: パストラバーサル攻撃を防ぐ
        if '..' in category or '..' in filename:
            return Response(
                {'error': '不正なパスが指定されました'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ファイルパスを構築
        csv_data_dir = getattr(settings, 'CSV_DATA_DIR', None)
        if not csv_data_dir:
            return Response(
                {'error': 'CSV_DATA_DIRが設定されていません'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        file_path = Path(csv_data_dir) / category / filename

        # ファイルの存在確認
        if not file_path.exists():
            return Response(
                {'error': f'ファイルが見つかりません: {category}/{filename}'},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            file_path.unlink()  # ファイルを削除

            return Response({
                'success': True,
                'category': category,
                'filename': filename,
                'message': 'CSVファイルを削除しました'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': f'CSVファイルの削除中にエラーが発生しました: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
