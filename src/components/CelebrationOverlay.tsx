
"use client";

import { useEffect, useState } from "react";
import { useUser, useFirestore, useDoc } from "@/firebase/hooks";
import { doc, updateDoc } from "firebase/firestore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PartyPopper } from "lucide-react";
import { UserProfile } from "@/app/lib/tool-types";

export function CelebrationOverlay() {
  const { user } = useUser();
  const firestore = useFirestore();
  const profileRef = user ? doc(firestore, "user_profiles", user.uid) : null;
  const { data: profile } = useDoc<UserProfile>(profileRef);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (profile?.notificationPending) {
      setShow(true);
    }
  }, [profile]);

  const handleDismiss = async () => {
    if (profileRef) {
      await updateDoc(profileRef, {
        notificationPending: false
      });
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <AlertDialog open={show} onOpenChange={setShow}>
      <AlertDialogContent className="rounded-3xl p-8 max-w-sm border-none shadow-2xl bg-white text-center">
        <AlertDialogHeader className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gvsuBlue/10 rounded-full flex items-center justify-center text-gvsuBlue mb-4">
            <PartyPopper className="w-8 h-8 animate-bounce" />
          </div>
          <AlertDialogTitle className="font-serif text-2xl font-black text-slate-900 uppercase">Great News!</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600 font-medium pt-2">
            Your tool was approved. You can see it live on the homepage now!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-8">
          <AlertDialogAction onClick={handleDismiss} className="w-full bg-gvsuBlue text-white font-bold h-12 rounded-xl uppercase tracking-widest text-xs">AWESOME!</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
