"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CreditCard, Zap, Brain, Globe, LayoutGrid,
  Check, Loader2, ArrowUpRight,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "My Agents", href: "/agents", icon: Brain },
  { label: "Marketplace", href: "/agents/marketplace", icon: Globe },
  { label: "Workspace", href: "/agents/workspace", icon: LayoutGrid },
];

const CREDIT_PACKS = [
  { id: "200", label: "Starter", credits: 200, price: 500, popular: false },
  { id: "500", label: "Standard", credits: 500, price: 1000, popular: true },
  { id: "1500", label: "Pro", credits: 1500, price: 2500, popular: false },
  { id: "5000", label: "Enterprise", credits: 5000, price: 7500, popular: false },
];

interface UserCredits {
  credits: number;
  plan: string | null;
}

export default function BillingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/me")
      .then(r => r.json())
      .then(data => { setUserData({ credits: data.aiCredits ?? 0, plan: data.plan ?? null }); setLoading(false); });
  }, [status]);

  const handleBuyCreditPack = async (packId: string) => {
    setBuyingId(packId);
    try {
      const res = await fetch("/api/credits/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: packId }),
      });
      const data = await res.json() as { authorizationUrl?: string; error?: string };
      if (!res.ok || !data.authorizationUrl) {
        alert(data.error || "Could not initiate payment");
        return;
      }
      window.location.href = data.authorizationUrl;
    } catch {
      alert("Network error");
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div className="min-h-screen app-ambient-bg">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-20">
        {/* Sub-navigation */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto no-scrollbar pb-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all text-on-surface-variant hover:bg-surface-container hover:text-on-surface">
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Header */}
        <div className="mb-8">
          <p className="text-[11px] text-on-surface-variant/60 uppercase tracking-widest font-medium mb-1">Account</p>
          <h1 className="text-xl font-bold font-manrope text-on-surface">Billing & Credits</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Manage your AI credits for agent conversations.</p>
        </div>

        {/* Credit balance card */}
        <div className="elevated-surface rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary-container/40 flex items-center justify-center">
              <Zap className="h-5 w-5 text-secondary" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-xs text-on-surface-variant mb-0.5">Current balance</p>
              {loading ? (
                <div className="h-8 w-24 bg-surface-container animate-pulse rounded" />
              ) : (
                <p className="text-3xl font-bold font-manrope text-on-surface">{userData?.credits?.toLocaleString() ?? "0"}</p>
              )}
              <p className="text-xs text-on-surface-variant mt-0.5">AI credits remaining</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-outline-variant/10">
            <p className="text-xs text-on-surface-variant">
              Each message with an AI agent uses <strong className="text-on-surface">1 credit</strong>. Credits never expire. New accounts start with <strong className="text-on-surface">50 free credits</strong>.
            </p>
          </div>
        </div>

        {/* Credit packs */}
        <section>
          <h2 className="text-[11px] font-semibold text-on-surface-variant/60 uppercase tracking-widest mb-4">Top Up Credits</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CREDIT_PACKS.map((pack, i) => (
              <motion.div key={pack.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={cn("elevated-surface rounded-2xl p-5 relative", pack.popular && "border border-secondary/30")}>
                {pack.popular && (
                  <span className="absolute -top-2.5 left-5 text-[10px] font-bold text-on-secondary-container bg-secondary-container px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Most popular
                  </span>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-medium text-on-surface-variant mb-0.5">{pack.label}</p>
                    <p className="text-2xl font-bold font-manrope text-on-surface">{pack.credits.toLocaleString()}</p>
                    <p className="text-xs text-on-surface-variant">AI credits</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold font-manrope text-on-surface">₦{pack.price.toLocaleString()}</p>
                    <p className="text-[11px] text-on-surface-variant">
                      ₦{(pack.price / pack.credits * 100).toFixed(1)} / 100 credits
                    </p>
                  </div>
                </div>
                <ul className="space-y-1.5 mb-4">
                  {[`${pack.credits} chat messages`, "Instant delivery", "Never expires"].map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <Check className="h-3 w-3 text-secondary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleBuyCreditPack(pack.id)} disabled={buyingId === pack.id}
                  className={cn("w-full py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-60 flex items-center justify-center gap-2", pack.popular
                    ? "bg-primary text-on-primary hover:opacity-90"
                    : "elevated-surface border border-outline-variant/20 text-on-surface hover:bg-surface-container-high")}>
                  {buyingId === pack.id
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <><CreditCard className="h-3.5 w-3.5" /> Buy {pack.credits.toLocaleString()} credits</>}
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Usage note */}
        <div className="mt-8 elevated-surface rounded-2xl p-4 flex items-start gap-3">
          <ArrowUpRight className="h-4 w-4 text-on-surface-variant shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-on-surface-variant">
              Payments are processed securely via Paystack. Credits are added to your account immediately after successful payment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
