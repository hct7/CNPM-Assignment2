import './styles.css';
import type { Metadata, Viewport } from 'next';
import { DM_Sans, Playfair_Display } from 'next/font/google';

const sans = DM_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const serif = Playfair_Display({
  subsets: ['latin', 'vietnamese'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BrewLite | Cà phê pha theo cách của bạn',
  description: 'Xem menu và chọn thức uống yêu thích tại BrewLite.',
  applicationName: 'BrewLite',
};

export const viewport: Viewport = { themeColor: '#080506', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi" className={`dark ${sans.variable} ${serif.variable}`}><body className="bg-ink text-cream">{children}</body></html>;
}
