"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Verb thinking indicator ───────────────────────────────────────────────

const DEFAULT_VERBS = [
  "Thinking",
  "Reading Mentra",
  "Searching stacks",
  "Checking articles",
  "Processing",
];

export function VerbThinkingIndicator({
  verbs = DEFAULT_VERBS,
  agentIcon,
}: {
  verbs?: string[];
  agentIcon: React.ReactNode;
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % verbs.length), 2200);
    return () => clearInterval(t);
  }, [verbs.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.22 }}
      className="flex items-center gap-2.5 px-1 py-1"
    >
      <div className="w-7 h-7 rounded-full bg-secondary-container/50 border border-outline-variant/20 flex items-center justify-center shrink-0">
        {agentIcon}
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-2xl rounded-tl-sm bg-surface-container border border-outline-variant/10">
        {/* Pulse dot */}
        <motion.span
          className="block w-[5px] h-[5px] rounded-full bg-secondary/70 shrink-0"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <AnimatePresence mode="wait">
          <motion.span
            key={idx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="text-[12px] text-on-surface-variant font-medium tracking-wide"
          >
            {verbs[idx]}…
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Copy button ───────────────────────────────────────────────────────────

export function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1 rounded-lg text-on-surface-variant/30 hover:text-on-surface-variant hover:bg-surface-container transition-all"
      title="Copy"
    >
      {copied
        ? <Check className="w-3 h-3 text-green-500" />
        : <Copy className="w-3 h-3" />}
    </motion.button>
  );
}

// ─── Markdown message renderer ─────────────────────────────────────────────

export function renderMessage(content: string): React.ReactNode {
  const parts = content.split(/(```[\s\S]*?```|`[^`]+`)/g);
  return (
    <div className="space-y-1">
      {parts.map((part, i) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const inner = part.slice(3, -3);
          const lines = inner.split("\n");
          const lang = lines[0].trim();
          const code = lines.slice(1).join("\n");
          return (
            <div key={i} className="my-1.5 rounded-xl bg-surface-container-highest border border-outline-variant/20 overflow-hidden">
              {lang && (
                <div className="px-3 py-1 border-b border-outline-variant/10 text-[10px] font-medium text-on-surface-variant/50 uppercase tracking-wider">
                  {lang}
                </div>
              )}
              <pre className="p-3 text-[11px] font-mono text-on-surface/80 overflow-x-auto leading-relaxed">{code}</pre>
            </div>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={i} className="px-1.5 py-0.5 rounded-md bg-surface-container text-[11px] font-mono text-secondary">
              {part.slice(1, -1)}
            </code>
          );
        }
        if (!part.trim()) return null;
        return (
          <div key={i}>
            {part.split("\n").map((line, j) => {
              if (!line.trim()) return <div key={j} className="h-1.5" />;
              if (line.startsWith("- ") || line.startsWith("• ")) {
                return (
                  <p key={j} className="flex gap-2 text-[12.5px] leading-relaxed py-[1px]">
                    <span className="text-secondary/60 shrink-0 mt-[3px]">•</span>
                    <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>") }} />
                  </p>
                );
              }
              if (/^\d+\.\s/.test(line)) {
                return (
                  <p key={j} className="text-[12.5px] leading-relaxed py-[1px]"
                    dangerouslySetInnerHTML={{ __html: line.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>") }} />
                );
              }
              if (/^#{1,3}\s/.test(line)) {
                const hLevel = (line.match(/^#+/) || [""])[0].length;
                const text = line.replace(/^#+\s/, "");
                return (
                  <p key={j} className={cn(
                    "font-semibold font-manrope leading-snug py-[2px]",
                    hLevel === 1 ? "text-[14px] mt-1" : "text-[13px]"
                  )}
                    dangerouslySetInnerHTML={{ __html: text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>") }} />
                );
              }
              return (
                <p key={j} className="text-[12.5px] leading-relaxed py-[1px]"
                  dangerouslySetInnerHTML={{ __html: line.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>") }} />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
