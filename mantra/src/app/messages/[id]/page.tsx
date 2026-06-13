"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pencil, Trash2, Reply, Copy, Eye, X, Upload, Loader2, BadgeCheck,
} from "lucide-react";
import Link from "next/link";
import { CHAT_BG_OPTIONS, type ChatBgId } from "@/components/chat/ChatBackground";
import UniversalChat, { UCMessage, UCReplyTo } from "@/components/chat/UniversalChat";
import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";

interface DMSender { id: string; name: string; username: string; image: string | null; }
interface DMReplyTo {
  id: string; content: string; deletedAt: string | null; isViewOnce: boolean;
  mediaType: string | null; mediaUrl: string | null;
  sender: { id: string; name: string };
}
interface DM {
  id: string; conversationId: string; senderId: string; content: string;
  isViewOnce: boolean; viewedAt: string | null; editedAt: string | null;
  deletedAt: string | null; replyToId: string | null;
  replyTo: DMReplyTo | null; sender: DMSender; createdAt: string;
  mediaType: string | null; mediaUrl: string | null; voiceDuration: number | null;
}
interface OtherUser { id: string; name: string; username: string; image: string | null; isVerified: boolean; }
type CtxMenu = {
  msgId: string; x: number; y: number; isMine: boolean;
  content: string; deletedAt: string | null; editedAt: string | null;
  isViewOnce: boolean; mediaType: string | null;
};

function UserAvatar({ user, size = "sm" }: { user: { name: string; image: string | null }; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-8 h-8 text-[10px]" : "w-10 h-10 text-xs";
  const initials = user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className={cn("rounded-full bg-secondary-container flex items-center justify-center overflow-hidden shrink-0", sz)}>
      {user.image
        ? <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
        : <span className="font-bold text-on-secondary-container font-manrope">{initials}</span>}
    </div>
  );
}

function dmToUCMessage(m: DM, myId: string): UCMessage {
  let content = m.content;
  let mediaType = (m.mediaType as "image" | "voice" | null) ?? null;
  let mediaUrl = m.mediaUrl;

  if (m.isViewOnce && !m.deletedAt) {
    if (m.viewedAt) {
      content = "👁 Message viewed"; mediaType = null; mediaUrl = null;
    } else if (m.senderId !== myId) {
      content = "👁 Tap to view · view once"; mediaType = null; mediaUrl = null;
    } else {
      content = "👁 View once · not yet viewed"; mediaType = null; mediaUrl = null;
    }
  }

  return {
    id: m.id,
    role: "user",
    content,
    isMe: m.senderId === myId,
    sender: { id: m.sender.id, name: m.sender.name, username: m.sender.username, image: m.sender.image },
    mediaType,
    mediaUrl,
    voiceDuration: m.voiceDuration,
    deletedAt: m.deletedAt,
    editedAt: m.editedAt,
    isViewOnce: m.isViewOnce,
    viewedAt: m.viewedAt,
    replyTo: m.replyTo ? {
      id: m.replyTo.id,
      content: m.replyTo.content,
      sender: m.replyTo.sender,
      mediaType: m.replyTo.mediaType,
      deletedAt: m.replyTo.deletedAt,
      isViewOnce: m.replyTo.isViewOnce,
    } : null,
    createdAt: m.createdAt,
  };
}

