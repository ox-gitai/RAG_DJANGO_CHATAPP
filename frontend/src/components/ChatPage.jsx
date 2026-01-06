// import { useState, useEffect, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// // import { library } from '@fortawesome/fontawesome-svg-core';
// import { faMessage, faPaperPlane, faArrowAltCircleRight } from '@fortawesome/free-regular-svg-icons';
// // import { ShimmeringText } from "@/components/ui/shimmering-text"
// import { ShimmeringText } from './ui/shimmering-text';
// import { useStore } from './Store';
// // import { Provider } from 'zustand';
// // library.add(faMessage, faTrashCan);

// const ChatPage = () => {
//     const navigate = useNavigate();
//     const [conversations, setConversations] = useState([]);
//     const [currentConversationId, setCurrentConversationId] = useState(null);
//     const [currentMessages, setCurrentMessages] = useState([]);
//     const [inputMessage, setInputMessage] = useState('');
//     const [isLoading, setIsLoading] = useState(false);
//     const [isSidebarOpen, setIsSidebarOpen] = useState(true);
//     const [error, setError] = useState('');
//     const [websocket, setWebsocket] = useState(null);
    
//     // const [isLogin, setIsLogin] = useState(false);
//     // const { isLogin, setIsLogin } = useStore();
//     const isLogin = useStore((state) => state.isLogin);
//     console.log(isLogin);
//     const messagesEndRef = useRef(null);

//     const API_BASE_URL = 'http://127.0.0.1:8000';
//     const WS_BASE_URL = 'ws://127.0.0.1:8000';

//     // Auto-scroll to latest message
//     const scrollToBottom = () => {
//         messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//     };

//     useEffect(() => {
//         scrollToBottom();
//     }, [currentMessages]);


    
    
    
//     // const refreshToken = async () => {
//         //     if(localStorage.getItem('refresh_token')!==null){
//             //         const refreshToken = localStorage.getItem('refresh_token');
            
//             //         const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
//                 //             method: 'POST',
//                 //             headers: {
//                     //                 'Content-Type': 'application/json',
//                     //             },
//                     //             // body: JSON.stringify({ refresh: refreshToken }),
//                     //             body: {
//                         //                 'refresh': refreshToken
//                         //             }
//                         //         });
//                         //         const data = await response.json();
//                         //         console.log(data)
//                         //         if (response.ok) {
//                             //             localStorage.setItem('access_token', data.access);
//                             //             return data.access;
//                             //         } else {
//                                 //             // navigate('/login');
//                                 //             return null;
//                                 //         }
//                                 //     } else {
//                                     //         return localStorage.getItem('access_token');
//                                     //     }
//                                     // }
                                    
//                                     // // Example (Conceptual) for checking expiry
//                                     // const parseJwt = (token) => {
//                                         //     try {
//                                             //         const user = parseJwt(token);
//                                             //         const expiration = user?.exp;
//                                             //         if (expiration) {
//                                                 //             return JSON.parse(atob(token.split('.')[1]));
//                                                 //         }
//                                                 //     } catch (e) {
//                                                     //         return {};
//                                                     //     }
//                                                     // };
                                                    
//                                                     // const checkAndRefresh = async () => {
//     //     const token = localStorage.getItem('accessToken');
//     //     const decoded = parseJwt(token);
//     //     const currentTime = Math.floor(Date.now() / 1000);
    
//     //     if (decoded.exp < currentTime + 60) { // Refresh if expiring in the next 60s
//     //         const newTokens = await refreshToken(); // Call your refresh token API
//     //         localStorage.setItem('accessToken', newTokens.access_token);
//     //         localStorage.setItem('refreshToken', newTokens.refresh_token); // Store new refresh token too!
//     //     }
//     // };
    
//     const refreshToken = async () => {
//         const refresh = localStorage.getItem('refresh_token'); 
//         if (refresh) {
//             try {
//                 const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                     },
//                     body: JSON.stringify({ refresh: refresh }) 
//                 });
                
//                 const data = await response.json();
//                 if (response.ok) {
                    
//                     localStorage.setItem('access_token', data.access);
                  
//                     if (data.refresh) {
//                         localStorage.setItem('refresh_token', data.refresh);
//                     }
//                     return data.access;
//                 } else {
//                     // Handling logout or redirect here
//                     return null;
//                 }
//             } catch (error) {
//                 console.error("Token refresh failed", error);
//                 return null;
//             }
//         } else {
//             return localStorage.getItem('access_token');
//         }
//     };

