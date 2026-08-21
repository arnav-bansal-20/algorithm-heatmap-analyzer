import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Brain, Trash2, HelpCircle, RefreshCw, MessageSquare } from 'lucide-react';
import { api } from '../services/api';
import { parseMarkdownToHtml } from './AIPrediction';

const ALL_SUGGESTED_PROMPTS = [
  {
    title: 'Explain Master Theorem',
    text: 'Can you explain the Master Theorem and how it calculates recursive time complexity with examples?'
  },
  {
    title: 'Dynamic Programming vs Greedy',
    text: 'What are the main conceptual and structural differences between Dynamic Programming and Greedy algorithms?'
  },
  {
    title: 'Explain Boyer-Moore pattern shifts',
    text: 'How does Boyer-Moore utilize bad character and good suffix tables to perform sub-linear shifts?'
  },
  {
    title: 'Compare Dijkstra vs BFS',
    text: 'What are the main architectural differences, runtimes, and use cases for Dijkstra vs BFS pathfinding?'
  },
  {
    title: 'Explain 0/1 Knapsack',
    text: 'Can you explain the 0/1 Knapsack problem and how dynamic programming optimizes it over the naive recursive approach?'
  },
  {
    title: 'Quick Sort Pivot Choice',
    text: 'How does pivot selection (First, Last, Random, Median-of-Three) affect the performance and complexity of Quick Sort?'
  },
  {
    title: 'Kruskal vs Prim MST',
    text: 'What are the core differences, data structures, and complexities between Kruskal\'s and Prim\'s algorithms for MST?'
  },
  {
    title: 'Explain KMP Search',
    text: 'How does the Knuth-Morris-Pratt (KMP) algorithm use the prefix function table to avoid backtracking in string matching?'
  },
  {
    title: 'Topological Sort & DAGs',
    text: 'What is topological sorting, what properties must a graph satisfy to have one, and how is it implemented using DFS?'
  },
  {
    title: 'Explain Amortized Analysis',
    text: 'What is amortized time complexity, and how does it differ from average-case complexity? Please use dynamic arrays as an example.'
  }
];

export default function AIChat() {
  const [messages, setMessages] = useState([
    {
      role: 'model',
      content: '### 🎓 Welcome to the AI Study Companion!\n\nI am your **DAA Professor AI**. I can help you understand algorithm design concepts, analyze complexity parameters, and compare different DAA paradigms.\n\nWhat concept or algorithm are we studying today?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);

  useEffect(() => {
    if (messages.length === 1) {
      const shuffled = [...ALL_SUGGESTED_PROMPTS].sort(() => 0.5 - Math.random());
      setSuggestedPrompts(shuffled.slice(0, 4));
    }
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (messageText = inputMessage) => {
    if (!messageText.trim() || isLoading) return;

    const userMsg = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const history = messages.slice(1).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const res = await api.chatWithAI(
        messageText,
        history,
        null,
        []
      );

      const aiMsg = { role: 'model', content: res.response };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          content: `### ⚠️ Connection Error\n\nFailed to receive response from backend: ${err.message}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptClick = (text) => {
    handleSend(text);
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to reset the conversation history?")) {
      setMessages([
        {
          role: 'model',
          content: '### 🎓 Conversation Reset\n\nI am ready for a new DAA topic! What would you like to explore now?'
        }
      ]);
    }
  };

  return (
    <div className="page-transition space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">AI Study Companion</h1>
        <p className="text-[var(--text-secondary)] text-sm font-semibold">Talk to DAA Professor AI and clarify algorithmic concepts</p>
      </div>

      <div className="flex flex-col justify-between glass-card-no-hover rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] h-[650px] p-5">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3.5 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[var(--neon-violet)]" />
            <span className="font-bold text-sm text-[var(--text-primary)]">DAA Chat Session</span>
          </div>
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-rose-950/20 dark:border-rose-900/30 text-rose-500 hover:bg-rose-500/10 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Chat
          </button>
        </div>

        {/* Scrollable Conversation area */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin">
          {messages.map((msg, index) => {
            const isAI = msg.role === 'model';
            return (
              <div key={index} className={`flex items-start gap-3.5 ${isAI ? 'justify-start' : 'justify-end'}`}>
                {isAI && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-950/40 border border-indigo-900/40 flex items-center justify-center shrink-0">
                    <Brain className="w-4 h-4 text-[var(--neon-violet)]" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] md:text-sm leading-relaxed shadow-2xs ${
                    isAI
                      ? 'bg-slate-800/10 border border-[var(--glass-border)] text-[var(--text-secondary)] prose prose-sm'
                      : 'bg-indigo-600/15 border border-indigo-500/25 text-[var(--text-primary)] font-medium'
                  }`}
                >
                  {isAI ? (
                    <div dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(msg.content) }} />
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-3.5 justify-start">
              <div className="w-8 h-8 rounded-lg bg-indigo-950/40 border border-indigo-900/40 flex items-center justify-center shrink-0">
                <Brain className="w-4 h-4 text-[var(--neon-violet)] animate-pulse" />
              </div>
              <div className="bg-slate-800/10 border border-[var(--glass-border)] rounded-2xl px-4 py-3 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-[var(--sidebar-active-text)] animate-spin" />
                <span className="text-xs text-[var(--text-secondary)] font-bold font-mono">Advisor is analyzing DAA concept...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Prompts Panel */}
        {messages.length === 1 && !isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 mt-4">
            {suggestedPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handlePromptClick(prompt.text)}
                className="text-left p-3.5 rounded-xl bg-slate-900/40 hover:bg-slate-800/40 border border-[var(--glass-border)] hover:border-indigo-500/30 transition-all cursor-pointer group space-y-1"
              >
                <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--sidebar-active-text)] flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-[var(--neon-cyan)]" /> {prompt.title}
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1">{prompt.text}</p>
              </button>
            ))}
          </div>
        )}

        {/* Input field box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 border-t border-[var(--glass-border)] pt-4 mt-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading}
            placeholder="Ask about dynamic programming, complexities, recurrence relations, or DAA paradigms..."
            className="flex-1 bg-slate-900/60 border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
