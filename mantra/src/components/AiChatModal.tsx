"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Bot, Zap, ArrowUp,
  AlertCircle, BookOpen, Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VerbThinkingIndicator, CopyBtn, renderMessage } from "@/components/chat/ChatPrimitives";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface StackInfo {
  title: string;
  slug: string;
  courseCode?: string;
  description?: string;
}

interface Props {
  stack: StackInfo;
  credits: number;
  onClose: () => void;
  onBuyCredits: () => void;
  onCreditsUpdate: (n: number) => void;
}

const SUGGESTIONS = [
  "What is this stack about?",
  "Summarise the key concepts",
  "What are the main topics covered?",
  "Give me a study plan for this material",
];

export default function AiChatModal({ stack, credits: initialCredits, onClose, onBuyCredits, onCreditsUpdate }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [credits, setCredits] = useState(initialCredits);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = useCallback(async (content: string) => {
    const text = content.trim();
    if (!text || isThinking) return;
    if (credits <= 0) { onBuyCredits(); return; }

    setError(null);
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsThinking(true);

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`/api/stacks/${stack.slug}/ai-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          setError("insufficient_credits");
        } else {
          setError(data.error ?? "Something went wrong. Please try again.");
        }
        return;
      }

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      const newCredits = data.creditsRemaining ?? credits - 1;
      setCredits(newCredits);
      onCreditsUpdate(newCredits);
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setIsThinking(false);
    }
  }, [messages, isThinking, credits, stack.slug, onBuyCredits, onCreditsUpdate]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(input); }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  };

  const canSend = !!input.trim() && !isThinking && credits > 0;
  const stackAiIcon = <Bot className="w-3.5 h-3.5 text-secondary" />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, x: 40, scale: 0.98 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 40, scale: 0.98 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="ml-auto h-full w-full max-w-[560px] flex flex-col bg-background border-l border-outline-variant/20 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-outline-variant/10 bg-surface-container-low shrink-0">
          <div className="w-8 h-8 rounded-xl bg-secondary-container flex items-center justify-center shrink-0 relative">
            <Bot className="w-4 h-4 text-on-secondary-container" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-manrope font-semibold text-sm text-primary truncate">AI — {stack.title}</p>
            {stack.courseCode && (
              <p className="text-[11px] text-on-surface-variant">{stack.courseCode}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onBuyCredits}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all"
            >
              <Coins className="w-3 h-3" />
              <span>{credits} credit{credits !== 1 ? "s" : ""}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1" style={{
          background: "linear-gradient(to bottom, transparent, rgba(var(--secondary-container-rgb, 200,200,200), 0.04))"
        }}>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-col items-center justify-center h-full text-center pt-8 pb-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-secondary-container/40 border border-secondary/20 flex items-center justify-center mb-5">
                <BookOpen className="w-8 h-8 text-secondary/70" />
              </div>
              <h3 className="font-manrope font-semibold text-base text-primary mb-2">Ask anything about this stack</h3>
              <p className="text-sm text-on-surface-variant max-w-xs leading-relaxed mb-8">
                Get explanations, summaries, key points, and study help — all based on the stack content.
              </p>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                {SUGGESTIONS.map((s) => (
                  <motion.button
                    key={s}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSend(s)}
                    className="text-left px-4 py-2.5 rounded-xl bg-surface-container border border-outline-variant/20 text-sm text-on-surface-variant hover:text-primary hover:bg-surface-container-high hover:border-secondary/30 transition-all"
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className={cn("flex gap-2.5 group", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-secondary-container/60 border border-outline-variant/20 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-secondary" />
                  </div>
                )}
                <div className={cn("max-w-[82%] space-y-1", msg.role === "user" ? "items-end flex flex-col" : "")}>
                  <div className={cn(
                    "px-4 py-2.5 rounded-2xl text-on-surface",
                    msg.role === "user"
                      ? "bg-primary text-on-primary rounded-tr-sm"
                      : "bg-surface-container border border-outline-variant/15 rounded-tl-sm"
                  )}>
                    {msg.role === "user"
                      ? <p className="text-[13px] leading-relaxed">{msg.content}</p>
                      : renderMessage(msg.content)
                    }
                  </div>
                  <div className={cn("flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150", msg.role === "user" ? "justify-end" : "justify-start")}>
                    <span className="text-[10px] text-on-surface-variant/30">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {msg.role === "assistant" && <CopyBtn text={msg.content} />}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {isThinking && (
              <VerbThinkingIndicator
                agentIcon={stackAiIcon}
                verbs={["Thinking", "Reading stack content", "Searching knowledge", "Preparing answer"]}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-error-container/20 border border-error/20 mx-2"
              >
                <AlertCircle className="w-4 h-4 text-error shrink-0" />
                {error === "insufficient_credits" ? (
                  <div className="flex-1">
                    <p className="text-sm text-error font-medium">Out of credits</p>
                    <button onClick={onBuyCredits} className="text-xs text-secondary hover:underline mt-0.5">Purchase more credits</button>
                  </div>
                ) : (
                  <p className="text-sm text-error flex-1">{error}</p>
                )}
                <button onClick={() => setError(null)} className="text-on-surface-variant/50 hover:text-primary">
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-4 border-t border-outline-variant/10 bg-surface-container-low shrink-0">
          {credits === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-3 px-3 py-2 rounded-xl bg-secondary-container/30 border border-secondary/20"
            >
              <p className="text-xs text-on-surface-variant">You&apos;re out of credits</p>
              <button
                onClick={onBuyCredits}
                className="flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-primary transition-colors"
              >
                <Zap className="w-3 h-3" />Buy credits
              </button>
            </motion.div>
          )}
          <div className={cn(
            "rounded-2xl border bg-surface-container-lowest transition-all duration-200",
            canSend
              ? "border-secondary/30 shadow-sm"
              : "border-outline-variant/20"
          )}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => { setInput(e.target.value); handleInput(); }}
              onKeyDown={handleKeyDown}
              placeholder={credits === 0 ? "Purchase credits to continue…" : "Ask about this stack…"}
              disabled={isThinking || credits === 0}
              rows={1}
              className="w-full px-4 pt-3 pb-1 text-[13px] bg-transparent resize-none focus:outline-none placeholder:text-on-surface-variant/40 disabled:opacity-40 min-h-[44px] max-h-[140px] leading-relaxed text-on-surface"
            />
            <div className="flex items-center justify-between px-3 pb-3 pt-1">
              <p className="text-[10px] text-on-surface-variant/30">
                {credits} credit{credits !== 1 ? "s" : ""} remaining · 1 per message
              </p>
              <AnimatePresence mode="wait">
                <motion.button
                  key={canSend ? "send" : "idle"}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => handleSend(input)}
                  disabled={!canSend}
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200",
                    canSend
                      ? "bg-primary text-on-primary hover:opacity-90 shadow-sm"
                      : "bg-surface-container text-on-surface-variant/30"
                  )}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </motion.button>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
