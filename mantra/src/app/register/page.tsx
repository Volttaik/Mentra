"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, BookOpen, Check, ArrowRight } from "lucide-react";
import Image from "next/image";

const UNIVERSITIES_LIST = [
  "MIT", "University of Lagos", "Universidad Nacional", "University of Cambridge",
  "ETH Zurich", "University of Cape Town", "IIT Bombay", "Harvard University",
  "Stanford University", "Oxford University", "Other",
];
const LEVELS = ["Undergraduate", "Graduate", "PhD Candidate", "Lecturer", "Professor", "Researcher"];
const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "Contains a number", test: (v: string) => /\d/.test(v) },
  { label: "Contains uppercase", test: (v: string) => /[A-Z]/.test(v) },
];
const BENEFITS = [
  "Publish and organize your lecture notes and slides",
  "Collaborate with students and faculty worldwide",
  "Watch knowledge evolve semester after semester",
  "AI-powered summaries, flashcards, and quizzes",
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    university: "", department: "", level: "",
  });

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const validateStep1 = (): string | null => {
    if (!form.name.trim()) return "Full name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!form.password) return "Password is required.";
    if (form.password.length < 8) return "Password must be at least 8 characters.";
    if (!/\d/.test(form.password)) return "Password must contain a number.";
    if (!/[A-Z]/.test(form.password)) return "Password must contain an uppercase letter.";
    if (form.password !== form.confirmPassword) return "Passwords do not match.";
    return null;
  };

  const handleNext = () => {
    setError("");
    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
      setStep(2);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          university: form.university || null,
          department: form.department || null,
          level: form.level || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed. Please try again.");
        setLoading(false);
        return;
      }
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (result?.error) {
        router.push("/login");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-primary relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0">
          <Image src="/home/students-collaborating.png" alt="Students collaborating" fill className="object-cover opacity-20" sizes="45vw" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80" />
        </div>
        <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="register-dot-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="#fef9f2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#register-dot-grid)" />
        </svg>
        <Link href="/" className="flex items-center gap-2 relative z-10">
          <div className="w-9 h-9 bg-on-primary/10 border border-on-primary/20 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-on-primary" />
          </div>
          <span className="font-manrope font-bold text-xl text-on-primary">Mentra</span>
        </Link>
        <div className="relative z-10 space-y-8">
          <h2 className="text-3xl font-manrope font-bold text-on-primary leading-snug">
            Join students building the future of academic knowledge.
          </h2>
          <div className="space-y-3">
            {BENEFITS.map(b => (
              <div key={b} className="flex items-start gap-3">
                <div className="w-5 h-5 bg-secondary-container rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-on-secondary-container" />
                </div>
                <span className="text-sm text-on-primary/70">{b}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 bg-on-primary/5 border border-on-primary/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="flex -space-x-2">
            {["MC", "SR", "JO", "AO"].map(i => (
              <div key={i} className="w-8 h-8 rounded-full bg-secondary-container border-2 border-primary flex items-center justify-center text-xs font-bold font-manrope text-on-secondary-container">{i}</div>
            ))}
          </div>
          <p className="text-sm text-on-primary/70">Join the growing community of contributors.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-on-primary" />
            </div>
            <span className="font-manrope font-bold text-lg text-primary">Mentra</span>
          </Link>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-manrope transition-all ${step >= s ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                <span className={`text-xs font-medium ${step >= s ? "text-primary" : "text-on-surface-variant"}`}>
                  {s === 1 ? "Account" : "Profile"}
                </span>
                {s < 2 && <div className="w-8 h-px bg-outline-variant/30 mx-1" />}
              </div>
            ))}
          </div>

          <h1 className="font-manrope font-bold text-2xl md:text-3xl text-primary mb-2">
            {step === 1 ? "Create your account" : "Complete your profile"}
          </h1>
          <p className="text-on-surface-variant mb-8">
            {step === 1 ? "Start for free. No credit card required." : "Help us personalize your experience."}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-error-container/20 border border-error/20 rounded-xl text-sm text-error">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Full name</label>
                  <input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Your full name" className="input-field" autoComplete="name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Email address</label>
                  <input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="you@university.edu" className="input-field" autoComplete="email" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={e => update("password", e.target.value)}
                      placeholder="Create a strong password"
                      className="input-field pr-12"
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant p-1">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="mt-2 space-y-1">
                      {PASSWORD_RULES.map(rule => (
                        <div key={rule.label} className={`flex items-center gap-1.5 text-xs transition-colors ${rule.test(form.password) ? "text-green-600" : "text-on-surface-variant"}`}>
                          <div className={`w-3 h-3 rounded-full flex items-center justify-center shrink-0 transition-colors ${rule.test(form.password) ? "bg-green-500" : "bg-outline-variant"}`}>
                            {rule.test(form.password) && <Check className="w-2 h-2 text-white" />}
                          </div>
                          {rule.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Confirm password</label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={e => update("confirmPassword", e.target.value)}
                    placeholder="Re-enter your password"
                    className={`input-field ${form.confirmPassword && form.password !== form.confirmPassword ? "border-error/50 focus:ring-error/30" : ""}`}
                    autoComplete="new-password"
                  />
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="text-xs text-error mt-1">Passwords do not match.</p>
                  )}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">University</label>
                  <select value={form.university} onChange={e => update("university", e.target.value)} className="input-field">
                    <option value="">Select your university</option>
                    {UNIVERSITIES_LIST.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Department / Faculty</label>
                  <input value={form.department} onChange={e => update("department", e.target.value)} placeholder="e.g. Computer Science" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">I am a...</label>
                  <div className="grid grid-cols-2 gap-2">
                    {LEVELS.map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => update("level", level)}
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${form.level === level ? "bg-secondary-container border-secondary/30 text-on-secondary-container font-semibold" : "border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"}`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleNext}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3.5 rounded-xl font-semibold font-manrope text-sm hover:opacity-90 disabled:opacity-60 transition-all shadow-card mt-6 active:scale-[0.99]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
            ) : (
              <>{step === 1 ? "Continue" : "Create account"} <ArrowRight className="w-4 h-4" /></>
            )}
          </button>

          {step === 2 && (
            <button onClick={() => { setError(""); setStep(1); }} className="w-full text-center text-sm text-on-surface-variant hover:text-primary transition-colors mt-3">
              ← Back
            </button>
          )}

          <p className="text-center text-sm text-on-surface-variant mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-secondary font-medium hover:underline">Sign in</Link>
          </p>
          <p className="text-center text-xs text-on-surface-variant/50 mt-4">
            By signing up you agree to our{" "}
            <Link href="#" className="hover:underline">Terms</Link> and{" "}
            <Link href="#" className="hover:underline">Privacy Policy</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
