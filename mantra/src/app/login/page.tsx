"use client";

import { useState, Suspense, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, BookOpen, ArrowRight, Users, GraduationCap, ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import Image from "next/image";

function OTPInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, "").split("").slice(0, 6);

  const handleChange = (i: number, v: string) => {
    const char = v.replace(/\D/g, "").slice(-1);
    const next = digits.map((d, idx) => (idx === i ? char : d)).join("").slice(0, 6);
    onChange(next);
    if (char && i < 5) inputsRef.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      const next = digits.map((d, idx) => (idx === i - 1 ? "" : d)).join("");
      onChange(next);
      inputsRef.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) { onChange(pasted); inputsRef.current[Math.min(pasted.length, 5)]?.focus(); }
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={el => { inputsRef.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] ?? ""}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onFocus={e => e.target.select()}
          className="w-11 h-13 text-center text-lg font-bold text-primary bg-surface-container border-2 border-outline-variant/30 rounded-xl focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-none transition-all"
          style={{ height: "52px" }}
        />
      ))}
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [step, setStep] = useState<"credentials" | "verify_otp">("credentials");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const doSignIn = async () => {
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("Something went wrong during sign in. Please try again.");
      setLoading(false);
      return;
    }
    try {
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();
      if (sessionData?.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push(callbackUrl);
      }
    } catch {
      router.push(callbackUrl);
    }
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/check-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Invalid email or password.");
        setLoading(false);
        return;
      }

      if (data.needsVerification) {
        setStep("verify_otp");
        setResendCooldown(60);
        setLoading(false);
        return;
      }

      await doSignIn();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) { setOtpError("Enter the 6-digit code sent to your email."); return; }
    setOtpError("");
    setOtpLoading(true);
    try {
      const res = await fetch("/api/auth/verify-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error ?? "Invalid or expired code.");
        setOtpLoading(false);
        return;
      }
      await doSignIn();
    } catch {
      setOtpError("Something went wrong. Please try again.");
      setOtpLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setOtpError("");
    const res = await fetch("/api/auth/check-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) setResendCooldown(60);
    else setOtpError("Failed to resend. Please try again.");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-primary relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0">
          <Image src="/home/library-grand.png" alt="Library" fill className="object-cover opacity-20" sizes="45vw" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80" />
        </div>
        <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="login-dot-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="#fef9f2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-dot-grid)" />
        </svg>
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-9 h-9 bg-on-primary/10 border border-on-primary/20 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-on-primary" />
          </div>
          <span className="font-manrope font-bold text-xl text-on-primary">Mentra</span>
        </div>
        <div className="relative z-10 space-y-6">
          <blockquote className="text-2xl font-manrope font-semibold text-on-primary leading-relaxed">
            &ldquo;Knowledge compounds when it&apos;s shared. Every contribution is a gift to future students.&rdquo;
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary-container rounded-full flex items-center justify-center font-bold font-manrope text-on-secondary-container text-sm">MC</div>
            <div>
              <p className="font-semibold text-sm text-on-primary">Marcus Chen</p>
              <p className="text-xs text-on-primary/50">Professor of Physics, MIT</p>
            </div>
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: BookOpen, label: "Stacks" },
            { icon: Users, label: "Learners" },
            { icon: GraduationCap, label: "Universities" },
          ].map(s => (
            <div key={s.label} className="bg-on-primary/5 border border-on-primary/10 rounded-2xl p-3">
              <p className="text-xs text-on-primary/50 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-on-primary" />
            </div>
            <span className="font-manrope font-bold text-lg text-primary">Mentra</span>
          </Link>

          <AnimatePresence mode="wait">
            {step === "credentials" ? (
              <motion.div key="credentials" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 className="font-manrope font-bold text-xl md:text-2xl text-primary mb-2">Welcome back</h1>
                <p className="text-on-surface-variant mb-8">Sign in to your account to continue learning.</p>

                {error && (
                  <div className="mb-4 p-3 bg-error-container/20 border border-error/20 rounded-xl text-sm text-error">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">Email address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@university.edu"
                      className="input-field"
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="text-sm font-medium text-primary">Password</label>
                      <Link href="/forgot-password" className="text-xs text-secondary hover:underline">Forgot password?</Link>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="input-field pr-12"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors p-1"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-2 rounded-xl font-semibold font-manrope text-sm hover:opacity-90 disabled:opacity-60 transition-all shadow-card active:scale-[0.99] mt-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                    ) : (
                      <>Sign in <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>

                <p className="text-center text-sm text-on-surface-variant mt-6">
                  Don&apos;t have an account?{" "}
                  <Link href="/register" className="text-secondary font-medium hover:underline">Sign up free</Link>
                </p>
              </motion.div>
            ) : (
              <motion.div key="verify_otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <button
                  onClick={() => { setStep("credentials"); setOtpCode(""); setOtpError(""); }}
                  className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors mb-6"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to sign in
                </button>

                <div className="w-12 h-12 bg-secondary-container rounded-2xl flex items-center justify-center mb-5">
                  <Mail className="w-6 h-6 text-on-secondary-container" />
                </div>

                <h1 className="font-manrope font-bold text-xl md:text-2xl text-primary mb-2">Verify your account</h1>
                <p className="text-on-surface-variant mb-2">
                  Your account needs to be verified before you can sign in.
                </p>
                <p className="text-sm text-on-surface-variant/70 mb-8">
                  A 6-digit code was sent to <strong className="text-primary">{email}</strong>. Enter it below to continue.
                </p>

                {otpError && (
                  <div className="mb-4 p-3 bg-error-container/20 border border-error/20 rounded-xl text-sm text-error">
                    {otpError}
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <OTPInput value={otpCode} onChange={setOtpCode} />

                  <button
                    type="submit"
                    disabled={otpLoading || otpCode.length !== 6}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-2.5 rounded-xl font-semibold font-manrope text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-card"
                  >
                    {otpLoading ? (
                      <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                    ) : (
                      <><ShieldCheck className="w-4 h-4" /> Verify &amp; sign in</>
                    )}
                  </button>
                </form>

                <div className="mt-5 text-center">
                  <p className="text-sm text-on-surface-variant">
                    Didn&apos;t get the code?{" "}
                    <button
                      onClick={handleResend}
                      disabled={resendCooldown > 0}
                      className="text-secondary font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                    </button>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
