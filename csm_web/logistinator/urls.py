from django.contrib import admin
from django.urls import path, include

from rest_framework.urlpatterns import format_suffix_patterns
from rest_framework.routers import DefaultRouter

from . import views

urlpatterns = []

rest_urlpatterns = [
    path("matching/create", views.CreateMatching.as_view()),
    path("matching/delete", views.DeleteMatching.as_view()),
    path("matching/<int:pk>/update", views.update, name="update"),
    path("matching/get_by_user", views.get_by_person, name="get_by_user"),
    path("matching/get_by_room", views.get_by_room, name="get_by_room"),
    # all endpoints listed here https://paper.dropbox.com/doc/Scheduler-2.0-K0ZNsLU5DZ7JjGudjqKIt
]

urlpatterns.extend(format_suffix_patterns(rest_urlpatterns))