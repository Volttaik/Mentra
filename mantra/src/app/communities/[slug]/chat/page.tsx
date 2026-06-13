"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, X, BookOpen, ArrowUp, MessageCircle, Loader2,
  ExternalLink, UserPlus2, UserCheck2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import UniversalChat, { UCMessage } from "@/components/chat/UniversalChat";
import ChatPageWrapper from "@/components/chat/ChatPageWrapper";

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  mediaType?: string | null;
  mediaUrl?: string | null;
  voiceDuration?: number | null;
  user: { id: string; name: string; username: string; image: string | null };
}

interface AiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function PulseDot({ delay }: { delay: number }) {
  return (
    <motion.span
      className="block w-[5px] h-[5px] rounded-full bg-secondary/60"
      animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.85, 1.1, 0.85] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

function CommunityChatInner() {
  const { slug } = useParams<{ slug: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const myId = (session?.user as { id?: string })?.id ?? "";

  const [communityName, setCommunityName] = useState("");
  const [memberCount, setMemberCount] = useState(0);
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const chatPollRef = useRef<NodeJS.Timeout | null>(null);

  const [showAi, setShowAi] = useState(false);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiThinking, setAiThinking] = useState(false);
  const [aiCredits, setAiCredits] = useState(0);
  const aiBottomRef = useRef<HTMLDivElement>(null);
  const aiTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [avatarCtx, setAvatarCtx] = useState<{
    user: ChatMessage["user"]; x: number; y: number; isFollowing: boolean | null;
  } | null>(null);

  const loadMessages = useCallback(() => {
    fetch(`/api/communities/${slug}/chat`)
      .then(r => r.json())
      .then(d => { if (!d.error) setMessages(d.messages ?? []); })
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/communities/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (!d.error) {
          setCommunityName(d.name);
          setMemberCount(d._count?.members ?? 0);
          setIsMember(!!d.myRole);
        } else {
          setIsMember(false);
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!isMember) return;
    setChatLoading(true);
    fetch(`/api/communities/${slug}/chat`)
      .then(r => r.json())
      .then(d => { if (!d.error) setMessages(d.messages ?? []); })
      .finally(() => setChatLoading(false));
    chatPollRef.current = setInterval(loadMessages, 3000);
    return () => { if (chatPollRef.current) clearInterval(chatPollRef.current); };
  }, [isMember, slug, loadMessages]);

  useEffect(() => {
    aiBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages, aiThinking]);

  useEffect(() => {
    fetch("/api/credits").then(r => r.json()).then(d => { if (!d.error) setAiCredits(d.credits ?? 0); }).catch(() => {});
  }, []);

  const handleSend = async ({ content, imageUrl, voiceUrl, voiceDuration }: {
    content: string; imageUrl?: string | null; voiceUrl?: string | null; voiceDuration?: number;
  }) => {
    const hasMedia = imageUrl || voiceUrl;
    if (!content.trim() && !hasMedia) return;
    if (sending) return;
    setSending(true);
    try {
      const body: Record<string, unknown> = { content: content.trim() };
      if (imageUrl) { body.mediaType = "image"; body.mediaUrl = imageUrl; }
      if (voiceUrl) { body.mediaType = "voice"; body.mediaUrl = voiceUrl; body.voiceDuration = voiceDuration ?? 0; }
      const res = await fetch(`/api/communities/${slug}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!d.error) setMessages(prev => [...prev, d.message]);
    } finally { setSending(false); }
  };

  const sendAiMessage = async () => {
    const text = aiInput.trim();
    if (!text || aiThinking) return;
    setAiInput("");
    const userMsg: AiMessage = { id: `u-${Date.now()}`, role: "user", content: text };
    setAiMessages(prev => [...prev, userMsg]);
    setAiThinking(true);
    try {
      const history = [...aiMessages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`/api/communities/${slug}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiMessages(prev => [...prev, { id: `e-${Date.now()}`, role: "assistant", content: data.error ?? "Something went wrong." }]);
      } else {
        setAiMessages(prev => [...prev, { id: `a-${Date.now()}`, role: "assistant", content: data.reply }]);
        if (data.creditsRemaining !== undefined) setAiCredits(data.creditsRemaining);
      }
    } finally {
      setAiThinking(false);
    }
  };

  const openAvatarCtx = useCallback((msg: UCMessage, x: number, y: number) => {
    if (!msg.sender) return;
    const user = msg.sender as ChatMessage["user"];
    setAvatarCtx({ user, x, y, isFollowing: null });
    fetch(`/api/users/${user.username}/follow-status`).then(r => r.json()).then(d => {
      setAvatarCtx(prev => prev ? { ...prev, isFollowing: d.isFollowing ?? false } : null);
    }).catch(() => setAvatarCtx(prev => prev ? { ...prev, isFollowing: false } : null));
  }, []);

  const handleAvatarFollow = async () => {
    if (!avatarCtx) return;
    const { user, isFollowing } = avatarCtx;
    setAvatarCtx(prev => prev ? { ...prev, isFollowing: null } : null);
    await fetch(`/api/users/${user.username}/follow`, { method: isFollowing ? "DELETE" : "POST" });
    setAvatarCtx(prev => prev ? { ...prev, isFollowing: !isFollowing } : null);
  };

  const handleAvatarMessage = async () => {
    if (!avatarCtx) return;
    const { user } = avatarCtx;
    setAvatarCtx(null);
    const res = await fetch("/api/dm/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId: user.id }),
    });
    const d = await res.json();
    router.push(`/messages/${d.conversation?.id ?? ""}`);
  };

