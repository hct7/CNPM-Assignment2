import './styles.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BrewLite | Cà phê pha theo cách của bạn',
  description: 'Xem menu và chọn thức uống yêu thích tại BrewLite.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
