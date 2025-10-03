from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ShiftRequestViewSet, StaffAvailabilityViewSet, WebhookLogViewSet

router = DefaultRouter()
router.register(r'shift-requests', ShiftRequestViewSet, basename='shift-request')
router.register(r'availabilities', StaffAvailabilityViewSet, basename='availability')
router.register(r'webhook-logs', WebhookLogViewSet, basename='webhook-log')

urlpatterns = [
    path('', include(router.urls)),
]
