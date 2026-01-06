import { useState, useEffect, useRef } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMessage, faPaperPlane, faArrowAltCircleRight } from '@fortawesome/free-regular-svg-icons';
import { ShimmeringText } from './ui/shimmering-text';
// import { useStore } from './Store';

const ChatPage = () => {
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [currentMessages, setCurrentMessages] = useState([]);
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
            let wsUrl = currentConversationId 
                ? `${baseUrl}/${currentConversationId}/?token=${freshAccessToken}` 
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
    }, [currentConversationId, navigate]); // Re-run if websocket or nav changes

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
            fontFamily: "'Montserrat', sans-serif"
        }}>
            {/* ... your existing HTML structure ... */}
            
            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(-100%);
                        opacity: 0;
                    }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .sidebar-open { animation: slideIn 0.3s ease-out forwards; }
                .sidebar-closed { animation: slideOut 0.3s ease-in forwards; }
                .message-fade { animation: fadeIn 0.3s ease-out forwards; }
                .spinner { animation: spin 0.8s linear infinite; }
                ::-webkit-scrollbar {
                    width: 6px;
                }
                ::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                }
                ::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 3px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
            `}</style>

            {/* Sidebar */}
            <div style={{
                width: isSidebarOpen ? '280px' : '0',
                borderRadius: '20px',
                margin: '10px',
                background: 'rgba(20, 25, 40, 0.95)',
                backdropFilter: 'blur(10px)',
                border: isSidebarOpen ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                overflowY: 'auto',
                transition: 'width 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 20
            }} className={isSidebarOpen ? 'sidebar-open' : ''}>
                <div style={{ padding: '20px' }}>
                    <button
                        onClick={createNewConversation}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: 'linear-gradient(135deg, #cd001e 0%, #e63946 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '22px',
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
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 15px 35px rgba(205, 0, 30, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 10px 25px rgba(205, 0, 30, 0.3)';
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
                                        borderRadius: '8px',
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
                                    onMouseEnter={(e) => {
                                        if (currentConversationId !== conv.id) {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (currentConversationId !== conv.id) {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                        }
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
                                            // marginTop: "-2px",
                                            transition: 'color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.color = '#fca5a5'}
                                        onMouseLeave={(e) => e.target.style.color = '#f87171'}
                                        title="Delete conversation"
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
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                      title="Logout"
                    >
                    
                      <FontAwesomeIcon icon={faArrowAltCircleRight} />
                      <span>Logout</span>

                    </button>

                </div>
            </div>

            {/* Main chat area */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
            }}>
                {/* Header */}
                <div style={{
                    position: 'absolute', // FLOAT above the messages
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 100,          // Ensure it stays on top
                    padding: '15px 20px',
                    // Glassmorphism
                    background: 'rgba(15, 23, 42, 0.37)', // Translucent dark
                    backdropFilter: 'blur(7px)',        // The blur effect
                    // WebkitBackdropFilter: 'blur(22px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '22px',
                    margin: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            fontSize: '18px',
                            color: '#d1d5db',
                        }}
                    >
                        ☰
                    </button>
                    <h1 style={{
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: 600,
                        color: 'white',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}>
                        {currentConversationId 
                            ? conversations.find(c => c.id === currentConversationId)?.title || 'Chat'
                            : 'Start a new conversation'}
                    </h1>
                    <div style={{ width: '50px' }}></div>
                </div>

                {/* Error message */}
                {error && (
                    <div style={{
                        padding: '12px 20px',
                        marginTop: '100px', // To avoid overlap with header
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#fca5a5',
                        borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        // marginTop:"2px"
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
                    // --- ADD THE LINES BELOW ---
                    paddingBottom: '40px', // Extra space so last message can clear the blur
                    display: 'flex',
                    flexDirection: 'column',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 90%, transparent 100%)',
                    maskImage: 'linear-gradient(to bottom, black 0%, black 90%, transparent 100%)',
                }}>
                {currentMessages.length === 0 ? (
                    <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                            flexDirection: 'column',
                            gap: '20px'
                        }}>
                        <FontAwesomeIcon icon={faMessage} />
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
                                    {msg.content}
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
                    // --- UPDATE THESE PROPERTIES ---
                    // background: 'rgba(15, 23, 42, 0.57)', // Matches your header
                    // backdropFilter: 'blur(12px)',         // Matches your header
                    // WebkitBackdropFilter: 'blur(12px)',
                    // borderTop: '1px solid rgba(255, 255, 255, 0.1)', // Soft border
                    // borderRadius: '22px 22px 0 0',        // Optional: slight round at top to match header style
                    // margin: '0 10px 10px 10px',     
                }}>
                <form onSubmit={sendMessage} style={{
                        display: 'flex',
                        gap: '12px'
                    }}>
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Type your message..."
                        disabled={isLoading || !isWsReady}
                        style={{
                                width:'800px',
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