'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';

type Product = { id: number; name: string; description: string; category: string; basePrice: number; stock: number };
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const icons: Record<string, string> = { Coffee: '☕', Tea: '🍵' };
const money = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount) + 'đ';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<Record<number, number>>({});
  const [cartSizes, setCartSizes] = useState<Record<number, string>>({});
  const [orderKey, setOrderKey] = useState('');
  const [paymentKey, setPaymentKey] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'CARD'>('WALLET');
  const [selected, setSelected] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('MEDIUM');
  const [accessToken, setAccessToken] = useState('');
  const [authModal, setAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setAccessToken(localStorage.getItem('brewlite-token') || '');
    fetch(`${API}/products`).then((response) => {
      if (!response.ok) throw new Error('Không tải được menu');
      return response.json();
    }).then(setProducts).catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['Tất cả', ...Array.from(new Set(products.map((item) => item.category)))];
  const filtered = useMemo(() => products.filter((item) =>
    (category === 'Tất cả' || item.category === category) &&
    item.name.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))), [products, category, query]);
  const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const total = products.reduce((sum, item) => {
    const size = cartSizes[item.id] || 'MEDIUM';
    const multiplier = size === 'LARGE' ? 1.25 : size === 'MEDIUM' ? 1.1 : 1;
    return sum + Math.round(item.basePrice * multiplier) * (cart[item.id] || 0);
  }, 0);
  const add = (id: number, size = 'MEDIUM') => {
    setCart((current) => ({ ...current, [id]: (current[id] || 0) + 1 }));
    setCartSizes((current) => ({ ...current, [id]: size }));
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
        body: JSON.stringify({ items: Object.entries(cart).map(([productId, quantity]) => ({ productId: Number(productId), quantity, size: cartSizes[Number(productId)] || 'MEDIUM' })) }),
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
        setCheckoutMessage(`Đặt hàng thành công · mã ${order.id.slice(0, 8)} · ${money(payment.total)}`);
        setCart({}); setCartSizes({}); setOrderKey(''); setPaymentKey('');
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

  return <main>
    <header className="topbar"><a className="brand" href="#home"><span className="brand-mark">B</span> BrewLite</a><div className="top-actions">{accessToken ? <button className="account-link" onClick={() => { localStorage.removeItem('brewlite-token'); setAccessToken(''); }}>Đăng xuất</button> : <button className="account-link" onClick={() => { setAuthMode('login'); setAuthModal(true); }}>Đăng nhập</button>}<a className="cart-link" href="#cart" aria-label={`Giỏ hàng, ${count} sản phẩm`}>Giỏ hàng <span>{count}</span></a></div></header>
    <section className="hero" id="home"><div className="hero-copy"><p className="eyebrow">CÀ PHÊ PHA THEO CÁCH CỦA BẠN</p><h1>Một chút dịu dàng<br />cho ngày thật ngon.</h1><p>Chọn món yêu thích, tụi mình pha thật chỉn chu.</p><a href="#menu" className="primary-link">Khám phá menu <span>↓</span></a></div><div className="hero-cup" aria-hidden="true"><div className="sun"/><div className="cup">☕</div><span className="sparkle s1">✳</span><span className="sparkle s2">✦</span></div></section>
    <section className="menu-section" id="menu"><div className="section-heading"><div><p className="eyebrow">BREWLITE SELECTION</p><h2>Menu hôm nay</h2></div><label className="search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm thức uống" aria-label="Tìm thức uống" /></label></div>
      <div className="filters" aria-label="Danh mục">{categories.map((item) => <button className={item === category ? 'filter active' : 'filter'} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div>
      {loading && <div className="notice">Đang pha menu cho bạn…</div>}
      {!loading && error && <div className="notice error" role="alert">{error}. <button onClick={() => location.reload()}>Thử lại</button></div>}
      {!loading && !error && filtered.length === 0 && <div className="notice">Chưa có món phù hợp. Thử từ khóa khác nhé.</div>}
      <div className="product-grid">{filtered.map((product, index) => <article className="product-card" key={product.id}><button className={`product-art art-${index % 4}`} onClick={() => setSelected(product)} aria-label={`Xem ${product.name}`}><span>{icons[product.category] || '🥤'}</span><i>{product.category}</i></button><div className="product-info"><div><p className="category">{product.category}</p><h3>{product.name}</h3><p className="description">{product.description}</p></div><div className="buy-row"><strong>{money(product.basePrice)}</strong><button className="add-button" onClick={() => add(product.id)} aria-label={`Thêm ${product.name} vào giỏ`}>+</button></div></div></article>)}</div>
    </section>
    <section className="cart-panel" id="cart"><div><p className="eyebrow">YOUR LITTLE PICK-ME-UP</p><h2>Giỏ hàng <span className="count-pill">{count}</span></h2>{count === 0 ? <p>Giỏ đang chờ món ngon đầu tiên.</p> : <ul>{products.filter((product) => cart[product.id]).map((product) => { const size = cartSizes[product.id] || 'MEDIUM'; const unit = Math.round(product.basePrice * (size === 'LARGE' ? 1.25 : size === 'MEDIUM' ? 1.1 : 1)); return <li key={product.id}><span>{cart[product.id]} × {product.name} · {size}</span><strong>{money(unit * cart[product.id])}</strong></li>; })}</ul>}</div><div className="cart-total"><span>Tạm tính</span><strong>{money(total)}</strong><label className="payment-choice">Phương thức<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as 'WALLET' | 'CARD')}><option value="WALLET">Ví mô phỏng</option><option value="CARD">Thẻ mô phỏng</option></select></label><button disabled={count === 0 || submitting} onClick={checkout}>{submitting ? 'Đang xử lý…' : 'Thanh toán mô phỏng'} <span>→</span></button>{checkoutMessage && <p className="checkout-message" role="status">{checkoutMessage}</p>}</div></section>
    <footer><span>BREWLITE · PHA CHẬM MỘT NHỊP</span><span>Made for your little break ☕</span></footer>
    {selected && <div className="modal-backdrop" role="presentation" onClick={() => setSelected(null)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)} aria-label="Đóng">×</button><p className="eyebrow">{selected.category}</p><h2 id="modal-title">{selected.name}</h2><p>{selected.description}</p><p className="modal-price">{money(selected.basePrice * (selectedSize === 'LARGE' ? 1.25 : selectedSize === 'MEDIUM' ? 1.1 : 1))}</p><label className="field-label">Kích cỡ<select value={selectedSize} onChange={(event) => setSelectedSize(event.target.value)}><option value="SMALL">Small</option><option value="MEDIUM">Medium (+10%)</option><option value="LARGE">Large (+25%)</option></select></label><button className="modal-add" onClick={() => { add(selected.id, selectedSize); setSelected(null); }}>Thêm vào giỏ</button></section></div>}
    {authModal && <div className="modal-backdrop" role="presentation" onClick={() => setAuthModal(false)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="auth-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setAuthModal(false)} aria-label="Đóng">×</button><p className="eyebrow">BREWLITE ACCOUNT</p><h2 id="auth-title">{authMode === 'login' ? 'Chào bạn quay lại' : 'Tạo tài khoản'}</h2><form className="auth-form" onSubmit={submitAuth}>{authMode === 'register' && <label className="field-label">Tên hiển thị<input required minLength={2} value={authName} onChange={(event) => setAuthName(event.target.value)} autoComplete="name" /></label>}<label className="field-label">Email<input required type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} autoComplete="email" /></label><label className="field-label">Mật khẩu<input required type="password" minLength={8} value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} /></label>{authError && <p className="auth-error" role="alert">{authError}</p>}<button className="modal-add" type="submit">{authMode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</button></form><button className="auth-switch" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}>{authMode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}</button></section></div>}
  </main>;
}
