from django.db import models
from django.contrib.auth.models import User
import uuid
from django.utils import timezone


class Conversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations', help_text="User who owns this conversation")
    title = models.CharField(max_length=500, help_text="Title of the conversation")
    messages = models.JSONField(default=list, help_text="List of messages in the conversation")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', '-updated_at']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.title}"

    def save(self, *args, **kwargs):
        # Auto-generate title from first user message (20 char limit)
        if self.title == 'New Conversation' and self.messages:
            # Only auto-generate if title is still default
            for msg in self.messages:
                if msg.get('role') == 'user':
                    content = msg.get('content', '').strip()
                    if content:
                        # Trim to 20 characters, removing newlines
                        self.title = content.replace('\n', ' ')[:20].strip()
                        break
        if not self.title:
            self.title = 'New Conversation'
        super().save(*args, **kwargs)