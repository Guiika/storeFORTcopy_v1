import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AdminPage.module.css';

const NAV_ITEMS = [
  { key: 'statistics', label: 'Статистика' },
  { key: 'categories', label: 'Все категории' },
  { key: 'products', label: 'Все товары' },
  { key: 'users', label: 'Все пользователи' },
  { key: 'orders', label: 'Все заказы' },
];

const AdminLayout = ({ activeSection, children }) => {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`${styles.navItem} ${activeSection === item.key ? styles.navItemActive : ''}`}
              onClick={() => navigate('/admin')}
            >
              {item.label}
            </button>
          ))}
        </aside>
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
