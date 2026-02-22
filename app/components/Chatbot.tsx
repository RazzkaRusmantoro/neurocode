'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

const DEFAULT_WELCOME: Message = {
  id: 'welcome',
  text: "Hi! I'm your AI assistant. How can I help you with onboarding today?",
  sender: 'bot',
  timestamp: new Date(),
};

function createNewChat(): Chat {
  return {
    id: `chat-${Date.now()}`,
    title: 'New chat',
    messages: [DEFAULT_WELCOME],
  };
}

const SIDEBAR_WIDTH = 220;

function formatChatRelativeTime(chat: Chat): string {
  const lastMsg = chat.messages[chat.messages.length - 1];
  const date = lastMsg?.timestamp ? new Date(lastMsg.timestamp) : new Date();
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getChatSubtitle(chat: Chat): string {
  const userMessages = chat.messages.filter((m) => m.sender === 'user');
  if (userMessages.length === 0) return 'No messages yet';
  const last = userMessages[userMessages.length - 1];
  const text = last.text.trim();
  if (!text) return 'No changes';
  return text.length > 24 ? text.slice(0, 24) + '…' : text;
}

export interface ChatbotOrgContext {
  orgShortId: string;
}

interface ChatbotProps {
  orgContext?: ChatbotOrgContext;
}

export default function Chatbot({ orgContext }: ChatbotProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [chats, setChats] = useState<Chat[]>(() => [createNewChat()]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [iconError, setIconError] = useState(false);
  const [headerIconError, setHeaderIconError] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Resolved active chat (sidebar + multiple chats)
  const activeChat = activeChatId
    ? chats.find((c) => c.id === activeChatId) ?? chats[0]
    : chats[0];
  const messages = activeChat?.messages ?? [];

  const filteredChats = chatSearchQuery.trim()
    ? chats.filter((c) =>
        c.title.toLowerCase().includes(chatSearchQuery.trim().toLowerCase())
      )
    : chats;

  // Calculate responsive default size (wider to fit chat list sidebar)
  const getDefaultSize = () => {
    if (typeof window === 'undefined') {
      return { width: 440, height: 600 };
    }
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const minWidth = 320 + SIDEBAR_WIDTH; // room for sidebar + messages
    const responsiveWidth = Math.max(minWidth, Math.min(560, viewportWidth * 0.35));
    const responsiveHeight = Math.max(400, Math.min(700, viewportHeight * 0.6));
    return { width: responsiveWidth, height: responsiveHeight };
  };
  
  const [width, setWidth] = useState(() => getDefaultSize().width);
  const [height, setHeight] = useState(() => getDefaultSize().height);
  const [rightOffset, setRightOffset] = useState(24); // bottom-6 = 24px
  const [bottomOffset, setBottomOffset] = useState(24); // right-6 = 24px
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, right: 0, bottom: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0, right: 0, bottom: 0, left: 0, top: 0 });
  const [mounted, setMounted] = useState(false);
  const lastDefaultSizeRef = useRef(getDefaultSize());
  const hasUserResizedRef = useRef(false);
  const currentSizeRef = useRef({ width: getDefaultSize().width, height: getDefaultSize().height });
  const currentPositionRef = useRef({ right: 24, bottom: 24 });

  // Function to constrain chatbot position and size within viewport
  const constrainToViewport = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 24; // Minimum margin from edges
    
    // Get current values from refs
    const currentWidth = currentSizeRef.current.width;
    const currentHeight = currentSizeRef.current.height;
    const currentRight = currentPositionRef.current.right;
    const currentBottom = currentPositionRef.current.bottom;
    
    // Constrain width (min accommodates sidebar)
    const maxWidth = viewportWidth - (margin * 2);
    const minWidth = 280 + SIDEBAR_WIDTH;
    let constrainedWidth = Math.max(minWidth, Math.min(currentWidth, maxWidth));
    
    // Constrain height
    const maxHeight = viewportHeight - (margin * 2);
    const minHeight = 300;
    let constrainedHeight = Math.max(minHeight, Math.min(currentHeight, maxHeight));
    
    // Constrain position (right offset)
    const maxRight = viewportWidth - constrainedWidth - margin;
    let constrainedRight = Math.max(margin, Math.min(currentRight, maxRight));
    
    // Constrain position (bottom offset)
    const maxBottom = viewportHeight - constrainedHeight - margin;
    let constrainedBottom = Math.max(margin, Math.min(currentBottom, maxBottom));
    
    // Update if constraints were applied
    if (constrainedWidth !== currentWidth) {
      setWidth(constrainedWidth);
      currentSizeRef.current.width = constrainedWidth;
    }
    if (constrainedHeight !== currentHeight) {
      setHeight(constrainedHeight);
      currentSizeRef.current.height = constrainedHeight;
    }
    if (constrainedRight !== currentRight) {
      setRightOffset(constrainedRight);
      currentPositionRef.current.right = constrainedRight;
    }
    if (constrainedBottom !== currentBottom) {
      setBottomOffset(constrainedBottom);
      currentPositionRef.current.bottom = constrainedBottom;
    }
  };

  useEffect(() => {
    setMounted(true);
    
    // Set initial responsive size on mount
    const defaultSize = getDefaultSize();
    setWidth(defaultSize.width);
    setHeight(defaultSize.height);
    currentSizeRef.current = { width: defaultSize.width, height: defaultSize.height };
    lastDefaultSizeRef.current = defaultSize;
    
    // Update size on window resize (includes zoom events)
    const handleResize = () => {
      const defaultSize = getDefaultSize();
      
      // Only auto-resize if user hasn't manually resized, or if the window got significantly smaller
      if (!hasUserResizedRef.current) {
        setWidth(defaultSize.width);
        setHeight(defaultSize.height);
        currentSizeRef.current = { width: defaultSize.width, height: defaultSize.height };
        lastDefaultSizeRef.current = defaultSize;
      } else {
        // If window got much smaller, still adjust to prevent overflow
        const currentWidth = currentSizeRef.current.width;
        const currentHeight = currentSizeRef.current.height;
        const maxWidth = window.innerWidth - 48; // Leave some margin
        const maxHeight = window.innerHeight - 48;
        
        if (currentWidth > maxWidth) {
          const newWidth = Math.max(280, maxWidth);
          setWidth(newWidth);
          currentSizeRef.current.width = newWidth;
        }
        if (currentHeight > maxHeight) {
          const newHeight = Math.max(400, maxHeight);
          setHeight(newHeight);
          currentSizeRef.current.height = newHeight;
        }
      }
      
      // Always constrain position and size to viewport (handles zoom scenarios)
      constrainToViewport();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const adjustTextareaHeight = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  // Keep activeChatId in sync (e.g. select first chat when only one exists)
  useEffect(() => {
    if (chats.length === 0) return;
    const activeExists = activeChatId && chats.some((c) => c.id === activeChatId);
    if (!activeExists) setActiveChatId(chats[0].id);
  }, [chats.length]);

  // Sync position refs with state
  useEffect(() => {
    currentPositionRef.current = { right: rightOffset, bottom: bottomOffset };
  }, [rightOffset, bottomOffset]);

  useEffect(() => {
    if (isOpen) {
      // Reset position to bottom-right when opening
      setRightOffset(24);
      setBottomOffset(24);
      currentPositionRef.current = { right: 24, bottom: 24 };
      // Reset to default responsive size when opening (if user hasn't manually resized)
      if (!hasUserResizedRef.current) {
        const defaultSize = getDefaultSize();
        setWidth(defaultSize.width);
        setHeight(defaultSize.height);
        currentSizeRef.current = { width: defaultSize.width, height: defaultSize.height };
      }
      // Ensure chatbot is within viewport bounds (handles zoom scenarios)
      setTimeout(() => constrainToViewport(), 0);
      scrollToBottom();
      // Focus input when chat opens or when switching chats
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, activeChatId, messages.length]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Handle dragging
      if (isDragging) {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const deltaX = dragStartRef.current.x - e.clientX;
        const deltaY = dragStartRef.current.y - e.clientY;
        
        const newRight = Math.max(0, Math.min(windowWidth - width, dragStartRef.current.right + deltaX));
        const newBottom = Math.max(0, Math.min(windowHeight - height, dragStartRef.current.bottom + deltaY));
        
        setRightOffset(newRight);
        setBottomOffset(newBottom);
        return;
      }

      // Handle resizing
      if (!isResizing || !resizeDirection) return;

      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaY = e.clientY - resizeStartRef.current.y;

      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const minWidth = 280 + SIDEBAR_WIDTH;
      const minHeight = 300;

      // Handle horizontal resizing (only from left edge)
      if (resizeDirection.includes('left') && !resizeDirection.includes('top')) {
        // Resize from left edge - the left edge should follow the cursor
        // Calculate new left position based on cursor movement
        const newLeft = resizeStartRef.current.left + deltaX;
        const minLeft = 0;
        const maxLeft = windowWidth - minWidth - 20;
        const clampedLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
        
        // Calculate new width: distance from new left to right edge
        const currentRight = windowWidth - resizeStartRef.current.right;
        const newWidth = currentRight - clampedLeft;
        const clampedWidth = Math.max(minWidth, Math.min(windowWidth - clampedLeft - 20, newWidth));
        
        // Calculate new right offset to keep right edge in place
        const newRight = windowWidth - clampedLeft - clampedWidth;
        setWidth(clampedWidth);
        currentSizeRef.current.width = clampedWidth;
        setRightOffset(newRight);
      }

      // Handle vertical resizing (only from top edge)
      if (resizeDirection.includes('top') && !resizeDirection.includes('left')) {
        // Resize from top edge - the top edge should follow the cursor
        // Calculate new top position based on cursor movement
        const newTop = resizeStartRef.current.top + deltaY;
        const minTop = 0;
        const maxTop = windowHeight - minHeight - 20;
        const clampedTop = Math.max(minTop, Math.min(maxTop, newTop));
        
        // Calculate new height: distance from new top to bottom edge
        const currentBottom = windowHeight - resizeStartRef.current.bottom;
        const newHeight = currentBottom - clampedTop;
        const clampedHeight = Math.max(minHeight, Math.min(windowHeight - clampedTop - 20, newHeight));
        
        // Calculate new bottom offset to keep bottom edge in place
        const newBottom = windowHeight - clampedTop - clampedHeight;
        setHeight(clampedHeight);
        currentSizeRef.current.height = clampedHeight;
        setBottomOffset(newBottom);
      }

      // Handle top-left corner resizing
      if (resizeDirection === 'top-left') {
        // Both width and height change, adjusting from top-left corner
        // The top-left corner should follow the cursor
        const newLeft = resizeStartRef.current.left + deltaX;
        const newTop = resizeStartRef.current.top + deltaY;
        const minLeft = 0;
        const minTop = 0;
        const maxLeft = windowWidth - minWidth - 20;
        const maxTop = windowHeight - minHeight - 20;
        const clampedLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
        const clampedTop = Math.max(minTop, Math.min(maxTop, newTop));
        
        // Calculate new width and height
        const currentRight = windowWidth - resizeStartRef.current.right;
        const currentBottom = windowHeight - resizeStartRef.current.bottom;
        const newWidth = currentRight - clampedLeft;
        const newHeight = currentBottom - clampedTop;
        const clampedWidth = Math.max(minWidth, Math.min(windowWidth - clampedLeft - 20, newWidth));
        const clampedHeight = Math.max(minHeight, Math.min(windowHeight - clampedTop - 20, newHeight));
        
        // Calculate new right and bottom offsets
        const newRight = windowWidth - clampedLeft - clampedWidth;
        const newBottom = windowHeight - clampedTop - clampedHeight;
        setWidth(clampedWidth);
        setHeight(clampedHeight);
        currentSizeRef.current.width = clampedWidth;
        currentSizeRef.current.height = clampedHeight;
        setRightOffset(newRight);
        setBottomOffset(newBottom);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection('');
      setIsDragging(false);
    };

    if (isResizing || isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeDirection, isDragging, width, height]);

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    hasUserResizedRef.current = true; // Mark that user is manually resizing
    if (chatWindowRef.current) {
      const rect = chatWindowRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        height: rect.height,
        right: windowWidth - rect.right,
        bottom: windowHeight - rect.bottom,
        left: rect.left,
        top: rect.top,
      };
    }
  };

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    if (chatWindowRef.current) {
      const rect = chatWindowRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        right: windowWidth - rect.right,
        bottom: windowHeight - rect.bottom,
      };
    }
  };

  const handleNewChat = () => {
    const newChat = createNewChat();
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setInputValue('');
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeChat || isSending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };
    setInputValue('');

    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== activeChat.id) return chat;
        const isFirstUserMessage = chat.messages.every((m) => m.sender !== 'user');
        const nextMessages = [...chat.messages, userMessage];
        const title =
          isFirstUserMessage && chat.title === 'New chat'
            ? userMessage.text.slice(0, 36).trim() + (userMessage.text.length > 36 ? '…' : '')
            : chat.title;
        return { ...chat, messages: nextMessages, title };
      })
    );

    setIsSending(true);
    const history = activeChat.messages
      .filter((m) => m.sender === 'user' || m.sender === 'bot')
      .map((m) => ({ role: m.sender === 'user' ? 'user' as const : 'assistant' as const, content: m.text }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.text,
          history,
          orgContext: orgContext ?? undefined,
        }),
      });
      const data = await res.json();
      const reply = res.ok ? (data.reply ?? '') : (data.error ?? data.details ?? 'Something went wrong.');
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: reply,
        sender: 'bot',
        timestamp: new Date(),
      };
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChat.id
            ? { ...chat, messages: [...chat.messages, botMessage] }
            : chat
        )
      );
    } catch (err) {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Failed to send message. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChat.id
            ? { ...chat, messages: [...chat.messages, botMessage] }
            : chat
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleToggle = () => {
    if (isOpen) {
      // Start closing animation
      setIsClosing(true);
      // After animation completes, close
      setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
      }, 300);
    } else {
      setIsOpen(true);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 300);
  };

  const chatbotContent = (
    <>
      {/* Chat Window - Positioned independently */}
      {(isOpen || isClosing) && (
        <div 
          ref={chatWindowRef}
          className="fixed bg-[#121215] border border-[#262626] rounded-lg shadow-2xl flex flex-col overflow-hidden relative" 
          style={{ 
            position: 'fixed',
            zIndex: 99999,
            animation: isClosing ? 'slideDownFade 0.3s ease-out' : 'slideUpFade 0.3s ease-out',
            width: `${width}px`,
            height: `${height}px`,
            right: `${rightOffset}px`,
            bottom: `${bottomOffset}px`,
            left: 'auto',
            top: 'auto',
            pointerEvents: 'auto',
          }}
        >
          {/* Resize Handles - Only left, top, and top-left corner */}
          {/* Top edge */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'top')}
            className="absolute top-0 left-0 w-full h-2 cursor-ns-resize hover:bg-[var(--color-primary)]/30 transition-colors z-10"
            style={{ pointerEvents: 'auto' }}
          />
          {/* Left edge */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'left')}
            className="absolute top-0 left-0 w-2 h-full cursor-ew-resize hover:bg-[var(--color-primary)]/30 transition-colors z-10"
            style={{ pointerEvents: 'auto' }}
          />
          {/* Top-left corner */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'top-left')}
            className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize hover:bg-[var(--color-primary)]/30 transition-colors z-20 rounded-br-lg"
            style={{ pointerEvents: 'auto' }}
          />
          {/* Header - Draggable */}
          <div 
            onMouseDown={handleDragStart}
            className="bg-[#1a1a1d] border-b border-[#262626] px-4 py-3 flex items-center justify-between cursor-move flex-shrink-0"
          >
            <div className="flex items-center gap-3">
              {headerIconError ? (
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              ) : (
                <img 
                  src="/icon.png" 
                  alt="NeuroCode" 
                  className="w-8 h-8 object-contain"
                  onError={() => setHeaderIconError(true)}
                />
              )}
              <div>
                <h3 className="text-white font-semibold text-sm">AI Assistant</h3>
                <p className="text-white/60 text-xs">Online</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              onMouseDown={(e) => e.stopPropagation()}
              className="text-white/60 hover:text-white transition-colors p-1 cursor-pointer"
              aria-label="Close chat"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Messages area */}
          <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {messages.map((message) =>
              message.sender === 'user' ? (
                <div key={message.id} className="w-full">
                  <div className="w-full rounded-lg px-4 py-2.5 bg-[#1a1a1d] text-white border border-[#262626]">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.text}
                    </p>
                  </div>
                </div>
              ) : (
                <div key={message.id} className="flex justify-start w-full">
                  <div className="w-full py-2 border-l-2 border-[var(--color-primary)]/50 pl-3 text-white/90">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.text}
                    </p>
                    <p className="text-xs mt-1 text-white/50">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              )
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message box - typing area + send in one bordered container */}
          <form
            onSubmit={handleSend}
            className="flex-shrink-0 p-3"
          >
            <div className="bg-[#1a1a1d] border border-[#262626] rounded-lg overflow-hidden flex flex-col">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onInput={adjustTextareaHeight}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (inputValue.trim()) handleSend(e as unknown as React.FormEvent);
                  }
                }}
                placeholder="Type your message..."
                rows={1}
                className="w-full bg-transparent px-4 py-3 text-white text-sm placeholder-white/40 focus:outline-none resize-none min-h-[52px] overflow-hidden border-0 rounded-none"
              />
              <div className="flex items-center justify-end px-2 py-2">
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isSending}
                  className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="Send message"
                >
                  {isSending ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </form>
          </div>

            {/* Chat list sidebar - right side, image-style UI */}
            <div
              className="flex-shrink-0 border-l border-[#262626] bg-[#0d0d0f] flex flex-col"
              style={{ width: SIDEBAR_WIDTH }}
            >
              <div className="p-2 flex flex-col gap-2 flex-shrink-0">
                <input
                  type="text"
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder="Search chats..."
                  className="w-full bg-[#1a1a1d] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleNewChat}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="w-full py-2 rounded-lg text-sm font-medium text-white bg-[#1a1a1d] border border-[#262626] hover:bg-[#262626] transition-colors cursor-pointer"
                >
                  New chat
                </button>
              </div>
              <p className="text-white/50 text-xs font-medium px-3 pt-1 pb-1 flex-shrink-0">
                Chats
              </p>
              <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-2 min-h-0">
                {filteredChats.map((chat) => {
                  const isActive = activeChat?.id === chat.id;
                  return (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={() => handleSelectChat(chat.id)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={`w-full text-left rounded-lg px-2 py-2.5 flex items-start gap-2 transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#262626]'
                          : 'hover:bg-[#1a1a1d]'
                      }`}
                      title={chat.title}
                    >
                      <span className="flex-shrink-0 mt-0.5 text-white/80 text-xs" aria-hidden>
                        ✔
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${isActive ? 'text-white font-medium' : 'text-white/90'}`}>
                          {chat.title}
                        </p>
                        <p className="text-xs text-white/50 truncate mt-0.5">
                          {getChatSubtitle(chat)}
                        </p>
                      </div>
                      <span className="flex-shrink-0 text-xs text-white/50">
                        {formatChatRelativeTime(chat)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button - Hidden when chat is open */}
      {!isOpen && (
        <button
          onClick={handleToggle}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#1a1a1d] border border-[#262626] text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-110 cursor-pointer"
          style={{ position: 'fixed', zIndex: 99999, pointerEvents: 'auto' }}
          aria-label="Open chat"
        >
          {iconError ? (
            <svg
              className="w-8 h-8 text-white relative z-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          ) : (
            <img 
              src="/icon.png" 
              alt="NeuroCode" 
              className="w-10 h-10 object-contain relative z-10"
              onError={() => setIconError(true)}
            />
          )}
        </button>
      )}
    </>
  );

  if (!mounted) return null;

  return createPortal(chatbotContent, document.body);
}

