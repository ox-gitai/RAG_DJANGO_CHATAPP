from django.http import StreamingHttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Conversation
from .serializers import ConversationListSerializer, ConversationDetailSerializer, ConversationCreateSerializer
import json
import requests
import logging
import uuid

logger = logging.getLogger(__name__)

OLLAMA_API_URL = "http://localhost:11434/api/chat"
OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_TIMEOUT = 300  # 5 minutes timeout for streaming

# Global variable to track current model (defaults to settings.OLLAMA_MODEL)
_current_model = None

def get_current_model():
    """Get the currently active Ollama model"""
    global _current_model
    return _current_model or settings.OLLAMA_MODEL

def set_current_model(model_name):
    """Set the active Ollama model"""
    global _current_model
    _current_model = model_name


@csrf_exempt
def chat_stream_view(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid method. Use POST!!!"}, status=405)

    try:
        data = json.loads(request.body)
        messages = data.get("messages", [])
        
        if not messages:
            return JsonResponse({"error": "No messages provided"}, status=400)

        def stream_generator():
            """Generator to stream the response from Ollama"""
            try:
                response = requests.post(
                    OLLAMA_API_URL,
                    json={
                        "model": get_current_model(),
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
                # print(response)
                
                # yield json.dump(response)
                print(response.iter_lines())
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_conversation(request, conversation_id):
    """
    Save or update a conversation.

    If title is not provided and conversation has 'New Conversation' as title,
    it will be auto-generated from first user message (20 char limit).
    conversation_id comes from URL path parameter
    """
    try:
        data = request.data
        messages = data.get("messages", [])
        title = data.get("title", "")
        
        if not messages:
            return Response(
                {"error": "No messages provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Ensure user owns this conversation
            conversation = Conversation.objects.get(
                id=conversation_id,
                user=request.user
            )
            
            # Update messages
            conversation.messages = messages
            
            # If title not provided and current title is default, let model auto-generate
            if not title:
                if conversation.title == "New Conversation":
                    # Will be auto-generated by model.save() from first user message (20 chars)
                    pass  # Don't set title, let model handle it
                # else: keep existing title
            else:
                # Use provided title
                conversation.title = title
            
            conversation.save()
            
        except Conversation.DoesNotExist:
            return Response(
                {"error": "Conversation not found or unauthorized"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ConversationDetailSerializer(conversation)
        return Response({
            "success": True,
            "conversation": serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error saving conversation: {str(e)}")
        return Response(
            {"error": "Failed to save conversation"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_conversations(request):
    """
    Retrieve all conversations for the authenticated user with pagination.
    For new users with no conversations, returns an empty list (not an error).
    Query params: page (default 1), limit (default 20, max 100)
    """
    try:
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 20))
        
        if page < 1:
            page = 1
        if limit < 1 or limit > 100:
            limit = 20
            
        offset = (page - 1) * limit
        
        # Getting only conversations for the current user
        # This will return empty queryset for new users
        user_conversations = Conversation.objects.filter(user=request.user)
        total_count = user_conversations.count()
        
        # Fetch paginated results
        conversations = user_conversations.order_by('-updated_at')[offset:offset+limit]
        
        serializer = ConversationListSerializer(conversations, many=True)
        
        return Response({
            "conversations": serializer.data,
            "count": len(serializer.data),
            "total": total_count,
            "page": page,
            "limit": limit,
            "pages": (total_count + limit - 1) // limit if total_count > 0 else 1
        })
        
    except ValueError:
        return Response(
            {"error": "Invalid pagination parameters"},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error fetching conversations: {str(e)}")
        return Response(
            {"error": "Failed to fetch conversations"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_conversation(request, conversation_id):
    """Retrieve a specific conversation for the authenticated user"""
    try:
        conversation = Conversation.objects.get(
            id=conversation_id,
            user=request.user
        )
        serializer = ConversationDetailSerializer(conversation)
        return Response(serializer.data)
        
    except Conversation.DoesNotExist:
        return Response(
            {"error": "Conversation not found or unauthorized"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error fetching conversation: {str(e)}")
        return Response(
            {"error": "Failed to fetch conversation"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_conversation(request, conversation_id):
    """Delete a conversation for the authenticated user"""
    try:
        conversation = Conversation.objects.get(
            id=conversation_id,
            user=request.user
        )
        conversation.delete()
        return Response(
            {"success": True, "message": "Conversation deleted"},
            status=status.HTTP_200_OK
        )
        
    except Conversation.DoesNotExist:
        return Response(
            {"error": "Conversation not found or unauthorized"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error deleting conversation: {str(e)}")
        return Response(
            {"error": "Failed to delete conversation"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_new_conversation(request):
    """
    Create a new conversation for the user with initial 'New Conversation' title.
    Once user sends first message, title will be overridden with first 20 chars of message.
    Optionally accepts: { "initial_message": "..." }
    Returns 201 Created with the new conversation.
    """
    try:
        initial_message = request.data.get("initial_message", "")
        
        # Create new conversation with default title
        messages = []
        title = "New Conversation"
        
        if initial_message:
            messages = [{
                "role": "user",
                "content": initial_message
            }]

        # Create conversation for the authenticated user
        conversation = Conversation.objects.create(
            user=request.user,
            messages=messages,
            title=title
        )
        
        serializer = ConversationDetailSerializer(conversation)
        return Response(
            {"success": True, "conversation": serializer.data},
            status=status.HTTP_201_CREATED
        )
        
    except Exception as e:
        logger.error(f"Error creating conversation: {str(e)}")
        return Response(
            {"error": f"Failed to create conversation: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_conversation_title(request, conversation_id):
    """Update the title of a conversation"""
    try:
        conversation = Conversation.objects.get(
            id=conversation_id,
            user=request.user
        )
        
        new_title = request.data.get("title")
        if not new_title:
            return Response(
                {"error": "Title is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        conversation.title = new_title
        conversation.save()
        
        serializer = ConversationDetailSerializer(conversation)
        return Response({
            "success": True,
            "conversation": serializer.data
        })
        
    except Conversation.DoesNotExist:
        return Response(
            {"error": "Conversation not found or unauthorized"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error updating conversation title: {str(e)}")
        return Response(
            {"error": "Failed to update conversation title"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def ollama_health_check(request):
    """Check if backend and Ollama are running (no authentication required)"""
    try:
        response = requests.get(f"{OLLAMA_API_URL.rsplit('/', 1)[0]}/tags", timeout=5)
        if response.status_code == 200:
            models = response.json().get("models", [])
            return Response({
                "backend": "running",
                "ollama": "running",
                "available_models": [m.get("name") for m in models]
            })
        else:
            return Response({
                "backend": "running",
                "ollama": "error",
                "error": "Failed to get models from Ollama"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except requests.exceptions.ConnectionError:
        return Response({
            "backend": "running",
            "ollama": "offline",
            "error": "Cannot connect to Ollama at http://localhost:11434"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        return Response({
            "backend": "running",
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([])
def get_current_model_view(request):
    """Get the current model and list of available models"""
    try:
        current = get_current_model()
        default = settings.OLLAMA_MODEL
        
        # Try to get available models from Ollama
        available_models = []
        try:
            response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json().get("models", [])
                available_models = [m.get("name") for m in models]
        except:
            pass
        
        return Response({
            "current_model": current,
            "default_model": default,
            "available_models": available_models
        })
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_model_view(request):
    """Set the active Ollama model"""
    try:
        model_name = request.data.get("model")
        if not model_name:
            return Response({"error": "Model name is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify model exists in Ollama
        try:
            response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json().get("models", [])
                available = [m.get("name") for m in models]
                if model_name not in available:
                    return Response({
                        "error": f"Model '{model_name}' not found",
                        "available_models": available
                    }, status=status.HTTP_404_NOT_FOUND)
        except requests.exceptions.ConnectionError:
            return Response({"error": "Cannot connect to Ollama"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        set_current_model(model_name)
        return Response({
            "success": True,
            "current_model": model_name
        })
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([])
def get_model_status(request):
    """
    Check model status: ready, not_found, or not_ready
    - ready: model exists and can respond to requests
    - not_found: model doesn't exist in Ollama
    - not_ready: Ollama is down or model can't respond
    """
    current = get_current_model()
    
    try:
        # First check if Ollama is running and model exists
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        if response.status_code != 200:
            return Response({
                "status": "not_ready",
                "model": current,
                "message": "Ollama service error"
            })
        
        models = response.json().get("models", [])
        available = [m.get("name") for m in models]
        
        if current not in available:
            return Response({
                "status": "not_found",
                "model": current,
                "available_models": available,
                "message": f"Model '{current}' not found"
            })
        
        # Try a simple request to verify model can respond
        try:
            test_response = requests.post(
                OLLAMA_API_URL,
                json={
                    "model": current,
                    "messages": [{"role": "user", "content": "hi"}],
                    "stream": False
                },
                timeout=10
            )
            if test_response.status_code == 200:
                return Response({
                    "status": "ready",
                    "model": current,
                    "available_models": available
                })
            else:
                return Response({
                    "status": "not_ready",
                    "model": current,
                    "message": f"Model returned status {test_response.status_code}"
                })
        except requests.exceptions.Timeout:
            # Model exists but is slow/loading - treat as ready since it will respond eventually
            return Response({
                "status": "ready",
                "model": current,
                "available_models": available,
                "message": "Model is loading"
            })
            
    except requests.exceptions.ConnectionError:
        return Response({
            "status": "not_ready",
            "model": current,
            "message": "Cannot connect to Ollama"
        })
    except Exception as e:
        return Response({
            "status": "not_ready",
            "model": current,
            "message": str(e)
        })
