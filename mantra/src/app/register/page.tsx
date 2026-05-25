"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, BookOpen, Github, Check, ArrowRight } from "lucide-react";

const UNIVERSITIES_LIST = [
  "MIT", "University of Lagos", "Universidad Nacional", "University of Cambridge",
  "ETH Zurich", "University of Cape Town", "IIT Bombay", "Other"
];

const LEVELS = ["Undergraduate", "Graduate", "PhD Candidate", "Lecturer", "Professor", "Researcher"];

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "Contains a number", test: (v: string) => /\d/.test(v) },
  { label: "Contains uppercase", test: (v: string) => /[A-Z]/.test(v) },
];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "", university: "", department: "", level: ""
  });

  const updateForm = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleNext = () => {
    if (step < 2) setStep(2);
    else handleSubmit();
  };

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 1500);
  };

  const passwordValid = PASSWORD_RULES.every(r => r.test(form.password));

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-container relative overflow-hidden flex-col justify-between p-12">
        <div className="organic-blob w-[500px] h-[500px] bg-secondary top-[-100px] right-[-100px]" />
        <div className="organic-blob w-[300px] h-[300px] bg-secondary-container bottom-[-50px] left-[-50px]" />

        <Link href="/" className="flex items-center gap-2 relative z-10">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-on-primary" />
          </div>
          <span className="font-manrope font-bold text-xl text-primary">Mantra</span>
        </Link>

        <div className="relative z-10 space-y-8">
          <h2 className="text-3xl font-manrope font-bold text-primary leading-snug">
            Join 312,000+ students building the future of academic knowledge.
          </h2>
          <div className="space-y-4">
            {[
              "Upload and organize your lecture materials",
              "Collaborate with students across the globe",
              "Watch knowledge evolve semester after semester",
              "AI-powered summaries, flashcards, and quizzes",
            ].map((benefit) => (
              <div key={benefit} className="flex items-start gap-3">
                <div className="w-5 h-5 bg-secondary rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-on-secondary" />
                </div>
                <span className="text-sm text-on-surface-variant">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 card p-4 flex items-center gap-3">
          <div className="flex -space-x-2">
            {["MC", "SR", "JO", "AO"].map(initials => (
              <div key={initials} className="w-8 h-8 rounded-full bg-secondary-container border-2 border-background flex items-center justify-center text-xs font-bold font-manrope text-on-secondary-container">
                {initials}
              </div>
            ))}
          </div>
          <p className="text-sm text-on-surface-variant">
            <span className="font-semibold text-primary">2,847 students</span> joined this week
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-on-primary" />
            </div>
            <span className="font-manrope font-bold text-lg text-primary">Mantra</span>
          </Link>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-manrope transition-all ${
                  step >= s ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"
                }`}>
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

          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <button className="w-full flex items-center justify-center gap-3 border border-outline-variant/40 bg-surface-container-lowest py-3 rounded-xl text-sm font-medium text-primary hover:bg-surface-container transition-all mb-6 shadow-card">
                <Github className="w-5 h-5" />
                Continue with GitHub
              </button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant/20" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-4 text-xs text-on-surface-variant">or continue with email</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Full name</label>
                  <input
                    value={form.name}
                    onChange={e => updateForm("name", e.target.value)}
                    placeholder="Dr. Amara Osei"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Academic email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => updateForm("email", e.target.value)}
                    placeholder="amara@university.edu"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={e => updateForm("password", e.target.value)}
                      placeholder="Create a strong password"
                      className="input-field pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="mt-2 space-y-1">
                      {PASSWORD_RULES.map(rule => (
                        <div key={rule.label} className={`flex items-center gap-1.5 text-xs transition-colors ${rule.test(form.password) ? "text-green-600" : "text-on-surface-variant"}`}>
                          <div className={`w-3 h-3 rounded-full flex items-center justify-center ${rule.test(form.password) ? "bg-green-500" : "bg-outline-variant"}`}>
                            {rule.test(form.password) && <Check className="w-2 h-2 text-white" />}
                          </div>
                          {rule.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">University</label>
                <select value={form.university} onChange={e => updateForm("university", e.target.value)} className="input-field">
                  <option value="">Select your university</option>
                  {UNIVERSITIES_LIST.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Department / Faculty</label>
                <input
                  value={form.department}
                  onChange={e => updateForm("department", e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">I am a...</label>
                <div className="grid grid-cols-2 gap-2">
                  {LEVELS.map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => updateForm("level", level)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                        form.level === level
                          ? "bg-secondary-container border-secondary/30 text-on-secondary-container font-semibold"
                          : "border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <button
            onClick={handleNext}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3.5 rounded-xl font-semibold font-manrope text-sm hover:opacity-90 disabled:opacity-60 transition-all shadow-card mt-6 active:scale-[0.99]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
            ) : (
              <>
                {step === 1 ? "Continue" : "Create account"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="w-full text-center text-sm text-on-surface-variant hover:text-primary transition-colors mt-3"
            >
              ← Back
            </button>
          )}

          <p className="text-center text-sm text-on-surface-variant mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-secondary font-medium hover:underline">Sign in</Link>
          </p>

          <p className="text-center text-xs text-on-surface-variant/50 mt-4">
            By signing up, you agree to our{" "}
            <Link href="#" className="hover:underline">Terms of Service</Link> and{" "}
            <Link href="#" className="hover:underline">Privacy Policy</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
