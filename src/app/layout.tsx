
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth-context";
import { SearchProvider } from "@/lib/search-context";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";
import { NewsTicker } from "@/components/news/NewsTicker";
import { GlobalAIDisclaimer } from "@/components/GlobalAIDisclaimer";

export const metadata: Metadata = {
  title: 'LakerAI Directory | GVSU AI Resources',
  description: 'The definitive institutional directory for AI tools at Grand Valley State University.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased bg-background text-slate-900 min-h-screen flex flex-col">
        <FirebaseClientProvider>
          <AuthProvider>
            <SearchProvider>
              {children}
              <CelebrationOverlay />
              <GlobalAIDisclaimer />
              <NewsTicker />
              <Toaster />
            </SearchProvider>
          </AuthProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
