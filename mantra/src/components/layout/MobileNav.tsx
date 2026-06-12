"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Compass, Plus, Bell, User, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function MobileNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [hidden, setHidden] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [navStyle, setNavStyle] = useState("top");

  useEffect(() => {
    const seen = localStorage.getItem("nav-tip-seen");
    if (!seen) {
      setShowTip(true);
      localStorage.setItem("nav-tip-seen", "1");
      setTimeout(() => setShowTip(false), 3500);
    }
    try {
      const cfg = localStorage.getItem("mentra-studio-config");
      if (cfg) {
        const parsed = JSON.parse(cfg);
        if (parsed.navStyle) setNavStyle(parsed.navStyle);
      }
    } catch { /* ignore */ }
  }, []);

  const [scrollHidden, setScrollHidden] = useState(false);
  const lastScrollY = useRef(0);
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      if (current > lastScrollY.current && current > 60) {
        setScrollHidden(true);
        setHidden(false);
      } else if (current < lastScrollY.current) {
        setScrollHidden(false);
      }
      lastScrollY.current = current;
      clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => setScrollHidden(false), 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => { window.removeEventListener("scroll", handleScroll); clearTimeout(scrollTimer.current); };
  }, []);

  if (status !== "authenticated") return null;
  if (navStyle === "sidebar") return null;
  if (pathname.endsWith("/chat") || pathname.includes("/chat/")) return null;

  const username = (session?.user as any)?.username;

  const items = [
    { href: "/dashboard", icon: Home,    label: "Home" },
    { href: "/explore",   icon: Compass, label: "Explore" },
    { href: "/upload",    icon: Plus,    label: "Create", special: true },
    { href: "/dashboard", icon: Bell,    label: "Alerts" },
    { href: username ? `/profile/${username}` : "/dashboard", icon: User, label: "Profile" },
  ];

  return (
    <>
      <div className={cn(
        "fixed z-50 md:hidden flex flex-col items-center transition-all duration-300 ease-in-out",
        hidden ? "bottom-3 left-1/2 -translate-x-1/2" : "bottom-[60px] left-1/2 -translate-x-1/2"
      )}>
        <AnimatePresence>
          {showTip && !hidden && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              className="mb-2 bg-on-surface/90 text-surface text-[11px] px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap"
            >
              Tap to hide navigation
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setHidden(h => !h)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest/95 border border-outline-variant/25 shadow-md text-on-surface-variant hover:text-primary transition-all backdrop-blur-sm"
        >
          <ChevronDown className={cn(
            "w-3.5 h-3.5 transition-transform duration-300",
            hidden && "rotate-180"
          )} />
          {hidden && (
            <span className="text-[11px] font-medium pr-0.5">Show nav</span>
          )}
        </button>
      </div>

      <motion.nav
        animate={{ y: hidden || scrollHidden ? "100%" : "0%" }}
        transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/20 pb-safe"
      >
        <div className="flex items-center justify-around px-2 py-2">
          {items.map(({ href, icon: Icon, label, special }) => {
            const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href) && href !== "/dashboard");
            return (
              <Link
                key={label}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all",
                  special
                    ? "bg-primary text-on-primary shadow-card px-4 py-2 -mt-4 rounded-2xl"
                    : isActive
                    ? "text-primary"
                    : "text-on-surface-variant"
                )}
              >
                <Icon className="w-5 h-5" />
                {!special && <span className="text-[10px] font-medium">{label}</span>}
              </Link>
            );
          })}
        </div>
      </motion.nav>
    </>
  );
}
