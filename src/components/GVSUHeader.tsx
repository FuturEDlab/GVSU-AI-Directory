"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useSearch } from "@/lib/search-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  ShieldCheck,
  User as UserIcon,
  ExternalLink,
  X,
  Menu,
  Home,
  Inbox,
  HelpCircle,
  FileText,
  Settings,
  Sparkles,
  Loader2,
  LayoutDashboard,
  LogOut,
  LogIn
} from "lucide-react";
import { useState, useEffect } from "react";
import { ReportModal } from "./ReportModal";
import { useRouter, usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface GVSUHeaderProps {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}

export function GVSUHeader({ searchQuery: propSearchQuery, onSearchChange }: GVSUHeaderProps = {}) {
  const { user, loading: authLoading, signIn, logOut, isAdmin } = useAuth();
  const { searchQuery: contextSearchQuery, setSearchQuery } = useSearch();
  const [mounted, setMounted] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const activeSearchQuery = propSearchQuery !== undefined ? propSearchQuery : contextSearchQuery;

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    onSearchChange?.(val);
    if (pathname !== "/") {
      const target = val.trim() ? `/?q=${encodeURIComponent(val.trim())}` : "/";
      router.push(target);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pathname !== "/") {
      const target = activeSearchQuery.trim() ? `/?q=${encodeURIComponent(activeSearchQuery.trim())}` : "/";
      router.push(target);
    }
  };

  const utilityLinks = [
    { label: "GVSU AI Hub", href: "https://www.gvsu.edu/ai/", external: true },
    { label: "IT Services", href: "https://www.gvsu.edu/it/", external: true },
    { label: "Pew FTLC", href: "https://www.gvsu.edu/ftlc/", external: true },
  ];

  if (!mounted) {
    return (
      <header className="w-full flex flex-col bg-midnight border-b border-midnight">
        <div className="bg-gvsuBlue h-9 w-full" />
        <div className="h-[68px] w-full flex items-center px-4 sm:px-8 lg:px-12 justify-between max-w-[1440px] mx-auto">
          <div className="flex flex-col">
            <span className="text-white font-sans text-lg sm:text-xl font-bold tracking-tight uppercase leading-none">
              GRAND VALLEY STATE UNIVERSITY
            </span>
            <span className="text-linkBlue font-sans text-xs font-semibold tracking-wider uppercase mt-0.5">
              LakerAI Directory
            </span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full flex flex-col z-50 sticky top-0 bg-midnight text-white border-b border-white/10 shadow-sm">
      {/* Top Institutional Utility Bar (GVSU Blue #0032A0) */}
      <div className="bg-gvsuBlue text-white text-[11px] font-semibold py-1.5 px-4 sm:px-8 lg:px-12 font-sans tracking-wider border-b border-white/10">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden md:flex items-center gap-5">
              {utilityLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/95 hover:text-linkBlue transition-colors flex items-center gap-1 uppercase text-[10px] font-bold tracking-wider"
                >
                  {link.label}
                  {link.external && <ExternalLink className="w-2.5 h-2.5 opacity-80" />}
                </a>
              ))}
            </div>
            <div className="hidden sm:flex items-center">
              <ReportModal />
            </div>
          </div>

          <nav aria-label="Primary Institutional Navigation" className="flex items-center gap-3.5 sm:gap-5 ml-auto">
            <Link
              href="/"
              className={cn(
                "transition-colors uppercase text-[10px] sm:text-[11px] font-bold tracking-wider py-0.5",
                pathname === "/"
                  ? "text-white underline decoration-linkBlue decoration-2 underline-offset-4"
                  : "text-white/90 hover:text-linkBlue"
              )}
            >
              Discovery Hub
            </Link>
            <Link
              href="/governance"
              className={cn(
                "transition-colors uppercase text-[10px] sm:text-[11px] font-bold tracking-wider py-0.5",
                pathname?.startsWith("/governance")
                  ? "text-white underline decoration-linkBlue decoration-2 underline-offset-4"
                  : "text-white/90 hover:text-linkBlue"
              )}
            >
              Governance Guide
            </Link>
            <Link
              href="/prompt-library"
              className={cn(
                "transition-colors flex items-center gap-1.5 uppercase text-[10px] sm:text-[11px] font-bold tracking-wider py-0.5",
                pathname?.startsWith("/prompt-library")
                  ? "text-linkBlue underline decoration-linkBlue decoration-2 underline-offset-4"
                  : "text-linkBlue hover:text-white"
              )}
            >
              <Sparkles className="w-3 h-3 shrink-0" /> Prompt Library
            </Link>
            <Link
              href="/help"
              className={cn(
                "transition-colors hidden sm:inline uppercase text-[10px] sm:text-[11px] font-bold tracking-wider py-0.5",
                pathname?.startsWith("/help")
                  ? "text-white underline decoration-linkBlue decoration-2 underline-offset-4"
                  : "text-white/90 hover:text-linkBlue"
              )}
            >
              Help &amp; Support
            </Link>
            {user && isAdmin && (
              <Link
                href="/admin-portal"
                className={cn(
                  "bg-midnight/90 border border-linkBlue/40 px-2.5 py-0.5 rounded hover:bg-midnight flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white transition-colors",
                  pathname?.startsWith("/admin-portal") && "ring-1 ring-linkBlue"
                )}
              >
                <ShieldCheck className="w-3 h-3 text-linkBlue" />
                <span className="hidden sm:inline">Admin Portal</span>
                <span className="sm:hidden">Admin</span>
              </Link>
            )}
          </nav>
        </div>
      </div>

      {/* Main Institutional Lockup & Search Bar (Unified Deep Institutional Navy #0A1931) */}
      <div className="px-4 sm:px-8 lg:px-12 py-3 max-w-[1440px] w-full mx-auto flex items-center justify-between gap-3 sm:gap-6 min-h-[68px]">
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          {/* Navigation Drawer Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 hover:bg-white/10 shrink-0 rounded-lg text-white hover:text-linkBlue"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[340px] p-0 flex flex-col bg-white border-r border-slate-200">
              <SheetHeader className="p-5 border-b border-slate-200 bg-midnight text-white text-left">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-linkBlue">
                    Grand Valley State University
                  </span>
                  <SheetTitle className="font-sans text-xl font-bold text-white tracking-tight">
                    LakerAI Directory
                  </SheetTitle>
                </div>
                {user && (
                  <div className="flex items-center gap-3 pt-3 mt-2 border-t border-white/15">
                    <Avatar className="h-9 w-9 border border-white/30">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                      <AvatarFallback className="bg-gvsuBlue text-white font-bold text-xs">
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : "L"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">{user.displayName || "Laker User"}</span>
                      <span className="text-[11px] text-slate-300 truncate">{user.email}</span>
                    </div>
                  </div>
                )}
              </SheetHeader>

              <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
                <div>
                  <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Directory &amp; Resources
                  </p>
                  <nav className="space-y-1">
                    <Link
                      href="/"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-semibold transition-colors",
                        pathname === "/"
                          ? "bg-gvsuBlue text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <Home className="h-4 w-4 shrink-0" /> Discovery Hub
                    </Link>
                    <Link
                      href="/governance"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-semibold transition-colors",
                        pathname?.startsWith("/governance")
                          ? "bg-gvsuBlue text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <ShieldCheck className="h-4 w-4 shrink-0 text-gvsuBlue" /> Governance &amp; 4-Pillar Guide
                    </Link>
                    <Link
                      href="/prompt-library"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-semibold transition-colors",
                        pathname?.startsWith("/prompt-library")
                          ? "bg-gvsuBlue text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <Sparkles className="h-4 w-4 shrink-0 text-gvsuBlue" /> Prompt Library
                    </Link>
                    <Link
                      href="/dashboard"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-semibold transition-colors",
                        pathname === "/dashboard"
                          ? "bg-gvsuBlue text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <LayoutDashboard className="h-4 w-4 shrink-0" /> My Dashboard
                    </Link>
                    {user && (
                      <Link
                        href="/reports"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-semibold transition-colors",
                          pathname === "/reports"
                            ? "bg-gvsuBlue text-white"
                            : "text-slate-700 hover:bg-slate-100"
                        )}
                      >
                        <Inbox className="h-4 w-4 shrink-0" /> Your Reports
                      </Link>
                    )}
                    <Link
                      href="/help"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-semibold transition-colors",
                        pathname === "/help"
                          ? "bg-gvsuBlue text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <HelpCircle className="h-4 w-4 shrink-0" /> Help &amp; Support
                    </Link>
                    <Link
                      href="/help/changelog"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-semibold transition-colors",
                        pathname === "/help/changelog"
                          ? "bg-gvsuBlue text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <FileText className="h-4 w-4 shrink-0" /> Release Changelog
                    </Link>
                    {user && isAdmin && (
                      <Link
                        href="/admin-portal"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-semibold transition-colors",
                          pathname?.startsWith("/admin-portal")
                            ? "bg-gvsuBlue text-white"
                            : "text-arboretum hover:bg-slate-100"
                        )}
                      >
                        <ShieldCheck className="h-4 w-4 shrink-0" /> Admin Portal
                      </Link>
                    )}
                  </nav>
                </div>

                {/* Institutional Links inside Drawer */}
                <div className="pt-4 border-t border-slate-200">
                  <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    GVSU Institutional Links
                  </p>
                  <div className="space-y-1">
                    {utilityLinks.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <span>{link.label}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </a>
                    ))}
                    <ReportModal fullWidthMobile />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 space-y-2 bg-slate-50/60">
                {user ? (
                  <>
                    <Link
                      href="/settings"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-semibold transition-colors",
                        pathname === "/settings"
                          ? "bg-gvsuBlue text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <Settings className="h-4 w-4 shrink-0" /> Settings
                    </Link>
                    <Button
                      variant="outline"
                      onClick={logOut}
                      className="w-full justify-start gap-3 h-11 text-xs font-bold uppercase tracking-wider text-slate-700 border-slate-300"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={signIn}
                    className="w-full bg-gvsuBlue hover:bg-midnight text-white font-bold h-11 rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <LogIn className="h-4 w-4" /> Sign In with GVSU
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Official GVSU Institutional Lockup (100% Sans-Serif) */}
          <Link href="/" className="flex items-center gap-3 sm:gap-4 group focus:outline-none py-1 min-w-0">
            <div className="flex flex-col">
              <span className="text-white font-sans text-base sm:text-xl lg:text-[21px] font-bold tracking-tight uppercase leading-none">
                Grand Valley State University
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="h-0.5 w-4 bg-linkBlue rounded-full hidden sm:inline-block" />
                <span className="text-linkBlue font-sans text-[10px] sm:text-xs font-bold tracking-[0.14em] uppercase leading-none">
                  LakerAI Directory
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Desktop Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-[380px] hidden md:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search vetted AI tools, categories, or FERPA tags..."
            aria-label="Search tools in header"
            className="pl-10 pr-9 bg-white/10 hover:bg-white/15 focus:bg-white border-white/20 focus:border-linkBlue h-10 focus-visible:ring-2 focus-visible:ring-linkBlue rounded-lg text-sm text-white focus:text-slate-900 placeholder:text-slate-300 focus:placeholder:text-slate-500 transition-colors"
            value={activeSearchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {activeSearchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-linkBlue p-1"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Right Controls: Mobile Search Toggle + Auth Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden h-11 w-11 rounded-lg text-white hover:text-linkBlue hover:bg-white/10"
            aria-label="Toggle search bar"
          >
            {mobileSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </Button>

          {authLoading ? (
            <div className="flex items-center justify-center px-3 h-10 min-w-[72px]">
              <Loader2 className="w-4 h-4 animate-spin text-linkBlue" />
            </div>
          ) : user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-3 h-10 rounded-lg bg-gvsuBlue hover:bg-gvsuBlue/90 text-white border border-white/15 transition-colors text-xs font-bold uppercase tracking-wider"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">My Dashboard</span>
                <span className="sm:hidden">Tools</span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={logOut}
                className="hidden sm:inline-flex text-xs font-bold text-slate-200 hover:text-white hover:bg-white/10 h-10 px-3"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={signIn}
              className="bg-gvsuBlue hover:bg-gvsuBlue/90 text-white border border-white/15 font-bold text-xs tracking-wider uppercase px-4 sm:px-5 h-10 min-h-[40px] rounded-lg shadow-xs transition-colors"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Expandable Mobile Search Bar (375px viewport friendly) */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 pt-1 border-t border-white/10 bg-midnight animate-in slide-in-from-top-1 duration-150">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search vetted AI tools..."
              aria-label="Search tools on mobile"
              autoFocus
              className="pl-10 pr-9 bg-white border-slate-300 h-11 focus-visible:ring-2 focus-visible:ring-linkBlue rounded-lg text-sm text-slate-900"
              value={activeSearchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {activeSearchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-gvsuBlue p-1.5"
                aria-label="Clear mobile search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>
      )}
    </header>
  );
}
