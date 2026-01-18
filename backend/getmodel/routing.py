from . import consumers
from django.urls import re_path
websocket_urlpatterns = [
                        # conversation uuid here
    re_path(r'ws/chat/(?P<conversation_id>[0-9a-f-]+)/$', consumers.ChatConsumer.as_asgi()),
    # Path for new conversations or general chat without a specific ID initially
    re_path(r'ws/chat/$', consumers.ChatConsumer.as_asgi()),
]