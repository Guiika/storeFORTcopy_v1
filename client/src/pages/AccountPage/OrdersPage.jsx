import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../store/AuthContext';
import styles from './AccountPage.module.css';
import ordersStyles from './OrdersPage.module.css';

const OrdersPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <nav className={styles.nav}>
          <button type="button" className={styles.navItem} onClick={() => navigate('/account')}>
            Данные аккаунта
          </button>
          <button type="button" className={`${styles.navItem} ${styles.navItemActive}`}>
            Мои заказы
          </button>
          <button type="button" className={styles.navItem} onClick={handleLogout}>
            Выйти
          </button>
        </nav>

        <div>
          <p className={ordersStyles.empty}>Пока нет заказов</p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default OrdersPage;
