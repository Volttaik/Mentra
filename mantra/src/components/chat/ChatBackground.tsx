"use client";

import { useEffect, useState } from "react";

export type ChatBgId = "none" | "cosmos" | "aurora" | "orbs" | "constellation" | "prism" | "nebula" | "waves";

// ─── Individual SVG Backgrounds ────────────────────────────────────────────

function CosmosBackground() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="cosmos-planet" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.22"/>
          <stop offset="60%" stopColor="#4F46E5" stopOpacity="0.10"/>
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="cosmos-moon" cx="40%" cy="35%" r="50%">
          <stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.30"/>
          <stop offset="70%" stopColor="#CBD5E1" stopOpacity="0.10"/>
          <stop offset="100%" stopColor="#94A3B8" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="cosmos-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6D28D9" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="#6D28D9" stopOpacity="0"/>
        </radialGradient>
        <filter id="cosmos-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10"/>
        </filter>
        <filter id="cosmos-softblur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4"/>
        </filter>
      </defs>

      {/* Planet glow halo */}
      <circle cx="700" cy="530" r="300" fill="url(#cosmos-glow)" filter="url(#cosmos-blur)" />
      {/* Planet body */}
      <circle cx="700" cy="530" r="210" fill="url(#cosmos-planet)" />
      {/* Planet rings */}
      <ellipse cx="700" cy="516" rx="295" ry="42" fill="none"
        stroke="#7C3AED" strokeWidth="1.5" strokeOpacity="0.14"
        transform="rotate(-14 700 516)" />
      <ellipse cx="700" cy="516" rx="255" ry="32" fill="none"
        stroke="#9F7AEA" strokeWidth="1" strokeOpacity="0.09"
        transform="rotate(-14 700 516)" />
      <ellipse cx="700" cy="516" rx="215" ry="22" fill="none"
        stroke="#C4B5FD" strokeWidth="0.6" strokeOpacity="0.08"
        transform="rotate(-14 700 516)" />

      {/* Moon body */}
      <circle cx="108" cy="88" r="68" fill="url(#cosmos-moon)" />
      {/* Moon craters */}
      <circle cx="90" cy="72" r="12" fill="none" stroke="#94A3B8" strokeWidth="0.6" strokeOpacity="0.20"/>
      <circle cx="128" cy="100" r="8" fill="none" stroke="#94A3B8" strokeWidth="0.5" strokeOpacity="0.14"/>
      <circle cx="100" cy="108" r="5" fill="none" stroke="#94A3B8" strokeWidth="0.4" strokeOpacity="0.12"/>
      {/* Moon soft shadow */}
      <circle cx="118" cy="98" r="68" fill="#1E1B4B" fillOpacity="0.04" filter="url(#cosmos-softblur)" />

      {/* Stars */}
      {([
        [190,60,1.4],[320,38,0.9],[455,82,1.1],[568,48,0.8],[650,110,1.0],
        [260,185,0.8],[408,162,1.3],[520,220,0.9],[160,240,1.0],[600,260,0.7],
        [70,340,1.2],[310,305,0.8],[460,340,1.0],[560,370,0.7],[720,180,0.9],
        [40,130,0.8],[748,310,1.0],[380,430,0.8],[150,410,0.9],
      ] as [number,number,number][]).map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="currentColor" fillOpacity="0.18"/>
      ))}

      {/* Bright sparkle */}
      <circle cx="400" cy="130" r="2.5" fill="currentColor" fillOpacity="0.22"/>
      <circle cx="240" cy="310" r="2" fill="currentColor" fillOpacity="0.16"/>
      <circle cx="560" cy="200" r="2.2" fill="currentColor" fillOpacity="0.18"/>
    </svg>
  );
}

