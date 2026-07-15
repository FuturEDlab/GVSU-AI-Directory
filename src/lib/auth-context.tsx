
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User
} from "firebase/auth";
import { auth, db, googleProvider } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_WHITELIST = [
  "indrajis@mail.gvsu.edu",
  "vanharkj@gvsu.edu",
  "vanharkj@mail.gvsu.edu",
  "joseph_email_here@gvsu.edu"
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const isAdmin = !!user && ADMIN_WHITELIST.includes(user.email?.toLowerCase() || "");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const email = currentUser.email?.toLowerCase() || "";
        if (email.endsWith("@gvsu.edu") || email.endsWith("@mail.gvsu.edu")) {
          setUser(currentUser);
          
          if (ADMIN_WHITELIST.includes(email)) {
            try {
              await setDoc(doc(db, "admins", currentUser.uid), {
                id: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName || "Laker Administrator"
              }, { merge: true });
            } catch (error) {
              // Silently ignore permission issues for auto-profiling
            }
          }
        } else {
          signOut(auth).then(() => {
            setUser(null);
            toast({
              variant: "destructive",
              title: "Access Denied",
              description: "Please use your official @gvsu.edu or @mail.gvsu.edu Laker email.",
            });
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);

  const signIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email?.toLowerCase() || "";
      if (!(email.endsWith("@gvsu.edu") || email.endsWith("@mail.gvsu.edu"))) {
        await signOut(auth);
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Please use your official @gvsu.edu or @mail.gvsu.edu Laker email.",
        });
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: error.message || "Could not complete sign in.",
      });
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
