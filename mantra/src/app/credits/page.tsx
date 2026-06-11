"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Coins, Zap, Check, Loader2, ArrowLeft, Sparkles } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

const PACKS = [
  {
    id: "starter",
    label: "Starter",
    credits: 50,
    price: "₦500",
    perCredit: "₦10 / credit",
    popular: false,
    description: "Great for trying out AI features",
  },
  {
    id: "popular",
    label: "Popular",
    credits: 100,
    price: "₦1,000",
    perCredit: "₦10 / credit",
    popular: true,
    description: "Most chosen by active learners",
  },
  {
    id: "pro",
    label: "Pro",
    credits: 250,
    price: "₦2,200",
    perCredit: "₦8.80 / credit",
    popular: false,
    description: "Best value for power users",
  },
];

const FEATURES = [
  "AI-powered stack chat & Q&A",
  "Personalised study recommendations",
  "Auto-generated quizzes from your content",
  "Agent conversations & smart summaries",
];

export default function CreditsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [selected, setSelected] = useState("popular");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentCredits, setCurrentCredits] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/register");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/credits/balance")
        .then(r => r.json())
        .then(d => setCurrentCredits(d.credits ?? 0))
        .catch(() => {});
    }
  }, [status]);

  const handlePurchase = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Payment failed. Please try again.");
        return;
      }
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-secondary animate-spin" />
      </div>
    );
  }

  const selectedPack = PACKS.find(p => p.id === selected)!;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-secondary-container rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Coins className="w-7 h-7 text-on-secondary-container" />
          </div>
          <h1 className="font-manrope font-bold text-2xl text-primary mb-2">Buy AI Credits</h1>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto">
            Credits power every AI interaction on Mentra — from stack chat to smart quizzes and personalised recommendations.
          </p>
          {currentCredits !== null && (
            <div className="mt-3 inline-flex items-center gap-2 bg-surface-container px-4 py-2 rounded-full text-sm text-on-surface-variant">
              <Sparkles className="w-3.5 h-3.5 text-secondary" />
              You currently have <span className="font-semibold text-primary">{currentCredits} credits</span>
            </div>
          )}
        </div>

        {/* What credits unlock */}
        <div className="bg-surface-container-low border border-outline-variant/15 rounded-2xl p-5 mb-6">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">What you unlock</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FEATURES.map(f => (
              <div key={f} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                <p className="text-sm text-on-surface">{f}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Packs */}
        <div className="space-y-3 mb-6">
          {PACKS.map((pack, i) => (
            <motion.button
              key={pack.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelected(pack.id)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all relative",
                selected === pack.id
                  ? "border-secondary bg-secondary-container/15"
                  : "border-outline-variant/20 hover:border-outline-variant/50 bg-surface-container-low"
              )}
            >
              {pack.popular && (
                <span className="absolute -top-2.5 left-4 text-[10px] font-bold bg-secondary text-on-secondary px-2.5 py-0.5 rounded-full">
                  Most Popular
                </span>
              )}
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                selected === pack.id ? "border-secondary bg-secondary" : "border-outline-variant/50"
              )}>
                {selected === pack.id && <div className="w-2 h-2 rounded-full bg-on-secondary" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <p className="font-manrope font-bold text-base text-primary">{pack.label}</p>
                  <p className="text-xs text-on-surface-variant">{pack.description}</p>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">{pack.perCredit}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-manrope font-bold text-lg text-primary">{pack.credits}</p>
                <p className="text-xs text-on-surface-variant">credits</p>
                <p className="font-semibold text-sm text-secondary mt-0.5">{pack.price}</p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-error-container/30 border border-error/30 rounded-xl px-4 py-3 mb-4">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handlePurchase}
          disabled={loading}
          className="w-full py-4 bg-secondary text-on-secondary rounded-2xl font-manrope font-semibold text-base hover:opacity-90 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Get {selectedPack.credits} credits for {selectedPack.price}
            </>
          )}
        </button>
        <p className="text-center text-xs text-on-surface-variant mt-3">
          Secure payment via Paystack. Credits are added instantly after payment.
        </p>
      </div>
    </div>
  );
}
