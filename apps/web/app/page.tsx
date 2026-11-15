'use client';

import { useEffect, useMemo, useState } from 'react';

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
  const [selected, setSelected] = useState<Product | null>(null);

  useEffect(() => {
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
  const total = products.reduce((sum, item) => sum + item.basePrice * (cart[item.id] || 0), 0);
  const add = (id: number) => setCart((current) => ({ ...current, [id]: (current[id] || 0) + 1 }));

  return <main>
    <header className="topbar"><a className="brand" href="#home"><span className="brand-mark">B</span> BrewLite</a><a className="cart-link" href="#cart" aria-label={`Giỏ hàng, ${count} sản phẩm`}>Giỏ hàng <span>{count}</span></a></header>
    <section className="hero" id="home"><div className="hero-copy"><p className="eyebrow">CÀ PHÊ PHA THEO CÁCH CỦA BẠN</p><h1>Một chút dịu dàng<br />cho ngày thật ngon.</h1><p>Chọn món yêu thích, tụi mình pha thật chỉn chu.</p><a href="#menu" className="primary-link">Khám phá menu <span>↓</span></a></div><div className="hero-cup" aria-hidden="true"><div className="sun"/><div className="cup">☕</div><span className="sparkle s1">✳</span><span className="sparkle s2">✦</span></div></section>
    <section className="menu-section" id="menu"><div className="section-heading"><div><p className="eyebrow">BREWLITE SELECTION</p><h2>Menu hôm nay</h2></div><label className="search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm thức uống" aria-label="Tìm thức uống" /></label></div>
      <div className="filters" aria-label="Danh mục">{categories.map((item) => <button className={item === category ? 'filter active' : 'filter'} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div>
      {loading && <div className="notice">Đang pha menu cho bạn…</div>}
      {!loading && error && <div className="notice error" role="alert">{error}. <button onClick={() => location.reload()}>Thử lại</button></div>}
      {!loading && !error && filtered.length === 0 && <div className="notice">Chưa có món phù hợp. Thử từ khóa khác nhé.</div>}
      <div className="product-grid">{filtered.map((product, index) => <article className="product-card" key={product.id}><button className={`product-art art-${index % 4}`} onClick={() => setSelected(product)} aria-label={`Xem ${product.name}`}><span>{icons[product.category] || '🥤'}</span><i>{product.category}</i></button><div className="product-info"><div><p className="category">{product.category}</p><h3>{product.name}</h3><p className="description">{product.description}</p></div><div className="buy-row"><strong>{money(product.basePrice)}</strong><button className="add-button" onClick={() => add(product.id)} aria-label={`Thêm ${product.name} vào giỏ`}>+</button></div></div></article>)}</div>
    </section>
    <section className="cart-panel" id="cart"><div><p className="eyebrow">YOUR LITTLE PICK-ME-UP</p><h2>Giỏ hàng <span className="count-pill">{count}</span></h2>{count === 0 ? <p>Giỏ đang chờ món ngon đầu tiên.</p> : <ul>{products.filter((product) => cart[product.id]).map((product) => <li key={product.id}><span>{cart[product.id]} × {product.name}</span><strong>{money(product.basePrice * cart[product.id])}</strong></li>)}</ul>}</div><div className="cart-total"><span>Tạm tính</span><strong>{money(total)}</strong><button disabled={count === 0} onClick={() => alert('Bản MVP Sprint 1: checkout sẽ được bổ sung ở Sprint 2.')}>Tiếp tục đặt hàng <span>→</span></button></div></section>
    <footer><span>BREWLITE · PHA CHẬM MỘT NHỊP</span><span>Made for your little break ☕</span></footer>
    {selected && <div className="modal-backdrop" role="presentation" onClick={() => setSelected(null)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)} aria-label="Đóng">×</button><p className="eyebrow">{selected.category}</p><h2 id="modal-title">{selected.name}</h2><p>{selected.description}</p><p className="modal-price">{money(selected.basePrice)}</p><button className="modal-add" onClick={() => { add(selected.id); setSelected(null); }}>Thêm vào giỏ</button></section></div>}
  </main>;
}
