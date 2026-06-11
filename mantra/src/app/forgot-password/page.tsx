"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, BookOpen, Eye, EyeOff, Check } from "lucide-react";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "Contains a number", test: (v: string) => /\d/.test(v) },
  { label: "Contains uppercase", test: (v: string) => /[A-Z]/.test(v) },
];

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendCode = async () => {
    if (!email) { setError("Enter your email."); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed to send code."); return; }
    setStep(2);
  };

  const handleResetPassword = async () => {
    if (!code || !newPassword) { setError("Fill in all fields."); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, newPassword }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
    setStep(3);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[42%] bg-primary relative overflow-hidden flex-col justify-between p-12">
        <div className="relative z-10 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-on-primary" />
          <span className="font-manrope font-bold text-xl text-on-primary">Mentra</span>
        </div>
        <div className="relative z-10">
          <p className="text-on-primary/60 text-sm font-medium uppercase tracking-widest mb-3">Security</p>
          <h2 className="font-manrope font-bold text-4xl text-on-primary leading-tight mb-4">Reset your password</h2>
          <p className="text-on-primary/70 text-lg leading-relaxed max-w-sm">We&apos;ll send a code to your email so you can securely set a new password.</p>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <span className="text-on-primary/50 text-sm">Remembered it?</span>
          <Link href="/login" className="text-on-primary font-semibold text-sm hover:underline">Sign in →</Link>
        </div>
        <div className="organic-blob absolute w-[500px] h-[500px] bg-on-primary/5 -top-24 -right-24" />
        <div className="organic-blob absolute w-80 h-80 bg-on-primary/5 bottom-0 left-0" />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <BookOpen className="w-5 h-5 text-secondary" />
            <span className="font-manrope font-bold text-lg text-primary">Mentra</span>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1 - Email */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div>
                  <h1 className="font-manrope font-bold text-lg text-primary mb-1">Forgot password?</h1>
                  <p className="text-on-surface-variant text-sm">Enter your email and we&apos;ll send a reset code.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="you@example.com"
                    autoFocus
                  />
                </div>

                {error && <p className="text-sm text-error">{error}</p>}

                <button
                  onClick={handleSendCode}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-2 rounded-xl font-semibold font-manrope text-sm hover:opacity-90 disabled:opacity-60 transition-all mt-2"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> : <>Send reset code <ArrowRight className="w-4 h-4" /></>}
                </button>

                <p className="text-center text-sm text-on-surface-variant">
                  <Link href="/login" className="text-secondary font-medium hover:underline">← Back to sign in</Link>
                </p>
              </motion.div>
            )}

            {/* Step 2 - Code + New password */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div>
                  <h1 className="font-manrope font-bold text-lg text-primary mb-1">Enter reset code</h1>
                  <p className="text-on-surface-variant text-sm">
                    We sent a 6-digit code to <strong className="text-primary">{email}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="input-field text-center text-2xl font-bold font-manrope tracking-[0.4em]"
                    placeholder="• • • • • •"
                    maxLength={6}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">New password</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="input-field pr-10"
                      placeholder="Create a strong password"
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="mt-2 space-y-1">
                    {PASSWORD_RULES.map(r => (
                      <div key={r.label} className="flex items-center gap-1.5">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${r.test(newPassword) ? "bg-green-500" : "bg-outline-variant/30"}`}>
                          {r.test(newPassword) && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className={`text-xs ${r.test(newPassword) ? "text-green-600 dark:text-green-400" : "text-on-surface-variant"}`}>{r.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {error && <p className="text-sm text-error">{error}</p>}

                <button
                  onClick={handleResetPassword}
                  disabled={loading || code.length < 6 || newPassword.length < 8}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-2 rounded-xl font-semibold font-manrope text-sm hover:opacity-90 disabled:opacity-60 transition-all"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> : <>Reset password <ArrowRight className="w-4 h-4" /></>}
                </button>

                <button onClick={handleSendCode} disabled={loading} className="w-full text-center text-sm text-secondary hover:underline disabled:opacity-50">
                  Resend code
                </button>
              </motion.div>
            )}

            {/* Step 3 - Success */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-5">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h1 className="font-manrope font-bold text-lg text-primary mb-2">Password reset!</h1>
                  <p className="text-on-surface-variant text-sm">Your password has been updated. You can now sign in with your new password.</p>
                </div>
                <button
                  onClick={() => router.push("/login")}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-2 rounded-xl font-semibold font-manrope text-sm hover:opacity-90 transition-all"
                >
                  Sign in <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