//     const parseJwt = (token) => {
//         try {
//             if (!token) return {};

//             const base64Url = token.split('.')[1];
//             const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//             // const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
//             //     return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
//             // }).join(''));
//             const jsonPayload = window.atob(base64)
//             return JSON.parse(jsonPayload);
//         } catch (e) {
//             return {};
//         }
//     };

//     const checkAndRefresh = async () => {
       
//         const token = localStorage.getItem('access_token'); 
//         if (!token) return;

//         const decoded = parseJwt(token);
//         const currentTime = Math.floor(Date.now() / 1000);

//         // Check if token exists and is expiring soon
//         if (!decoded.exp || decoded.exp < currentTime + 10) { 
//             const newAccessToken = await refreshToken();
            
//             if (newAccessToken) {
//                 // Token is already set in localStorage by refreshToken(), 
//                 // but if you need to use it immediately, it's available here.
//                 console.log("Token refreshed successfully");
//             }
//         }
//     };
    
//     // Get access token from localStorage
//     const getAuthHeaders = async () => {
//         await checkAndRefresh();
//         const token = localStorage.getItem('access_token');
//         // const token = refresh_access_token();
//             return {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${token}`
//             };
//     //     if (!isLogin) {
//     //         const token = localStorage.getItem('access_token');
//     //         // const token = refresh_access_token();
//     //         return {
//     //             'Content-Type': 'application/json',
//     //             'Authorization': `Bearer ${token}`
//     //         };
//     //     } else {
//     //     const token = refresh_access_token();
//     //     return {
//     //         'Content-Type': 'application/json',
//     //         'Authorization': `Bearer ${token}`
//     //     };
//     // }
//     };

//      useEffect(() => {
//         const setupWebSocket = async () => {
//             const accessToken = localStorage.getItem('access_token');
//             if (!accessToken) {
//                 navigate('/login');
//                 return;
//             }

//             // Construct WebSocket URL with JWT token for authentication
//             // Make sure the token is fresh when establishing the connection
//             const freshAccessToken = await checkAndRefresh();
//             if (!freshAccessToken) return; // If refresh failed, navigate already handled

//             let wsUrl = `${WS_BASE_URL}/ws/chat/?token=${freshAccessToken}`;
//             // If there's a current conversation, include its ID in the path
//             // Note: If you want to connect to an existing conversation directly via path,
//             // the backend routing needs to handle /ws/chat/<uuid>/
//             // For now, we'll send it in the message body.

//             const ws = new WebSocket(wsUrl);

//             ws.onopen = () => {
//                 console.log('WebSocket connection opened.');
//                 setError('');
//             };

//             ws.onmessage = (event) => {
//                 const data = JSON.parse(event.data);
                
//                 if (data.type === 'error') {
//                     console.error("WebSocket Error:", data.content);
//                     setError(data.content);
//                     setIsLoading(false);
//                     return;
//                 }
                
//                 if (data.type === 'status') {
//                     // You can display this status to the user
//                     console.log("Status:", data.content);
//                     return;
//                 }

//                 if (data.type === 'conversation_id_update' && data.conversation_id) {
//                     console.log("Received new conversation ID:", data.conversation_id);
//                     setCurrentConversationId(data.conversation_id);
//                     // Reload conversations to show the new one
//                     loadConversations(); 
//                     return;
//                 }

//                 if (data.type === 'chat_message') {
//                     const contentPart = data.content_part;
//                     setCurrentMessages(prev => {
//                         const msgs = [...prev];
//                         // If the last message is from assistant, append to its content
//                         if (msgs.length > 0 && msgs[msgs.length - 1]?.role === 'assistant') {
//                             msgs[msgs.length - 1].content += contentPart;
//                         } else {
//                             // Otherwise, create a new assistant message
//                             msgs.push({ role: 'assistant', content: contentPart });
//                         }
//                         return msgs;
//                     });
//                 }

//                 if (data.type === 'done') {
//                     console.log('Streaming complete.');
//                     setIsLoading(false);
//                     // The conversation should already be saved on the backend.
//                     // You might want to reload the specific conversation to get its potentially auto-generated title.
//                     if (currentConversationId) {
//                         selectConversation(currentConversationId); // This will refresh the title if needed
//                     } else if (data.conversation_id) {
//                         // If it was a new conversation, use the ID from the 'done' message
//                         selectConversation(data.conversation_id);
//                     }
//                 }
//             };

