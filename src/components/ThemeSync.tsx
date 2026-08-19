"use client";

import { useEffect } from "react";
import { applyTheme, getTheme } from "@/lib/theme";

export function ThemeSync() {
  useEffect(() => {
    // Apply current theme on mount
    applyTheme(getTheme());

    // Listen for system changes if system default is chosen
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (getTheme() === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return null;
}
