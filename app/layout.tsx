import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import { Providers } from "./providers";
import { StagewiseDevToolbar } from "@/components/stagewise-toolbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FormBuilder - Создавайте формы быстро и легко",
  description: "Мощный конструктор форм с drag & drop интерфейсом, условной логикой и продвинутой аналитикой. Создавайте профессиональные формы за минуты.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <Toaster position="top-right" />
          <StagewiseDevToolbar />
        </Providers>
      </body>
    </html>
  );
}
