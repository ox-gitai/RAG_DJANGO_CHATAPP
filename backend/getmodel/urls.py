from django.urls import path
from . import views

app_name = 'getmodel'

urlpatterns = [
    # Chat endpoints
    path('chat/', views.chat_stream_view, name='chat_stream'),
    path("saved/",views.save_conversation, name='save_conversation'),
    path("conversation/",views.get_conversation,name="individiual_conversation"),
    path("conversation/all/",views.get_conversations,name="all_conversation"),
    path("delete/",views.delete_conversation,name="delete_conversation"),
    path("ollamarun/",views.ollama_health_check,name="ollama_running_state"),
]