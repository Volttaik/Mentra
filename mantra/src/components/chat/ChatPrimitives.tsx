"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Agent thinking states with icons ──────────────────────────────────────

type ThinkingState = "thinking" | "reading" | "searching" | "processing";

interface VerbEntry {
  label: string;
  state: ThinkingState;
}

const DEFAULT_VERBS: VerbEntry[] = [
  { label: "Thinking",         state: "thinking"   },
  { label: "Reading Mentra",   state: "reading"    },
  { label: "Searching stacks", state: "searching"  },
  { label: "Checking articles",state: "reading"    },
  { label: "Processing",       state: "processing" },
];

// Three-dot wave animation (like iMessage / Notion AI)
function WaveDots() {
  return (
    <span className="flex items-center gap-[3px]">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="block w-[5px] h-[5px] rounded-full bg-secondary"
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay: i * 0.18,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}

// Horizontal bar scan animation — used for "reading"
function ScanBars() {
  return (
    <span className="flex items-center gap-[2px]">
      {[3, 5, 4, 6, 3, 5].map((h, i) => (
        <motion.span
          key={i}
          className="block w-[2.5px] rounded-full bg-secondary"
          style={{ height: h * 1.5 }}
          animate={{ scaleY: [0.4, 1.6, 0.4], opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 0.85,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}

// Orbit spinner — used for "searching"
function OrbitRing() {
  return (
    <span className="relative flex items-center justify-center w-[18px] h-[18px]">
      <motion.span
        className="absolute w-[14px] h-[14px] rounded-full border-2 border-transparent border-t-secondary"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
      />
      <span className="block w-[5px] h-[5px] rounded-full bg-secondary/50" />
    </span>
  );
}

// Pulse ripple — used for "processing"
function PulseRipple() {
  return (
    <span className="relative flex items-center justify-center w-[18px] h-[18px]">
      <motion.span
        className="absolute block w-[14px] h-[14px] rounded-full border border-secondary/40"
        animate={{ scale: [0.6, 1.5], opacity: [0.8, 0] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
      />
      <span className="block w-[6px] h-[6px] rounded-full bg-secondary" />
    </span>
  );
}

function StateIcon({ state }: { state: ThinkingState }) {
  switch (state) {
    case "reading":    return <ScanBars />;
    case "searching":  return <OrbitRing />;
    case "processing": return <PulseRipple />;
    default:           return <WaveDots />;
  }
}

// ─── Main VerbThinkingIndicator ─────────────────────────────────────────────

export function VerbThinkingIndicator({
  verbs: verbsProp,
  agentIcon,
}: {
  verbs?: string[];
  agentIcon: React.ReactNode;
}) {
  const verbs: VerbEntry[] = verbsProp
    ? verbsProp.map(v => ({ label: v, state: "thinking" as ThinkingState }))
    : DEFAULT_VERBS;

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % verbs.length), 2400);
    return () => clearInterval(t);
  }, [verbs.length]);

  const current = verbs[idx];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-2.5 px-1 py-1"
    >
      <div className="w-7 h-7 rounded-full bg-secondary-container/50 border border-outline-variant/20 flex items-center justify-center shrink-0">
        {agentIcon}
      </div>

      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-surface-container border border-outline-variant/10 min-w-[140px]">
        <AnimatePresence mode="wait">
          <motion.span
            key={`icon-${idx}`}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center shrink-0"
          >
            <StateIcon state={current.state} />
          </motion.span>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.span
            key={`label-${idx}`}
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="text-[12px] text-on-surface-variant font-medium tracking-wide whitespace-nowrap"
          >
            {current.label}
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
