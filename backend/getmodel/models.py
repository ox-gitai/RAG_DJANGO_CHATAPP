from django.db import models
import uuid
from django.utils import timezone


class Conversation(models.Model):
    """Model to store conversation history"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=500, help_text="Title of the conversation")
    messages = models.JSONField(default=list, help_text="List of messages in the conversation")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['-updated_at']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # Auto-generate title from first user message if not set
        if not self.title and self.messages:
            for msg in self.messages:
                if msg.get('role') == 'user':
                    content = msg.get('content', 'Untitled')
                    # Trim to first 100 chars, remove newlines, and clean up
                    self.title = content.replace('\n', ' ')[:100].strip()
                    break
        if not self.title:
            self.title = 'Untitled'
        super().save(*args, **kwargs)