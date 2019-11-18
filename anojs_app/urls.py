from django.conf.urls import url
from . import views

urlpatterns = [
    url("^$", views.index, name="index"),
    url("^animations", views.animations, name="animations"),
    url("^submit", views.submit, name="submit"),
    url("^contact-us", views.contact_us, name="contact_us"),
    url("^success", views.success, name="success"),
    url("^faq/", views.faq, name="faq"),
    url("^how-to-use-anojs", views.how_to_use_anojs, name="how_to_use_anojs"),
    url("^our-team", views.our_team, name="our_team"),
]