//             ws.onerror = (error) => {
//                 console.error('WebSocket Error:', error);
//                 setError('WebSocket connection error. Please try again.');
//                 setIsLoading(false);
//             };

//             ws.onclose = (event) => {
//                 console.log('WebSocket connection closed:', event.code, event.reason);
//                 if (event.code === 4001) { // Unauthorized code from backend
//                     setError('Authentication expired or invalid. Please log in again.');
//                     navigate('/login');
//                 } else if (!event.wasClean) {
//                     setError('WebSocket connection unexpectedly lost.');
//                 }
//                 setWebsocket(null); // Clear the WebSocket instance
//             };

//             setWebsocket(ws);

//             return () => {
//                 console.log('Closing WebSocket on component unmount.');
//                 if (ws.readyState === WebSocket.OPEN) {
//                     ws.close();
//                 }
//             };
//         };

//         // Only setup WebSocket if it's not already set up
//         if (!websocket) {
//             setupWebSocket();
//         }

//     }, [navigate, websocket, currentConversationId]); // Re-run if websocket or nav changes


//     // Check authentication on mount
//     useEffect(() => {
//         const token = localStorage.getItem('access_token');
//         if (!token) {
//             navigate('/login');
//             return;
//         }
        
//         // Load conversations on page load
//         loadConversations();
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [navigate]);

//     // Load all conversations for the user
//     const loadConversations = async () => {
//         try {
//             const response = await fetch(
//                 `${API_BASE_URL}/conversations/`,
//                 {
//                     headers: await getAuthHeaders()
//                 }
//             );

//             if (response.status === 401) {
//                 navigate('/login');
//                 return;
//             }

//             if (!response.ok) throw new Error('Failed to load conversations');

//             const data = await response.json();
//             setConversations(data.conversations || []);
//         } catch (err) {
//             console.error('Error loading conversations:', err);
//             setError('Failed to load conversations');
//         }
//     };

//     // Create a new conversation
//     const createNewConversation = async () => {
//         try {
//             const response = await fetch(
//                 `${API_BASE_URL}/conversations/create/`,
//                 {
//                     method: 'POST',
//                     headers: await getAuthHeaders(),
//                     body: JSON.stringify({})
//                 }
//             );

//             if (!response.ok) throw new Error('Failed to create conversation');

//             const data = await response.json();
//             const newConversation = data.conversation;
            
//             setConversations([newConversation, ...conversations]);
//             setCurrentConversationId(newConversation.id);
//             setCurrentMessages([]);
//             setInputMessage('');
//             setError('');
//         } catch (err) {
//             console.error('Error creating conversation:', err);
//             setError('Failed to create new conversation');
//         }
//     };

//     // Select a conversation
//     const selectConversation = async (conversationId) => {
//         try {
//             const response = await fetch(
//                 `${API_BASE_URL}/conversations/${conversationId}/`,
//                 {
//                     headers: await getAuthHeaders()
//                 }
//             );

//             if (!response.ok) throw new Error('Failed to load conversation');

//             const data = await response.json();
//             setCurrentConversationId(conversationId);
//             setCurrentMessages(data.messages || []);
//             setError('');
//         } catch (err) {
//             console.error('Error loading conversation:', err);
//             setError('Failed to load conversation');
//         }
//     };

//     // Send message and get response from LLM
//     const sendMessage = async (e) => {
//         e.preventDefault();

//         if (!inputMessage.trim()) return;

//         const userMessage = { role: 'user', content: inputMessage };
//         const updatedMessages = [...currentMessages, userMessage];

//         setCurrentMessages(updatedMessages);
//         setInputMessage('');
//         setIsLoading(true);
//         setError('');

//         try {
//             // Step 1: Stream the response from the LLM
//             const chatResponse = await fetch(
//                 `${API_BASE_URL}/chat/`,
//                 {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                     },
//                     body: JSON.stringify({
//                         messages: updatedMessages
//                     })
//                 }
//             );

//             if (!chatResponse.ok) {
//                 throw new Error('Failed to get response from chat API');
//             }

//             const assistantResponseRef = { content: '' };
//             const reader = chatResponse.body.getReader();
//             const decoder = new TextDecoder();

