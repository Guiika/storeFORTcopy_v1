import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsService } from '../../services/productsService';
import editIcon from '../../assets/vector/Edit.svg';
import styles from './ProductsSection.module.css';

const formatPrice = (price) =>
  price != null ? `${Number(price).toLocaleString('ru-RU')} ₽` : '—';

const AdminProductCard = ({ product }) => {
  const navigate = useNavigate();
  const editPath = `/admin/products/${product.id}/edit`;

  return (
    <button
      type="button"
      className={styles.card}
      onClick={() => navigate(editPath)}
    >
      <div className={styles.cardImage}>
        {product.main_image?.image_url && (
          <img src={product.main_image.image_url} alt={product.name} />
        )}
        <button
          type="button"
          className={styles.editBtn}
          onClick={(e) => { e.stopPropagation(); navigate(editPath); }}
        >
          <img src={editIcon} alt="Редактировать" className={styles.editIcon} />
        </button>
      </div>
      <div className={styles.cardMeta}>
        <p>{product.name}</p>
        <p>{product.brand || '—'}</p>
        <p>{formatPrice(product.price)}</p>
      </div>
    </button>
  );
};

const ProductsSection = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    productsService.getProducts()
      .then((res) => {
        if (!active) return;
        setProducts(res.data.products || []);
        setTotal(res.data.pagination?.total ?? res.data.products?.length ?? 0);
      })
      .catch(() => { if (active) setProducts([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div>
      <p className={styles.totalText}>Всего: {loading ? '...' : total}</p>

      <button
        type="button"
        className={styles.createButton}
        style={{ marginTop: 70 }}
        onClick={() => navigate('/admin/products/create')}
      >
        Создать товар
      </button>

      <div className={styles.grid} style={{ marginTop: 70 }}>
        {loading
          ? <p className={styles.loadingText}>Загрузка...</p>
          : products.map((p) => <AdminProductCard key={p.id} product={p} />)
        }
      </div>
    </div>
  );
};

export default ProductsSection;
