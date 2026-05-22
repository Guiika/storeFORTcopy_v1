import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../store/AuthContext';
import { orderService } from '../../services/orderService';
import errorIcon from '../../assets/vector/error.svg';
import accountStyles from './AccountPage.module.css';
import styles from './OrdersPage.module.css';

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
};

const STATUS_COLOR = {
  'новый':       'rgba(0, 0, 0, 0.7)',
  'в обработке': 'rgba(0, 0, 0, 0.7)',
  'отправлен':   '#000000',
  'доставлен':   '#000000',
  'отменён':     'rgba(0, 0, 0, 0.5)',
};

const OrdersPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 3000);
  };

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    orderService.getMyOrders()
      .then((res) => setOrders(res.data.orders || []))
      .catch(() => showError('Не удалось загрузить заказы'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={accountStyles.page}>
      <div className={accountStyles.inner}>

        {/* Column 1 — nav */}
        <nav className={accountStyles.nav}>
          <button type="button" className={accountStyles.navItem} onClick={() => navigate('/account')}>
            Данные аккаунта
          </button>
          <button type="button" className={`${accountStyles.navItem} ${accountStyles.navItemActive}`}>
            Мои заказы
          </button>
          <button type="button" className={accountStyles.navItem} onClick={handleLogout}>
            Выйти
          </button>
        </nav>

        {/* Column 2 — orders */}
        <div className={styles.content}>
          {loading ? (
            <p className={styles.loadingText}>Загрузка...</p>
          ) : orders.length === 0 ? (
            <p className={styles.empty}>У вас пока нет заказов</p>
          ) : (
            <div className={styles.list}>
              {orders.map((order) => {
                const firstItem = order.items?.[0];
                const imageUrl  = firstItem?.image_url ?? null;
                const statusColor = STATUS_COLOR[order.status?.toLowerCase()] ?? 'rgba(0,0,0,0.7)';

                return (
                  <div key={order.id} className={styles.row}>
                    <div className={styles.info}>
                      <p className={styles.status} style={{ color: statusColor }}>
                        {order.status}
                      </p>
                      <p className={styles.text}>{formatDate(order.created_at)}</p>
                      <p className={styles.orderNum}>
                        <span className={styles.textMuted}>Номер заказа:&nbsp;</span>
                        <span className={styles.textMuted}>{order.id}</span>
                      </p>
                    </div>

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
        </div>

      </div>

      <Footer />

      {errorMsg && (
        <div className={styles.errorToast}>
          <img src={errorIcon} alt="" className={styles.errorIcon} />
          <p className={styles.errorLine}>{errorMsg}</p>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
