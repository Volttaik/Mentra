"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User, Key, Bell, Shield, Save, Plus, Trash2,
  Copy, Check, Loader2, ArrowLeft, AlertTriangle, Eye, EyeOff,
  Camera, ImageIcon, Sparkles, Palette, PanelLeft, LayoutPanelTop,
  Monitor, BarChart2, Activity, ChevronDown, X,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import { cn } from "@/lib/utils";

const NOTIFICATION_PREFS = [
  { key: "stars", label: "Someone stars your stack" },
  { key: "forks", label: "Someone forks your stack" },
  { key: "comments", label: "New comment on your discussion" },
  { key: "follows", label: "Someone follows you" },
  { key: "announcements", label: "Platform announcements" },
];

function NotificationsTab() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_PREFS.map(p => [p.key, true]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const handleToggle = async (key: string) => {
    const newVal = !prefs[key];
    setPrefs(p => ({ ...p, [key]: newVal }));
    setSaving(key);
    await new Promise(r => setTimeout(r, 400));
    setSaving(null);
    setSaved(key);
    setTimeout(() => setSaved(null), 1500);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
      <h2 className="font-manrope font-semibold text-lg text-primary mb-1">Notification preferences</h2>
      <p className="text-sm text-on-surface-variant mb-5">Choose what activity you want to be notified about.</p>
      <div className="space-y-1">
        {NOTIFICATION_PREFS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between py-3 border-b border-outline-variant/10 last:border-0">
            <span className="text-sm text-on-surface">{label}</span>
            <div className="flex items-center gap-2">
              {saved === key && <span className="text-xs text-secondary">Saved</span>}
              <button
                onClick={() => handleToggle(key)}
                disabled={saving === key}
                className="relative inline-flex items-center cursor-pointer disabled:opacity-70"
                aria-label={prefs[key] ? "Disable" : "Enable"}
              >
                <div className={`w-10 h-5 rounded-full transition-colors duration-200 ${prefs[key] ? "bg-secondary" : "bg-outline-variant/40"}`}>
                  <div className={`absolute top-0.5 h-4 w-4 bg-white rounded-full shadow transition-transform duration-200 ${prefs[key] ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

const ACCENT_COLORS = [
  "#D4A84B", "#C0392B", "#2980B9", "#27AE60", "#8E44AD",
  "#E67E22", "#16A085", "#2C3E50", "#E74C3C", "#3498DB",
  "#9B59B6", "#2ECC71", "#F39C12", "#1ABC9C", "#34495E",
  "#E91E63", "#00BCD4", "#FF5722", "#795548", "#607D8B",
];

const BG_COLORS = [
  "#FFFBF0", "#FFF5F5", "#F0F8FF", "#F0FFF4", "#FAF0FF",
  "#FFFAF0", "#F5F5DC", "#F0FFFF", "#FFF0F5", "#F5F5F5",
  "#FAFAFA", "#F8F9FA", "#EDF2F7", "#FEFCE8", "#FFF1F2",
  "#1A1A2E", "#13100B", "#0F172A", "#111827", "#1E1E2E",
];

function ColorSwatchPicker({
  label, value, onChange, colors, clearLabel = "Use palette default",
}: {
  label: string; value: string; onChange: (v: string) => void;
  colors: string[]; clearLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <label className="block text-xs font-medium text-on-surface-variant mb-1.5">{label}</label>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-surface-container border border-outline-variant/30 rounded-xl hover:border-outline/50 transition-all text-sm w-full"
      >
        <div
          className="w-5 h-5 rounded-full border border-black/10 shadow-sm shrink-0"
          style={{ backgroundColor: value || "#aaaaaa" }}
        />
        <span className="text-xs text-on-surface-variant flex-1 text-left truncate">
          {value || "Palette default"}
        </span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-on-surface-variant/60 transition-transform shrink-0", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-30 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-modal p-3 w-full min-w-[200px]">
          <div className="flex flex-wrap gap-2 mb-2">
            {colors.map(color => (
              <button
                key={color}
                onClick={() => { onChange(color); setOpen(false); }}
                title={color}
                className={cn(
                  "w-7 h-7 rounded-full border-2 transition-all hover:scale-110 shrink-0",
                  value === color ? "border-on-surface shadow-md scale-110" : "border-transparent hover:border-outline-variant/50"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          {value && (
            <button
              onClick={() => { onChange(""); setOpen(false); }}
              className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary w-full pt-2 border-t border-outline-variant/10 transition-colors"
            >
              <X className="w-3 h-3" />{clearLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const PREVIEW_PALETTES: Record<string, { accent: string; bg: string; card: string; text: string; muted: string }> = {
  parchment: { accent: "#D4A84B", bg: "#FFF8E7", card: "#F5EDD0", text: "#2D1F00", muted: "#7A6040" },
  ocean:     { accent: "#4A9FE0", bg: "#EDF4FF", card: "#D6E8FA", text: "#0A1A2E", muted: "#3A6080" },
  forest:    { accent: "#4BAF6A", bg: "#F0FFF4", card: "#D4F0DC", text: "#0C2010", muted: "#2E6040" },
  lavender:  { accent: "#9F85E0", bg: "#F5F2FF", card: "#E0D8F8", text: "#1A0A3E", muted: "#5040A0" },
  rose:      { accent: "#E07A8A", bg: "#FFF2F4", card: "#FAD8DE", text: "#2E0A10", muted: "#804050" },
  slate:     { accent: "#7B96BE", bg: "#F5F7FA", card: "#DDE4F0", text: "#0A1020", muted: "#405070" },
};

function DashboardPreview({ config }: { config: { palette: string; customSecondary: string; customBg: string } }) {
  const base = PREVIEW_PALETTES[config.palette] ?? PREVIEW_PALETTES.parchment;
  const accent = config.customSecondary || base.accent;
  const bg     = config.customBg      || base.bg;
  const card   = base.card;
  const text   = base.text;
  const muted  = base.muted;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-secondary" />
          <h3 className="font-manrope font-semibold text-base text-primary">Dashboard Preview</h3>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-semibold text-secondary bg-secondary-container/40 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse inline-block" />
          Live
        </span>
      </div>
      <p className="text-xs text-on-surface-variant mb-4">Updates instantly as you change palette and colors.</p>

      {/* Preview frame */}
      <div
        className="rounded-2xl overflow-hidden border-2 shadow-sm transition-all duration-300"
        style={{ backgroundColor: bg, borderColor: accent + "30" }}
      >
        {/* Simulated fixed navbar */}
        <div
          className="px-3 py-2 flex items-center gap-2 border-b"
          style={{ backgroundColor: accent + "15", borderColor: accent + "30" }}
        >
          <div className="w-5 h-5 rounded-lg shrink-0 flex items-center justify-center" style={{ backgroundColor: accent }}>
            <div className="w-2.5 h-2.5 rounded bg-white opacity-80" />
          </div>
          <span className="font-black text-[10px]" style={{ color: accent }}>Mentra</span>
          <div className="flex gap-3 ml-2">
            {["Explore", "Communities", "Dashboard"].map(l => (
              <span key={l} className="text-[8px] font-medium" style={{ color: muted }}>{l}</span>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: accent + "40" }} />
            <div className="w-5 h-5 rounded-full border-2" style={{ backgroundColor: accent + "25", borderColor: accent + "50" }} />
          </div>
        </div>

        {/* Content area */}
        <div className="p-3 space-y-2.5">
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: "Stacks", val: "24" },
              { label: "Stars",  val: "1.2k" },
              { label: "Views",  val: "8.5k" },
              { label: "Followers", val: "142" },
            ].map(s => (
              <div
                key={s.label}
                className="rounded-xl p-2 transition-colors duration-300"
                style={{ backgroundColor: card, border: `1px solid ${accent}25` }}
              >
                <div className="text-[10px] font-black mb-0.5" style={{ color: accent }}>{s.val}</div>
                <div className="text-[7px] font-medium" style={{ color: muted }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-3 gap-1.5">
            {/* Main stacks list */}
            <div className="col-span-2 space-y-1.5">
              {["Algorithms & Data Structures", "Machine Learning 101"].map((title, i) => (
                <div
                  key={i}
                  className="rounded-xl p-2 flex items-center gap-2 transition-colors duration-300"
                  style={{ backgroundColor: card, border: `1px solid ${accent}20` }}
                >
                  <div className="w-6 h-6 rounded-lg shrink-0" style={{ backgroundColor: accent + "30" }} />
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <div className="text-[8px] font-semibold truncate" style={{ color: text }}>{title}</div>
                    <div className="flex gap-1">
                      <div className="h-1 rounded w-8" style={{ backgroundColor: accent + "40" }} />
                      <div className="h-1 rounded w-6" style={{ backgroundColor: muted + "60" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar */}
            <div
              className="rounded-xl p-2.5 space-y-1.5 transition-colors duration-300"
              style={{ backgroundColor: card, border: `1px solid ${accent}20` }}
            >
              <div className="text-[8px] font-bold mb-1.5" style={{ color: accent }}>Communities</div>
              {["MIT Study", "CS Guild", "ML Hub"].map((name, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: accent + (i === 0 ? "50" : "30") }} />
                  <div className="text-[7px] font-medium truncate" style={{ color: muted }}>{name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-on-surface-variant/50 mt-2">
        Palette: <span className="font-medium capitalize" style={{ color: accent }}>{config.palette}</span>
        {config.customSecondary && <> · Custom accent: <span className="font-medium">{config.customSecondary}</span></>}
        {config.customBg && <> · Custom bg: <span className="font-medium">{config.customBg}</span></>}
      </p>
    </div>
  );
}

const PALETTES_META = [
  { id: "parchment", name: "Parchment", colors: ["#8B6914", "#D4A84B", "#FFF8E7"] },
  { id: "ocean",     name: "Ocean",     colors: ["#1964C8", "#4A9FE0", "#EDF4FF"] },
  { id: "forest",    name: "Forest",    colors: ["#1E7338", "#4BAF6A", "#F0FFF4"] },
  { id: "lavender",  name: "Lavender",  colors: ["#5A3CC8", "#9F85E0", "#F5F2FF"] },
  { id: "rose",      name: "Rose",      colors: ["#B93250", "#E07A8A", "#FFF2F4"] },
  { id: "slate",     name: "Slate",     colors: ["#3C506E", "#7B96BE", "#F5F7FA"] },
];

const DEFAULT_STUDIO = {
  palette: "parchment", style: "default", font: "default",
  radius: "default", layout: "default", navStyle: "top",
  density: "comfortable", animations: "on",
  customSecondary: "", customBg: "",
  hideStats: false, hideGraph: false, hideNotifs: false,
};

function ToggleRow({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-outline-variant/10 last:border-0">
      <div>
        <p className="text-sm font-medium text-on-surface">{label}</p>
        {desc && <p className="text-xs text-on-surface-variant/60">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          "relative inline-flex w-10 h-5 rounded-full transition-colors duration-200 shrink-0",
          value ? "bg-secondary" : "bg-outline-variant/40"
        )}
        aria-label={value ? "Disable" : "Enable"}
      >
        <span className={cn(
          "absolute top-0.5 h-4 w-4 bg-white rounded-full shadow transition-transform duration-200",
          value ? "translate-x-5" : "translate-x-0.5"
        )} />
      </button>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-3">{children}</p>
  );
}

function StudioTab() {
  const [config, setConfig] = useState(DEFAULT_STUDIO);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("mentra-studio-config");
      if (stored) setConfig(c => ({ ...DEFAULT_STUDIO, ...c, ...JSON.parse(stored) }));
    } catch { /* ignore */ }
  }, []);

  const set = (key: string, value: any) => setConfig(c => ({ ...c, [key]: value }));

  const applyAndSave = async () => {
    setSaving(true);
    localStorage.setItem("mentra-studio-config", JSON.stringify(config));
    try {
      await fetch("/api/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeConfig: JSON.stringify(config) }),
      });
    } catch { /* ignore */ }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    window.location.reload();
  };

  const reset = () => {
    setConfig(DEFAULT_STUDIO);
    localStorage.removeItem("mentra-studio-config");
    fetch("/api/theme", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ themeConfig: JSON.stringify(DEFAULT_STUDIO) }) });
    window.location.reload();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

      {/* ── COLOR PALETTE ── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Palette className="w-4 h-4 text-secondary" />
          <h3 className="font-manrope font-semibold text-base text-primary">Colors</h3>
        </div>
        <p className="text-xs text-on-surface-variant mb-4">Choose a preset palette or dial in your own accent and background colors.</p>

        <SectionLabel>Preset palette</SectionLabel>
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {PALETTES_META.map(p => (
            <button
              key={p.id}
              onClick={() => set("palette", p.id)}
              className={cn(
                "rounded-2xl p-3 border-2 transition-all hover:scale-[1.03]",
                config.palette === p.id ? "border-secondary shadow-md" : "border-outline-variant/20 hover:border-outline/40"
              )}
            >
              <div className="flex gap-1 mb-2 justify-center">
                {p.colors.map((col, i) => (
                  <div key={i} className="w-5 h-5 rounded-full border border-white/30 shadow-sm" style={{ backgroundColor: col }} />
                ))}
              </div>
              <p className="text-[11px] font-medium text-primary text-center">{p.name}</p>
              {config.palette === p.id && <p className="text-[10px] text-secondary text-center mt-0.5">Active</p>}
            </button>
          ))}
        </div>

        <SectionLabel>Custom accent color</SectionLabel>
        <p className="text-xs text-on-surface-variant mb-3">Pick a custom accent and background color to override the palette.</p>
        <div className="grid grid-cols-2 gap-3 mb-1">
          <ColorSwatchPicker
            label="Accent / Secondary"
            value={config.customSecondary}
            onChange={v => set("customSecondary", v)}
            colors={ACCENT_COLORS}
            clearLabel="Use palette default"
          />
          <ColorSwatchPicker
            label="Background tint"
            value={config.customBg}
            onChange={v => set("customBg", v)}
            colors={BG_COLORS}
            clearLabel="Use palette default"
          />
        </div>
        <p className="text-[11px] text-on-surface-variant/50 mt-1">Leave blank to use the palette defaults. Custom colors override the palette.</p>
      </div>

      {/* ── LIVE PREVIEW ── */}
      <DashboardPreview config={config} />

      {/* ── SURFACE STYLE ── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Monitor className="w-4 h-4 text-secondary" />
          <h3 className="font-manrope font-semibold text-base text-primary">Surface Style</h3>
        </div>
        <p className="text-xs text-on-surface-variant mb-4">Controls card shadows and borders. Each option looks exactly like what it represents.</p>
        <div className="grid grid-cols-3 gap-3">
          {([
            { id: "default", name: "Default", desc: "Soft shadows",    shadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px solid rgba(128,128,128,0.15)", radius: 16 },
            { id: "elevated", name: "Elevated", desc: "Deep shadows",  shadow: "0 4px 20px rgba(0,0,0,0.14)", border: "1.5px solid rgba(128,128,128,0.18)", radius: 16 },
            { id: "flat",     name: "Flat",     desc: "Border, no shadow", shadow: "none", border: "1.5px solid rgba(128,128,128,0.30)", radius: 12 },
          ] as const).map(s => (
            <button
              key={s.id}
              onClick={() => set("style", s.id)}
              style={{ boxShadow: s.shadow, border: s.border, borderRadius: s.radius, padding: "12px", textAlign: "left", transition: "all 0.18s" }}
              className={cn(
                config.style === s.id ? "bg-secondary-container/20 outline outline-2 outline-secondary" : "bg-surface-container-low hover:bg-surface-container"
              )}
            >
              <p className="text-xs font-semibold text-primary">{s.name}</p>
              <p className="text-[11px] text-on-surface-variant mt-0.5">{s.desc}</p>
              {config.style === s.id && <p className="text-[10px] text-secondary mt-1">Active</p>}
            </button>
          ))}
        </div>
      </div>

      {/* ── TYPOGRAPHY ── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-manrope font-semibold text-base text-primary">Typography</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {([
            { id: "default", name: "Be Vietnam Pro", sample: "Aa", family: "'Be Vietnam Pro', sans-serif" },
            { id: "manrope", name: "Manrope",         sample: "Aa", family: "'Manrope', sans-serif" },
            { id: "inter",   name: "Inter",           sample: "Aa", family: "'Inter', sans-serif" },
          ] as const).map(f => (
            <button
              key={f.id}
              onClick={() => set("font", f.id)}
              style={{ fontFamily: f.family, borderRadius: 16 }}
              className={cn(
                "p-3 border-2 text-left transition-all",
                config.font === f.id ? "border-secondary bg-secondary-container/20" : "border-outline-variant/20 hover:border-outline/40"
              )}
            >
              <p className="text-xl font-bold text-primary mb-1" style={{ fontFamily: f.family }}>{f.sample}</p>
              <p className="text-[11px] font-semibold text-on-surface-variant">{f.name}</p>
              {config.font === f.id && <p className="text-[10px] text-secondary mt-0.5">Active</p>}
            </button>
          ))}
        </div>
      </div>

      {/* ── CORNER RADIUS ── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-manrope font-semibold text-base text-primary">Corner Radius</h3>
        </div>
        <p className="text-xs text-on-surface-variant mb-4">Each card below uses its own border-radius so you can see exactly what you are picking.</p>
        <div className="grid grid-cols-3 gap-3">
          {([
            { id: "compact", name: "Compact", desc: "Tight, angular",  r: 8 },
            { id: "default", name: "Default", desc: "Comfortable",     r: 16 },
            { id: "rounded", name: "Rounded", desc: "Bubbly & soft",   r: 24 },
          ] as const).map(r => (
            <button
              key={r.id}
              onClick={() => set("radius", r.id)}
              style={{ borderRadius: r.r, padding: "12px", textAlign: "left", transition: "all 0.18s" }}
              className={cn(
                "border-2",
                config.radius === r.id ? "border-secondary bg-secondary-container/20" : "border-outline-variant/20 hover:border-outline/40"
              )}
            >
              <div className="w-full h-4 mb-2 bg-secondary/20" style={{ borderRadius: r.r / 2 }} />
              <p className="text-xs font-semibold text-primary">{r.name}</p>
              <p className="text-[11px] text-on-surface-variant mt-0.5">{r.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── NAVIGATION LAYOUT ── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-1">
          <PanelLeft className="w-4 h-4 text-secondary" />
          <h3 className="font-manrope font-semibold text-base text-primary">Navigation Style</h3>
        </div>
        <p className="text-xs text-on-surface-variant mb-4">Choose how the main navigation is presented across the app.</p>
        <div className="grid grid-cols-3 gap-3">
          {([
            {
              id: "top", name: "Top Bar", desc: "Classic horizontal nav",
              preview: (
                <div className="w-full h-8 bg-surface-container-high rounded-lg flex items-center gap-1.5 px-2 mb-2">
                  <div className="w-3 h-2 rounded-sm bg-secondary/50" />
                  <div className="flex gap-1 ml-1">
                    <div className="w-5 h-1.5 rounded-full bg-outline-variant/50" />
                    <div className="w-5 h-1.5 rounded-full bg-outline-variant/50" />
                  </div>
                  <div className="ml-auto w-3 h-3 rounded-full bg-secondary/40" />
                </div>
              ),
            },
            {
              id: "sidebar", name: "Side Drawer", desc: "All nav in a left panel",
              preview: (
                <div className="w-full h-8 flex gap-1 mb-2">
                  <div className="w-4 h-full bg-secondary/25 rounded-lg flex flex-col justify-center gap-0.5 px-0.5">
                    <div className="w-full h-0.5 bg-secondary/60 rounded" />
                    <div className="w-full h-0.5 bg-secondary/60 rounded" />
                    <div className="w-full h-0.5 bg-secondary/60 rounded" />
                  </div>
                  <div className="flex-1 h-full bg-surface-container-high rounded-lg" />
                </div>
              ),
            },
            {
              id: "minimal", name: "Minimal", desc: "Logo + avatar only",
              preview: (
                <div className="w-full h-8 bg-surface-container-high rounded-lg flex items-center justify-between px-2 mb-2">
                  <div className="w-3 h-2 rounded-sm bg-secondary/50" />
                  <div className="w-3 h-3 rounded-full bg-secondary/40" />
                </div>
              ),
            },
          ] as const).map(nav => (
            <button
              key={nav.id}
              onClick={() => set("navStyle", nav.id)}
              className={cn(
                "rounded-2xl border-2 p-3 text-left transition-all",
                config.navStyle === nav.id ? "border-secondary bg-secondary-container/20" : "border-outline-variant/20 hover:border-outline/40"
              )}
            >
              {nav.preview}
              <p className="text-xs font-semibold text-primary">{nav.name}</p>
              <p className="text-[11px] text-on-surface-variant mt-0.5">{nav.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── DASHBOARD LAYOUT ── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-1">
          <LayoutPanelTop className="w-4 h-4 text-secondary" />
          <h3 className="font-manrope font-semibold text-base text-primary">Dashboard Layout</h3>
        </div>
        <p className="text-xs text-on-surface-variant mb-4">Arrange your dashboard the way that fits you best.</p>
        <div className="grid grid-cols-3 gap-3">
          {([
            { id: "default", name: "Default",  desc: "Main col + sidebar",
              preview: <div className="flex gap-1 mb-2.5"><div className="h-5 rounded-md bg-secondary/30 flex-[2]" /><div className="h-5 rounded-md bg-outline-variant/25 flex-1" /></div> },
            { id: "focus",   name: "Focus",    desc: "Full-width, no sidebar",
              preview: <div className="flex gap-1 mb-2.5"><div className="h-5 rounded-md bg-secondary/30 flex-1" /></div> },
            { id: "compact", name: "Compact",  desc: "Dense single column",
              preview: <div className="flex flex-col gap-1 mb-2.5"><div className="h-1.5 rounded bg-secondary/30 w-full" /><div className="h-1.5 rounded bg-outline-variant/25 w-3/4" /><div className="h-1.5 rounded bg-outline-variant/20 w-1/2" /></div> },
          ] as const).map(l => (
            <button
              key={l.id}
              onClick={() => set("layout", l.id)}
              className={cn(
                "rounded-2xl border-2 p-3 text-left transition-all",
                config.layout === l.id ? "border-secondary bg-secondary-container/20" : "border-outline-variant/20 hover:border-outline/40"
              )}
            >
              {l.preview}
              <p className="text-xs font-semibold text-primary">{l.name}</p>
              <p className="text-[11px] text-on-surface-variant mt-0.5">{l.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── DENSITY & ANIMATIONS ── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-secondary" />
          <h3 className="font-manrope font-semibold text-base text-primary">Feel & Motion</h3>
        </div>
        <SectionLabel>Spacing density</SectionLabel>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {([
            { id: "compact",     name: "Compact",     desc: "Tighter spacing, see more" },
            { id: "comfortable", name: "Comfortable", desc: "Balanced default" },
            { id: "spacious",    name: "Spacious",    desc: "Relaxed, airy feel" },
          ] as const).map(d => (
            <button
              key={d.id}
              onClick={() => set("density", d.id)}
              className={cn(
                "rounded-2xl border-2 p-3 text-left transition-all",
                config.density === d.id ? "border-secondary bg-secondary-container/20" : "border-outline-variant/20 hover:border-outline/40"
              )}
            >
              <p className="text-xs font-semibold text-primary">{d.name}</p>
              <p className="text-[11px] text-on-surface-variant mt-0.5">{d.desc}</p>
            </button>
          ))}
        </div>

        <SectionLabel>Animations</SectionLabel>
        <ToggleRow
          label="Enable animations"
          desc="Slide-in effects, hover transitions, and motion throughout the app"
          value={config.animations === "on"}
          onChange={v => set("animations", v ? "on" : "off")}
        />
      </div>

      {/* ── DASHBOARD WIDGETS ── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 className="w-4 h-4 text-secondary" />
          <h3 className="font-manrope font-semibold text-base text-primary">Dashboard Widgets</h3>
        </div>
        <p className="text-xs text-on-surface-variant mb-4">Choose what appears on your dashboard.</p>
        <ToggleRow
          label="Stats cards"
          desc="Stacks, stars, views and follower counts at the top"
          value={!config.hideStats}
          onChange={v => set("hideStats", !v)}
        />
        <ToggleRow
          label="Contribution graph"
          desc="Activity heatmap chart"
          value={!config.hideGraph}
          onChange={v => set("hideGraph", !v)}
        />
        <ToggleRow
          label="Notifications panel"
          desc="Recent notifications in the right sidebar"
          value={!config.hideNotifs}
          onChange={v => set("hideNotifs", !v)}
        />
      </div>

      {/* ── ACTIONS ── */}
      <div className="flex items-center gap-3 pb-4">
        <button
          onClick={applyAndSave}
          disabled={saving}
          className="flex items-center gap-2 bg-secondary text-on-secondary px-6 py-2.5 rounded-xl text-sm font-semibold font-manrope hover:opacity-90 disabled:opacity-60 transition-all"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Palette className="w-4 h-4" />}
          {saved ? "Applied!" : "Apply & Save"}
        </button>
        <button onClick={reset} className="text-sm text-on-surface-variant hover:text-primary transition-colors hover:underline">
          Reset to defaults
        </button>
      </div>
    </motion.div>
  );
}

interface ApiKey {
  id: string;
  name: string;
  keyPreview: string;
  lastUsed: string | null;
  requests: number;
  isActive: boolean;
  createdAt: string;
}

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState("Profile");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get("tab");
    if (urlTab) setTab(urlTab);
  }, []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [savingAgent, setSavingAgent] = useState(false);
  const [savedAgent, setSavedAgent] = useState(false);
  const [form, setForm] = useState({
    name: "", bio: "", university: "", department: "", level: "", website: "", location: "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [keysLoading, setKeysLoading] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/profile/settings").then(r => r.json()).then(d => {
      if (d.user) {
        setForm({
          name: d.user.name ?? "",
          bio: d.user.bio ?? "",
          university: d.user.university ?? "",
          department: d.user.department ?? "",
          level: d.user.level ?? "",
          website: d.user.website ?? "",
          location: d.user.location ?? "",
        });
        setAgentName(d.user.agentName ?? "");
        if (d.user.image) setAvatarPreview(d.user.image);
        if (d.user.banner) setBannerPreview(d.user.banner);
      }
    });
  }, [session]);

  useEffect(() => {
    if (tab !== "API Keys") return;
    setKeysLoading(true);
    fetch("/api/keys").then(r => r.json()).then(d => {
      setApiKeys(d.keys ?? []);
    }).finally(() => setKeysLoading(false));
  }, [tab]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to save");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await updateSession();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File, type: "avatar" | "banner") => {
    const setUploading = type === "avatar" ? setUploadingAvatar : setUploadingBanner;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("file", file);
      const res = await fetch("/api/profile/settings", {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      if (type === "avatar" && data.image) {
        setAvatarPreview(data.image);
        await updateSession();
      }
      if (type === "banner" && data.banner) {
        setBannerPreview(data.banner);
      }
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    setError("");
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create key"); return; }
      setNewKeyValue(data.key);
      setNewKeyName("");
      const keysRes = await fetch("/api/keys");
      const keysData = await keysRes.json();
      setApiKeys(keysData.keys ?? []);
    } finally {
      setCreatingKey(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    await fetch(`/api/keys?id=${id}`, { method: "DELETE" });
    setApiKeys(prev => prev.filter(k => k.id !== id));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error ?? "Failed to update password.");
        return;
      }
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch {
      setPasswordError("Something went wrong.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError("");
    setDeletingAccount(true);
    try {
      const res = await fetch("/api/user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error ?? "Failed to delete account.");
        setDeletingAccount(false);
        return;
      }
      await signOut({ redirect: false });
      router.push("/");
    } catch {
      setDeleteError("Something went wrong.");
      setDeletingAccount(false);
    }
  };

  const update = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const initials = form.name
    ? form.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-secondary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      <Navbar />
      <main className="flex-1 max-w-[900px] mx-auto px-4 md:px-6 py-10 w-full">
        <div className="mb-8">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />Back to dashboard
          </Link>
          <h1 className="font-manrope font-bold text-2xl md:text-3xl text-primary">Settings</h1>
        </div>

        <div className="flex gap-8 flex-col md:flex-row">
          <aside className="md:w-48 shrink-0">
            <nav className="flex md:flex-col gap-1 overflow-x-auto no-scrollbar">
              {[
                { label: "Profile", icon: User },
                { label: "AI Agent", icon: Sparkles },
                { label: "API Keys", icon: Key },
                { label: "Notifications", icon: Bell },
                { label: "Security", icon: Shield },
                { label: "Mentra Studio", icon: Palette },
              ].map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => setTab(label)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                    tab === label
                      ? "bg-secondary-container text-on-secondary-container font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="flex-1 min-w-0">
            {error && (
              <div className="mb-4 p-3 bg-error-container/20 border border-error/20 rounded-xl text-sm text-error">
                {error}
              </div>
            )}

            {tab === "Profile" && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

                {/* Banner + Avatar card */}
                <div className="card overflow-hidden">
                  {/* Banner */}
                  <div
                    className="relative h-32 bg-gradient-to-r from-primary-container via-secondary-container to-primary-fixed overflow-hidden group cursor-pointer"
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    {bannerPreview && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                    )}
                    {/* Always-visible CTA when no banner; hover overlay when banner exists */}
                    {!bannerPreview && !uploadingBanner && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex items-center gap-2 bg-surface-container-lowest/90 px-4 py-2 rounded-xl text-sm font-medium text-primary border border-outline-variant/20 shadow-sm">
                          <ImageIcon className="w-4 h-4" />
                          Upload banner
                        </div>
                      </div>
                    )}
                    {bannerPreview && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                        <div className="flex items-center gap-2 bg-surface-container-lowest/90 px-4 py-2 rounded-xl text-sm font-medium text-primary">
                          <ImageIcon className="w-4 h-4" />
                          Change banner
                        </div>
                      </div>
                    )}
                    {uploadingBanner && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = ev => setBannerPreview(ev.target?.result as string);
                      reader.readAsDataURL(file);
                      handleImageUpload(file, "banner");
                    }}
                  />

                  {/* Avatar */}
                  <div className="px-5 pb-5">
                    <div className="flex items-end gap-4 -mt-10 mb-4">
                      <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                        <div className="w-20 h-20 rounded-2xl bg-secondary-container border-4 border-surface-container-lowest flex items-center justify-center overflow-hidden">
                          {avatarPreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold font-manrope text-xl text-on-secondary-container">{initials}</span>
                          )}
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                            {uploadingAvatar ? (
                              <Loader2 className="w-5 h-5 text-on-primary animate-spin" />
                            ) : (
                              <Camera className="w-5 h-5 text-on-primary" />
                            )}
                          </div>
                        </div>
                      </div>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = ev => setAvatarPreview(ev.target?.result as string);
                          reader.readAsDataURL(file);
                          handleImageUpload(file, "avatar");
                        }}
                      />
                      <div>
                        <p className="font-manrope font-semibold text-base text-primary">{form.name || "Your name"}</p>
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="text-xs text-secondary hover:text-primary transition-colors font-medium"
                        >
                          Change photo
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile form card */}
                <div className="card p-6 space-y-5">
                  <h2 className="font-manrope font-semibold text-lg text-primary">Profile information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">Full name</label>
                      <input value={form.name} onChange={e => update("name", e.target.value)} className="input-field" placeholder="Your name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">Location</label>
                      <input value={form.location} onChange={e => update("location", e.target.value)} className="input-field" placeholder="City, Country" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">Bio</label>
                    <textarea value={form.bio} onChange={e => update("bio", e.target.value)} rows={3} className="input-field resize-none" placeholder="Tell the community about yourself..." />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">University / Organisation</label>
                      <input value={form.university} onChange={e => update("university", e.target.value)} className="input-field" placeholder="Your university or company" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">Department / Field</label>
                      <input value={form.department} onChange={e => update("department", e.target.value)} className="input-field" placeholder="Department or field of work" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">Level / Role</label>
                      <select value={form.level} onChange={e => update("level", e.target.value)} className="input-field">
                        <option value="">Select level</option>
                        {["Undergraduate", "Masters", "PhD", "Professor", "Lecturer", "Freelancer", "Creator", "Other"].map(l => (
                          <option key={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">Website</label>
                      <input value={form.website} onChange={e => update("website", e.target.value)} className="input-field" placeholder="https://yoursite.com" />
                    </div>
                  </div>
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex items-center gap-2 bg-primary text-on-primary px-6 py-2.5 rounded-xl text-sm font-semibold font-manrope hover:opacity-90 disabled:opacity-60 transition-all"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      {saved ? "Saved!" : "Save changes"}
                    </button>
                    {saved && <span className="text-sm text-secondary">Profile updated successfully.</span>}
                  </div>
                </div>
              </motion.div>
            )}

            {tab === "AI Agent" && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className="card p-6">
                  <div className="flex items-center gap-3 mb-1">
                    <Sparkles className="w-5 h-5 text-secondary" />
                    <h2 className="font-manrope font-semibold text-lg text-primary">Personal AI Agent</h2>
                  </div>
                  <p className="text-sm text-on-surface-variant mb-5">
                    Customize your personal AI agent. Access it via the floating button on your dashboard.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">Agent Name</label>
                      <p className="text-xs text-on-surface-variant mb-2">Give your agent a name. It will use this when it responds to you.</p>
                      <input
                        value={agentName}
                        onChange={e => setAgentName(e.target.value)}
                        placeholder="e.g. Mia, Aria, Max…"
                        className="input-field max-w-xs"
                        maxLength={32}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={async () => {
                          setSavingAgent(true);
                          await fetch("/api/profile/settings", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ...form, agentName }),
                          });
                          setSavingAgent(false);
                          setSavedAgent(true);
                          setTimeout(() => setSavedAgent(false), 3000);
                        }}
                        disabled={savingAgent}
                        className="flex items-center gap-2 bg-secondary text-on-secondary px-5 py-2.5 rounded-xl text-sm font-semibold font-manrope hover:opacity-90 disabled:opacity-60 transition-all"
                      >
                        {savingAgent ? <Loader2 className="w-4 h-4 animate-spin" /> : savedAgent ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {savedAgent ? "Saved!" : "Save name"}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="card p-6 border border-secondary/10 bg-secondary-container/5">
                  <p className="text-sm font-semibold text-primary mb-2">How to use your agent</p>
                  <ul className="text-sm text-on-surface-variant space-y-1.5 list-disc list-inside">
                    <li>Click the <strong>✦ sparkle button</strong> floating in the bottom-right of any page</li>
                    <li>Long-press (or hold click) the button for quick actions menu</li>
                    <li>Ask your agent to manage flows, check stats, explore communities, and more</li>
                    <li>Click <strong>Maximize</strong> in the mini chat to open the full AI chat experience</li>
                  </ul>
                </div>
              </motion.div>
            )}

            {tab === "API Keys" && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className="card p-6">
                  <h2 className="font-manrope font-semibold text-lg text-primary mb-2">API Keys</h2>
                  <p className="text-sm text-on-surface-variant mb-5">
                    Use API keys to access Mentra programmatically. Keys are shown once — store them securely.
                  </p>

                  {newKeyValue && (
                    <div className="mb-5 p-4 bg-secondary-container/30 border border-secondary/20 rounded-xl">
                      <p className="text-xs font-semibold text-secondary mb-2">New API Key — copy it now, it won&apos;t be shown again</p>
                      <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3 py-2">
                        <code className="flex-1 text-xs text-primary font-mono break-all">{newKeyValue}</code>
                        <button onClick={() => copyToClipboard(newKeyValue, "new")} className="shrink-0 text-on-surface-variant hover:text-primary transition-colors">
                          {copied === "new" ? <Check className="w-4 h-4 text-secondary" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mb-4">
                    <input
                      value={newKeyName}
                      onChange={e => setNewKeyName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleCreateKey()}
                      placeholder="Key name (e.g. My App)"
                      className="input-field flex-1"
                    />
                    <button
                      onClick={handleCreateKey}
                      disabled={creatingKey || !newKeyName.trim()}
                      className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-xl text-sm font-semibold font-manrope hover:opacity-90 disabled:opacity-60 transition-all shrink-0"
                    >
                      {creatingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Generate
                    </button>
                  </div>

                  {keysLoading ? (
                    <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-16 bg-surface-container rounded-xl animate-pulse" />)}</div>
                  ) : apiKeys.length === 0 ? (
                    <div className="text-center py-8 text-sm text-on-surface-variant">No API keys yet. Generate one above to get started.</div>
                  ) : (
                    <div className="space-y-3">
                      {apiKeys.map(key => (
                        <div key={key.id} className="flex items-center gap-4 p-4 bg-surface-container rounded-xl">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm text-primary truncate">{key.name}</p>
                              {!key.isActive && <span className="text-xs bg-error-container text-error px-2 py-0.5 rounded-full">Inactive</span>}
                            </div>
                            <p className="text-xs text-on-surface-variant font-mono">{key.keyPreview}</p>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              {key.requests} requests · {key.lastUsed ? `Last used ${new Date(key.lastUsed).toLocaleDateString()}` : "Never used"}
                            </p>
                          </div>
                          <button onClick={() => handleDeleteKey(key.id)} className="text-on-surface-variant hover:text-error transition-colors p-2 rounded-lg hover:bg-error-container/20">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {tab === "Notifications" && <NotificationsTab />}
            {tab === "Mentra Studio" && <StudioTab />}

            {tab === "Security" && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className="card p-6">
                  <h2 className="font-manrope font-semibold text-lg text-primary mb-5">Change password</h2>
                  {passwordSuccess && (
                    <div className="mb-4 flex items-center gap-2 p-3 bg-secondary-container/30 border border-secondary/20 rounded-xl text-sm text-secondary">
                      <Check className="w-4 h-4" />Password updated successfully.
                    </div>
                  )}
                  {passwordError && (
                    <div className="mb-4 p-3 bg-error-container/20 border border-error/20 rounded-xl text-sm text-error">
                      {passwordError}
                    </div>
                  )}
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">Current password</label>
                      <div className="relative">
                        <input type={showCurrentPw ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="input-field pr-12" placeholder="Enter current password" required />
                        <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary p-1">
                          {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">New password</label>
                      <div className="relative">
                        <input type={showNewPw ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field pr-12" placeholder="At least 8 characters" required minLength={8} />
                        <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary p-1">
                          {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">Confirm new password</label>
                      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-field" placeholder="Re-enter new password" required />
                    </div>
                    <button type="submit" disabled={savingPassword} className="flex items-center gap-2 bg-primary text-on-primary px-6 py-2.5 rounded-xl text-sm font-semibold font-manrope hover:opacity-90 disabled:opacity-60 transition-all">
                      {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                      Update password
                    </button>
                  </form>
                </div>

                <div className="card p-6 border border-error/20">
                  <h3 className="font-manrope font-semibold text-base text-error mb-2">Danger zone</h3>
                  <p className="text-sm text-on-surface-variant mb-4">
                    Permanently delete your account and all your stacks. This cannot be undone.
                  </p>
                  {!showDeleteConfirm ? (
                    <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 border border-error/30 text-error px-4 py-2.5 rounded-xl text-sm font-semibold font-manrope hover:bg-error-container/20 transition-all">
                      <Trash2 className="w-4 h-4" />Delete account
                    </button>
                  ) : (
                    <div className="space-y-4 p-4 bg-error-container/10 border border-error/20 rounded-xl">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                        <p className="text-sm text-error font-medium">Enter your password to confirm account deletion.</p>
                      </div>
                      {deleteError && <p className="text-sm text-error">{deleteError}</p>}
                      <input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} placeholder="Your current password" className="input-field border-error/30" />
                      <div className="flex gap-3">
                        <button onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); setDeleteError(""); }} className="px-4 py-2 text-sm text-on-surface-variant hover:text-primary transition-colors">Cancel</button>
                        <button onClick={handleDeleteAccount} disabled={deletingAccount || !deletePassword} className="flex items-center gap-2 bg-error text-on-error px-5 py-2 rounded-xl text-sm font-semibold font-manrope hover:opacity-90 disabled:opacity-60 transition-all">
                          {deletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          Delete my account
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
