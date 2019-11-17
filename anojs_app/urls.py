from django.conf.urls import url
from . import views

urlpatterns = [
    url("^$", views.index, name="index"),
    url("^animations", views.animations, name="animations"),
    url("^submit", views.submit, name="submit"),
    url("^success", views.success, name="success"),
]
