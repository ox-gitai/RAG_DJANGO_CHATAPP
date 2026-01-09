import { useState, useEffect, useRef } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMessage, faPaperPlane, faArrowAltCircleRight, faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import { ShimmeringText } from './ui/shimmering-text';
// import { useStore } from './Store';
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
        const token = localStorage.getItem('access_token');
        if (!token) {
            navigate('/login');
            return null;
        }

        const decoded = parseJwt(token);
        const currentTime = Math.floor(Date.now() / 1000);

        // Refresh if expiring in the next 30 seconds
        if (!decoded.exp || decoded.exp < currentTime + 30) {
            const newAccessToken = await refreshToken();
            if (!newAccessToken) {
                navigate('/login');
                return null;
            }
            return newAccessToken;
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


            if (websocket && websocket.readyState === WebSocket.OPEN) {
                websocket.close();
            }

            // Construct URL with conversation ID if available
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
                
                // IMPORTANT: Ignore messages from other conversations
                // This prevents "ghost" messages if the previous stream is finishing up

                // If the message has a conversation_id and it doesn't match the current one, ignore it
                if (data.conversation_id && currentConversationId && data.conversation_id !== currentConversationId) {
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
                    loadConversations(); 
                    return;
                }

                if (data.type === 'chat_message') {
                    const contentPart = data.content_part;
                    setIsLoading(false); 
                    setCurrentMessages(prev => {
                        const msgs = [...prev];
                        if (msgs.length > 0 && msgs[msgs.length - 1]?.role === 'assistant') {
                            msgs[msgs.length - 1].content += contentPart;
                        } else {
                            msgs.push({ role: 'assistant', content: contentPart });
                        }
                        return msgs;
                    });
                }

                if (data.type === 'done') {
                    setIsLoading(false);
                    // Refresh conversation list to get updated titles
                    if (currentConversationId) {
                         // We don't call selectConversation here to avoid UI flicker, 
                         // but we might want to update the sidebar title eventually.
                         loadConversations();
                    }
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

        setIsWsReady(false); // Reset ready state before setting up new socket
        setupWebSocket();

        // Cleanup function
        return () => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
            setIsWsReady(false);
        };
        // Dependency array: Re-run only when conversation ID changes or nav changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socketScope, navigate]); // Re-run if websocket or nav changes

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

        if (!inputMessage.trim() || isLoading || !websocket || websocket.readyState !== WebSocket.OPEN) {
            if (!websocket || websocket.readyState !== WebSocket.OPEN) {
                setError("WebSocket is not connected. Attempting to reconnect...");
                // Optionally trigger a reconnect here or advise user to refresh
                // For now, let's just log and block
                console.warn("WebSocket not open or not initialized.");
            }
            return;
        }

        const userMessage = { role: 'user', content: inputMessage };
        setCurrentMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);
        setError('');

        try {
            // Send message over WebSocket
            websocket.send(JSON.stringify({
                message: userMessage.content,
                conversation_id: currentConversationId // Pass the current ID, or null for new chat
            }));

        } catch (err) {
            console.error('Error sending message via WebSocket:', err);
            setError('Failed to send message via WebSocket.');
            setIsLoading(false);
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
        }} className={isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}>
            
            {/* Sidebar Content (Kept exactly the same) */}
            <div style={{ padding: '20px' }}>
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

                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#adb5bd',
                        marginBottom: '10px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Conversations ({conversations.length})
                    </h3>
                    <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
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

                {/* 2. FOREGROUND LAYER: The Content (Flexbox works here!) */}
                <div style={{
                    position: 'relative',
                    zIndex: 1, // Sit on top of glass
                    width: '100%',
                    height: '100%',
                    display: 'flex',                 // Flexbox enabled!
                    justifyContent: 'space-between', // Spacing works!
                    alignItems: 'center',            // Alignment works!
                    padding: '0 20px',
                    boxSizing: 'border-box'
                }}>
                    {/* Left: Sidebar Toggle */}
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
                            backdropFilter: 'blur(4px)' // Extra blur for button readability
                        }}
                    >
                        ☰
                    </button>

                    {/* Center: Title */}
                    <h1 style={{
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: 600,
                        color: 'white',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '60%'
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
                        <FontAwesomeIcon icon={faPenToSquare} style={{ marginlEFT: '6px' }} />
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
                                        style={{ fontSize: '48px', color: '#adb5bd' }}/>
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
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}
                                                            components={{
                                                                code({node, inline, className, children, ...props}) {
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
                    }}>
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Type your message..."
                        disabled={isLoading || !isWsReady}
                        style={{
                                width:'80%',
                                flex: 1,
                                padding: '12px 16px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '25px',
                                fontSize: '14px',
                                color: 'white',
                                transition: 'all 0.3s ease',
                                opacity: isLoading ? 0.5 : 1,
                                boxSizing: 'border-box'
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
        </div>
    </div>
);
};

export default ChatPage;