import type { Metadata, Viewport } from 'next';
import { Poppins, Unbounded, JetBrains_Mono } from 'next/font/google';
import { Suspense } from 'react';
import { PWARegister } from '@/components/pwa-register';
import './globals.css';

const poppins = Poppins({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const unbounded = Unbounded({
  variable: '--font-display-var',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-code',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Fan Club IA',
  description: 'Plataforma de Inteligência Artificial da Fan Club',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Fan Club IA',
  },
};

export const viewport: Viewport = {
  themeColor: '#7C3AED',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${poppins.variable} ${unbounded.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Suspense>{children}</Suspense>
        <PWARegister />
      </body>
    </html>
  );
}
