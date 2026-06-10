"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Sparkles, X, Send, BarChart2, Zap, MessageSquare,
  ChevronRight, Loader2, Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message { role: "user" | "agent"; content: string; data?: any; }

function StatCard({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {[
        { label: "Stacks", value: data.stackCount },
        { label: "Stars", value: data.totalStars },
        { label: "Views", value: data.totalViews },
        { label: "Credits", value: data.aiCredits },
      ].map(({ label, value }) => (
        <div key={label} className="bg-surface-container rounded-xl p-2.5 text-center">
          <p className="text-lg font-bold text-primary font-manrope">{value ?? 0}</p>
          <p className="text-[10px] text-on-surface-variant">{label}</p>
        </div>
      ))}
    </div>
  );
}

export default function FloatingAgent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const [open, setOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [agentName, setAgentName] = useState("Mia");
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    const hidden = localStorage.getItem("mentra-agent-hidden");
    if (hidden === "true") setVisible(false);
    fetch("/api/agent").then(r => r.json()).then(d => setAgentName(d.name ?? "Mia")).catch(() => {});
  }, [status]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const hide = () => {
    setVisible(false);
    setOpen(false);
    setShowMenu(false);
    localStorage.setItem("mentra-agent-hidden", "true");
  };

  const show = () => {
    setVisible(true);
    localStorage.removeItem("mentra-agent-hidden");
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setAgentName(data.agentName ?? agentName);
      setMessages(prev => [...prev, { role: "agent", content: data.reply ?? "Sorry, I couldn't process that.", data: data.data }]);
    } catch {
      setMessages(prev => [...prev, { role: "agent", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, agentName]);

  const handleStartPress = () => {
    longPressTimer.current = setTimeout(() => setShowMenu(true), 500);
  };

  const handleEndPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!showMenu) setOpen(o => !o);
  };

  const quickActions = [
    { label: "My Stats", message: "Show me my stats", icon: BarChart2 },
    { label: "My Flows", message: "List my Stack Flows", icon: Zap },
    { label: "My Communities", message: "What communities am I in?", icon: MessageSquare },
  ];

  if (status !== "authenticated" || !session) return null;

  if (!visible) {
    return (
      <button
        onClick={show}
        className="fixed bottom-24 right-1 z-40 w-5 h-10 bg-secondary/20 border border-secondary/30 rounded-l-full flex items-center justify-center text-secondary hover:bg-secondary/30 transition-all"
        title="Show AI Agent"
      >
        <ChevronRight className="w-3 h-3" />
      </button>
    );
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16, x: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16, x: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-4 z-50 bg-background border border-outline-variant/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden w-80 h-[400px]"
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-outline-variant/10 bg-surface-container-low shrink-0">
              <div className="w-7 h-7 bg-secondary-container rounded-lg flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-on-secondary-container" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-manrope font-semibold text-sm text-primary">{agentName}</p>
                <p className="text-[10px] text-on-surface-variant">Your personal AI agent</p>
              </div>
              <button
                onClick={() => { setOpen(false); router.push("/agent"); }}
                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
                title="Open full chat"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <div className="bg-secondary-container/20 rounded-2xl rounded-tl-sm p-3 max-w-[85%]">
                    <p className="text-sm text-on-surface">Hi! I&apos;m {agentName}, your personal AI on Mentra. I can help you manage your stacks, view stats, explore communities, and more.</p>
                  </div>
                  <p className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold mt-4 mb-2">Quick actions</p>
                  <div className="flex flex-col gap-1.5">
                    {quickActions.map(({ label, message, icon: Icon }) => (
                      <button
                        key={label}
                        onClick={() => { setInput(message); }}
                        className="flex items-center gap-2 px-3 py-2 bg-surface-container rounded-xl text-xs font-medium text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all text-left"
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" /> {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2.5 text-sm",
                    msg.role === "user"
                      ? "bg-secondary text-on-secondary rounded-br-sm"
                      : "bg-surface-container text-on-surface rounded-bl-sm"
                  )}>
                    <p className="leading-relaxed">{msg.content}</p>
                    {msg.role === "agent" && msg.data && <StatCard data={msg.data} />}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-surface-container rounded-2xl rounded-bl-sm px-3 py-2.5 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 text-secondary animate-spin" />
                    <span className="text-xs text-on-surface-variant">Thinking…</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-outline-variant/10 shrink-0">
              <div className="flex items-center gap-2 bg-surface-container rounded-xl px-3 py-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder={`Message ${agentName}…`}
                  className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="p-1.5 bg-secondary text-on-secondary rounded-lg disabled:opacity-40 transition-all hover:opacity-90"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Long-press menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-20 right-4 z-50 bg-background border border-outline-variant/20 rounded-2xl shadow-xl overflow-hidden min-w-[180px]"
          >
            {[
              { label: "Chat", onClick: () => { setOpen(true); setShowMenu(false); } },
              { label: "Full Chat", onClick: () => { router.push("/agent"); setShowMenu(false); } },
              { label: "My Stats", onClick: () => { setInput("Show me my stats"); setOpen(true); setShowMenu(false); } },
              { label: "Hide agent", onClick: () => { hide(); setShowMenu(false); }, danger: true },
            ].map(({ label, onClick, danger }) => (
              <button
                key={label}
                onClick={onClick}
                className={cn(
                  "w-full text-left px-4 py-3 text-sm font-medium transition-colors border-b border-outline-variant/10 last:border-0",
                  danger ? "text-error hover:bg-error-container/20" : "text-on-surface hover:bg-surface-container"
                )}
              >
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        onMouseDown={handleStartPress}
        onMouseUp={handleEndPress}
        onMouseLeave={() => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } }}
        onTouchStart={handleStartPress}
        onTouchEnd={handleEndPress}
        className={cn(
          "fixed bottom-24 right-5 z-50 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all select-none",
          open ? "bg-primary text-on-primary" : "bg-secondary text-on-secondary hover:scale-105"
        )}
        whileTap={{ scale: 0.94 }}
        animate={{ rotate: open ? 45 : 0 }}
      >
        <Sparkles className="w-4 h-4" />
      </motion.button>

      {/* Backdrop for long-press menu */}
      {showMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
      )}
    </>
  );
}
