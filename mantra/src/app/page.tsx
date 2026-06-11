"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  ArrowRight, BookOpen, GitFork, Star, Users, Zap,
  Shield, TrendingUp, Upload, Globe, ChevronDown, Layers
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// ─── Constants ──────────────────────────────────────────────────────────────

const ROTATING_WORDS = ["Knowledge", "Research", "Courses", "Notes", "Ideas"];

const STATS_FALLBACK = [
  { value: "48k+", label: "Stacks published" },
  { value: "312k+", label: "Active learners" },
  { value: "1,200+", label: "Universities" },
  { value: "4.2M+", label: "Study hours saved" },
];

const FEATURES = [
  {
    icon: Layers,
    title: "Stacks, not files",
    description: "Organize knowledge in layered stacks — lectures, modules, problem sets — that evolve each semester.",
  },
  {
    icon: GitFork,
    title: "Fork and improve",
    description: "Build on others' work. Fork a stack, add your insights, submit them back. Every edit makes it better.",
  },
  {
    icon: Shield,
    title: "Verified by faculty",
    description: "Stacks reviewed by professors are marked Verified — quality you can trust when it counts.",
  },
  {
    icon: Users,
    title: "Collaborative by design",
    description: "Students and lecturers build together. Contributions from every semester layer on top of each other.",
  },
  {
    icon: Zap,
    title: "Structured content",
    description: "Every uploaded file is processed into structured sections, key concepts, and summaries — ready to study.",
  },
  {
    icon: Globe,
    title: "Global academic graph",
    description: "Connect with 1,200+ universities. The best materials, wherever they come from.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Create your stack",
    description: "Upload lecture notes, PDFs, slides, or videos. Organize by module and semester in minutes.",
    icon: Upload,
  },
  {
    step: "02",
    title: "Others build on it",
    description: "Students fork your stack, fix errors, add solved problems — peer review built into every edit.",
    icon: Users,
  },
  {
    step: "03",
    title: "Knowledge compounds",
    description: "After five semesters your stack carries the collective understanding of hundreds of learners.",
    icon: TrendingUp,
  },
];

