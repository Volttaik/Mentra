"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp, Users, BookOpen, MessageSquare, Wallet,
  ArrowUpRight, Loader2, Building, Check, AlertTriangle,
  CreditCard, ChevronDown, X, Eye, RefreshCw, CircleDollarSign,
  Clock, ShieldCheck,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { cn, formatNumber } from "@/lib/utils";

interface Stats {
  totalRevenue: number;
  totalBuyers: number;
  paidStackCount: number;
}
interface PaidStack {
  id: string; title: string; slug: string;
  banner: string | null; profile: string | null;
  price: number | null; buyerCount: number;
}
interface RecentPurchase {
  id: string; amount: number; currency: string; purchasedAt: string;
  buyer: { id: string; name: string; username: string; image: string | null };
  stack: { id: string; title: string; slug: string; price: number | null };
}
interface Discussion {
  id: string; title: string; createdAt: string; commentCount: number;
  author: { name: string; username: string; image: string | null };
  stack: { id: string; title: string; slug: string };
}
interface BankAccount {
  id: string; accountNumber: string; bankName: string; accountName: string;
}
interface Bank { name: string; code: string; }

const TABS = ["Overview", "Buyers", "Discussions", "Payout"] as const;
type Tab = typeof TABS[number];

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-on-surface-variant">{label}</span>
        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", color)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="font-manrope font-bold text-2xl text-primary">{value}</p>
    </div>
  );
}

