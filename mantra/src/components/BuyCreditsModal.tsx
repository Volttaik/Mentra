"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Check, Loader2, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

const PACKS = [
  { id: "starter", label: "Starter", credits: 10, price: "₦500", popular: false, perCredit: "₦50/credit" },
  { id: "popular", label: "Popular", credits: 25, price: "₦1,200", popular: true, perCredit: "₦48/credit" },
  { id: "pro", label: "Pro", credits: 60, price: "₦2,500", popular: false, perCredit: "₦42/credit" },
];

interface Props {
  currentCredits: number;
  onClose: () => void;
  onSuccess: (newCredits: number) => void;
}

export default function BuyCreditsModal({ currentCredits, onClose, onSuccess }: Props) {
  const [selected, setSelected] = useState("popular");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/15 w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-secondary-container flex items-center justify-center">
              <Zap className="w-5 h-5 text-on-secondary-container" />
            </div>
            <div>
              <h2 className="font-manrope font-bold text-lg text-primary">Buy AI Credits</h2>
              <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
                <Coins className="w-3 h-3" />
                Current balance: {currentCredits} credit{currentCredits !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Packs */}
        <div className="px-6 pb-4 space-y-3">
          <p className="text-xs text-on-surface-variant mb-4">
            Credits are used for AI chat (1/message) and quiz generation (5/quiz).
          </p>

          {PACKS.map((pack) => (
            <motion.button
              key={pack.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(pack.id)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left relative",
                selected === pack.id
                  ? "border-secondary/50 bg-secondary-container/20 shadow-sm"
                  : "border-outline-variant/20 bg-surface-container hover:bg-surface-container-high hover:border-outline-variant/40"
              )}
            >
              {pack.popular && (
                <span className="absolute -top-2.5 left-4 text-[10px] font-bold bg-secondary text-on-secondary px-2.5 py-0.5 rounded-full font-manrope">
                  BEST VALUE
                </span>
              )}
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center font-manrope font-bold text-base shrink-0",
                selected === pack.id ? "bg-secondary text-on-secondary" : "bg-surface-container-high text-on-surface-variant"
              )}>
                {pack.credits}
              </div>
              <div className="flex-1">
                <p className="font-manrope font-semibold text-sm text-primary">{pack.label} Pack</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{pack.credits} credits · {pack.perCredit}</p>
              </div>
              <div className="text-right">
                <p className="font-manrope font-bold text-base text-primary">{pack.price}</p>
              </div>
              {selected === pack.id && (
                <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-on-secondary" />
                </div>
              )}
            </motion.button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 space-y-3">
          {error && (
            <p className="text-xs text-error bg-error-container/20 px-3 py-2 rounded-xl border border-error/20">
              {error}
            </p>
          )}
          <button
            onClick={handlePurchase}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3 rounded-xl font-manrope font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-all"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Processing…</>
            ) : (
              <><Zap className="w-4 h-4" />Pay with Paystack</>
            )}
          </button>
          <p className="text-center text-[11px] text-on-surface-variant/50">
            Secure payment via Paystack. Credits are added instantly after payment.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
