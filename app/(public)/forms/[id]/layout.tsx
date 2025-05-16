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
    <div className="min-h-screen bg-gradient-to-b from-background/50 via-background to-background/80">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -right-[60%] w-[100%] h-[100%] rounded-full bg-gradient-to-tr from-primary/5 to-primary/10 blur-3xl" />
        <div className="absolute -bottom-[30%] -left-[60%] w-[75%] h-[75%] rounded-full bg-gradient-to-br from-secondary/5 to-secondary/10 blur-3xl" />
      </div>
      <div className="relative z-10 py-8 px-4 min-h-screen flex flex-col items-center justify-center">
        <div className="w-full max-w-5xl">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
              Form Builder
            </h1>
            <p className="text-muted-foreground">
              Please complete the form below
            </p>
          </header>
          
          <main className="w-full">{children}</main>
          
          <footer className="mt-8 text-center text-muted-foreground text-sm">
            <p>© {new Date().getFullYear()} Form Builder — All rights reserved</p>
          </footer>
        </div>
      </div>
    </div>
  );
} 