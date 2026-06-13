"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUp, Plus, X, Loader2, Image as ImageIcon, Mic, Square, Play, Pause,
  Hash, Users, BrainCircuit, AtSign, Trash2, ExternalLink,
  PanelLeft, PanelLeftClose, MessageCircle, ArrowLeft, Check, Paperclip, Download,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { VerbThinkingIndicator, CopyBtn, renderMessage } from "./ChatPrimitives";
import ChatBackground from "./ChatBackground";

// ─── Types ───────────────────────────────────────────────────────────────────

export type UCMode = "agent" | "custom-agent" | "dm" | "community";

export interface UCMessage {
  id: string;
  role: "user" | "assistant" | "agent";
  content: string;
  createdAt?: string;
  sender?: { id: string; name: string; username?: string; image?: string | null };
  isMe?: boolean;
  mediaType?: "image" | "voice" | "file" | null;
  mediaUrl?: string | null;
  voiceDuration?: number | null;
  imageUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  deletedAt?: string | null;
  editedAt?: string | null;
  isViewOnce?: boolean;
  viewedAt?: string | null;
  replyTo?: {
    id: string; content: string; sender: { name: string };
    mediaType?: string | null; deletedAt?: string | null; isViewOnce?: boolean;
  } | null;
}

export interface UCConversation {
  id: string;
  title: string;
  updatedAt: string;
  preview?: string;
}

export interface UCReplyTo {
  id: string; content: string; senderName: string; mediaType?: string | null;
}

interface UCProps {
  mode: UCMode;
  title: string;
  subtitle?: string;
  headerIcon?: React.ReactNode;
  onBack?: () => void;
  headerRight?: React.ReactNode;
  messages: UCMessage[];
  messagesLoading?: boolean;
  myUserId?: string;
  onSend: (p: {
    content: string;
    imageUrl?: string | null;
    voiceUrl?: string | null;
    voiceDuration?: number;
    replyToId?: string | null;
    fileUrl?: string | null;
    fileName?: string | null;
  }) => Promise<void>;
  sending?: boolean;
  inputPlaceholder?: string;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyActions?: React.ReactNode;
  isThinking?: boolean;
  thinkingIcon?: React.ReactNode;
  conversations?: UCConversation[];
  activeConvId?: string | null;
  onNewConversation?: () => void;
  onSelectConversation?: (id: string) => void;
  onDeleteConversation?: (id: string, e: React.MouseEvent) => void;
  conversationsLoading?: boolean;
  replyTo?: UCReplyTo | null;
  onCancelReply?: () => void;
  editingId?: string | null;
  editContent?: string;
  onEditChange?: (v: string) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  enableImages?: boolean;
  enableVoice?: boolean;
  enableMentions?: boolean;
  enableFiles?: boolean;
  onImageUpload?: (file: File) => Promise<string | null>;
  onMessageCtx?: (msg: UCMessage, x: number, y: number) => void;
  extraOverlays?: React.ReactNode;
  showSidebar?: boolean;
  onToggleSidebar?: () => void;
  bgId?: string;
  customBgUrl?: string | null;
}

// ─── AudioPlayer ─────────────────────────────────────────────────────────────

