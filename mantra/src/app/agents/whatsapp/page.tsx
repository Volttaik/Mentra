"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  MessageCircle, Brain, Plus, Loader2, Trash2,
  CheckCircle2, Copy, RefreshCw, ExternalLink,
  BookOpen, FolderKanban, LayoutGrid, Calendar, BarChart2,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import { cn } from "@/lib/utils";

const WHATSAPP_NUMBER = "2348061938576";

const NAV_ITEMS = [
  { label: "My Agents", href: "/agents", icon: Brain },
  { label: "Knowledge Hubs", href: "/agents/hubs", icon: BookOpen },
  { label: "Projects", href: "/agents/projects", icon: FolderKanban },
  { label: "Workspace", href: "/agents/workspace", icon: LayoutGrid },
  { label: "Schedule", href: "/agents/schedule", icon: Calendar },
  { label: "Analytics", href: "/agents/analytics", icon: BarChart2 },
  { label: "WhatsApp", href: "/agents/whatsapp", icon: MessageCircle },
];

interface AgentCode {
  id: string;
  code: string;
  agentId: string;
  userId: string;
  used: boolean;
  phoneNumber: string | null;
  createdAt: string;
  usedAt: string | null;
}

interface Agent {
  id: string;
  name: string;
  subject: string;
}

