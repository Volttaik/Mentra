"use client";

import { useEffect, useState } from "react";

export type ChatBgId =
  | "none" | "cosmos" | "aurora" | "orbs" | "constellation"
  | "prism" | "nebula" | "waves" | "gradient" | "geometric" | "matrix";

// ─── Animated SVG Backgrounds ────────────────────────────────────────────────

function CosmosBackground() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>{`
          .cs-star { animation: cs-twinkle var(--d,3s) ease-in-out infinite var(--delay,0s); }
          @keyframes cs-twinkle { 0%,100%{fill-opacity:0.16} 50%{fill-opacity:0.50} }
          .cs-glow { animation: cs-pulse 5s ease-in-out infinite; }
          @keyframes cs-pulse { 0%,100%{opacity:0.85} 50%{opacity:1} }
          .cs-ring { animation: cs-ring-drift 20s linear infinite; transform-origin: 700px 516px; }
          @keyframes cs-ring-drift { 0%{transform:rotate(-14deg)} 100%{transform:rotate(346deg)} }
        `}</style>
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
      <circle className="cs-glow" cx="700" cy="530" r="300" fill="url(#cosmos-glow)" filter="url(#cosmos-blur)" />
      <circle cx="700" cy="530" r="210" fill="url(#cosmos-planet)" />
      <ellipse className="cs-ring" cx="700" cy="516" rx="295" ry="42" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeOpacity="0.14" />
      <ellipse cx="700" cy="516" rx="255" ry="32" fill="none" stroke="#9F7AEA" strokeWidth="1" strokeOpacity="0.09" transform="rotate(-14 700 516)" />
      <ellipse cx="700" cy="516" rx="215" ry="22" fill="none" stroke="#C4B5FD" strokeWidth="0.6" strokeOpacity="0.08" transform="rotate(-14 700 516)" />
      <circle cx="108" cy="88" r="68" fill="url(#cosmos-moon)" />
      <circle cx="90" cy="72" r="12" fill="none" stroke="#94A3B8" strokeWidth="0.6" strokeOpacity="0.20"/>
      <circle cx="128" cy="100" r="8" fill="none" stroke="#94A3B8" strokeWidth="0.5" strokeOpacity="0.14"/>
      <circle cx="100" cy="108" r="5" fill="none" stroke="#94A3B8" strokeWidth="0.4" strokeOpacity="0.12"/>
      <circle cx="118" cy="98" r="68" fill="#1E1B4B" fillOpacity="0.04" filter="url(#cosmos-softblur)" />
      {([
        [190,60,1.4,0],[320,38,0.9,0.4],[455,82,1.1,0.8],[568,48,0.8,1.2],[650,110,1.0,0.3],
        [260,185,0.8,1.5],[408,162,1.3,0.1],[520,220,0.9,0.7],[160,240,1.0,1.1],[600,260,0.7,1.8],
        [70,340,1.2,0.5],[310,305,0.8,2.0],[460,340,1.0,0.9],[560,370,0.7,1.4],[720,180,0.9,0.2],
        [40,130,0.8,2.2],[748,310,1.0,0.6],[380,430,0.8,1.7],[150,410,0.9,1.0],
      ] as [number,number,number,number][]).map(([x, y, r, delay], i) => (
        <circle key={i} className="cs-star" cx={x} cy={y} r={r} fill="currentColor" fillOpacity="0.16"
          style={{ "--d": `${2.5 + (i % 3) * 0.8}s`, "--delay": `${delay}s` } as React.CSSProperties} />
      ))}
      <circle cx="400" cy="130" r="2.5" fill="currentColor" fillOpacity="0.22">
        <animate attributeName="fill-opacity" values="0.22;0.55;0.22" dur="2.2s" repeatCount="indefinite" begin="0.3s"/>
      </circle>
      <circle cx="240" cy="310" r="2" fill="currentColor" fillOpacity="0.16">
        <animate attributeName="fill-opacity" values="0.16;0.40;0.16" dur="3s" repeatCount="indefinite" begin="1.1s"/>
      </circle>
      <circle cx="560" cy="200" r="2.2" fill="currentColor" fillOpacity="0.18">
        <animate attributeName="fill-opacity" values="0.18;0.48;0.18" dur="2.8s" repeatCount="indefinite" begin="0.7s"/>
      </circle>
    </svg>
  );
}

