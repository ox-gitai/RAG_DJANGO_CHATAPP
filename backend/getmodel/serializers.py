from rest_framework import serializers
from .models import Conversation


class ConversationListSerializer(serializers.ModelSerializer):
    """Serializer for listing conversations (metadata only)"""
    class Meta:
        model = Conversation
        fields = ['id', 'title', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ConversationDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed conversation view with all messages"""
    class Meta:
        model = Conversation
        fields = ['id', 'title', 'messages', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'title']


class ConversationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating conversations"""
    class Meta:
        model = Conversation
        fields = ['id', 'title', 'messages']
        read_only_fields = ['id']
