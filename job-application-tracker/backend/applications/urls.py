from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    JobApplicationViewSet,
    UserRegistrationView,
    UserLogoutView,
)

router = DefaultRouter()
router.register(
    r"applications",
    JobApplicationViewSet,
    basename="application"
)

urlpatterns = [
    path("register/", UserRegistrationView.as_view(), name="register"),
    path("logout/", UserLogoutView.as_view(), name="logout"),
]

urlpatterns += router.urls