function AudioPlayer({ url, duration }: { url: string; duration: number | null }) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const total = duration ?? 0;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  const BARS = [20, 35, 55, 40, 65, 30, 50, 70, 45, 35, 60, 40, 25, 55, 45, 65, 30, 50, 35, 45];
  const progress = total > 0 ? currentTime / total : 0;
  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause(); else audioRef.current.play().catch(() => {});
    setPlaying(!playing);
  };
  return (
    <div className="flex items-center gap-2.5 w-[200px] py-0.5">
      <audio ref={audioRef} src={url}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onEnded={() => { setPlaying(false); setCurrentTime(0); }} />
      <button onClick={toggle} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary/15 hover:bg-primary/25 transition-colors">
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

// ─── MentionCard ─────────────────────────────────────────────────────────────

function MentionCard({ type, slug, id, name, isMine }: {
  type: "stack" | "community" | "quiz"; slug?: string; id?: string; name: string; isMine?: boolean;
}) {
  const [cover, setCover] = useState<string | null>(null);
  const [desc, setDesc] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const ep = type === "stack" ? `/api/stacks/${slug}` : type === "community" ? `/api/communities/${slug}` : null;
    if (!ep) return;
    fetch(ep).then(r => r.ok ? r.json() : null).then(d => {
      if (!d) return;
      setCover(d.banner ?? d.profile ?? null);
      setDesc(d.description ?? null);
    }).catch(() => {});
  }, [type, slug]);

  const href = type === "stack" ? `/stacks/${slug}` : type === "community" ? `/communities/${slug}` : `/quiz/${id}`;
  const Icon = type === "stack" ? Hash : type === "community" ? Users : BrainCircuit;
  const label = type === "stack" ? "Stack" : type === "community" ? "Community" : "Quiz";
  const accentBase = type === "stack" ? "primary" : type === "community" ? "emerald-500" : "amber-500";
  const borderColor = isMine ? "border-on-secondary/20" : type === "stack" ? "border-primary/25" : type === "community" ? "border-emerald-500/25" : "border-amber-500/25";
  const bgColor = isMine ? "bg-on-secondary/10" : type === "stack" ? "bg-primary/6" : type === "community" ? "bg-emerald-500/6" : "bg-amber-500/6";
  const textColor = isMine ? "text-on-secondary" : type === "stack" ? "text-primary" : type === "community" ? "text-emerald-600" : "text-amber-600";
  const iconBg = isMine ? "bg-on-secondary/20" : type === "stack" ? "bg-primary/12" : type === "community" ? "bg-emerald-500/12" : "bg-amber-500/12";

  return (
    <Link href={href} onClick={e => e.stopPropagation()}
      className={cn("flex flex-col rounded-2xl border no-underline hover:opacity-90 transition-opacity mt-1.5 max-w-[280px] overflow-hidden", borderColor, bgColor)}>
      {cover && (
        <div className="w-full h-24 overflow-hidden">
          <img src={cover} alt={name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex items-center gap-2.5 p-3">
        {!cover && (
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
            <Icon className={cn("w-4 h-4", textColor)} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className={cn("text-[13px] font-semibold truncate font-manrope", textColor)}>{name}</p>
          </div>
          {desc ? (
            <p className="text-[11px] opacity-60 truncate mt-0.5">{desc}</p>
          ) : (
            <p className="text-[11px] opacity-50">{label}</p>
          )}
        </div>
        <ExternalLink className="w-3 h-3 opacity-40 shrink-0" />
      </div>
    </Link>
  );
}

// ─── renderMentions (exported) ────────────────────────────────────────────────

export function renderMentions(text: string, isMine?: boolean): React.ReactNode {
  const parts = text.split(/(@\w+|\[\[stack:[^\]]+\]\]|\[\[community:[^\]]+\]\]|\[\[quiz:[^\]]+\]\])/g);
  const inlineNodes: React.ReactNode[] = [];
  const cards: React.ReactNode[] = [];

  parts.forEach((p, i) => {
    if (!p) return;
    if (/^@\w+$/.test(p)) {
      inlineNodes.push(
        <span key={i} className={cn("inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md text-[12px] font-semibold", isMine ? "bg-on-secondary/20 text-on-secondary" : "bg-primary/12 text-primary")}>{p}</span>
      );
      return;
    }
    const stackM = p.match(/^\[\[stack:([^|]+)\|([^\]]+)\]\]$/);
    if (stackM) {
      inlineNodes.push(<span key={`t${i}`} className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded-md text-[12px] font-semibold", isMine ? "bg-on-secondary/20 text-on-secondary" : "bg-primary/12 text-primary")}><Hash className="w-3 h-3" />{stackM[2]}</span>);
      cards.push(<MentionCard key={`c${i}`} type="stack" slug={stackM[1]} name={stackM[2]} isMine={isMine} />);
      return;
    }
    const comM = p.match(/^\[\[community:([^|]+)\|([^\]]+)\]\]$/);
    if (comM) {
      inlineNodes.push(<span key={`t${i}`} className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded-md text-[12px] font-semibold", isMine ? "bg-on-secondary/20 text-on-secondary" : "bg-emerald-500/10 text-emerald-600")}><Users className="w-3 h-3" />{comM[2]}</span>);
      cards.push(<MentionCard key={`c${i}`} type="community" slug={comM[1]} name={comM[2]} isMine={isMine} />);
      return;
    }
    const quizM = p.match(/^\[\[quiz:([^|]+)\|([^\]]+)\]\]$/);
    if (quizM) {
      inlineNodes.push(<span key={`t${i}`} className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded-md text-[12px] font-semibold", isMine ? "bg-on-secondary/20 text-on-secondary" : "bg-amber-500/10 text-amber-600")}><BrainCircuit className="w-3 h-3" />{quizM[2]}</span>);
      cards.push(<MentionCard key={`c${i}`} type="quiz" id={quizM[1]} name={quizM[2]} isMine={isMine} />);
      return;
    }
    inlineNodes.push(<span key={i}>{p}</span>);
  });

  return (
    <div>
      <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap">{inlineNodes}</p>
      {cards}
    </div>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatRelative(dateStr: string) {
  const date = new Date(dateStr);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function fmtDuration(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

type MentionMenuTab = "users" | "stacks" | "communities" | "quizzes";
interface MentionResult { id: string; name: string; username: string; image: string | null; }
interface StackResult { id: string; title: string; slug: string; }
interface CommunityResult { id: string; name: string; slug: string; }
interface QuizResult { id: string; title: string; stack?: { title: string; slug: string }; }

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UniversalChat({
  mode, title, subtitle, headerIcon, onBack, headerRight,
  messages, messagesLoading, myUserId,
  onSend, sending, inputPlaceholder,
  emptyIcon, emptyTitle, emptySubtitle, emptyActions,
  isThinking, thinkingIcon,
  conversations, activeConvId, onNewConversation, onSelectConversation, onDeleteConversation, conversationsLoading,
  replyTo, onCancelReply,
  editingId, editContent, onEditChange, onSaveEdit, onCancelEdit,
  enableImages = true, enableVoice = true, enableMentions = true, enableFiles = true,
  onImageUpload,
  onMessageCtx,
  extraOverlays,
  showSidebar: showSidebarProp,
  onToggleSidebar,
  bgId,
  customBgUrl,
}: UCProps) {
  const hasSidebar = !!conversations;
  const [sidebarOpen, setSidebarOpen] = useState(
    showSidebarProp ?? (typeof window !== "undefined" ? window.innerWidth >= 768 : true)
  );

  // Sync sidebar open with prop if controlled
  useEffect(() => {
    if (showSidebarProp !== undefined) setSidebarOpen(showSidebarProp);
  }, [showSidebarProp]);

  const toggleSidebar = () => {
    if (onToggleSidebar) onToggleSidebar();
    else setSidebarOpen(o => !o);
  };

  // Input state
  const [input, setInput] = useState(editingId ? editContent ?? "" : "");
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [plusMenuRect, setPlusMenuRect] = useState<DOMRect | null>(null);
  const [pendingImage, setPendingImage] = useState<{ file: File; preview: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ file: File; name: string } | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Voice state
  const [recording, setRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingDurationRef = useRef(0);

  // Mention state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<MentionResult[]>([]);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionMenuTab, setMentionMenuTab] = useState<MentionMenuTab>("stacks");
  const [mentionMenuQuery, setMentionMenuQuery] = useState("");
  const [mentionMenuResults, setMentionMenuResults] = useState<(MentionResult | StackResult | CommunityResult | QuizResult)[]>([]);

  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const genericFileRef = useRef<HTMLInputElement>(null);
  const plusBtnRef = useRef<HTMLButtonElement>(null);
  const plusPortalRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync edit content
  useEffect(() => {
    if (editingId && editContent !== undefined) setInput(editContent);
  }, [editingId, editContent]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Mention @ autocomplete
  useEffect(() => {
    if (!enableMentions || mentionQuery === null) { setMentionResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/dm/search?q=${encodeURIComponent(mentionQuery)}`)
        .then(r => r.json()).then(d => setMentionResults(d.users ?? [])).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [mentionQuery, enableMentions]);

  // Mention picker search
  useEffect(() => {
    if (!showMentionMenu || !enableMentions) return;
    const ep = mentionMenuTab === "users"
      ? `/api/dm/search?type=users&q=${encodeURIComponent(mentionMenuQuery)}`
      : `/api/dm/search?type=${mentionMenuTab}&q=${encodeURIComponent(mentionMenuQuery)}`;
    fetch(ep).then(r => r.json()).then(d => {
      if (mentionMenuTab === "users") setMentionMenuResults(d.users ?? []);
      else if (mentionMenuTab === "stacks") setMentionMenuResults(d.stacks ?? []);
      else if (mentionMenuTab === "communities") setMentionMenuResults(d.communities ?? []);
      else setMentionMenuResults(d.quizzes ?? []);
    }).catch(() => {});
  }, [showMentionMenu, mentionMenuTab, mentionMenuQuery, enableMentions]);

  // Close Plus menu on outside click
  useEffect(() => {
    if (!showPlusMenu) return;
    const handler = (e: MouseEvent) => {
      if (
        plusBtnRef.current?.contains(e.target as Node) ||
        plusPortalRef.current?.contains(e.target as Node)
      ) return;
      setShowPlusMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPlusMenu]);

  const handleInputChange = (val: string) => {
    setInput(val);
    if (onEditChange && editingId) onEditChange(val);
    if (!enableMentions) return;
    const atMatch = val.match(/@(\w*)$/);
    if (atMatch) setMentionQuery(atMatch[1]);
    else setMentionQuery(null);
  };

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const insertMention = (username: string) => {
    const newVal = input.replace(/@\w*$/, `@${username} `);
    setInput(newVal);
    setMentionQuery(null);
    inputRef.current?.focus();
  };

  const insertMentionItem = (item: MentionResult | StackResult | CommunityResult | QuizResult) => {
    let tag = "";
    if ("username" in item) tag = `@${(item as MentionResult).username}`;
    else if ("slug" in item && "title" in item && !("name" in item)) tag = `[[stack:${(item as StackResult).slug}|${(item as StackResult).title}]]`;
    else if ("slug" in item && "name" in item) tag = `[[community:${(item as CommunityResult).slug}|${(item as CommunityResult).name}]]`;
    else { const q = item as QuizResult; tag = `[[quiz:${q.id}|${q.title}]]`; }
    setInput(prev => (prev.trim() ? prev + " " + tag + " " : tag + " "));
    setShowMentionMenu(false);
    inputRef.current?.focus();
  };

  const handleImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => setPendingImage({ file, preview: e.target?.result as string });
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    setShowPlusMenu(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus") ? "audio/ogg;codecs=opus" : "audio/mp4";
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = ev => { if (ev.data.size > 0) audioChunksRef.current.push(ev.data); };
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
        if (res.url) await onSend({ content: "", voiceUrl: res.url, voiceDuration: duration, replyToId: replyTo?.id ?? null });
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

  const handleSend = async () => {
    if (editingId) { onSaveEdit?.(); return; }
    if ((!input.trim() && !pendingImage && !pendingFile) || sending || uploadingImage || uploadingFile) return;
    const text = input.trim();
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setMentionQuery(null);

    let imageUrl: string | null = null;
    if (pendingImage) {
      setUploadingImage(true);
      try {
        if (onImageUpload) {
          imageUrl = await onImageUpload(pendingImage.file);
        } else {
          const form = new FormData();
          form.append("file", pendingImage.file);
          const res = await fetch("/api/upload", { method: "POST", body: form }).then(r => r.json());
          imageUrl = res.url ?? pendingImage.preview;
        }
      } catch { imageUrl = pendingImage.preview; }
      setPendingImage(null);
      setUploadingImage(false);
    }

    let fileUrl: string | null = null;
    let fileName: string | null = null;
    if (pendingFile && !pendingImage) {
      setUploadingFile(true);
      try {
        const form = new FormData();
        form.append("file", pendingFile.file);
        const res = await fetch("/api/upload", { method: "POST", body: form }).then(r => r.json());
        fileUrl = res.url ?? null;
        fileName = pendingFile.name;
      } catch { /* ignore */ }
      setPendingFile(null);
      setUploadingFile(false);
    }

    await onSend({ content: text, imageUrl, replyToId: replyTo?.id ?? null, fileUrl, fileName });
  };

  const canSend = (!!input.trim() || !!pendingImage || !!pendingFile) && !sending && !uploadingImage && !uploadingFile;

  const isAiMode = mode === "agent" || mode === "custom-agent";

  const getIsMe = (msg: UCMessage) => {
    if (msg.isMe !== undefined) return msg.isMe;
    if (myUserId && msg.sender?.id) return msg.sender.id === myUserId;
    return msg.role === "user";
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="relative flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        {hasSidebar && (
          <AnimatePresence initial={false}>
            {sidebarOpen && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                  className="absolute inset-0 z-20 bg-black/20 backdrop-blur-[1px]" onClick={() => setSidebarOpen(false)} />
                <motion.aside initial={{ x: -255, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -255, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute left-0 top-0 bottom-0 z-30 w-[255px] border-r border-outline-variant/10 bg-surface-container-low flex flex-col overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10 shrink-0">
                    <span className="font-manrope font-semibold text-sm text-primary">Conversations</span>
                    {onNewConversation && (
                      <button onClick={onNewConversation} className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors" title="New chat">
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
                    {conversationsLoading ? (
                      <div className="space-y-2 px-2 py-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-surface-container rounded-xl animate-pulse" />)}</div>
                    ) : !conversations?.length ? (
                      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <MessageCircle className="w-8 h-8 text-on-surface-variant/30 mb-2" />
                        <p className="text-xs text-on-surface-variant/50">No conversations yet</p>
                      </div>
                    ) : conversations.map(c => (
                      <button key={c.id} onClick={() => onSelectConversation?.(c.id)}
                        className={cn("w-full text-left px-2.5 py-2 rounded-xl transition-all group flex items-start gap-2", activeConvId === c.id ? "bg-secondary-container/60 text-on-secondary-container" : "hover:bg-surface-container text-on-surface")}>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{c.title}</p>
                          {c.preview && <p className="text-[11px] text-on-surface-variant/60 truncate mt-0.5">{c.preview}</p>}
                          {c.updatedAt && <p className="text-[10px] text-on-surface-variant/40 mt-0.5">{formatRelative(c.updatedAt)}</p>}
                        </div>
                        {onDeleteConversation && (
                          <button onClick={e => onDeleteConversation(c.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-error-container/20 hover:text-error text-on-surface-variant/40 shrink-0 transition-all mt-0.5">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>
        )}

        {/* ── Main Area ── */}
        <div className="flex-1 flex flex-col overflow-hidden relative" ref={containerRef}>
          {customBgUrl
            ? <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: `url(${customBgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            : <ChatBackground bgId={bgId as import("./ChatBackground").ChatBgId | undefined} />
          }

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant/10 shrink-0 relative z-10">
            {onBack && (
              <button onClick={onBack} className="p-1.5 rounded-xl hover:bg-surface-container text-on-surface-variant transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            {hasSidebar && (
              <button onClick={toggleSidebar} className="p-1.5 rounded-xl hover:bg-surface-container text-on-surface-variant transition-colors">
                {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
              </button>
            )}
            {headerIcon && (
              <div className="w-8 h-8 bg-secondary-container rounded-xl flex items-center justify-center shrink-0">
                {headerIcon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-manrope font-bold text-sm text-primary truncate">{title}</h1>
              {subtitle && <p className="text-[11px] text-on-surface-variant truncate">{subtitle}</p>}
            </div>
            {onNewConversation && (
              <button onClick={onNewConversation}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary rounded-xl text-xs font-medium transition-all">
                <Plus className="w-3.5 h-3.5" /> New chat
              </button>
            )}
            {headerRight}
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-1 relative z-10">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-secondary animate-spin" />
              </div>
            ) : messages.length === 0 && !isThinking ? (
              emptyTitle ? (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center pt-10 pb-6 text-center max-w-md mx-auto">
                  {emptyIcon && <div className="w-14 h-14 bg-secondary-container rounded-2xl flex items-center justify-center mb-4">{emptyIcon}</div>}
                  {emptyTitle && <h2 className="font-manrope font-semibold text-base text-primary mb-1">{emptyTitle}</h2>}
                  {emptySubtitle && <p className="text-[12.5px] text-on-surface-variant mb-5">{emptySubtitle}</p>}
                  {emptyActions && <div className="flex flex-wrap gap-2 justify-center">{emptyActions}</div>}
                </motion.div>
              ) : null
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => {
                  const isMe = getIsMe(msg);
                  const isAiMsg = msg.role === "agent" || msg.role === "assistant";
                  const prevMsg = messages[idx - 1];
                  const showAvatar = !isMe && (!prevMsg || getIsMe(prevMsg) || prevMsg.sender?.id !== msg.sender?.id);

                  if (msg.deletedAt) {
                    return (
                      <motion.div key={msg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className={cn("flex gap-2.5 group max-w-3xl", isMe ? "ml-auto flex-row-reverse" : "")}>
                        {!isMe && <div className="w-7 shrink-0" />}
                        <div className="px-3.5 py-2 rounded-2xl bg-surface-container/50 border border-outline-variant/10 text-on-surface-variant/40 text-[11px] italic">
                          Message deleted
                        </div>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div key={msg.id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className={cn("flex gap-2.5 group max-w-3xl", isMe ? "ml-auto flex-row-reverse" : "")}
                      onContextMenu={onMessageCtx ? (e) => { e.preventDefault(); onMessageCtx(msg, e.clientX, e.clientY); } : undefined}
                    >
                      {/* Avatar (non-me, community/DM) */}
                      {!isMe && !isAiMode && (
                        showAvatar ? (
                          <div className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold overflow-hidden border border-outline-variant/10">
                            {msg.sender?.image
                              ? <img src={msg.sender.image} alt="" className="w-full h-full object-cover" />
                              : (msg.sender?.name?.[0] ?? "?").toUpperCase()}
                          </div>
                        ) : <div className="w-7 shrink-0" />
                      )}

                      {/* AI avatar */}
                      {!isMe && isAiMode && (
                        <div className="w-7 h-7 bg-secondary-container rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-outline-variant/20">
                          {headerIcon ?? <div className="w-3.5 h-3.5 bg-secondary rounded-full" />}
                        </div>
                      )}

                      <div className={cn("max-w-[80%] space-y-1", isMe ? "items-end flex flex-col" : "")}>
                        {/* Sender name */}
                        {!isMe && !isAiMode && showAvatar && msg.sender?.name && (
                          <p className="text-[11px] text-on-surface-variant font-medium mb-0.5">{msg.sender.name}</p>
                        )}

                        {/* Reply preview */}
                        {msg.replyTo && (
                          <div className={cn("px-3 py-1.5 rounded-xl border-l-2 border-secondary/40 text-[11px] text-on-surface-variant/70 mb-0.5", isMe ? "bg-secondary/10 text-right border-r-2 border-l-0" : "bg-surface-container/60")}>
                            <p className="font-semibold text-primary">{msg.replyTo.sender.name}</p>
                            <p className="truncate">
                              {msg.replyTo.deletedAt ? "Deleted message" : msg.replyTo.isViewOnce ? "View once · expired" : msg.replyTo.mediaType === "image" ? "📷 Photo" : msg.replyTo.mediaType === "voice" ? "🎙 Voice note" : msg.replyTo.content}
                            </p>
                          </div>
                        )}

                        {/* Image attachment */}
                        {(msg.imageUrl || (msg.mediaType === "image" && msg.mediaUrl)) && (
                          <button onClick={() => setLightboxUrl(msg.imageUrl || msg.mediaUrl!)}
                            className={cn("rounded-2xl overflow-hidden hover:opacity-90 transition-opacity block", isMe ? "rounded-br-sm" : "rounded-bl-sm")}>
                            <img src={msg.imageUrl || msg.mediaUrl!} alt="Photo" className="max-w-full max-h-52 object-contain bg-surface-container" />
                          </button>
                        )}

                        {/* Voice note */}
                        {msg.mediaType === "voice" && msg.mediaUrl && (
                          <div className={cn("px-3.5 py-2.5 rounded-2xl", isMe ? "bg-secondary text-on-secondary rounded-br-sm" : "bg-surface-container border border-outline-variant/15 rounded-bl-sm")}>
                            <AudioPlayer url={msg.mediaUrl} duration={msg.voiceDuration ?? null} />
                          </div>
                        )}

                        {/* File attachment */}
                        {msg.fileUrl && (
                          <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer"
                            className={cn("flex items-center gap-3 px-3.5 py-2.5 rounded-2xl no-underline hover:opacity-80 transition-opacity", isMe ? "bg-secondary text-on-secondary rounded-br-sm" : "bg-surface-container border border-outline-variant/15 text-on-surface rounded-bl-sm")}>
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", isMe ? "bg-on-secondary/20" : "bg-primary/10")}>
                              <Paperclip className={cn("w-4 h-4", isMe ? "text-on-secondary" : "text-primary")} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-medium truncate">{msg.fileName ?? "File"}</p>
                              <p className="text-[10px] opacity-60">Tap to download</p>
                            </div>
                            <Download className="w-3.5 h-3.5 opacity-50 shrink-0" />
                          </a>
                        )}

                        {/* Text content */}
                        {msg.content && msg.mediaType !== "voice" && !msg.mediaType && (
                          <div className={cn(
                            "px-3.5 py-2.5 rounded-2xl",
                            isMe ? "bg-secondary text-on-secondary rounded-br-sm" : isAiMsg ? "bg-surface-container border border-outline-variant/15 text-on-surface rounded-tl-sm" : "bg-surface-container border border-outline-variant/15 text-on-surface rounded-bl-sm"
                          )}>
                            {isAiMsg
                              ? renderMessage(msg.content)
                              : renderMentions(msg.content, isMe)
                            }
                          </div>
                        )}

                        {/* Timestamp + copy */}
                        <div className={cn("flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150", isMe ? "justify-end" : "justify-start")}>
                          {msg.createdAt && <span className="text-[10px] text-on-surface-variant/30">{formatRelative(msg.createdAt)}</span>}
                          {isAiMsg && msg.content && <CopyBtn text={msg.content} />}
                          {msg.editedAt && <span className="text-[10px] text-on-surface-variant/30">edited</span>}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}

            <AnimatePresence>
              {isThinking && thinkingIcon && (
                <VerbThinkingIndicator agentIcon={thinkingIcon} />
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* ── Voice Recording Overlay ── */}
          <AnimatePresence>
            {(recording || uploadingVoice) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-0 left-0 right-0 z-50 bg-surface-container-lowest/98 backdrop-blur-md border-t border-outline-variant/20 px-4 py-4"
                onClick={e => e.stopPropagation()}>
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
                        {([30,50,70,45,60,35,55,65,40,50,30,60,45,35,55,70,40,50,30,65] as number[]).map((h, i) => (
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

          {/* ── @ Mention Autocomplete ── */}
          <AnimatePresence>
            {mentionQuery !== null && mentionResults.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                className="absolute left-3 right-3 z-20 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-xl overflow-hidden"
                style={{ bottom: "calc(72px + 4px)" }}>
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

          {/* ── Mention Picker Modal ── */}
          <AnimatePresence>
            {showMentionMenu && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMentionMenu(false)} className="absolute inset-0 z-30" />
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  onClick={e => e.stopPropagation()}
                  className="absolute bottom-[76px] left-3 right-3 z-40 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="flex border-b border-outline-variant/15">
                    {(["stacks", "communities", "quizzes", "users"] as MentionMenuTab[]).map(t => (
                      <button key={t} onClick={() => { setMentionMenuTab(t); setMentionMenuQuery(""); }}
                        className={cn("flex-1 py-2.5 text-[11px] font-semibold capitalize transition-colors", mentionMenuTab === t ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-on-surface")}>
                        {t === "users" ? <AtSign className="w-3.5 h-3.5 mx-auto" /> : t === "stacks" ? <Hash className="w-3.5 h-3.5 mx-auto" /> : t === "communities" ? <Users className="w-3.5 h-3.5 mx-auto" /> : <BrainCircuit className="w-3.5 h-3.5 mx-auto" />}
                      </button>
                    ))}
                  </div>
                  <div className="px-3 pt-2 pb-1">
                    <input autoFocus value={mentionMenuQuery} onChange={e => setMentionMenuQuery(e.target.value)}
                      placeholder={`Search ${mentionMenuTab}...`}
                      className="w-full bg-surface-container rounded-xl px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none border border-outline-variant/15" />
                  </div>
                  <div className="max-h-48 overflow-y-auto pb-2">
                    {mentionMenuResults.length === 0 ? (
                      <p className="text-center text-xs text-on-surface-variant/50 py-4">No results</p>
                    ) : mentionMenuResults.map((item, i) => {
                      if (mentionMenuTab === "users") {
                        const u = item as MentionResult;
                        return (
                          <button key={i} onClick={() => insertMentionItem(u)} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-surface-container text-sm text-on-surface text-left">
                            <div className="w-6 h-6 rounded-full bg-secondary-container overflow-hidden shrink-0">
                              {u.image ? <img src={u.image} alt={u.name} className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-[9px] font-bold text-on-secondary-container">{u.name[0]}</span>}
                            </div>
                            <span className="flex-1 truncate font-medium">{u.name}</span>
                            <span className="text-xs text-on-surface-variant">@{u.username}</span>
                          </button>
                        );
                      } else if (mentionMenuTab === "stacks") {
                        const s = item as StackResult;
                        return <button key={i} onClick={() => insertMentionItem(s)} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-surface-container text-sm text-on-surface text-left"><Hash className="w-3.5 h-3.5 text-primary shrink-0" /><span className="flex-1 truncate">{s.title}</span></button>;
                      } else if (mentionMenuTab === "communities") {
                        const c = item as CommunityResult;
                        return <button key={i} onClick={() => insertMentionItem(c)} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-surface-container text-sm text-on-surface text-left"><Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span className="flex-1 truncate">{c.name}</span></button>;
                      } else {
                        const q = item as QuizResult;
                        return <button key={i} onClick={() => insertMentionItem(q)} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-surface-container text-sm text-on-surface text-left"><BrainCircuit className="w-3.5 h-3.5 text-amber-500 shrink-0" /><span className="flex-1 truncate">{q.title}</span>{q.stack && <span className="text-xs text-on-surface-variant ml-1 shrink-0">· {q.stack.title}</span>}</button>;
                      }
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* ── Input Area ── */}
          <div className="px-4 pt-2 shrink-0 relative z-10" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
            {/* Reply preview */}
            <AnimatePresence>
              {replyTo && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 mb-2 pl-3 border-l-2 border-primary/50">
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-semibold text-primary">{replyTo.senderName}</span>
                    <p className="text-[11px] text-on-surface-variant truncate">
                      {replyTo.mediaType === "image" ? "📷 Photo" : replyTo.mediaType === "voice" ? "🎙 Voice note" : replyTo.content}
                    </p>
                  </div>
                  <button onClick={onCancelReply} className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant/50 shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Image preview */}
            <AnimatePresence>
              {pendingImage && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 mb-2">
                  <div className="relative inline-block">
                    <img src={pendingImage.preview} alt="Preview" className="h-14 w-auto rounded-xl object-cover border border-outline-variant/20" />
                    <button onClick={() => setPendingImage(null)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-error text-on-error rounded-full flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* File attachment preview */}
            <AnimatePresence>
              {pendingFile && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 mb-2 px-3 py-2 bg-surface-container rounded-xl border border-outline-variant/15">
                  <Paperclip className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-[12px] text-on-surface flex-1 min-w-0 truncate font-medium">{pendingFile.name}</span>
                  <button onClick={() => setPendingFile(null)} className="p-1 rounded-lg hover:bg-surface-container-high text-on-surface-variant/50 shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Edit mode indicator */}
            {editingId && (
              <div className="flex items-center gap-2 mb-2 text-[11px] text-primary font-medium">
                <div className="w-1 h-4 bg-primary rounded-full" />
                Editing message
                <button onClick={() => { onCancelEdit?.(); setInput(""); }} className="ml-auto text-on-surface-variant hover:text-primary transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* The all-in-one input card */}
            <div className={cn(
              "bg-surface-container rounded-2xl border overflow-hidden transition-all duration-200",
              (canSend || editingId) ? "border-secondary/30 shadow-sm" : "border-outline-variant/10"
            )}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => { handleInputChange(e.target.value); autoResize(e.target); }}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                  if (e.key === "Escape" && editingId) { onCancelEdit?.(); setInput(""); }
                }}
                placeholder={editingId ? "Editing…" : (inputPlaceholder ?? `Message ${title}…`)}
                rows={1}
                className="w-full bg-transparent px-4 pt-3.5 pb-1 text-[13px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none resize-none max-h-32 overflow-y-auto"
                style={{ minHeight: "44px" }}
              />
              <div className="flex items-center justify-between px-3 pb-3 pt-1">
                {/* Left: Plus button (menu rendered via portal to escape overflow-hidden) */}
                <button
                  ref={plusBtnRef}
                  onClick={() => {
                    if (!showPlusMenu) {
                      setPlusMenuRect(plusBtnRef.current?.getBoundingClientRect() ?? null);
                    }
                    setShowPlusMenu(m => !m);
                  }}
                  className={cn("p-1.5 rounded-xl transition-colors", showPlusMenu ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary")}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>

                {/* Right: Send / Save */}
                <AnimatePresence mode="wait">
                  <motion.button key={sending ? "wait" : editingId ? "edit" : "send"}
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    whileTap={{ scale: 0.88 }}
                    onClick={handleSend}
                    disabled={!!editingId ? false : !canSend}
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200",
                      (canSend || editingId) ? "bg-primary text-on-primary hover:opacity-90 shadow-sm" : "bg-surface-container text-on-surface-variant/30"
                    )}>
                    {uploadingImage || uploadingFile || sending
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : editingId ? <Check className="w-3.5 h-3.5" />
                      : <ArrowUp className="w-3.5 h-3.5" />}
                  </motion.button>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Plus Menu Portal (breaks out of overflow-hidden to show all options) ── */}
      {showPlusMenu && plusMenuRect && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          <motion.div
            ref={plusPortalRef}
            initial={{ opacity: 0, scale: 0.88, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 6 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed",
              bottom: window.innerHeight - plusMenuRect.top + 8,
              left: plusMenuRect.left,
              zIndex: 9999,
            }}
            className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-2xl overflow-hidden min-w-[180px]">
            {enableImages && (
              <button onClick={() => { setShowPlusMenu(false); fileInputRef.current?.click(); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container transition-colors text-left">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-blue-500" /></div>
                <span className="font-medium">Photo</span>
              </button>
            )}
            {enableVoice && (
              <button onClick={startRecording}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container transition-colors text-left">
                <div className="w-8 h-8 rounded-xl bg-error/10 flex items-center justify-center"><Mic className="w-4 h-4 text-error" /></div>
                <span className="font-medium">Voice note</span>
              </button>
            )}
            {enableMentions && (
              <button onClick={() => { setShowPlusMenu(false); setShowMentionMenu(true); setMentionMenuTab("stacks"); setMentionMenuQuery(""); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container transition-colors text-left">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center"><AtSign className="w-4 h-4 text-primary" /></div>
                <span className="font-medium">Mention</span>
              </button>
            )}
            {enableFiles && (
              <button onClick={() => { setShowPlusMenu(false); genericFileRef.current?.click(); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container transition-colors text-left">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center"><Paperclip className="w-4 h-4 text-purple-500" /></div>
                <span className="font-medium">File</span>
              </button>
            )}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Hidden image input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ""; }} />

      {/* Hidden generic file input */}
      <input ref={genericFileRef} type="file" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) setPendingFile({ file: f, name: f.name }); e.target.value = ""; }} />

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxUrl(null)}>
            <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <motion.img src={lightboxUrl} alt="Photo"
              initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
              className="max-w-full max-h-full object-contain rounded-2xl"
              onClick={e => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Extra page-level overlays (context menus, etc.) */}
      {extraOverlays}
    </div>
  );
}