function AuroraBackground() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="aurora-1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0"/>
          <stop offset="35%" stopColor="#10B981" stopOpacity="0.14"/>
          <stop offset="70%" stopColor="#6D28D9" stopOpacity="0.10"/>
          <stop offset="100%" stopColor="#6D28D9" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="aurora-2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6D28D9" stopOpacity="0"/>
          <stop offset="40%" stopColor="#2563EB" stopOpacity="0.12"/>
          <stop offset="75%" stopColor="#10B981" stopOpacity="0.08"/>
          <stop offset="100%" stopColor="#10B981" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="aurora-3" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#EC4899" stopOpacity="0"/>
          <stop offset="45%" stopColor="#8B5CF6" stopOpacity="0.10"/>
          <stop offset="80%" stopColor="#3B82F6" stopOpacity="0.07"/>
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0"/>
        </linearGradient>
        <filter id="aurora-blur" x="-10%" y="-50%" width="120%" height="200%">
          <feGaussianBlur stdDeviation="22"/>
        </filter>
      </defs>
      <path d="M-60 185 Q 150 110, 400 195 T 860 152" stroke="url(#aurora-1)" strokeWidth="110" fill="none" filter="url(#aurora-blur)"/>
      <path d="M-60 305 Q 180 240, 400 318 T 860 268" stroke="url(#aurora-2)" strokeWidth="90" fill="none" filter="url(#aurora-blur)"/>
      <path d="M-60 435 Q 200 365, 400 445 T 860 388" stroke="url(#aurora-3)" strokeWidth="78" fill="none" filter="url(#aurora-blur)"/>
    </svg>
  );
}

function OrbsBackground() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="orb-1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.22"/>
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="orb-2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="orb-3" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="orb-4" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#EC4899" stopOpacity="0.14"/>
          <stop offset="100%" stopColor="#EC4899" stopOpacity="0"/>
        </radialGradient>
        <filter id="orb-blur" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="14"/>
        </filter>
      </defs>
      <circle cx="650" cy="480" r="230" fill="url(#orb-1)" filter="url(#orb-blur)"/>
      <circle cx="110" cy="140" r="185" fill="url(#orb-2)" filter="url(#orb-blur)"/>
      <circle cx="410" cy="90" r="140" fill="url(#orb-3)" filter="url(#orb-blur)"/>
      <circle cx="690" cy="110" r="155" fill="url(#orb-4)" filter="url(#orb-blur)"/>
    </svg>
  );
}

function ConstellationBackground() {
  const nodes: [number, number][] = [
    [80,120],[200,75],[350,148],[480,85],[625,178],
    [148,285],[308,322],[455,258],[610,298],[725,218],
    [95,455],[255,482],[405,418],[558,462],[705,398],
    [180,170],[390,210],[530,150],[680,340],[55,305],
  ];
  const edges = [
    [0,1],[1,2],[2,3],[3,4],[0,5],[1,5],[5,6],[6,7],[7,8],[8,9],[3,7],
    [5,10],[10,11],[11,12],[12,13],[13,14],[6,11],[9,14],[2,6],[4,8],
    [1,15],[15,16],[16,17],[3,17],[8,18],[14,18],[5,19],[19,10],
  ];
  return (
    <svg width="100%" height="100%" viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      {edges.map(([a, b], i) => (
        <line key={i} x1={nodes[a][0]} y1={nodes[a][1]}
          x2={nodes[b][0]} y2={nodes[b][1]}
          stroke="currentColor" strokeOpacity="0.09" strokeWidth="0.7"/>
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 5 === 0 ? 3 : 2}
          fill="currentColor" fillOpacity={i % 5 === 0 ? 0.20 : 0.14}/>
      ))}
    </svg>
  );
}

