import type { Metadata } from 'next';
import { Fraunces, Geist, Geist_Mono, Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import SiteHeader from '@/components/SiteHeader';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['300', '400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Llamablaze',
  description: 'Premium Sneakers & Accessories - Quality Checked',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='en'
      className={cn(
        'h-full antialiased font-sans',
        geistSans.variable,
        geistMono.variable,
        inter.variable,
        fraunces.variable,
      )}
    >
      <body className='min-h-full flex flex-col bg-background text-foreground'>
        <SiteHeader />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
