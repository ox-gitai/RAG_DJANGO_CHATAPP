import json
import httpx 
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser 

from .models import Conversation

logger = logging.getLogger(__name__)

OLLAMA_API_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "phi:2.7b"
OLLAMA_TIMEOUT = 300 

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # 1. Get User
        self.user = self.scope["user"]

        # 2. Check Auth (Safe on AnonymousUser, but if it's a LazyObject this forces eval)
        if self.user.is_anonymous:
            await self.close(code=4001) 
            return

        self.conversation_id = self.scope['url_route']['kwargs'].get('conversation_id')

        # 3. Determine Group Name
        if self.conversation_id:
            self.conversation_group_name = f'chat_{self.conversation_id}'
        else:
            self.conversation_group_name = f'user_chat_{self.user.id}'

        await self.channel_layer.group_add(
            self.conversation_group_name,
            self.channel_name
        )
        await self.accept()
        
        # Safe logging: Don't access database fields like username here to avoid async errors
        logger.info(f"WebSocket connected for user_id {self.user.id}")


    async def disconnect(self, close_code):
        logger.info(f"WebSocket disconnected with code {close_code}")
        if hasattr(self, 'conversation_group_name'):
            await self.channel_layer.group_discard(
                self.conversation_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            user_message_content = data.get('message')
            conversation_id = data.get('conversation_id') 

            if not user_message_content:
                await self.send(text_data=json.dumps({"error": "No message provided"}))
                return

            if self.user.is_anonymous:
                await self.send(text_data=json.dumps({"error": "Authentication required."}))
                return

            # --- DB OPERATION 1: GET OR CREATE CONVERSATION ---
            conversation = None
            if conversation_id:
                # This helper is wrapped in @database_sync_to_async
                conversation = await self.get_conversation_safe(conversation_id)
            
            if not conversation:
                # This helper is also wrapped
                conversation = await self.create_conversation_safe()
                
                # Send update to frontend
                await self.send(text_data=json.dumps({
                    "type": "conversation_id_update",
                    "conversation_id": str(conversation.id)
                }))
                
                # Update consumer state
                self.conversation_id = str(conversation.id)
                self.conversation_group_name = f'chat_{self.conversation_id}'
                await self.channel_layer.group_add(self.conversation_group_name, self.channel_name)

            # --- DB OPERATION 2: UPDATE MESSAGES ---
            # We do this via a helper to ensure 'conversation.messages' access doesn't trigger sync issues
            messages = await self.append_user_message_safe(conversation, user_message_content)

            # Send "Thinking..."
            await self.send(text_data=json.dumps({
                "type": "status",
                "content": "Thinking..."
            }))

            # --- NETWORK OPERATION: OLLAMA STREAMING ---
            assistant_response_content = ""
            try:
                async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
                    response = await client.post(
                        OLLAMA_API_URL,
                        json={"model": MODEL_NAME, "messages": messages, "stream": True},
                        follow_redirects=True
                    )
                    response.raise_for_status()

                    async for chunk_line in response.aiter_lines():
                        if chunk_line:
                            try:
                                chunk = json.loads(chunk_line)
                                if chunk.get('done'):
                                    break
                                if chunk.get('message', {}).get('content'):
                                    content_part = chunk['message']['content']
                                    assistant_response_content += content_part
                                    
                                    await self.send(text_data=json.dumps({
                                        "type": "chat_message",
                                        "role": "assistant",
                                        "content_part": content_part,
                                        "conversation_id": str(conversation.id)
                                    }))
                            except json.JSONDecodeError:
                                continue

            except Exception as e:
                logger.error(f"Ollama error: {str(e)}")
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "content": "Error connecting to AI model."
                }))
                return
            finally:
                await self.send(text_data=json.dumps({"type": "done", "conversation_id": str(conversation.id)}))

            # --- DB OPERATION 3: SAVE FINAL RESPONSE ---
            if assistant_response_content:
                await self.append_assistant_message_safe(conversation, assistant_response_content)

        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({"error": "Invalid JSON format"}))
        except Exception as e:
            # Don't access self.user.username here just in case
            logger.error(f"Error receiving WebSocket message: {str(e)}")
            await self.send(text_data=json.dumps({"error": "An internal server error occurred."}))

    # ------------------------------------------------------------------
    # DATABASE HELPERS (ALL WRAPPED)
    # ------------------------------------------------------------------

    @database_sync_to_async
    def get_conversation_safe(self, conversation_id):
        try:
            return Conversation.objects.get(id=conversation_id, user=self.user)
        except Conversation.DoesNotExist:
            return None

    @database_sync_to_async
    def create_conversation_safe(self):
        return Conversation.objects.create(
            user=self.user,
            title="New Conversation",
            messages=[]
        )

    @database_sync_to_async
    def append_user_message_safe(self, conversation, content):
        """Safely append message and return the updated list"""
        # Accessing .messages inside this sync wrapper is 100% safe
        msgs = conversation.messages
        # Ensure it's a list (in case DB defaults failed)
        if not isinstance(msgs, list):
            msgs = []
        
        msgs.append({"role": "user", "content": content})
        conversation.messages = msgs
        # We don't necessarily need to save here if we save at the end, 
        # but saving here ensures persistence even if Ollama crashes.
        conversation.save() 
        return msgs

    @database_sync_to_async
    def append_assistant_message_safe(self, conversation, content):
        """Safely append assistant message and save"""
        msgs = conversation.messages
        if not isinstance(msgs, list):
            msgs = []
            
        msgs.append({"role": "assistant", "content": content})
        conversation.messages = msgs
        conversation.save() # This triggers the title auto-generation logic in models.py
        return msgs