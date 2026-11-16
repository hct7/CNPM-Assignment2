'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import dynamic from 'next/dynamic';
import { calculateCartTotal, calculateUnitPrice, TOPPING_OPTIONS } from '../lib/cart-utils.mjs';
import { AnimatedTabs } from '@/components/ui/animated-tab';
import WordMagnet from '@/components/ui/word-magnet';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { LiquidTooltip } from '@/components/ui/liquid-tooltip';
import { MagneticScatterText } from '@/components/ui/magnetic-scatter-text';
import SoundText from '@/components/ui/sound-text';
import { Book3D } from '@/components/ui/book-3d';
import ToastTabs from '@/components/ui/toast-tabs';
import { cn } from '@/lib/utils';

const LiquidWave = dynamic(() => import('@/components/ui/liquid-wave'), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center font-mono text-[10px] uppercase tracking-[0.28em] text-cream/40">
      Đang khuấy…
    </div>
  ),
});

type Product = { id: number; name: string; description: string; category: string; basePrice: number; stock: number; imageUrl?: string | null };
type OrderSummary = { id: string; status: string; total: number; createdAt: string };
type AppliedPromotion = { code: string; discountAmount: number; total: number };
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const fallbackProductPhoto = 'https://images.unsplash.com/photo-1664515725366-e8328e9dc834?auto=format&fit=crop&w=1000&q=85';
const productPhotos: Record<number, string> = {
  1: fallbackProductPhoto,
  2: 'https://product.hstatic.net/200000626331/product/bac-xiu-vn-white-coffee-_hot-iced__84410b23a7594920a2ab145622b9fd04_1024x1024.jpg',
  3: 'https://artfultea.com/cdn/shop/files/0-1_2f43135a-b317-47d8-8f56-5e79f8a4265f.jpg?v=1763234911&width=1346',
  4: 'https://images.unsplash.com/photo-1581996323441-538096e854b9?auto=format&fit=crop&w=1000&q=85',
};
const money = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount) + 'đ';

