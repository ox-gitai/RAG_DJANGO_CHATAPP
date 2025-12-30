from django.http import StreamingHttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import Conversation
import json
import requests
import logging

logger = logging.getLogger(__name__)

OLLAMA_API_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "phi:2.7b"  # Change this to your desired model
OLLAMA_TIMEOUT = 300  # 5 minutes timeout for streaming


@csrf_exempt
def chat_stream_view(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid method. Use POST!!!"}, status=405)

    try:
        data = json.loads(request.body)
        messages = data.get("messages", [])
        conversation_id = data.get("conversation_id")
        
        if not messages:
            return JsonResponse({"error": "No messages provided"}, status=400)

        def stream_generator():
            """Generator to stream the response from Ollama"""
            try:
                response = requests.post(
                    OLLAMA_API_URL,
                    json={
                        "model": MODEL_NAME,
                        "messages": messages,
                        "stream": True
                    },
                    stream=True,
                    timeout=OLLAMA_TIMEOUT  
                )
                
                if response.status_code != 200:
                    logger.error(f"Ollama returned status {response.status_code}")
                    yield json.dumps({
                        "error": f"Ollama error: {response.status_code}",
                        "done": True
                    }) + "\n"
                    return
                
                for line in response.iter_lines():
                    if line:
                        try:
                            chunk = json.loads(line)
                            # Forward the chunk to client
                            yield json.dumps(chunk) + "\n"
                        except json.JSONDecodeError:
                            logger.debug(f"Failed to parse line: {line}")
                            continue
                            
            except requests.exceptions.ConnectionError:
                logger.error("Failed to connect to Ollama service")
                yield json.dumps({
                    "error": "Ollama service is unavailable",
                    "done": True
                }) + "\n"
            except requests.exceptions.Timeout:
                logger.error("Ollama request timeout")
                yield json.dumps({
                    "error": "Request timeout - response took too long",
                    "done": True
                }) + "\n"
            except Exception as e:
                logger.error(f"Unexpected error in stream_generator: {str(e)}")
                yield json.dumps({
                    "error": "An unexpected error occurred",
                    "done": True
                }) + "\n"

        return StreamingHttpResponse(
            stream_generator(),
            content_type="application/x-ndjson"
        )

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON in request body"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def save_conversation(request):
    try:
        data = json.loads(request.body)
        messages = data.get("messages", [])
        conversation_id = data.get("conversation_id")
        title = data.get("title", "")
        
        if not messages:
            return JsonResponse({"error": "No messages provided"}, status=400)
        
        if conversation_id:
            try:
                conversation = Conversation.objects.get(id=conversation_id)
                
                if len(conversation.messages) != len(messages) or (conversation.messages and messages and conversation.messages[-1] != messages[-1]):
                    conversation.messages = messages
                    # Only update title if a new title is provided
                    if title:
                        conversation.title = title
                    # If no title and no current title, auto-generate
                    if not conversation.title:
                        conversation.title = ""
                    conversation.save()
                # If messages haven't changed, just return existing conversation
            except Conversation.DoesNotExist:
                # Create new if doesn't exist
                conversation = Conversation.objects.create(
                    id=conversation_id,
                    messages=messages,
                    title=title
                )
        else:
            # Create new conversation
            conversation = Conversation.objects.create(
                messages=messages,
                title=title
            )
        
        return JsonResponse({
            "success": True,
            "conversation_id": str(conversation.id),
            "title": conversation.title
        })
        
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON in request body"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def get_conversations(request):
    """Retrieve all conversations with pagination"""
    try:
        # Get pagination parameters
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 20))
        
        # Validate pagination parameters
        if page < 1:
            page = 1
        if limit < 1 or limit > 100:
            limit = 20
            
        offset = (page - 1) * limit
        
        # Use count() with filter to avoid counting all objects
        total_count = Conversation.objects.count()
        
        # Optimize query: only fetch metadata, use order_by before slice
        conversations = list(
            Conversation.objects.order_by('-updated_at').values(
                'id', 'title', 'created_at', 'updated_at'
            )[offset:offset+limit]
        )
        
        return JsonResponse({
            "conversations": conversations,
            "count": len(conversations),
            "total": total_count,
            "page": page,
            "limit": limit,
            "pages": (total_count + limit - 1) // limit
        })
    except ValueError:
        return JsonResponse({"error": "Invalid pagination parameters"}, status=400)
    except Exception as e:
        logger.error(f"Error fetching conversations: {str(e)}")
        return JsonResponse({"error": "Failed to fetch conversations"}, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def get_conversation(request, conversation_id):
    """Retrieve a specific conversation"""
    try:
        conversation = Conversation.objects.get(id=conversation_id)
        return JsonResponse({
            "id": str(conversation.id),
            "title": conversation.title,
            "messages": conversation.messages,
            "created_at": conversation.created_at.isoformat(),
            "updated_at": conversation.updated_at.isoformat()
        })
    except Conversation.DoesNotExist:
        return JsonResponse({"error": "Conversation not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["DELETE"])
def delete_conversation(request, conversation_id):
    """Delete a conversation"""
    try:
        conversation = Conversation.objects.get(id=conversation_id)
        conversation.delete()
        return JsonResponse({"success": True, "message": "Conversation deleted"})
    except Conversation.DoesNotExist:
        return JsonResponse({"error": "Conversation not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def ollama_health_check(request):
    """Check if backend and Ollama are running"""
    try:
        response = requests.get(f"{OLLAMA_API_URL.rsplit('/', 1)[0]}/tags", timeout=5)
        if response.status_code == 200:
            models = response.json().get("models", [])
            return JsonResponse({
                "backend": "running",
                "ollama": "running",
                "available_models": [m.get("name") for m in models]
            })
        else:
            return JsonResponse({
                "backend": "running",
                "ollama": "error",
                "error": "Failed to get models from Ollama"
            }, status=500)
    except requests.exceptions.ConnectionError:
        return JsonResponse({
            "backend": "running",
            "ollama": "offline",
            "error": "Cannot connect to Ollama at http://localhost:11434"
        }, status=500)
    except Exception as e:
        return JsonResponse({
            "backend": "running",
            "error": str(e)
        }, status=500)