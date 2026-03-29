import { useState, useEffect, useRef } from 'react';
import { Send, Trash2, RefreshCw, Bot, User, Sparkles, AlertCircle } from 'lucide-react';
import { aiApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

function fmt(date: string) {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function AiChat() {
  useAuth(); // Ensure auth check is active
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataContext, setDataContext] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await aiApi.getChatHistory();
        setMessages(res.data?.messages || []);
      } catch (err: any) {
        console.error('Failed to load chat history:', err);
      } finally {
        setHistoryLoading(false);
      }
    };
    loadHistory();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);

    // Optimistically add user message
    const userMsg: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await aiApi.chat(userMessage);
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: res.data?.reply || 'No response',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setDataContext(res.data?.dataContext || '');
    } catch (err: any) {
      // Show the error but keep the user message since the backend saved it
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: err.message?.includes('503') || err.message?.includes('unavailable')
          ? 'I apologize, but the AI coaching service is temporarily unavailable. Your message has been saved and I\'ll respond once the service is back online. Please try again in a few minutes.'
          : (err.message || 'Something went wrong. Please try again.'),
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Clear all chat history?')) return;
    try {
      await aiApi.clearChatHistory();
      setMessages([]);
      setDataContext('');
    } catch (err: any) {
      setError(err.message || 'Failed to clear history');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <main className="p-4 md:p-6 max-w-4xl mx-auto w-full h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Bot className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">AI Trading Coach</h1>
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <Sparkles size={14} className="text-purple-500" />
              Personalized behavioral insights
              {dataContext && (
                <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                  {dataContext}
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={handleClear}
          className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
          title="Clear chat"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            &times;
          </button>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto bg-slate-50 rounded-xl p-4 space-y-4">
        {historyLoading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="animate-spin text-slate-400" size={24} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Bot size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Start a conversation</p>
            <p className="text-sm mb-6 text-center">Ask about your trading performance, discipline, or get coaching advice.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-lg">
              {[
                'What is my win rate this week?',
                'How can I improve my discipline?',
                'What are my biggest violations?',
                'Give me tips for managing losses',
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestion(suggestion)}
                  className="px-4 py-2 bg-white border rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-purple-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-md'
                    : 'bg-white border border-slate-200 rounded-bl-md'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-100' : 'text-slate-400'}`}>
                  {fmt(msg.timestamp)}
                </p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-blue-600" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <Bot size={16} className="text-purple-600" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="mt-4 flex gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask your trading coach..."
          className="flex-1 resize-none border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          rows={1}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl transition flex items-center gap-2"
        >
          <Send size={18} />
          <span className="hidden md:inline">Send</span>
        </button>
      </div>
    </main>
  );
}