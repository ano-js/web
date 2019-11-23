from django.shortcuts import render
from django.core.mail import EmailMessage

from django.http import HttpResponseRedirect, HttpResponse

from . import models
from . import forms

# Going back a directory to import MEDIA_ROOT
import sys
sys.path.append("..")

# Importing MEDIA_ROOT
from anojs_project import settings

import os
from os import listdir
from os.path import isfile, join

def handler404(request, *args, **argv):
    return render(request, "errors/404.html")

def handler500(request, *args, **argv):
    return render(request, "errors/500.html")

def index(request):
    if request.method == "POST":
        name = request.POST.get("name")
        email = request.POST.get("email")

        subscriber = models.Subscriber(name=name, email=email)
        subscriber.save()

        email = EmailMessage("Ano.js - " + name + " subscribed to the newsletter!", name + "'s email is " + email, to=["calix.huang1@gmail.com"])
        email.send()

    return render(request, "anojs_app/index.html")

def gallery(request):
    return render(request, "anojs_app/gallery.html")

def animations(request):
    # Review capture
    if request.method == "POST":
        name = request.POST.get("name")
        title = request.POST.get("title")
        message = request.POST.get("message")

        review = models.Review(name=name, title=title, message=message)
        review.save()

        email = EmailMessage("Ano.js - Someone left a review!",
        "Review from " + name + " who is a " + title + ":\n\n" + message,
        to=["calix.huang1@gmail.com"])
        email.send()

    # Format: [[filename, filename_link], [filename, filename_link]]
    # Iterate through this twice
    filenames = []
    for filename in [f for f in listdir(settings.MEDIA_ROOT + "/animation-files/") if isfile(join(settings.MEDIA_ROOT + "/animation-files/", f))]:
        file_list = []

        filename_list = filename.split("-")[1:]

        # Appending non-formatted filename
        non_formatted_filename = "-".join(filename_list)[:-3]
        file_list.append(non_formatted_filename)

        # Appending formatted filename
        formatted_filename = " ".join(filename_list).title()[:-3]
        file_list.append(formatted_filename)

        # Appending mov file link
        file_list.append("https://anojs.s3.us-east-2.amazonaws.com/" + formatted_filename.replace(" ", "+") + ".mov")

        # Appending the div tag
        file_list.append("<div id='" + filename[:-3] + "'></div>")

        # Appending the script tag
        file_list.append("<script src='https://" + request.META['HTTP_HOST'] + "/media/animation-files/" + filename + "'></script>")

        # Appending list
        filenames.append(file_list)

    return render(request, "anojs_app/animations.html", context={"animations": filenames})

def submit(request):
    if request.method == "POST":
        form = forms.AnimationForm(request.POST)

        if form.is_valid():
            pass

        creator_name = form.cleaned_data["creator_name"]
        creator_email = form.cleaned_data["creator_email"]
        animation_name = form.cleaned_data["animation_name"]
        animation_file = request.FILES["animation_file"]

        animation = models.Animation(creator_name=creator_name, creator_email=creator_email, animation_name=animation_name, animation_file=animation_file)
        animation.save()

        return HttpResponseRedirect("/")

    else:
        form = forms.AnimationForm()

    return render(request, "anojs_app/submit.html", context={"form": form})

def contact_us(request):
    if request.method == "POST":
        name = request.POST.get("name")
        email = request.POST.get("email")
        message = request.POST.get("message")

        email = EmailMessage("Ano.js Contact Us Submission",
        "You have a message from " + name + ":\n\n" + message + "\n\nReply to " + email,
        to=["calix.huang1@gmail.com"]
        )
        email.send()

        print('yay')

        return HttpResponseRedirect("/")

    return render(request, "anojs_app/contact_us.html")

def success(request):
    return render(request, "anojs_app/success.html")

# ABOUT PAGES
def faq(request):
    return render(request, "anojs_app/faq.html")

def how_to_use_anojs(request):
    return render(request, "anojs_app/how_to_use_anojs.html")

def our_story(request):
    return render(request, "anojs_app/our_story.html")

def our_team(request):
    return render(request, "anojs_app/our_team.html")

def privacy_policy(request):
    return render(request, "anojs_app/privacy_policy.html")

def terms_and_conditions(request):
    return render(request, "anojs_app/terms_and_conditions.html")
