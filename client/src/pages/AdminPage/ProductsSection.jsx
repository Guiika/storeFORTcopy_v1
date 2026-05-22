import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsService } from '../../services/productsService';
import { adminService } from '../../services/adminService';
import editIcon from '../../assets/vector/Edit.svg';
import addIcon from '../../assets/vector/add.svg';
import downIcon from '../../assets/vector/down.svg';
import errorIcon from '../../assets/vector/error.svg';
import styles from './ProductsSection.module.css';

const formatPrice = (price) =>
  price != null ? `${Number(price).toLocaleString('ru-RU')} ₽` : '—';

const STATUS_OPTIONS = [
  { key: 'all',      label: 'Все товары' },
  { key: 'active',   label: 'Активные'   },
  { key: 'inactive', label: 'Неактивные' },
];

/* ── Card ── */
const AdminProductCard = ({ product, statusFilter, onToggleActive }) => {
  const navigate = useNavigate();
  const editPath = `/admin/products/${product.id}/edit`;
  const isActive = product.is_active === 1 || product.is_active === true;

  return (
    <button
      type="button"
      className={styles.card}
      style={!isActive && statusFilter === 'all' ? { opacity: 0.5 } : undefined}
      onClick={() => navigate(editPath)}
    >
      <div className={styles.cardImage}>
        {product.main_image?.image_url && (
          <img src={product.main_image.image_url} alt={product.name} />
        )}
        <div className={styles.cardActions}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={(e) => { e.stopPropagation(); navigate(editPath); }}
          >
            <img src={editIcon} alt="Редактировать" className={styles.actionIcon} />
          </button>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={(e) => { e.stopPropagation(); onToggleActive(product); }}
          >
            {isActive
              ? <span className={styles.deactivateIcon}>—</span>
              : <img src={addIcon} alt="Активировать" className={styles.actionIcon} />
            }
          </button>
        </div>
      </div>
      <div className={styles.cardMeta}>
        <p>{product.name}</p>
        <p>{product.brand || '—'}</p>
        <p>{formatPrice(product.price)}</p>
      </div>
    </button>
  );
};

/* ── Section ── */
const ProductsSection = () => {
  const navigate = useNavigate();

  const [products, setProducts]     = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  /* filter */
  const [statusFilter, setStatusFilter] = useState('all');
  const [filterOpen, setFilterOpen]     = useState(false);
  const filterRef = useRef(null);

  /* search */
  const [searchText, setSearchText]         = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  /* bulk price */
  const [pricePercent, setPricePercent]   = useState('');
  const [priceUpdating, setPriceUpdating] = useState(false);

  /* toast */
  const [toast, setToast] = useState(null);
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  /* close filter on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* debounce search */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText), 400);
    return () => clearTimeout(t);
  }, [searchText]);

  /* fetch products */
  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = { limit: 100, status: statusFilter };
    if (debouncedSearch) params.search = debouncedSearch;

    productsService.getAdminProducts(params)
      .then((res) => {
        if (!active) return;
        setProducts(res.data.products || []);
        setTotal(res.data.pagination?.total ?? res.data.products?.length ?? 0);
      })
      .catch(() => { if (active) setProducts([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [debouncedSearch, statusFilter, refreshKey]);

  /* toggle active */
  const handleToggleActive = async (product) => {
    const isActive = product.is_active === 1 || product.is_active === true;
    const newValue = isActive ? 0 : 1;
    try {
      await productsService.updateProduct(product.id, { is_active: newValue });
      if (statusFilter === 'all') {
        setProducts((prev) =>
          prev.map((p) => p.id === product.id ? { ...p, is_active: newValue } : p)
        );
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        setTotal((t) => t - 1);
      }
    } catch {
      showToast('error', 'Ошибка обновления статуса');
    }
  };

  /* bulk price update */
  const handleBulkPriceUpdate = async () => {
    const pct = parseFloat(pricePercent);
    if (!pricePercent.trim() || isNaN(pct)) {
      showToast('error', 'Введите корректное число');
      return;
    }
    const sign = pct >= 0 ? `+${pct}` : `${pct}`;
    if (!window.confirm(`Изменить цены всех товаров на ${sign}%?`)) return;

    setPriceUpdating(true);
    try {
      const res = await productsService.getAdminProducts({ limit: 9999, status: 'all' });
      const all = res.data.products || [];
      const updated = all.map((p) => {
        const item = { id: p.id, price: Math.round(p.price * (1 + pct / 100) * 100) / 100 };
        if (p.old_price != null) item.old_price = Math.round(p.old_price * (1 + pct / 100) * 100) / 100;
        return item;
      });
      await adminService.bulkUpdatePrices(updated);
      showToast('success', 'Цены обновлены');
      setPricePercent('');
      setRefreshKey((k) => k + 1);
    } catch {
      showToast('error', 'Ошибка обновления цен');
    } finally {
      setPriceUpdating(false);
    }
  };

  const activeOption = STATUS_OPTIONS.find((o) => o.key === statusFilter);

  return (
    <div>
      <p className={styles.totalText}>Всего: {loading ? '...' : total}</p>

      {/* Control row: Create | Search | Filter */}
      <div className={styles.controlRow} style={{ marginTop: 70 }}>
        <button
          type="button"
          className={styles.createButton}
          onClick={() => navigate('/admin/products/create')}
        >
          Создать товар
        </button>

        <input
          className={styles.searchInput}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Поиск товаров..."
        />

        <div className={styles.filterWrap} ref={filterRef}>
          <button
            type="button"
            className={styles.filterBtn}
            onClick={() => setFilterOpen((v) => !v)}
          >
            <span className={styles.buttonText}>{activeOption.label}</span>
            <img src={downIcon} alt="" className={styles.filterIcon} />
          </button>
          {filterOpen && (
            <div className={styles.filterDropdown}>
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={styles.filterOption}
                  onClick={() => { setStatusFilter(opt.key); setFilterOpen(false); }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bulk price row */}
      <div className={styles.priceRow}>
        <span className={styles.priceLabel}>Обновить цены:</span>
        <input
          className={styles.priceInput}
          type="number"
          value={pricePercent}
          onChange={(e) => setPricePercent(e.target.value)}
          placeholder="%"
        />
        <button
          type="button"
          className={styles.priceApply}
          onClick={handleBulkPriceUpdate}
          disabled={priceUpdating}
        >
          Применить
        </button>
      </div>

      {/* Grid */}
      <div className={styles.grid} style={{ marginTop: 70 }}>
        {loading ? (
          <p className={styles.loadingText}>Загрузка...</p>
        ) : products.length === 0 ? (
          <p className={styles.emptyText}>Товары не найдены</p>
        ) : (
          products.map((p) => (
            <AdminProductCard
              key={p.id}
              product={p}
              statusFilter={statusFilter}
              onToggleActive={handleToggleActive}
            />
          ))
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={styles.toast}>
          {toast.type === 'error' && (
            <img src={errorIcon} alt="" className={styles.toastIcon} />
          )}
          <p className={styles.toastText}>{toast.msg}</p>
        </div>
      )}
    </div>
  );
};

export default ProductsSection;
