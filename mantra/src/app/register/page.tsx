"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, BookOpen, Check, ArrowRight,
  GraduationCap, Briefcase, Palette, Camera, X,
} from "lucide-react";
import Image from "next/image";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "Contains a number", test: (v: string) => /\d/.test(v) },
  { label: "Contains uppercase", test: (v: string) => /[A-Z]/.test(v) },
];

const USER_TYPES = [
  {
    id: "student",
    label: "Student / Academic",
    sub: "University student, researcher, or professor",
    icon: GraduationCap,
  },
  {
    id: "creator",
    label: "Content Creator",
    sub: "Educator, course creator, or knowledge publisher",
    icon: Palette,
  },
  {
    id: "freelancer",
    label: "Freelancer / Professional",
    sub: "Independent professional or consultant",
    icon: Briefcase,
  },
] as const;

type UserType = "student" | "creator" | "freelancer" | "";

const UNIVERSITIES_LIST = [
  "MIT", "University of Lagos", "Universidad Nacional", "University of Cambridge",
  "ETH Zurich", "University of Cape Town", "IIT Bombay", "Harvard University",
  "Stanford University", "Oxford University", "Other",
];

const ACADEMIC_LEVELS = ["Undergraduate", "Graduate", "PhD Candidate", "Lecturer", "Professor", "Researcher"];

function getStepCount(userType: UserType) {
  return 5;
}

