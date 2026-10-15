"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQueryState] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      if (q !== null) {
        setSearchQueryState(q);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleExternalSearch = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (typeof customEvent.detail === "string") {
        setSearchQueryState(customEvent.detail);
      }
    };

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setSearchQueryState(params.get("q") || "");
    };

    window.addEventListener("lakerai:search-change", handleExternalSearch);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("lakerai:search-change", handleExternalSearch);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const setSearchQuery = useCallback((value: string) => {
    setSearchQueryState(value);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lakerai:search-change", { detail: value }));
      if (window.location.pathname === "/") {
        const url = new URL(window.location.href);
        if (value.trim()) {
          url.searchParams.set("q", value);
        } else {
          url.searchParams.delete("q");
        }
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, []);

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}

