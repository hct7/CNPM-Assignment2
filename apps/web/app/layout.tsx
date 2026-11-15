import './styles.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'BrewLite | Cà phê pha theo cách của bạn',
  description: 'Xem menu và chọn thức uống yêu thích tại BrewLite.',
  applicationName: 'BrewLite',
};

export const viewport: Viewport = { themeColor: '#355d49', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
