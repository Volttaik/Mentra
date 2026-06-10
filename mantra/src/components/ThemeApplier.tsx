"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export interface ThemeConfig {
  palette: string;
  style: string;
  font: string;
  radius: string;
}

export const DEFAULT_CONFIG: ThemeConfig = {
  palette: "parchment",
  style: "default",
  font: "default",
  radius: "default",
};

const PALETTES: Record<string, { light: Record<string, string>; dark: Record<string, string> }> = {
  parchment: { light: {}, dark: {} },
  ocean: {
    light: {
      "--c-secondary": "25 100 200",
      "--c-on-secondary": "255 255 255",
      "--c-secondary-container": "195 220 255",
      "--c-on-secondary-container": "0 45 130",
      "--c-secondary-fixed": "210 230 255",
      "--c-secondary-fixed-dim": "160 200 250",
      "--c-surface": "245 248 255",
      "--c-background": "240 245 255",
      "--c-surface-container-lowest": "255 255 255",
      "--c-surface-container-low": "238 243 255",
      "--c-surface-container": "230 238 255",
      "--c-surface-container-high": "220 230 252",
      "--c-surface-container-highest": "208 220 248",
    },
    dark: {
      "--c-secondary": "120 170 240",
      "--c-on-secondary": "0 38 95",
      "--c-secondary-container": "0 50 120",
      "--c-on-secondary-container": "165 200 255",
      "--c-secondary-fixed": "0 60 140",
      "--c-secondary-fixed-dim": "0 80 160",
      "--c-surface": "10 14 28",
      "--c-background": "8 11 22",
      "--c-surface-container-lowest": "6 9 18",
      "--c-surface-container-low": "12 17 32",
      "--c-surface-container": "16 22 40",
      "--c-surface-container-high": "22 29 52",
      "--c-surface-container-highest": "30 38 65",
    },
  },
  forest: {
    light: {
      "--c-secondary": "30 115 60",
      "--c-on-secondary": "255 255 255",
      "--c-secondary-container": "185 240 200",
      "--c-on-secondary-container": "0 55 25",
      "--c-secondary-fixed": "200 248 215",
      "--c-secondary-fixed-dim": "160 225 180",
      "--c-surface": "245 252 246",
      "--c-background": "238 250 240",
      "--c-surface-container-lowest": "255 255 255",
      "--c-surface-container-low": "236 248 238",
      "--c-surface-container": "226 242 228",
      "--c-surface-container-high": "215 235 218",
      "--c-surface-container-highest": "205 228 208",
    },
    dark: {
      "--c-secondary": "105 200 130",
      "--c-on-secondary": "0 48 20",
      "--c-secondary-container": "0 68 35",
      "--c-on-secondary-container": "155 225 175",
      "--c-secondary-fixed": "0 80 40",
      "--c-secondary-fixed-dim": "0 98 50",
      "--c-surface": "10 16 11",
      "--c-background": "7 12 8",
      "--c-surface-container-lowest": "5 10 6",
      "--c-surface-container-low": "12 18 13",
      "--c-surface-container": "16 24 17",
      "--c-surface-container-high": "22 32 23",
      "--c-surface-container-highest": "30 42 31",
    },
  },
  lavender: {
    light: {
      "--c-secondary": "90 60 200",
      "--c-on-secondary": "255 255 255",
      "--c-secondary-container": "225 215 255",
      "--c-on-secondary-container": "40 20 120",
      "--c-secondary-fixed": "235 228 255",
      "--c-secondary-fixed-dim": "205 195 255",
      "--c-surface": "249 247 255",
      "--c-background": "244 242 255",
      "--c-surface-container-lowest": "255 255 255",
      "--c-surface-container-low": "242 240 255",
      "--c-surface-container": "234 232 255",
      "--c-surface-container-high": "226 224 252",
      "--c-surface-container-highest": "218 215 248",
    },
    dark: {
      "--c-secondary": "185 165 255",
      "--c-on-secondary": "42 18 100",
      "--c-secondary-container": "62 40 148",
      "--c-on-secondary-container": "220 205 255",
      "--c-secondary-fixed": "75 50 168",
      "--c-secondary-fixed-dim": "95 68 188",
      "--c-surface": "14 12 25",
      "--c-background": "10 8 20",
      "--c-surface-container-lowest": "8 6 17",
      "--c-surface-container-low": "16 14 28",
      "--c-surface-container": "20 18 35",
      "--c-surface-container-high": "28 24 46",
      "--c-surface-container-highest": "36 32 58",
    },
  },
  rose: {
    light: {
      "--c-secondary": "185 50 80",
      "--c-on-secondary": "255 255 255",
      "--c-secondary-container": "255 210 220",
      "--c-on-secondary-container": "100 0 30",
      "--c-secondary-fixed": "255 225 232",
      "--c-secondary-fixed-dim": "255 185 200",
      "--c-surface": "255 247 248",
      "--c-background": "255 242 244",
      "--c-surface-container-lowest": "255 255 255",
      "--c-surface-container-low": "252 240 242",
      "--c-surface-container": "248 232 235",
      "--c-surface-container-high": "242 224 228",
      "--c-surface-container-highest": "236 215 220",
    },
    dark: {
      "--c-secondary": "240 140 160",
      "--c-on-secondary": "90 0 30",
      "--c-secondary-container": "130 30 55",
      "--c-on-secondary-container": "255 185 200",
      "--c-secondary-fixed": "148 38 65",
      "--c-secondary-fixed-dim": "168 48 78",
      "--c-surface": "25 12 14",
      "--c-background": "20 8 10",
      "--c-surface-container-lowest": "18 6 8",
      "--c-surface-container-low": "28 14 16",
      "--c-surface-container": "35 18 21",
      "--c-surface-container-high": "44 24 28",
      "--c-surface-container-highest": "55 30 35",
    },
  },
  slate: {
    light: {
      "--c-secondary": "60 80 110",
      "--c-on-secondary": "255 255 255",
      "--c-secondary-container": "215 225 242",
      "--c-on-secondary-container": "15 35 65",
      "--c-secondary-fixed": "228 236 250",
      "--c-secondary-fixed-dim": "190 208 235",
      "--c-surface": "248 249 252",
      "--c-background": "242 244 248",
      "--c-surface-container-lowest": "255 255 255",
      "--c-surface-container-low": "240 242 246",
      "--c-surface-container": "232 235 242",
      "--c-surface-container-high": "224 228 236",
      "--c-surface-container-highest": "215 220 230",
    },
    dark: {
      "--c-secondary": "155 175 210",
      "--c-on-secondary": "15 32 62",
      "--c-secondary-container": "38 54 85",
      "--c-on-secondary-container": "205 218 240",
      "--c-secondary-fixed": "48 66 100",
      "--c-secondary-fixed-dim": "58 80 115",
      "--c-surface": "14 16 22",
      "--c-background": "10 12 18",
      "--c-surface-container-lowest": "8 10 15",
      "--c-surface-container-low": "16 18 25",
      "--c-surface-container": "20 23 32",
      "--c-surface-container-high": "26 30 42",
      "--c-surface-container-highest": "34 38 52",
    },
  },
};