function PrismBackground() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="prism-1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0.04"/>
        </linearGradient>
        <linearGradient id="prism-2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#EC4899" stopOpacity="0.13"/>
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.03"/>
        </linearGradient>
        <linearGradient id="prism-3" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.10"/>
          <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.03"/>
        </linearGradient>
        <linearGradient id="prism-4" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.11"/>
          <stop offset="100%" stopColor="#EF4444" stopOpacity="0.03"/>
        </linearGradient>
      </defs>
      {/* Large corner triangle top-right */}
      <polygon points="680,0 800,0 800,240" fill="url(#prism-1)"/>
      {/* Diamond left */}
      <polygon points="95,285 160,200 225,285 160,370" fill="url(#prism-2)"/>
      {/* Triangle bottom-left */}
      <polygon points="0,475 130,380 80,560" fill="url(#prism-3)"/>
      {/* Diamond top-center */}
      <polygon points="340,50 385,10 430,50 385,90" fill="url(#prism-4)"/>
      {/* Triangle bottom-right */}
      <polygon points="610,510 760,450 730,580" fill="url(#prism-2)"/>
      {/* Small accent top-left */}
      <polygon points="20,60 55,20 90,60 55,100" fill="url(#prism-1)"/>
      {/* Grid lines */}
      <line x1="0" y1="0" x2="800" y2="600" stroke="currentColor" strokeOpacity="0.04" strokeWidth="0.8"/>
      <line x1="800" y1="0" x2="0" y2="600" stroke="currentColor" strokeOpacity="0.04" strokeWidth="0.8"/>
      <line x1="400" y1="0" x2="400" y2="600" stroke="currentColor" strokeOpacity="0.03" strokeWidth="0.5"/>
      <line x1="0" y1="300" x2="800" y2="300" stroke="currentColor" strokeOpacity="0.03" strokeWidth="0.5"/>
    </svg>
  );
}

function NebulaBackground() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="neb-1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.22"/>
          <stop offset="55%" stopColor="#EC4899" stopOpacity="0.09"/>
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="neb-2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.20"/>
          <stop offset="55%" stopColor="#10B981" stopOpacity="0.08"/>
          <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="neb-3" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.16"/>
          <stop offset="60%" stopColor="#EC4899" stopOpacity="0.06"/>
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0"/>
        </radialGradient>
        <filter id="neb-blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="35"/>
        </filter>
      </defs>
      <ellipse cx="610" cy="185" rx="290" ry="200" fill="url(#neb-1)" filter="url(#neb-blur)"/>
      <ellipse cx="145" cy="430" rx="255" ry="190" fill="url(#neb-2)" filter="url(#neb-blur)"/>
      <ellipse cx="400" cy="340" rx="210" ry="160" fill="url(#neb-3)" filter="url(#neb-blur)"/>
    </svg>
  );
}

function WavesBackground() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wave-1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.13"/>
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.05"/>
        </linearGradient>
        <linearGradient id="wave-2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.11"/>
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0.04"/>
        </linearGradient>
        <linearGradient id="wave-3" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.09"/>
          <stop offset="100%" stopColor="#10B981" stopOpacity="0.03"/>
        </linearGradient>
        {/* Top waves */}
        <linearGradient id="wave-4" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#6D28D9" stopOpacity="0.10"/>
          <stop offset="100%" stopColor="#6D28D9" stopOpacity="0.03"/>
        </linearGradient>
      </defs>
      {/* Bottom waves */}
      <path d="M0 415 Q100 378,200 415 T400 408 T600 418 T800 400 L800 600 L0 600 Z"
        fill="url(#wave-1)"/>
      <path d="M0 455 Q120 428,260 460 T520 445 T800 455 L800 600 L0 600 Z"
        fill="url(#wave-2)"/>
      <path d="M0 498 Q160 476,320 502 T640 488 T800 498 L800 600 L0 600 Z"
        fill="url(#wave-3)"/>
      {/* Top waves (inverted, smaller) */}
      <path d="M0 0 L0 55 Q 200 80, 400 52 T 800 65 L800 0 Z"
        fill="url(#wave-4)"/>
    </svg>
  );
}

// ─── Background Map ─────────────────────────────────────────────────────────

const BG_MAP: Record<ChatBgId, React.ReactNode | null> = {
  none: null,
  cosmos: <CosmosBackground />,
  aurora: <AuroraBackground />,
  orbs: <OrbsBackground />,
  constellation: <ConstellationBackground />,
  prism: <PrismBackground />,
  nebula: <NebulaBackground />,
  waves: <WavesBackground />,
};

