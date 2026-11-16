'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import dynamic from 'next/dynamic';
import { calculateCartTotal, calculateUnitPrice, TOPPING_OPTIONS } from '../lib/cart-utils.mjs';
import LiquidButton from '@/components/ui/liquid-button';
import { AnimatedTabs } from '@/components/ui/animated-tab';
import WordMagnet from '@/components/ui/word-magnet';
import { VaporSmokeText } from '@/components/ui/vapor-smoke-text';
import LoadingSpinner from '@/components/ui/loading-spinner';
import RetroPixelButton from '@/components/ui/retro-pixel-button';
import { LiquidTooltip } from '@/components/ui/liquid-tooltip';
import { MagneticScatterText } from '@/components/ui/magnetic-scatter-text';
import SoundText from '@/components/ui/sound-text';
import { Book3D } from '@/components/ui/book-3d';
import ToastTabs from '@/components/ui/toast-tabs';
import FloatingNavigation from '@/components/ui/floating-navigation';
import { cn } from '@/lib/utils';

const LiquidWave = dynamic(() => import('@/components/ui/liquid-wave'), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center text-[10px] uppercase tracking-[0.32em] text-muted/70">
      Đang khuấy…
    </div>
  ),
});

type Product = { id: number; name: string; description: string; category: string; basePrice: number; stock: number };
type OrderSummary = { id: string; status: string; total: number; createdAt: string };
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const icons: Record<string, string> = { Coffee: '☕', Tea: '🍵' };
const artStyles = [
  'from-[#2b1b12] via-[#1a110c] to-[#0c0806]',
  'from-[#15211b] via-[#101a15] to-[#0c0806]',
  'from-[#261a10] via-[#1d1309] to-[#0c0806]',
  'from-[#1b1724] via-[#141020] to-[#0c0806]',
];
const money = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount) + 'đ';

