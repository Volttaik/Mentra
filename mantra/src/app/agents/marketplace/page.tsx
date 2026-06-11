"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Globe, Brain, Search, LayoutGrid, X, Zap, Users,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "My Agents", href: "/agents", icon: Brain },
  { label: "Marketplace", href: "/agents/marketplace", icon: Globe },
  { label: "Workspace", href: "/agents/workspace", icon: LayoutGrid },
];

interface Listing {
  id: string; title: string; description: string | null; price: number; isPaid: boolean; coverImage: string | null;
  agent: { name: string; subject: string; domain: string; owner: { name: string; username: string; image: string | null }; _count: { subscriptions: number } };
}

const DOMAIN_LABELS: Record<string, string> = { education: "Education", research: "Research", business: "Business", general: "General" };

export default function MarketplacePage() {
  const { status } = useSession();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/custom-agents/marketplace")
      .then(r => r.json())
      .then(data => { setListings(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [status]);

  const filtered = listings.filter(l => !search || l.title.toLowerCase().includes(search.toLowerCase()) || l.agent.subject.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen app-ambient-bg">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-20">
        {/* Sub-navigation */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto no-scrollbar pb-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all",
                  "text-on-surface-variant hover:bg-surface-container hover:text-on-surface")}>
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-lg font-bold font-manrope text-on-surface">Agent Marketplace</h1>
            <p className="text-xs text-on-surface-variant mt-0.5">Subscribe to expert AI agents built and trained by creators</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-on-surface-variant" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search agents…"
              className="pl-9 pr-9 py-2 rounded-xl elevated-surface border border-outline-variant/20 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:border-secondary/40 w-full sm:w-56 transition-colors" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="elevated-surface rounded-2xl p-5 h-48 animate-pulse" />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-2xl bg-secondary-container/20 flex items-center justify-center mx-auto mb-5">
              <Globe className="h-10 w-10 text-secondary" />
            </div>
            <h2 className="text-lg font-bold font-manrope text-on-surface mb-2">Marketplace coming soon</h2>
            <p className="text-sm text-on-surface-variant max-w-sm mx-auto mb-6">
              Creators can publish their trained agents here. Build an agent, teach it, and list it for others to subscribe.
            </p>
            <Link href="/agents" className="btn-primary inline-flex items-center gap-2">
              <Brain className="h-4 w-4" /> Build your own agent
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((listing, i) => (
              <motion.div key={listing.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="elevated-surface rounded-2xl p-5 hover:shadow-elevation-lg transition-all cursor-pointer hover:-translate-y-0.5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary-container to-primary-container flex items-center justify-center text-secondary font-bold font-manrope shrink-0">
                    {listing.agent.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold font-manrope text-on-surface text-sm truncate">{listing.title}</h3>
                    <p className="text-[11px] text-on-surface-variant truncate">{listing.agent.subject}</p>
                  </div>
                  <span className="text-[10px] font-medium text-on-surface-variant/60 uppercase tracking-wide shrink-0">
                    {DOMAIN_LABELS[listing.agent.domain] || listing.agent.domain}
                  </span>
                </div>
                {listing.description && <p className="text-xs text-on-surface-variant mb-3 line-clamp-2">{listing.description}</p>}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] text-on-surface-variant">
                    <Users className="h-3 w-3" />{listing.agent._count.subscriptions} subscribers
                  </div>
                  <span className={cn("text-sm font-bold font-manrope flex items-center gap-1", listing.isPaid ? "text-secondary" : "text-emerald-600 dark:text-emerald-400")}>
                    {listing.isPaid ? <><Zap className="h-3 w-3" />{listing.price} credits</> : "Free"}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
