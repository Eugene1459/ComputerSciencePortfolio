
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import JobApplication
from .serializers import JobApplicationSerializer


class JobApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return JobApplication.objects.filter(
            owner=self.request.user
        ).order_by("-application_date")

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
