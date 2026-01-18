from django.urls import path
from . import views

app_name = 'getmodel'

urlpatterns = [
    # Chat streaming endpoint
    # path('chat/', views.chat_stream_view, name='chat_stream'),
    
    # Conversation management endpoints
    path('conversations/', views.get_conversations, name='all_conversations'),
    path('conversations/create/', views.create_new_conversation, name='create_conversation'),
    path('conversations/<uuid:conversation_id>/', views.get_conversation, name='get_conversation'),
    path('conversations/<uuid:conversation_id>/save/', views.save_conversation, name='save_conversation'),
    path('conversations/<uuid:conversation_id>/update-title/', views.update_conversation_title, name='update_conversation_title'),
    path('conversations/<uuid:conversation_id>/delete/', views.delete_conversation, name='delete_conversation'),
    
    # Health check endpoint
    path('health/ollama/', views.ollama_health_check, name='ollama_health_check'),
    
    # Model management endpoints
    path('model/current/', views.get_current_model_view, name='get_current_model'),
    path('model/set/', views.set_model_view, name='set_model'),
    path('model/status/', views.get_model_status, name='model_status'),
]