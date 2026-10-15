"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from "firebase/auth";
import { auth, db, googleProvider } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_WHITELIST = [
  "indrajis@mail.gvsu.edu",
  "vanharkj@gvsu.edu",
  "vanharkj@mail.gvsu.edu",
  "indrajis@gvsu.edu",
  "joseph_email_here@gvsu.edu"
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminDoc, setIsAdminDoc] = useState(false);
  const { toast } = useToast();

  const adminEmails = useMemo(() => ADMIN_WHITELIST, []);
  const isAdmin = (!!user?.email && adminEmails.includes(user.email.toLowerCase())) || isAdminDoc;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const email = (currentUser.email || "").toLowerCase();
        const isGvsuDomain = email.endsWith("@gvsu.edu") || email.endsWith("@mail.gvsu.edu");

        if (!isGvsuDomain) {
          await signOut(auth);
          setUser(null);
          setIsAdminDoc(false);
          setLoading(false);
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "Please use your official @gvsu.edu or @mail.gvsu.edu Laker email to sign in.",
          });
        } else if (currentUser.emailVerified === false) {
          await signOut(auth);
          setUser(null);
          setIsAdminDoc(false);
          setLoading(false);
          toast({
            variant: "destructive",
            title: "Email Verification Required",
            description: "Please verify your Laker email address via the link sent to your inbox before signing in.",
          });
        } else {
          setUser(currentUser);
          setLoading(false);

          let adminFromDb = false;
          try {
            const adminSnap = await getDoc(doc(db, "admins", currentUser.uid));
            adminFromDb = adminSnap.exists();
          } catch {
            // Silently handle rules/network errors when checking admin doc
          }
          setIsAdminDoc(adminFromDb);

          if (adminEmails.includes(email)) {
            try {
              await setDoc(doc(db, "admins", currentUser.uid), {
                id: currentUser.uid,
                email: email,
                displayName: currentUser.displayName || "Laker Administrator"
              }, { merge: true });
            } catch {
              // Silently ignore permission issues for auto-profiling
            }
          }
        }
      } else {
        setUser(null);
        setIsAdminDoc(false);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [toast, adminEmails]);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = (result.user.email || "").toLowerCase();
      if (!(email.endsWith("@gvsu.edu") || email.endsWith("@mail.gvsu.edu"))) {
        await signOut(auth);
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Please use your official @gvsu.edu or @mail.gvsu.edu Laker email.",
        });
      } else if (result.user.emailVerified === false) {
        await signOut(auth);
        toast({
          variant: "destructive",
          title: "Email Verification Required",
          description: "Please verify your Laker email address before signing in.",
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

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail.endsWith("@gvsu.edu") && !normalizedEmail.endsWith("@mail.gvsu.edu")) {
        throw new Error("Please use a GVSU email address.");
      }
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
      if (userCredential.user.emailVerified === false) {
        await signOut(auth);
        throw new Error("Please verify your email address before signing in.");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: error.message,
      });
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail.endsWith("@gvsu.edu") && !normalizedEmail.endsWith("@mail.gvsu.edu")) {
        throw new Error("Please use a GVSU email address.");
      }
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, pass);
      await updateProfile(userCredential.user, { displayName: name });
      await sendEmailVerification(userCredential.user);
      await signOut(auth);
      toast({
        title: "Verification Email Sent",
        description: "Please check your GVSU inbox and verify your email address before signing in.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message,
      });
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      await sendPasswordResetEmail(auth, normalizedEmail);
      toast({
        title: "Reset Email Sent",
        description: "Check your inbox for password reset instructions.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
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
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn: signInWithGoogle,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      resetPassword,
      logOut, 
      isAdmin 
    }}>
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

