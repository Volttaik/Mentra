"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  BarChart2, Brain, TrendingUp, Flame, Clock, MessageSquare,
  BookOpen, ArrowUpRight, Target, Brain as BrainIcon,
  Calendar, LayoutGrid, FolderKanban, Globe, MessageCircle,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "My Agents", href: "/agents", icon: Brain },
  { label: "Knowledge Hubs", href: "/agents/hubs", icon: BookOpen },
  { label: "Projects", href: "/agents/projects", icon: FolderKanban },
  { label: "Workspace", href: "/agents/workspace", icon: LayoutGrid },
  { label: "Schedule", href: "/agents/schedule", icon: Calendar },
  { label: "Analytics", href: "/agents/analytics", icon: BarChart2 },
  { label: "WhatsApp", href: "/agents/whatsapp", icon: MessageCircle },
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface AnalyticsData {
  totalMessages: number;
  totalConversations: number;
  creditsUsed: number;
  creditsBalance: number;
  streakDays: number;
  messagesByDay: { date: string; count: number }[];
  topAgents: { agentId: string; agentName: string; subject: string; messageCount: number }[];
}

function buildWeeklyChart(messagesByDay: { date: string; count: number }[]) {
  const last7 = messagesByDay.slice(-7);
  return last7.map(d => ({
    day: DAY_LABELS[new Date(d.date + "T00:00:00").getDay()],
    messages: d.count,
  }));
}

function buildMonthlyChart(messagesByDay: { date: string; count: number }[]) {
  const last28 = messagesByDay.slice(-28);
  const weeks = [];
  for (let w = 0; w < 4; w++) {
    const slice = last28.slice(w * 7, w * 7 + 7);
    const sessions = slice.reduce((sum, d) => sum + (d.count > 0 ? 1 : 0), 0);
    weeks.push({ week: `W${w + 1}`, sessions });
  }
  return weeks;
}

