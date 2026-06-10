"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Wifi, Download, Check, AlertCircle, Loader2, WifiOff, ExternalLink, RefreshCw } from "lucide-react";

const PASSWORD = "liquid4*";

export default function ConnectorPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [status, setStatus] = useState<{ connected: boolean; waNumber?: string; connectedAt?: string } | null>(null);
  const [form, setForm] = useState({ webhookUrl: "", sharedSecret: "", waNumber: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (!unlocked) return;
    const fetchStatus = () => {
      fetch("/api/gateway/status").then(r => r.json()).then(setStatus);
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [unlocked]);

  const unlock = () => {
    if (pw === PASSWORD) { setUnlocked(true); setPwError(false); }
    else { setPwError(true); }
  };

  const saveConfig = async () => {
    if (!form.webhookUrl || !form.sharedSecret || !form.waNumber) {
      setError("All fields are required."); return;
    }
    setSaving(true); setError("");
    const res = await fetch("/api/gateway/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: PASSWORD, ...form }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.error) { setError(data.error); }
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  };

  if (!unlocked) return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-white font-manrope">Connector</h1>
          <p className="text-sm text-white/40 mt-1">This page is restricted.</p>
        </div>
        <div className="space-y-3">
          <input
            type="password"
            value={pw}
            onChange={e => { setPw(e.target.value); setPwError(false); }}
            onKeyDown={e => e.key === "Enter" && unlock()}
            placeholder="Enter access password"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/40 text-sm"
            autoFocus
          />
          {pwError && <p className="text-xs text-red-400 text-center">Incorrect password.</p>}
          <button
            onClick={unlock}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl text-sm transition-all"
          >
            Unlock
          </button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-manrope text-white">Mentra Gateway Connector</h1>
          <p className="text-white/50 text-sm mt-1">Connect a WhatsApp gateway to enable WhatsApp AI integration.</p>
        </div>

        {/* Status */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border mb-8 ${status?.connected ? "bg-green-500/10 border-green-500/20" : "bg-white/5 border-white/10"}`}>
          {status?.connected ? <Wifi className="w-5 h-5 text-green-400" /> : <WifiOff className="w-5 h-5 text-white/40" />}
          <div>
            <p className={`text-sm font-semibold ${status?.connected ? "text-green-400" : "text-white/60"}`}>
              {status?.connected ? "Gateway Connected" : "No Gateway Connected"}
            </p>
            {status?.connected && status.waNumber && (
              <p className="text-xs text-white/40">Number: {status.waNumber} · Connected {new Date(status.connectedAt!).toLocaleString()}</p>
            )}
          </div>
        </div>

        {/* Step 1: Download */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-400 font-bold text-sm">1</div>
            <h2 className="font-semibold text-white">Download the Gateway</h2>
          </div>
          <p className="text-sm text-white/50 mb-4">
            Download the gateway code, then deploy it on Railway, Render, or any Node.js host.
            The gateway connects your WhatsApp number to Mentra.
          </p>
          <a
            href="/api/gateway/download"
            download="mentra-gateway.zip"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl text-sm transition-all"
          >
            <Download className="w-4 h-4" /> Download mentra-gateway.zip
          </a>
          <div className="mt-4 p-3 bg-black/30 rounded-xl">
            <p className="text-xs text-white/40 font-mono">Required env vars on Railway:</p>
            <p className="text-xs text-amber-300/80 font-mono mt-1">MENTRA_URL=https://your-mentra-domain.com</p>
            <p className="text-xs text-amber-300/80 font-mono">GATEWAY_SECRET=your-shared-secret</p>
          </div>
        </div>

        {/* Step 2: Connect */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-400 font-bold text-sm">2</div>
            <h2 className="font-semibold text-white">Connect the Gateway</h2>
          </div>
          <p className="text-sm text-white/50 mb-4">
            After deploying the gateway, paste its URL below. The gateway will automatically call back to confirm connection.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Gateway URL (where you deployed it)</label>
              <input
                value={form.webhookUrl}
                onChange={e => setForm(f => ({ ...f, webhookUrl: e.target.value }))}
                placeholder="https://my-gateway.railway.app"
                className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-amber-500/40"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Shared Secret (must match GATEWAY_SECRET env var)</label>
              <input
                value={form.sharedSecret}
                onChange={e => setForm(f => ({ ...f, sharedSecret: e.target.value }))}
                placeholder="a-strong-random-secret"
                className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-amber-500/40"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">WhatsApp Number (international format, no +)</label>
              <input
                value={form.waNumber}
                onChange={e => setForm(f => ({ ...f, waNumber: e.target.value }))}
                placeholder="2348012345678"
                className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-amber-500/40"
              />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              onClick={saveConfig}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl text-sm transition-all disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
              {saved ? "Saved!" : "Save & Connect"}
            </button>
          </div>
        </div>

        {/* Step 3: Test */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-400 font-bold text-sm">3</div>
            <h2 className="font-semibold text-white">Test the Connection</h2>
          </div>
          <p className="text-sm text-white/50">
            Once saved, open WhatsApp and message the configured number. Send <code className="text-amber-300 bg-black/30 px-1 rounded">hi</code> — it will ask for your API key.
            Paste your Mentra API key and you&apos;re connected!
          </p>
        </div>
      </div>
    </div>
  );
}