const avatar = (emoji: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="#1a1a1a"/><text x="32" y="43" font-size="30" text-anchor="middle">${emoji}</text></svg>`,
  )}`;

const testimonials = [
  { id: 1, image: avatar('☕'), title: 'Linh · Quận 1', description: 'Ly cà phê sữa đá đúng gu, đá trong veo và không bị ngọt gắt. Sáng nào cũng ghé.' },
  { id: 2, image: avatar('🍵'), title: 'Minh · Thảo Điền', description: 'Trà sen vàng thơm dịu, thêm trân châu là chuẩn bài. Đặt trên web 30 giây là xong.' },
  { id: 3, image: avatar('🥤'), title: 'Hà · Bình Thạnh', description: 'Thích nhất là phần chọn size và topping rõ ràng, freeship nội thành, giao đúng giờ.' },
];

const bookPages = [
  { title: 'Hạt rang mỗi sáng', content: 'Arabica Đà Lạt rang mộc theo mẻ nhỏ, giữ lại vị chua thanh và hậu ngọt của mật ong rừng.' },
  { quote: 'Ly cà phê ngon nhất là ly được pha cho một người cụ thể.', author: 'BrewLite' },
  { title: 'Menu theo mùa', content: 'Mỗi tháng một vài món mới xuất hiện, vài món cũ tạm nghỉ. Menu hôm nay luôn là menu tươi nhất.' },
  { title: 'Đá trong veo', content: 'Đá được làm từ nước lọc hai lần, ủ lạnh 24 giờ để tan chậm — ly cà phê không bị nhạt dần.' },
  { title: 'Pha chậm một nhịp', content: 'Chúng tôi không cố làm nhanh hơn. Chỉ cố làm đúng, để bạn có một khoảng nghỉ thật vừa vặn.' },
];

const BeanMark = ({ className = 'size-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <ellipse cx="12" cy="12" rx="6.2" ry="8.6" transform="rotate(38 12 12)" fill="currentColor" />
    <path d="M8.2 6.6c2.7 2.2 3.6 8.4.9 10.8" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ArrowUpRight = ({ className = 'size-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M7 17 17 7" />
    <path d="M9 7h8v8" />
  </svg>
);

const BagIcon = ({ className = 'size-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M5 8h14l-1 11a2 2 0 0 1-2 1.8H8a2 2 0 0 1-2-1.8z" />
    <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
  </svg>
);

const SearchIcon = ({ className = 'size-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </svg>
);

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<Record<number, number>>({});
  const [cartSizes, setCartSizes] = useState<Record<number, string>>({});
  const [cartToppings, setCartToppings] = useState<Record<number, string[]>>({});
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromotion, setAppliedPromotion] = useState<AppliedPromotion | null>(null);
  const [promoMessage, setPromoMessage] = useState('');
  const [promoBusy, setPromoBusy] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState<number | null>(null);
  const [orderKey, setOrderKey] = useState('');
  const [paymentKey, setPaymentKey] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'CARD'>('WALLET');
  const [selected, setSelected] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('MEDIUM');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [accessToken, setAccessToken] = useState('');
  const [authModal, setAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderHistory, setOrderHistory] = useState<OrderSummary[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [cartLoaded, setCartLoaded] = useState(false);

  useEffect(() => {
    setAccessToken(localStorage.getItem('brewlite-token') || '');
    setUserRole(localStorage.getItem('brewlite-role') || '');
    try {
      const savedCart = localStorage.getItem('brewlite-cart');
      const savedSizes = localStorage.getItem('brewlite-cart-sizes');
      const savedToppings = localStorage.getItem('brewlite-cart-toppings');
      setOrderKey(localStorage.getItem('brewlite-order-key') || '');
      setPaymentKey(localStorage.getItem('brewlite-payment-key') || '');
      if (savedCart) setCart(JSON.parse(savedCart));
      if (savedSizes) setCartSizes(JSON.parse(savedSizes));
      if (savedToppings) setCartToppings(JSON.parse(savedToppings));
    } catch { localStorage.removeItem('brewlite-cart'); localStorage.removeItem('brewlite-cart-sizes'); localStorage.removeItem('brewlite-cart-toppings'); }
    setCartLoaded(true);
    fetch(`${API}/products`).then((response) => {
      if (!response.ok) throw new Error('Không tải được menu');
      return response.json();
    }).then(setProducts).catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!accessToken) { setLoyaltyPoints(null); return; }
    fetch(`${API}/loyalty/me`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => setLoyaltyPoints(result ? Number(result.points) : null))
      .catch(() => setLoyaltyPoints(null));
  }, [accessToken]);

  useEffect(() => {
    if (!cartLoaded) return;
    localStorage.setItem('brewlite-cart', JSON.stringify(cart));
    localStorage.setItem('brewlite-cart-sizes', JSON.stringify(cartSizes));
    localStorage.setItem('brewlite-cart-toppings', JSON.stringify(cartToppings));
  }, [cart, cartSizes, cartToppings, cartLoaded]);

  useEffect(() => {
    if (!cartLoaded) return;
    if (orderKey) localStorage.setItem('brewlite-order-key', orderKey); else localStorage.removeItem('brewlite-order-key');
    if (paymentKey) localStorage.setItem('brewlite-payment-key', paymentKey); else localStorage.removeItem('brewlite-payment-key');
  }, [orderKey, paymentKey, cartLoaded]);

  const categories = ['Tất cả', ...Array.from(new Set(products.map((item) => item.category)))];
  const categoryTabs = categories.map((item) => ({ id: item, label: item }));
  const filtered = useMemo(() => products.filter((item) =>
    (category === 'Tất cả' || item.category === category) &&
    item.name.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))), [products, category, query]);
  const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const subtotal = calculateCartTotal(products, cart, cartSizes, cartToppings);
  const total = Math.max(0, subtotal - (appliedPromotion?.discountAmount || 0));
  const add = (id: number, size = 'MEDIUM', toppings: string[] = []) => {
    setCart((current) => ({ ...current, [id]: (current[id] || 0) + 1 }));
    setCartSizes((current) => ({ ...current, [id]: size }));
    setCartToppings((current) => ({ ...current, [id]: toppings }));
    setAppliedPromotion(null); setPromoMessage('');
    setOrderKey(''); setPaymentKey('');
  };
  const changeQuantity = (id: number, delta: number) => {
    const nextQuantity = (cart[id] || 0) + delta;
    if (nextQuantity <= 0) {
      setCart((current) => { const next = { ...current }; delete next[id]; return next; });
      setCartSizes((current) => { const next = { ...current }; delete next[id]; return next; });
      setCartToppings((current) => { const next = { ...current }; delete next[id]; return next; });
    } else setCart((current) => ({ ...current, [id]: nextQuantity }));
    setAppliedPromotion(null); setPromoMessage('');
    setOrderKey(''); setPaymentKey('');
  };
  const applyPromotion = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) { setPromoMessage('Nhập mã khuyến mãi trước nhé.'); return; }
    setPromoBusy(true); setPromoMessage('');
    try {
      const response = await fetch(`${API}/promotions/validate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Không áp dụng được mã này');
      setAppliedPromotion({ code: result.code, discountAmount: Number(result.discountAmount), total: Number(result.total) });
      setPromoInput(result.code); setPromoMessage(`Đã áp dụng ${result.code}`);
      setOrderKey(''); setPaymentKey('');
    } catch (reason) {
      setAppliedPromotion(null);
      setPromoMessage(reason instanceof Error ? reason.message : 'Không áp dụng được mã này');
    } finally { setPromoBusy(false); }
  };
  const loadHistory = async () => {
    if (!accessToken) { setAuthMode('login'); setAuthModal(true); setAuthError('Đăng nhập để xem lịch sử đơn.'); return; }
    try {
      const response = await fetch(`${API}/orders/me`, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!response.ok) throw new Error('Không tải được lịch sử đơn');
      setOrderHistory(await response.json()); setShowHistory(true);
    } catch (reason) { setCheckoutMessage(reason instanceof Error ? reason.message : 'Có lỗi xảy ra'); }
  };
  const checkout = async () => {
    if (!accessToken) { setAuthModal(true); setAuthError('Đăng nhập để tiếp tục đặt hàng.'); return; }
    setSubmitting(true); setCheckoutMessage('');
    try {
      const idempotencyKey = orderKey || crypto.randomUUID();
      if (!orderKey) setOrderKey(idempotencyKey);
      const orderResponse = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`, 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ items: Object.entries(cart).map(([productId, quantity]) => ({ productId: Number(productId), quantity, size: cartSizes[Number(productId)] || 'MEDIUM', toppings: cartToppings[Number(productId)] || [] })), promoCode: appliedPromotion?.code }),
      });
      if (orderResponse.status === 401) { localStorage.removeItem('brewlite-token'); localStorage.removeItem('brewlite-role'); setAccessToken(''); setUserRole(''); setAuthModal(true); throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'); }
      const order = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(order.message || 'Không tạo được đơn hàng');
      const activePaymentKey = paymentKey || crypto.randomUUID();
      if (!paymentKey) setPaymentKey(activePaymentKey);
      const paymentResponse = await fetch(`${API}/orders/${order.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`, 'Idempotency-Key': activePaymentKey },
        body: JSON.stringify({ method: paymentMethod }),
      });
      const payment = await paymentResponse.json();
      if (!paymentResponse.ok) throw new Error(payment.message || 'Không thanh toán được đơn hàng');
      if (payment.status === 'SUCCESS') {
        const promoReceipt = order.promoCode ? ` · ${order.promoCode} −${money(Number(order.discountAmount))}` : '';
        setCheckoutMessage(`Đặt hàng thành công · PAID · mã ${order.id.slice(0, 8)}${promoReceipt} · ${money(payment.total)} · +${payment.loyaltyPointsAwarded || 0} điểm`);
        setCart({}); setCartSizes({}); setCartToppings({}); setOrderKey(''); setPaymentKey('');
        setAppliedPromotion(null); setPromoInput(''); setPromoMessage('');
        setLoyaltyPoints((current) => (current ?? 0) + Number(payment.loyaltyPointsAwarded || 0));
        const historyResponse = await fetch(`${API}/orders/me`, { headers: { Authorization: `Bearer ${accessToken}` } });
        if (historyResponse.ok) { setOrderHistory(await historyResponse.json()); setShowHistory(true); }
      } else {
        setCheckoutMessage(`Thanh toán thất bại · mã đơn ${order.id.slice(0, 8)}. Hãy thử tạo đơn mới.`);
        setOrderKey(''); setPaymentKey('');
      }
    } catch (reason) { setCheckoutMessage(reason instanceof Error ? reason.message : 'Có lỗi xảy ra, vui lòng thử lại.'); }
    finally { setSubmitting(false); }
  };
  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setAuthError('');
    try {
      const response = await fetch(`${API}/auth/${authMode === 'login' ? 'login' : 'register'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authMode === 'login' ? { email: authEmail, password: authPassword } : { name: authName, email: authEmail, password: authPassword }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(Array.isArray(result.message) ? result.message.join(', ') : result.message || 'Không xác thực được');
      localStorage.setItem('brewlite-token', result.accessToken);
      localStorage.setItem('brewlite-role', result.user.role);
      setUserRole(result.user.role);
      setAccessToken(result.accessToken); setAuthModal(false); setAuthPassword(''); setAuthError('');
    } catch (reason) { setAuthError(reason instanceof Error ? reason.message : 'Có lỗi xảy ra'); }
  };

  return <main className="relative min-h-screen overflow-x-hidden bg-ink text-cream">
    <header className="sticky top-4 z-40 px-4">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-2 rounded-full bg-surface-2/85 px-2 shadow-edge backdrop-blur-xl">
        <a className="flex shrink-0 items-center gap-2 rounded-full pl-2 pr-3 py-1" href="#home" aria-label="BrewLite">
          <BeanMark className="size-[22px] text-accent" />
          <span className="font-rund text-[15px] font-semibold tracking-[-0.02em] text-cream">BrewLite</span>
        </a>

        <nav aria-label="Điều hướng chính" className="hidden items-center gap-1 md:flex">
          <a className="nav-link px-3" href="#menu">Menu</a>
          <span aria-hidden="true" className="h-3.5 w-px bg-white/10" />
          <a className="nav-link px-3" href="#story">Câu chuyện</a>
          <span aria-hidden="true" className="h-3.5 w-px bg-white/10" />
          <a className="nav-link px-3" href="#cart">Giỏ hàng</a>
          <span aria-hidden="true" className="h-3.5 w-px bg-white/10" />
          <a className="nav-link px-3" href="#voices">Khách</a>
          {['STAFF', 'MANAGER'].includes(userRole) && <><span aria-hidden="true" className="h-3.5 w-px bg-white/10" /><a className="nav-link px-3" href="/admin">Admin</a></>}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          {accessToken && <button className="nav-link px-2 sm:px-3" onClick={loadHistory}>Đơn hàng</button>}
          {['STAFF', 'MANAGER'].includes(userRole) && <a className="nav-link px-2 sm:px-3" href="/admin">Admin</a>}
          {accessToken
            ? <button className="nav-link hidden px-3 sm:inline-flex" onClick={() => { localStorage.removeItem('brewlite-token'); localStorage.removeItem('brewlite-role'); setAccessToken(''); setUserRole(''); }}>Đăng xuất</button>
            : <button className="btn btn-secondary btn-sm" onClick={() => { setAuthMode('login'); setAuthModal(true); }}>Đăng nhập</button>}
          <LiquidTooltip text={`Giỏ hàng · ${count} món`} placement="bottom">
            <a className="btn btn-secondary btn-sm gap-2 px-2.5" href="#cart" aria-label={`Giỏ hàng, ${count} sản phẩm`}>
              <BagIcon className="size-[15px] text-cream/70" />
              <span className="font-mono text-[11px] tabular-nums text-cream/80">{count}</span>
            </a>
          </LiquidTooltip>
        </div>
      </div>
    </header>

    <section id="home" className="relative isolate flex min-h-[calc(100svh-5rem)] scroll-mt-24 items-center overflow-hidden px-5 py-16 md:py-20">
      <div aria-hidden="true" className="absolute inset-0 z-0 overflow-hidden bg-[#080706]">
        <LiquidWave
          color1="#ff6a1a"
          color2="#ffae63"
          color3="#ffe6c4"
          resolution={0.6}
          autoSpeed={0.9}
          autoIntensity={6}
          autoResumeDelay={300}
          autoRampDuration={0.3}
          takeoverDuration={0.2}
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.3)_0%,rgba(5,5,5,0.18)_42%,rgba(5,5,5,0.52)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(5,5,5,0.46)_0%,rgba(5,5,5,0.24)_36%,transparent_72%)]" />
        <div className="dot-grid absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_78%)]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-3xl text-center">
        <div className="mb-5 font-mono text-[9px] uppercase tracking-[0.34em] text-cream/55">BrewLite signature <span className="px-2 text-accent">·</span> Chạm vào sóng</div>
        <div className="chip">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
          <SoundText text="Pha chậm một nhịp" className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/60" basePitch={300} />
        </div>

        <h1 className="mt-7 font-rund font-bold tracking-[-0.035em]">
          <WordMagnet
            text="Một chút dịu dàng"
            className="justify-center gap-x-[0.18em] gap-y-0"
            textColor="#ededed"
            font={{ fontFamily: 'var(--font-open-runde)', fontSize: 'clamp(2.45rem, 6.2vw, 4.35rem)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: '1.03em' }}
            radius={90}
            force={0.24}
          />
          <WordMagnet
            text="cho ngày thật ngon."
            className="justify-center gap-x-[0.18em] gap-y-0"
            textColor="#fc4c01"
            font={{ fontFamily: 'var(--font-open-runde)', fontSize: 'clamp(2.45rem, 6.2vw, 4.35rem)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: '1.03em' }}
            radius={90}
            force={0.24}
          />
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-muted">
          Chọn món yêu thích, tụi mình pha thật chỉn chu — hạt rang mới mỗi sáng, đá trong veo và một chút dịu dàng dành riêng bạn.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button className="btn btn-primary w-full sm:w-auto" onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}>
            Khám phá menu
            <ArrowUpRight className="size-[15px]" />
          </button>
          <a className="btn btn-secondary w-full sm:w-auto" href="#cart">
            Giỏ của bạn
            <span className="font-mono text-[11px] tabular-nums text-cream/50">· {count}</span>
          </a>
        </div>

        <dl className="mx-auto mt-10 flex max-w-md items-center justify-center divide-x divide-white/10">
          {[
            { label: 'Món hôm nay', value: products.length ? String(products.length) : '—' },
            { label: 'Trong giỏ', value: String(count) },
            { label: 'Nhiệt độ', value: '24°C' },
          ].map((item) => (
            <div className="px-6 text-center sm:px-8" key={item.label}>
              <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-cream/35">{item.label}</dt>
              <dd className="mt-1 font-rund text-lg font-semibold text-cream">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

    </section>

    <section id="menu" className="relative scroll-mt-24 border-t border-white/5 bg-ink-soft py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-rund text-4xl font-bold tracking-[-0.03em] md:text-[3.1rem] md:leading-[1.05]">Menu hôm nay</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">Bốn món quen, pha mỗi ngày. Chọn size và topping ở bước tiếp theo.</p>
        </div>

        <div className="mt-9 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="flex h-12 w-full items-center gap-2.5 rounded-[14px] bg-surface-2 px-4 shadow-edge transition focus-within:ring-2 focus-within:ring-accent/30 md:max-w-xs">
            <SearchIcon className="size-4 shrink-0 text-cream/35" />
            <input
              className="h-full w-full bg-transparent text-sm text-cream placeholder:text-cream/35 focus:outline-none"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm thức uống"
              aria-label="Tìm thức uống"
            />
          </label>
          <div className="overflow-x-auto pb-1">
            <AnimatedTabs tabs={categoryTabs} activeTab={category} onChange={setCategory} className="w-fit shadow-none" />
          </div>
        </div>

        {loading && <div className="mt-10 grid place-items-center rounded-[32px] bg-surface-2 py-16 shadow-edge"><LoadingSpinner text="Đang pha menu cho bạn…" size="md" /></div>}
        {!loading && error && <div className="mt-10 rounded-[32px] bg-surface-2 px-6 py-5 text-sm text-cream shadow-edge" role="alert">{error}. <button className="underline underline-offset-4" onClick={() => location.reload()}>Thử lại</button></div>}
        {!loading && !error && filtered.length === 0 && <div className="mt-10 rounded-[32px] bg-surface-2 px-6 py-12 text-center text-sm text-muted shadow-edge">Chưa có món phù hợp. Thử từ khóa khác nhé.</div>}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {filtered.map((product, index) => {
            const photo = product.imageUrl || productPhotos[product.id];
            return <article className="group flex flex-col rounded-[32px] bg-surface-2 p-2 shadow-edge transition-colors duration-300 hover:bg-[#181818]" key={product.id}>
              <button
                className="relative flex h-48 w-full items-center justify-center overflow-hidden rounded-[26px] bg-surface sm:h-56"
                onClick={() => { setSelected(product); setSelectedSize('MEDIUM'); setSelectedToppings([]); }}
                aria-label={`Xem ${product.name}`}
              >
                {photo && <img src={photo} alt={product.name} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackProductPhoto; }} className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
                <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/45 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-cream/60 backdrop-blur">{product.category}</span>
                <span aria-hidden="true" className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-black/45 text-cream/70 opacity-0 backdrop-blur transition duration-300 group-hover:opacity-100">
                  <ArrowUpRight className="size-3.5" />
                </span>
              </button>

              <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex-1">
                  <h3 className="font-rund text-[17px] font-semibold leading-snug tracking-[-0.015em] text-cream">{product.name}</h3>
                  <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-muted">{product.description}</p>
                </div>
                <div className="flex items-center justify-between">
                  <strong className="font-mono text-[13px] font-medium text-cream">{money(product.basePrice)}</strong>
                  <LiquidTooltip text="Thêm nhanh" placement="top">
                    <button
                      className="grid size-9 place-items-center rounded-full bg-white/[0.06] text-lg leading-none text-cream shadow-edge transition hover:bg-accent hover:text-white"
                      onClick={() => add(product.id)}
                      aria-label={`Thêm ${product.name} vào giỏ`}
                    >
                      +
                    </button>
                  </LiquidTooltip>
                </div>
              </div>
            </article>;
          })}
        </div>
      </div>
    </section>

    <section id="cart" className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-20">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mono-label">Đơn của bạn</p>
          <h2 className="mt-2 flex items-center gap-3 font-rund text-3xl font-bold tracking-[-0.03em] md:text-4xl">
            Giỏ hàng
            <span className="rounded-full bg-accent/15 px-2.5 py-1 font-mono text-[11px] font-semibold text-accent">{count}</span>
          </h2>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream/30">Miễn phí giao nội thành</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.55fr_1fr]">
        <div className="surface-card flex flex-col p-2">
          <div className="flex-1 rounded-[26px] bg-surface p-4 shadow-edge md:p-6">
            {count === 0
              ? <div className="grid place-items-center py-16 text-center">
                <p className="font-rund text-lg font-semibold text-cream">Giỏ đang chờ món ngon đầu tiên</p>
                <p className="mt-1 text-xs text-muted">Chọn một ly ở menu phía trên nhé.</p>
              </div>
              : <ul className="divide-y divide-white/[0.07]">{products.filter((product) => cart[product.id]).map((product) => {
                const size = cartSizes[product.id] || 'MEDIUM';
                const toppings = cartToppings[product.id] || [];
                const unit = calculateUnitPrice(product.basePrice, size, toppings);
                return <li className="flex flex-wrap items-center gap-3 py-4 first:pt-0 last:pb-0" key={product.id}>
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface-2 text-xl shadow-edge" aria-hidden="true">{product.category === 'Coffee' ? '☕' : '🍵'}</span>
                  <span className="min-w-[9rem] flex-1 text-sm text-cream">
                    {product.name} · {size}
                    <small className="mt-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-cream/40">{toppings.map((id) => TOPPING_OPTIONS.find((option) => option.id === id)?.name).filter(Boolean).join(', ') || 'Không topping'} · {money(unit)} / món</small>
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-surface-2 p-1 shadow-edge">
                    <button className="grid size-7 place-items-center rounded-full text-sm text-cream/60 transition hover:bg-white/5 hover:text-cream" onClick={() => changeQuantity(product.id, -1)} aria-label={`Giảm ${product.name}`}>−</button>
                    <b className="min-w-5 text-center font-mono text-[11px] font-medium text-cream">{cart[product.id]}</b>
                    <button className="grid size-7 place-items-center rounded-full text-sm text-cream/60 transition hover:bg-white/5 hover:text-cream" onClick={() => changeQuantity(product.id, 1)} aria-label={`Tăng ${product.name}`}>+</button>
                  </span>
                  <strong className="w-20 text-right font-mono text-[12px] font-medium text-cream">{money(unit * cart[product.id])}</strong>
                </li>;
              })}</ul>}
          </div>
        </div>

        <aside className="surface-card flex h-fit flex-col gap-5 p-6 lg:sticky lg:top-24">
          <div className="grid gap-2">
            <div className="flex items-center justify-between text-xs text-muted"><span>Tạm tính</span><span className="font-mono">{money(subtotal)}</span></div>
            {appliedPromotion && <div className="flex items-center justify-between text-xs text-success"><span>Mã {appliedPromotion.code}</span><span className="font-mono">−{money(appliedPromotion.discountAmount)}</span></div>}
            <div className="mt-1 flex items-end justify-between border-t border-white/10 pt-3">
              <span className="mono-label">Tổng cộng</span>
              <strong className="font-rund text-[2rem] font-bold leading-none tracking-[-0.03em] text-cream">{money(total)}</strong>
            </div>
          </div>
          <div className="grid gap-2">
            <label htmlFor="promo-code" className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream/45">Mã khuyến mãi</label>
            <div className="flex gap-2">
              <input id="promo-code" className="field min-w-0 flex-1 font-mono text-[12px] uppercase text-cream placeholder:normal-case" value={promoInput} onChange={(event) => setPromoInput(event.target.value)} placeholder="Ví dụ: WELCOME10" maxLength={40} />
              {appliedPromotion
                ? <button className="btn btn-secondary px-3 text-xs" onClick={() => { setAppliedPromotion(null); setPromoMessage(''); setOrderKey(''); setPaymentKey(''); }}>Gỡ</button>
                : <button className="btn btn-secondary px-3 text-xs" onClick={applyPromotion} disabled={promoBusy || subtotal <= 0}>{promoBusy ? '…' : 'Áp dụng'}</button>}
            </div>
            {promoMessage && <p className={cn('text-[11px]', appliedPromotion ? 'text-success' : 'text-accent-soft')} role="status">{promoMessage}</p>}
          </div>
          <p className="rounded-2xl bg-white/[0.03] px-3 py-2 text-[11px] text-cream/45">{loyaltyPoints === null ? 'Thanh toán thành công nhận 1 điểm cho mỗi 10.000đ.' : `Bạn đang có ${loyaltyPoints} điểm · nhận 1 điểm cho mỗi 10.000đ.`}</p>
          <label className="grid gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-cream/45">Phương thức
            <select className="field font-sans text-[13px] normal-case tracking-normal text-cream" value={paymentMethod} disabled={submitting || !!paymentKey} onChange={(event) => setPaymentMethod(event.target.value as 'WALLET' | 'CARD')}>
              <option value="WALLET">Ví mô phỏng</option>
              <option value="CARD">Thẻ mô phỏng</option>
            </select>
          </label>
          <button className="btn btn-primary w-full" disabled={count === 0 || submitting} onClick={checkout}>
            {submitting ? 'Đang xử lý…' : 'Thanh toán mô phỏng'}
          </button>
          {checkoutMessage && <p
            className={cn('rounded-2xl px-4 py-3 text-[12px] leading-relaxed shadow-edge', checkoutMessage.includes('thành công') ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent-soft')}
            role="status"
          >{checkoutMessage}</p>}
          <p className="font-mono text-[10px] leading-relaxed text-cream/30">Thanh toán mô phỏng cho mục đích học tập, không lưu thông tin thẻ.</p>
        </aside>
      </div>
    </section>


    <section id="story" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16 md:py-20">
      <div className="surface-card grid items-center gap-8 p-5 md:grid-cols-2 md:gap-12 md:p-10">
        <div className="relative flex justify-center rounded-[26px] bg-black p-8 shadow-edge">
          <div aria-hidden="true" className="absolute inset-x-10 bottom-10 h-24 rounded-full bg-accent/25 blur-3xl" />
          <Book3D src="/book-cover.svg" width={220} height={318} pages={bookPages} />
        </div>
        <div>
          <MagneticScatterText text="Chuyện của quán" className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent" />
          <h2 className="mt-3 font-rund text-3xl font-bold leading-[1.08] tracking-[-0.03em] md:text-[2.65rem]">Một cuốn sổ, và rất nhiều mùi hương.</h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">Từng mẻ hạt, từng viên đá, từng món topping đều được ghi lại trong cuốn sổ nhỏ của quán. Rê chuột lên bìa để lật thử vài trang — biết đâu bạn tìm được món của mình.</p>
          <div className="mt-6 flex items-center gap-3">
            <SoundText text="Chạm thử" className="font-rund text-lg font-semibold text-accent" basePitch={340} />
            <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-accent/40 to-transparent" />
          </div>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-cream/30">Hover để lật trang · click để gấp lại</p>
        </div>
      </div>
    </section>

    {showHistory && <section id="orders" className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-20">
      <div className="mb-6">
        <p className="mono-label">BrewLite orders</p>
        <h2 className="mt-2 font-rund text-3xl font-bold tracking-[-0.03em] md:text-4xl">Lịch sử đơn hàng</h2>
      </div>
      <div className="surface-card p-2">
        <div className="rounded-[26px] bg-surface p-4 shadow-edge md:p-6">
          {orderHistory.length === 0
            ? <p className="py-6 text-sm text-muted">Chưa có đơn hàng nào.</p>
            : <ul className="divide-y divide-white/[0.07]">{orderHistory.map((order) => <li className="flex flex-wrap items-center gap-3 py-4 first:pt-0 last:pb-0" key={order.id}>
              <span className="min-w-0 flex-1 text-sm text-cream">
                <strong className="font-mono text-[13px] font-medium">#{order.id.slice(0, 8)}</strong>
                <small className="mt-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-cream/35">{new Date(order.createdAt).toLocaleString('vi-VN')}</small>
              </span>
              <span className="rounded-full bg-success/10 px-3 py-1 font-mono text-[10px] font-medium tracking-[0.12em] text-success">{order.status}</span>
              <strong className="w-20 text-right font-mono text-[12px] font-medium text-cream">{money(Number(order.total))}</strong>
            </li>)}</ul>}
        </div>
      </div>
    </section>}

    <section id="voices" className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-20">
      <div className="surface-card p-2">
        <div className="rounded-[26px] bg-surface px-5 py-10 shadow-edge md:px-10">
          <p className="mono-label text-center">Khách của quán</p>
          <h2 className="mt-2 text-center font-rund text-3xl font-bold tracking-[-0.03em] md:text-4xl">Một chút thương, gửi lại</h2>
          <ToastTabs tabs={testimonials} ringColor="#fc4c01" autoplayDelay={4200} className="mt-6" />
        </div>
      </div>
    </section>

    <footer className="border-t border-white/5 bg-ink px-5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <a className="flex items-center gap-2" href="#home" aria-label="BrewLite">
          <BeanMark className="size-5 text-accent" />
          <span className="font-rund text-sm font-semibold tracking-[-0.02em] text-cream">BrewLite</span>
        </a>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream/30">Pha chậm một nhịp · Made for your little break</p>
        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.16em] text-cream/40">
          <a className="transition hover:text-cream" href="#menu">Menu</a>
          <a className="transition hover:text-cream" href="#cart">Giỏ</a>
          <a className="transition hover:text-cream" href="#story">Chuyện</a>
        </div>
      </div>
    </footer>

    {selected && <div className="animate-backdrop fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md" role="presentation" onClick={() => setSelected(null)}>
      <section className="animate-modal my-auto w-full max-w-md rounded-[32px] bg-surface-2 p-6 shadow-edge md:p-7" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mono-label">{selected.category}</p>
            <h2 className="mt-2 font-rund text-[26px] font-bold tracking-[-0.02em]" id="modal-title">{selected.name}</h2>
          </div>
          <button className="grid size-8 shrink-0 place-items-center rounded-full bg-surface text-lg leading-none text-cream/50 shadow-edge transition hover:text-cream" onClick={() => setSelected(null)} aria-label="Đóng">×</button>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">{selected.description}</p>
        <p className="mt-4 font-mono text-xl font-medium text-accent">{money(calculateUnitPrice(selected.basePrice, selectedSize, selectedToppings))}</p>
        <label className="mt-5 grid gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-cream/45">Kích cỡ
          <select className="field font-sans text-[13px] normal-case tracking-normal text-cream" value={selectedSize} onChange={(event) => setSelectedSize(event.target.value)}>
            <option value="SMALL">Small</option>
            <option value="MEDIUM">Medium (+10%)</option>
            <option value="LARGE">Large (+25%)</option>
          </select>
        </label>
        <fieldset className="mt-4 grid gap-2 rounded-2xl bg-surface p-4 shadow-edge">
          <legend className="px-2 font-mono text-[10px] uppercase tracking-[0.16em] text-cream/45">Topping</legend>
          {TOPPING_OPTIONS.map((item) => <label className="flex items-center gap-3 text-xs text-cream/90" key={item.id}>
            <input className="size-4 accent-[#fc4c01]" type="checkbox" checked={selectedToppings.includes(item.id)} onChange={(event) => setSelectedToppings((current) => event.target.checked ? [...current, item.id] : current.filter((value) => value !== item.id))} />
            {item.name} (+{money(item.price)})
          </label>)}
        </fieldset>
        <div className="mt-6">
          <button className="btn btn-primary w-full" onClick={() => { add(selected.id, selectedSize, selectedToppings); setSelected(null); }}>Thêm vào giỏ</button>
        </div>
      </section>
    </div>}

    {authModal && <div className="animate-backdrop fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md" role="presentation" onClick={() => setAuthModal(false)}>
      <section className="animate-modal my-auto w-full max-w-md rounded-[32px] bg-surface-2 p-6 shadow-edge md:p-7" role="dialog" aria-modal="true" aria-labelledby="auth-title" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mono-label">BrewLite account</p>
            <h2 className="mt-2 font-rund text-[26px] font-bold tracking-[-0.02em]" id="auth-title">{authMode === 'login' ? 'Chào bạn quay lại' : 'Tạo tài khoản'}</h2>
          </div>
          <button className="grid size-8 shrink-0 place-items-center rounded-full bg-surface text-lg leading-none text-cream/50 shadow-edge transition hover:text-cream" onClick={() => setAuthModal(false)} aria-label="Đóng">×</button>
        </div>
        <form className="mt-5 grid gap-4" onSubmit={submitAuth}>
          {authMode === 'register' && <label className="grid gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-cream/45">Tên hiển thị<input className="field font-sans text-[13px] normal-case tracking-normal text-cream" required minLength={2} value={authName} onChange={(event) => setAuthName(event.target.value)} autoComplete="name" /></label>}
          <label className="grid gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-cream/45">Email<input className="field font-sans text-[13px] normal-case tracking-normal text-cream" required type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} autoComplete="email" /></label>
          <label className="grid gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-cream/45">Mật khẩu<input className="field font-sans text-[13px] normal-case tracking-normal text-cream" required type="password" minLength={8} value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} /></label>
          {authError && <p className="text-[11px] text-accent-soft" role="alert">{authError}</p>}
          <button className="btn btn-primary w-full" type="submit">{authMode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</button>
        </form>
        <button className="mt-4 w-full rounded-[14px] bg-surface py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-cream/50 shadow-edge transition hover:text-cream" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}>{authMode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}</button>
      </section>
    </div>}
  </main>;
}
