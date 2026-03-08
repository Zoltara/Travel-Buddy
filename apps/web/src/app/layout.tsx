import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/lib/query-provider';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Travel Buddy – Stop comparing 47 tabs',
  description:
    'Tell me what to book. AI-powered resort decision engine that finds your top 3 perfect matches.',
  applicationName: 'Travel Buddy',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Travel Buddy',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Travel Buddy',
    description: 'Stop comparing 47 tabs. Get 3 perfect resort picks.',
    type: 'website',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('travel-buddy-theme');var r=document.documentElement;var v=t==='light'?'light':'dark';r.classList.toggle('dark',v==='dark');r.classList.toggle('light',v==='light');r.style.colorScheme=v;}catch(e){}})();",
          }}
        />
      </head>
      <body>
        <QueryProvider>
          {children}
          <Toaster position="bottom-right" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
