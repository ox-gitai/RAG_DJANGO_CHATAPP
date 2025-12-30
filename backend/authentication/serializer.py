# backend/api/serializers.py
from django.contrib.auth.models import User
from rest_framework import serializers

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # This is critical: create_user to hash the password
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
        )
        return user
    
