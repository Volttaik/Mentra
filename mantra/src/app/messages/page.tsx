"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, Search, Plus, X,
  CheckCheck, Clock, BadgeCheck,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";

interface OtherUser {
  id: string; name: string; username: string; image: string | null; isVerified: boolean;
}

interface Convo {
  id: string;
  otherUser: OtherUser;
  lastMessage: { id: string; content: string; createdAt: string; senderId: string; isMine: boolean } | null;
  lastMessageAt: string;
}

interface SearchUser {
  id: string; name: string; username: string; image: string | null; isVerified: boolean; university?: string;
}

function Avatar({ user, size = "md" }: { user: { name: string; image: string | null }; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "w-9 h-9 text-xs" : size === "lg" ? "w-14 h-14 text-base" : "w-11 h-11 text-sm";
  const initials = user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className={cn("rounded-full bg-secondary-container flex items-center justify-center overflow-hidden shrink-0 border-2 border-outline-variant/20", sz)}>
      {user.image
        ? <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
        : <span className="font-bold text-on-secondary-container font-manrope">{initials}</span>}
    </div>
  );
}

export default function MessagesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Convo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/dm/conversations")
      .then(r => r.json())
      .then(d => { setConversations(d.conversations ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    if (!showNewChat) { setSearchQuery(""); setSearchResults([]); return; }
    setTimeout(() => searchRef.current?.focus(), 100);
  }, [showNewChat]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!showNewChat) return;
      setSearching(true);
      fetch(`/api/dm/search?q=${encodeURIComponent(searchQuery)}`)
        .then(r => r.json())
        .then(d => { setSearchResults(d.users ?? []); setSearching(false); })
        .catch(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, showNewChat]);

  const startChat = async (targetUserId: string) => {
    setStarting(targetUserId);
    const res = await fetch("/api/dm/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId }),
    });
    const data = await res.json();
    if (data.conversation?.id) router.push(`/messages/${data.conversation.id}`);
    else setStarting(null);
  };

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 pb-24 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-manrope text-on-surface">Messages</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">Chat with people you follow</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => setShowNewChat(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-on-primary font-semibold text-sm shadow-md"
          >
            <Plus className="w-4 h-4" />
            New chat
          </motion.button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-surface-container animate-pulse">
                <div className="w-11 h-11 rounded-full bg-outline-variant/20" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-32 rounded bg-outline-variant/20" />
                  <div className="h-3 w-48 rounded bg-outline-variant/15" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-secondary-container/50 flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-secondary/60" />
            </div>
            <h2 className="text-lg font-semibold font-manrope text-on-surface mb-2">No conversations yet</h2>
            <p className="text-sm text-on-surface-variant max-w-xs mb-6">
              Follow someone and have them follow you back to start a conversation.
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNewChat(true)}
              className="px-6 py-3 rounded-2xl bg-primary text-on-primary font-semibold text-sm"
            >
              Start a chat
            </motion.button>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map(c => (
              <motion.div
                key={c.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/messages/${c.id}`)}
                className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-surface-container cursor-pointer transition-colors group"
              >
                <Avatar user={c.otherUser} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="font-semibold text-sm text-on-surface font-manrope truncate">{c.otherUser.name}</span>
                    {c.otherUser.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {c.lastMessage?.isMine && (
                      <CheckCheck className="w-3 h-3 text-primary/60 shrink-0" />
                    )}
                    <p className="text-xs text-on-surface-variant truncate">
                      {c.lastMessage ? c.lastMessage.content : <span className="italic">No messages yet</span>}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] text-on-surface-variant/60">
                    {c.lastMessage ? timeAgo(c.lastMessage.createdAt) : ""}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showNewChat && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowNewChat(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.96 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest rounded-t-3xl border-t border-outline-variant/20 shadow-2xl max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-outline-variant/15">
                <h2 className="text-base font-bold font-manrope text-on-surface">New message</h2>
                <button onClick={() => setShowNewChat(false)} className="p-2 rounded-xl hover:bg-surface-container text-on-surface-variant transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-4 pt-3 pb-2">
                <div className="flex items-center gap-2 bg-surface-container rounded-xl px-3 py-2.5 border border-outline-variant/20">
                  <Search className="w-4 h-4 text-on-surface-variant/50 shrink-0" />
                  <input
                    ref={searchRef}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by name or @username..."
                    className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none"
                  />
                  {searching && <Clock className="w-3.5 h-3.5 text-on-surface-variant/40 animate-spin" />}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-6">
                {searchResults.length === 0 && searchQuery && !searching ? (
                  <p className="text-center text-sm text-on-surface-variant py-8">No mutual follows found for &quot;{searchQuery}&quot;</p>
                ) : searchResults.length === 0 && !searchQuery ? (
                  <p className="text-center text-sm text-on-surface-variant/50 py-8">Type to search people you follow (and follow you back)</p>
                ) : (
                  <div className="space-y-1 pt-1">
                    {searchResults.map(u => (
                      <motion.button
                        key={u.id}
                        whileTap={{ scale: 0.97 }}
                        disabled={starting === u.id}
                        onClick={() => startChat(u.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container transition-colors text-left"
                      >
                        <Avatar user={u} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-sm text-on-surface truncate">{u.name}</span>
                            {u.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />}
                          </div>
                          <p className="text-xs text-on-surface-variant">@{u.username}{u.university ? ` · ${u.university}` : ""}</p>
                        </div>
                        {starting === u.id
                          ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          : <MessageCircle className="w-4 h-4 text-on-surface-variant/40" />}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
