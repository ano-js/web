from django import forms
from . import models

class AnimationForm(forms.ModelForm):
    creator_name = forms.CharField(label="", widget=forms.TextInput(attrs={"class": "form-input", "placeholder": "Full Name"}))
    creator_email = forms.CharField(label="", widget=forms.TextInput(attrs={"class": "form-input", "placeholder": "Email"}))
    animation_name = forms.CharField(label="", widget=forms.TextInput(attrs={"class": "form-input", "placeholder": "Animation Name"}))
    animation_file = forms.FileField(label="", widget=forms.FileInput(attrs={"id": "file"}))

    class Meta:
        model = models.Animation
        fields = ('creator_name', 'creator_email', 'animation_name', 'animation_file',)