//             while (true) {
//                 const { done, value } = await reader.read();
//                 if (done) break;

//                 const chunk = decoder.decode(value);
//                 const lines = chunk.split('\n');

//                 for (const line of lines) {
//                     if (line.trim()) {
//                         try {
//                             const json = JSON.parse(line);
//                             if (json.message && json.message.content) {
//                                 assistantResponseRef.content += json.message.content;
//                                 // Update messages in real-time
//                                 setCurrentMessages(prev => {
//                                     const msgs = [...prev];
//                                     if (msgs[msgs.length - 1]?.role === 'assistant') {
//                                         msgs[msgs.length - 1].content = assistantResponseRef.content;
//                                     } else {
//                                         msgs.push({
//                                             role: 'assistant',
//                                             content: assistantResponseRef.content
//                                         });
//                                     }
//                                     return msgs;
//                                 });
//                             }
//                         } catch (e) {
//                             // JSON parse error, continue
//                         }
//                     }
//                 }
//             }

//             // Step 2: Save the conversation
//             const finalMessages = [...updatedMessages];
//             if (assistantResponseRef.content) {
//                 finalMessages.push({
//                     role: 'assistant',
//                     content: assistantResponseRef.content
//                 });
//             }

//             // Don't generate title on frontend - let backend handle it
//             // Backend will auto-generate from first user message (20 chars) if needed

//             const saveResponse = await fetch(
//                 currentConversationId 
//                     ? `${API_BASE_URL}/conversations/${currentConversationId}/save/`
//                     : `${API_BASE_URL}/conversations/create/`,
//                 {
//                     method: 'POST',
//                     headers: await getAuthHeaders(),
//                     body: JSON.stringify({
//                         messages: finalMessages
//                     })
//                 }
//             );

//             if (!saveResponse.ok) {
//                 const errorData = await saveResponse.json();
//                 console.error('Save response error:', saveResponse.status, errorData);
//                 throw new Error('Failed to save conversation');
//             }

//             const savedData = await saveResponse.json();
//             const savedConversation = savedData.conversation;

//             // Update conversation ID if it's a new conversation
//             if (!currentConversationId) {
//                 setCurrentConversationId(savedConversation.id);
//                 setConversations([savedConversation, ...conversations]);
//             } else {
//                 // Update existing conversation in the list
//                 setConversations(conversations.map(conv =>
//                     conv.id === savedConversation.id ? savedConversation : conv
//                 ));
//             }

//             setCurrentMessages(finalMessages);

//         } catch (err) {
//             console.error('Error sending message:', err);
//             setError('Failed to send message: ' + err.message);
//             // Keep the assistant response even if save fails, but don't update conversations list
//             // The messages will still show on screen
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     // Delete a conversation
//     const deleteConversation = async (conversationId) => {
//         if (!window.confirm('Are you sure you want to delete this conversation?')) return;

//         try {
//             const response = await fetch(
//                 `${API_BASE_URL}/conversations/${conversationId}/delete/`,
//                 {
//                     method: 'DELETE',
//                     headers: await getAuthHeaders()
//                 }
//             );

//             if (!response.ok) throw new Error('Failed to delete conversation');

//             setConversations(conversations.filter(c => c.id !== conversationId));
            
//             if (currentConversationId === conversationId) {
//                 setCurrentConversationId(null);
//                 setCurrentMessages([]);
//             }
//         } catch (err) {
//             console.error('Error deleting conversation:', err);
//             setError('Failed to delete conversation');
//         }
//     };

//     // Logout
//     const handleLogout = () => {
//         localStorage.removeItem('access_token');
//         localStorage.removeItem('refresh_token');
//         navigate('/login');
//     };

