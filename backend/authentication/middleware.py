# RAG_DJANGO_CHATAPP-p1/backend/authentication/middleware.py
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser, User
from channels.auth import AuthMiddlewareStack
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
import jwt 

@database_sync_to_async
def get_user(token_key):
    try:
        decoded_data = AccessToken(token_key).payload
        user_id = decoded_data['user_id']
        return User.objects.get(id=user_id)
    except (InvalidToken, TokenError, User.DoesNotExist, jwt.exceptions.DecodeError):
        return AnonymousUser()

class JWTAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode('utf-8')
        query_params = dict(qp.split('=') for qp in query_string.split('&') if '=' in qp)
        token = query_params.get('token')

        if token:
            scope['user'] = await get_user(token)
        else:
            scope['user'] = AnonymousUser()

        return await self.inner(scope, receive, send)

def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(AuthMiddlewareStack(inner))