// ─── Main component ─────────────────────────────────────────────────────────

export default function ChatBackground() {
  const [design, setDesign] = useState<ChatBgId>("none");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mentra-studio-config");
      if (raw) {
        const cfg = JSON.parse(raw);
        if (cfg.chatBg) setDesign(cfg.chatBg as ChatBgId);
      }
    } catch { /* ignore */ }
  }, []);

  const bg = BG_MAP[design];
  if (!bg) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none" aria-hidden>
      {bg}
    </div>
  );
}

// ─── Thumbnail previews (used in settings picker) ───────────────────────────

export const CHAT_BG_OPTIONS: {
  id: ChatBgId;
  label: string;
  description: string;
  thumbnail: React.ReactNode;
}[] = [
  {
    id: "none",
    label: "Clean",
    description: "No background",
    thumbnail: (
      <div className="w-full h-full flex items-center justify-center bg-surface-container/20 rounded-lg">
        <span className="text-[10px] text-on-surface-variant/40 font-medium tracking-wide uppercase">None</span>
      </div>
    ),
  },
  {
    id: "cosmos",
    label: "Cosmos",
    description: "Planet + moon with star dust",
    thumbnail: (
      <svg viewBox="0 0 80 52" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="th-planet"><stop offset="0%" stopColor="#7C3AED" stopOpacity="0.5"/><stop offset="100%" stopColor="#7C3AED" stopOpacity="0"/></radialGradient>
          <radialGradient id="th-moon"><stop offset="0%" stopColor="#CBD5E1" stopOpacity="0.6"/><stop offset="100%" stopColor="#CBD5E1" stopOpacity="0"/></radialGradient>
        </defs>
        <circle cx="66" cy="44" r="22" fill="url(#th-planet)"/>
        <ellipse cx="66" cy="43" rx="31" ry="5" fill="none" stroke="#7C3AED" strokeWidth="0.7" strokeOpacity="0.35" transform="rotate(-12 66 43)"/>
        <circle cx="14" cy="10" r="9" fill="url(#th-moon)"/>
        <circle cx="35" cy="14" r="0.8" fill="white" fillOpacity="0.5"/>
        <circle cx="50" cy="8" r="0.6" fill="white" fillOpacity="0.45"/>
        <circle cx="22" cy="30" r="0.7" fill="white" fillOpacity="0.4"/>
        <circle cx="58" cy="22" r="0.6" fill="white" fillOpacity="0.38"/>
        <circle cx="30" cy="40" r="0.5" fill="white" fillOpacity="0.35"/>
      </svg>
    ),
  },
  {
    id: "aurora",
    label: "Aurora",
    description: "Northern lights gradient bands",
    thumbnail: (
      <svg viewBox="0 0 80 52" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="th-au1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#10B981" stopOpacity="0"/><stop offset="50%" stopColor="#10B981" stopOpacity="0.55"/><stop offset="100%" stopColor="#6D28D9" stopOpacity="0"/></linearGradient>
          <linearGradient id="th-au2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#6D28D9" stopOpacity="0"/><stop offset="50%" stopColor="#2563EB" stopOpacity="0.45"/><stop offset="100%" stopColor="#10B981" stopOpacity="0"/></linearGradient>
          <linearGradient id="th-au3" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#EC4899" stopOpacity="0"/><stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.40"/><stop offset="100%" stopColor="#3B82F6" stopOpacity="0"/></linearGradient>
          <filter id="th-aublur"><feGaussianBlur stdDeviation="4"/></filter>
        </defs>
        <path d="M0 16 Q 20 10, 40 17 T 80 13" stroke="url(#th-au1)" strokeWidth="16" fill="none" filter="url(#th-aublur)"/>
        <path d="M0 28 Q 20 22, 40 29 T 80 25" stroke="url(#th-au2)" strokeWidth="13" fill="none" filter="url(#th-aublur)"/>
        <path d="M0 40 Q 20 34, 40 41 T 80 37" stroke="url(#th-au3)" strokeWidth="11" fill="none" filter="url(#th-aublur)"/>
      </svg>
    ),
  },
  {
    id: "orbs",
    label: "Orbs",
    description: "Soft floating colour orbs",
    thumbnail: (
      <svg viewBox="0 0 80 52" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="th-o1"><stop offset="0%" stopColor="#7C3AED" stopOpacity="0.55"/><stop offset="100%" stopColor="#7C3AED" stopOpacity="0"/></radialGradient>
          <radialGradient id="th-o2"><stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.50"/><stop offset="100%" stopColor="#0EA5E9" stopOpacity="0"/></radialGradient>
          <radialGradient id="th-o3"><stop offset="0%" stopColor="#F59E0B" stopOpacity="0.45"/><stop offset="100%" stopColor="#F59E0B" stopOpacity="0"/></radialGradient>
          <radialGradient id="th-o4"><stop offset="0%" stopColor="#EC4899" stopOpacity="0.40"/><stop offset="100%" stopColor="#EC4899" stopOpacity="0"/></radialGradient>
          <filter id="th-oblur"><feGaussianBlur stdDeviation="3"/></filter>
        </defs>
        <circle cx="62" cy="40" r="22" fill="url(#th-o1)" filter="url(#th-oblur)"/>
        <circle cx="14" cy="14" r="18" fill="url(#th-o2)" filter="url(#th-oblur)"/>
        <circle cx="42" cy="10" r="13" fill="url(#th-o3)" filter="url(#th-oblur)"/>
        <circle cx="66" cy="10" r="14" fill="url(#th-o4)" filter="url(#th-oblur)"/>
      </svg>
    ),
  },
  {
    id: "constellation",
    label: "Constellation",
    description: "Connected star map",
    thumbnail: (
      <svg viewBox="0 0 80 52" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {([
          [[10,8],[25,5],[42,12],[58,7],[72,14]],
          [[15,25],[32,28],[48,22],[62,28],[75,20]],
          [[8,42],[26,45],[44,40],[60,44],[72,38]],
        ] as [number,number][][]).flatMap((row, ri) =>
          row.slice(0,-1).map(([x1,y1], ci) => {
            const [x2,y2] = row[ci+1];
            return <line key={`${ri}-${ci}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeOpacity="0.25" strokeWidth="0.6"/>;
          })
        )}
        {([
          [10,8],[25,5],[42,12],[58,7],[72,14],
          [15,25],[32,28],[48,22],[62,28],[75,20],
          [8,42],[26,45],[44,40],[60,44],[72,38],
        ] as [number,number][]).map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r={i%4===0?2:1.3} fill="currentColor" fillOpacity={i%4===0?0.45:0.30}/>
        ))}
        <line x1="10" y1="8" x2="15" y2="25" stroke="currentColor" strokeOpacity="0.18" strokeWidth="0.5"/>
        <line x1="42" y1="12" x2="48" y2="22" stroke="currentColor" strokeOpacity="0.18" strokeWidth="0.5"/>
        <line x1="72" y1="14" x2="75" y2="20" stroke="currentColor" strokeOpacity="0.18" strokeWidth="0.5"/>
        <line x1="26" y1="45" x2="32" y2="28" stroke="currentColor" strokeOpacity="0.18" strokeWidth="0.5"/>
        <line x1="60" y1="44" x2="62" y2="28" stroke="currentColor" strokeOpacity="0.18" strokeWidth="0.5"/>
      </svg>
    ),
  },
  {
    id: "prism",
    label: "Prism",
    description: "Geometric shapes & facets",
    thumbnail: (
      <svg viewBox="0 0 80 52" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="th-p1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#7C3AED" stopOpacity="0.40"/><stop offset="100%" stopColor="#2563EB" stopOpacity="0.10"/></linearGradient>
          <linearGradient id="th-p2" x1="100%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#EC4899" stopOpacity="0.35"/><stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.08"/></linearGradient>
          <linearGradient id="th-p3" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#10B981" stopOpacity="0.30"/><stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.08"/></linearGradient>
        </defs>
        <polygon points="62,0 80,0 80,28" fill="url(#th-p1)"/>
        <polygon points="8,22 18,10 28,22 18,34" fill="url(#th-p2)"/>
        <polygon points="0,44 16,34 10,52" fill="url(#th-p3)"/>
        <polygon points="36,4 44,0 52,4 44,8" fill="url(#th-p1)"/>
        <polygon points="55,44 72,38 68,52" fill="url(#th-p2)"/>
        <line x1="0" y1="0" x2="80" y2="52" stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.6"/>
        <line x1="80" y1="0" x2="0" y2="52" stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.6"/>
      </svg>
    ),
  },
  {
    id: "nebula",
    label: "Nebula",
    description: "Soft cosmic cloud gradient",
    thumbnail: (
      <svg viewBox="0 0 80 52" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="th-n1"><stop offset="0%" stopColor="#7C3AED" stopOpacity="0.55"/><stop offset="55%" stopColor="#EC4899" stopOpacity="0.22"/><stop offset="100%" stopColor="#7C3AED" stopOpacity="0"/></radialGradient>
          <radialGradient id="th-n2"><stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.50"/><stop offset="55%" stopColor="#10B981" stopOpacity="0.20"/><stop offset="100%" stopColor="#0EA5E9" stopOpacity="0"/></radialGradient>
          <radialGradient id="th-n3"><stop offset="0%" stopColor="#F59E0B" stopOpacity="0.45"/><stop offset="60%" stopColor="#EC4899" stopOpacity="0.15"/><stop offset="100%" stopColor="#F59E0B" stopOpacity="0"/></radialGradient>
          <filter id="th-nblur"><feGaussianBlur stdDeviation="6"/></filter>
        </defs>
        <ellipse cx="60" cy="16" rx="28" ry="18" fill="url(#th-n1)" filter="url(#th-nblur)"/>
        <ellipse cx="15" cy="40" rx="24" ry="17" fill="url(#th-n2)" filter="url(#th-nblur)"/>
        <ellipse cx="40" cy="34" rx="20" ry="14" fill="url(#th-n3)" filter="url(#th-nblur)"/>
      </svg>
    ),
  },
  {
    id: "waves",
    label: "Waves",
    description: "Layered flowing wave forms",
    thumbnail: (
      <svg viewBox="0 0 80 52" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="th-w1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#7C3AED" stopOpacity="0.40"/><stop offset="100%" stopColor="#7C3AED" stopOpacity="0.14"/></linearGradient>
          <linearGradient id="th-w2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#2563EB" stopOpacity="0.35"/><stop offset="100%" stopColor="#2563EB" stopOpacity="0.10"/></linearGradient>
          <linearGradient id="th-w3" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#10B981" stopOpacity="0.30"/><stop offset="100%" stopColor="#10B981" stopOpacity="0.08"/></linearGradient>
          <linearGradient id="th-w4" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stopColor="#6D28D9" stopOpacity="0.30"/><stop offset="100%" stopColor="#6D28D9" stopOpacity="0.08"/></linearGradient>
        </defs>
        <path d="M0 32 Q10 28,20 32 T40 30 T60 32 T80 28 L80 52 L0 52 Z" fill="url(#th-w1)"/>
        <path d="M0 38 Q12 34,25 38 T50 35 T80 38 L80 52 L0 52 Z" fill="url(#th-w2)"/>
        <path d="M0 44 Q16 41,32 44 T64 41 T80 44 L80 52 L0 52 Z" fill="url(#th-w3)"/>
        <path d="M0 0 L0 6 Q20 10,40 6 T80 8 L80 0 Z" fill="url(#th-w4)"/>
      </svg>
    ),
  },
];