export default function DMChatPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const id = params.id as string;
  const myId = (session?.user as { id?: string })?.id ?? "";

  const [messages, setMessages] = useState<DM[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<DM | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [bgPreset, setBgPreset] = useState<ChatBgId>("none");
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null);
  const [uploadingBg, setUploadingBg] = useState(false);

  const esRef = useRef<EventSource | null>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    const savedImg = localStorage.getItem(`dm-bg-img-${id}`);
    const savedPreset = localStorage.getItem(`dm-bg-${id}`) as ChatBgId | null;
    if (savedImg) { setCustomBgUrl(savedImg); setBgPreset("none"); }
    else if (savedPreset) setBgPreset(savedPreset);
  }, [id]);

  useEffect(() => {
    if (!myId) return;
    const es = new EventSource(`/api/dm/conversations/${id}/stream`);
    esRef.current = es;
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "init") {
          setMessages(data.messages ?? []);
        } else if (data.type === "update") {
          setMessages(prev => {
            const updated = [...prev];
            for (const msg of (data.messages as DM[])) {
              const idx = updated.findIndex(m => m.id === msg.id);
              if (idx >= 0) updated[idx] = msg;
              else updated.push(msg);
            }
            return updated.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          });
        }
      } catch { }
    };
    es.onerror = () => { es.close(); };
    return () => { es.close(); esRef.current = null; };
  }, [id, myId]);

  useEffect(() => {
    fetch(`/api/dm/conversations`)
      .then(r => r.json())
      .then(d => {
        const convo = (d.conversations ?? []).find((c: { id: string; otherUser: OtherUser }) => c.id === id);
        if (convo) setOtherUser(convo.otherUser);
        else router.push("/messages");
      })
      .catch(() => {});
  }, [id, router]);

  const buildOptimistic = useCallback((content: string, opts?: { mediaType?: string; mediaUrl?: string; voiceDuration?: number; replyToId?: string | null }, currentReply?: DM | null): DM => ({
    id: `opt_${Date.now()}_${Math.random()}`,
    conversationId: id,
    senderId: myId,
    content,
    isViewOnce: false, viewedAt: null, editedAt: null, deletedAt: null,
    replyToId: currentReply?.id ?? null,
    replyTo: currentReply ? {
      id: currentReply.id, content: currentReply.content, deletedAt: currentReply.deletedAt,
      isViewOnce: currentReply.isViewOnce, mediaType: currentReply.mediaType, mediaUrl: currentReply.mediaUrl,
      sender: currentReply.sender,
    } : null,
    sender: { id: myId, name: session?.user?.name ?? "", username: "", image: session?.user?.image ?? null },
    createdAt: new Date().toISOString(),
    mediaType: opts?.mediaType ?? null,
    mediaUrl: opts?.mediaUrl ?? null,
    voiceDuration: opts?.voiceDuration ?? null,
  }), [id, myId, session]);

  const sendMedia = useCallback(async (opts: { mediaType: string; mediaUrl: string; voiceDuration?: number }) => {
    const optMsg = buildOptimistic("", opts, null);
    setMessages(prev => [...prev, optMsg]);
    try {
      const res = await fetch(`/api/dm/conversations/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "", ...opts }),
      });
      const data = await res.json();
      setMessages(prev => {
        const without = prev.filter(m => m.id !== optMsg.id);
        if (!data.message || without.find(m => m.id === data.message.id)) return without;
        return [...without, data.message].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      });
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optMsg.id));
    }
  }, [buildOptimistic, id]);

  const handleSend = useCallback(async (p: {
    content: string; imageUrl?: string | null; voiceUrl?: string | null;
    voiceDuration?: number; replyToId?: string | null;
  }) => {
    const currentReply = replyTo;
    setReplyTo(null);
    setSending(true);
    try {
      if (p.voiceUrl) {
        await sendMedia({ mediaType: "voice", mediaUrl: p.voiceUrl, voiceDuration: p.voiceDuration ?? 0 });
      } else if (p.imageUrl) {
        await sendMedia({ mediaType: "image", mediaUrl: p.imageUrl });
      } else if (p.content.trim()) {
        const optMsg = buildOptimistic(p.content.trim(), undefined, currentReply);
        setMessages(prev => [...prev, optMsg]);
        try {
          const res = await fetch(`/api/dm/conversations/${id}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: p.content.trim(), replyToId: p.replyToId ?? currentReply?.id ?? null }),
          });
          const data = await res.json();
          setMessages(prev => {
            const without = prev.filter(m => m.id !== optMsg.id);
            if (!data.message || without.find(m => m.id === data.message.id)) return without;
            return [...without, data.message].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          });
        } catch {
          setMessages(prev => prev.filter(m => m.id !== optMsg.id));
        }
      }
    } finally {
      setSending(false);
    }
  }, [sendMedia, buildOptimistic, id, replyTo]);

  const saveEdit = async () => {
    if (!editingId || !editContent.trim()) return;
    await fetch(`/api/dm/conversations/${id}/messages`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: editingId, content: editContent.trim() }),
    });
    setEditingId(null); setEditContent("");
  };

  const deleteMessage = async (msgId: string) => {
    setCtxMenu(null);
    await fetch(`/api/dm/conversations/${id}/messages?messageId=${msgId}`, { method: "DELETE" });
  };

  const viewOnce = async (msgId: string) => {
    await fetch(`/api/dm/conversations/${id}/view-once`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: msgId }),
    });
  };

  const openCtxMenu = useCallback((msg: UCMessage, x: number, y: number) => {
    const rawMsg = messages.find(m => m.id === msg.id);
    if (!rawMsg) return;
    setCtxMenu({
      msgId: rawMsg.id, x, y, isMine: rawMsg.senderId === myId,
      content: rawMsg.content, deletedAt: rawMsg.deletedAt, editedAt: rawMsg.editedAt,
      isViewOnce: rawMsg.isViewOnce, mediaType: rawMsg.mediaType,
    });
  }, [messages, myId]);

  const applyBgPreset = (preset: ChatBgId) => {
    setBgPreset(preset); setCustomBgUrl(null);
    localStorage.setItem(`dm-bg-${id}`, preset);
    localStorage.removeItem(`dm-bg-img-${id}`);
  };

  const uploadCustomBg = async (file: File) => {
    setUploadingBg(true);
    const form = new FormData(); form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form }).then(r => r.json()).catch(() => null);
    if (res?.url) {
      setCustomBgUrl(res.url); setBgPreset("none");
      localStorage.setItem(`dm-bg-img-${id}`, res.url);
      localStorage.removeItem(`dm-bg-${id}`);
    }
    setUploadingBg(false);
  };

  const ucMessages: UCMessage[] = messages.map(m => dmToUCMessage(m, myId));

  const ucReplyTo: UCReplyTo | null = replyTo ? {
    id: replyTo.id,
    content: replyTo.content,
    senderName: replyTo.sender.name,
    mediaType: replyTo.mediaType,
  } : null;

  if (!otherUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const headerIcon = (
    <Link href={`/profile/${otherUser.username}`} onClick={e => e.stopPropagation()}>
      <UserAvatar user={otherUser} size="sm" />
    </Link>
  );

  const headerRight = (
    <div className="flex items-center gap-1">
      {otherUser.isVerified && <BadgeCheck className="w-4 h-4 text-primary" />}
      <button
        onClick={(e) => { e.stopPropagation(); setShowBgPicker(b => !b); setCtxMenu(null); }}
        className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors"
      >
        <Palette className="w-[18px] h-[18px]" />
      </button>
    </div>
  );

  const extraOverlays = (
    <>
      <AnimatePresence>
        {showBgPicker && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="fixed top-[64px] right-4 z-[60] bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-xl p-4 w-72"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-on-surface uppercase tracking-wider">Chat Background</span>
              <button onClick={() => setShowBgPicker(false)} className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {CHAT_BG_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => { applyBgPreset(opt.id); setShowBgPicker(false); }}
                  className={cn("aspect-video rounded-xl overflow-hidden border-2 transition-all", bgPreset === opt.id && !customBgUrl ? "border-primary shadow-md" : "border-transparent hover:border-outline-variant/40")}
                  title={opt.label}>{opt.thumbnail}</button>
              ))}
            </div>
            <div className="border-t border-outline-variant/15 pt-3 space-y-2">
              <button onClick={() => bgFileRef.current?.click()} disabled={uploadingBg}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-sm text-on-surface-variant transition-colors">
                {uploadingBg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {customBgUrl ? "Change custom image" : "Upload custom image"}
              </button>
              {(customBgUrl || bgPreset !== "none") && (
                <button onClick={() => { applyBgPreset("none"); setCustomBgUrl(null); localStorage.removeItem(`dm-bg-img-${id}`); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-surface-container text-sm text-on-surface-variant/70 transition-colors">
                  <X className="w-3.5 h-3.5" /> Remove background
                </button>
              )}
            </div>
            <input ref={bgFileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadCustomBg(f); e.target.value = ""; }} />
          </motion.div>
        )}
      </AnimatePresence>

      {ctxMenu && (
        <div className="fixed inset-0 z-[65]" onClick={() => setCtxMenu(null)} />
      )}

      <AnimatePresence>
        {ctxMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            onClick={e => e.stopPropagation()}
            className="fixed z-[70] bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-2xl py-1 min-w-[160px]"
            style={{
              left: Math.min(ctxMenu.x, (typeof window !== "undefined" ? window.innerWidth : 400) - 180),
              top: Math.min(ctxMenu.y, (typeof window !== "undefined" ? window.innerHeight : 800) - 300),
            }}
          >
            {[
              {
                icon: Reply, label: "Reply",
                action: () => { const m = messages.find(m => m.id === ctxMenu.msgId); if (m) setReplyTo(m); setCtxMenu(null); },
                show: !ctxMenu.deletedAt,
              },
              {
                icon: Eye, label: "Open",
                action: () => { viewOnce(ctxMenu.msgId); setCtxMenu(null); },
                show: ctxMenu.isViewOnce && !ctxMenu.deletedAt && !ctxMenu.isMine,
              },
              {
                icon: Copy, label: "Copy",
                action: () => { navigator.clipboard.writeText(ctxMenu.content); setCtxMenu(null); },
                show: !ctxMenu.isViewOnce && !ctxMenu.mediaType && !ctxMenu.deletedAt,
              },
              {
                icon: Pencil, label: "Edit",
                action: () => { setEditingId(ctxMenu.msgId); setEditContent(ctxMenu.content); setCtxMenu(null); },
                show: ctxMenu.isMine && !ctxMenu.deletedAt && !ctxMenu.isViewOnce && !ctxMenu.mediaType,
              },
              {
                icon: Trash2, label: "Delete",
                action: () => deleteMessage(ctxMenu.msgId),
                show: ctxMenu.isMine && !ctxMenu.deletedAt,
                danger: true,
              },
            ].filter(item => item.show).map(item => (
              <button key={item.label} onClick={item.action}
                className={cn("w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-surface-container", item.danger ? "text-error" : "text-on-surface")}>
                <item.icon className="w-4 h-4" />{item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  return (
    <UniversalChat
      mode="dm"
      title={otherUser.name}
      subtitle={`@${otherUser.username}`}
      headerIcon={headerIcon}
      onBack={() => router.push("/messages")}
      headerRight={headerRight}
      messages={ucMessages}
      myUserId={myId}
      onSend={handleSend}
      sending={sending}
      inputPlaceholder={`Message ${otherUser.name}…`}
      emptyTitle={`Say hi to ${otherUser.name}!`}
      emptySubtitle="Start a conversation"
      replyTo={ucReplyTo}
      onCancelReply={() => setReplyTo(null)}
      editingId={editingId}
      editContent={editContent}
      onEditChange={setEditContent}
      onSaveEdit={saveEdit}
      onCancelEdit={() => { setEditingId(null); setEditContent(""); }}
      enableImages={true}
      enableVoice={true}
      enableMentions={true}
      onMessageCtx={openCtxMenu}
      bgId={bgPreset}
      customBgUrl={customBgUrl}
      extraOverlays={extraOverlays}
    />
  );
}
