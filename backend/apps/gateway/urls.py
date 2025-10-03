from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ShiftRequestViewSet, StaffAvailabilityViewSet, WebhookLogViewSet
from .ai_views import AIViewSet

router = DefaultRouter()
router.register(r'shift-requests', ShiftRequestViewSet, basename='shift-request')
router.register(r'availabilities', StaffAvailabilityViewSet, basename='availability')
router.register(r'webhook-logs', WebhookLogViewSet, basename='webhook-log')
router.register(r'ai', AIViewSet, basename='ai')

urlpatterns = [
    path('', include(router.urls)),
]