//     // const logResponse = () => {
//     //     console.log(currentMessages)
//     // }
//     useEffect( () => {
//         // console.log(currentMessages[1])
//     },[currentMessages]) 
//     return (
//         <div style={{
//             display: 'flex',
//             height: '100vh',
//             background: 'linear-gradient(135deg, #0a1428 0%, #142350 50%, #0a1428 100%)',
//             fontFamily: "'Montserrat', sans-serif"
//         }}>
//             <style>{`
//                 @keyframes slideIn {
//                     from {
//                         transform: translateX(-100%);
//                         opacity: 0;
//                     }
//                     to {
//                         transform: translateX(0);
//                         opacity: 1;
//                     }
//                 }
//                 @keyframes slideOut {
//                     from {
//                         transform: translateX(0);
//                         opacity: 1;
//                     }
//                     to {
//                         transform: translateX(-100%);
//                         opacity: 0;
//                     }
//                 }
//                 @keyframes fadeIn {
//                     from { opacity: 0; transform: translateY(10px); }
//                     to { opacity: 1; transform: translateY(0); }
//                 }
//                 @keyframes spin {
//                     from { transform: rotate(0deg); }
//                     to { transform: rotate(360deg); }
//                 }
//                 .sidebar-open { animation: slideIn 0.3s ease-out forwards; }
//                 .sidebar-closed { animation: slideOut 0.3s ease-in forwards; }
//                 .message-fade { animation: fadeIn 0.3s ease-out forwards; }
//                 .spinner { animation: spin 0.8s linear infinite; }
//                 ::-webkit-scrollbar {
//                     width: 6px;
//                 }
//                 ::-webkit-scrollbar-track {
//                     background: rgba(255, 255, 255, 0.05);
//                 }
//                 ::-webkit-scrollbar-thumb {
//                     background: rgba(255, 255, 255, 0.2);
//                     border-radius: 3px;
//                 }
//                 ::-webkit-scrollbar-thumb:hover {
//                     background: rgba(255, 255, 255, 0.3);
//                 }
//             `}</style>

//             {/* Sidebar */}
//             <div style={{
//                 width: isSidebarOpen ? '280px' : '0',
//                 borderRadius: '20px',
//                 margin: '10px',
//                 background: 'rgba(20, 25, 40, 0.95)',
//                 backdropFilter: 'blur(10px)',
//                 border: isSidebarOpen ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
//                 overflowY: 'auto',
//                 transition: 'width 0.3s ease',
//                 display: 'flex',
//                 flexDirection: 'column',
//                 zIndex: 20
//             }} className={isSidebarOpen ? 'sidebar-open' : ''}>
//                 <div style={{ padding: '20px' }}>
//                     <button
//                         onClick={createNewConversation}
//                         style={{
//                             width: '100%',
//                             padding: '12px 16px',
//                             background: 'linear-gradient(135deg, #cd001e 0%, #e63946 100%)',
//                             color: 'white',
//                             border: 'none',
//                             borderRadius: '22px',
//                             cursor: 'pointer',
//                             marginBottom: '20px',
//                             fontSize: '14px',
//                             fontWeight: 600,
//                             transition: 'all 0.3s ease',
//                             boxShadow: '0 10px 25px rgba(205, 0, 30, 0.3)',
//                             display: 'flex',
//                             alignItems: 'center',
//                             justifyContent: 'center',
//                             gap: '8px'
//                         }}
//                         onMouseEnter={(e) => {
//                             e.target.style.transform = 'translateY(-2px)';
//                             e.target.style.boxShadow = '0 15px 35px rgba(205, 0, 30, 0.4)';
//                         }}
//                         onMouseLeave={(e) => {
//                             e.target.style.transform = 'translateY(0)';
//                             e.target.style.boxShadow = '0 10px 25px rgba(205, 0, 30, 0.3)';
//                         }}
//                     >
//                         New Chat
//                     </button>

//                     <div style={{ marginBottom: '20px' }}>
//                         <h3 style={{
//                             fontSize: '13px',
//                             fontWeight: 600,
//                             color: '#adb5bd',
//                             marginBottom: '10px',
//                             textTransform: 'uppercase',
//                             letterSpacing: '0.5px'
//                         }}>
//                             Conversations ({conversations.length})
//                         </h3>
//                         <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
//                             {conversations.map(conv => (
//                                 <div
//                                     key={conv.id}
//                                     style={{
//                                         padding: '12px',
//                                         marginBottom: '8px',
//                                         background: currentConversationId === conv.id 
//                                             ? 'rgba(205, 0, 30, 0.15)' 
//                                             : 'rgba(255, 255, 255, 0.05)',
//                                         borderRadius: '8px',
//                                         cursor: 'pointer',
//                                         border: currentConversationId === conv.id
//                                             ? '1px solid rgba(205, 0, 30, 0.5)'
//                                             : '1px solid rgba(255, 255, 255, 0.1)',
//                                         display: 'flex',
//                                         justifyContent: 'space-between',
//                                         alignItems: 'center',
//                                         fontSize: '13px',
//                                         color: '#d1d5db',
//                                         transition: 'all 0.2s ease'
//                                     }}
//                                     onMouseEnter={(e) => {
//                                         if (currentConversationId !== conv.id) {
//                                             e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
//                                         }
//                                     }}
//                                     onMouseLeave={(e) => {
//                                         if (currentConversationId !== conv.id) {
//                                             e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
//                                         }
//                                     }}
//                                 >
//                                     <div
//                                       onClick={() => selectConversation(conv.id)}
//                                       style={{
//                                         flex: 1,
//                                         overflow: 'hidden',
//                                         textOverflow: 'ellipsis',
//                                         whiteSpace: 'nowrap',
//                                         display: 'flex',
//                                         alignItems: 'center',
//                                         gap: '8px'
//                                       }}
//                                       title={conv.title}
//                                     >
//                                       <FontAwesomeIcon icon={faMessage} />
//                                       <span>{conv.title}</span>
//                                     </div>

