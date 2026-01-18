import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMessage, faPaperPlane, faArrowAltCircleRight, faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import { faChevronDown, } from '@fortawesome/free-solid-svg-icons';
import { ShimmeringText } from './ui/shimmering-text';
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import GlassSurface from './ui/LiquidGlass';

const ChatPage = () => {
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [currentMessages, setCurrentMessages] = useState([]);
    const [socketScope, setSocketScope] = useState(null);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [error, setError] = useState('');
    const [websocket, setWebsocket] = useState(null);
    const [isWsReady, setIsWsReady] = useState(false);
    const currentConversationIdRef = useRef(currentConversationId);
    const incomingBufferRef = useRef('');
    const lastRenderedTimeRef = useRef(0);

    // Model selection state
    const [selectedModel, setSelectedModel] = useState('');
    const [availableModels, setAvailableModels] = useState([]);
    const [modelStatus, setModelStatus] = useState('not_ready'); // 'ready', 'not_found', 'not_ready'
    const [showModelDropdown, setShowModelDropdown] = useState(false);

    // const isLogin = useStore((state) => state.isLogin);
    const messagesEndRef = useRef(null);

    const API_BASE_URL = 'http://127.0.0.1:8000'; // For REST APIs
    const WS_BASE_URL = 'ws://127.0.0.1:8000'; // For WebSocket

    // Auto-scroll to latest message
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [currentMessages]);

    // JWT Refresh Logic 
    const refreshToken = async () => {
        const refresh = localStorage.getItem('refresh_token');
        if (refresh) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh: refresh })
                });
                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('access_token', data.access);
                    if (data.refresh) { localStorage.setItem('refresh_token', data.refresh); }
                    return data.access;
                } else {
                    console.error("Failed to refresh token:", data);
                    navigate('/login');
                    return null;
                }
            } catch (error) {
                console.error("Token refresh failed", error);
                navigate('/login');
                return null;
            }
        }
        navigate('/login'); // No refresh token, force login
        return null;
    };

    const parseJwt = (token) => {
        try {
            if (!token) return {};
            // the JWT has three parts separated by dots.
            // `header.payload.signature`
            // we need the payload, which is the second part, that contains the exp field
            // exp field tells us when the token expires
            // these are base64Url encoded, so we need to decode it
            // we return the parsed JSON object
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(window.atob(base64));
        } catch (e) { return {}; }
    };

    // Check token validity and refresh if needed
    const checkAndRefresh = async () => {
        let token = localStorage.getItem('access_token');

        if (!token) {
            navigate('/login');
            return null;
        }

        const decoded = parseJwt(token);
        const currentTime = Math.floor(Date.now() / 1000);

        // If token is invalid or expiring in < 30s
        if (!decoded.exp || decoded.exp < currentTime + 30) {
            console.log("Token expired/expiring, refreshing...");
            token = await refreshToken(); // This returns the NEW string
            if (!token) {
                navigate('/login');
                return null;
            }
        }
        return token;
    };

    // Helper to get auth headers when performing REST API calls
    // SEND, DELETE, FETCH messages/conversations etc
    const getAuthHeaders = async () => {
        const token = await checkAndRefresh(); // Ensure token is fresh
        if (!token) return null;
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    // Fetch model status and available models
    const fetchModelStatus = async () => {
        try {
            // First try the status endpoint
            const response = await fetch(`${API_BASE_URL}/model/status/`);
            if (response.ok) {
                const data = await response.json();
                setModelStatus(data.status || 'not_ready');
                setSelectedModel(data.model || 'Unknown');
                if (data.available_models) {
                    setAvailableModels(data.available_models);
                }
                return;
            }
        } catch (error) {
            console.error('Failed to fetch model status:', error);
        }

        // Fallback: try to get current model info
        try {
            const response = await fetch(`${API_BASE_URL}/model/current/`);
            if (response.ok) {
                const data = await response.json();
                setSelectedModel(data.current_model || data.default_model || 'Unknown');
                if (data.available_models) {
                    setAvailableModels(data.available_models);
                }
                // Set status based on whether we have available models
                setModelStatus(data.available_models?.length > 0 ? 'ready' : 'not_ready');
                return;
            }
        } catch (error) {
            console.error('Failed to fetch current model:', error);
        }

        // Ultimate fallback
        setModelStatus('not_ready');
        if (!selectedModel) setSelectedModel('Unavailable');
    };

    // Change the active model
    const changeModel = async (modelName) => {
        try {
            const headers = await getAuthHeaders();
            if (!headers) return;

            const response = await fetch(`${API_BASE_URL}/model/set/`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ model: modelName })
            });

            if (response.ok) {
                setSelectedModel(modelName);
                setShowModelDropdown(false);
                // Re-fetch status to confirm model is ready
                await fetchModelStatus();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to change model');
            }
        } catch (error) {
            console.error('Failed to change model:', error);
            setError('Failed to change model');
        }
    };

    // Fetch model status on mount and poll periodically
    useEffect(() => {
        fetchModelStatus();
        const interval = setInterval(fetchModelStatus, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        currentConversationIdRef.current = currentConversationId;
    }, [currentConversationId]);

    // WebSocket Initialization and Management
    useEffect(() => {
        let ws = null;

        const setupWebSocket = async () => {
            const accessToken = localStorage.getItem('access_token');
            if (!accessToken) {
                navigate('/login');
                return;
            }

            const freshAccessToken = await checkAndRefresh();
            if (!freshAccessToken) return;

            // Close existing global socket connection if it exists
            if (websocket && websocket.readyState === WebSocket.OPEN) {
                websocket.close();
            }

            const baseUrl = `${WS_BASE_URL}/ws/chat`;
            let wsUrl = socketScope
                ? `${baseUrl}/${socketScope}/?token=${freshAccessToken}`
                : `${baseUrl}/?token=${freshAccessToken}`;

            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('WebSocket connection opened.');
                setError('');
                setIsWsReady(true);
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);

                // Use the Ref to get the actual current ID without closures
                const activeId = currentConversationIdRef.current;

                // GHOSTING FIX: Ignore messages from background conversations
                if (data.conversation_id && activeId && data.conversation_id !== activeId) {
                    return;
                }

                if (data.type === 'error') {
                    setError(data.content);
                    setIsLoading(false);
                    return;
                }

                if (data.type === 'status') {
                    return;
                }

                if (data.type === 'conversation_id_update') {
                    setCurrentConversationId(data.conversation_id);
                    // Note: We don't strictly need to loadConversations() here if 
                    // the optimistically added message is handling the UI
                    return;
                }

                // --- STREAMING CHUNK ---
                if (data.type === 'chat_message') {
                    // REMOVED: setIsLoading(false) - Don't stop loading yet!

                    incomingBufferRef.current += data.content_part;

                    // setCurrentMessages(prev => {
                    //     const msgs = [...prev];
                    //     const lastIndex = msgs.length - 1;

                    //     // Append content to the placeholder we created in sendMessage
                    //     if (msgs[lastIndex] && msgs[lastIndex].role === 'assistant') {
                    //         const updatedMsg = {
                    //             ...msgs[lastIndex],
                    //             content: msgs[lastIndex].content + data.content_part,
                    //             isStreaming: true
                    //         };
                    //         msgs[lastIndex] = updatedMsg;
                    //     }
                    //     return msgs;
                    // });
                }
                // --- STREAM FINISHED ---
                // MOVED: Outside of the 'chat_message' block
                else if (data.type === 'done') {
                    setIsLoading(false); // NOW we stop loading

                    setCurrentMessages(prev => {
                        const msgs = [...prev];
                        const lastIndex = msgs.length - 1;
                        if (msgs[lastIndex]) {
                            msgs[lastIndex].isStreaming = false; // Remove styling flag
                        }
                        return msgs;
                    });

                    // Refresh list to update titles in sidebar if it was a new chat
                    loadConversations();
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket Error:', error);
                setIsLoading(false);
                setIsWsReady(false);
            };

            ws.onclose = (event) => {
                setIsWsReady(false);
                if (event.code === 4001) {
                    navigate('/login');
                }
            };

            setWebsocket(ws);
        };

        setIsWsReady(false);
        setupWebSocket();

        // Cleanup: Close the LOCAL 'ws' variable to prevent race conditions
        return () => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
            setIsWsReady(false);
        };
    }, [socketScope, navigate]);// Re-run if websocket or nav changes

    // Initial check for authentication and load conversations
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            navigate('/login');
            return;
        }
        loadConversations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    // Load all conversations for the user
    const loadConversations = async () => {
        try {
            const headers = await getAuthHeaders();
            if (!headers) return; // If token expired, getAuthHeaders navigates to login

            const response = await fetch(
                `${API_BASE_URL}/conversations/`,
                { headers }
            );

            if (!response.ok) {
                if (response.status === 401) navigate('/login');
                throw new Error('Failed to load conversations');
            }

            const data = await response.json();
            setConversations(data.conversations || []);
        } catch (err) {
            console.error('Error loading conversations:', err);
            setError('Failed to load conversations');
        }
    };

    // Create a new conversation (REST API call)
    const createNewConversation = async () => {
        setIsLoading(false)
        try {
            const headers = await getAuthHeaders();
            if (!headers) return;

            const response = await fetch(
                `${API_BASE_URL}/conversations/create/`,
                {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({})
                }
            );

            if (!response.ok) throw new Error('Failed to create conversation');

            const data = await response.json();
            const newConversation = data.conversation;

            setConversations([newConversation, ...conversations]);
            setCurrentConversationId(newConversation.id);
            setSocketScope(newConversation.id);
            setCurrentMessages([]);
            setInputMessage('');
            setError('');
        } catch (err) {
            console.error('Error creating conversation:', err);
            setError('Failed to create new conversation');
        }
    };

    // Select a conversation (REST API call)
    const selectConversation = async (conversationId) => {
        setIsLoading(false);
        try {
            const headers = await getAuthHeaders();
            if (!headers) return;

            const response = await fetch(
                `${API_BASE_URL}/conversations/${conversationId}/`,
                { headers }
            );

            if (!response.ok) {
                if (response.status === 401) navigate('/login');
                throw new Error('Failed to load conversation');
            }

            const data = await response.json();
            setCurrentConversationId(conversationId);
            setSocketScope(conversationId);
            setCurrentMessages(data.messages || []);
            setError('');
        } catch (err) {
            console.error('Error loading conversation:', err);
            setError('Failed to load conversation');
        }
    };

    // Send message using WebSocket
    const sendMessage = async (e) => {
        e.preventDefault();

        // 1. Validation: Ensure connection is open and input is valid
        if (!inputMessage.trim() || isLoading || !websocket || websocket.readyState !== WebSocket.OPEN) {
            if (!websocket || websocket.readyState !== WebSocket.OPEN) {
                setError("WebSocket is not connected. Attempting to reconnect...");
                console.warn("WebSocket not open or not initialized.");
            }
            return;
        }

        const contentToSend = inputMessage; // Capture value before clearing state
        const userMessage = { role: 'user', content: contentToSend };

        // 2. OPTIMISTIC UPDATE
        // Append the User message AND an empty Assistant placeholder immediately.
        // 'isStreaming: true' can be used for CSS styling (e.g., a blinking cursor)
        setCurrentMessages(prev => [
            ...prev,
            userMessage,
            { role: 'assistant', content: '', isStreaming: true }
        ]);

        setInputMessage('');
        setIsLoading(true);
        setError('');

        try {
            // 3. Send payload
            websocket.send(JSON.stringify({
                message: contentToSend,
                conversation_id: currentConversationId
            }));

        } catch (err) {
            console.error('Error sending message via WebSocket:', err);
            setError('Failed to send message via WebSocket.');
            setIsLoading(false);

            // Optional: Revert UI state if sending fails purely on the client side
            setCurrentMessages(prev => prev.slice(0, -2));
            setInputMessage(contentToSend);
        }
    };

    // Delete a conversation (REST API call)
    const deleteConversation = async (conversationId) => {
        if (!window.confirm('Are you sure you want to delete this conversation?')) return;

        try {
            const headers = await getAuthHeaders();
            if (!headers) return;

            const response = await fetch(
                `${API_BASE_URL}/conversations/${conversationId}/delete/`,
                {
                    method: 'DELETE',
                    headers
                }
            );

            if (!response.ok) throw new Error('Failed to delete conversation');

            setConversations(conversations.filter(c => c.id !== conversationId));

            if (currentConversationId === conversationId) {
                setCurrentConversationId(null);
                setSocketScope(null);
                setCurrentMessages([]);
            }
        } catch (err) {
            console.error('Error deleting conversation:', err);
            setError('Failed to delete conversation');
        }
    };

    // Logout
    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            websocket.close();
        }
        navigate('/login');
    };

    // a specialized Effect loop to flush the buffer to UI
    useEffect(() => {
        let animationFrameId;

        const renderLoop = (timestamp) => {
            // If there is text in the buffer waiting to be rendered
            if (incomingBufferRef.current) {

                // Limit updates to ~30fps or 60fps to save CPU
                if (timestamp - lastRenderedTimeRef.current > 16) { // ~60fps
                    const textChunk = incomingBufferRef.current;
                    incomingBufferRef.current = ''; // Clear buffer
                    lastRenderedTimeRef.current = timestamp;

                    setCurrentMessages(prev => {
                        const msgs = [...prev];
                        const lastIndex = msgs.length - 1;
                        if (msgs[lastIndex] && msgs[lastIndex].role === 'assistant') {
                            // Create new object to trigger render
                            msgs[lastIndex] = {
                                ...msgs[lastIndex],
                                content: msgs[lastIndex].content + textChunk,
                                isStreaming: true
                            };
                        }
                        return msgs;
                    });
                }
            }
            animationFrameId = requestAnimationFrame(renderLoop);
        };

        if (isLoading) {
            animationFrameId = requestAnimationFrame(renderLoop);
        }

        return () => cancelAnimationFrame(animationFrameId);
    }, [isLoading]);

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            background: 'linear-gradient(135deg, #0a1428 0%, #142350 50%, #0a1428 100%)',
            fontFamily: "'Montserrat', sans-serif",
            position: 'relative', // Necessary for absolute positioning of sidebar
            overflow: 'hidden'    // Prevents scrollbars when sidebar is off-screen
        }}>

            <style>{`
            /* Adjusted animations for sliding from off-screen */
            @keyframes slideIn {
                from { transform: translateX(-110%); }
                to { transform: translateX(0); }
            }
            @keyframes slideOut {
                from { transform: translateX(0); }
                to { transform: translateX(-110%); }
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            /* ... keep your other keyframes (spin, etc) ... */
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            .sidebar-open { animation: slideIn 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; }
            .sidebar-closed { animation: slideOut 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; }
            .backdrop-fade { animation: fadeIn 0.3s ease-out forwards; }
            
            /* ... keep scrollbar styles ... */
            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
            ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 3px; }
            ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
            
            /* Hide sidebar scrollbar */
            .sidebar-hidden-scrollbar::-webkit-scrollbar { display: none; }
            .sidebar-hidden-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

            {/* 1. THE BACKDROP / OVERLAY (New Addition) */}
            {isSidebarOpen && (
                <div
                    className="backdrop-fade"
                    onClick={() => setIsSidebarOpen(false)} // Close sidebar when clicking here
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(10, 20, 40, 0.4)', // Dark semi-transparent
                        backdropFilter: 'blur(8px)',         // The blur effect
                        zIndex: 40,                          // Above chat (1), Below Sidebar (50)
                        cursor: 'pointer'
                    }}
                />
            )}

            {/* 2. THE SIDEBAR (Modified) */}
            <div style={{
                position: 'absolute', // Changed from flex flow to absolute overlay
                top: 0,
                bottom: 0,
                left: 0,
                width: '280px',       // Fixed width, no longer toggles to '0'
                borderRadius: '20px',
                margin: '10px',
                background: 'rgba(20, 25, 40, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 50,          // Highest priority
                transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-110%)', // Logic moved to transform
                boxShadow: isSidebarOpen ? '5px 0 25px rgba(0,0,0,0.5)' : 'none',
            }} className={`sidebar-hidden-scrollbar ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>

                {/* Sidebar Content */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                    <button
                        onClick={createNewConversation}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: 'linear-gradient(135deg, #cd001e 0%, #e63946 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            marginBottom: '20px',
                            fontSize: '14px',
                            fontWeight: 600,
                            transition: 'all 0.3s ease',
                            boxShadow: '0 10px 25px rgba(205, 0, 30, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        New Chat
                    </button>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        <h3 style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#adb5bd',
                            marginBottom: '10px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            flexShrink: 0
                        }}>
                            Conversations ({conversations.length})
                        </h3>
                        <div className="sidebar-hidden-scrollbar" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                            {conversations.map(conv => (
                                <div
                                    key={conv.id}
                                    style={{
                                        padding: '12px',
                                        marginBottom: '8px',
                                        background: currentConversationId === conv.id
                                            ? 'rgba(205, 0, 30, 0.15)'
                                            : 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '16px',
                                        cursor: 'pointer',
                                        border: currentConversationId === conv.id
                                            ? '1px solid rgba(205, 0, 30, 0.5)'
                                            : '1px solid rgba(255, 255, 255, 0.1)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: '13px',
                                        color: '#d1d5db',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div
                                        onClick={() => selectConversation(conv.id)}
                                        style={{
                                            flex: 1,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                        title={conv.title}
                                    >
                                        <FontAwesomeIcon icon={faMessage} />
                                        <span>{conv.title}</span>
                                    </div>

                                    <button
                                        onClick={() => deleteConversation(conv.id)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#f87171',
                                            cursor: 'pointer',
                                            padding: '0 5px',
                                            fontSize: '18px',
                                            transition: 'color 0.2s'
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{
                    padding: '20px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    marginTop: 'auto'
                }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#fca5a5',
                            border: '1px solid rgba(239, 68, 68, 0.5)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}
                    >
                        <FontAwesomeIcon icon={faArrowAltCircleRight} />
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* 3. Main chat area (Z-index managed) */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
                zIndex: 1, // Base layer
                // No blur here directly, the backdrop div covers this
                // borderRadius: '20px',
            }}>

                {/* Header - Z-index reduced below backdrop */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '74px',        // Fixed height is important for the canvas
                    margin: '10px',
                    borderRadius: '22px',  // Rounds the corners
                    overflow: 'hidden',    // Clips the square canvas to the rounded corners
                    zIndex: 10,            // Keeps it above messages
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', // Optional drop shadow
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                }}>

                    {/* 1. BACKGROUND LAYER: The Glass Surface */}
                    <GlassSurface
                        width="100%"       // Fill the wrapper
                        height="100%"      // Fill the wrapper
                        displace={4}
                        distortionScale={-150}
                        redOffset={5}
                        greenOffset={15}
                        blueOffset={15}
                        brightness={60}
                        opacity={0.8}
                        mixBlendMode="screen"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            zIndex: 0, // Sit behind content
                        }}
                    />


                    {/* 2. FOREGROUND LAYER: The Content */}
                    <div style={{
                        position: 'relative',
                        zIndex: 1,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0 20px',
                        boxSizing: 'border-box'
                    }}>
                        {/* Left: Menu + Model Selector grouped together */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
                            {/* Sidebar Toggle */}
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    borderRadius: '12px',
                                    fontSize: '18px',
                                    color: '#fff',
                                    backdropFilter: 'blur(4px)'
                                }}
                            >
                                ☰
                            </button>

                            {/* Model Selector with Status Indicator */}
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {/* Model Dropdown Button */}
                                <button
                                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        padding: '12px 12px',
                                        cursor: 'pointer',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        color: '#fff',
                                        backdropFilter: 'blur(4px)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        maxWidth: '160px'
                                    }}
                                >
                                    <span style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {selectedModel || 'Select Model'}
                                    </span>
                                    <FontAwesomeIcon
                                        icon={faChevronDown}
                                        style={{
                                            fontSize: '10px',
                                            transform: showModelDropdown ? 'rotate(180deg)' : 'rotate(0)',
                                            transition: 'transform 0.2s ease'
                                        }}
                                    />
                                </button>

                                {/* Status Indicator - now after dropdown */}
                                <div
                                    title={`Status: ${modelStatus}`}
                                    style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        border: modelStatus === 'ready'
                                            ? '2px solid #22c55e'
                                            : modelStatus === 'not_found'
                                                ? '2px solid #ef4444'
                                                : '2px dashed #f59e0b',
                                        background: modelStatus === 'ready'
                                            ? 'rgba(34, 197, 94, 0.4)'
                                            : modelStatus === 'not_found'
                                                ? 'rgba(239, 68, 68, 0.4)'
                                                : 'transparent',
                                        transition: 'all 0.3s ease',
                                        flexShrink: 0
                                    }}
                                />
                            </div>
                        </div>

                        {/* Dropdown Menu - rendered outside of positioned parent for proper visibility */}
                        {showModelDropdown && (
                            <div
                                style={{
                                    position: 'fixed',
                                    top: '72px',
                                    left:  '95px' ,//: '65px',
                                    background: 'rgba(20, 25, 40, 0.98)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: '12px',
                                    padding: '8px 0',
                                    minWidth: '180px',
                                    maxHeight: '300px',
                                    overflowY: 'auto',
                                    zIndex: 9999,
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                                    backdropFilter: 'blur(20px)'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {availableModels.length === 0 ? (
                                    <div style={{
                                        padding: '12px 16px',
                                        color: 'rgba(255,255,255,0.5)',
                                        fontSize: '12px'
                                    }}>
                                        No models available
                                    </div>
                                ) : (
                                    availableModels.map(model => (
                                        <div
                                            key={model}
                                            onClick={() => changeModel(model)}
                                            style={{
                                                padding: '10px 16px',
                                                cursor: 'pointer',
                                                color: model === selectedModel ? '#fff' : 'rgba(255,255,255,0.7)',
                                                background: model === selectedModel ? 'rgba(255,255,255,0.1)' : 'transparent',
                                                fontSize: '13px',
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (model !== selectedModel) {
                                                    e.target.style.background = 'rgba(255,255,255,0.05)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (model !== selectedModel) {
                                                    e.target.style.background = 'transparent';
                                                }
                                            }}
                                        >
                                            {model === selectedModel && <span>✓</span>}
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{model}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Center: Title */}
                        <h1 style={{
                            position: 'absolute',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            margin: 0,
                            fontSize: '18px',
                            fontWeight: 600,
                            color: 'white',
                            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '40%',
                            textAlign: 'center'
                        }}>
                            {currentConversationId
                                ? conversations.find(c => c.id === currentConversationId)?.title || 'Chat'
                                : 'Start a new conversation'}
                        </h1>

                        {/* Right: New Chat Button */}
                        <button
                            onClick={createNewConversation}
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                padding: '8px 10px',
                                cursor: 'pointer',
                                borderRadius: '12px',
                                fontSize: '18px',
                                color: '#fff',
                                paddingTop: '10px',
                                backdropFilter: 'blur(4px)'
                            }}
                        >
                            <FontAwesomeIcon icon={faPenToSquare} style={{ marginLeft: '0px' }} />
                        </button>
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <div style={{
                        padding: '12px 20px',
                        marginTop: '100px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#fca5a5',
                        borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}>
                        <span>⚠️</span>
                        {error}
                    </div>
                )}

                {/* Messages area */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '24px',
                    paddingTop: '100px',
                    paddingBottom: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 90%, transparent 100%)',
                    maskImage: 'linear-gradient(to bottom, black 0%, black 90%, transparent 100%)',
                }}>
                    {/* ... (Keep your existing messages mapping code here) ... */}
                    {currentMessages.length === 0 ? (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                            flexDirection: 'column',
                            gap: '20px'
                        }}>
                            <FontAwesomeIcon icon={faMessage}
                                style={{ fontSize: '48px', color: '#adb5bd' }} />
                            <p style={{
                                color: '#adb5bd',
                                fontSize: '16px',
                                textAlign: 'center'
                            }}>No messages yet.<br /><span style={{ fontSize: '14px' }}>Start typing to begin chatting!</span></p>
                        </div>
                    ) : (
                        <>
                            {currentMessages.map((msg, idx) => (
                                <div key={idx} style={{
                                    marginBottom: '16px',
                                    display: 'flex',
                                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                                }}>
                                    <div style={{
                                        maxWidth: '70%',
                                        padding: '12px 16px',
                                        borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                        background: msg.role === 'user'
                                            ? 'linear-gradient(135deg, #cd001e 0%, #e63946 100%)'
                                            : 'rgba(255, 255, 255, 0.08)',
                                        border: msg.role === 'user'
                                            ? 'none'
                                            : '1px solid rgba(255, 255, 255, 0.1)',
                                        color: msg.role === 'user' ? 'white' : '#d1d5db',
                                        wordWrap: 'break-word',
                                        fontSize: '14px',
                                        lineHeight: '1.5',
                                        boxShadow: msg.role === 'user'
                                            ? '0 8px 16px rgba(205, 0, 30, 0.2)'
                                            : 'none'
                                    }}>
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                code({ node, inline, className, children, ...props }) {
                                                    const match = /language-(\w+)/.exec(className || '');
                                                    return !inline && match ? (
                                                        <SyntaxHighlighter
                                                            style={materialDark}
                                                            language={match[1]}
                                                            PreTag="div"
                                                            // codeTagProps={{
                                                            // style: {
                                                            // scrollbarWidth: 'thin', // For Firefox
                                                            // }
                                                            // }}
                                                            customStyle={{
                                                                borderRadius: '12px',
                                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                                overflow: 'auto',
                                                                msOverflowStyle: 'none',
                                                                scrollbarWidth: 'none',
                                                            }}
                                                        >
                                                            {String(children).replace(/\n$/, '')}
                                                        </SyntaxHighlighter>
                                                    ) : (
                                                        <code {...props}>{children}</code>
                                                    );
                                                }
                                            }}>{msg.content}</ReactMarkdown>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div style={{
                                    marginBottom: '16px',
                                    display: 'flex',
                                    justifyContent: 'flex-start'
                                }} className="message-fade">
                                    <div style={{
                                        maxWidth: '70%',
                                        padding: '12px 16px',
                                        borderRadius: '18px 18px 18px 4px',
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: '#d1d5db',
                                        wordWrap: 'break-word',
                                        fontSize: '14px',
                                        lineHeight: '1.5',
                                    }}>
                                        <ShimmeringText text="Thinking..." color="#959aa3ff" shimmerColor="#e5e8eeff" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Input area */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '20px',
                }}>
                    <form onSubmit={sendMessage} style={{
                        display: 'flex',
                        gap: '12px',
                        width: '800px',
                        alignItems: 'flex-end',
                    }}>
                        <textarea
                            value={inputMessage}
                            onChange={(e) => {
                                setInputMessage(e.target.value);
                                // Auto-resize textarea
                                e.target.style.height = 'auto';
                                const lineHeight = 21; // approx line height
                                const maxHeight = lineHeight * 7; // 7 lines max
                                e.target.style.height = Math.min(e.target.scrollHeight, maxHeight) + 'px';
                                // Enable scrolling when at max height
                                e.target.style.overflowY = e.target.scrollHeight > maxHeight ? 'auto' : 'hidden';
                            }}
                            onKeyDown={(e) => {
                                // Submit on Enter (without Shift)
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (inputMessage.trim() && !isLoading && isWsReady) {
                                        sendMessage(e);
                                    }
                                }
                            }}
                            placeholder="Type your message..."
                            disabled={isLoading || !isWsReady}
                            rows={1}
                            style={{
                                width: '80%',
                                flex: 1,
                                padding: '12px 16px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '25px',
                                fontSize: '14px',
                                color: 'white',
                                transition: 'background 0.3s ease, border-color 0.3s ease',
                                opacity: isLoading ? 0.5 : 1,
                                boxSizing: 'border-box',
                                resize: 'none',
                                overflowY: 'hidden',
                                minHeight: '44px',
                                maxHeight: '147px', // 7 lines * 21px line-height
                                lineHeight: '21px',
                                fontFamily: 'inherit',
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none'
                            }}
                            onFocus={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                e.target.style.borderColor = 'rgba(205, 0, 30, 0.5)';
                            }}
                            onBlur={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            }}
                        />
                        <button
                            type="submit"
                            title="Send"
                            disabled={isLoading || !inputMessage.trim() || !isWsReady}
                            style={{
                                padding: '12px 20px',
                                height: '44px',
                                flexShrink: 0,
                                alignSelf: 'flex-end',
                                background: isLoading
                                    ? 'rgba(107, 114, 128, 0.5)'
                                    : 'linear-gradient(135deg, #cd001e 0%, #e63946 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '25px',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: 600,
                                transition: 'all 0.3s ease',
                                boxShadow: isLoading
                                    ? 'none'
                                    : '0 10px 25px rgba(205, 0, 30, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                            onMouseEnter={(e) => {
                                if (!isLoading) {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 15px 35px rgba(205, 0, 30, 0.4)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isLoading) {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 10px 25px rgba(205, 0, 30, 0.3)';
                                }
                            }}
                        >
                            {isLoading ? (
                                <>
                                    <ShimmeringText text="Sending..." color="#959aa3ff" shimmerColor="#e5e8eeff" />
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faPaperPlane} style={{ marginRight: '4px' }} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div >
        </div >
    );
};

export default ChatPage;