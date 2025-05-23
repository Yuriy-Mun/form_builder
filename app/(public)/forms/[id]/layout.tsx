import { Metadata } from 'next';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'Form Builder | Complete Form',
  description: 'Fill out this form created with our modern form builder.',
};

export default function PublicFormLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[30%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-blue-400/20 via-indigo-400/15 to-purple-400/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-[20%] -left-[30%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-emerald-400/15 via-teal-400/10 to-cyan-400/5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-100 dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent mb-2">
              Form Builder
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Please complete the form below
            </p>
          </div>
          
          {/* Form content - без дополнительного контейнера */}
          {children}
          
          {/* Footer */}
          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} Form Builder — Secure & Private
          </div>
        </div>
      </div>
    </div>
  );
} 