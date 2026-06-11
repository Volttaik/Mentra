"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Globe, Brain, Users, Star, Sparkles, Search } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "My Agents", href: "/agents" },
  { label: "Knowledge Hubs", href: "/agents/hubs" },
  { label: "Projects", href: "/agents/projects" },
  { label: "Workspace", href: "/agents/workspace" },
  { label: "Schedule", href: "/agents/schedule" },
  { label: "Marketplace", href: "/agents/marketplace" },
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
    setLoading(false);
  }, [status]);

  const filtered = listings.filter(l => !search || l.title.toLowerCase().includes(search.toLowerCase()) || l.agent.subject.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen app-ambient-bg">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-20">
        <div className="flex items-center gap-1 mb-8 overflow-x-auto no-scrollbar pb-1">
          {NAV_ITEMS.map(item => <Link key={item.href} href={item.href} className={cn("px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all", item.href === "/agents/marketplace" ? "bg-secondary-container/60 text-on-secondary-container" : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface")}>{item.label}</Link>)}
        </div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-manrope text-on-surface">Agent Marketplace</h1>
          <p className="text-sm text-on-surface-variant mt-1">Subscribe to expert AI agents built and trained by creators</p>
        </div>
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents by name, subject…" className="input-field pl-11 py-3" />
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="elevated-surface rounded-2xl p-5 h-48 animate-pulse" />)}</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-2xl bg-secondary-container/20 flex items-center justify-center mx-auto mb-5">
              <Globe className="h-10 w-10 text-secondary" />
            </div>
            <h2 className="text-lg font-bold font-manrope text-on-surface mb-2">Marketplace coming soon</h2>
            <p className="text-sm text-on-surface-variant max-w-sm mx-auto mb-6">
              Creators can publish their trained agents here. Build an agent, teach it using the Mentra Editor, and list it for others to subscribe.
            </p>
            <Link href="/agents" className="btn-primary inline-flex items-center">
              <Brain className="h-4 w-4" /> Build your own agent
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((listing, i) => (
              <motion.div key={listing.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glow-border elevated-surface rounded-2xl p-5 hover:shadow-elevation-lg transition-all cursor-pointer hover:-translate-y-0.5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary-container to-primary-container flex items-center justify-center text-secondary font-bold font-manrope">
                    {listing.agent.name[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold font-manrope text-on-surface text-sm">{listing.title}</h3>
                    <p className="text-[11px] text-on-surface-variant">{listing.agent.subject}</p>
                  </div>
                  <span className="ml-auto text-[10px] font-medium text-on-surface-variant/60 uppercase tracking-wide">{DOMAIN_LABELS[listing.agent.domain] || listing.agent.domain}</span>
                </div>
                {listing.description && <p className="text-xs text-on-surface-variant mb-3 line-clamp-2">{listing.description}</p>}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] text-on-surface-variant">
                    <Users className="h-3 w-3" />{listing.agent._count.subscriptions} subscribers
                  </div>
                  <span className={cn("text-sm font-bold font-manrope", listing.isPaid ? "text-secondary" : "text-emerald-600 dark:text-emerald-400")}>
                    {listing.isPaid ? `${listing.price} credits` : "Free"}
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