function AuroraBackground() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>{`
          .au-band1 { animation: au-drift1 8s ease-in-out infinite; }
          .au-band2 { animation: au-drift2 10s ease-in-out infinite; }
          .au-band3 { animation: au-drift3 12s ease-in-out infinite; }
          @keyframes au-drift1 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-14px)} }
          @keyframes au-drift2 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(10px)} }
          @keyframes au-drift3 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-8px)} }
        `}</style>
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
      <path className="au-band1" d="M-60 185 Q 150 110, 400 195 T 860 152" stroke="url(#aurora-1)" strokeWidth="110" fill="none" filter="url(#aurora-blur)"/>
      <path className="au-band2" d="M-60 305 Q 180 240, 400 318 T 860 268" stroke="url(#aurora-2)" strokeWidth="90" fill="none" filter="url(#aurora-blur)"/>
      <path className="au-band3" d="M-60 435 Q 200 365, 400 445 T 860 388" stroke="url(#aurora-3)" strokeWidth="78" fill="none" filter="url(#aurora-blur)"/>
    </svg>
  );
}

function OrbsBackground() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>{`
          .orb1 { animation: orb-f1 9s ease-in-out infinite; transform-origin: 650px 480px; }
          .orb2 { animation: orb-f2 11s ease-in-out infinite; transform-origin: 110px 140px; }
          .orb3 { animation: orb-f3 7s ease-in-out infinite; transform-origin: 410px 90px; }
          .orb4 { animation: orb-f4 13s ease-in-out infinite; transform-origin: 690px 110px; }
          @keyframes orb-f1 { 0%,100%{transform:translate(0,0)} 33%{transform:translate(-18px,-14px)} 66%{transform:translate(12px,-22px)} }
          @keyframes orb-f2 { 0%,100%{transform:translate(0,0)} 33%{transform:translate(16px,18px)} 66%{transform:translate(-12px,10px)} }
          @keyframes orb-f3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,16px)} }
          @keyframes orb-f4 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-16px,20px)} }
        `}</style>
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
      <circle className="orb1" cx="650" cy="480" r="230" fill="url(#orb-1)" filter="url(#orb-blur)"/>
      <circle className="orb2" cx="110" cy="140" r="185" fill="url(#orb-2)" filter="url(#orb-blur)"/>
      <circle className="orb3" cx="410" cy="90" r="140" fill="url(#orb-3)" filter="url(#orb-blur)"/>
      <circle className="orb4" cx="690" cy="110" r="155" fill="url(#orb-4)" filter="url(#orb-blur)"/>
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
      <defs>
        <style>{`
          .cn-edge { animation: cn-fade 4s ease-in-out infinite var(--d,0s); }
          @keyframes cn-fade { 0%,100%{stroke-opacity:0.07} 50%{stroke-opacity:0.18} }
        `}</style>
      </defs>
      {edges.map(([a, b], i) => (
        <line key={i} className="cn-edge" x1={nodes[a][0]} y1={nodes[a][1]}
          x2={nodes[b][0]} y2={nodes[b][1]}
          stroke="currentColor" strokeOpacity="0.09" strokeWidth="0.7"
          style={{ "--d": `${(i * 0.18) % 4}s` } as React.CSSProperties} />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 5 === 0 ? 3 : 2}
          fill="currentColor" fillOpacity={i % 5 === 0 ? 0.20 : 0.14}>
          <animate attributeName="fill-opacity"
            values={i % 5 === 0 ? "0.20;0.45;0.20" : "0.14;0.30;0.14"}
            dur={`${3 + (i % 4) * 0.7}s`} repeatCount="indefinite"
            begin={`${(i * 0.21) % 3}s`} />
          {i % 5 === 0 && (
            <animate attributeName="r" values="3;4.5;3" dur={`${3.5 + (i % 3) * 0.5}s`} repeatCount="indefinite" begin={`${(i * 0.15) % 2.5}s`} />
          )}
        </circle>
      ))}
    </svg>
  );
}

