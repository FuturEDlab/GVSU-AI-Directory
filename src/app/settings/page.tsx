"use client";

import { useEffect, useState } from "react";
import { GVSUHeader } from "@/components/GVSUHeader";
import { GVSUFooter } from "@/components/GVSUFooter";
import { useAuth } from "@/lib/auth-context";
import { getTheme, setTheme, Theme } from "@/lib/theme";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Moon, Sun, Monitor, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { user, loading: authLoading, signIn } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>("system");

  useEffect(() => {
    setMounted(true);
    setCurrentTheme(getTheme());
  }, []);

  const handleThemeChange = (value: Theme) => {
    setCurrentTheme(value);
    setTheme(value);
  };

  if (!mounted || authLoading) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-gvsuBlue dark:text-linkBlue mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Settings...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col font-sans">
        <GVSUHeader />
        <main className="flex-1 container mx-auto flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 text-center rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md max-w-md w-full">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0F172A] dark:text-white">
              GVSU Sign-In Required
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mt-3 mb-8 text-sm">
              Please sign in with your GVSU account to manage preferences.
            </p>
            <button
              onClick={signIn}
              className="bg-gvsuBlue hover:bg-midnight text-white font-bold w-full h-11 rounded-lg uppercase tracking-wider text-xs transition-colors"
            >
              Sign In
            </button>
          </div>
        </main>
        <GVSUFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col transition-colors duration-200 font-sans">
      <GVSUHeader />
      <main className="flex-1 container mx-auto py-10 px-4 sm:px-8 max-w-3xl">
        <header className="mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-gvsuBlue dark:text-linkBlue block mb-1">
            Account Preferences
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#0F172A] dark:text-white font-bold tracking-tight">
            Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm sm:text-base">
            Manage your LakerAI Directory display preferences.
          </p>
        </header>

        <div className="space-y-6">
          <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardHeader>
              <CardTitle className="font-serif text-2xl font-bold">Appearance</CardTitle>
              <CardDescription>
                Customize how the LakerAI Directory looks on your device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={currentTheme}
                onValueChange={handleThemeChange}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                <div>
                  <RadioGroupItem value="light" id="theme-light" className="peer sr-only" />
                  <Label
                    htmlFor="theme-light"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-transparent p-4 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 peer-data-[state=checked]:border-gvsuBlue peer-data-[state=checked]:text-gvsuBlue dark:peer-data-[state=checked]:border-linkBlue dark:peer-data-[state=checked]:text-linkBlue cursor-pointer transition-all"
                  >
                    <Sun className="mb-3 h-6 w-6" />
                    <span className="font-bold text-sm">Light</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="dark" id="theme-dark" className="peer sr-only" />
                  <Label
                    htmlFor="theme-dark"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-transparent p-4 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 peer-data-[state=checked]:border-gvsuBlue peer-data-[state=checked]:text-gvsuBlue dark:peer-data-[state=checked]:border-linkBlue dark:peer-data-[state=checked]:text-linkBlue cursor-pointer transition-all"
                  >
                    <Moon className="mb-3 h-6 w-6" />
                    <span className="font-bold text-sm">Dark</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="system" id="theme-system" className="peer sr-only" />
                  <Label
                    htmlFor="theme-system"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-transparent p-4 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 peer-data-[state=checked]:border-gvsuBlue peer-data-[state=checked]:text-gvsuBlue dark:peer-data-[state=checked]:border-linkBlue dark:peer-data-[state=checked]:text-linkBlue cursor-pointer transition-all"
                  >
                    <Monitor className="mb-3 h-6 w-6" />
                    <span className="font-bold text-sm">System</span>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>
      </main>
      <GVSUFooter />
    </div>
  );
}
