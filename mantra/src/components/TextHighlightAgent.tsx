"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useSession } from "next-auth/react";

interface PopupPos { x: number; y: number; }

export default function TextHighlightAgent() {
  const { status } = useSession();
  const [popup, setPopup] = useState<{ pos: PopupPos; text: string } | null>(null);
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentText, setAgentText] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (status !== "authenticated") return;

    const handleMouseUp = (e: MouseEvent) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const sel = window.getSelection();
        const text = sel?.toString().trim() ?? "";

        if (text.length < 5 || text.length > 800) {
          setPopup(null);
          return;
        }

        const target = e.target as HTMLElement;
        if (
          target.closest("input, textarea, [contenteditable], button, a, nav, header") ||
          target.closest("[data-no-highlight]")
        ) {
          setPopup(null);
          return;
        }

        const range = sel?.getRangeAt(0);
        if (!range) return;
        const rect = range.getBoundingClientRect();
        const x = rect.left + rect.width / 2 + window.scrollX;
        const y = rect.top + window.scrollY - 12;

        setPopup({ pos: { x, y }, text });
      }, 200);
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-highlight-popup]")) {
        setPopup(null);
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
      clearTimeout(timerRef.current);
    };
  }, [status]);

  const askAgent = async (text: string) => {
    setAgentText(text);
    setAgentOpen(true);
    setPopup(null);
    setReply("");
    setLoading(true);
    window.getSelection()?.removeAllRanges();
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Explain or help me understand this: "${text}"` }),
      });
      const data = await res.json();
      setReply(data.reply ?? "Sorry, I couldn't help with that.");
    } catch {
      setReply("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status !== "authenticated") return null;

  return (
    <>
      <AnimatePresence>
        {popup && (
          <motion.div
            data-highlight-popup="true"
            key="popup"
            initial={{ opacity: 0, scale: 0.85, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 4 }}
            transition={{ duration: 0.12 }}
            style={{ position: "absolute", left: popup.pos.x, top: popup.pos.y, transform: "translateX(-50%) translateY(-100%)", zIndex: 9000 }}
            className="pointer-events-auto"
          >
            <button
              onClick={() => askAgent(popup.text)}
              className="flex items-center gap-1.5 bg-on-surface text-surface text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg hover:bg-primary hover:text-on-primary transition-all whitespace-nowrap"
            >
              <Sparkles className="w-3 h-3" />
              Ask Agent
            </button>
            <div className="w-2 h-2 bg-on-surface rotate-45 mx-auto -mt-1" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {agentOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[8998] bg-black/20"
              onClick={() => setAgentOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ type: "spring", damping: 24, stiffness: 300 }}
              className="fixed bottom-24 right-5 z-[8999] w-[min(380px,calc(100vw-40px))] bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/20 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10 bg-secondary-container/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-secondary" />
                  <p className="text-xs font-semibold text-primary">Agent</p>
                </div>
                <button onClick={() => setAgentOpen(false)} className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div className="bg-surface-container rounded-xl px-3 py-2">
                  <p className="text-[11px] text-on-surface-variant mb-0.5 font-medium uppercase tracking-wider">Selected text</p>
                  <p className="text-xs text-on-surface line-clamp-3">&ldquo;{agentText}&rdquo;</p>
                </div>
                <div className="min-h-[60px]">
                  {loading ? (
                    <div className="flex gap-1 items-center py-2">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-secondary/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-on-surface leading-relaxed">{reply}</p>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
