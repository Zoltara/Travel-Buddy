'use client';

import { SearchProvider } from '@/lib/search-context';
import { WizardProgress } from '@/components/wizard-progress';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showStartOver = pathname !== '/search/location';

  return (
    <SearchProvider>
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-sand-50 text-gray-900 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100">
        {/* Header */}
        <header className="px-6 py-5 flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🗺️</span>
            <span className="font-bold text-xl text-brand-700 dark:text-brand-300 tracking-tight">
              Travel Buddy
            </span>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-500 dark:text-slate-300 hidden sm:block">
              Stop comparing 47 tabs.
            </p>
            {showStartOver && (
              <Link
                href="/search/location"
                className="px-3 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-300 hover:text-brand-800 dark:hover:text-brand-200 border border-brand-300 dark:border-brand-700 rounded-lg hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors"
              >
                Start Over
              </Link>
            )}
            <ThemeToggle />
          </div>
        </header>

        {/* Wizard progress */}
        <div className="max-w-2xl mx-auto px-6">
          <WizardProgress />
        </div>

        {/* Page content */}
        <main className="max-w-2xl mx-auto px-6 pb-20 pt-2">
          {children}
        </main>
      </div>
    </SearchProvider>
  );
}