const STYLE_CSS: Record<string, string> = {
  default: "",
  elevated: `
    .card, .card-sm { box-shadow: 0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06) !important; border-width: 1.5px !important; }
    .shadow-card { box-shadow: 0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08) !important; }
    .shadow-modal { box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10) !important; }
    button, a { transition-duration: 120ms !important; }
  `,
  flat: `
    .card, .card-sm { box-shadow: none !important; border: 1.5px solid rgb(var(--c-outline-variant) / 0.3) !important; }
    .shadow-card, .shadow-modal { box-shadow: none !important; }
    header { box-shadow: none !important; }
    .rounded-2xl { border-radius: 12px !important; }
    .rounded-xl { border-radius: 8px !important; }
  `,
};

const FONT_CSS: Record<string, string> = {
  default: "",
  manrope: `body, p, span, div, li, td, th, input, textarea { font-family: 'Manrope', sans-serif !important; }`,
  inter: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body, p, span, div, li, td, th, input, textarea, h1, h2, h3, h4, h5, h6 { font-family: 'Inter', sans-serif !important; }
  `,
};

const RADIUS_CSS: Record<string, string> = {
  default: "",
  compact: `
    .rounded-2xl { border-radius: 10px !important; }
    .rounded-xl { border-radius: 7px !important; }
    .rounded-full { border-radius: 6px !important; }
  `,
  rounded: `
    .rounded-2xl { border-radius: 20px !important; }
    .rounded-xl { border-radius: 16px !important; }
    button { border-radius: 14px !important; }
  `,
};

function applyTheme(config: ThemeConfig) {
  const isDark = document.documentElement.classList.contains("dark");
  const palette = PALETTES[config.palette] ?? PALETTES.parchment;
  const vars = isDark ? palette.dark : palette.light;

  Object.entries(vars).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });

  let styleEl = document.getElementById("mentra-theme-overrides");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "mentra-theme-overrides";
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = [
    STYLE_CSS[config.style] ?? "",
    FONT_CSS[config.font] ?? "",
    RADIUS_CSS[config.radius] ?? "",
  ].join("\n");
}

export function clearThemeOverrides() {
  const cssVars = [
    "--c-secondary", "--c-on-secondary", "--c-secondary-container", "--c-on-secondary-container",
    "--c-secondary-fixed", "--c-secondary-fixed-dim", "--c-surface", "--c-background",
    "--c-surface-container-lowest", "--c-surface-container-low", "--c-surface-container",
    "--c-surface-container-high", "--c-surface-container-highest",
  ];
  cssVars.forEach(v => document.documentElement.style.removeProperty(v));
  const styleEl = document.getElementById("mentra-theme-overrides");
  if (styleEl) styleEl.textContent = "";
}

export function getStoredTheme(): ThemeConfig {
  try {
    const raw = localStorage.getItem("mentra-studio-config");
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_CONFIG;
}

export function saveThemeLocally(config: ThemeConfig) {
  localStorage.setItem("mentra-studio-config", JSON.stringify(config));
}

export default function ThemeApplier() {
  const { status } = useSession();

  useEffect(() => {
    const stored = getStoredTheme();
    applyTheme(stored);

    if (status === "authenticated") {
      fetch("/api/theme")
        .then(r => r.json())
        .then(d => {
          if (d.themeConfig) {
            try {
              const remote: ThemeConfig = { ...DEFAULT_CONFIG, ...JSON.parse(d.themeConfig) };
              saveThemeLocally(remote);
              applyTheme(remote);
            } catch { /* ignore */ }
          }
        })
        .catch(() => {});
    }

    const observer = new MutationObserver(() => {
      const cfg = getStoredTheme();
      applyTheme(cfg);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [status]);

  return null;
}
