"""
ASGI config for core project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
import django

# 1. Set the settings module first
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# 2. Explicitly setup Django. 
# This loads settings and populates the app registry (models).
# We do this BEFORE importing anything else that might touch the database.
django.setup()

# 3. Now it is safe to import Django utilities and your project code
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from authentication.middleware import JWTAuthMiddlewareStack
import getmodel.routing

# 4. Initialize the default Django ASGI application for HTTP
django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddlewareStack(
        URLRouter(
            getmodel.routing.websocket_urlpatterns
        )
    ),
})