const avatar = (emoji: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="#1d1611"/><text x="32" y="43" font-size="30" text-anchor="middle">${emoji}</text></svg>`,
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

const IconHome = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </svg>
);
const IconCup = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
    <path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17" />
    <path d="M6 21h12" />
  </svg>
);
const IconBag = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M4 8h16l-1.2 11a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);
const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
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
  const total = calculateCartTotal(products, cart, cartSizes, cartToppings);
  const add = (id: number, size = 'MEDIUM', toppings: string[] = []) => {
    setCart((current) => ({ ...current, [id]: (current[id] || 0) + 1 }));
    setCartSizes((current) => ({ ...current, [id]: size }));
    setCartToppings((current) => ({ ...current, [id]: toppings }));
    setOrderKey(''); setPaymentKey('');
  };
  const changeQuantity = (id: number, delta: number) => {
    const nextQuantity = (cart[id] || 0) + delta;
    if (nextQuantity <= 0) {
      setCart((current) => { const next = { ...current }; delete next[id]; return next; });
      setCartSizes((current) => { const next = { ...current }; delete next[id]; return next; });
      setCartToppings((current) => { const next = { ...current }; delete next[id]; return next; });
    } else setCart((current) => ({ ...current, [id]: nextQuantity }));
    setOrderKey(''); setPaymentKey('');
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
        body: JSON.stringify({ items: Object.entries(cart).map(([productId, quantity]) => ({ productId: Number(productId), quantity, size: cartSizes[Number(productId)] || 'MEDIUM', toppings: cartToppings[Number(productId)] || [] })) }),
      });
      if (orderResponse.status === 401) { localStorage.removeItem('brewlite-token'); setAccessToken(''); setAuthModal(true); throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'); }
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
        setCheckoutMessage(`Đặt hàng thành công · PAID · mã ${order.id.slice(0, 8)} · ${money(payment.total)}`);
        setCart({}); setCartSizes({}); setCartToppings({}); setOrderKey(''); setPaymentKey('');
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
      setAccessToken(result.accessToken); setAuthModal(false); setAuthPassword(''); setAuthError('');
    } catch (reason) { setAuthError(reason instanceof Error ? reason.message : 'Có lỗi xảy ra'); }
  };

  const dockItems = [
    { id: 'home', label: 'Trang chủ', icon: <IconHome />, onSelect: () => document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' }) },
    { id: 'menu', label: 'Menu', icon: <IconCup />, onSelect: () => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' }) },
    { id: 'cart', label: 'Giỏ hàng', icon: <IconBag />, onSelect: () => document.getElementById('cart')?.scrollIntoView({ behavior: 'smooth' }) },
    {
      id: 'account',
      label: accessToken ? 'Đơn hàng' : 'Tài khoản',
      icon: <IconUser />,
      onSelect: () => {
        if (accessToken) void loadHistory();
        else { setAuthMode('login'); setAuthModal(true); }
      },
    },
  ];

  return <main className="relative min-h-screen overflow-x-hidden bg-ink text-cream">
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute -top-48 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(226,161,92,0.20),transparent_62%)] blur-3xl" />
      <div className="absolute -bottom-40 right-0 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(143,214,169,0.14),transparent_70%)] blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_28%,transparent_72%,rgba(0,0,0,0.5))]" />
    </div>

    <header className="sticky top-3 z-40 mx-auto w-full max-w-6xl px-4">
      <div className="glass-panel flex items-center justify-between gap-3 rounded-full px-3 py-2 sm:px-4">
        <a className="flex shrink-0 items-center gap-2.5" href="#home" aria-label="BrewLite">
          <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-copper to-copper-dark font-serif text-lg font-semibold text-ink shadow-[0_0_26px_-6px] shadow-copper/70">B</span>
          <span className="font-serif text-base tracking-tight text-cream sm:text-lg">BrewLite</span>
        </a>
        <div className="hidden md:block">
          <FloatingNavigation items={dockItems} className="relative bottom-auto left-auto translate-x-0" />
        </div>
        <div className="flex items-center gap-1 text-xs">
          {accessToken && <button className="ghost-link" onClick={loadHistory}>Đơn hàng</button>}
          {accessToken
            ? <button className="ghost-link" onClick={() => { localStorage.removeItem('brewlite-token'); setAccessToken(''); }}>Đăng xuất</button>
            : <button className="ghost-link" onClick={() => { setAuthMode('login'); setAuthModal(true); }}>Đăng nhập</button>}
          <LiquidTooltip text={`Giỏ hàng · ${count} món`} placement="bottom" className="ml-1">
            <a className="inline-flex items-center gap-2 rounded-full border border-copper/30 bg-copper/10 px-3 py-2 text-[11px] font-semibold text-copper transition hover:border-copper/60 hover:bg-copper/15" href="#cart" aria-label={`Giỏ hàng, ${count} sản phẩm`}>
              <span aria-hidden="true">🛍</span>
              <span aria-hidden="true" className="tabular-nums">{count}</span>
            </a>
          </LiquidTooltip>
        </div>
      </div>
    </header>

    <section id="home" className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pt-16 pb-16 md:grid-cols-[1.05fr_0.95fr] md:pt-24 md:pb-24">
      <div className="relative z-10">
        <MagneticScatterText text="Cà phê pha theo cách của bạn" className="eyebrow" />
        <h1 className="mt-5 font-serif text-[clamp(2.2rem,4.4vw,3.5rem)] leading-[1.06] tracking-tight">
          <WordMagnet text="Một chút dịu dàng" className="justify-start gap-x-[0.14em] gap-y-0" textColor="#f7f0e6" font={{ fontFamily: 'var(--font-serif)', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: '1.1em' }} radius={100} force={0.28} />
          <WordMagnet text="cho ngày thật ngon." className="justify-start gap-x-[0.14em]" textColor="#e2a15c" font={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontStyle: 'italic', letterSpacing: '-0.02em', lineHeight: '1.1em' }} radius={100} force={0.28} />
        </h1>
        <p className="mt-6 max-w-md text-sm leading-relaxed text-muted">Chọn món yêu thích, tụi mình pha thật chỉn chu — hạt rang mới mỗi sáng, đá trong veo, và một chút dịu dàng dành riêng bạn.</p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <LiquidButton text="Khám phá menu" className="p-0" backgroundColor="bg-gradient-to-br from-copper to-copper-dark" textColor="text-ink" onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })} />
          <a className="ghost-link border border-white/10 px-5 py-3 text-xs text-cream/80" href="#cart">Giỏ của bạn · {count}</a>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-md">
        <div aria-hidden="true" className="absolute -inset-6 rounded-[2.5rem] bg-[radial-gradient(circle_at_50%_45%,rgba(226,161,92,0.25),transparent_70%)] blur-2xl" />
        <div className="relative h-[19rem] overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-surface-2 to-ink shadow-[0_50px_140px_-70px_rgba(226,161,92,0.9)] md:h-[24rem]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_58%_42%,rgba(226,161,92,0.4),rgba(255,138,61,0.12)_45%,transparent_70%)] blur-xl" />
          <LiquidWave color1="#e2a15c" color2="#ff8a3d" color3="#f2c08a" resolution={0.55} autoSpeed={0.8} autoIntensity={3} autoResumeDelay={400} autoRampDuration={0.3} takeoverDuration={0.2} className="h-full w-full" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_130%,rgba(8,5,6,0.9),transparent_62%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-5">
            <span className="text-[10px] uppercase tracking-[0.34em] text-cream/70">BrewLite signature</span>
            <span className="text-[10px] uppercase tracking-[0.34em] text-copper">01</span>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/70 to-transparent p-5 pt-16">
            <VaporSmokeText text="Khuấy nhẹ" className="text-[10px] uppercase tracking-[0.5em] text-cream/70" />
            <p className="mt-2 font-serif text-2xl text-cream">Chạm vào sóng</p>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-4 -top-6 hidden rounded-2xl border border-white/10 bg-ink/80 px-3 py-2 text-[10px] uppercase tracking-[0.24em] text-cream/70 backdrop-blur md:block">24°C · Sáng</div>
      </div>
    </section>

    <section id="menu" className="relative border-y border-white/5 bg-ink-soft/70 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <SoundText text="BrewLite selection" className="eyebrow" basePitch={260} />
            <h2 className="mt-3 font-serif text-4xl tracking-tight md:text-5xl">Menu hôm nay</h2>
          </div>
          <label className="flex h-11 w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-muted backdrop-blur transition focus-within:border-copper/50 focus-within:bg-white/[0.06] md:w-72">
            <span aria-hidden="true" className="text-sm">⌕</span>
            <input className="h-full w-full bg-transparent text-sm text-cream placeholder:text-muted/70 focus:outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm thức uống" aria-label="Tìm thức uống" />
          </label>
        </div>

        <div className="mt-6 flex justify-start overflow-x-auto pb-2">
          <AnimatedTabs tabs={categoryTabs} activeTab={category} onChange={setCategory} />
        </div>

        {loading && <div className="mt-10 flex items-center justify-center rounded-3xl border border-white/8 bg-surface/50 py-14"><LoadingSpinner text="Đang pha menu cho bạn…" size="md" /></div>}
        {!loading && error && <div className="mt-10 rounded-3xl border border-red-400/25 bg-red-500/10 px-6 py-5 text-sm text-red-200" role="alert">{error}. <button className="underline underline-offset-4" onClick={() => location.reload()}>Thử lại</button></div>}
        {!loading && !error && filtered.length === 0 && <div className="mt-10 rounded-3xl border border-white/8 bg-surface/50 px-6 py-10 text-center text-sm text-muted">Chưa có món phù hợp. Thử từ khóa khác nhé.</div>}

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {filtered.map((product, index) => <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/8 bg-surface/70 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-copper/40 hover:shadow-[0_30px_70px_-40px_rgba(226,161,92,0.75)]" key={product.id}>
            <button className={cn('relative flex h-36 w-full items-center justify-center overflow-hidden bg-gradient-to-br sm:h-44', artStyles[index % 4])} onClick={() => { setSelected(product); setSelectedSize('MEDIUM'); setSelectedToppings([]); }} aria-label={`Xem ${product.name}`}>
              <span aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_30%_15%,rgba(255,255,255,0.16),transparent_58%)] opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
              <span aria-hidden="true" className="text-5xl transition-transform duration-500 group-hover:scale-110 sm:text-6xl">{icons[product.category] || '🥤'}</span>
              <i className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[9px] font-semibold uppercase not-italic tracking-[0.16em] text-cream/70">{product.category}</i>
            </button>
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="flex-1">
                <h3 className="font-serif text-lg leading-snug text-cream">{product.name}</h3>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted">{product.description}</p>
              </div>
              <div className="flex items-center justify-between">
                <strong className="text-sm font-semibold text-copper">{money(product.basePrice)}</strong>
                <LiquidTooltip text="Thêm nhanh" placement="top">
                  <button className="grid size-9 place-items-center rounded-full border border-copper/30 bg-copper/10 text-lg leading-none text-copper transition hover:scale-105 hover:border-copper/70 hover:bg-copper hover:text-ink" onClick={() => add(product.id)} aria-label={`Thêm ${product.name} vào giỏ`}>+</button>
                </LiquidTooltip>
              </div>
            </div>
          </article>)}
        </div>
      </div>
    </section>

    <section id="story" className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-[0.85fr_1.15fr] md:gap-16 md:py-20">
      <div className="relative flex justify-center">
        <div aria-hidden="true" className="absolute inset-x-6 bottom-4 h-24 rounded-full bg-copper/20 blur-3xl" />
        <Book3D src="/book-cover.svg" width={232} height={336} pages={bookPages} />
      </div>
      <div>
        <p className="eyebrow">Chuyện của quán</p>
        <h2 className="mt-3 font-serif text-4xl leading-tight tracking-tight md:text-5xl">Một cuốn sổ, và rất nhiều mùi hương.</h2>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">Từng mẻ hạt, từng viên đá, từng món topping đều được ghi lại trong cuốn sổ nhỏ của quán. Rê chuột lên bìa để lật thử vài trang — biết đâu bạn tìm được món của mình.</p>
        <div className="mt-7 flex items-center gap-4">
          <SoundText text="Chạm thử" className="font-serif text-2xl text-copper" basePitch={320} />
          <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-copper/50 to-transparent" />
        </div>
        <p className="mt-3 text-[10px] uppercase tracking-[0.26em] text-muted/70">Hover để lật trang · click để gấp lại</p>
      </div>
    </section>

    <section id="cart" className="mx-auto max-w-6xl px-5 py-16 md:py-20">
      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        <div className="rounded-3xl border border-white/8 bg-surface/60 p-6 backdrop-blur md:p-8">
          <p className="eyebrow">Your little pick-me-up</p>
          <h2 className="mt-2 flex items-center gap-3 font-serif text-3xl tracking-tight md:text-4xl">Giỏ hàng <span className="rounded-full border border-copper/30 bg-copper/10 px-3 py-1 text-xs font-semibold text-copper">{count}</span></h2>
          {count === 0
            ? <p className="mt-6 text-sm text-muted">Giỏ đang chờ món ngon đầu tiên.</p>
            : <ul className="mt-6 divide-y divide-white/8">{products.filter((product) => cart[product.id]).map((product) => { const size = cartSizes[product.id] || 'MEDIUM'; const toppings = cartToppings[product.id] || []; const unit = calculateUnitPrice(product.basePrice, size, toppings); return <li className="flex flex-wrap items-center gap-4 py-4" key={product.id}>
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl" aria-hidden="true">{icons[product.category] || '🥤'}</span>
              <span className="min-w-[9rem] flex-1 text-sm text-cream">
                {product.name} · {size}
                <small className="mt-1 block text-[10px] leading-relaxed text-muted">{toppings.map((id) => TOPPING_OPTIONS.find((option) => option.id === id)?.name).filter(Boolean).join(', ') || 'Không topping'} · {money(unit)} / món</small>
              </span>
              <span className="flex items-center gap-2">
                <button className="grid size-7 place-items-center rounded-full border border-white/12 text-sm text-cream/80 transition hover:border-copper/60 hover:text-copper" onClick={() => changeQuantity(product.id, -1)} aria-label={`Giảm ${product.name}`}>−</button>
                <b className="min-w-5 text-center text-xs text-cream">{cart[product.id]}</b>
                <button className="grid size-7 place-items-center rounded-full border border-white/12 text-sm text-cream/80 transition hover:border-copper/60 hover:text-copper" onClick={() => changeQuantity(product.id, 1)} aria-label={`Tăng ${product.name}`}>+</button>
              </span>
              <strong className="w-20 text-right text-sm text-copper">{money(unit * cart[product.id])}</strong>
            </li>; })}</ul>}
        </div>

        <aside className="flex h-fit flex-col gap-4 rounded-3xl border border-white/10 bg-gradient-to-b from-surface-2 to-surface p-6 backdrop-blur lg:sticky lg:top-24">
          <div className="flex items-baseline justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-muted">Tạm tính</span>
            <strong className="font-serif text-3xl text-cream">{money(total)}</strong>
          </div>
          <label className="grid gap-2 text-[11px] text-muted">Phương thức
            <select className="field" value={paymentMethod} disabled={submitting || !!paymentKey} onChange={(event) => setPaymentMethod(event.target.value as 'WALLET' | 'CARD')}>
              <option value="WALLET">Ví mô phỏng</option>
              <option value="CARD">Thẻ mô phỏng</option>
            </select>
          </label>
          <div className={cn('flex [&>button]:w-full', count === 0 && 'pointer-events-none opacity-40')}>
            <RetroPixelButton baseColor="#0d0907" pixelColor="#e2a15c" textColor="#f7f0e6" disabled={count === 0 || submitting} onClick={checkout}>
              {submitting ? 'Đang xử lý…' : 'Thanh toán mô phỏng'}
            </RetroPixelButton>
          </div>
          {checkoutMessage && <p className="rounded-2xl border border-leaf/25 bg-leaf/10 px-4 py-3 text-[11px] leading-relaxed text-leaf" role="status">{checkoutMessage}</p>}
          <p className="text-[10px] leading-relaxed text-muted/70">Thanh toán mô phỏng cho mục đích học tập, không lưu thông tin thẻ.</p>
        </aside>
      </div>
    </section>

    {showHistory && <section id="orders" className="mx-auto max-w-6xl px-5 pb-16 md:pb-20">
      <div className="rounded-3xl border border-white/8 bg-surface/60 p-6 backdrop-blur md:p-8">
        <p className="eyebrow">Your BrewLite orders</p>
        <h2 className="mt-2 font-serif text-3xl tracking-tight md:text-4xl">Lịch sử đơn hàng</h2>
        {orderHistory.length === 0
          ? <p className="mt-5 text-sm text-muted">Chưa có đơn hàng nào.</p>
          : <ul className="mt-5 divide-y divide-white/8">{orderHistory.map((order) => <li className="flex flex-wrap items-center gap-3 py-4" key={order.id}>
            <span className="min-w-0 flex-1 text-sm text-cream">
              <strong className="font-semibold">#{order.id.slice(0, 8)}</strong>
              <small className="mt-1 block text-[10px] text-muted">{new Date(order.createdAt).toLocaleString('vi-VN')}</small>
            </span>
            <span className="rounded-full border border-leaf/25 bg-leaf/10 px-3 py-1 text-[10px] font-semibold tracking-[0.16em] text-leaf">{order.status}</span>
            <strong className="w-20 text-right text-sm text-copper">{money(Number(order.total))}</strong>
          </li>)}</ul>}
      </div>
    </section>}

    <section id="voices" className="mx-auto max-w-6xl px-5 pb-16 md:pb-20">
      <div className="rounded-3xl border border-white/8 bg-surface/50 px-5 py-10 backdrop-blur md:px-10">
        <p className="eyebrow text-center">Khách của quán</p>
        <h2 className="mt-2 text-center font-serif text-3xl tracking-tight md:text-4xl">Một chút thương, gửi lại</h2>
        <ToastTabs tabs={testimonials} ringColor="#e2a15c" autoplayDelay={4200} className="mt-6" />
      </div>
    </section>

    <footer className="border-t border-white/5 bg-ink-soft/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 pb-10 text-[10px] uppercase tracking-[0.28em] text-muted/80 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[10px] uppercase tracking-[0.28em] text-muted/80">BrewLite · Pha chậm một nhịp</span>
        <span className="normal-case tracking-normal text-muted/60">Made for your little break ☕</span>
      </div>
    </footer>

    {selected && <div className="animate-backdrop fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-md" role="presentation" onClick={() => setSelected(null)}>
      <section className="animate-modal w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-b from-surface-2 to-surface p-6 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">{selected.category}</p>
            <h2 className="mt-2 font-serif text-3xl tracking-tight" id="modal-title">{selected.name}</h2>
          </div>
          <button className="grid size-8 place-items-center rounded-full border border-white/10 text-lg text-muted transition hover:border-copper/50 hover:text-cream" onClick={() => setSelected(null)} aria-label="Đóng">×</button>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">{selected.description}</p>
        <p className="mt-4 font-serif text-2xl text-copper">{money(calculateUnitPrice(selected.basePrice, selectedSize, selectedToppings))}</p>
        <label className="mt-5 grid gap-2 text-[11px] text-muted">Kích cỡ
          <select className="field" value={selectedSize} onChange={(event) => setSelectedSize(event.target.value)}>
            <option value="SMALL">Small</option>
            <option value="MEDIUM">Medium (+10%)</option>
            <option value="LARGE">Large (+25%)</option>
          </select>
        </label>
        <fieldset className="mt-5 grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-4">
          <legend className="px-2 text-[11px] text-muted">Topping</legend>
          {TOPPING_OPTIONS.map((item) => <label className="flex items-center gap-3 text-xs text-cream/90" key={item.id}>
            <input className="size-4 accent-[#e2a15c]" type="checkbox" checked={selectedToppings.includes(item.id)} onChange={(event) => setSelectedToppings((current) => event.target.checked ? [...current, item.id] : current.filter((value) => value !== item.id))} />
            {item.name} (+{money(item.price)})
          </label>)}
        </fieldset>
        <div className="mt-6 flex justify-end">
          <LiquidButton text="Thêm vào giỏ" className="p-0" backgroundColor="bg-gradient-to-br from-copper to-copper-dark" textColor="text-ink" onClick={() => { add(selected.id, selectedSize, selectedToppings); setSelected(null); }} />
        </div>
      </section>
    </div>}

    {authModal && <div className="animate-backdrop fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-md" role="presentation" onClick={() => setAuthModal(false)}>
      <section className="animate-modal w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-b from-surface-2 to-surface p-6 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]" role="dialog" aria-modal="true" aria-labelledby="auth-title" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">BrewLite account</p>
            <h2 className="mt-2 font-serif text-3xl tracking-tight" id="auth-title">{authMode === 'login' ? 'Chào bạn quay lại' : 'Tạo tài khoản'}</h2>
          </div>
          <button className="grid size-8 place-items-center rounded-full border border-white/10 text-lg text-muted transition hover:border-copper/50 hover:text-cream" onClick={() => setAuthModal(false)} aria-label="Đóng">×</button>
        </div>
        <form className="mt-5 grid gap-4" onSubmit={submitAuth}>
          {authMode === 'register' && <label className="grid gap-2 text-[11px] text-muted">Tên hiển thị<input className="field" required minLength={2} value={authName} onChange={(event) => setAuthName(event.target.value)} autoComplete="name" /></label>}
          <label className="grid gap-2 text-[11px] text-muted">Email<input className="field" required type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} autoComplete="email" /></label>
          <label className="grid gap-2 text-[11px] text-muted">Mật khẩu<input className="field" required type="password" minLength={8} value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} /></label>
          {authError && <p className="text-[11px] text-red-300" role="alert">{authError}</p>}
          <button className="h-11 rounded-xl bg-gradient-to-br from-copper to-copper-dark text-sm font-semibold text-ink transition hover:brightness-110" type="submit">{authMode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</button>
        </form>
        <button className="mt-4 w-full rounded-xl border border-white/10 py-2.5 text-[11px] text-muted transition hover:border-copper/40 hover:text-cream" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}>{authMode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}</button>
      </section>
    </div>}
  </main>;
}