function PrismBackground() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>{`
          .pr-poly { animation: pr-shimmer var(--d,5s) ease-in-out infinite var(--delay,0s); }
          @keyframes pr-shimmer { 0%,100%{opacity:0.9} 50%{opacity:1} }
        `}</style>
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
      <polygon className="pr-poly" points="680,0 800,0 800,240" fill="url(#prism-1)" style={{ "--d": "6s", "--delay": "0s" } as React.CSSProperties} />
      <polygon className="pr-poly" points="95,285 160,200 225,285 160,370" fill="url(#prism-2)" style={{ "--d": "8s", "--delay": "1.5s" } as React.CSSProperties} />
      <polygon className="pr-poly" points="0,475 130,380 80,560" fill="url(#prism-3)" style={{ "--d": "7s", "--delay": "0.8s" } as React.CSSProperties} />
      <polygon className="pr-poly" points="340,50 385,10 430,50 385,90" fill="url(#prism-4)" style={{ "--d": "5s", "--delay": "2s" } as React.CSSProperties} />
      <polygon className="pr-poly" points="610,510 760,450 730,580" fill="url(#prism-2)" style={{ "--d": "9s", "--delay": "0.3s" } as React.CSSProperties} />
      <polygon className="pr-poly" points="20,60 55,20 90,60 55,100" fill="url(#prism-1)" style={{ "--d": "6.5s", "--delay": "3s" } as React.CSSProperties} />
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
        <style>{`
          .nb-cloud1 { animation: nb-breathe1 7s ease-in-out infinite; transform-origin: 610px 185px; }
          .nb-cloud2 { animation: nb-breathe2 9s ease-in-out infinite; transform-origin: 145px 430px; }
          .nb-cloud3 { animation: nb-breathe3 6s ease-in-out infinite; transform-origin: 400px 340px; }
          @keyframes nb-breathe1 { 0%,100%{transform:scale(1);opacity:0.90} 50%{transform:scale(1.08);opacity:1} }
          @keyframes nb-breathe2 { 0%,100%{transform:scale(1);opacity:0.90} 50%{transform:scale(1.06);opacity:1} }
          @keyframes nb-breathe3 { 0%,100%{transform:scale(1);opacity:0.85} 50%{transform:scale(1.10);opacity:1} }
        `}</style>
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
      <ellipse className="nb-cloud1" cx="610" cy="185" rx="290" ry="200" fill="url(#neb-1)" filter="url(#neb-blur)"/>
      <ellipse className="nb-cloud2" cx="145" cy="430" rx="255" ry="190" fill="url(#neb-2)" filter="url(#neb-blur)"/>
      <ellipse className="nb-cloud3" cx="400" cy="340" rx="210" ry="160" fill="url(#neb-3)" filter="url(#neb-blur)"/>
    </svg>
  );
}

function WavesBackground() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>{`
          .wv-1 { animation: wv-flow1 8s ease-in-out infinite; }
          .wv-2 { animation: wv-flow2 10s ease-in-out infinite; }
          .wv-3 { animation: wv-flow3 12s ease-in-out infinite; }
          @keyframes wv-flow1 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-15px)} }
          @keyframes wv-flow2 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(12px)} }
          @keyframes wv-flow3 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-10px)} }
        `}</style>
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
        <linearGradient id="wave-4" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#6D28D9" stopOpacity="0.10"/>
          <stop offset="100%" stopColor="#6D28D9" stopOpacity="0.03"/>
        </linearGradient>
      </defs>
      <path className="wv-1" d="M0 415 Q100 378,200 415 T400 408 T600 418 T800 400 L800 600 L0 600 Z" fill="url(#wave-1)"/>
      <path className="wv-2" d="M0 455 Q120 428,260 460 T520 445 T800 455 L800 600 L0 600 Z" fill="url(#wave-2)"/>
      <path className="wv-3" d="M0 498 Q160 476,320 502 T640 488 T800 498 L800 600 L0 600 Z" fill="url(#wave-3)"/>
      <path d="M0 0 L0 55 Q 200 80, 400 52 T 800 65 L800 0 Z" fill="url(#wave-4)"/>
    </svg>
  );
}