//                                     <button
//                                         onClick={() => deleteConversation(conv.id)}
//                                         style={{
//                                             background: 'none',
//                                             border: 'none',
//                                             color: '#f87171',
//                                             cursor: 'pointer',
//                                             padding: '0 5px',
//                                             fontSize: '18px',
//                                             // marginTop: "-2px",
//                                             transition: 'color 0.2s'
//                                         }}
//                                         onMouseEnter={(e) => e.target.style.color = '#fca5a5'}
//                                         onMouseLeave={(e) => e.target.style.color = '#f87171'}
//                                         title="Delete conversation"
//                                     >
//                                         ✕
//                                     </button>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 </div>

//                 <div style={{
//                     padding: '20px',
//                     borderTop: '1px solid rgba(255, 255, 255, 0.1)',
//                     marginTop: 'auto'
//                 }}>
//                     <button
//                       onClick={handleLogout}
//                       style={{
//                         width: '100%',
//                         padding: '12px 16px',
//                         background: 'rgba(239, 68, 68, 0.15)',
//                         color: '#fca5a5',
//                         border: '1px solid rgba(239, 68, 68, 0.5)',
//                         borderRadius: '10px',
//                         cursor: 'pointer',
//                         fontSize: '14px',
//                         fontWeight: 600,
//                         display: 'flex',
//                         alignItems: 'center',
//                         gap: '10px'
//                       }}
//                       title="Logout"
//                     >
                    
//                       <FontAwesomeIcon icon={faArrowAltCircleRight} />
//                       <span>Logout</span>

//                     </button>

//                 </div>
//             </div>

//             {/* Main chat area */}
//             <div style={{
//                 flex: 1,
//                 display: 'flex',
//                 flexDirection: 'column',
//                 overflow: 'hidden',
//                 position: 'relative',
//             }}>
//                 {/* Header */}
//                 <div style={{
//                     position: 'absolute', // FLOAT above the messages
//                     top: 0,
//                     left: 0,
//                     right: 0,
//                     zIndex: 100,          // Ensure it stays on top
//                     padding: '15px 20px',
//                     // Glassmorphism
//                     background: 'rgba(15, 23, 42, 0.37)', // Translucent dark
//                     backdropFilter: 'blur(7px)',        // The blur effect
//                     // WebkitBackdropFilter: 'blur(22px)',
//                     border: '1px solid rgba(255, 255, 255, 0.1)',
//                     borderRadius: '22px',
//                     margin: '10px',
//                     display: 'flex',
//                     justifyContent: 'space-between',
//                     alignItems: 'center',
//                 }}>
//                     <button
//                         onClick={() => setIsSidebarOpen(!isSidebarOpen)}
//                         style={{
//                             background: 'rgba(255, 255, 255, 0.08)',
//                             border: '1px solid rgba(255, 255, 255, 0.1)',
//                             padding: '8px 12px',
//                             cursor: 'pointer',
//                             borderRadius: '8px',
//                             fontSize: '18px',
//                             color: '#d1d5db',
//                         }}
//                     >
//                         ☰
//                     </button>
//                     <h1 style={{
//                         margin: 0,
//                         fontSize: '18px',
//                         fontWeight: 600,
//                         color: 'white',
//                         textShadow: '0 2px 4px rgba(0,0,0,0.3)'
//                     }}>
//                         {currentConversationId 
//                             ? conversations.find(c => c.id === currentConversationId)?.title || 'Chat'
//                             : 'Start a new conversation'}
//                     </h1>
//                     <div style={{ width: '50px' }}></div>
//                 </div>

