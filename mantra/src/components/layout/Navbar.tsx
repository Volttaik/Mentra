"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Bell, Search, Menu, X, ChevronDown,
  Upload, Settings, LogOut, User, LayoutDashboard, Moon, Sun,
  Sparkles, Users, BookMarked, Compass, Bot, Palette,
  MessageSquarePlus, Coins, GitFork,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { theme, toggle } = useTheme();
  const isAuth = status === "authenticated";
  const isLoading = status === "loading";

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [aiCredits, setAiCredits] = useState<number | null>(null);
  const [navStyle, setNavStyle] = useState("top");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const cfg = localStorage.getItem("mentra-studio-config");
      if (cfg) {
        const parsed = JSON.parse(cfg);
        if (parsed.navStyle) setNavStyle(parsed.navStyle);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!isAuth) return;
    fetch("/api/notifications?unreadOnly=true")
      .then(r => r.json())
      .then(d => setNotifCount(d.count ?? 0))
      .catch(() => {});
    fetch("/api/credits")
      .then(r => r.json())
      .then(d => typeof d.credits === "number" && setAiCredits(d.credits))
      .catch(() => {});
  }, [isAuth]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const initials = session?.user?.name
    ? session.user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    setSidebarOpen(false);
    await signOut({ callbackUrl: "/" });
  };

  const username = (session?.user as any)?.username ?? "";

  const SECTIONS = [
    {
      label: "Discover",
      items: [
        { href: "/explore",     label: "Explore",     icon: Compass,       desc: "Find public stacks" },
        { href: "/communities", label: "Communities", icon: Users,         desc: "Join knowledge groups" },
      ],
    },
    {
      label: "Create",
      items: [
        { href: "/upload",              label: "New Stack",     icon: Upload,           desc: "Publish a stack" },
        { href: "/communities/new",    label: "New Community", icon: MessageSquarePlus, desc: "Start a community" },
        { href: "/dashboard#flows",     label: "Stack Flows",   icon: BookMarked,       desc: "Organise collections" },
      ],
    },
    {
      label: "AI",
      items: [
        { href: "/agent",                   label: "AI Chat",       icon: Sparkles, desc: "Chat with your agent" },
        { href: "/settings?tab=AI+Agent",   label: "AI Management", icon: Bot,      desc: "Manage & customise AI" },
      ],
    },
    {
      label: "Account",
      items: [
        { href: "/dashboard",                        label: "Dashboard",     icon: LayoutDashboard, desc: "Your home base" },
        { href: username ? `/profile/${username}` : "/dashboard", label: "Profile", icon: User, desc: "Your public page" },
        { href: "/notifications",                    label: "Notifications", icon: Bell,      desc: "Activity & invites" },
        { href: "/forks",                            label: "My Forks",      icon: GitFork,   desc: "Manage forked stacks" },
        { href: "/settings",                         label: "Settings",      icon: Settings,  desc: "Account preferences" },
        { href: "/settings?tab=Mentra+Studio",       label: "Mentra Studio", icon: Palette,   desc: "Customise your theme" },
      ],
    },
  ];

  const UserAvatar = ({ size = "sm" }: { size?: "sm" | "md" }) => {
    const cls = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
    return (
      <div className={`${cls} rounded-full bg-secondary-container flex items-center justify-center overflow-hidden border-2 border-outline-variant/30`}>
        {session?.user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.user.image} alt={session.user.name ?? ""} className="w-full h-full object-cover" />
        ) : (
          <span className={`font-bold text-on-secondary-container font-manrope`}>{initials}</span>
        )}
      </div>
    );
  };

  const RightActions = () => (
    <div className="flex items-center gap-2">
      <Link
        href="/search"
        className="hidden md:flex items-center gap-2 bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2 text-sm text-on-surface-variant hover:border-outline/50 transition-all w-52"
      >
        <Search className="w-4 h-4" />
        <span>Search stacks...</span>
        <span className="ml-auto text-xs bg-surface-container-high px-1.5 py-0.5 rounded text-on-surface-variant/60">⌘K</span>
      </Link>

      <button
        onClick={toggle}
        className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all"
        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {isLoading ? (
        <div className="w-8 h-8 bg-surface-container rounded-full animate-pulse" />
      ) : isAuth ? (
        <>
          <Link href="/notifications" className="relative p-2 text-on-surface-variant hover:text-primary transition-colors" title="Notifications">
            <Bell className="w-5 h-5" />
            {notifCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-secondary text-on-secondary text-[9px] font-bold rounded-full flex items-center justify-center">
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </Link>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <UserAvatar />
              <ChevronDown className={cn("w-4 h-4 text-on-surface-variant transition-transform hidden md:block", userMenuOpen && "rotate-180")} />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-12 w-72 bg-surface-container-lowest rounded-2xl shadow-modal border border-outline-variant/20 py-2 z-50 max-h-[80vh] overflow-y-auto">
                <div className="px-4 py-3 border-b border-outline-variant/10">
                  <div className="flex items-center gap-3">
                    <UserAvatar size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-primary font-manrope truncate">{session?.user?.name}</p>
                      <p className="text-xs text-on-surface-variant">@{username}</p>
                    </div>
                    {aiCredits !== null && (
                      <div className="flex items-center gap-1 bg-secondary-container/60 px-2 py-1 rounded-full shrink-0">
                        <Coins className="w-3 h-3 text-on-secondary-container" />
                        <span className="text-[11px] font-semibold text-on-secondary-container">{aiCredits}</span>
                      </div>
                    )}
                  </div>
                </div>

                {SECTIONS.map((section, si) => (
                  <div key={section.label}>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">
                      {section.label}
                    </p>
                    {section.items.map(item => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container transition-colors group"
                      >
                        <div className="w-7 h-7 bg-surface-container group-hover:bg-surface-container-high rounded-lg flex items-center justify-center shrink-0 transition-colors">
                          <item.icon className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-primary transition-colors" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors leading-none">{item.label}</p>
                          <p className="text-[11px] text-on-surface-variant/60 mt-0.5">{item.desc}</p>
                        </div>
                      </Link>
                    ))}
                    {si < SECTIONS.length - 1 && <div className="border-b border-outline-variant/10 mx-4 mt-1 mb-0" />}
                  </div>
                ))}

                <div className="border-t border-outline-variant/10 mt-1 pt-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error-container/30 transition-colors"
                  >
                    <div className="w-7 h-7 flex items-center justify-center shrink-0">
                      <LogOut className="w-3.5 h-3.5" />
                    </div>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <Link href="/login" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors px-4 py-2">
            Sign in
          </Link>
          <Link href="/register" className="btn-primary text-sm px-4 py-2 rounded-xl">
            Get started
          </Link>
        </div>
      )}
    </div>
  );

  if (navStyle === "sidebar") {
    return (
      <>
        <header className="fixed top-0 left-0 right-0 w-full z-50 parchment-blur border-b border-outline-variant/20">
          <nav className="max-w-[1200px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {isAuth && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all"
                  aria-label="Open menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <Link href="/" className="flex items-center gap-2 shrink-0">
                <img src="/icons/icon-192.png" alt="Mentra" className="w-8 h-8 rounded-lg object-cover" />
                <span className="font-manrope font-bold text-lg text-primary tracking-tight">Mentra</span>
              </Link>
            </div>
            <RightActions />
          </nav>
        </header>

        {sidebarOpen && (
          <div className="fixed inset-0 z-[70] flex">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="relative z-10 w-72 h-full bg-surface-container-lowest shadow-2xl flex flex-col overflow-y-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/15">
                <Link href="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2">
                  <img src="/icons/icon-192.png" alt="Mentra" className="w-7 h-7 rounded-lg object-cover" />
                  <span className="font-manrope font-bold text-base text-primary">Mentra</span>
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isAuth && (
                <div className="px-4 py-3 border-b border-outline-variant/10">
                  <div className="flex items-center gap-3">
                    <UserAvatar size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-primary font-manrope truncate">{session?.user?.name}</p>
                      <p className="text-xs text-on-surface-variant">@{username}</p>
                    </div>
                    {aiCredits !== null && (
                      <div className="flex items-center gap-1 bg-secondary-container/60 px-2 py-1 rounded-full shrink-0">
                        <Coins className="w-3 h-3 text-on-secondary-container" />
                        <span className="text-[11px] font-semibold text-on-secondary-container">{aiCredits}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <nav className="flex-1 px-3 py-3">
                {SECTIONS.map((section, si) => (
                  <div key={section.label} className={si > 0 ? "mt-4" : ""}>
                    <p className="px-3 pb-1 text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">
                      {section.label}
                    </p>
                    {section.items.map(item => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5",
                          pathname === item.href
                            ? "bg-secondary-container text-on-secondary-container"
                            : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
                        )}
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                ))}
              </nav>

              <div className="border-t border-outline-variant/10 px-3 py-3">
                <button
                  onClick={toggle}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all mb-0.5"
                >
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </button>
                {isAuth && (
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-error hover:bg-error-container/30 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                )}
              </div>
            </aside>
          </div>
        )}
      </>
    );
  }

  if (navStyle === "minimal") {
    return (
      <header className="fixed top-0 left-0 right-0 w-full z-50 parchment-blur border-b border-outline-variant/20">
        <nav className="max-w-[1200px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img src="/icons/icon-192.png" alt="Mentra" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-manrope font-bold text-lg text-primary tracking-tight">Mentra</span>
          </Link>
          <div className="hidden md:flex flex-1 mx-8">
            <Link
              href="/search"
              className="flex items-center gap-2 bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2 text-sm text-on-surface-variant hover:border-outline/50 transition-all w-64"
            >
              <Search className="w-4 h-4" />
              <span>Search stacks...</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {isLoading ? (
              <div className="w-8 h-8 bg-surface-container rounded-full animate-pulse" />
            ) : isAuth ? (
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="hover:opacity-80 transition-opacity">
                  <UserAvatar />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-12 w-72 bg-surface-container-lowest rounded-2xl shadow-modal border border-outline-variant/20 py-2 z-50 max-h-[80vh] overflow-y-auto">
                    {SECTIONS.map((section, si) => (
                      <div key={section.label}>
                        <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">{section.label}</p>
                        {section.items.map(item => (
                          <Link key={item.href} href={item.href} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container transition-colors group">
                            <div className="w-7 h-7 bg-surface-container group-hover:bg-surface-container-high rounded-lg flex items-center justify-center shrink-0 transition-colors">
                              <item.icon className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-primary transition-colors" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors leading-none">{item.label}</p>
                              <p className="text-[11px] text-on-surface-variant/60 mt-0.5">{item.desc}</p>
                            </div>
                          </Link>
                        ))}
                        {si < SECTIONS.length - 1 && <div className="border-b border-outline-variant/10 mx-4 mt-1" />}
                      </div>
                    ))}
                    <div className="border-t border-outline-variant/10 mt-1 pt-1">
                      <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error-container/30 transition-colors">
                        <LogOut className="w-3.5 h-3.5 ml-1.5" />Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors px-4 py-2">Sign in</Link>
                <Link href="/register" className="btn-primary text-sm px-4 py-2 rounded-xl">Get started</Link>
              </div>
            )}
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 parchment-blur border-b border-outline-variant/20">
      <nav className="max-w-[1200px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img src="/icons/icon-192.png" alt="Mentra" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-manrope font-bold text-lg text-primary tracking-tight">Mentra</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 flex-1 ml-8">
          <Link href="/explore" className={cn("text-sm font-medium transition-colors", pathname === "/explore" ? "text-primary font-semibold" : "text-on-surface-variant hover:text-primary")}>
            Explore
          </Link>
          {isAuth && (
            <>
              <Link href="/communities" className={cn("text-sm font-medium transition-colors", pathname?.startsWith("/communities") ? "text-primary font-semibold" : "text-on-surface-variant hover:text-primary")}>
                Communities
              </Link>
              <Link href="/dashboard" className={cn("text-sm font-medium transition-colors", pathname === "/dashboard" ? "text-primary font-semibold" : "text-on-surface-variant hover:text-primary")}>
                Dashboard
              </Link>
            </>
          )}
          {!isAuth && !isLoading && (
            <>
              <Link href="/#about" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">About</Link>
              <Link href="/privacy" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">Privacy</Link>
            </>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <RightActions />
        </div>

        <div className="md:hidden flex items-center gap-1">
          <button onClick={toggle} className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-all">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button className="p-2 text-on-surface-variant" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden border-t border-outline-variant/20 bg-surface py-4 px-4 space-y-1 max-h-[80vh] overflow-y-auto">
          <Link href="/explore" onClick={() => setMobileOpen(false)} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors", pathname === "/explore" ? "bg-secondary-container text-on-secondary-container" : "text-on-surface-variant hover:bg-surface-container")}>
            <Compass className="w-4 h-4" />Explore
          </Link>
          {isAuth && (
            <>
              <Link href="/communities" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-on-surface-variant hover:bg-surface-container transition-colors">
                <Users className="w-4 h-4" />Communities
              </Link>
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors", pathname === "/dashboard" ? "bg-secondary-container text-on-secondary-container" : "text-on-surface-variant hover:bg-surface-container")}>
                <LayoutDashboard className="w-4 h-4" />Dashboard
              </Link>
            </>
          )}
          <div className="border-t border-outline-variant/10 mt-2 pt-2 space-y-1">
            {isAuth ? (
              <>
                <div className="flex items-center gap-3 px-4 py-2 mb-1">
                  <div className="w-9 h-9 rounded-full bg-secondary-container overflow-hidden flex items-center justify-center shrink-0">
                    {session?.user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-on-secondary-container">{initials}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-primary">{session?.user?.name}</p>
                    <p className="text-xs text-on-surface-variant">@{username}</p>
                  </div>
                  {aiCredits !== null && (
                    <div className="ml-auto flex items-center gap-1 bg-secondary-container/60 px-2 py-1 rounded-full">
                      <Coins className="w-3 h-3 text-on-secondary-container" />
                      <span className="text-[11px] font-semibold text-on-secondary-container">{aiCredits}</span>
                    </div>
                  )}
                </div>
                {[
                  { href: username ? `/profile/${username}` : "/dashboard", icon: User,     label: "Profile" },
                  { href: "/upload",                                          icon: Upload,   label: "New Stack" },
                  { href: "/agent",                                           icon: Sparkles, label: "AI Chat" },
                  { href: "/settings",                                        icon: Settings, label: "Settings" },
                  { href: "/settings?tab=Mentra+Studio",                      icon: Palette,  label: "Mentra Studio" },
                ].map(item => (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-on-surface-variant hover:bg-surface-container transition-colors">
                    <item.icon className="w-4 h-4" />{item.label}
                  </Link>
                ))}
                <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-error hover:bg-error-container/30 transition-colors">
                  <LogOut className="w-4 h-4" />Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="flex px-4 py-3 text-sm font-medium text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">Sign in</Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="flex px-4 py-3 text-sm font-semibold text-primary hover:bg-surface-container rounded-xl transition-colors">Get started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
