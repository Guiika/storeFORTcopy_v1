import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../store/AuthContext';
import { useWishlist } from '../../store/WishlistContext';
import { ReactComponent as LikeIcon } from '../../assets/vector/like.svg';
import downIcon from '../../assets/vector/down.svg';
import errorIcon from '../../assets/vector/error.svg';
import styles from './FavoritesPage.module.css';

const SORT_OPTIONS = [
  { key: 'new', label: 'По новизне' },
  { key: 'popular', label: 'По популярности' },
  { key: 'price_asc', label: 'По возрастанию цены' },
  { key: 'price_desc', label: 'По убыванию цены' },
];

const toNumber = (v) => Number(String(v).replace(/[^\d.-]/g, '')) || 0;

const FavoritesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wishlistItems, removeFromWishlist } = useWishlist();

  const [sortBy, setSortBy] = useState('new');
  const [sortOpen, setSortOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 3000);
  };

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  const handleRemoveWishlist = async (e, productId) => {
    e.stopPropagation();
    try { await removeFromWishlist(productId); }
    catch { showError('Не удалось обновить избранное'); }
  };

  const sortedItems = useMemo(() => {
    const list = [...wishlistItems];
    if (sortBy === 'price_asc') list.sort((a, b) => toNumber(a.price) - toNumber(b.price));
    else if (sortBy === 'price_desc') list.sort((a, b) => toNumber(b.price) - toNumber(a.price));
    else if (sortBy === 'popular') list.sort((a, b) => (b.views || 0) - (a.views || 0));
    else list.sort((a, b) => toNumber(b.product_id) - toNumber(a.product_id));
    return list;
  }, [wishlistItems, sortBy]);

  const activeSort = SORT_OPTIONS.find((o) => o.key === sortBy) || SORT_OPTIONS[0];

  if (!user) return null;

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <p className={styles.title}>Избранное</p>

        <div className={styles.rightContent}>
        {wishlistItems.length === 0 ? (
          <p className={styles.emptyText}>Вы ещё ничего не добавили в избранное</p>
        ) : (
          <div className={styles.productsBlock}>
            {/* Sort row */}
            <div className={styles.sortRow}>
              <button
                type="button"
                className={styles.sortButton}
                onClick={() => setSortOpen((v) => !v)}
              >
                <span className={styles.buttonText}>{activeSort.label}</span>
                <img src={downIcon} alt="" className={styles.sortIcon} />
              </button>
              {sortOpen && (
                <div className={styles.sortDropdown}>
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      className={styles.sortOption}
                      onClick={() => { setSortBy(opt.key); setSortOpen(false); }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Grid */}
            <div className={styles.grid}>
              {sortedItems.map((item) => {
                const productId = item.product_id ?? item.id;
                const imageUrl = typeof item.main_image === 'string'
                  ? item.main_image
                  : item.main_image?.image_url ?? null;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.productCard}
                    onClick={() => navigate(`/product/${productId}`)}
                  >
                    <div className={styles.productImage}>
                      {imageUrl && <img src={imageUrl} alt={item.name} />}
                      <div className={styles.iconStack}>
                        <button
                          type="button"
                          className={styles.iconButton}
                          onClick={(e) => handleRemoveWishlist(e, productId)}
                        >
                          <LikeIcon
                            fill="rgba(123, 98, 198, 0.3)"
                            stroke="rgba(123, 98, 198, 0.3)"
                            className={styles.actionIcon}
                          />
                        </button>
                      </div>
                    </div>
                    <div className={styles.productMeta}>
                      <p>{item.name}</p>
                      <p>{item.brand}</p>
                      <p>{item.price} ₽</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        </div>
      </div>

      <div className={styles.footerWrap}>
        <Footer />
      </div>

      {errorMsg && (
        <div className={styles.errorToast}>
          <img src={errorIcon} alt="" className={styles.errorIcon} />
          <p className={styles.errorLine}>{errorMsg}</p>
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