export default function CreatorDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [paidStacks, setPaidStacks] = useState<PaidStack[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<RecentPurchase[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [banks, setBanks] = useState<Bank[]>([]);

  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState("");

  const [showAddBank, setShowAddBank] = useState(false);
  const [bankForm, setBankForm] = useState({ accountNumber: "", bankCode: "", verificationCode: "" });
  const [bankLoading, setBankLoading] = useState(false);
  const [bankMsg, setBankMsg] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!session?.user?.id) return;
    Promise.all([
      fetch("/api/creator").then(r => r.json()),
      fetch("/api/creator/bank-account").then(r => r.json()),
      fetch("/api/creator/banks").then(r => r.json()),
    ]).then(([creatorData, bankData, banksData]) => {
      if (!creatorData.error) {
        setStats(creatorData.stats);
        setPaidStacks(creatorData.paidStacks ?? []);
        setRecentPurchases(creatorData.recentPurchases ?? []);
        setDiscussions(creatorData.discussions ?? []);
      }
      if (bankData && !bankData.error) setBankAccount(bankData);
      if (Array.isArray(banksData)) setBanks(banksData);
    }).finally(() => setLoading(false));
  }, [session]);

  const handleSendCode = async () => {
    setSendingCode(true);
    setBankMsg("");
    const res = await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purpose: "bank_account" }),
    });
    const data = await res.json();
    setSendingCode(false);
    if (res.ok) {
      setCodeSent(true);
      setBankMsg("Code sent to your registered email.");
    } else {
      setBankMsg(data.error ?? "Failed to send code.");
    }
  };

  const handleAddBank = async () => {
    setBankLoading(true);
    setBankMsg("");
    const res = await fetch("/api/creator/bank-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bankForm),
    });
    const data = await res.json();
    setBankLoading(false);
    if (res.ok) {
      setBankAccount(data);
      setShowAddBank(false);
      setBankForm({ accountNumber: "", bankCode: "", verificationCode: "" });
      setCodeSent(false);
    } else {
      setBankMsg(data.error ?? "Failed to add account.");
    }
  };

  const handlePayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) { setPayoutMsg("Enter a valid amount."); return; }
    setPayoutLoading(true);
    setPayoutMsg("");
    const res = await fetch("/api/creator/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    setPayoutLoading(false);
    setPayoutMsg(data.message ?? data.error ?? "Something went wrong.");
    if (res.ok) setPayoutAmount("");
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-secondary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-secondary-container rounded-xl flex items-center justify-center">
              <CircleDollarSign className="w-5 h-5 text-on-secondary-container" />
            </div>
            <div>
              <h1 className="font-manrope font-bold text-2xl text-primary">Creator Dashboard</h1>
              <p className="text-sm text-on-surface-variant">Track your revenue, buyers, and manage payouts</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-container rounded-2xl p-1 mb-7 overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                activeTab === tab
                  ? "bg-surface-container-lowest text-primary shadow-card"
                  : "text-on-surface-variant hover:text-primary"
              )}
            >
              {tab === "Overview" && <TrendingUp className="w-3.5 h-3.5" />}
              {tab === "Buyers" && <Users className="w-3.5 h-3.5" />}
              {tab === "Discussions" && <MessageSquare className="w-3.5 h-3.5" />}
              {tab === "Payout" && <Wallet className="w-3.5 h-3.5" />}
              {tab}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === "Overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Total Revenue"
                value={`₦${formatNumber(Math.round(stats?.totalRevenue ?? 0))}`}
                icon={TrendingUp}
                color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              />
              <StatCard
                label="Total Buyers"
                value={String(stats?.totalBuyers ?? 0)}
                icon={Users}
                color="bg-secondary-container text-on-secondary-container"
              />
              <StatCard
                label="Paid Stacks"
                value={String(stats?.paidStackCount ?? 0)}
                icon={BookOpen}
                color="bg-primary-container text-on-primary-container"
              />
            </div>

            {paidStacks.length > 0 && (
              <div>
                <h2 className="font-manrope font-semibold text-base text-primary mb-3">Your Paid Stacks</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {paidStacks.map(s => (
                    <div key={s.id} className="card p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface-container shrink-0">
                        {s.profile
                          ? <img src={s.profile} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-5 h-5 text-on-surface-variant" />
                            </div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-manrope font-semibold text-sm text-primary truncate">{s.title}</p>
                        <p className="text-xs text-on-surface-variant">{s.buyerCount} buyer{s.buyerCount !== 1 ? "s" : ""} · ₦{s.price?.toLocaleString()}</p>
                      </div>
                      <Link href={`/stacks/${s.slug}`} className="p-1.5 text-on-surface-variant hover:text-primary transition-colors">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {paidStacks.length === 0 && (
              <div className="card p-8 text-center">
                <BookOpen className="w-10 h-10 text-on-surface-variant/30 mx-auto mb-3" />
                <p className="font-manrope font-semibold text-primary mb-1">No paid stacks yet</p>
                <p className="text-sm text-on-surface-variant mb-4">Enable paid access for a stack in Stack Studio.</p>
                <Link href="/explore" className="inline-flex items-center gap-1.5 text-sm text-secondary hover:underline">
                  Go to my stacks <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </motion.div>
        )}

        {/* ── BUYERS ── */}
        {activeTab === "Buyers" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h2 className="font-manrope font-semibold text-base text-primary">Recent Purchases</h2>
            {recentPurchases.length === 0 ? (
              <div className="card p-8 text-center">
                <Users className="w-10 h-10 text-on-surface-variant/30 mx-auto mb-3" />
                <p className="font-manrope font-semibold text-primary mb-1">No buyers yet</p>
                <p className="text-sm text-on-surface-variant">Purchases will appear here once people buy your stacks.</p>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-outline-variant/10">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant">Buyer</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant">Stack</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant">Amount</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPurchases.map(p => (
                        <tr key={p.id} className="border-b border-outline-variant/5 hover:bg-surface-container/50 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-secondary-container overflow-hidden shrink-0">
                                {p.buyer.image
                                  ? <img src={p.buyer.image} alt="" className="w-full h-full object-cover" />
                                  : <span className="w-full h-full flex items-center justify-center text-xs font-bold text-on-secondary-container">{p.buyer.name[0]}</span>}
                              </div>
                              <div>
                                <p className="font-medium text-primary text-xs">{p.buyer.name}</p>
                                <p className="text-on-surface-variant text-[10px]">@{p.buyer.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <Link href={`/stacks/${p.stack.slug}`} className="text-secondary hover:underline text-xs">
                              {p.stack.title}
                            </Link>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                              ₦{p.amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs text-on-surface-variant">
                            {new Date(p.purchasedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── DISCUSSIONS ── */}
        {activeTab === "Discussions" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h2 className="font-manrope font-semibold text-base text-primary mb-1">Discussions on your stacks</h2>
            {discussions.length === 0 ? (
              <div className="card p-8 text-center">
                <MessageSquare className="w-10 h-10 text-on-surface-variant/30 mx-auto mb-3" />
                <p className="font-manrope font-semibold text-primary mb-1">No discussions yet</p>
                <p className="text-sm text-on-surface-variant">When learners start discussions on your stacks they'll appear here.</p>
              </div>
            ) : discussions.map(d => (
              <div key={d.id} className="card p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary-container overflow-hidden shrink-0">
                  {d.author.image
                    ? <img src={d.author.image} alt="" className="w-full h-full object-cover" />
                    : <span className="w-full h-full flex items-center justify-center text-xs font-bold text-on-secondary-container">{d.author.name[0]}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-primary truncate">{d.title}</p>
                      <p className="text-xs text-on-surface-variant">
                        @{d.author.username} · on <Link href={`/stacks/${d.stack.slug}`} className="text-secondary hover:underline">{d.stack.title}</Link>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-on-surface-variant shrink-0">
                      <MessageSquare className="w-3 h-3" />
                      {d.commentCount}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── PAYOUT ── */}
        {activeTab === "Payout" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 max-w-xl">
            <div>
              <h2 className="font-manrope font-bold text-xl text-primary mb-1">Request Payout</h2>
              <p className="text-sm text-on-surface-variant">Withdraw your earnings directly to your bank account.</p>
            </div>

            {/* Balance */}
            <div className="card p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-on-surface-variant mb-0.5">Available Balance</p>
                <p className="font-manrope font-bold text-2xl text-primary">
                  ₦{formatNumber(Math.round(stats?.totalRevenue ?? 0))}
                </p>
              </div>
            </div>

            {/* Bank Account */}
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-manrope font-semibold text-base text-primary">Bank Account</h3>
                <button
                  onClick={() => { setShowAddBank(true); setCodeSent(false); setBankMsg(""); }}
                  className="text-xs text-secondary hover:underline"
                >
                  {bankAccount ? "Change" : "Add account"}
                </button>
              </div>
              {bankAccount ? (
                <div className="flex items-center gap-3 p-3 bg-surface-container rounded-xl">
                  <div className="w-9 h-9 bg-secondary-container rounded-xl flex items-center justify-center shrink-0">
                    <Building className="w-4 h-4 text-on-secondary-container" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-primary">{bankAccount.accountName}</p>
                    <p className="text-xs text-on-surface-variant">{bankAccount.bankName} · ****{bankAccount.accountNumber.slice(-4)}</p>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-green-500 ml-auto" />
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant">No bank account added yet.</p>
              )}
            </div>

            {/* Add Bank Modal */}
            {showAddBank && (
              <div className="card p-5 space-y-4 border border-secondary/20">
                <div className="flex items-center justify-between">
                  <h3 className="font-manrope font-semibold text-base text-primary">Add Bank Account</h3>
                  <button onClick={() => setShowAddBank(false)} className="text-on-surface-variant hover:text-primary transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Bank</label>
                  <select
                    value={bankForm.bankCode}
                    onChange={e => setBankForm(f => ({ ...f, bankCode: e.target.value }))}
                    className="input-field"
                  >
                    <option value="">Select bank</option>
                    {banks.map(b => (
                      <option key={b.code} value={b.code}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Account Number</label>
                  <input
                    value={bankForm.accountNumber}
                    onChange={e => setBankForm(f => ({ ...f, accountNumber: e.target.value }))}
                    className="input-field"
                    placeholder="0123456789"
                    maxLength={10}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-primary">Verification Code</label>
                    <button
                      onClick={handleSendCode}
                      disabled={sendingCode || codeSent}
                      className={cn(
                        "text-xs font-medium transition-colors",
                        codeSent ? "text-green-600 cursor-default" : "text-secondary hover:underline disabled:opacity-60"
                      )}
                    >
                      {sendingCode ? <><Loader2 className="w-3 h-3 inline animate-spin mr-1" />Sending…</> : codeSent ? <><Check className="w-3 h-3 inline mr-1" />Code sent</> : "Send code to my email"}
                    </button>
                  </div>
                  <input
                    value={bankForm.verificationCode}
                    onChange={e => setBankForm(f => ({ ...f, verificationCode: e.target.value }))}
                    className="input-field"
                    placeholder="6-digit code"
                    maxLength={6}
                  />
                </div>

                {bankMsg && (
                  <p className={cn("text-xs", bankMsg.includes("sent") ? "text-green-600" : "text-error")}>{bankMsg}</p>
                )}

                <button
                  onClick={handleAddBank}
                  disabled={bankLoading || !bankForm.accountNumber || !bankForm.bankCode || !bankForm.verificationCode}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold font-manrope hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {bankLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Verify & Save Account
                </button>
              </div>
            )}

            {/* Payout form */}
            {bankAccount && (
              <div className="card p-5 space-y-4">
                <h3 className="font-manrope font-semibold text-base text-primary">Withdraw Funds</h3>
                <div className="flex items-center gap-2">
                  <span className="text-on-surface-variant font-medium text-sm">₦</span>
                  <input
                    type="number"
                    min="100"
                    value={payoutAmount}
                    onChange={e => setPayoutAmount(e.target.value)}
                    className="input-field flex-1"
                    placeholder="Enter amount"
                  />
                </div>
                {payoutMsg && (
                  <p className={cn("text-xs", payoutMsg.includes("initiated") || payoutMsg.includes("Payout") ? "text-green-600" : "text-error")}>
                    {payoutMsg}
                  </p>
                )}
                <button
                  onClick={handlePayout}
                  disabled={payoutLoading || !payoutAmount}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold font-manrope hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {payoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
                  Request Payout
                </button>
                <p className="text-xs text-on-surface-variant">Funds are transferred via Paystack and usually arrive within 24 hours.</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