export default function WhatsAppPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [codes, setCodes] = useState<AgentCode[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const loadCodes = useCallback(async () => {
    try {
      const res = await fetch("/api/agents/whatsapp");
      if (res.ok) {
        const data = await res.json() as { codes: AgentCode[] };
        setCodes(data.codes);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoadingAgents(true);
    Promise.all([
      fetch("/api/custom-agents").then(r => r.json()),
      loadCodes(),
    ])
      .then(([agentsData]) => setAgents(Array.isArray(agentsData) ? agentsData : []))
      .finally(() => setLoadingAgents(false));
  }, [status, loadCodes]);

  const handleGenerate = async (agentId: string) => {
    setGeneratingFor(agentId);
    try {
      const res = await fetch("/api/agents/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      const data = await res.json() as { code?: AgentCode; error?: string };
      if (!res.ok || !data.code) { alert(data.error || "Failed to generate code"); return; }
      setCodes(prev => {
        const filtered = prev.filter(c => !(c.agentId === agentId && !c.used));
        return [...filtered, data.code!];
      });
    } catch { alert("Network error"); }
    finally { setGeneratingFor(null); }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/agents/whatsapp?id=${id}`, { method: "DELETE" });
      setCodes(prev => prev.filter(c => c.id !== id));
    } catch { /* ignore */ }
    finally { setDeletingId(null); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const getCodeForAgent = (agentId: string) =>
    codes.find(c => c.agentId === agentId && !c.used) ?? null;

  return (
    <div className="min-h-screen app-ambient-bg">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-20">
        {/* Sub-navigation */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto no-scrollbar pb-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = item.href === "/agents/whatsapp";
            return (
              <Link key={item.href} href={item.href}
                className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all", active
                  ? "bg-secondary-container/60 text-on-secondary-container"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                )}>
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Header */}
        <div className="mb-8">
          <p className="text-[11px] text-on-surface-variant/60 uppercase tracking-widest font-medium mb-1">Connect</p>
          <h1 className="text-xl font-bold font-manrope text-on-surface">WhatsApp</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Chat with your AI agents directly from WhatsApp.</p>
        </div>

        {/* Contact card */}
        <div className="flex items-center justify-between elevated-surface rounded-2xl px-5 py-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
              <MessageCircle className="h-5 w-5 text-green-500" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[13px] font-medium text-on-surface">Mentra on WhatsApp</p>
              <p className="text-[12px] text-on-surface-variant">+{WHATSAPP_NUMBER}</p>
            </div>
          </div>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl elevated-surface border border-outline-variant/30 text-xs font-medium text-on-surface hover:bg-surface-container-high transition-colors">
            <ExternalLink className="h-3.5 w-3.5" /> Open WhatsApp
          </a>
        </div>

        {/* How it works */}
        <section className="mb-8">
          <h2 className="text-[11px] font-semibold text-on-surface-variant/60 uppercase tracking-widest mb-4">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { step: "1", title: "Generate a code", desc: "Pick an agent below and generate a 12-character activation code." },
              { step: "2", title: "Send the command", desc: "Message the Mentra number: /int YOURCODE12" },
              { step: "3", title: "Start chatting", desc: "Your agent is now active. Every message goes straight to it." },
            ].map(item => (
              <div key={item.step} className="elevated-surface rounded-2xl p-4">
                <span className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">Step {item.step}</span>
                <p className="text-[13px] font-medium text-on-surface mt-1">{item.title}</p>
                <p className="text-[12px] text-on-surface-variant mt-1 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 bg-secondary-container/20 rounded-xl px-4 py-3">
            <p className="text-[12px] text-on-surface-variant">
              <span className="font-medium text-on-surface">Commands: </span>
              <code className="bg-surface-container px-1.5 py-0.5 rounded text-[11px]">/int YOUR_CODE</code> to activate ·{" "}
              <code className="bg-surface-container px-1.5 py-0.5 rounded text-[11px]">/reset NEW_CODE</code> to switch ·{" "}
              say <code className="bg-surface-container px-1.5 py-0.5 rounded text-[11px]">hi</code> for instructions
            </p>
          </div>
        </section>

        {/* Agent codes */}
        <section>
          <h2 className="text-[11px] font-semibold text-on-surface-variant/60 uppercase tracking-widest mb-4">Agent Activation Codes</h2>

          {loadingAgents ? (
            <div className="flex items-center gap-3 text-on-surface-variant text-sm py-10 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading agents…
            </div>
          ) : agents.length === 0 ? (
            <div className="elevated-surface rounded-2xl p-10 text-center border border-dashed border-outline-variant/30">
              <div className="w-10 h-10 rounded-2xl bg-secondary-container/30 flex items-center justify-center mx-auto mb-3">
                <Brain className="h-4 w-4 text-secondary/50" strokeWidth={1.5} />
              </div>
              <p className="text-[13px] font-medium text-on-surface mb-1">No agents yet</p>
              <p className="text-[12px] text-on-surface-variant">
                <Link href="/agents" className="text-secondary hover:underline">Create an agent</Link> first.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {agents.map(agent => {
                const activeCode = getCodeForAgent(agent.id);
                const isGenerating = generatingFor === agent.id;

                return (
                  <div key={agent.id}
                    className="elevated-surface rounded-2xl px-4 py-4 flex items-center gap-3 flex-wrap sm:flex-nowrap">
                    <div className="w-8 h-8 rounded-xl bg-secondary-container/40 flex items-center justify-center shrink-0">
                      <Brain className="h-3.5 w-3.5 text-secondary" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-on-surface truncate">{agent.name}</p>
                      <p className="text-[12px] text-on-surface-variant truncate">{agent.subject}</p>
                    </div>

                    {activeCode ? (
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <div className="flex items-center gap-1.5 bg-surface-container rounded-xl px-3 py-1.5">
                          <span className="text-[13px] font-mono font-semibold tracking-wider text-on-surface">{activeCode.code}</span>
                          {activeCode.used && <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />}
                        </div>
                        <button onClick={() => copyCode(activeCode.code)}
                          className="h-8 w-8 rounded-xl elevated-surface flex items-center justify-center hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-surface"
                          title="Copy code">
                          {copiedCode === activeCode.code
                            ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => handleGenerate(agent.id)} disabled={isGenerating}
                          className="h-8 w-8 rounded-xl elevated-surface flex items-center justify-center hover:bg-surface-container-high transition-colors text-on-surface-variant disabled:opacity-40"
                          title="Regenerate">
                          {isGenerating
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <RefreshCw className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => handleDelete(activeCode.id)} disabled={deletingId === activeCode.id}
                          className="h-8 w-8 rounded-xl elevated-surface flex items-center justify-center hover:bg-error/10 hover:text-error transition-colors text-on-surface-variant disabled:opacity-40"
                          title="Remove">
                          {deletingId === activeCode.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => handleGenerate(agent.id)} disabled={isGenerating}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary-container/40 hover:bg-secondary-container/60 text-xs font-medium text-on-secondary-container transition-colors disabled:opacity-50 shrink-0">
                        {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                        Generate Code
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
