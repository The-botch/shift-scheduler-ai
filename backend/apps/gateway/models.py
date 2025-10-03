from django.db import models
from django.utils import timezone


class ShiftRequest(models.Model):
    """シフト希望リクエスト（LINEまたはWebから）"""

    SOURCE_CHOICES = [
        ('line', 'LINE'),
        ('web', 'Webダッシュボード'),
        ('api', 'API直接'),
    ]

    STATUS_CHOICES = [
        ('pending', '未処理'),
        ('processed', '処理済み'),
        ('approved', '承認済み'),
        ('rejected', '却下'),
    ]

    # リクエスト基本情報
    request_id = models.CharField(max_length=100, unique=True, db_index=True)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='api')
    source_user_id = models.CharField(max_length=255, help_text="LINEユーザーIDまたはWebユーザーID")

    # スタッフ情報
    staff_id = models.CharField(max_length=50, blank=True, null=True)
    staff_name = models.CharField(max_length=100, blank=True, null=True)

    # シフト希望情報
    target_month = models.CharField(max_length=7, help_text="YYYY-MM形式")
    shift_data = models.JSONField(help_text="シフト希望の詳細データ")

    # ステータス
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # タイムスタンプ
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(blank=True, null=True)

    # メタデータ
    raw_payload = models.JSONField(blank=True, null=True, help_text="元の生データ")
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['source', 'status']),
            models.Index(fields=['staff_id', 'target_month']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.request_id} - {self.staff_name or self.source_user_id} ({self.target_month})"


class StaffAvailability(models.Model):
    """スタッフの稼働可能情報"""

    staff_id = models.CharField(max_length=50)
    staff_name = models.CharField(max_length=100)
    date = models.DateField()

    # 稼働可能時間帯
    available_from = models.TimeField(blank=True, null=True)
    available_to = models.TimeField(blank=True, null=True)

    # 希望区分
    PREFERENCE_CHOICES = [
        ('preferred', '希望'),
        ('available', '可能'),
        ('unavailable', '不可'),
        ('off', '休み希望'),
    ]
    preference = models.CharField(max_length=20, choices=PREFERENCE_CHOICES)

    # メモ
    note = models.TextField(blank=True, null=True)

    # 関連リクエスト
    shift_request = models.ForeignKey(
        ShiftRequest,
        on_delete=models.CASCADE,
        related_name='availabilities',
        blank=True,
        null=True
    )

    # タイムスタンプ
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date', 'staff_id']
        indexes = [
            models.Index(fields=['staff_id', 'date']),
            models.Index(fields=['date', 'preference']),
        ]

    def __str__(self):
        return f"{self.staff_name} - {self.date} ({self.preference})"


class WebhookLog(models.Model):
    """Webhookログ（デバッグ用）"""

    source = models.CharField(max_length=50)
    endpoint = models.CharField(max_length=200)
    method = models.CharField(max_length=10)
    headers = models.JSONField(blank=True, null=True)
    payload = models.JSONField(blank=True, null=True)
    response_status = models.IntegerField(blank=True, null=True)
    response_body = models.JSONField(blank=True, null=True)
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.source} - {self.endpoint} ({self.created_at})"
