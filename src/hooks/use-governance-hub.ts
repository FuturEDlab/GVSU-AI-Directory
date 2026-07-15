
'use client';

import { useFirestore, useUser, useStorage } from "@/firebase";
import { 
  doc, 
  updateDoc, 
  serverTimestamp, 
  setDoc, 
  deleteDoc, 
  collection, 
  addDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ToolSubmission, ToolStatus, ToolHealth, ToolTags } from "@/app/lib/tool-types";

export function useGovernanceHub() {
  const firestore = useFirestore();
  const storage = useStorage();

  const uploadToolImage = async (toolId: string, file: File) => {
    if (!storage) return null;
    const imageRef = ref(storage, `tool_images/${toolId}_${Date.now()}`);
    await uploadBytes(imageRef, file);
    return getDownloadURL(imageRef);
  };

  const deleteTool = async (toolId: string, collectionName: string) => {
    if (!firestore) return;
    await deleteDoc(doc(firestore, collectionName, toolId));
  };

  const publishTool = async (tool: ToolSubmission, narrative: string, imageUrl: string | null, tags: ToolTags, sourceCollection: string) => {
    if (!firestore) return;

    const publishedRef = doc(firestore, "tools_published", tool.id!);
    const sourceRef = doc(firestore, sourceCollection, tool.id!);
    const profileRef = doc(firestore, "user_profiles", tool.submitterId);

    const data = {
      ...tool,
      status: "Published" as ToolStatus,
      health: "Healthy" as ToolHealth,
      pedagogicalNarrative: narrative,
      ogImageUrl: imageUrl || tool.ogImageUrl || null,
      isVerified: true,
      tags: tags,
      publishedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(publishedRef, data);
    
    // Set celebration notification for user's next login
    await setDoc(profileRef, { 
      notificationPending: true,
      updatedAt: serverTimestamp()
    }, { merge: true });

    // Send Approval Email
    await addDoc(collection(firestore, "mail"), {
      to: tool.submitterEmail,
      message: {
        subject: "Great News: Your LakerAI Tool is Live!",
        html: `Hello ${tool.submitterDisplayName},<br><br>Great news! Your tool <b>${tool.title}</b> was approved. You can see it live on the homepage now!<br><br>Thanks for helping the community.`
      }
    });

    if (sourceCollection !== "tools_published") {
      await deleteDoc(sourceRef);
    }
  };

  return { uploadToolImage, deleteTool, publishTool };
}