function GradientBackground() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>{`
          .gr-a { animation: gr-f1 9s ease-in-out infinite; }
          .gr-b { animation: gr-f2 11s ease-in-out infinite; }
          .gr-c { animation: gr-f3 13s ease-in-out infinite; }
          .gr-d { animation: gr-f4 8s ease-in-out infinite; }
          @keyframes gr-f1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(35px,-25px) scale(1.08)} }
          @keyframes gr-f2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-28px,30px) scale(1.06)} }
          @keyframes gr-f3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,20px) scale(1.05)} }
          @keyframes gr-f4 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,-18px) scale(1.07)} }
        `}</style>
        <radialGradient id="gr-1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.22"/><stop offset="100%" stopColor="#7C3AED" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="gr-2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.18"/><stop offset="100%" stopColor="#0EA5E9" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="gr-3" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.16"/><stop offset="100%" stopColor="#10B981" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="gr-4" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#EC4899" stopOpacity="0.14"/><stop offset="100%" stopColor="#EC4899" stopOpacity="0"/>
        </radialGradient>
        <filter id="gr-blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="40"/>
        </filter>
      </defs>
      <circle className="gr-a" cx="150" cy="150" r="260" fill="url(#gr-1)" filter="url(#gr-blur)" style={{ transformOrigin: "150px 150px" }}/>
      <circle className="gr-b" cx="650" cy="460" r="280" fill="url(#gr-2)" filter="url(#gr-blur)" style={{ transformOrigin: "650px 460px" }}/>
      <circle className="gr-c" cx="680" cy="120" r="200" fill="url(#gr-3)" filter="url(#gr-blur)" style={{ transformOrigin: "680px 120px" }}/>
      <circle className="gr-d" cx="120" cy="480" r="220" fill="url(#gr-4)" filter="url(#gr-blur)" style={{ transformOrigin: "120px 480px" }}/>
    </svg>
  );
}

function GeometricBackground() {
  const cols = 9; const rows = 7;
  const w = 800 / cols; const h = 600 / rows;
  const triangles: { pts: string; delay: number; c: string }[] = [];
  const colors = ["#7C3AED","#0EA5E9","#10B981","#EC4899","#F59E0B","#2563EB"];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * w; const y = r * h;
      const ci = (r + c) % colors.length;
      triangles.push({ pts: `${x},${y} ${x+w},${y} ${x},${y+h}`, delay: (r * 0.15 + c * 0.10) % 3, c: colors[ci] });
      triangles.push({ pts: `${x+w},${y} ${x+w},${y+h} ${x},${y+h}`, delay: (r * 0.12 + c * 0.13 + 1.5) % 3, c: colors[(ci + 2) % colors.length] });
    }
  }
  return (
    <svg width="100%" height="100%" viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>{`
          .geo-t { animation: geo-pulse var(--d,4s) ease-in-out infinite var(--delay,0s); }
          @keyframes geo-pulse { 0%,100%{fill-opacity:0.025} 50%{fill-opacity:0.075} }
        `}</style>
      </defs>
      {triangles.map((t, i) => (
        <polygon key={i} className="geo-t" points={t.pts} fill={t.c}
          fillOpacity="0.025" stroke="currentColor" strokeOpacity="0.04" strokeWidth="0.4"
          style={{ "--d": `${3 + (i % 4) * 0.6}s`, "--delay": `${t.delay}s` } as React.CSSProperties} />
      ))}
    </svg>
  );
}

