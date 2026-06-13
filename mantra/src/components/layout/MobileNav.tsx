"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Compass, Plus, MessagesSquare, User, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
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
    const savedHidden = localStorage.getItem("mobile-nav-hidden");
    if (savedHidden === "1") setHidden(true);
  }, []);

  const toggleHidden = (val: boolean) => {
    setHidden(val);
    localStorage.setItem("mobile-nav-hidden", val ? "1" : "0");
  };

  const [scrollHidden, setScrollHidden] = useState(false);
  const lastScrollY = useRef(0);
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      if (current > lastScrollY.current && current > 60) {
        setScrollHidden(true);
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
  if (pathname === "/agent" || pathname.endsWith("/chat") || pathname.includes("/chat/")) return null;
  if (pathname.match(/^\/messages\/[^/]+/)) return null;

  const username = (session?.user as { username?: string })?.username;

  const items = [
    { href: "/dashboard",  icon: Home,            label: "Home" },
    { href: "/explore",    icon: Compass,         label: "Explore" },
    { href: "/upload",     icon: Plus,            label: "Create", special: true },
    { href: "/messages",   icon: MessagesSquare,  label: "Messages" },
    { href: username ? `/profile/${username}` : "/dashboard", icon: User, label: "Profile" },
  ];

  return (
    <>
      {/* Restore pill — centered at bottom when nav is hidden */}
      <AnimatePresence>
        {hidden && (
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => toggleHidden(false)}
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 md:hidden flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface-container-lowest/95 border border-outline-variant/25 shadow-lg text-on-surface-variant hover:text-primary transition-colors backdrop-blur-sm text-[11px] font-medium whitespace-nowrap"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            Show nav
          </motion.button>
        )}
      </AnimatePresence>

      {/* Tip toast */}
      <AnimatePresence>
        {showTip && !hidden && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            className="fixed z-50 md:hidden bottom-[76px] left-1/2 -translate-x-1/2 bg-on-surface/90 text-surface text-[11px] px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap pointer-events-none"
          >
            Tap ↑ to hide navigation
          </motion.div>
        )}
      </AnimatePresence>

      <motion.nav
        animate={{ y: hidden || scrollHidden ? "100%" : "0%" }}
        transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/20 pb-safe"
      >
        {/* Hide toggle — pill centered directly above the nav bar */}
        <div className="absolute left-0 right-0 flex justify-center" style={{ top: "-22px" }}>
          <button
            onClick={() => toggleHidden(true)}
            className="flex items-center justify-center h-5 px-3 rounded-full bg-surface-container-lowest/90 border border-outline-variant/20 shadow-sm text-on-surface-variant/60 hover:text-primary transition-colors backdrop-blur-sm"
            aria-label="Hide navigation"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-5 items-center px-2 py-2 justify-items-center">
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