//                 {/* Error message */}
//                 {error && (
//                     <div style={{
//                         padding: '12px 20px',
//                         marginTop: '100px', // To avoid overlap with header
//                         background: 'rgba(239, 68, 68, 0.15)',
//                         color: '#fca5a5',
//                         borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
//                         display: 'flex',
//                         alignItems: 'center',
//                         gap: '8px',
//                         // marginTop:"2px"
//                     }}>
//                         <span>⚠️</span>
//                         {error}
//                     </div>
//                 )}

//                 {/* Messages area */}
//                 <div style={{
//                     flex: 1,
//                     overflowY: 'auto',
//                     padding: '24px',
//                     paddingTop: '100px',
//                     // --- ADD THE LINES BELOW ---
//                     paddingBottom: '40px', // Extra space so last message can clear the blur
//                     display: 'flex',
//                     flexDirection: 'column',
//                     WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 90%, transparent 100%)',
//                     maskImage: 'linear-gradient(to bottom, black 0%, black 90%, transparent 100%)',
//                 }}>
//                     {currentMessages.length === 0 ? (
//                         <div style={{
//                             display: 'flex',
//                             justifyContent: 'center',
//                             alignItems: 'center',
//                             height: '100%',
//                             flexDirection: 'column',
//                             gap: '20px'
//                         }}>
//                             <div style={{
//                                 fontSize: '64px',
//                                 opacity: 0.5
//                             }}>
//                               <FontAwesomeIcon icon={faMessage}/>
//                               {/* <FontAwesomeIcon icon={faMessage.fadt['message']} style={{"--fa-secondary-color": "#2e67b2", "--fa-secondary-opacity": "1",}} /> */}
//                             </div>
//                             <p style={{
//                                 color: '#adb5bd',
//                                 fontSize: '16px',
//                                 textAlign: 'center'
//                             }}>
//                                 No messages yet.<br />
//                                 <span style={{ fontSize: '14px' }}>Start typing to begin chatting!</span>
//                             </p>
//                         </div>
//                     ) : (
//                         <>
//                             {currentMessages.map((msg, idx) => (
//                                 <div
//                                     key={idx}
//                                     style={{
//                                         marginBottom: '16px',
//                                         display: 'flex',
//                                         justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
//                                     }}
//                                     className="message-fade"
//                                 >
//                                     <div
//                                         style={{
//                                             maxWidth: '70%',
//                                             padding: '12px 16px',
//                                             borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
//                                             background: msg.role === 'user'
//                                                 ? 'linear-gradient(135deg, #cd001e 0%, #e63946 100%)'
//                                                 : 'rgba(255, 255, 255, 0.08)',
//                                             border: msg.role === 'user'
//                                                 ? 'none'
//                                                 : '1px solid rgba(255, 255, 255, 0.1)',
//                                             color: msg.role === 'user' ? 'white' : '#d1d5db',
//                                             wordWrap: 'break-word',
//                                             fontSize: '14px',
//                                             lineHeight: '1.5',
//                                             boxShadow: msg.role === 'user'
//                                                 ? '0 8px 16px rgba(205, 0, 30, 0.2)'
//                                                 : 'none'
//                                         }}
//                                     >
//                                         {msg.content}
//                                     </div>
//                                 </div>
//                             ))}
//                             <div ref={messagesEndRef} />
//                         </>
//                     )}
//                 </div>

