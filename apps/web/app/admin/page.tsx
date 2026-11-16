'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const money = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
const statusLabels: Record<string, string> = {
  PENDING: 'Chờ thanh toán', PAID: 'Chờ pha chế', PREPARING: 'Đang pha chế', READY: 'Chờ khách nhận',
  COMPLETED: 'Đã hoàn tất', PAYMENT_FAILED: 'Thanh toán lỗi', CANCELLED: 'Đã hủy',
};
const nextStatuses: Record<string, string> = { PAID: 'PREPARING', PREPARING: 'READY', READY: 'COMPLETED' };

type AdminOrder = {
  id: string; status: string; subtotal: number; discountAmount: number; promoCode: string | null; total: number;
  createdAt: string; customerName: string; customerEmail: string;
  items: Array<{ name: string; quantity: number; size: string; toppings: string[]; lineTotal: number }>;
};
type Promotion = {
  id: number; code: string; discountType: 'PERCENT' | 'FIXED'; discountValue: number;
  minOrderAmount: number; maxDiscount: number | null; active: boolean; startsAt: string | null; endsAt: string | null;
};

async function apiRequest<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(Array.isArray(result.message) ? result.message.join(', ') : result.message || 'Không thể tải dữ liệu');
  return result as T;
}

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'promotions'>('orders');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [promoForm, setPromoForm] = useState({ code: '', discountType: 'PERCENT', discountValue: '10', minOrderAmount: '0', maxDiscount: '' });

  const loadData = useCallback(async (credential: string, quiet = false) => {
    if (!quiet) setLoading(true);
    setError('');
    try {
      const [orderList, promoList] = await Promise.all([
        apiRequest<AdminOrder[]>(credential, '/admin/orders'),
        apiRequest<Promotion[]>(credential, '/admin/promotions'),
      ]);
      setOrders(orderList);
      setPromotions(promoList);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải trang quản trị');
    } finally { if (!quiet) setLoading(false); }
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('brewlite-token') || '';
    const savedRole = localStorage.getItem('brewlite-role') || '';
    setToken(savedToken);
    setRole(savedRole);
  }, []);

  useEffect(() => {
    if (token && ['STAFF', 'MANAGER'].includes(role)) void loadData(token);
  }, [token, role, loadData]);

  const visibleOrders = useMemo(() => orders.filter((order) => {
    if (statusFilter === 'ACTIVE') return ['PAID', 'PREPARING', 'READY'].includes(order.status);
    if (statusFilter === 'ALL') return true;
    return order.status === statusFilter;
  }), [orders, statusFilter]);

  const signIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSubmitting(true); setError('');
    try {
      const result = await apiRequest<{ accessToken: string; user: { role: string } }>('', '/auth/login', {
        method: 'POST', body: JSON.stringify({ email, password }),
      });
      if (!['STAFF', 'MANAGER'].includes(result.user.role)) throw new Error('Tài khoản này không có quyền quản trị.');
      localStorage.setItem('brewlite-token', result.accessToken);
      localStorage.setItem('brewlite-role', result.user.role);
      setToken(result.accessToken); setRole(result.user.role); setPassword('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không đăng nhập được'); }
    finally { setSubmitting(false); }
  };

  const updateOrderStatus = async (order: AdminOrder, status: string) => {
    setSubmitting(true); setError(''); setNotice('');
    try {
      await apiRequest(token, `/orders/${order.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setNotice(`Đơn #${order.id.slice(0, 8)} → ${statusLabels[status]}`);
      await loadData(token, true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không cập nhật được đơn hàng'); }
    finally { setSubmitting(false); }
  };

  const createPromotion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSubmitting(true); setError(''); setNotice('');
    try {
      const created = await apiRequest<Promotion>(token, '/admin/promotions', {
        method: 'POST', body: JSON.stringify({
          code: promoForm.code.trim().toUpperCase(), discountType: promoForm.discountType,
          discountValue: Number(promoForm.discountValue), minOrderAmount: Number(promoForm.minOrderAmount),
          maxDiscount: promoForm.maxDiscount ? Number(promoForm.maxDiscount) : undefined,
        }),
      });
      setPromoForm({ code: '', discountType: 'PERCENT', discountValue: '10', minOrderAmount: '0', maxDiscount: '' });
      setNotice(`Đã tạo mã ${created.code}`);
      await loadData(token, true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không tạo được mã'); }
    finally { setSubmitting(false); }
  };

  const togglePromotion = async (promotion: Promotion) => {
    setSubmitting(true); setError(''); setNotice('');
    try {
      await apiRequest(token, `/admin/promotions/${promotion.id}`, {
        method: 'PATCH', body: JSON.stringify({ active: !promotion.active }),
      });
      setNotice(`${promotion.code}: ${promotion.active ? 'đã tắt' : 'đã bật'}`);
      await loadData(token, true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không cập nhật được mã'); }
    finally { setSubmitting(false); }
  };

  const logout = () => {
    localStorage.removeItem('brewlite-token'); localStorage.removeItem('brewlite-role');
    setToken(''); setRole(''); setOrders([]); setPromotions([]); setError('');
  };

  if (!token || !['STAFF', 'MANAGER'].includes(role)) return <main className="grid min-h-screen place-items-center bg-ink px-5 text-cream">
    <section className="surface-card w-full max-w-md p-7">
      <a className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent" href="/">← BrewLite</a>
      <h1 className="mt-4 font-rund text-3xl font-bold">Đăng nhập quản trị</h1>
      <p className="mt-2 text-sm text-muted">Dùng tài khoản quản lý được cấu hình cho cơ sở dữ liệu.</p>
      <form className="mt-6 grid gap-4" onSubmit={signIn}>
        <label className="grid gap-2 text-xs text-cream/60">Email
          <input className="field text-sm text-cream" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="grid gap-2 text-xs text-cream/60">Mật khẩu
          <input className="field text-sm text-cream" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error && <p className="text-sm text-accent-soft" role="alert">{error}</p>}
        <button className="btn btn-primary w-full" disabled={submitting}>{submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
      </form>
    </section>
  </main>;

  return <main className="min-h-screen bg-ink px-4 py-6 text-cream md:px-8 md:py-10">
    <div className="mx-auto max-w-7xl">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <a className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent" href="/">BrewLite · về cửa hàng</a>
          <h1 className="mt-2 font-rund text-3xl font-bold tracking-tight md:text-4xl">Quản trị cửa hàng</h1>
          <p className="mt-1 text-sm text-muted">Theo dõi đơn và quản lý mã khuyến mãi trong PostgreSQL.</p>
        </div>
        <button className="btn btn-secondary" onClick={logout}>Đăng xuất</button>
      </header>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 rounded-full bg-surface-2 p-1 shadow-edge">
          <button className={cn('rounded-full px-4 py-2 text-sm', activeTab === 'orders' ? 'bg-cream text-ink' : 'text-muted')} onClick={() => setActiveTab('orders')}>Đơn hàng</button>
          <button className={cn('rounded-full px-4 py-2 text-sm', activeTab === 'promotions' ? 'bg-cream text-ink' : 'text-muted')} onClick={() => setActiveTab('promotions')}>Khuyến mãi</button>
        </div>
        <button className="btn btn-secondary text-xs" disabled={loading} onClick={() => void loadData(token)}>{loading ? 'Đang tải…' : 'Làm mới dữ liệu'}</button>
      </div>

      {error && <p className="mb-4 rounded-2xl bg-accent/10 px-4 py-3 text-sm text-accent-soft" role="alert">{error}</p>}
      {notice && <p className="mb-4 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success" role="status">{notice}</p>}

      {activeTab === 'orders' ? <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-rund text-2xl font-semibold">Đơn hàng</h2><p className="mt-1 text-xs text-muted">Tối đa 200 đơn mới nhất · cập nhật trạng thái theo luồng phục vụ.</p></div>
          <select className="field w-auto text-sm text-cream" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Lọc đơn hàng">
            <option value="ACTIVE">Cần xử lý · pha/chờ nhận</option><option value="ALL">Tất cả đơn</option>
            {Object.entries(statusLabels).map(([status, label]) => <option value={status} key={status}>{label}</option>)}
          </select>
        </div>
        {visibleOrders.length === 0
          ? <div className="surface-card px-5 py-12 text-center text-sm text-muted">Không có đơn nào trong nhóm này.</div>
          : <div className="grid gap-3">{visibleOrders.map((order) => <article className="surface-card grid gap-4 p-4 md:grid-cols-[1fr_auto] md:p-5" key={order.id}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-mono text-sm font-semibold">#{order.id.slice(0, 8)}</h3>
                <span className="rounded-full bg-white/[0.06] px-3 py-1 font-mono text-[9px] uppercase tracking-wider text-accent">{statusLabels[order.status] || order.status}</span>
              </div>
              <p className="mt-2 text-sm text-cream">{order.customerName} <span className="text-muted">· {order.customerEmail}</span></p>
              <p className="mt-1 font-mono text-[10px] text-cream/40">{new Date(order.createdAt).toLocaleString('vi-VN')}</p>
              <ul className="mt-3 grid gap-1 text-xs text-muted">{order.items.map((item, index) => <li key={`${item.name}-${index}`}>
                {item.quantity} × {item.name} · {item.size}{item.toppings?.length ? ` · ${item.toppings.join(', ')}` : ''} <span className="font-mono text-cream/50">{money(Number(item.lineTotal))}</span>
              </li>)}</ul>
              {order.promoCode && <p className="mt-2 text-xs text-success">Mã {order.promoCode} giảm {money(Number(order.discountAmount))}</p>}
            </div>
            <div className="flex flex-row items-center justify-between gap-3 border-t border-white/10 pt-3 md:flex-col md:items-end md:border-0 md:pt-0">
              <strong className="font-rund text-xl">{money(Number(order.total))}</strong>
              {nextStatuses[order.status] && <button className="btn btn-primary text-xs" disabled={submitting} onClick={() => void updateOrderStatus(order, nextStatuses[order.status])}>
                {order.status === 'PAID' ? 'Bắt đầu pha' : order.status === 'PREPARING' ? 'Đánh dấu đã pha' : 'Đánh dấu đã giao'}
              </button>}
              {['PENDING', 'PAID', 'PAYMENT_FAILED'].includes(order.status) && <button className="text-xs text-cream/40 underline underline-offset-4 hover:text-accent-soft" disabled={submitting} onClick={() => void updateOrderStatus(order, 'CANCELLED')}>Hủy đơn</button>}
            </div>
          </article>)}</div>}
      </section> : <section className="grid items-start gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <form className="surface-card grid gap-4 p-5" onSubmit={createPromotion}>
          <div><h2 className="font-rund text-2xl font-semibold">Tạo mã khuyến mãi</h2><p className="mt-1 text-xs text-muted">Mã được kiểm tra lại với PostgreSQL khi tạo đơn.</p></div>
          <label className="grid gap-2 text-xs text-cream/60">Mã
            <input className="field font-mono uppercase text-cream" required minLength={3} maxLength={40} pattern="[A-Za-z0-9][A-Za-z0-9_-]{2,39}" value={promoForm.code} onChange={(event) => setPromoForm({ ...promoForm, code: event.target.value })} placeholder="SUMMER10" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-2 text-xs text-cream/60">Loại giảm
              <select className="field text-sm text-cream" value={promoForm.discountType} onChange={(event) => setPromoForm({ ...promoForm, discountType: event.target.value })}>
                <option value="PERCENT">Phần trăm</option><option value="FIXED">Số tiền</option>
              </select>
            </label>
            <label className="grid gap-2 text-xs text-cream/60">Giá trị
              <input className="field text-sm text-cream" type="number" min="1" max={promoForm.discountType === 'PERCENT' ? 100 : 100000000} required value={promoForm.discountValue} onChange={(event) => setPromoForm({ ...promoForm, discountValue: event.target.value })} />
            </label>
          </div>
          <label className="grid gap-2 text-xs text-cream/60">Đơn tối thiểu (đ)
            <input className="field text-sm text-cream" type="number" min="0" value={promoForm.minOrderAmount} onChange={(event) => setPromoForm({ ...promoForm, minOrderAmount: event.target.value })} />
          </label>
          <label className="grid gap-2 text-xs text-cream/60">Giảm tối đa (đ, tùy chọn)
            <input className="field text-sm text-cream" type="number" min="1" value={promoForm.maxDiscount} onChange={(event) => setPromoForm({ ...promoForm, maxDiscount: event.target.value })} placeholder="Không giới hạn" />
          </label>
          <button className="btn btn-primary w-full" disabled={submitting}>{submitting ? 'Đang lưu…' : 'Tạo mã'}</button>
        </form>

        <div className="grid gap-3">
          <div><h2 className="font-rund text-2xl font-semibold">Mã đang lưu</h2><p className="mt-1 text-xs text-muted">Bật/tắt mã áp dụng ngay cho lượt checkout tiếp theo.</p></div>
          {promotions.length === 0 ? <div className="surface-card px-5 py-10 text-center text-sm text-muted">Chưa có mã khuyến mãi.</div> : promotions.map((promotion) => <article className="surface-card flex flex-wrap items-center justify-between gap-4 p-4" key={promotion.id}>
            <div>
              <div className="flex items-center gap-2"><strong className="font-mono text-sm tracking-wider">{promotion.code}</strong><span className={cn('rounded-full px-2 py-1 font-mono text-[9px] uppercase', promotion.active ? 'bg-success/10 text-success' : 'bg-white/5 text-muted')}>{promotion.active ? 'Đang bật' : 'Đang tắt'}</span></div>
              <p className="mt-1 text-xs text-muted">{promotion.discountType === 'PERCENT' ? `${promotion.discountValue}%` : money(promotion.discountValue)} giảm · tối thiểu {money(Number(promotion.minOrderAmount))}{promotion.maxDiscount ? ` · tối đa ${money(Number(promotion.maxDiscount))}` : ''}</p>
              {(promotion.startsAt || promotion.endsAt) && <p className="mt-1 text-[10px] text-cream/35">{promotion.startsAt ? new Date(promotion.startsAt).toLocaleDateString('vi-VN') : 'Không giới hạn'} – {promotion.endsAt ? new Date(promotion.endsAt).toLocaleDateString('vi-VN') : 'Không giới hạn'}</p>}
            </div>
            <button className="btn btn-secondary text-xs" disabled={submitting} onClick={() => void togglePromotion(promotion)}>{promotion.active ? 'Tắt mã' : 'Bật mã'}</button>
          </article>)}
        </div>
      </section>}
    </div>
  </main>;
}
