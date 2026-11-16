import './styles.css';
import type { Metadata, Viewport } from 'next';
import { Geist_Mono, Inter } from 'next/font/google';
import localFont from 'next/font/local';

const openRunde = localFont({
  src: [
    { path: './fonts/OpenRunde-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/OpenRunde-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/OpenRunde-Semibold.woff2', weight: '600', style: 'normal' },
    { path: './fonts/OpenRunde-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-open-runde',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
  display: 'swap',
});

const mono = Geist_Mono({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BrewLite | Cà phê pha theo cách của bạn',
  description: 'Xem menu và chọn thức uống yêu thích tại BrewLite.',
  applicationName: 'BrewLite',
};

export const viewport: Viewport = { themeColor: '#000000', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`dark ${openRunde.variable} ${inter.variable} ${mono.variable}`}>
      <body className="bg-ink font-sans text-cream antialiased">{children}</body>
    </html>
  );
}
