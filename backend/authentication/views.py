# backend/api/views.py
from django.contrib.auth.models import User
from rest_framework import generics
from rest_framework.permissions import AllowAny
from .serializer import RegisterSerializer
from django.shortcuts import redirect

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