# backend/api/serializers.py
from django.contrib.auth.models import User
from rest_framework import serializers
from django.db import models
import uuid
class RegisterSerializer(serializers.ModelSerializer):
    # class Meta:
    #     model = User
    #     fields = ('username', 'password')
    #     extra_kwargs = {'password': {'write_only': True}}

    class Meta:
        model = User
        fields = ('username', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            # id=models.IntegerField(default=uuid.uuid4, unique=True,primary_key=True, editable=False),
            username=validated_data['username'],
            password=validated_data['password'],
        )
        return user
    