export default function RegisterPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSending, setCodeSending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState("");

  const [userType, setUserType] = useState<UserType>("");
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    university: "", department: "", level: "",
    field: "", experience: "", company: "",
    niche: "", platform: "",
    bio: "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const validateStep1 = (): string | null => {
    if (!userType) return "Please select what you are.";
    return null;
  };

  const validateStep2 = (): string | null => {
    if (!form.name.trim()) return "Full name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!form.password) return "Password is required.";
    if (form.password.length < 8) return "Password must be at least 8 characters.";
    if (!/\d/.test(form.password)) return "Password must contain a number.";
    if (!/[A-Z]/.test(form.password)) return "Password must contain an uppercase letter.";
    if (form.password !== form.confirmPassword) return "Passwords do not match.";
    return null;
  };

  const handleSendCode = async () => {
    setCodeSending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, purpose: "signup" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to send code.");
      } else {
        setCodeSent(true);
        setStep(5);
      }
    } catch {
      setError("Could not send verification code. Try again.");
    } finally {
      setCodeSending(false);
    }
  };

  const handleNext = () => {
    setError("");
    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) { setError(err); return; }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      handleSendCode();
    } else {
      handleSubmit();
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = ev => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      let imageBase64: string | null = null;
      if (avatarFile) {
        imageBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(avatarFile);
        });
      }

      const extraDetails: Record<string, string> = {};
      if (userType === "student") {
        extraDetails.university = form.university || "";
        extraDetails.department = form.department || "";
        extraDetails.level = form.level || "";
      } else if (userType === "creator") {
        extraDetails.niche = form.niche || "";
        extraDetails.platform = form.platform || "";
      } else if (userType === "freelancer") {
        extraDetails.field = form.field || "";
        extraDetails.experience = form.experience || "";
        extraDetails.company = form.company || "";
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          bio: form.bio || null,
          userType,
          imageBase64: imageBase64 || null,
          verificationCode,
          ...extraDetails,
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

  const totalSteps = 5;
  const stepLabels = ["Type", "Account", "Details", "Profile", "Verify"];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[42%] bg-primary relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0">
          <Image src="/home/students-collaborating.png" alt="Students collaborating" fill className="object-cover opacity-20" sizes="42vw" />
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
            {userType === "student"
              ? "Build the future of academic knowledge."
              : userType === "creator"
              ? "Reach learners around the world."
              : userType === "freelancer"
              ? "Showcase your expertise globally."
              : "Join a growing community of knowledge builders."}
          </h2>
          <div className="space-y-3">
            {[
              "Publish and organize your knowledge in stacks",
              "Collaborate with your community worldwide",
              "Watch content evolve and improve over time",
              "Verified content builds trust and reach",
            ].map(b => (
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
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md py-8"
        >
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-on-primary" />
            </div>
            <span className="font-manrope font-bold text-lg text-primary">Mentra</span>
          </Link>

          {/* Progress steps */}
          <div className="flex items-center gap-1 mb-8">
            {stepLabels.map((label, idx) => {
              const s = idx + 1;
              const isActive = step === s;
              const isDone = step > s;
              return (
                <div key={label} className="flex items-center gap-1 flex-1">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-manrope transition-all ${
                      isDone ? "bg-secondary text-on-secondary" :
                      isActive ? "bg-primary text-on-primary" :
                      "bg-surface-container text-on-surface-variant"
                    }`}>
                      {isDone ? <Check className="w-3.5 h-3.5" /> : s}
                    </div>
                    <span className={`text-[10px] font-medium whitespace-nowrap ${isActive || isDone ? "text-primary" : "text-on-surface-variant"}`}>
                      {label}
                    </span>
                  </div>
                  {idx < totalSteps - 1 && (
                    <div className={`h-px flex-1 mb-4 transition-colors ${step > s ? "bg-secondary/50" : "bg-outline-variant/30"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-error-container/20 border border-error/20 rounded-xl text-sm text-error">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* Step 1 — User type */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.28 }}
              >
                <h1 className="font-manrope font-bold text-2xl text-primary mb-1">Who are you?</h1>
                <p className="text-on-surface-variant text-sm mb-6">This helps us set up the right experience for you.</p>
                <div className="space-y-3">
                  {USER_TYPES.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setUserType(t.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                        userType === t.id
                          ? "border-secondary bg-secondary-container/20"
                          : "border-outline-variant/30 hover:border-outline/50 hover:bg-surface-container"
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        userType === t.id ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container text-on-surface-variant"
                      }`}>
                        <t.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={`font-manrope font-semibold text-sm ${userType === t.id ? "text-primary" : "text-on-surface"}`}>{t.label}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">{t.sub}</p>
                      </div>
                      {userType === t.id && (
                        <div className="ml-auto w-5 h-5 bg-secondary rounded-full flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-on-secondary" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2 — Account */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.28 }}
                className="space-y-4"
              >
                <h1 className="font-manrope font-bold text-2xl text-primary mb-1">Create your account</h1>
                <p className="text-on-surface-variant text-sm mb-2">Start for free. No credit card required.</p>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Full name</label>
                  <input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Your full name" className="input-field" autoComplete="name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Email address</label>
                  <input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="you@example.com" className="input-field" autoComplete="email" />
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
                        <div key={rule.label} className={`flex items-center gap-1.5 text-xs transition-colors ${rule.test(form.password) ? "text-green-600 dark:text-green-400" : "text-on-surface-variant"}`}>
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

            {/* Step 3 — Role-specific details */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.28 }}
                className="space-y-4"
              >
                <h1 className="font-manrope font-bold text-2xl text-primary mb-1">Tell us more</h1>
                <p className="text-on-surface-variant text-sm mb-2">Help others understand your background.</p>

                {userType === "student" && (
                  <>
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
                        {ACADEMIC_LEVELS.map(level => (
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
                  </>
                )}

                {userType === "creator" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">Content niche</label>
                      <input value={form.niche} onChange={e => update("niche", e.target.value)} placeholder="e.g. Web Development, Math, Finance" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">Primary platform</label>
                      <input value={form.platform} onChange={e => update("platform", e.target.value)} placeholder="e.g. YouTube, own website, Mentra" className="input-field" />
                    </div>
                  </>
                )}

                {userType === "freelancer" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">Field of work</label>
                      <input value={form.field} onChange={e => update("field", e.target.value)} placeholder="e.g. Software Engineering, Design, Law" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">Years of experience</label>
                      <select value={form.experience} onChange={e => update("experience", e.target.value)} className="input-field">
                        <option value="">Select range</option>
                        {["Less than 1 year", "1–2 years", "3–5 years", "6–10 years", "10+ years"].map(x => <option key={x}>{x}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">Company / Organisation (optional)</label>
                      <input value={form.company} onChange={e => update("company", e.target.value)} placeholder="Where you work or worked" className="input-field" />
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* Step 4 — Profile */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.28 }}
                className="space-y-5"
              >
                <h1 className="font-manrope font-bold text-2xl text-primary mb-1">Set up your profile</h1>
                <p className="text-on-surface-variant text-sm mb-2">This can be changed later in settings.</p>

                {/* Avatar */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-24 h-24 rounded-full bg-secondary-container border-2 border-outline-variant/30 flex items-center justify-center overflow-hidden transition-all group-hover:opacity-80">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold font-manrope text-on-secondary-container">
                          {form.name ? form.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                      <Camera className="w-3.5 h-3.5 text-on-primary" />
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm text-secondary hover:text-primary transition-colors font-medium">
                    {avatarPreview ? "Change photo" : "Upload a photo"}
                  </button>
                  {avatarPreview && (
                    <button type="button" onClick={() => { setAvatarPreview(null); setAvatarFile(null); }} className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-error transition-colors">
                      <X className="w-3 h-3" />Remove
                    </button>
                  )}
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Bio <span className="text-on-surface-variant font-normal">(optional)</span></label>
                  <textarea
                    value={form.bio}
                    onChange={e => update("bio", e.target.value)}
                    rows={3}
                    maxLength={280}
                    className="input-field resize-none"
                    placeholder="Tell the community a little about yourself..."
                  />
                  <p className="text-xs text-on-surface-variant mt-1 text-right">{form.bio.length}/280</p>
                </div>
              </motion.div>
            )}
            {/* Step 5 — Email Verification */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.28 }}
                className="space-y-5"
              >
                <div className="flex flex-col items-center text-center gap-3 mb-2">
                  <div className="w-14 h-14 bg-secondary-container rounded-2xl flex items-center justify-center">
                    <Check className="w-7 h-7 text-on-secondary-container" />
                  </div>
                  <div>
                    <h1 className="font-manrope font-bold text-2xl text-primary mb-1">Verify your email</h1>
                    <p className="text-on-surface-variant text-sm">
                      We sent a 6-digit code to <strong className="text-primary">{form.email}</strong>
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Verification code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={verificationCode}
                    onChange={e => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="input-field text-center text-2xl font-bold font-manrope tracking-[0.4em]"
                    placeholder="• • • • • •"
                    maxLength={6}
                    autoFocus
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={codeSending}
                  className="w-full text-center text-sm text-secondary hover:underline disabled:opacity-50"
                >
                  {codeSending ? "Sending…" : "Resend code"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleNext}
            disabled={loading || codeSending}
            className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3.5 rounded-xl font-semibold font-manrope text-sm hover:opacity-90 disabled:opacity-60 transition-all shadow-card mt-6 active:scale-[0.99]"
          >
            {(loading || codeSending) ? (
              <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
            ) : (
              <>{step < 4 ? "Continue" : step === 4 ? "Send verification code" : "Create account"} <ArrowRight className="w-4 h-4" /></>
            )}
          </button>

          {step > 1 && step < 5 && (
            <button onClick={() => { setError(""); setStep(s => s - 1); }} className="w-full text-center text-sm text-on-surface-variant hover:text-primary transition-colors mt-3">
              ← Back
            </button>
          )}

          {step === 4 && (
            <button onClick={handleSendCode} disabled={codeSending} className="w-full text-center text-sm text-on-surface-variant hover:text-primary transition-colors mt-2">
              Skip profile setup →
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
