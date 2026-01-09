from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser, User
from channels.auth import AuthMiddlewareStack
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
import jwt
from urllib.parse import parse_qs

@database_sync_to_async
def get_user(token_key):
    try:
        # Validate the token using SimpleJWT
        access_token = AccessToken(token_key)
        user_id = access_token.payload['user_id']
        return User.objects.get(id=user_id)
    except (InvalidToken, TokenError, User.DoesNotExist, jwt.exceptions.DecodeError, KeyError) as e:
        # print(f"WebSocket Auth Error: {str(e)}") # Debug log
        return AnonymousUser()

class JWTAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        # 1. Parse Query String safely
        query_string = scope.get('query_string', b'').decode('utf-8')
        query_params = parse_qs(query_string)
        
        # 2. Get token (parse_qs returns a list, e.g., {'token': ['abc...']})
        token = query_params.get('token', [None])[0]

        if token:
            scope['user'] = await get_user(token)
            print(f"WebSocket Auth Success: User {scope['user']}")
        else:
            # If no token, we rely on the inner AuthMiddlewareStack (Session)
            # or leave it as Anonymous if that fails too.
            if 'user' not in scope: 
                scope['user'] = AnonymousUser()

        return await self.inner(scope, receive, send)

def JWTAuthMiddlewareStack(inner):
    # Wrap standard AuthMiddlewareStack (Sessions) with our JWT Middleware
    # Order: Request -> SessionAuth -> JWTAuth (overrides session if token present) -> Consumer
    return AuthMiddlewareStack(JWTAuthMiddleware(inner))