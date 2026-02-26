'use client';

import { useState, useRef, useEffect } from 'react';
import type { ChatbotOrgContext } from '@/app/components/Chatbot';

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

/** Short label for bubble, detailed sentence prefilled into the input (row1: 3, row2: 2) */
const SUGGESTIONS: { label: string; prefill: string }[] = [
  { label: 'Overview', prefill: 'Give me a high-level overview of what this documentation covers.' },
  { label: 'Explain simply', prefill: 'Explain this in simple terms. What is the main idea?' },
  { label: 'Key concepts', prefill: 'Summarize the key concepts and ideas covered in this documentation.' },
  { label: 'Definitions & terms', prefill: 'What important definitions, terms, or details should I know?' },
  { label: 'Where to begin', prefill: 'What should I read first? Where is the best place to begin?' },
];

function createNewChat(): Chat {
  return {
    id: `chat-${Date.now()}`,
    title: 'New chat',
    messages: [],
  };
}

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

interface DocumentationChatPanelProps {
  orgContext?: ChatbotOrgContext;
  /** Optional width when expanded (default: 400px or min(400, 35vw)) */
  width?: number;
}

export default function DocumentationChatPanel({ orgContext, width: propWidth }: DocumentationChatPanelProps) {
  const [chats, setChats] = useState<Chat[]>(() => [createNewChat()]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [headerIconError, setHeaderIconError] = useState(false);
  const [chatsDrawerOpen, setChatsDrawerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeChat = activeChatId
    ? chats.find((c) => c.id === activeChatId) ?? chats[0]
    : chats[0];
  const messages = activeChat?.messages ?? [];

  const filteredChats = chatSearchQuery.trim()
    ? chats.filter((c) =>
        c.title.toLowerCase().includes(chatSearchQuery.trim().toLowerCase())
      )
    : chats;

  const panelWidth = propWidth ?? 400;

  useEffect(() => {
    if (chats.length === 0) return;
    const activeExists = activeChatId && chats.some((c) => c.id === activeChatId);
    if (!activeExists) setActiveChatId(chats[0].id);
  }, [chats.length]);

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

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleNewChat = () => {
    const newChat = createNewChat();
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setInputValue('');
    setChatsDrawerOpen(false);
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setChatsDrawerOpen(false);
  };

  const handleSuggestionClick = (text: string) => {
    setInputValue(text);
    setTimeout(() => inputRef.current?.focus(), 0);
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
      .map((m) => ({ role: m.sender === 'user' ? ('user' as const) : ('assistant' as const), content: m.text }));

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
    } catch {
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

  return (
    <div
      className="h-full flex flex-col bg-[#121215] border-l border-[#262626] flex-shrink-0 overflow-hidden"
      style={{ width: panelWidth, minWidth: 280 }}
    >
      {/* Header */}
      <div className="bg-[#1a1a1d] border-b border-[#262626] px-4 py-3 flex items-center gap-3 flex-shrink-0">
        {headerIconError ? (
          <svg
            className="w-6 h-6 text-white"
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
            className="w-6 h-6 object-contain"
            onError={() => setHeaderIconError(true)}
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm">AI Assistant</h3>
          <p className="text-white/60 text-xs">Documentation</p>
        </div>
        <button
          type="button"
          onClick={() => setChatsDrawerOpen((prev) => !prev)}
          className="text-white/50 hover:text-white p-1 rounded cursor-pointer"
          aria-label={chatsDrawerOpen ? 'Close chats list' : 'Open chats list'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Main content: always the conversation */}
      <div className="flex flex-1 flex-col min-h-0 min-w-0 relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[240px] gap-5">
              <p className="doc-chat-welcome-text text-white/70 text-sm text-center">
                Ask me anything about this documentation
              </p>
              <div className="flex flex-col items-center gap-3">
                <div className="flex justify-center gap-2">
                  {SUGGESTIONS.slice(0, 3).map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSuggestionClick(s.prefill)}
                      className="doc-chat-bubble-enter px-3 py-2 rounded-full bg-[#1a1a1d] border border-[#262626] text-white/90 text-xs hover:bg-[#262626] hover:border-white/20 transition-colors cursor-pointer whitespace-nowrap"
                      style={{ animationDelay: `${0.1 + i * 0.07}s` }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <div className="flex justify-center gap-2">
                  {SUGGESTIONS.slice(3, 5).map((s, i) => (
                    <button
                      key={i + 3}
                      type="button"
                      onClick={() => handleSuggestionClick(s.prefill)}
                      className="doc-chat-bubble-enter px-3 py-2 rounded-full bg-[#1a1a1d] border border-[#262626] text-white/90 text-xs hover:bg-[#262626] hover:border-white/20 transition-colors cursor-pointer whitespace-nowrap"
                      style={{ animationDelay: `${0.31 + i * 0.07}s` }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) =>
                message.sender === 'user' ? (
                  <div key={message.id} className="w-full">
                    <div className="w-full rounded-lg px-4 py-2.5 bg-[#1a1a1d] text-white border border-[#262626]">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                    </div>
                  </div>
                ) : (
                  <div key={message.id} className="flex justify-start w-full">
                    <div className="w-full py-2 border-l-2 border-[var(--color-primary)]/50 pl-3 text-white/90">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                      <p className="text-xs mt-1 text-white/50">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <form onSubmit={handleSend} className="flex-shrink-0 p-3">
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
              placeholder="Ask about this documentation..."
              rows={1}
              className="w-full bg-transparent px-4 py-3 text-white text-sm placeholder-white/40 focus:outline-none resize-none min-h-[48px] overflow-hidden border-0 rounded-none"
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

        {/* Animated drawer: all chats / new chat */}
        <>
          <div
            role="presentation"
            onClick={() => setChatsDrawerOpen(false)}
            className={`absolute inset-0 bg-black/50 z-10 transition-opacity duration-300 ${
              chatsDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            aria-hidden
          />
          <div
            className={`absolute top-0 right-0 bottom-0 w-[220px] bg-[#0d0d0f] border-l border-[#262626] shadow-xl z-20 flex flex-col transition-transform duration-300 ease-out ${
              chatsDrawerOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="p-2 flex flex-col gap-2 flex-shrink-0">
              <input
                type="text"
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="w-full bg-[#1a1a1d] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleNewChat}
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
                    className={`w-full text-left rounded-lg px-2 py-2.5 flex items-start gap-2 transition-colors cursor-pointer ${
                      isActive ? 'bg-[#262626]' : 'hover:bg-[#1a1a1d]'
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
        </>
      </div>
    </div>
  );
}
