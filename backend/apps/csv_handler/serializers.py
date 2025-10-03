from rest_framework import serializers
from .models import CSVUpload


class CSVUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = CSVUpload
        fields = ['id', 'file_name', 'file_type', 'uploaded_at', 'rows_processed', 'status', 'error_message']
        read_only_fields = ['id', 'uploaded_at', 'rows_processed', 'status', 'error_message']


class CSVFileUploadSerializer(serializers.Serializer):
    """CSVファイルアップロード用のシリアライザ"""
    file = serializers.FileField()
    file_type = serializers.ChoiceField(
        choices=[
            ('shifts', 'シフト実績'),
            ('staff', 'スタッフ'),
            ('budget', '予算'),
            ('payroll', '給与'),
        ]
    )

    def validate_file(self, value):
        """CSVファイルのバリデーション"""
        if not value.name.endswith('.csv'):
            raise serializers.ValidationError("CSVファイルのみアップロード可能です。")

        # ファイルサイズチェック (10MB制限)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("ファイルサイズは10MB以下にしてください。")

        return value
