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