function MatrixBackground() {
  const cols = 20; const colW = 800 / cols;
  const dotsPerCol = 12;
  return (
    <svg width="100%" height="100%" viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>{`
          .mx-dot { animation: mx-rain var(--d,4s) linear infinite var(--delay,0s); }
          @keyframes mx-rain { 0%{fill-opacity:0.04} 30%{fill-opacity:0.22} 60%{fill-opacity:0.12} 100%{fill-opacity:0.04} }
        `}</style>
      </defs>
      {Array.from({ length: cols }).map((_, ci) => (
        Array.from({ length: dotsPerCol }).map((_, di) => {
          const x = ci * colW + colW / 2;
          const y = 30 + di * (540 / dotsPerCol);
          const delay = (ci * 0.25 + di * 0.18) % 4;
          return (
            <circle key={`${ci}-${di}`} className="mx-dot" cx={x} cy={y} r={1.4}
              fill="#10B981" fillOpacity="0.04"
              style={{ "--d": `${3 + (ci % 3) * 0.5}s`, "--delay": `${delay}s` } as React.CSSProperties} />
          );
        })
      ))}
      {Array.from({ length: cols }).map((_, ci) => (
        <line key={`l-${ci}`} x1={ci * colW + colW / 2} y1="0" x2={ci * colW + colW / 2} y2="600"
          stroke="#10B981" strokeOpacity="0.03" strokeWidth="0.5" />
      ))}
    </svg>
  );
}

// ─── Background Map ─────────────────────────────────────────────────────────

const BG_MAP: Record<ChatBgId, React.ReactNode | null> = {
  none:          null,
  cosmos:        <CosmosBackground />,
  aurora:        <AuroraBackground />,
  orbs:          <OrbsBackground />,
  constellation: <ConstellationBackground />,
  prism:         <PrismBackground />,
  nebula:        <NebulaBackground />,
  waves:         <WavesBackground />,
  gradient:      <GradientBackground />,
  geometric:     <GeometricBackground />,
  matrix:        <MatrixBackground />,
};

// ─── Main component ──────────────────────────────────────────────────────────
// bgId prop: pass an explicit ID (e.g. from DM chat page)
// Without it, reads from localStorage (community chat / studio settings)

interface ChatBackgroundProps {
  bgId?: ChatBgId;
}

export default function ChatBackground({ bgId }: ChatBackgroundProps = {}) {
  const [design, setDesign] = useState<ChatBgId>("none");

  useEffect(() => {
    if (bgId) { setDesign(bgId); return; }
    try {
      const raw = localStorage.getItem("mentra-studio-config");
      if (raw) {
        const cfg = JSON.parse(raw);
        if (cfg.chatBg) setDesign(cfg.chatBg as ChatBgId);
      }
    } catch { /* ignore */ }
  }, [bgId]);

  const bg = BG_MAP[design];
  if (!bg) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none" aria-hidden>
      {bg}
    </div>
  );
}

