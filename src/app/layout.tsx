
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth-context";
import { SearchProvider } from "@/lib/search-context";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";
import { GlobalAIDisclaimer } from "@/components/GlobalAIDisclaimer";
import { ThemeSync } from "@/components/ThemeSync";

export const metadata: Metadata = {
  title: '(Unofficial) GVSU LakerAI Directory',
  description: 'The institutional AI resource directory, governance scorecard, and prompt library for Grand Valley State University.',
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
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{__html: `
          (function() {
            try {
              localStorage.removeItem('theme');
              const theme = localStorage.getItem('gvsu_theme_v2') || 'light';
              if (theme === 'dark') {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch (e) {}
          })()
        `}} />
      </head>
      <body className="font-sans antialiased bg-[#F8FAFC] text-[#0F172A] min-h-screen flex flex-col transition-colors duration-200">
        <FirebaseClientProvider>
          <AuthProvider>
            <SearchProvider>
              <ThemeSync />
              {children}
              <CelebrationOverlay />
              <GlobalAIDisclaimer />
              <Toaster />
            </SearchProvider>
          </AuthProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
