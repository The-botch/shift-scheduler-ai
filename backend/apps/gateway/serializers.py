from rest_framework import serializers
from .models import ShiftRequest, StaffAvailability, WebhookLog


class StaffAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffAvailability
        fields = [
            'id', 'staff_id', 'staff_name', 'date',
            'available_from', 'available_to', 'preference',
            'note', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ShiftRequestSerializer(serializers.ModelSerializer):
    availabilities = StaffAvailabilitySerializer(many=True, read_only=True)

    class Meta:
        model = ShiftRequest
        fields = [
            'id', 'request_id', 'source', 'source_user_id',
            'staff_id', 'staff_name', 'target_month', 'shift_data',
            'status', 'created_at', 'updated_at', 'processed_at',
            'raw_payload', 'notes', 'availabilities'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ShiftRequestInputSerializer(serializers.Serializer):
    """シフト希望入力用シリアライザ（汎用）"""

    source = serializers.ChoiceField(
        choices=['line', 'web', 'api'],
        default='api'
    )
    source_user_id = serializers.CharField(max_length=255)
    staff_id = serializers.CharField(max_length=50, required=False, allow_blank=True)
    staff_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    target_month = serializers.CharField(max_length=7, help_text="YYYY-MM形式")
    shift_data = serializers.JSONField()
    availabilities = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True
    )
    notes = serializers.CharField(required=False, allow_blank=True)


class WebhookLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebhookLog
        fields = '__all__'