// ─── Thumbnail previews ──────────────────────────────────────────────────────

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
    description: "Animated stars & planet",
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
    description: "Drifting northern lights",
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
    description: "Floating colour blobs",
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
    description: "Pulsing star map",
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
      </svg>
    ),
  },
  {
    id: "prism",
    label: "Prism",
    description: "Shimmering geometric facets",
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
    description: "Breathing cosmic clouds",
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
        <ellipse cx="40" cy="33" rx="20" ry="14" fill="url(#th-n3)" filter="url(#th-nblur)"/>
      </svg>
    ),
  },
  {
    id: "waves",
    label: "Waves",
    description: "Flowing layered waves",
    thumbnail: (
      <svg viewBox="0 0 80 52" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="th-w1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#7C3AED" stopOpacity="0.35"/><stop offset="100%" stopColor="#7C3AED" stopOpacity="0.12"/></linearGradient>
          <linearGradient id="th-w2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#2563EB" stopOpacity="0.30"/><stop offset="100%" stopColor="#2563EB" stopOpacity="0.10"/></linearGradient>
          <linearGradient id="th-w3" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#10B981" stopOpacity="0.25"/><stop offset="100%" stopColor="#10B981" stopOpacity="0.08"/></linearGradient>
        </defs>
        <path d="M0 32 Q10 28,20 32 T40 30 T60 33 T80 30 L80 52 L0 52 Z" fill="url(#th-w1)"/>
        <path d="M0 38 Q12 35,24 39 T48 36 T80 38 L80 52 L0 52 Z" fill="url(#th-w2)"/>
        <path d="M0 44 Q15 42,30 45 T60 43 T80 45 L80 52 L0 52 Z" fill="url(#th-w3)"/>
      </svg>
    ),
  },
  {
    id: "gradient",
    label: "Gradient",
    description: "Slow-floating colour clouds",
    thumbnail: (
      <svg viewBox="0 0 80 52" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="th-gr1"><stop offset="0%" stopColor="#7C3AED" stopOpacity="0.55"/><stop offset="100%" stopColor="#7C3AED" stopOpacity="0"/></radialGradient>
          <radialGradient id="th-gr2"><stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.50"/><stop offset="100%" stopColor="#0EA5E9" stopOpacity="0"/></radialGradient>
          <radialGradient id="th-gr3"><stop offset="0%" stopColor="#10B981" stopOpacity="0.40"/><stop offset="100%" stopColor="#10B981" stopOpacity="0"/></radialGradient>
          <radialGradient id="th-gr4"><stop offset="0%" stopColor="#EC4899" stopOpacity="0.40"/><stop offset="100%" stopColor="#EC4899" stopOpacity="0"/></radialGradient>
          <filter id="th-grblur"><feGaussianBlur stdDeviation="8"/></filter>
        </defs>
        <circle cx="18" cy="18" r="22" fill="url(#th-gr1)" filter="url(#th-grblur)"/>
        <circle cx="62" cy="40" r="24" fill="url(#th-gr2)" filter="url(#th-grblur)"/>
        <circle cx="65" cy="12" r="18" fill="url(#th-gr3)" filter="url(#th-grblur)"/>
        <circle cx="14" cy="42" r="18" fill="url(#th-gr4)" filter="url(#th-grblur)"/>
      </svg>
    ),
  },
  {
    id: "geometric",
    label: "Geometric",
    description: "Pulsing triangle mesh",
    thumbnail: (
      <svg viewBox="0 0 80 52" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>{`.gth{fill-opacity:0.05;stroke:currentColor;stroke-opacity:0.08;stroke-width:0.4}`}</style>
        </defs>
        {Array.from({length:5}).map((_,r)=>Array.from({length:8}).map((_,c)=>{
          const cw=10,ch=10.4,x=c*cw,y=r*ch;
          const colors=["#7C3AED","#0EA5E9","#10B981","#EC4899","#F59E0B","#2563EB"];
          const fc=colors[(r+c)%colors.length];
          return [
            <polygon key={`a${r}${c}`} className="gth" points={`${x},${y} ${x+cw},${y} ${x},${y+ch}`} fill={fc}/>,
            <polygon key={`b${r}${c}`} className="gth" points={`${x+cw},${y} ${x+cw},${y+ch} ${x},${y+ch}`} fill={colors[(r+c+2)%colors.length]}/>,
          ];
        }))}
      </svg>
    ),
  },
  {
    id: "matrix",
    label: "Matrix",
    description: "Digital rain effect",
    thumbnail: (
      <svg viewBox="0 0 80 52" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {Array.from({length:16}).map((_,ci)=>
          Array.from({length:8}).map((_,di)=>(
            <circle key={`${ci}-${di}`} cx={ci*5+2.5} cy={di*7+3.5} r={1.2}
              fill="#10B981" fillOpacity={0.1 + ((ci+di)%5)*0.05}/>
          ))
        )}
        {Array.from({length:16}).map((_,i)=>(
          <line key={i} x1={i*5+2.5} y1="0" x2={i*5+2.5} y2="52" stroke="#10B981" strokeOpacity="0.06" strokeWidth="0.4"/>
        ))}
      </svg>
    ),
  },
];
