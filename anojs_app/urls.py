from django.conf.urls import url
from . import views

urlpatterns = [
    url("^$", views.index, name="index"),
    url("^gallery", views.gallery, name="gallery"),
    url("^animations", views.animations, name="animations"),
]
