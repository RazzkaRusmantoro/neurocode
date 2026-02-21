'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your AI assistant. How can I help you with onboarding today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [iconError, setIconError] = useState(false);
  const [headerIconError, setHeaderIconError] = useState(false);
  
  // Calculate responsive default size
  const getDefaultSize = () => {
    if (typeof window === 'undefined') {
      return { width: 384, height: 600 };
    }
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate responsive width: 30% of viewport, but between 280px and 500px
    const responsiveWidth = Math.max(280, Math.min(500, viewportWidth * 0.3));
    
    // Calculate responsive height: 60% of viewport, but between 400px and 700px
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
  const inputRef = useRef<HTMLInputElement>(null);
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
    
    // Constrain width
    const maxWidth = viewportWidth - (margin * 2);
    const minWidth = 250;
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
      // Focus input when chat opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, messages]);

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
      const minWidth = 250;
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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Simulate bot response (replace with actual API call later)
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm here to help! This is a placeholder response. Connect me to your AI backend to get real answers.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 500);
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
            className="bg-[#1a1a1d] border-b border-[#262626] px-4 py-3 flex items-center justify-between cursor-move"
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

          {/* Messages */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                    message.sender === 'user'
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[#1a1a1d] text-white/90 border border-[#262626]'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.text}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-white/70' : 'text-white/50'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="border-t border-[#262626] p-4 bg-[#1a1a1d]">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-[#121215] border border-[#262626] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2.5 transition-colors"
                aria-label="Send message"
              >
                <svg
                  className="w-5 h-5 rotate-90"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </form>
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

