# backend/api/views.py
from django.contrib.auth.models import User
from rest_framework import generics
from rest_framework.permissions import AllowAny
from .serializer import RegisterSerializer
from django.shortcuts import redirect
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from .crypto import get_public_key_pem
from .serializer import EncryptedTokenObtainPairSerializer, RegisterSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,) # Allow unauthenticated users to access this
    serializer_class = RegisterSerializer

# class LoginView(generics.CreateAPIView):
#     permission_classes = (AllowAny,) # Allow unauthenticated users to access this
#     serializer_class = RegisterSerializer


    # def post(self, request):
    #     if request.is_valid():
    #         return redirect('getmodel:')

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = EncryptedTokenObtainPairSerializer

@api_view(['GET'])
@permission_classes([AllowAny])
def get_public_key(request):
    return JsonResponse({'public_key': get_public_key_pem()})