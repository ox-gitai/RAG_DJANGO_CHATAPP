import json
import httpx 
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser 
from django.conf import settings

from .models import Conversation

logger = logging.getLogger(__name__)

OLLAMA_API_URL = "http://localhost:11434/api/chat"

# Import dynamic model getter from views
from .views import get_current_model

OLLAMA_TIMEOUT = 300 

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]

        # Debug log
        print(f"Consumer Connection Attempt: {self.user}")

        if self.user.is_anonymous:
            # Accept strictly to send a close frame, then close
            # (Browsers sometimes don't read the close code if you reject without accepting)
            await self.accept()
            await self.close(code=4001) 
            return

        self.conversation_id = self.scope['url_route']['kwargs'].get('conversation_id')

        if self.conversation_id:
            self.conversation_group_name = f'chat_{self.conversation_id}'
        else:
            self.conversation_group_name = f'user_chat_{self.user.id}'

        await self.channel_layer.group_add(
            self.conversation_group_name,
            self.channel_name
        )
        await self.accept()

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

            #  GET OR CREATE CONVERSATION
            conversation = None
            if conversation_id:
                # helper is wrapped in @database_sync_to_async
                conversation = await self.get_conversation_safe(conversation_id)
            
            if not conversation:
            
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

            
            # This is done via a helper to ensure 'conversation.messages' access doesn't trigger sync issues
            messages = await self.append_user_message_safe(conversation, user_message_content)
  
            await self.send(text_data=json.dumps({
                "type": "status",
                "content": "Thinking...",
                "conversation_id": str(conversation.id)
            }))


            assistant_response_content = ""
            try:
                async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
                    # Use client.stream instead of client.post
                    async with client.stream(
                        "POST",
                        OLLAMA_API_URL,
                        json={"model": get_current_model(), "messages": messages, "stream": True},
                        follow_redirects=True
                    ) as response:
                        
                        if response.status_code != 200:
                            raise Exception(f"Ollama API Error: {response.status_code}")

                        async for chunk_line in response.aiter_lines():
                            if chunk_line:
                                try:
                                    chunk = json.loads(chunk_line)
                                    if chunk.get('done'):
                                        break
                                    content_part = chunk.get('message', {}).get('content', '')
                                    if content_part:
                                        assistant_response_content += content_part
                                        
                                        # Send chunk to frontend
                                        await self.send(text_data=json.dumps({
                                            "type": "chat_message",
                                            "role": "assistant",
                                            "content_part": content_part,
                                            "conversation_id": str(conversation.id)
                                        }))
                                except json.JSONDecodeError:
                                    continue

            except httpx.ReadTimeout:
                # Handle Model Timeout specifically
                await self.send(text_data=json.dumps({
                    "type": "error", 
                    "content": "Model timed out generating response."
                }))
            except Exception as e:
                logger.error(f"Ollama error: {str(e)}")
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "content": f"AI Error: {str(e)}"
                }))
            finally:
                # IMPORTANT: Always save what we have, even if partial
                if assistant_response_content:
                    await self.append_assistant_message_safe(conversation, assistant_response_content)
                
                # Signal frontend that stream is dead/done
                await self.send(text_data=json.dumps({
                    "type": "done", 
                    "conversation_id": str(conversation.id)
                }))

        except Exception as e:
            logger.error(f"General WebSocket error: {e}")
    # --------------Databse Helpers [wrapped]--------------

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