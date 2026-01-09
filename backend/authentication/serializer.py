# backend/api/serializers.py
from django.contrib.auth.models import User
from rest_framework import serializers
from django.db import models
import uuid
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .crypto import decrypt_password


class EncryptedTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        encrypted_password = attrs.get("password")
        
        # DEBUG PRINTS
        print(f"Received Password Length: {len(encrypted_password) if encrypted_password else 0}")
        
        if encrypted_password and len(encrypted_password) > 50: # Simple check if it looks encrypted
            decrypted = decrypt_password(encrypted_password)
            if decrypted:
                print(f"Decryption Successful: {decrypted}") # Remove this in production!
                attrs["password"] = decrypted
            else:
                print("Decryption FAILED. Key mismatch or wrong format.")
        else:
             print("Password didn't look encrypted.")

        return super().validate(attrs)

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
    
