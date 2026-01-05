'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send, Database, Loader2, Bot,
  ChevronDown, ChevronRight, BrainCircuit, Sparkles,
  PanelLeftClose, PanelLeftOpen, Moon, Sun
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';
import PageLoadingSkeleton from './components/PageLoadingSkeleton';

// --- UTILS ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const API_URL = 'http://localhost:8000';

export default function ChatPage() {
  const [connections, setConnections] = useState([]);
  const [selectedConn, setSelectedConn] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  

  // --- BACKEND FETCH LOGIC ---
  useEffect(() => {
    async function fetchConnections() {
      try {
        setIsLoadingConnections(true);
        const res = await fetch(`${API_URL}/connections`);
        const data = await res.json();
        setConnections(data);
        if (data.length > 0) setSelectedConn(data[0].name);
      } catch (err) {
        console.error("Failed to fetch connections:", err);
      } finally {
        setIsLoadingConnections(false);
        // Add a small delay to ensure smooth transition
        setTimeout(() => setIsPageLoading(false), 800);
      }
    }
    fetchConnections();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || !selectedConn || isLoading) return;

    const userMessage = input;
    setInput('');
    setIsLoading(true);
    setStatus('Initializing...');
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setMessages(prev => [...prev, { role: 'assistant', content: '', thoughts: [] }]); 

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage, connection_name: selectedConn }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              // 1. Handle Regular Answer Token
              if (data.type === 'token') {
                setMessages(prev => {
                  const newHistory = [...prev];
                  const lastIndex = newHistory.length - 1;
                  newHistory[lastIndex] = {
                    ...newHistory[lastIndex],
                    content: newHistory[lastIndex].content + data.content
                  };
                  return newHistory;
                });
              } 
              // 2. Handle Thought (Reasoning/SQL)
              else if (data.type === 'thought') {
                 setMessages(prev => {
                  const newHistory = [...prev];
                  const lastIndex = newHistory.length - 1;
                  const currentThoughts = newHistory[lastIndex].thoughts || [];
                  
                  newHistory[lastIndex] = {
                    ...newHistory[lastIndex],
                    thoughts: [...currentThoughts, {
                      title: data.title,
                      content: data.content,
                      language: data.language
                    }]
                  };
                  return newHistory;
                });
              }
              // 3. Status
              else if (data.type === 'status') {
                setStatus(data.content);
              }
            } catch (e) { console.error(e); }
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setStatus('');
    }
  };

  if (isPageLoading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <div
      className="flex h-screen font-sans overflow-hidden "
      style={{
        backgroundImage: isDarkMode
          ? 'url(/reversed_bgz-enhanced.png)'
          : 'url(/bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
        body { font-family: 'Montserrat', sans-serif; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      {/* --- COLLAPSIBLE SIDEBAR --- */}
      <motion.aside
        initial={{ width: 288 }}
        animate={{ width: isSidebarOpen ? 288 : 80 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 100, damping: 20 }}
        whileHover={{ boxShadow: "0 25px 50px -12px rgba(205, 0, 30, 0.25)" }}
        onMouseEnter={() => setIsSidebarOpen(true)}
        onMouseLeave={() => setIsSidebarOpen(false)}
        className="bg-[#0a1428] text-white flex flex-col shadow-xl z-20 relative flex-shrink-0 transition-shadow duration-300"
      >
        <div className="p-5 border-b border-[#142350] h-20 flex items-center overflow-hidden">
          <div className="flex items-center gap-3">
            <motion.div
                layout
                className="flex-shrink-0"
                whileHover={{ scale: 1.05 }}
            >
              <img
                src="/logo_S_white.png"
                alt="Logo"
                className="w-10 h-10 object-contain"
              />
            </motion.div>
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="whitespace-nowrap"
                    >
                        <h1 className="font-bold text-lg tracking-tight">SOLAR DATA</h1>
                        <p className="text-[10px] text-gray-400 font-medium tracking-wider">POWER TO PROPEL</p>
                    </motion.div>
                )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3">
          <AnimatePresence>
              {isSidebarOpen && (
                  <motion.p 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 px-2 whitespace-nowrap"
                  >
                    Connections
                  </motion.p>
              )}
          </AnimatePresence>

          {isLoadingConnections ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <motion.div
                key={`skeleton-${idx}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg"
              >
                <div className="w-4 h-4 bg-gray-700 rounded animate-pulse flex-shrink-0" />
                {isSidebarOpen && (
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-700 rounded animate-pulse w-3/4" />
                    <div className="h-2 bg-gray-700/50 rounded animate-pulse w-1/2" />
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            connections.map((conn) => (
            <motion.button
              key={conn.name}
              layout
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedConn(conn.name)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all duration-300 group relative",
                "border border-transparent",
                selectedConn === conn.name
                  ? "bg-[#142350] border-[#eaeaea] text-white shadow-md shadow-red-900/20"
                  : "hover:bg-[#142350]/70 hover:shadow-lg text-gray-300 hover:text-white hover:border-[#cd001e]/30"
              )}
            >
              {selectedConn === conn.name && (
                <motion.div 
                    layoutId="active-indicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-[#eaeaea] rounded-l-lg" 
                />
              )}
              <div className="flex-shrink-0">
                  <Database className={cn("w-4 h-4", selectedConn === conn.name ? "text-[#eaeaea]" : "text-gray-400")} />
              </div>
              <AnimatePresence mode='popLayout'>
                  {isSidebarOpen && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="font-medium whitespace-normal break-words leading-snug">
                            {conn.name}
                        </div>
                        <div className="text-[10px] mt-1 opacity-60 font-mono group-hover:opacity-100 transition-opacity truncate">
                            {conn.database}
                        </div>
                      </motion.div>
                  )}
              </AnimatePresence>
              {!isSidebarOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                      {conn.name}
                  </div>
              )}
            </motion.button>
          ))
          )}
        </div>
        
        <div className="p-4 border-t border-[#142350] bg-[#0d133a] h-20 flex items-center overflow-hidden">
           <div className="flex items-center gap-3">
              <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className="w-8 h-8 rounded-full bg-[#cd001e] flex items-center justify-center text-xs font-bold flex-shrink-0 cursor-pointer text-white"
              >
                US
              </motion.div>
              <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 min-w-0 whitespace-nowrap"
                    >
                        <p className="text-sm font-medium truncate">User Admin</p>
                        <p className="text-xs text-gray-400">Pro License</p>
                    </motion.div>
                  )}
              </AnimatePresence>
           </div>
        </div>
      </motion.aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col relative w-full min-w-0" style={{ backgroundColor: 'transparent' }}>
        <header className={cn(
          "h-16 backdrop-blur-sm border-b flex items-center px-6 justify-between shadow-sm z-10 flex-shrink-0 transition-all duration-300",
          isDarkMode
            ? "bg-grey/60 border-gray-700 text-white"
            : "bg-grey/60 border-gray-200/30 text-[#0a1428]"
        )}>
            <div className="flex items-center gap-4 overflow-hidden">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#cd001e] md:hidden" />
                <h2 className={cn(
                  "font-bold text-sm md:text-lg truncate transition-colors",
                  isDarkMode ? "text-white" : "text-[#0a1428]"
                )}>
                  {selectedConn ? selectedConn.replace(/_/g, ' ') : 'Select Database'}
                </h2>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isDarkMode
                  ? "bg-gray-800 hover:bg-gray-700"
                  : "bg-[#f8f9fa] hover:bg-gray-200"
              )}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-[#cd001e]" />
              ) : (
                <Moon className="w-5 h-5 text-[#cd001e]" />
              )}
            </motion.button>
        </header>

        <div className="flex-1 p-4 md:p-8 space-y-8 scroll-auto overflow-y-auto">
          {messages.length === 0 && (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="h-full flex flex-col items-center justify-center text-center opacity-40 select-none scroll-auto"
            >
              <div className="relative">
                  <motion.div
                    className="absolute inset-0 bg-red-100 rounded-full blur-xl opacity-50"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-16 h-16 text-[#cd001e] mb-4 relative z-10" />
                  </motion.div>
              </div>
              <h3 className={cn(
                "text-2xl font-bold transition-colors",
                isDarkMode ? "text-white" : "text-[#0a1428]"
              )}>How can I propel you today?</h3>
              <p className={cn(
                "text-sm mt-2 max-w-md transition-colors",
                isDarkMode ? "text-gray-300" : "text-gray-600"
              )}>Select a database connection and ask complex questions about your sales, marketing, or operational data.</p>
            </motion.div>
          )}
          
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              const isThinking = msg.role === 'assistant' && idx === messages.length - 1 && isLoading && !msg.content;

              return (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className={cn(
                      "flex gap-4",
                      msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === 'assistant' && (
                      <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-10 h-10 rounded-full bg-[#0a1428] flex items-center justify-center flex-shrink-0 shadow-lg mt-1"
                      >
                      <Bot className="w-6 h-6 text-white" />
                      </motion.div>
                  )}
                  
                  <div className={cn(
                      "flex flex-col max-w-[90%] md:max-w-[75%]", 
                      msg.role === 'user' ? "items-end" : "items-start"
                  )}>
                      
                      {msg.thoughts && msg.thoughts.length > 0 && (
                        <div className="mb-3 w-full space-y-2">
                            {msg.thoughts.map((thought, tIdx) => (
                              <ThoughtItem key={tIdx} thought={thought} />
                            ))}
                        </div>
                      )}

                      <motion.div
                          layout
                          className={cn(
                          "px-6 py-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed overflow-hidden min-h-[60px] min-w-[120px]",
                          msg.role === 'user'
                              ? "bg-[#cd001e] text-white rounded-br-sm"
                              : cn(
                                  "backdrop-blur-md border rounded-bl-sm",
                                  isDarkMode
                                    ? "bg-gray-900/60 border-gray-700/50 text-white"
                                    : "bg-white/30 border-gray-100/50 text-[#0a1428]"
                                )
                          )}
                      >
                        <AnimatePresence mode="wait">
                          {isThinking ? (
                            <div key="thinking" className="space-y-3">
                              <ThinkingIndicator status={status || 'Thinking...'} isDarkMode={isDarkMode} />
                              <MessageSkeleton isDarkMode={isDarkMode} />
                            </div>
                          ) : (
                            <motion.div
                              key="content"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              <ReactMarkdown 
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                  table: ({node, ...props}) => (
                                      <div className={cn(
                                        "my-4 overflow-x-auto rounded-lg border shadow-sm backdrop-blur-sm",
                                        isDarkMode
                                          ? "border-gray-700/50 bg-gray-900/40"
                                          : "border-gray-200/50 bg-white/40"
                                      )}>
                                      <table className="w-full text-sm text-left border-collapse" {...props} />
                                      </div>
                                  ),
                                  thead: ({node, ...props}) => (
                                      <thead className={cn(
                                        "uppercase text-xs font-bold tracking-wider",
                                        isDarkMode
                                          ? "bg-gray-800/60 text-white"
                                          : "bg-[#f1f5f9]/60 text-[#0a1428]"
                                      )} {...props} />
                                  ),
                                  th: ({node, ...props}) => (
                                      <th className={cn(
                                        "px-4 py-3 border-b whitespace-nowrap",
                                        isDarkMode ? "border-gray-700/50" : "border-gray-200/50"
                                      )} {...props} />
                                  ),
                                  td: ({node, ...props}) => (
                                      <td className={cn(
                                        "px-4 py-3 border-b",
                                        isDarkMode ? "border-gray-700/50" : "border-gray-100/50"
                                      )} {...props} />
                                  ),
                                  tr: ({node, ...props}) => (
                                      <motion.tr
                                          whileHover={{ backgroundColor: isDarkMode ? "rgba(75, 85, 99, 0.2)" : "rgba(195, 220, 250, 0.2)" }}
                                          {...props}
                                      />
                                  ),
                                  strong: ({node, ...props}) => <strong className={cn(
                                    "font-bold",
                                    isDarkMode ? "text-white" : "text-[#0a1428]"
                                  )} {...props} />,
                                  p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                  }}
                              >
                                  {msg.content}
                              </ReactMarkdown>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <div className={cn(
          "p-6 backdrop-blur-sm border-t z-10 flex-shrink-0 transition-all duration-300",
          isDarkMode
            ? "bg-grey/60 border-gray-700"
            : "bg-grey/60 border-gray-200/50"
        )}>
             <div className="max-w-4xl mx-auto relative group ">
                <motion.div whileFocus={{ scale: 1.01 }} className="relative">
                    <textarea
                    ref={textareaRef}
                    className={cn(
                        "w-full pl-6 pr-14 py-4 rounded-xl border-2 transition-all duration-300 resize-none overflow-hidden",
                        "placeholder-gray-500",
                        isDarkMode
                          ? "bg-gray-900/90 border-gray-600 text-white focus:bg-gray-900/70 focus:border-[#cd001e]"
                          : "bg-white/30 bxackdrop-blur-md border-gray-300/50 text-[#0a1428] focus:bg-white/40 focus:border-[#c3dcfa]",
                        "focus:outline-none focus:ring-4 focus:ring-[#c3dcfa]/20"
                    )}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Ask your data a courageous question... (Shift+Enter for new line)"
                    disabled={isLoading}
                    rows={1}
                    />
                </motion.div>
                
                <motion.button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors",
                    input.trim()
                      ? "bg-[#cd001e] text-white shadow-lg shadow-red-500/30"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  )}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5"/>}
                </motion.button>
             </div>
        </div>
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function ThinkingIndicator({ status, isDarkMode }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="flex items-center gap-3 h-6"
    >
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-[#cd001e]"
            animate={{
              y: ["0%", "-50%", "0%"],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.15
            }}
          />
        ))}
      </div>
      
      <motion.span
        key={status} 
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          "text-sm font-medium relative overflow-hidden",
          isDarkMode ? "text-white" : "text-[#0a1428]"
        )}
      >
        {status}
        <motion.div
          className={cn(
            "absolute inset-0 bg-gradient-to-r from-transparent to-transparent",
            isDarkMode ? "via-gray-700/50" : "via-white/50"
          )}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      </motion.span>
    </motion.div>
  );
}

function ThoughtItem({ thought }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
        layout
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-[#c3dcfa]/50 bg-[#f0f7ff]/40 backdrop-blur-md overflow-hidden shadow-sm"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#142350] hover:bg-[#c3dcfa]/60 transition-colors"
      >
        <BrainCircuit className="w-3.5 h-3.5" />
        <span className="uppercase tracking-wide">{thought.title}</span>
        <motion.div 
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="ml-auto"
        >
            <ChevronDown className="w-3 h-3" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
            <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
            >
                <div className="p-3 border-t border-[#c3dcfa]/50 overflow-x-auto bg-white/50 backdrop-blur-sm">
                <pre className="text-[10px] font-mono text-gray-600 whitespace-pre-wrap break-words">
                    {thought.content}
                </pre>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Simple Skeleton for message content during thinking
function MessageSkeleton({ isDarkMode }) {
    return (
        <div className="space-y-2 animate-pulse mt-2">
            <div className={cn("h-3 rounded w-full", isDarkMode ? "bg-gray-700" : "bg-gray-200")}></div>
            <div className={cn("h-3 rounded w-5/6", isDarkMode ? "bg-gray-700" : "bg-gray-200")}></div>
            <div className={cn("h-3 rounded w-4/6", isDarkMode ? "bg-gray-700" : "bg-gray-200")}></div>
        </div>
    );
}