  if (loading) return (
    <ChatPageWrapper>
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-secondary animate-spin" />
      </div>
    </ChatPageWrapper>
  );

  if (isMember === false) return (
    <ChatPageWrapper>
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <MessageCircle className="w-12 h-12 text-secondary/40" />
        <p className="text-on-surface-variant text-sm">You need to be a member to chat here.</p>
        <button onClick={() => router.push(`/communities/${slug}`)}
          className="px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
          View community
        </button>
      </div>
    </ChatPageWrapper>
  );

  const ucMessages: UCMessage[] = messages.map(m => ({
    id: m.id,
    role: "user" as const,
    content: m.content,
    isMe: m.user.id === myId,
    sender: { id: m.user.id, name: m.user.name, username: m.user.username, image: m.user.image },
    createdAt: m.createdAt,
    mediaType: (m.mediaType as UCMessage["mediaType"]) ?? null,
    mediaUrl: m.mediaUrl ?? null,
    voiceDuration: m.voiceDuration ?? null,
    imageUrl: m.mediaType === "image" ? (m.mediaUrl ?? null) : null,
  }));

  const aiToggle = (
    <button
      onClick={() => setShowAi(v => !v)}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
        showAi
          ? "bg-secondary-container border-secondary/30 text-on-secondary-container"
          : "border-outline-variant/20 text-on-surface-variant hover:bg-surface-container hover:text-primary"
      )}
    >
      <Bot className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">AI</span>
    </button>
  );

  const aiOverlay = showAi ? (
    <>
      <motion.div
        key="ai-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-40 bg-black/20"
        onClick={() => setShowAi(false)}
      />
      <motion.div
        key="ai-panel"
        initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 32 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="fixed right-0 top-0 h-full w-full max-w-[400px] z-[60] flex flex-col bg-background border-l border-outline-variant/20 shadow-2xl"
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-outline-variant/10 bg-surface-container-low shrink-0">
          <div className="w-8 h-8 rounded-xl bg-secondary-container flex items-center justify-center relative shrink-0">
            <Bot className="w-4 h-4 text-on-secondary-container" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-manrope font-semibold text-sm text-primary">AI Assistant</p>
            <p className="text-[11px] text-on-surface-variant">{aiCredits} credits remaining</p>
          </div>
          <button onClick={() => setShowAi(false)} className="p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
          {aiMessages.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center pt-6 pb-4">
              <div className="w-14 h-14 rounded-2xl bg-secondary-container/40 border border-secondary/20 flex items-center justify-center mb-4">
                <BookOpen className="w-7 h-7 text-secondary/70" />
              </div>
              <h3 className="font-manrope font-semibold text-sm text-primary mb-1.5">Ask anything</h3>
              <p className="text-xs text-on-surface-variant max-w-[220px] leading-relaxed mb-6">
                Get help drafting messages, summarising discussions, or brainstorming ideas.
              </p>
              <div className="flex flex-col gap-2 w-full">
                {["Summarise the recent chat", "Suggest a discussion topic", "Help me write an announcement"].map(s => (
                  <button key={s} onClick={() => { setAiInput(s); aiTextareaRef.current?.focus(); }}
                    className="text-left px-3.5 py-2.5 rounded-xl bg-surface-container border border-outline-variant/20 text-xs text-on-surface-variant hover:text-primary hover:bg-surface-container-high hover:border-secondary/30 transition-all">
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          <AnimatePresence initial={false}>
            {aiMessages.map(msg => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                <div className={cn("max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-on-primary rounded-tr-sm"
                    : "bg-surface-container border border-outline-variant/15 text-on-surface rounded-tl-sm")}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {aiThinking && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-surface-container border border-outline-variant/10 w-fit">
              <PulseDot delay={0} />
              <PulseDot delay={0.18} />
              <PulseDot delay={0.36} />
            </motion.div>
          )}
          <div ref={aiBottomRef} />
        </div>

        <div className="px-4 py-4 border-t border-outline-variant/10 bg-surface-container-low shrink-0">
          <div className={cn("rounded-2xl border bg-surface-container-lowest transition-all duration-200",
            aiInput.trim() ? "border-secondary/30 shadow-sm" : "border-outline-variant/20")}>
            <textarea ref={aiTextareaRef} value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAiMessage(); } }}
              placeholder="Ask the AI…" disabled={aiThinking} rows={1}
              className="w-full px-4 pt-3 pb-1 text-[13px] bg-transparent resize-none focus:outline-none placeholder:text-on-surface-variant/40 disabled:opacity-40 min-h-[44px] max-h-[120px] leading-relaxed text-on-surface"
              onInput={e => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 120) + "px"; }}
            />
            <div className="flex items-center justify-end px-3 pb-3 pt-1">
              <motion.button whileTap={{ scale: 0.88 }} onClick={sendAiMessage}
                disabled={!aiInput.trim() || aiThinking}
                className={cn("w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200",
                  aiInput.trim() && !aiThinking
                    ? "bg-primary text-on-primary hover:opacity-90 shadow-sm"
                    : "bg-surface-container text-on-surface-variant/30")}>
                <ArrowUp className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  ) : null;

  const avatarCtxOverlay = avatarCtx ? (
    <>
      <motion.div key="av-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50" onClick={() => setAvatarCtx(null)} />
      <motion.div key="av-menu"
        initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }}
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="fixed z-50 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-2xl overflow-hidden w-52"
        style={{
          left: Math.min(avatarCtx.x, (typeof window !== "undefined" ? window.innerWidth : 400) - 224),
          top: Math.min(avatarCtx.y, (typeof window !== "undefined" ? window.innerHeight : 600) - 180),
        }}>
        <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-outline-variant/10 bg-surface-container/40">
          <div className="w-8 h-8 rounded-full bg-secondary-container overflow-hidden shrink-0 flex items-center justify-center text-[10px] font-bold text-on-secondary-container">
            {avatarCtx.user.image
              ? <img src={avatarCtx.user.image} alt="" className="w-full h-full object-cover" />
              : avatarCtx.user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-on-surface truncate">{avatarCtx.user.name}</p>
            <p className="text-[10px] text-on-surface-variant truncate">@{avatarCtx.user.username}</p>
          </div>
        </div>
        <button onClick={() => { router.push(`/profile/${avatarCtx.user.username}`); setAvatarCtx(null); }}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-surface-container text-sm text-on-surface transition-colors">
          <ExternalLink className="w-3.5 h-3.5 text-on-surface-variant shrink-0" /> View profile
        </button>
        <button onClick={handleAvatarFollow} disabled={avatarCtx.isFollowing === null}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-surface-container text-sm text-on-surface transition-colors disabled:opacity-50">
          {avatarCtx.isFollowing === null
            ? <div className="w-3.5 h-3.5 border border-primary border-t-transparent rounded-full animate-spin shrink-0" />
            : avatarCtx.isFollowing
            ? <UserCheck2 className="w-3.5 h-3.5 text-primary shrink-0" />
            : <UserPlus2 className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />}
          {avatarCtx.isFollowing === null ? "Loading…" : avatarCtx.isFollowing ? "Unfollow" : "Follow"}
        </button>
        <button onClick={handleAvatarMessage}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-surface-container text-sm text-on-surface transition-colors">
          <MessageCircle className="w-3.5 h-3.5 text-on-surface-variant shrink-0" /> Message
        </button>
      </motion.div>
    </>
  ) : null;

  return (
    <ChatPageWrapper onClick={() => setAvatarCtx(null)}>
      <UniversalChat
        mode="community"
        title={communityName}
        subtitle={`${memberCount} members`}
        headerIcon={<MessageCircle className="w-3.5 h-3.5 text-on-secondary-container" />}
        headerRight={aiToggle}
        messages={ucMessages}
        messagesLoading={chatLoading}
        myUserId={myId}
        onSend={handleSend}
        sending={sending}
        enableImages={true}
        enableVoice={true}
        enableMentions={true}
        onMessageCtx={openAvatarCtx}
        emptyIcon={<MessageCircle className="w-7 h-7 text-secondary/50" />}
        emptyTitle="No messages yet"
        emptySubtitle="Be the first to say something!"
        inputPlaceholder="Say something…"
        extraOverlays={
          <>
            <AnimatePresence>{aiOverlay}</AnimatePresence>
            <AnimatePresence>{avatarCtxOverlay}</AnimatePresence>
          </>
        }
      />
    </ChatPageWrapper>
  );
}

export default function CommunityChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-secondary animate-spin" />
      </div>
    }>
      <CommunityChatInner />
    </Suspense>
  );
}
