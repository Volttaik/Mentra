"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit, Loader2, CheckCircle2, XCircle, AlertCircle,
  ChevronRight, Trophy, RotateCcw, Zap, Plus, Clock,
  TrendingUp, TrendingDown, Timer, Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";

interface QuizQuestion {
  id: string; question: string; options: string[];
  correctIndex: number; explanation: string | null; topic: string | null; order: number;
}
interface QuizAttemptData { id: string; score: number; total: number; createdAt: string; }
interface QuizData {
  id: string; title: string; description: string | null; createdAt: string;
  durationMinutes: number; expiresAt: string | null;
  questions: QuizQuestion[]; _count: { attempts: number }; myAttempts: QuizAttemptData[];
}
interface ResultData {
  score: number; total: number; pct: number; grade: string;
  correct: number[]; explanations: (string | null)[]; topics: (string | null)[];
  topicResults: Record<string, { correct: number; total: number }>;
  strongAreas: string[]; weakAreas: string[];
}

interface Props {
  slug: string; isOwner: boolean; credits: number;
  onBuyCredits: () => void; onCreditsUpdate: (n: number) => void;
}

const DURATION_OPTIONS = [
  { label: "No limit", value: 0 },
  { label: "10 min", value: 10 },
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "1 day", value: 1440 },
];

function timeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m left`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m left`;
  return `${Math.floor(hrs / 24)}d left`;
}

function ScoreBadge({ score, total }: { score: number; total: number }) {
  const pct = Math.round((score / total) * 100);
  const color = pct >= 75 ? "text-green-600 bg-green-50 border-green-200" : pct >= 50 ? "text-amber-600 bg-amber-50 border-amber-200" : "text-red-600 bg-red-50 border-red-200";
  return <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", color)}>{score}/{total}</span>;
}

