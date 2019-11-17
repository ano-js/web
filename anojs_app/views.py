from django.shortcuts import render

# Going back a directory to import MEDIA_ROOT
import sys
sys.path.append("..")

# Importing MEDIA_ROOT
from anojs_project import settings

import os
from os import listdir
from os.path import isfile, join

# Create your views here.
def index(request):
    return render(request, "anojs_app/index.html")

def gallery(request):
    return render(request, "anojs_app/gallery.html")

def animations(request):
    # Format: [[filename, filename_link], [filename, filename_link]]
    # Iterate through this twice
    filenames = []
    for filename in [f for f in listdir(settings.MEDIA_ROOT) if isfile(join(settings.MEDIA_ROOT, f))]:
        file_list = []
        # Appending formatted filename
        filename_list = filename.split("-")[1:]
        # filename_list[-1] = filename_list[-1][:-3]
        new_filename = " ".join(filename_list).title()[:-3]
        file_list.append(new_filename)

        # Appending link to JS file
        file_list.append("/media/" + filename)

        # Appending mov file link
        file_list.append("/media/videos/" + new_filename + ".mov")

        # Appending the div tag
        file_list.append("<div id='" + filename[:-3] + "'></div>")

        # Appending the script tag
        file_list.append("<script src='http://" + request.META['HTTP_HOST'] + "/media/" + filename + "'></script>")

        # Appending list
        filenames.append(file_list)

    return render(request, "anojs_app/animations.html", context={"animations": filenames})

def submit(request):
    return render(request, "anojs_app/submit.html")

def success(request):
    return render(request, "anojs_app/success.html")
