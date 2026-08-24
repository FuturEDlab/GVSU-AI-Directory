"use client";

import { useEffect, useState } from "react";
import { GVSUHeader } from "@/components/GVSUHeader";
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
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-gvsuBlue dark:text-sky-400 mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Settings...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 flex flex-col">
        <GVSUHeader />
        <main className="flex-1 container mx-auto flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-800 p-12 text-center rounded-3xl border dark:border-slate-700 shadow-xl max-w-md w-full">
            <h3 className="text-2xl font-serif font-black text-slate-900 dark:text-slate-50 uppercase">Access Denied</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-4 mb-8 font-medium">Please sign in with your GVSU account to view settings.</p>
            <button onClick={signIn} className="bg-gvsuBlue text-white font-bold w-full h-12 rounded-xl uppercase tracking-widest text-xs">SIGN IN</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 flex flex-col transition-colors duration-200">
      <GVSUHeader />
      <main className="flex-1 container mx-auto py-12 px-6 max-w-3xl">
        <header className="mb-8">
          <h2 className="text-4xl font-serif text-slate-900 dark:text-slate-50 font-black uppercase tracking-tight">Settings</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage your LakerAI Directory preferences.</p>
        </header>

        <div className="space-y-6">
          <Card className="rounded-2xl border dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Appearance</CardTitle>
              <CardDescription>
                Customize how the LakerAI Directory looks on your device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={currentTheme} onValueChange={handleThemeChange} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <RadioGroupItem value="light" id="theme-light" className="peer sr-only" />
                  <Label
                    htmlFor="theme-light"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-transparent p-4 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 peer-data-[state=checked]:border-gvsuBlue peer-data-[state=checked]:text-gvsuBlue dark:peer-data-[state=checked]:border-sky-500 dark:peer-data-[state=checked]:text-sky-500 cursor-pointer transition-all"
                  >
                    <Sun className="mb-3 h-6 w-6" />
                    <span className="font-bold text-sm">Light</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="dark" id="theme-dark" className="peer sr-only" />
                  <Label
                    htmlFor="theme-dark"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-transparent p-4 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 peer-data-[state=checked]:border-gvsuBlue peer-data-[state=checked]:text-gvsuBlue dark:peer-data-[state=checked]:border-sky-500 dark:peer-data-[state=checked]:text-sky-500 cursor-pointer transition-all"
                  >
                    <Moon className="mb-3 h-6 w-6" />
                    <span className="font-bold text-sm">Dark</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="system" id="theme-system" className="peer sr-only" />
                  <Label
                    htmlFor="theme-system"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-transparent p-4 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 peer-data-[state=checked]:border-gvsuBlue peer-data-[state=checked]:text-gvsuBlue dark:peer-data-[state=checked]:border-sky-500 dark:peer-data-[state=checked]:text-sky-500 cursor-pointer transition-all"
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
    </div>
  );
}
