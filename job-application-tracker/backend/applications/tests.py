from django.test import TestCase
  from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.authtoken.models import Token
from django.urls import reverse

from .models import JobApplication


class JobApplicationAPITests(APITestCase):

    def setUp(self):
        # Create two separate users
        self.user1 = User.objects.create_user(
            username="user_one",
            password="TestPassword123!"
        )

        self.user2 = User.objects.create_user(
            username="user_two",
            password="TestPassword123!"
        )

        # Create an application belonging to user one
        self.application = JobApplication.objects.create(
            owner=self.user1,
            company_name="Safaricom",
            job_title="Software Developer",
            location="Nairobi",
            status="Applied"
        )

        # Authenticate the first user
        self.client.force_authenticate(user=self.user1)

    def test_authenticated_user_can_view_applications(self):
        response = self.client.get(
            reverse("application-list")
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]["company_name"],
            "Safaricom"
        )

    def test_unauthenticated_user_cannot_view_applications(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(
            reverse("application-list")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_users_only_see_their_own_applications(self):
        self.client.force_authenticate(user=self.user2)

        response = self.client.get(
            reverse("application-list")
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_user_can_create_application(self):
        response = self.client.post(
            reverse("application-list"),
            {
                "company_name": "Demo Technologies",
                "job_title": "Junior Developer",
                "location": "Nairobi",
                "status": "Applied"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        new_application = JobApplication.objects.get(
            company_name="Demo Technologies"
        )

        self.assertEqual(new_application.owner, self.user1)

    def test_user_cannot_access_another_users_application(self):
        self.client.force_authenticate(user=self.user2)

        response = self.client.get(
            reverse(
                "application-detail",
                kwargs={"pk": self.application.pk}
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_user_can_update_own_application(self):
        response = self.client.patch(
            reverse(
                "application-detail",
                kwargs={"pk": self.application.pk}
            ),
            {"status": "Interview"},
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.application.refresh_from_db()
        self.assertEqual(self.application.status, "Interview")

    def test_user_can_delete_own_application(self):
        response = self.client.delete(
            reverse(
                "application-detail",
                kwargs={"pk": self.application.pk}
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT
        )

        self.assertFalse(
            JobApplication.objects.filter(
                pk=self.application.pk
            ).exists()
        )

    def test_user_cannot_delete_another_users_application(self):
        self.client.force_authenticate(user=self.user2)

        response = self.client.delete(
            reverse(
                "application-detail",
                kwargs={"pk": self.application.pk}
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

        self.assertTrue(
            JobApplication.objects.filter(
                pk=self.application.pk
            ).exists()
        )


class AuthenticationAPITests(APITestCase):

    def test_user_can_log_in_and_receive_token(self):
        User.objects.create_user(
            username="login_test",
            password="TestPassword123!"
        )

        response = self.client.post(
            reverse("api_token_auth"),
            {
                "username": "login_test",
                "password": "TestPassword123!"
            },
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)

    def test_user_can_register(self):
        response = self.client.post(
            reverse("register"),
            {
                "username": "new_test_user",
                "email": "newuser@example.com",
                "password": "TestPassword123!"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        self.assertTrue(
            User.objects.filter(username="new_test_user").exists()
        )

    def test_duplicate_username_registration_is_rejected(self):
        User.objects.create_user(
            username="existing_user",
            password="TestPassword123!"
        )

        response = self.client.post(
            reverse("register"),
            {
                "username": "existing_user",
                "email": "another@example.com",
                "password": "TestPassword123!"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

