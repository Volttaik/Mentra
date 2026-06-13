"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUp, Brain, ChevronLeft, PanelLeft, PanelLeftClose,
  Plus, Trash2, BookOpen, Upload, Loader2,
  MessageSquare, X, Paperclip, Sparkles,
  AtSign, Hash, Users, BrainCircuit, Image as ImageIcon,
  Mic, Square, Pause, Play,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { VerbThinkingIndicator, CopyBtn, renderMessage } from "@/components/chat/ChatPrimitives";
import ChatBackground from "@/components/chat/ChatBackground";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  mediaType?: string | null;
  mediaUrl?: string | null;
  voiceDuration?: number | null;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  messages: { content: string; role: string }[];
}

interface Agent {
  id: string;
  name: string;
  subject: string;
  domain: string;
  avatarUrl: string | null;
  knowledgeFiles: { id: string; name: string; size: number }[];
}

type MentionMenuType = "users" | "stacks" | "communities" | "quizzes";
interface MentionResult { id: string; name: string; username: string; image: string | null; }
interface StackResult { id: string; title: string; slug: string; }
interface CommunityResult { id: string; name: string; slug: string; }
interface QuizResult { id: string; title: string; stack: { title: string; slug: string }; }

function AudioPlayer({ url, duration }: { url: string; duration: number | null }) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const total = duration ?? 0;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause(); else audioRef.current.play().catch(() => {});
    setPlaying(!playing);
  };
  const BARS = [20, 35, 55, 40, 65, 30, 50, 70, 45, 35, 60, 40, 25, 55, 45, 65, 30, 50, 35, 45];
  const progress = total > 0 ? currentTime / total : 0;
  return (
    <div className="flex items-center gap-2.5 w-[200px] py-0.5">
      <audio ref={audioRef} src={url}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onEnded={() => { setPlaying(false); setCurrentTime(0); }} />
      <button onClick={toggle}
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors bg-primary/15 hover:bg-primary/25">
        {playing ? <Pause className="w-3.5 h-3.5 text-primary" /> : <Play className="w-3.5 h-3.5 ml-0.5 text-primary" />}
      </button>
      <div className="flex-1 flex items-center gap-px h-8">
        {BARS.map((h, i) => (
          <div key={i} style={{ height: `${h}%` }}
            className={cn("flex-1 rounded-full transition-colors", i / BARS.length < progress ? "bg-primary/70" : "bg-primary/20")} />
        ))}
      </div>
      <span className="text-[10px] text-on-surface-variant/60 tabular-nums shrink-0">{fmt(currentTime)}</span>
    </div>
  );
}

