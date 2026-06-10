"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Send, ArrowLeft, Loader2, Image as ImageIcon,
  BarChart2, Zap, MessageSquare, X, Paperclip,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";

interface Message {
  role: "user" | "agent";
  content: string;
  image?: string;
  data?: any;
}

function StatCard({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      {[
        { label: "Stacks", value: data.stackCount },
        { label: "Stars", value: data.totalStars },
        { label: "Views", value: data.totalViews },
        { label: "Credits", value: data.aiCredits },
      ].map(({ label, value }) => (
        <div key={label} className="bg-background rounded-xl p-3 text-center border border-outline-variant/10">
          <p className="text-xl font-bold text-primary font-manrope">{value ?? 0}</p>
          <p className="text-xs text-on-surface-variant">{label}</p>
        </div>
      ))}
    </div>
  );
}

const QUICK_ACTIONS = [
  { label: "My Stats", message: "Show me my stats", icon: BarChart2 },
  { label: "My Flows", message: "List my Stack Flows", icon: Zap },
  { label: "My Communities", message: "What communities am I in?", icon: MessageSquare },
];

export default function AgentPage() {
  const { status } = useSession();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [agentName, setAgentName] = useState("Mia");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/agent")
      .then(r => r.json())
      .then(d => setAgentName(d.name ?? "Mia"))
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleImageSelect = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = e => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendMessage = useCallback(async () => {
    if ((!input.trim() && !imageFile) || loading) return;
    const msg = input.trim();
    const imgPreview = imagePreview;
    setInput("");
    clearImage();

    setMessages(prev => [...prev, { role: "user", content: msg || "📷 Image sent", image: imgPreview ?? undefined }]);
    setLoading(true);

    try {
      const body: Record<string, string> = { message: msg || "What's in this image?" };
      if (imgPreview) body.image = imgPreview;

      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setAgentName(data.agentName ?? agentName);
      setMessages(prev => [
        ...prev,
        {
          role: "agent",
          content: data.reply ?? "Sorry, I couldn't process that.",
          data: data.data,
        },
      ]);
    } catch {
      setMessages(prev => [...prev, { role: "agent", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, agentName, imageFile, imagePreview]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-secondary animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-4 pb-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-surface-container text-on-surface-variant transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 bg-secondary-container rounded-xl flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-on-secondary-container" />
          </div>
          <div>
            <h1 className="font-manrope font-bold text-base text-primary">{agentName}</h1>
            <p className="text-xs text-on-surface-variant">Your personal AI agent</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center pt-12 pb-6 text-center"
            >
              <div className="w-16 h-16 bg-secondary-container rounded-2xl flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-on-secondary-container" />
              </div>
              <h2 className="font-manrope font-semibold text-xl text-primary mb-2">Hi, I&apos;m {agentName}</h2>
              <p className="text-sm text-on-surface-variant max-w-sm mb-8">
                Your personal AI on Mentra. Ask me about your stacks, communities, stats — or anything else.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_ACTIONS.map(({ label, message, icon: Icon }) => (
                  <button
                    key={label}
                    onClick={() => { setInput(message); inputRef.current?.focus(); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant/10 rounded-full text-sm font-medium text-on-surface-variant hover:text-primary transition-all"
                  >
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                {msg.role === "agent" && (
                  <div className="w-8 h-8 bg-secondary-container rounded-xl flex items-center justify-center shrink-0 mt-1">
                    <Sparkles className="w-3.5 h-3.5 text-on-secondary-container" />
                  </div>
                )}
                <div className={cn("max-w-[75%] space-y-2")}>
                  {msg.image && (
                    <div className={cn("rounded-2xl overflow-hidden", msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm")}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={msg.image} alt="Sent image" className="max-w-full max-h-64 object-contain bg-surface-container" />
                    </div>
                  )}
                  {msg.content && (
                    <div className={cn(
                      "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-secondary text-on-secondary rounded-br-sm"
                        : "bg-surface-container text-on-surface rounded-bl-sm"
                    )}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.role === "agent" && msg.data && <StatCard data={msg.data} />}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 justify-start"
            >
              <div className="w-8 h-8 bg-secondary-container rounded-xl flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-on-secondary-container" />
              </div>
              <div className="bg-surface-container rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-secondary animate-spin" />
                <span className="text-sm text-on-surface-variant">Thinking…</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Image preview */}
        {imagePreview && (
          <div className="mb-2 flex items-start gap-2">
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Preview" className="h-20 w-auto rounded-xl object-cover border border-outline-variant/20" />
              <button
                onClick={clearImage}
                className="absolute -top-2 -right-2 w-5 h-5 bg-error text-on-error rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="bg-surface-container rounded-2xl border border-outline-variant/10 overflow-hidden shadow-sm">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${agentName}…`}
            rows={1}
            className="w-full bg-transparent px-4 pt-3.5 pb-1 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none resize-none max-h-32 overflow-y-auto"
            style={{ minHeight: "44px" }}
          />
          <div className="flex items-center justify-between px-3 pb-3 pt-1">
            <div className="flex items-center gap-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                title="Attach image"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                title="Send image"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleImageSelect(file);
                }}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={(!input.trim() && !imageFile) || loading}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary rounded-xl text-sm font-semibold font-manrope disabled:opacity-40 transition-all hover:opacity-90"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Send
            </button>
          </div>
        </div>
        <p className="text-center text-[11px] text-on-surface-variant/40 mt-2">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
