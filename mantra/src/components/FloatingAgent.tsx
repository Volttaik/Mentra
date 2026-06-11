"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Sparkles, X, ArrowUp, BarChart2, Zap, MessageSquare,
  ChevronRight, Maximize2, EyeOff, Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VerbThinkingIndicator, renderMessage } from "@/components/chat/ChatPrimitives";

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

type MenuMode = "actions" | "hide" | null;

export default function FloatingAgent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const [open, setOpen] = useState(false);
  const [menuMode, setMenuMode] = useState<MenuMode>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [agentName, setAgentName] = useState("Mia");
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const didLongPress = useRef(false);
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
    setMenuMode(null);
    localStorage.setItem("mentra-agent-hidden", "true");
  };

  const show = () => {
    setVisible(true);
    localStorage.removeItem("mentra-agent-hidden");
  };

  const sendMessage = useCallback(async (msg?: string) => {
    const text = (msg ?? input).trim();
    if (!text || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
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
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setMenuMode("hide");
    }, 500);
  };

  const handleEndPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!didLongPress.current) {
      setMenuMode(m => m === "actions" ? null : "actions");
      setOpen(false);
    }
  };

  const quickActions = [
    { label: "Open Chat", icon: MessageSquare, onClick: () => { setOpen(true); setMenuMode(null); } },
    { label: "Full Chat", icon: Maximize2, onClick: () => { router.push("/agent"); setMenuMode(null); } },
    { label: "My Stats", icon: BarChart2, onClick: () => { setOpen(true); setMenuMode(null); setTimeout(() => sendMessage("Show me my stats"), 100); } },
    { label: "My Flows", icon: Zap, onClick: () => { setOpen(true); setMenuMode(null); setTimeout(() => sendMessage("List my Stack Flows"), 100); } },
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
      {/* Floating chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16, x: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16, x: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-4 z-50 bg-background border border-outline-variant/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden w-80 h-[400px]"
          >
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

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
              {messages.length === 0 && (
                <div className="flex gap-2 items-start">
                  <div className="w-6 h-6 rounded-full bg-secondary-container/60 flex items-center justify-center shrink-0 mt-0.5 border border-outline-variant/15">
                    <Sparkles className="w-3 h-3 text-secondary" />
                  </div>
                  <div className="bg-surface-container rounded-2xl rounded-tl-sm px-3 py-2 max-w-[85%] border border-outline-variant/10">
                    <p className="text-[12.5px] leading-relaxed text-on-surface">Hi! I&apos;m {agentName}, your personal AI on Mentra. Ask me anything about your stacks, stats, or communities.</p>
                  </div>
                </div>
              )}
              {messages.map((msg, i) => {
                const isAgent = msg.role === "agent";
                return (
                  <div key={i} className={cn("flex gap-2 items-start group", isAgent ? "flex-row" : "flex-row-reverse")}>
                    {isAgent && (
                      <div className="w-6 h-6 rounded-full bg-secondary-container/60 flex items-center justify-center shrink-0 mt-0.5 border border-outline-variant/15">
                        <Sparkles className="w-3 h-3 text-secondary" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2",
                      isAgent
                        ? "bg-surface-container border border-outline-variant/10 text-on-surface rounded-tl-sm"
                        : "bg-secondary text-on-secondary rounded-br-sm"
                    )}>
                      {isAgent ? renderMessage(msg.content) : <p className="text-[12.5px] leading-relaxed">{msg.content}</p>}
                      {isAgent && msg.data && <StatCard data={msg.data} />}
                    </div>
                  </div>
                );
              })}
              <AnimatePresence>
                {loading && (
                  <VerbThinkingIndicator
                    verbs={["Thinking", "Reading your stacks", "Searching Mentra", "Processing"]}
                    agentIcon={<Sparkles className="w-3 h-3 text-secondary" />}
                  />
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            <div className="px-3 py-2.5 border-t border-outline-variant/10 shrink-0">
              <div className={cn(
                "flex items-center gap-2 rounded-xl border bg-surface-container-lowest px-3 py-2 transition-all",
                input.trim() ? "border-secondary/30" : "border-outline-variant/15"
              )}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder={`Message ${agentName}…`}
                  className="flex-1 bg-transparent text-[12.5px] text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none"
                />
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                    input.trim() && !loading ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant/30"
                  )}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions menu (single click) */}
      <AnimatePresence>
        {menuMode === "actions" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            className="fixed bottom-36 right-4 z-[60] bg-background border border-outline-variant/20 rounded-2xl shadow-xl overflow-hidden min-w-[180px]"
          >
            {quickActions.map(({ label, icon: Icon, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="w-full flex items-center gap-3 text-left px-4 py-3 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors border-b border-outline-variant/10 last:border-0"
              >
                <Icon className="w-4 h-4 text-secondary shrink-0" />
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hide menu (long press) */}
      <AnimatePresence>
        {menuMode === "hide" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            className="fixed bottom-36 right-4 z-[60] bg-background border border-outline-variant/20 rounded-2xl shadow-xl overflow-hidden min-w-[180px]"
          >
            <button
              onClick={() => { router.push("/credits"); setMenuMode(null); }}
              className="w-full flex items-center gap-3 text-left px-4 py-3 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors border-b border-outline-variant/10"
            >
              <Coins className="w-4 h-4 text-secondary shrink-0" />
              Buy Credits
            </button>
            <button
              onClick={hide}
              className="w-full flex items-center gap-3 text-left px-4 py-3 text-sm font-medium text-error hover:bg-error-container/20 transition-colors"
            >
              <EyeOff className="w-4 h-4 shrink-0" />
              Hide agent
            </button>
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
          menuMode ? "bg-primary text-on-primary" : "bg-secondary text-on-secondary hover:scale-105"
        )}
        whileTap={{ scale: 0.94 }}
        animate={{ rotate: menuMode ? 45 : 0 }}
      >
        <Sparkles className="w-4 h-4" />
      </motion.button>

      {/* Backdrop */}
      {(menuMode || open) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setMenuMode(null); }}
        />
      )}
    </>
  );
}
