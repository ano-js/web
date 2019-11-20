from django.db import models

class Subscriber(models.Model):
    name = models.CharField(max_length=100)
    email = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Review(models.Model):
    name = models.CharField(max_length=100)
    title = models.CharField(max_length=100)
    message = models.CharField(max_length=1000)

    def __str__(self):
        return self.name

class Animation(models.Model):
    creator_name = models.CharField(max_length=100)
    creator_email = models.CharField(max_length=100)
    animation_name = models.CharField(max_length=100)
    animation_file = models.FileField()

    def __str__(self):
        return self.animation_name
