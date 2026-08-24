"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useSearch } from "@/lib/search-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, LogOut, ShieldCheck, User as UserIcon, ExternalLink, X, Menu, Home, Inbox, HelpCircle, FileText, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { ReportModal } from "./ReportModal";
import { useRouter, usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function GVSUHeader() {
  const { user, signIn, logOut, isAdmin } = useAuth();
  const { searchQuery, setSearchQuery } = useSearch();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (pathname !== "/") {
      router.push("/");
    }
  };

  const utilityLinks = [
    { label: "REQUEST INFORMATION", href: "https://services.gvsu.edu/TDClient/60/Portal/Requests/ServiceOfferingDet?ID=2369", external: true },
    { label: "VISIT", href: "https://www.gvsu.edu/visit/", external: true },
    { label: "APPLY", href: "https://www.gvsu.edu/apply/", external: true },
  ];

  if (!mounted) return (
    <header className="w-full flex flex-col bg-white">
      <div className="bg-gvsuBlue h-9 w-full" />
      <div className="h-[80px] w-full border-b border-slate-100 flex items-center px-12 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gvsuBlue rounded flex items-center justify-center text-white font-bold text-xl">GV</div>
          <span className="text-gvsuBlue font-serif text-xl font-bold uppercase tracking-tight">GRAND VALLEY STATE UNIVERSITY</span>
        </div>
      </div>
    </header>
  );

  return (
    <header className="w-full flex flex-col z-50 sticky top-0 bg-white border-b border-slate-200">
      <div className="bg-gvsuBlue text-white text-[9px] font-bold py-2 px-4 sm:px-12 flex justify-between items-center font-sans tracking-widest">
        <div className="flex gap-6 items-center">
          <div className="hidden sm:flex gap-4">
            {utilityLinks.map((link) => (
              <a key={link.label} href={link.href} target="_blank" className="hover:underline flex items-center gap-1">
                {link.label} {link.external && <ExternalLink className="w-2.5 h-2.5" />}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-1 opacity-90 sm:ml-4">
            <ReportModal />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/" className="hover:text-slate-200 transition-colors">
            DISCOVERY HUB
          </Link>
          {user && isAdmin && (
            <Link href="/admin-portal" className="bg-white/10 px-2 py-0.5 rounded hover:bg-white/20 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> ADMIN PORTAL
            </Link>
          )}
        </div>
      </div>

      <div className="py-4 px-4 sm:px-12 flex items-center justify-between gap-8 h-[72px]">
        <div className="flex items-center gap-4 shrink-0">
          {user && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-slate-100 shrink-0">
                  <Menu className="h-6 w-6 text-gvsuBlue" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 flex flex-col bg-white">
                <SheetHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                      <AvatarFallback className="bg-gvsuBlue text-white font-bold">
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col text-left">
                      <SheetTitle className="text-sm font-bold text-slate-900">{user.displayName || "Laker User"}</SheetTitle>
                      <span className="text-xs text-slate-500 truncate w-40">{user.email}</span>
                    </div>
                  </div>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto py-4">
                  <nav className="space-y-1 px-3">
                    <Link href="/" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname === '/' ? 'bg-gvsuBlue/10 text-gvsuBlue font-bold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                      <Home className="h-4 w-4" /> Dashboard
                    </Link>
                    <Link href="/reports" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname === '/reports' ? 'bg-gvsuBlue/10 text-gvsuBlue font-bold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                      <Inbox className="h-4 w-4" /> Your Reports
                    </Link>
                    <Link href="/help" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname === '/help' ? 'bg-gvsuBlue/10 text-gvsuBlue font-bold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                      <HelpCircle className="h-4 w-4" /> Help & Support
                    </Link>
                    <Link href="/help/changelog" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname === '/help/changelog' ? 'bg-gvsuBlue/10 text-gvsuBlue font-bold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                      <FileText className="h-4 w-4" /> Changelog
                    </Link>
                  </nav>
                </div>
                <div className="p-4 border-t border-slate-100">
                  <Link href="/settings" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname === '/settings' ? 'bg-gvsuBlue/10 text-gvsuBlue font-bold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          )}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-gvsuBlue rounded flex items-center justify-center text-white font-bold text-lg">GV</div>
            <span className="text-gvsuBlue font-serif text-lg sm:text-xl font-bold tracking-tight uppercase leading-none hidden sm:block">GRAND VALLEY STATE UNIVERSITY</span>
            <span className="text-gvsuBlue font-serif text-lg font-bold tracking-tight uppercase leading-none sm:hidden">GVSU</span>
          </Link>
        </div>

        <div className="relative w-full max-w-[360px] hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search AI tools..." 
            className="pl-9 pr-9 bg-slate-50 border-slate-200 h-10 focus-visible:ring-gvsuBlue rounded-lg text-sm"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gvsuBlue">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-xs font-bold flex items-center gap-2 text-gvsuBlue hover:text-midnight transition-colors">
                <UserIcon className="w-3.5 h-3.5" /> MY TOOLS
              </Link>
              <Button variant="ghost" size="sm" onClick={logOut} className="text-[10px] font-bold text-slate-500 hover:text-gvsuBlue">
                EXIT
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={signIn} className="bg-gvsuBlue hover:bg-midnight text-white font-bold text-[10px] tracking-widest px-6 h-10 rounded-lg">
              SIGN IN
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
