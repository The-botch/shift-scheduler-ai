from django.db import models


class CSVUpload(models.Model):
    """CSVファイルのアップロード履歴を記録"""
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50)  # shifts, staff, budget, etc.
    uploaded_at = models.DateTimeField(auto_now_add=True)
    rows_processed = models.IntegerField(default=0)
    status = models.CharField(
        max_length=20,
        choices=[
            ('success', '成功'),
            ('failed', '失敗'),
            ('processing', '処理中'),
        ],
        default='processing'
    )
    error_message = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.file_name} - {self.uploaded_at}"