export default function QuizSection({ slug, isOwner, credits, onBuyCredits, onCreditsUpdate }: Props) {
  const [quizzes, setQuizzes] = useState<QuizData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [showGenForm, setShowGenForm] = useState(false);

  const [quizState, setQuizState] = useState<"list" | "taking" | "results">("list");
  const [activeQuiz, setActiveQuiz] = useState<QuizData | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<ResultData | null>(null);

  const creditCost = questionCount;
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyQuizLink = (quizId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/quiz/${quizId}`);
    setCopiedId(quizId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const loadQuizzes = useCallback(() => {
    fetch(`/api/stacks/${slug}/quiz`)
      .then(r => r.json())
      .then(d => { if (d.quizzes) setQuizzes(d.quizzes); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => { loadQuizzes(); }, [loadQuizzes]);

  const handleGenerate = async () => {
    if (credits < creditCost) { onBuyCredits(); return; }
    setGenerating(true); setGenError("");
    try {
      const res = await fetch(`/api/stacks/${slug}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionCount, durationMinutes }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) { onBuyCredits(); return; }
        setGenError(data.error ?? "Generation failed. Try again.");
        return;
      }
      setQuizzes(prev => [data.quiz, ...prev]);
      onCreditsUpdate(data.creditsRemaining ?? credits - creditCost);
      setShowGenForm(false);
    } catch { setGenError("Network error. Please try again."); }
    finally { setGenerating(false); }
  };

  const startQuiz = (quiz: QuizData) => {
    setActiveQuiz(quiz);
    setCurrentQ(0);
    setSelectedAnswers(new Array(quiz.questions.length).fill(null));
    setResults(null);
    setQuizState("taking");
  };

  const handleSubmit = async () => {
    if (!activeQuiz) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/stacks/${slug}/quiz/${activeQuiz.id}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: selectedAnswers }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitting(false); return; }
      setResults(data);
      setQuizzes(prev => prev.map(q => q.id === activeQuiz.id
        ? { ...q, myAttempts: [{ id: data.attempt.id, score: data.score, total: data.total, createdAt: new Date().toISOString() }, ...q.myAttempts], _count: { attempts: q._count.attempts + 1 } }
        : q
      ));
      setQuizState("results");
    } catch { } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-6 h-6 text-secondary animate-spin" />
    </div>
  );

  /* ── TAKING ── */
  if (quizState === "taking" && activeQuiz) {
    const q = activeQuiz.questions[currentQ];
    const answered = selectedAnswers[currentQ] !== null;
    const allAnswered = selectedAnswers.every(a => a !== null);
    const progress = (currentQ + 1) / activeQuiz.questions.length;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-manrope font-semibold text-base text-primary">{activeQuiz.title}</h3>
            <p className="text-sm text-on-surface-variant">Question {currentQ + 1} of {activeQuiz.questions.length}</p>
          </div>
          <button onClick={() => setQuizState("list")} className="text-xs text-on-surface-variant hover:text-primary transition-colors px-3 py-1.5 rounded-xl hover:bg-surface-container">
            Exit
          </button>
        </div>

        <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
          <motion.div className="h-full bg-secondary rounded-full" initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.3 }} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }} className="card p-6 space-y-5">
            {q.topic && (
              <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-secondary-container/40 text-secondary">
                {q.topic}
              </span>
            )}
            <p className="font-manrope font-semibold text-base text-primary leading-snug">{q.question}</p>
            <div className="space-y-2.5">
              {(q.options as string[]).map((opt, i) => (
                <motion.button key={i} whileTap={{ scale: 0.99 }} onClick={() => {
                  setSelectedAnswers(prev => { const next = [...prev]; next[currentQ] = i; return next; });
                }} className={cn(
                  "w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-sm",
                  selectedAnswers[currentQ] === i
                    ? "border-secondary/50 bg-secondary-container/30 text-primary"
                    : "border-outline-variant/20 bg-surface-container hover:bg-surface-container-high hover:border-secondary/30 text-on-surface-variant"
                )}>
                  <span className={cn(
                    "w-6 h-6 rounded-full border flex items-center justify-center text-[11px] font-semibold shrink-0",
                    selectedAnswers[currentQ] === i ? "border-secondary bg-secondary text-on-secondary" : "border-outline-variant/40"
                  )}>{String.fromCharCode(65 + i)}</span>
                  {opt}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <button onClick={() => setCurrentQ(q => q - 1)} disabled={currentQ === 0}
            className="px-4 py-2 text-sm text-on-surface-variant hover:text-primary transition-colors disabled:opacity-30">
            Previous
          </button>
          <div className="flex items-center gap-1">
            {activeQuiz.questions.map((_, i) => (
              <button key={i} onClick={() => setCurrentQ(i)} className={cn(
                "w-2 h-2 rounded-full transition-all",
                i === currentQ ? "bg-secondary w-4" : selectedAnswers[i] !== null ? "bg-secondary/40" : "bg-surface-container-high"
              )} />
            ))}
          </div>
          {currentQ < activeQuiz.questions.length - 1 ? (
            <button onClick={() => setCurrentQ(q => q + 1)} disabled={!answered}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 disabled:opacity-40 transition-all">
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={!allAnswered || submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-secondary text-on-secondary hover:opacity-90 disabled:opacity-40 transition-all font-manrope">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trophy className="w-4 h-4" />Submit</>}
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  /* ── RESULTS ── */
  if (quizState === "results" && results && activeQuiz) {
    const gradeColor = results.pct >= 75 ? "text-green-600" : results.pct >= 50 ? "text-amber-600" : "text-red-600";
    const gradeBg = results.pct >= 75 ? "bg-green-100" : results.pct >= 50 ? "bg-amber-100" : "bg-red-100";

    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        {/* Score card */}
        <div className="card p-8 text-center space-y-4">
          <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center mx-auto", gradeBg)}>
            <Trophy className={cn("w-10 h-10", gradeColor)} />
          </div>
          <div>
            <p className="font-manrope font-bold text-3xl text-primary">{results.score}/{results.total}</p>
            <p className={cn("font-semibold mt-1", gradeColor)}>{results.pct}% · {results.grade}</p>
          </div>

          {/* Topic breakdown */}
          {Object.keys(results.topicResults).length > 1 && (
            <div className="grid grid-cols-2 gap-2 pt-2 text-left max-w-sm mx-auto">
              {Object.entries(results.topicResults).map(([topic, v]) => {
                const topicPct = Math.round((v.correct / v.total) * 100);
                return (
                  <div key={topic} className="bg-surface-container rounded-xl px-3 py-2">
                    <p className="text-[10px] text-on-surface-variant truncate">{topic}</p>
                    <p className={cn("text-sm font-semibold font-manrope",
                      topicPct >= 70 ? "text-green-600" : topicPct >= 50 ? "text-amber-600" : "text-red-500")}>
                      {v.correct}/{v.total}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Strong / Weak areas */}
          {(results.strongAreas.length > 0 || results.weakAreas.length > 0) && (
            <div className="grid grid-cols-2 gap-3 pt-1 text-left max-w-sm mx-auto">
              {results.strongAreas.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-green-700">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-semibold uppercase tracking-wide">Strong</span>
                  </div>
                  {results.strongAreas.map(t => (
                    <p key={t} className="text-xs text-green-700 font-medium">{t}</p>
                  ))}
                </div>
              )}
              {results.weakAreas.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-red-600">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-semibold uppercase tracking-wide">Needs work</span>
                  </div>
                  {results.weakAreas.map(t => (
                    <p key={t} className="text-xs text-red-600 font-medium">{t}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-center pt-2">
            <button onClick={() => { setQuizState("list"); setActiveQuiz(null); }}
              className="px-4 py-2 rounded-xl text-sm text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all">
              Back to quizzes
            </button>
            <button onClick={() => startQuiz(activeQuiz)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-all font-manrope">
              <RotateCcw className="w-3.5 h-3.5" />Try again
            </button>
          </div>
        </div>

        {/* Review answers */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Review answers</p>
          {activeQuiz.questions.map((q, i) => {
            const userAns = selectedAnswers[i];
            const correct = results.correct[i];
            const isRight = userAns === correct;
            return (
              <div key={q.id} className={cn("card-sm p-4 space-y-2 border-l-4", isRight ? "border-l-green-500/50" : "border-l-red-400/50")}>
                <div className="flex items-start gap-2">
                  {isRight ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    {q.topic && <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary mr-2">{q.topic}</span>}
                    <p className="text-sm font-medium text-primary">{q.question}</p>
                  </div>
                </div>
                <div className="space-y-1 pl-6">
                  {(q.options as string[]).map((opt, j) => (
                    <p key={j} className={cn("text-xs py-0.5",
                      j === correct ? "text-green-600 font-semibold" :
                      j === userAns && !isRight ? "text-red-500 line-through" : "text-on-surface-variant")}>
                      {String.fromCharCode(65 + j)}. {opt}
                    </p>
                  ))}
                  {q.explanation && (
                    <p className="text-xs text-on-surface-variant bg-surface-container px-3 py-2 rounded-xl mt-1">{q.explanation}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  /* ── LIST ── */
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {isOwner && (
        <div className="flex justify-end">
          <button onClick={() => setShowGenForm(f => !f)}
            className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-xl text-sm font-semibold font-manrope hover:opacity-90 transition-all">
            <BrainCircuit className="w-4 h-4" />Generate Quiz with AI
          </button>
        </div>
      )}

      <AnimatePresence>
        {showGenForm && isOwner && (
          <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }} transition={{ duration: 0.2 }}
            className="card p-5 space-y-4 overflow-hidden">

            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-secondary" />
              <h3 className="font-manrope font-semibold text-sm text-primary">Generate quiz from stack content</h3>
              <span className="ml-auto text-xs font-semibold text-secondary bg-secondary-container/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" />{creditCost} credit{creditCost !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Question count */}
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">Questions <span className="text-on-surface-variant font-normal">(1 credit each)</span></label>
              <div className="flex gap-2">
                {[5, 10, 15, 20].map(n => (
                  <button key={n} onClick={() => setQuestionCount(n)} className={cn(
                    "px-3 py-1.5 rounded-xl text-sm font-medium border transition-all",
                    questionCount === n ? "border-secondary/50 bg-secondary-container/30 text-primary" : "border-outline-variant/20 text-on-surface-variant hover:bg-surface-container"
                  )}>{n}</button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5 flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-secondary" />Quiz availability
              </label>
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setDurationMinutes(opt.value)} className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
                    durationMinutes === opt.value ? "border-secondary/50 bg-secondary-container/30 text-primary" : "border-outline-variant/20 text-on-surface-variant hover:bg-surface-container"
                  )}>{opt.label}</button>
                ))}
              </div>
              {durationMinutes > 0 && (
                <p className="text-xs text-on-surface-variant mt-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />Quiz will auto-delete after {DURATION_OPTIONS.find(o => o.value === durationMinutes)?.label}
                </p>
              )}
            </div>

            {genError && (
              <p className="text-xs text-error bg-error-container/20 px-3 py-2 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />{genError}
              </p>
            )}
            {credits < creditCost && (
              <div className="flex items-center justify-between bg-secondary-container/20 border border-secondary/20 px-4 py-3 rounded-xl">
                <p className="text-xs text-on-surface-variant">You need {creditCost} credits to generate this quiz.</p>
                <button onClick={onBuyCredits} className="text-xs font-semibold text-secondary hover:text-primary transition-colors flex items-center gap-1">
                  <Zap className="w-3 h-3" />Buy credits
                </button>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowGenForm(false)} className="px-4 py-2 text-sm text-on-surface-variant hover:text-primary transition-colors">
                Cancel
              </button>
              <button onClick={handleGenerate} disabled={generating || credits < creditCost}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-secondary text-on-secondary hover:opacity-90 disabled:opacity-50 transition-all font-manrope">
                {generating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</> : <><BrainCircuit className="w-4 h-4" />Generate</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {quizzes.length === 0 ? (
        <div className="card p-16 text-center">
          <BrainCircuit className="w-10 h-10 text-outline-variant mx-auto mb-3" />
          <p className="font-manrope font-semibold text-primary mb-1">No quizzes yet</p>
          <p className="text-sm text-on-surface-variant max-w-xs mx-auto">
            {isOwner ? "Generate your first AI quiz to help students test their understanding." : "The owner hasn&apos;t generated any quizzes yet. Check back soon."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz, i) => {
            const best = quiz.myAttempts.length > 0 ? Math.max(...quiz.myAttempts.map(a => a.score)) : null;
            const bestTotal = quiz.myAttempts[0]?.total ?? quiz.questions.length;
            const expiring = quiz.expiresAt && new Date(quiz.expiresAt) > new Date();
            return (
              <motion.div key={quiz.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }} className="card-sm p-5 flex items-start gap-4 group hover:-translate-y-0.5 transition-all">
                <div className="w-11 h-11 bg-secondary-container/40 rounded-xl flex items-center justify-center shrink-0">
                  <BrainCircuit className="w-5 h-5 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-manrope font-semibold text-sm text-primary group-hover:text-secondary transition-colors">{quiz.title}</p>
                    {best !== null && <ScoreBadge score={best} total={bestTotal} />}
                  </div>
                  {quiz.description && <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">{quiz.description}</p>}
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-on-surface-variant">
                    <span>{quiz.questions.length} questions</span>
                    <span>·</span>
                    <span>{quiz._count.attempts} attempt{quiz._count.attempts !== 1 ? "s" : ""}</span>
                    {quiz.myAttempts.length > 0 && (
                      <><span>·</span><span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(quiz.myAttempts[0].createdAt)}</span></>
                    )}
                    {expiring && (
                      <span className="flex items-center gap-1 text-amber-600 font-medium">
                        <Timer className="w-3 h-3" />{timeLeft(quiz.expiresAt!)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => copyQuizLink(quiz.id)}
                    title="Copy challenge link"
                    className={cn(
                      "flex items-center gap-1 text-xs px-2.5 py-2 rounded-xl border transition-all",
                      copiedId === quiz.id
                        ? "border-secondary/50 bg-secondary-container/30 text-secondary"
                        : "border-outline-variant/20 text-on-surface-variant hover:text-primary hover:bg-surface-container"
                    )}>
                    <Share2 className="w-3 h-3" />
                    <span className="hidden sm:inline">{copiedId === quiz.id ? "Copied!" : "Share"}</span>
                  </button>
                  <button onClick={() => startQuiz(quiz)}
                    className="flex items-center gap-1.5 text-xs font-semibold font-manrope bg-primary text-on-primary px-3 py-2 rounded-xl hover:opacity-90 transition-all">
                    {quiz.myAttempts.length > 0 ? <><RotateCcw className="w-3 h-3" />Retry</> : <><Plus className="w-3 h-3" />Start</>}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