const MARQUEE_IMAGES = [
  "/home/study-desk.png",
  "/home/books-stack.png",
  "/home/online-study.png",
  "/home/open-book-notes.png",
  "/home/students-collaborating.png",
  "/home/library-grand.png",
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function DotGrid({ id }: { id: string }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <pattern id={id} x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

function InfiniteMarquee() {
  return (
    <div className="relative overflow-hidden py-6 select-none">
      <div className="flex gap-4 animate-marquee w-max">
        {[...MARQUEE_IMAGES, ...MARQUEE_IMAGES].map((src, i) => (
          <div
            key={i}
            className="relative flex-shrink-0 w-72 h-48 rounded-2xl overflow-hidden shadow-card"
          >
            <Image
              src={src}
              alt="Academic life"
              fill
              sizes="288px"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [wordIdx, setWordIdx] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const { status } = useSession();

  // Redirect authenticated users straight to the feed
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/explore");
    }
  }, [status, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIdx(p => (p + 1) % ROTATING_WORDS.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        className="relative min-h-[94vh] flex items-center overflow-hidden"
      >
        {/* Dot grid */}
        <div className="absolute inset-0 text-primary/[0.035]">
          <DotGrid id="hero-dots" />
        </div>

        {/* Warm radial glow — lightweight, no blur */}
        <div className="absolute top-0 left-0 w-full h-[500px] pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(var(--c-secondary-container), 0.18) 0%, transparent 70%)" }} />

        {/* Decorative arc */}
        <svg
          className="absolute right-0 top-0 h-full opacity-[0.025] pointer-events-none"
          viewBox="0 0 600 900"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <circle cx="600" cy="200" r="350" stroke="#735b25" strokeWidth="1.5" fill="none" />
          <circle cx="600" cy="200" r="240" stroke="#735b25" strokeWidth="1" fill="none" />
          <circle cx="600" cy="200" r="140" stroke="#735b25" strokeWidth="0.7" fill="none" />
          <line x1="250" y1="200" x2="950" y2="200" stroke="#735b25" strokeWidth="0.6" />
          <line x1="600" y1="-150" x2="600" y2="550" stroke="#735b25" strokeWidth="0.6" />
        </svg>

        <div className="relative z-10 w-full max-w-[1200px] mx-auto px-4 md:px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* ── Left: copy ───────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-secondary-container/70 text-on-secondary-container px-4 py-2 rounded-full text-xs font-semibold mb-8 border border-secondary/20 shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5" />
              The collaborative academic OS
            </motion.div>

            {/* Headline — grid-stack prevents layout shift on word swap */}
            <h1 className="font-manrope font-bold text-5xl md:text-[3.6rem] text-primary leading-[1.06] tracking-tight mb-6">
              Where Academic
              <br />
              <span className="inline-grid align-bottom">
                {/* Invisible spacer holds width of longest word */}
                <span className="col-start-1 row-start-1 invisible select-none" aria-hidden>
                  Knowledge
                </span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={wordIdx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.55 }}
                    className="text-secondary col-start-1 row-start-1"
                  >
                    {ROTATING_WORDS[wordIdx]}
                  </motion.span>
                </AnimatePresence>
              </span>
              {" "}Lives & Grows
            </h1>

            <p className="text-on-surface-variant text-lg leading-relaxed mb-10 max-w-[460px]">
              Mentra is where students and professors publish, evolve, and
              collaborate on academic stacks — content that gets richer every
              semester instead of starting from scratch.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-7 py-4 rounded-2xl font-semibold font-manrope text-base hover:opacity-90 transition-opacity shadow-card active:scale-[0.98]"
              >
                Start for free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center justify-center gap-2 bg-surface-container-lowest border border-outline-variant/40 text-primary px-7 py-4 rounded-2xl font-semibold font-manrope text-base hover:bg-surface-container transition-colors active:scale-[0.98]"
              >
                <Layers className="w-4 h-4" /> Explore stacks
              </Link>
            </div>

            {/* Inline stats */}
            <div className="flex items-center gap-7 flex-wrap">
              {STATS_FALLBACK.slice(0, 3).map((s, i) => (
                <div key={s.label} className={i > 0 ? "pl-7 border-l border-outline-variant/20" : ""}>
                  <p className="font-manrope font-bold text-[1.25rem] text-primary leading-none">{s.value}</p>
                  <p className="text-xs text-on-surface-variant mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Right: image mosaic ───────────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden lg:grid grid-cols-2 grid-rows-2 gap-3 h-[520px]"
          >
            {/* Tall left card */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="row-span-2 relative rounded-2xl overflow-hidden shadow-card"
            >
              <Image src="/home/study-desk.png" alt="Student studying" fill sizes="280px" priority className="object-cover hover:scale-[1.03] transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-transparent" />
            </motion.div>

            {/* Top right */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-2xl overflow-hidden shadow-card"
            >
              <Image src="/home/books-stack.png" alt="Books" fill sizes="200px" className="object-cover hover:scale-[1.03] transition-transform duration-700" />
            </motion.div>

            {/* Bottom right */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-2xl overflow-hidden shadow-card"
            >
              <Image src="/home/online-study.png" alt="Online study" fill sizes="200px" className="object-cover hover:scale-[1.03] transition-transform duration-700" />
            </motion.div>

            {/* Floating badge — bottom left */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="absolute -bottom-5 -left-6 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-4 py-3 shadow-modal z-10"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-secondary-container rounded-xl flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4 text-on-secondary-container" />
                </div>
                <div>
                  <p className="font-manrope font-semibold text-xs text-primary">+1,204 forks this week</p>
                  <p className="text-[10px] text-on-surface-variant">Machine Learning Foundations</p>
                </div>
              </div>
            </motion.div>

            {/* Floating badge — top right */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="absolute -top-5 -right-4 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-4 py-3 shadow-modal z-10"
            >
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <p className="font-manrope font-semibold text-xs text-primary">312k+ learners online</p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ opacity: scrolled ? 0 : 1 }}
          transition={{ duration: 0.4 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-on-surface-variant/40"
        >
          <span className="text-[11px] font-medium tracking-wider uppercase">Scroll</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </motion.div>
      </section>

      {/* Seamless gradient bridge hero → image strip */}
      <div className="h-16 bg-gradient-to-b from-background to-surface-container-low pointer-events-none -mt-px" />

      {/* ── IMAGE MARQUEE ─────────────────────────────────────── */}
      <section className="bg-surface-container-low overflow-hidden">
        <InfiniteMarquee />
      </section>

      {/* Gradient bridge down */}
      <div className="h-16 bg-gradient-to-b from-surface-container-low to-background pointer-events-none" />

      {/* ── WHAT IS MENTRA ─────────────────────────────────────── */}
      <section className="py-20 md:py-28 px-4 md:px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-secondary mb-5 bg-secondary-container/50 px-3 py-1 rounded-full">Why Mentra</span>
              <h2 className="font-manrope font-bold text-3xl md:text-4xl text-primary leading-tight mb-6">
                Every semester, brilliant notes disappear. We&apos;re fixing that.
              </h2>
              <p className="text-on-surface-variant leading-relaxed mb-5 text-base">
                Millions of students rewrite the same lecture notes from scratch each year. A student makes a perfect summary — then it vanishes. Mentra ends that cycle.
              </p>
              <p className="text-on-surface-variant leading-relaxed text-base">
                Every stack on Mentra is versioned, forkable, and collaborative. Last year&apos;s notes become this year&apos;s foundation. Knowledge compounds instead of disappearing.
              </p>

              <div className="mt-10 flex flex-col gap-3">
                {[
                  "Stacks grow richer with each contributing student",
                  "Professors can verify and endorse content",
                  "Structured content extraction built into every stack",
                ].map((point, i) => (
                  <motion.div
                    key={point}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-5 h-5 bg-secondary-container rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-secondary rounded-full" />
                    </div>
                    <span className="text-sm text-on-surface-variant">{point}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="relative h-[420px] rounded-3xl overflow-hidden shadow-card">
                <Image src="/home/library-grand.png" alt="Grand library" fill sizes="560px" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-primary/10 to-transparent" />
                {/* Floating stat card */}
                <div className="absolute bottom-6 left-6 right-6 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {STATS_FALLBACK.map(s => (
                      <div key={s.label}>
                        <p className="font-manrope font-bold text-lg text-primary">{s.value}</p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section className="py-20 md:py-28 px-4 md:px-6 bg-surface-container-low relative overflow-hidden">
        <div className="absolute inset-0 text-primary/[0.028]">
          <DotGrid id="how-dots" />
        </div>

        <div className="max-w-[1200px] mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-xl mx-auto mb-16"
          >
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-secondary mb-4 bg-secondary-container/50 px-3 py-1 rounded-full">How it works</span>
            <h2 className="font-manrope font-bold text-3xl md:text-4xl text-primary mt-3 mb-4">
              Knowledge that compounds over time
            </h2>
            <p className="text-on-surface-variant leading-relaxed">
              Unlike static PDFs, Mentra stacks grow richer every semester through collective contribution.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+2.5rem)] right-[calc(16.67%+2.5rem)] h-px border-t border-dashed border-outline-variant/40 z-0" />

            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-8 flex flex-col items-center text-center relative z-10 shadow-card hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="w-14 h-14 bg-secondary-container rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                  <step.icon className="w-7 h-7 text-on-secondary-container" />
                </div>
                <span className="font-manrope font-bold text-5xl text-outline-variant/20 mb-2 leading-none tabular-nums select-none">
                  {step.step}
                </span>
                <h3 className="font-manrope font-semibold text-base text-primary mb-3">{step.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <section className="py-20 md:py-28 px-4 md:px-6">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-xl mx-auto mb-16"
          >
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-secondary mb-4 bg-secondary-container/50 px-3 py-1 rounded-full">Platform</span>
            <h2 className="font-manrope font-bold text-3xl md:text-4xl text-primary mt-3 mb-4">
              Built for serious learners
            </h2>
            <p className="text-on-surface-variant leading-relaxed">
              Everything a student or professor needs to publish, refine, and collaborate on world-class academic content.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.06, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-6 group hover:-translate-y-1 transition-all duration-300 shadow-card cursor-default"
              >
                <div className="w-11 h-11 bg-secondary-container rounded-xl flex items-center justify-center mb-4 group-hover:bg-secondary transition-colors duration-300">
                  <feature.icon className="w-5 h-5 text-on-secondary-container group-hover:text-on-secondary transition-colors duration-300" />
                </div>
                <h3 className="font-manrope font-semibold text-sm text-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────── */}
      <section className="py-16 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 text-on-primary/[0.04]">
          <DotGrid id="stats-dots" />
        </div>
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS_FALLBACK.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.09, duration: 0.5 }}
                className="text-center"
              >
                <p className="font-manrope font-bold text-4xl text-on-primary mb-1">{stat.value}</p>
                <p className="text-sm text-on-primary/60">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="py-28 px-4 md:px-6 relative overflow-hidden">
        <div className="absolute inset-0 text-primary/[0.03]">
          <DotGrid id="cta-dots" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-secondary-container/25 via-transparent to-primary-container/15 pointer-events-none" />

        <div className="max-w-[1200px] mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl mx-auto"
          >
            {/* Mini image row */}
            <div className="flex items-center justify-center -space-x-3 mb-8">
              {["/home/books-stack.png", "/home/online-study.png", "/home/students-collaborating.png"].map((src, i) => (
                <div key={i} className="w-12 h-12 rounded-full border-4 border-background overflow-hidden relative shadow-card">
                  <Image src={src} alt="Learner" fill sizes="48px" className="object-cover" />
                </div>
              ))}
              <div className="w-12 h-12 rounded-full border-4 border-background bg-secondary-container flex items-center justify-center shadow-card">
                <span className="text-xs font-bold font-manrope text-on-secondary-container">+312k</span>
              </div>
            </div>

            <h2 className="font-manrope font-bold text-4xl md:text-5xl text-primary leading-tight mb-5">
              Stop rewriting.
              <br />
              Start building on what came before.
            </h2>
            <p className="text-on-surface-variant text-lg mb-10 leading-relaxed">
              Join 312,000+ students and professors turning their knowledge into living, evolving stacks.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-semibold font-manrope text-sm hover:opacity-90 transition-opacity shadow-card active:scale-[0.98]"
              >
                Create your first stack <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 text-secondary font-semibold text-sm hover:underline underline-offset-4 transition-all"
              >
                Browse stacks for free
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
