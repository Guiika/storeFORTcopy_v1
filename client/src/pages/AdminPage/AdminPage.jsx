import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import CategoriesSection from './CategoriesSection';
import ProductsSection from './ProductsSection';
import UsersSection from './UsersSection';
import OrdersSection from './OrdersSection';
import styles from './AdminPage.module.css';

const NAV_ITEMS = [
  { key: 'statistics', label: 'Статистика' },
  { key: 'categories', label: 'Все категории' },
  { key: 'products', label: 'Все товары' },
  { key: 'users', label: 'Все пользователи' },
  { key: 'orders', label: 'Все заказы' },
];

const formatPrice = (price) =>
  price != null ? `${Number(price).toLocaleString('ru-RU')} ₽` : '—';

const ProductCard = ({ product, onClick }) => (
  <button type="button" className={styles.card} onClick={onClick}>
    <div className={styles.cardImage}>
      {product.main_image && (
        <img src={product.main_image} alt={product.name} />
      )}
    </div>
    <div className={styles.cardMeta}>
      <p>{product.name}</p>
      <p>{product.brand || '—'}</p>
      <p>
        {product.price != null
          ? formatPrice(product.price)
          : `В наличии: ${product.stock_quantity} шт.`}
      </p>
    </div>
  </button>
);

const StatisticsSection = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    adminService
      .getDashboard()
      .then((res) => { if (active) setData(res.data); })
      .catch(() => { if (active) setData(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleExport = async () => {
    try {
      const res = await adminService.exportProducts();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'products-export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // silent fail
    }
  };

  const overview = data?.overview ?? {};
  const popularProducts = data?.popular_products ?? [];
  const lowStockProducts = data?.low_stock_products ?? [];

  const counts = [
    { label: 'категорий и подкатегорий', value: overview.total_categories != null ? overview.total_categories - 1 : '—' },
    { label: 'товаров', value: overview.total_products ?? '—' },
    { label: 'пользователей', value: overview.total_users ?? '—' },
    { label: 'заказов', value: overview.total_orders ?? '—' },
  ];

  if (loading) {
    return <p className={styles.loadingText}>Загрузка...</p>;
  }

  return (
    <div>
      {/* Подсчёт количества */}
      <p className={styles.sectionTitle}>Подсчёт количества:</p>
      <div className={styles.statsTable}>
        {counts.map((row) => (
          <div key={row.label} className={styles.statRow}>
            <span className={styles.statLabel}>{row.label}</span>
            <span className={styles.statValue}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Топ 5 товаров */}
      <p className={styles.sectionTitle} style={{ marginTop: 70 }}>Топ 5 товаров</p>
      <div className={styles.cardsGrid}>
        {popularProducts.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onClick={() => navigate(`/product/${p.id}`)}
          />
        ))}
      </div>

      {/* Товары скоро закончатся */}
      <p className={styles.sectionTitle} style={{ marginTop: 70 }}>
        Товары скоро закончатся:
      </p>
      <div className={styles.cardsGrid}>
        {lowStockProducts.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onClick={() => navigate(`/product/${p.id}`)}
          />
        ))}
      </div>

      {/* Экспорт */}
      <button
        type="button"
        className={styles.exportButton}
        style={{ marginTop: 70 }}
        onClick={handleExport}
      >
        Экспорт csv
      </button>
    </div>
  );
};

const AdminPage = () => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState(location.state?.section || 'statistics');

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`${styles.navItem} ${activeSection === item.key ? styles.navItemActive : ''}`}
              onClick={() => setActiveSection(item.key)}
            >
              {item.label}
            </button>
          ))}
        </aside>

        <main className={styles.content}>
          {activeSection === 'statistics' && <StatisticsSection />}
          {activeSection === 'categories' && <CategoriesSection />}
          {activeSection === 'products' && <ProductsSection />}
          {activeSection === 'users' && <UsersSection />}
          {activeSection === 'orders' && <OrdersSection />}
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
