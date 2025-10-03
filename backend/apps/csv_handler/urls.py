from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CSVUploadViewSet

router = DefaultRouter()
router.register(r'csv', CSVUploadViewSet, basename='csv')

urlpatterns = [
    path('', include(router.urls)),
]