//                 {/* Input area */}
//                 <div style={{
//                     display: 'flex',
//                     justifyContent: 'center',
//                     padding: '20px',
//                     // --- UPDATE THESE PROPERTIES ---
//                     // background: 'rgba(15, 23, 42, 0.57)', // Matches your header
//                     // backdropFilter: 'blur(12px)',         // Matches your header
//                     // WebkitBackdropFilter: 'blur(12px)',
//                     // borderTop: '1px solid rgba(255, 255, 255, 0.1)', // Soft border
//                     // borderRadius: '22px 22px 0 0',        // Optional: slight round at top to match header style
//                     // margin: '0 10px 10px 10px',     
//                 }}>
//                     <form onSubmit={sendMessage} style={{
//                         display: 'flex',
//                         gap: '12px'
//                     }}>
//                         <input
//                             type="text"
//                             value={inputMessage}
//                             onChange={(e) => setInputMessage(e.target.value)}
//                             placeholder="Type your message..."
//                             disabled={isLoading}
//                             style={{
//                                 width:'800px',
//                                 flex: 1,
//                                 padding: '12px 16px',
//                                 background: 'rgba(255, 255, 255, 0.05)',
//                                 border: '1px solid rgba(255, 255, 255, 0.1)',
//                                 borderRadius: '25px',
//                                 fontSize: '14px',
//                                 color: 'white',
//                                 transition: 'all 0.3s ease',
//                                 opacity: isLoading ? 0.5 : 1,
//                                 boxSizing: 'border-box'
//                             }}
//                             onFocus={(e) => {
//                                 e.target.style.background = 'rgba(255, 255, 255, 0.1)';
//                                 e.target.style.borderColor = 'rgba(205, 0, 30, 0.5)';
//                             }}
//                             onBlur={(e) => {
//                                 e.target.style.background = 'rgba(255, 255, 255, 0.05)';
//                                 e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
//                             }}
//                         />
//                         <button
//                             type="submit"
//                             title="Send"
//                             disabled={isLoading || !inputMessage.trim()}
//                             // onClick={logResponse}
//                             style={{
//                                 padding: '12px 20px',
//                                 background: isLoading
//                                     ? 'rgba(107, 114, 128, 0.5)'
//                                     : 'linear-gradient(135deg, #cd001e 0%, #e63946 100%)',
//                                 color: 'white',
//                                 border: 'none',
//                                 borderRadius: '25px',
//                                 cursor: isLoading ? 'not-allowed' : 'pointer',
//                                 fontSize: '14px',
//                                 fontWeight: 600,
//                                 transition: 'all 0.3s ease',
//                                 boxShadow: isLoading
//                                     ? 'none'
//                                     : '0 10px 25px rgba(205, 0, 30, 0.3)',
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 gap: '6px'
//                             }}
//                             onMouseEnter={(e) => {
//                                 if (!isLoading) {
//                                     e.target.style.transform = 'translateY(-2px)';
//                                     e.target.style.boxShadow = '0 15px 35px rgba(205, 0, 30, 0.4)';
//                                 }
//                             }}
//                             onMouseLeave={(e) => {
//                                 if (!isLoading) {
//                                     e.target.style.transform = 'translateY(0)';
//                                     e.target.style.boxShadow = '0 10px 25px rgba(205, 0, 30, 0.3)';
//                                 }
//                             }}
//                         >
//                             {isLoading ? (
//                                 <>
//                                     {/* <span style={{
//                                         display: 'inline-block',
//                                         width: '14px',
//                                         height: '14px',
//                                         borderRadius: '50%',
//                                         borderTop: '2px solid white',
//                                         borderRight: '2px solid white',
//                                         borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
//                                         borderLeft: '2px solid rgba(255, 255, 255, 0.2)'
//                                     }} className="spinner" /> */}
//                                     {/* Sending... */}
//                                     <ShimmeringText text="Sending..." 
//                                                     color="#959aa3ff"
//                                                     shimmerColor="#e5e8eeff"/>
//                                 </>
//                             ) : (
//                                 <>
//                                   <FontAwesomeIcon icon={faPaperPlane} 
//                                                     title="Send Message"
//                                                     style={{ marginRight: '4px' }} />
//                                     {/* <span></span> */}
//                                 </>
//                             )}
//                         </button>
//                     </form>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default ChatPage;



// ============================================================================


import { useState, useEffect, useRef, useCallback } from 'react'; // Add useCallback
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMessage, faPaperPlane, faArrowAltCircleRight } from '@fortawesome/free-regular-svg-icons';
import { ShimmeringText } from './ui/shimmering-text';
import { useStore } from './Store';

const ChatPage = () => {
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [currentMessages, setCurrentMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
     const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [error, setError] = useState('');
    const [websocket, setWebsocket] = useState(null); // New state for WebSocket instance
    const [isWsReady, setIsWsReady] = useState(false); // Track if WS is truly open

    const isLogin = useStore((state) => state.isLogin);
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

    // JWT Refresh Logic (already existing, good to keep)
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
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(window.atob(base64));
        } catch (e) { return {}; }
    };

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