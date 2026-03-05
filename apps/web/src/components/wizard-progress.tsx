'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const STEPS = [
  { path: '/search/location', label: 'Where?', step: 1 },
  { path: '/search/dates', label: 'When & Budget', step: 2 },
  { path: '/search/type', label: 'Resort Type', step: 3 },
  { path: '/search/priorities', label: 'Priorities', step: 4 },
];

export function WizardProgress() {
  const pathname = usePathname();
  const current = STEPS.find((s) => pathname.startsWith(s.path));
  const currentStep = current?.step ?? 0;

  if (pathname.startsWith('/search/results')) return null;

  return (
    <div className="py-6">
      <div className="flex items-center gap-2">
        {STEPS.map((step, i) => {
          const isCompleted = step.step < currentStep;
          const isActive = step.step === currentStep;
          return (
            <div key={step.path} className="flex items-center gap-2 flex-1">
              <div className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                    isCompleted && 'bg-brand-600 text-white',
                    isActive && 'bg-brand-600 text-white ring-4 ring-brand-200',
                    !isCompleted && !isActive && 'bg-gray-200 text-gray-500',
                  )}
                >
                  {isCompleted ? '✓' : step.step}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium hidden sm:block',
                    isActive ? 'text-brand-700' : 'text-gray-400',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 rounded transition-all',
                    step.step < currentStep ? 'bg-brand-600' : 'bg-gray-200',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
