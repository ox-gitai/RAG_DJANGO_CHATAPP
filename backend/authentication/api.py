# from rest_framework import serializers
# from django.contrib.auth import get_user_model # If used custom user model

# UserModel = get_user_model()

# class Meta:
#     model = UserModel
#     # Tuple of serialized model fields (see link [2])
#     fields = ( "id", "username", "password", )

# def create(self, validated_data):

#     user = UserModel.objects.create_user(
#         username=validated_data['username'],
#         password=validated_data['password'],
#     )

#     return user