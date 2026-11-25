
from django.db import models
from django.utils import timezone


class JobApplication(models.Model):
    owner = models.ForeignKey(
    'auth.User',
    on_delete=models.CASCADE,
    related_name='job_applications',
)

    STATUS_CHOICES = [
        ("Applied", "Applied"),
        ("Interview", "Interview"),
        ("Rejected", "Rejected"),
        ("Offer", "Offer"),
    ]

    company_name = models.CharField(max_length=100)
    job_title = models.CharField(max_length=100)
    location = models.CharField(max_length=100, blank=True)
    application_date = models.DateField(default=timezone.localdate)

    follow_up_date = models.DateField(
        null=True,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Applied",
    )

    job_description = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.job_title} at {self.company_name}"