function AgentChatInner() {
  const { status } = useSession();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== "undefined" ? window.innerWidth >= 768 : true);
  const [uploading, setUploading] = useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mention system
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionMenuType, setMentionMenuType] = useState<MentionMenuType>("stacks");
  const [mentionMenuResults, setMentionMenuResults] = useState<(MentionResult | StackResult | CommunityResult | QuizResult)[]>([]);
  const [mentionMenuQuery, setMentionMenuQuery] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<MentionResult[]>([]);

  // Image upload
  const [uploadingImage, setUploadingImage] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Voice recording
  const [recording, setRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingDurationRef = useRef(0);

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);

  useEffect(() => {
    if (!id || status !== "authenticated") return;
    fetch(`/api/custom-agents/${id}`).then(r => r.json()).then(setAgent);
    fetch(`/api/custom-agents/${id}/conversations`).then(r => r.json()).then(data => setConversations(Array.isArray(data) ? data : []));
  }, [id, status]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  // Mention autocomplete (@ key)
  useEffect(() => {
    if (mentionQuery === null) { setMentionResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/dm/search?q=${encodeURIComponent(mentionQuery)}`)
        .then(r => r.json()).then(d => setMentionResults(d.users ?? [])).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [mentionQuery]);

  // Mention picker search
  useEffect(() => {
    if (!showMentionMenu) return;
    const endpoint = `/api/dm/search?type=${mentionMenuType}&q=${encodeURIComponent(mentionMenuQuery)}`;
    fetch(endpoint).then(r => r.json()).then(d => {
      if (mentionMenuType === "users") setMentionMenuResults(d.users ?? []);
      else if (mentionMenuType === "stacks") setMentionMenuResults(d.stacks ?? []);
      else if (mentionMenuType === "communities") setMentionMenuResults(d.communities ?? []);
      else setMentionMenuResults(d.quizzes ?? []);
    }).catch(() => {});
  }, [showMentionMenu, mentionMenuType, mentionMenuQuery]);

  const handleInputChange = (val: string) => {
    setInput(val);
    const atMatch = val.match(/@(\w*)$/);
    if (atMatch) setMentionQuery(atMatch[1]);
    else setMentionQuery(null);
  };

  const insertMention = (username: string) => {
    const newInput = input.replace(/@\w*$/, `@${username} `);
    setInput(newInput);
    setMentionQuery(null);
    textareaRef.current?.focus();
  };

  const insertMentionItem = (item: MentionResult | StackResult | CommunityResult | QuizResult) => {
    let tag = "";
    if ("username" in item) {
      tag = `@${(item as MentionResult).username}`;
    } else if ("slug" in item && "title" in item && !("name" in item)) {
      tag = `[[stack:${(item as StackResult).slug}|${(item as StackResult).title}]]`;
    } else if ("slug" in item && "name" in item) {
      tag = `[[community:${(item as CommunityResult).slug}|${(item as CommunityResult).name}]]`;
    } else {
      const q = item as QuizResult;
      tag = `[[quiz:${q.id}|${q.title}]]`;
    }
    setInput(prev => (prev.trim() ? prev + " " + tag + " " : tag + " "));
    setShowMentionMenu(false);
    textareaRef.current?.focus();
  };

  const loadConversation = useCallback(async (convId: string) => {
    setLoadingMsgs(true);
    setActiveConvId(convId);
    const data = await fetch(`/api/custom-agents/${id}/conversations/${convId}`).then(r => r.json());
    setMessages(data.messages || []);
    setLoadingMsgs(false);
  }, [id]);

  const newConversation = async () => {
    const data = await fetch(`/api/custom-agents/${id}/conversations`, { method: "POST" }).then(r => r.json());
    setConversations(prev => [data, ...prev]);
    setActiveConvId(data.id);
    setMessages([]);
  };

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/custom-agents/${id}/conversations/${convId}`, { method: "DELETE" });
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConvId === convId) { setActiveConvId(null); setMessages([]); }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    const tempMsg: Message = { id: "tmp-" + Date.now(), role: "user", content: text, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    setSending(true);
    try {
      const res = await fetch(`/api/custom-agents/${id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId: activeConvId }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed"); return; }
      if (data.conversationId && data.conversationId !== activeConvId) {
        setActiveConvId(data.conversationId);
        setConversations(prev => {
          const exists = prev.find(c => c.id === data.conversationId);
          if (!exists) return [{ id: data.conversationId, title: text.slice(0, 60), updatedAt: new Date().toISOString(), messages: [] }, ...prev];
          return prev;
        });
      }
      const assistantMsg: Message = { id: data.messageId, role: "assistant", content: data.reply, createdAt: new Date().toISOString() };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setSending(false);
    }
  };

  const uploadKnowledgeFile = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    await fetch(`/api/custom-agents/${id}/files`, { method: "POST", body: fd });
    const updated = await fetch(`/api/custom-agents/${id}`).then(r => r.json());
    setAgent(updated);
    setUploading(false);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setShowPlusMenu(false);
    setUploadingImage(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form }).then(r => r.json());
      if (res.url) {
        const tempMsg: Message = { id: "tmp-img-" + Date.now(), role: "user", content: "", mediaType: "image", mediaUrl: res.url, createdAt: new Date().toISOString() };
        setMessages(prev => [...prev, tempMsg]);
      }
    } catch { /* ignore */ }
    setUploadingImage(false);
  };

  const startRecording = async () => {
    setShowPlusMenu(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
        ? "audio/ogg;codecs=opus"
        : "audio/mp4";
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (ev) => { if (ev.data.size > 0) audioChunksRef.current.push(ev.data); };
      mr.start(100);
      setRecording(true);
      recordingDurationRef.current = 0;
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        recordingDurationRef.current += 1;
        setRecordingDuration(recordingDurationRef.current);
      }, 1000);
    } catch {
      alert("Could not access microphone. Please allow microphone access.");
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;
    clearInterval(recordingTimerRef.current!);
    const duration = recordingDurationRef.current;
    const mr = mediaRecorderRef.current;
    mr.onstop = async () => {
      mr.stream.getTracks().forEach(t => t.stop());
      setRecording(false);
      if (duration < 1) { setRecordingDuration(0); return; }
      setUploadingVoice(true);
      const mimeType = mr.mimeType || "audio/webm";
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      const ext = mimeType.includes("ogg") ? "ogg" : mimeType.includes("mp4") ? "m4a" : "webm";
      const form = new FormData();
      form.append("file", new File([blob], `voice_${Date.now()}.${ext}`, { type: mimeType }));
      try {
        const res = await fetch("/api/upload", { method: "POST", body: form }).then(r => r.json());
        if (res.url) {
          const tempMsg: Message = { id: "tmp-voice-" + Date.now(), role: "user", content: "", mediaType: "voice", mediaUrl: res.url, voiceDuration: duration, createdAt: new Date().toISOString() };
          setMessages(prev => [...prev, tempMsg]);
        }
      } catch { /* ignore */ }
      setUploadingVoice(false);
      setRecordingDuration(0);
    };
    mr.stop();
  };

  const cancelRecording = () => {
    clearInterval(recordingTimerRef.current!);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    setRecordingDuration(0);
  };

  const fmtDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (!agent) return (
    <div className="min-h-screen app-ambient-bg flex items-center justify-center">
      <Navbar />
      <Loader2 className="h-8 w-8 animate-spin text-secondary" />
    </div>
  );

  const QUICK_PROMPTS = [
    { label: "My Stacks", msg: "Show me my stacks", icon: BookOpen },
    { label: "My Articles", msg: "What articles have I written?", icon: MessageSquare },
    { label: "Research Task", msg: "Help me research a topic from Mentra stacks", icon: Sparkles },
  ];

  const agentIcon = <Brain className="w-3.5 h-3.5 text-secondary" />;

  return (
    <div
      className="min-h-screen app-ambient-bg flex flex-col"
      onClick={() => { setShowPlusMenu(false); setShowMentionMenu(false); }}
    >
      <Navbar />
      <div
        className="flex flex-1 overflow-hidden"
        style={{ position: "fixed", top: "64px", left: 0, right: 0, bottom: 0 }}
      >

        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 bg-black/40 z-10" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="h-full bg-surface-container-low border-r border-outline-variant/20 flex flex-col overflow-hidden shrink-0 md:relative fixed left-0 top-0 bottom-0 z-20"
              style={{ width: 260 }}
            >
              <div className="p-4 border-b border-outline-variant/10">
                <Link href="/agents" className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors mb-4 text-xs">
                  <ChevronLeft className="h-3.5 w-3.5" /> All Agents
                </Link>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary-container to-primary-container flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-secondary font-manrope">{agent.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-on-surface font-manrope truncate">{agent.name}</p>
                    <p className="text-[11px] text-on-surface-variant truncate">{agent.subject}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
                <button onClick={newConversation} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary-container/30 hover:bg-secondary-container/50 text-xs font-medium text-on-surface transition-colors mb-2">
                  <Plus className="h-3.5 w-3.5" /> New Chat
                </button>
                {conversations.map(conv => (
                  <div key={conv.id} onClick={() => loadConversation(conv.id)}
                    className={cn("group flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer transition-colors text-xs", activeConvId === conv.id ? "bg-secondary-container/40 text-on-surface" : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface")}>
                    <MessageSquare className="h-3 w-3 shrink-0" />
                    <span className="flex-1 truncate">{conv.title}</span>
                    <button onClick={e => deleteConversation(conv.id, e)} className="opacity-0 group-hover:opacity-100 hover:text-error transition-all">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-3 border-t border-outline-variant/10">
                <button onClick={() => setKnowledgeOpen(true)} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-surface-container-high text-xs text-on-surface-variant hover:text-on-surface transition-colors">
                  <BookOpen className="h-3.5 w-3.5" />
                  Knowledge Files ({agent.knowledgeFiles.length})
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <ChatBackground />
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant/10 bg-surface-container-low/80 backdrop-blur-sm shrink-0 relative z-10">
            <button onClick={() => setSidebarOpen(v => !v)} className="text-on-surface-variant hover:text-on-surface transition-colors">
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </button>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-secondary-container to-primary-container flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-secondary font-manrope">{agent.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold font-manrope text-on-surface text-sm truncate">{agent.name}</h2>
              <p className="text-[10px] text-on-surface-variant truncate">{agent.subject}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 relative z-0">
            {loadingMsgs ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-secondary" />
              </div>
            ) : !activeConvId && messages.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full gap-5 px-4">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary-container to-primary-container flex items-center justify-center mx-auto mb-3">
                    <Brain className="h-7 w-7 text-secondary" />
                  </div>
                  <h3 className="font-bold font-manrope text-on-surface text-base mb-1">Chat with {agent.name}</h3>
                  <p className="text-[12.5px] text-on-surface-variant max-w-xs">I have full access to your stacks, articles, and knowledge base. Ask me anything.</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {QUICK_PROMPTS.map(p => (
                    <button key={p.label} onClick={() => { setInput(p.msg); textareaRef.current?.focus(); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl elevated-surface text-[12px] text-on-surface-variant hover:text-on-surface transition-colors border border-outline-variant/20">
                      <p.icon className="h-3.5 w-3.5" /> {p.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <>
                <AnimatePresence initial={false}>
                  {messages.map(msg => {
                    const isUser = msg.role === "user";
                    return (
                      <motion.div key={msg.id}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className={cn("flex gap-2.5 group", isUser ? "flex-row-reverse" : "flex-row")}
                      >
                        {!isUser && (
                          <div className="w-7 h-7 rounded-full bg-secondary-container/60 border border-outline-variant/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Brain className="h-3.5 w-3.5 text-secondary" />
                          </div>
                        )}
                        <div className={cn("max-w-[80%] space-y-1", isUser ? "items-end flex flex-col" : "")}>
                          {msg.mediaType === "image" && msg.mediaUrl ? (
                            <button onClick={() => setLightboxUrl(msg.mediaUrl!)}
                              className="rounded-2xl overflow-hidden max-w-[220px] hover:opacity-90 transition-opacity">
                              <img src={msg.mediaUrl} alt="Photo" className="w-full h-auto object-cover max-h-64" />
                            </button>
                          ) : msg.mediaType === "voice" && msg.mediaUrl ? (
                            <div className={cn("px-3.5 py-2.5 rounded-2xl", isUser ? "bg-primary text-on-primary rounded-tr-sm" : "bg-surface-container border border-outline-variant/15 text-on-surface rounded-tl-sm")}>
                              <AudioPlayer url={msg.mediaUrl} duration={msg.voiceDuration ?? null} />
                            </div>
                          ) : (
                            <div className={cn(
                              "px-3.5 py-2.5 rounded-2xl",
                              isUser
                                ? "bg-primary text-on-primary rounded-tr-sm"
                                : "bg-surface-container border border-outline-variant/15 text-on-surface rounded-tl-sm"
                            )}>
                              {isUser
                                ? <p className="text-[12.5px] leading-relaxed">{msg.content}</p>
                                : renderMessage(msg.content)
                              }
                            </div>
                          )}
                          <div className={cn("flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150", isUser ? "justify-end" : "justify-start")}>
                            <span className="text-[10px] text-on-surface-variant/30">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {!isUser && <CopyBtn text={msg.content} />}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <AnimatePresence>
                  {sending && <VerbThinkingIndicator agentIcon={agentIcon} />}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Voice recording overlay */}
          <AnimatePresence>
            {(recording || uploadingVoice) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-0 left-0 right-0 z-50 bg-surface-container-lowest/98 backdrop-blur-md border-t border-outline-variant/20 px-4 py-4"
                onClick={e => e.stopPropagation()}
              >
                {uploadingVoice ? (
                  <div className="flex items-center justify-center gap-3 py-2">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <span className="text-sm text-on-surface-variant">Sending voice note…</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <button onClick={cancelRecording} className="w-10 h-10 rounded-full bg-error-container/30 flex items-center justify-center text-error hover:bg-error-container/50 transition-colors shrink-0">
                      <X className="w-5 h-5" />
                    </button>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-error animate-pulse shrink-0" />
                      <span className="text-sm font-medium text-error tabular-nums">{fmtDuration(recordingDuration)}</span>
                      <div className="flex-1 flex items-center gap-px h-8">
                        {([30, 50, 70, 45, 60, 35, 55, 65, 40, 50, 30, 60, 45, 35, 55, 70, 40, 50, 30, 65, 45, 55, 35, 50] as number[]).map((h, i) => (
                          <div key={i} style={{ height: `${h}%`, animationDelay: `${i * 50}ms` }}
                            className="flex-1 rounded-full bg-error/40 animate-pulse" />
                        ))}
                      </div>
                    </div>
                    <button onClick={stopRecording} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary hover:opacity-90 transition-opacity shrink-0">
                      <Square className="w-4 h-4 fill-on-primary" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mention autocomplete dropdown */}
          <AnimatePresence>
            {mentionQuery !== null && mentionResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                className="absolute left-3 right-3 z-20 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-xl overflow-hidden"
                style={{ bottom: "calc(72px + 4px)" }}
              >
                {mentionResults.slice(0, 5).map(u => (
                  <button key={u.id} onClick={() => insertMention(u.username)}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-surface-container transition-colors text-left">
                    <div className="w-7 h-7 rounded-full bg-secondary-container overflow-hidden shrink-0">
                      {u.image ? <img src={u.image} alt={u.name} className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-[9px] font-bold text-on-secondary-container">{u.name[0]}</span>}
                    </div>
                    <span className="text-sm font-semibold text-on-surface">{u.name}</span>
                    <span className="text-xs text-on-surface-variant ml-auto">@{u.username}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mention picker (+ menu → Mention) */}
          <AnimatePresence>
            {showMentionMenu && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMentionMenu(false)} className="fixed inset-0 z-30" />
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  onClick={e => e.stopPropagation()}
                  className="absolute bottom-[76px] left-3 right-3 z-40 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-2xl overflow-hidden"
                >
                  <div className="flex border-b border-outline-variant/15">
                    {(["users", "stacks", "communities", "quizzes"] as MentionMenuType[]).map(t => (
                      <button key={t} onClick={() => { setMentionMenuType(t); setMentionMenuQuery(""); }}
                        className={cn("flex-1 text-[11px] font-semibold py-2.5 capitalize transition-colors", mentionMenuType === t ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-on-surface")}>
                        {t === "users" ? <AtSign className="w-3.5 h-3.5 mx-auto" /> : t === "stacks" ? <Hash className="w-3.5 h-3.5 mx-auto" /> : t === "communities" ? <Users className="w-3.5 h-3.5 mx-auto" /> : <BrainCircuit className="w-3.5 h-3.5 mx-auto" />}
                      </button>
                    ))}
                  </div>
                  <div className="px-3 pt-2 pb-1">
                    <input autoFocus value={mentionMenuQuery} onChange={e => setMentionMenuQuery(e.target.value)}
                      placeholder={`Search ${mentionMenuType}...`}
                      className="w-full bg-surface-container rounded-xl px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none border border-outline-variant/15" />
                  </div>
                  <div className="max-h-48 overflow-y-auto pb-2">
                    {mentionMenuResults.length === 0 ? (
                      <p className="text-center text-xs text-on-surface-variant/50 py-4">No results</p>
                    ) : mentionMenuResults.map((item, i) => {
                      if (mentionMenuType === "users") {
                        const u = item as MentionResult;
                        return (
                          <button key={i} onClick={() => insertMentionItem(u)} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-surface-container text-sm text-on-surface text-left">
                            <div className="w-6 h-6 rounded-full bg-secondary-container overflow-hidden shrink-0">
                              {u.image ? <img src={u.image} alt={u.name} className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-[9px] font-bold text-on-secondary-container">{u.name[0]}</span>}
                            </div>
                            <span className="flex-1 truncate">{u.name}</span>
                            <span className="text-xs text-on-surface-variant">@{u.username}</span>
                          </button>
                        );
                      } else if (mentionMenuType === "stacks") {
                        const s = item as StackResult;
                        return <button key={i} onClick={() => insertMentionItem(s)} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-surface-container text-sm text-on-surface text-left"><Hash className="w-3.5 h-3.5 text-primary shrink-0" />{s.title}</button>;
                      } else if (mentionMenuType === "communities") {
                        const c = item as CommunityResult;
                        return <button key={i} onClick={() => insertMentionItem(c)} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-surface-container text-sm text-on-surface text-left"><Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" />{c.name}</button>;
                      } else {
                        const q = item as QuizResult;
                        return <button key={i} onClick={() => insertMentionItem(q)} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-surface-container text-sm text-on-surface text-left"><BrainCircuit className="w-3.5 h-3.5 text-amber-500 shrink-0" />{q.title}<span className="text-xs text-on-surface-variant ml-1">· {q.stack?.title}</span></button>;
                      }
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Input */}
          <div className="px-4 py-3 border-t border-outline-variant/10 bg-surface-container-low/80 backdrop-blur-sm shrink-0 relative z-10">
            <div className="flex items-end gap-2">
              {/* + button */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowPlusMenu(m => !m); setShowMentionMenu(false); }}
                  className={cn("p-2 rounded-xl transition-colors shrink-0 mb-0.5", showPlusMenu ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container hover:text-primary")}
                >
                  <Plus className="w-5 h-5" />
                </button>
                <AnimatePresence>
                  {showPlusMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.85, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85, y: 8 }}
                      transition={{ duration: 0.15 }}
                      onClick={e => e.stopPropagation()}
                      className="absolute bottom-full left-0 mb-2 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-xl overflow-hidden min-w-[160px] z-50"
                    >
                      <button onClick={() => { setShowPlusMenu(false); imageInputRef.current?.click(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container transition-colors text-left">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-blue-500" /></div>
                        <span className="font-medium">Photo</span>
                      </button>
                      <button onClick={startRecording}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container transition-colors text-left">
                        <div className="w-8 h-8 rounded-xl bg-error/10 flex items-center justify-center"><Mic className="w-4 h-4 text-error" /></div>
                        <span className="font-medium">Voice note</span>
                      </button>
                      <button onClick={() => { setShowPlusMenu(false); setShowMentionMenu(true); setMentionMenuType("stacks"); setMentionMenuQuery(""); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container transition-colors text-left">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center"><AtSign className="w-4 h-4 text-primary" /></div>
                        <span className="font-medium">Mention</span>
                      </button>
                      <button onClick={() => { setShowPlusMenu(false); fileInputRef.current?.click(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container transition-colors text-left">
                        <div className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center"><BookOpen className="w-4 h-4 text-secondary" /></div>
                        <span className="font-medium">Knowledge file</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Main input box */}
              <div className={cn(
                "flex-1 rounded-2xl border bg-surface-container-lowest transition-all duration-200",
                input.trim() ? "border-secondary/30 shadow-sm" : "border-outline-variant/20"
              )}>
                <textarea ref={textareaRef} value={input}
                  onChange={e => { handleInputChange(e.target.value); const el = e.target; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 120) + "px"; }}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={`Message ${agent.name}…`} rows={1}
                  style={{ resize: "none", minHeight: "40px", maxHeight: "120px" }}
                  className="w-full bg-transparent px-4 pt-3 pb-1 text-[13px] text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none"
                />
                <div className="flex items-center justify-end px-3 pb-3 pt-1">
                  <AnimatePresence mode="wait">
                    <motion.button key={sending ? "wait" : "send"}
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                      whileTap={{ scale: 0.88 }}
                      onClick={sendMessage}
                      disabled={!input.trim() || sending || uploadingImage}
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200",
                        input.trim() && !sending
                          ? "bg-primary text-on-primary hover:opacity-90 shadow-sm"
                          : "bg-surface-container text-on-surface-variant/30"
                      )}
                    >
                      {uploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUp className="h-3.5 w-3.5" />}
                    </motion.button>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Hidden inputs */}
            <input ref={fileInputRef} type="file" className="hidden" accept=".txt,.md,.pdf"
              onChange={e => e.target.files?.[0] && uploadKnowledgeFile(e.target.files[0])} />
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxUrl(null)}
          >
            <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <motion.img
              src={lightboxUrl} alt="Photo"
              initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
              className="max-w-full max-h-full object-contain rounded-2xl"
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Knowledge files drawer */}
      <AnimatePresence>
        {knowledgeOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              className="elevated-surface-strong rounded-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold font-manrope text-on-surface">Knowledge Files</h3>
                <button onClick={() => setKnowledgeOpen(false)} className="text-on-surface-variant hover:text-on-surface"><X className="h-5 w-5" /></button>
              </div>
              <p className="text-[12.5px] text-on-surface-variant mb-4">Upload files to give {agent.name} specialised knowledge. Supports .txt and .md files.</p>
              {agent.knowledgeFiles.length === 0 ? (
                <div className="text-center py-8 text-on-surface-variant text-sm">No files yet</div>
              ) : (
                <div className="space-y-2 mb-4">
                  {agent.knowledgeFiles.map(f => (
                    <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/15">
                      <BookOpen className="h-4 w-4 text-secondary shrink-0" />
                      <span className="text-[12.5px] text-on-surface flex-1 truncate">{f.name}</span>
                      <span className="text-[11px] text-on-surface-variant">{(f.size / 1024).toFixed(0)}KB</span>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => { fileInputRef.current?.click(); setKnowledgeOpen(false); }}
                className="btn-primary w-full py-3 text-sm gap-2">
                <Upload className="h-4 w-4" /> Upload File
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AgentChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" /></div>}>
      <AgentChatInner />
    </Suspense>
  );
}