function StatCard({ icon: Icon, label, value, delta, loading }: {
  icon: React.ElementType; label: string; value: string; delta: string; loading?: boolean;
}) {
  return (
    <div className="elevated-surface rounded-2xl px-4 py-4 flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-secondary-container/40 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-secondary" strokeWidth={1.5} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-on-surface-variant mb-0.5">{label}</p>
        {loading ? (
          <div className="h-5 w-14 bg-surface-container animate-pulse rounded mt-1" />
        ) : (
          <p className="text-xl font-semibold font-manrope tracking-tight leading-none text-on-surface">{value}</p>
        )}
        <p className="text-[11px] text-on-surface-variant mt-1 flex items-center gap-1">
          <ArrowUpRight className="h-2.5 w-2.5 shrink-0" /> {delta}
        </p>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="elevated-surface rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-medium mb-1 text-on-surface">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-on-surface-variant">
          {p.name}: <span className="text-on-surface font-medium">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/agents/analytics")
      .then(r => r.json())
      .then(setAnalytics)
      .finally(() => setIsLoading(false));
  }, [status]);

  const weeklyData = analytics ? buildWeeklyChart(analytics.messagesByDay) : [];
  const monthlyData = analytics ? buildMonthlyChart(analytics.messagesByDay) : [];
  const hasChartData = weeklyData.some(d => d.messages > 0);

  const subjectBreakdown = (analytics?.topAgents ?? []).map(a => {
    const max = Math.max(...(analytics?.topAgents ?? []).map(x => x.messageCount), 1);
    return {
      ...a,
      progress: Math.round((a.messageCount / max) * 100),
    };
  });

  const dynamicStats = [
    {
      icon: MessageSquare, label: "Total messages",
      value: analytics ? analytics.totalMessages.toLocaleString() : "—",
      delta: "all time",
    },
    {
      icon: Clock, label: "Conversations",
      value: analytics ? analytics.totalConversations.toLocaleString() : "—",
      delta: "all time",
    },
    {
      icon: Flame, label: "Study streak",
      value: analytics ? `${analytics.streakDays} days` : "—",
      delta: analytics?.streakDays && analytics.streakDays > 0 ? "Keep it up!" : "Start today!",
    },
    {
      icon: Target, label: "Credits balance",
      value: analytics ? analytics.creditsBalance.toLocaleString() : "—",
      delta: `${analytics?.creditsUsed ?? 0} used total`,
    },
  ];

  return (
    <div className="min-h-screen app-ambient-bg">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 pt-8 pb-20">
        {/* Sub-navigation */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto no-scrollbar pb-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = item.href === "/agents/analytics";
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
          <p className="text-[11px] text-on-surface-variant/60 uppercase tracking-widest font-medium mb-1">Analytics</p>
          <h1 className="text-xl font-bold font-manrope text-on-surface">Your Progress</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Track how your studying is paying off over time.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {dynamicStats.map(s => (
            <StatCard key={s.label} {...s} loading={isLoading} />
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="elevated-surface rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[13px] font-medium text-on-surface">Messages this week</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">Questions asked per day</p>
              </div>
              <div className="w-7 h-7 rounded-lg bg-secondary-container/40 flex items-center justify-center">
                <BarChart2 className="h-3.5 w-3.5 text-secondary" strokeWidth={1.5} />
              </div>
            </div>
            {isLoading ? (
              <div className="h-40 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
              </div>
            ) : !hasChartData ? (
              <div className="h-40 flex items-center justify-center">
                <p className="text-[12px] text-on-surface-variant">No messages this week yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weeklyData} barSize={20}>
                  <CartesianGrid vertical={false} strokeOpacity={0.2} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--surface-container))" }} />
                  <Bar dataKey="messages" name="Messages" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="elevated-surface rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[13px] font-medium text-on-surface">Active days this month</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">Days with messages per week</p>
              </div>
              <div className="w-7 h-7 rounded-lg bg-secondary-container/40 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-secondary" strokeWidth={1.5} />
              </div>
            </div>
            {isLoading ? (
              <div className="h-40 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={monthlyData}>
                  <CartesianGrid vertical={false} strokeOpacity={0.2} />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    dataKey="sessions"
                    name="Active days"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--secondary))", strokeWidth: 0, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Agent breakdown */}
        <section>
          <h2 className="text-[11px] font-semibold text-on-surface-variant/60 uppercase tracking-widest mb-4">Agent Breakdown</h2>
          {isLoading ? (
            <div className="elevated-surface rounded-2xl overflow-hidden divide-y divide-outline-variant/10">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-7 h-7 rounded-lg bg-surface-container animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 bg-surface-container animate-pulse rounded" />
                    <div className="h-1.5 w-full bg-surface-container animate-pulse rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : subjectBreakdown.length === 0 ? (
            <div className="elevated-surface rounded-2xl p-10 text-center border border-dashed border-outline-variant/30">
              <p className="text-[12px] text-on-surface-variant">Create agents and start chatting to see your breakdown here.</p>
            </div>
          ) : (
            <div className="elevated-surface rounded-2xl overflow-hidden divide-y divide-outline-variant/10">
              {subjectBreakdown.map(item => (
                <div key={item.agentId}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-surface-container transition-colors cursor-pointer"
                  onClick={() => router.push(`/agents/${item.agentId}/chat`)}
                >
                  <div className="w-7 h-7 rounded-lg bg-secondary-container/40 flex items-center justify-center shrink-0">
                    <BookOpen className="h-3 w-3 text-secondary" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <p className="text-[13px] font-medium text-on-surface">{item.agentName}</p>
                        <p className="text-[11px] text-on-surface-variant">{item.subject}</p>
                      </div>
                      <span className="text-[11px] text-on-surface-variant shrink-0 ml-4">
                        {item.messageCount} msgs · {item.progress}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                      <div className="h-full rounded-full bg-secondary" style={{ width: `${item.progress}%` }} />
                    </div>
                  </div>
                  <Brain className="h-3.5 w-3.5 text-on-surface-variant shrink-0" strokeWidth={1.5} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
