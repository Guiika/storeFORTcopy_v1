import React, { useEffect, useRef, useState } from 'react';
import { orderService } from '../../services/orderService';
import downIcon from '../../assets/vector/down.svg';
import errorIcon from '../../assets/vector/error.svg';
import styles from './OrdersSection.module.css';

const formatPrice = (v) =>
  v != null ? `${Number(v).toLocaleString('ru-RU')} ₽` : '—';

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
};

const formatAddress = (addr) => {
  if (!addr) return null;
  const a = typeof addr === 'string' ? JSON.parse(addr) : addr;
  return [a.city, a.street, a.house, a.apartment, a.zip].filter(Boolean).join(', ');
};

const STATUS_COLOR = {
  'новый':       'rgba(123, 98, 198, 0.7)',
  'в обработке': 'rgba(0, 0, 0, 0.7)',
  'отправлен':   '#000000',
  'доставлен':   '#000000',
  'отменён':     'rgba(0, 0, 0, 0.5)',
};

const FILTER_OPTIONS = [
  { key: '',            label: 'Все заказы'  },
  { key: 'новый',       label: 'Новый'       },
  { key: 'в обработке', label: 'В обработке' },
  { key: 'отправлен',   label: 'Отправлен'   },
  { key: 'доставлен',   label: 'Доставлен'   },
  { key: 'отменён',     label: 'Отменён'     },
];

const ALL_STATUSES = ['новый', 'в обработке', 'отправлен', 'доставлен', 'отменён'];

/* ── Per-order status dropdown ── */
const StatusDropdown = ({ orderId, current, onChanged, showError }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleSelect = async (status) => {
    setOpen(false);
    if (status === current) return;
    try {
      await orderService.updateStatus(orderId, status);
      onChanged(orderId, status);
    } catch {
      showError('Не удалось обновить статус');
    }
  };

  return (
    <div className={styles.statusDropWrap} ref={ref}>
      <button type="button" className={styles.statusDropBtn} onClick={() => setOpen((v) => !v)}>
        <span className={styles.buttonText}>{current}</span>
        <img src={downIcon} alt="" className={styles.dropIcon} />
      </button>
      {open && (
        <div className={styles.statusDropList}>
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={`${styles.statusDropOption} ${s === current ? styles.statusDropOptionActive : ''}`}
              onClick={() => handleSelect(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Main section ── */
const OrdersSection = () => {
  const [orders, setOrders]     = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOpen, setFilterOpen]     = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const filterRef = useRef(null);

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 3000);
  };

  useEffect(() => {
    const h = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    setLoading(true);
    orderService.getAllOrders(filterStatus)
      .then((res) => {
        const list = res.data.orders || [];
        setOrders(list);
        setTotal(list.length);
      })
      .catch(() => showError('Не удалось загрузить заказы'))
      .finally(() => setLoading(false));
  }, [filterStatus]);

  const handleStatusChanged = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o)
    );
  };

  const activeFilter = FILTER_OPTIONS.find((o) => o.key === filterStatus);

  return (
    <div>
      {/* Total */}
      <p className={styles.totalText}>Всего: {loading ? '...' : total}</p>

      {/* Filter */}
      <div className={styles.filterWrap} ref={filterRef} style={{ marginTop: 30 }}>
        <button type="button" className={styles.filterBtn} onClick={() => setFilterOpen((v) => !v)}>
          <span className={styles.buttonText}>{activeFilter.label}</span>
          <img src={downIcon} alt="" className={styles.dropIcon} />
        </button>
        {filterOpen && (
          <div className={styles.filterDropList}>
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={styles.filterOption}
                onClick={() => { setFilterStatus(opt.key); setFilterOpen(false); }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Orders list */}
      {loading ? (
        <p className={styles.loadingText} style={{ marginTop: 70 }}>Загрузка...</p>
      ) : orders.length === 0 ? (
        <p className={styles.emptyText} style={{ marginTop: 70 }}>Пока нет заказов</p>
      ) : (
        <div className={styles.list} style={{ marginTop: 70 }}>
          {orders.map((order) => {
            const firstItem = order.items?.[0];
            const imageUrl  = firstItem?.image_url ?? null;
            const statusColor = STATUS_COLOR[order.status?.toLowerCase()] ?? 'rgba(0,0,0,0.7)';
            const address = (() => { try { return formatAddress(order.delivery_address); } catch { return null; } })();

            return (
              <div key={order.id} className={styles.row}>
                {/* Left info */}
                <div className={styles.info}>
                  <p className={styles.status} style={{ color: statusColor }}>
                    {order.status}
                  </p>

                  <p className={styles.text}>{formatDate(order.created_at)}</p>

                  <p className={styles.orderNum}>
                    <span className={styles.textMuted}>Номер заказа:&nbsp;</span>
                    <span className={styles.textMuted}>{order.id}</span>
                  </p>

                  <div className={styles.customerBlock}>
                    {(order.first_name || order.last_name) && (
                      <p className={styles.textDim}>
                        {[order.last_name, order.first_name].filter(Boolean).join(' ')}
                      </p>
                    )}
                    {order.email && <p className={styles.textMuted}>{order.email}</p>}
                    {order.phone && <p className={styles.textMuted}>{order.phone}</p>}
                    {address     && <p className={styles.textMuted}>{address}</p>}
                  </div>

                  <p className={styles.text}>{formatPrice(order.total_price)}</p>

                  <StatusDropdown
                    orderId={order.id}
                    current={order.status}
                    onChanged={handleStatusChanged}
                    showError={showError}
                  />
                </div>

                {/* Right image */}
                <div className={styles.imageWrap}>
                  {imageUrl
                    ? <img src={imageUrl} alt={firstItem?.name} className={styles.image} />
                    : <div className={styles.imagePlaceholder} />
                  }
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Toast */}
      {errorMsg && (
        <div className={styles.errorToast}>
          <img src={errorIcon} alt="" className={styles.errorIcon} />
          <p className={styles.errorLine}>{errorMsg}</p>
        </div>
      )}
    </div>
  );
};

export default OrdersSection;
