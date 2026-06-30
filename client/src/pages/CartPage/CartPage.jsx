import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../store/AuthContext';
import { useCart } from '../../store/CartContext';
import downIcon from '../../assets/vector/down.svg';
import errorIcon from '../../assets/vector/error.svg';
import styles from './CartPage.module.css';

const formatPrice = (value) =>
  Number(value).toLocaleString('ru-RU') + ' ₽';

const CartPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, loading, updateQuantity, removeFromCart } = useCart();

  const [localItems, setLocalItems] = useState([]);
  const [removingIds, setRemovingIds] = useState(new Set());
  const [errorMsg, setErrorMsg] = useState('');
  const removeTimers = useRef({});

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 3000);
  };

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  // sync local state from context when cart loads
  useEffect(() => {
    setLocalItems(
      cartItems.map((item) => ({ ...item, localQty: item.quantity }))
    );
  }, [cartItems]);

  if (!user) return null;

  const itemKey = (item) => `${item.product_id}__${item.size || ''}`;

  const handleDecrease = (item) => {
    const key = itemKey(item);
    const newQty = item.localQty - 1;

    setLocalItems((prev) =>
      prev.map((i) => itemKey(i) === key ? { ...i, localQty: newQty } : i)
    );

    if (newQty <= 0) {
      const timer = setTimeout(async () => {
        setRemovingIds((prev) => new Set(prev).add(key));
        try {
          await removeFromCart(item.product_id, item.size);
        } catch {
          showError('Не удалось удалить товар');
          setLocalItems((prev) =>
            prev.map((i) => itemKey(i) === key ? { ...i, localQty: 1 } : i)
          );
        } finally {
          setRemovingIds((prev) => { const s = new Set(prev); s.delete(key); return s; });
        }
      }, 2000);
      removeTimers.current[key] = timer;
    } else {
      clearTimeout(removeTimers.current[key]);
      delete removeTimers.current[key];
      updateQuantity(item.product_id, newQty, item.size).catch(() => showError('Ошибка обновления количества'));
    }
  };

  const handleIncrease = (item) => {
    const key = itemKey(item);
    const newQty = item.localQty + 1;

    clearTimeout(removeTimers.current[key]);
    delete removeTimers.current[key];

    setLocalItems((prev) =>
      prev.map((i) => itemKey(i) === key ? { ...i, localQty: newQty } : i)
    );
    updateQuantity(item.product_id, newQty, item.size).catch(() => showError('Ошибка обновления количества'));
  };

  const visibleItems = localItems.filter((i) => !removingIds.has(itemKey(i)));
  const isEmpty = visibleItems.length === 0 && !loading;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <p className={styles.title}>Корзина</p>

        <div className={styles.mainContent}>
          {loading ? (
            <p className={styles.loadingText}>Загрузка...</p>
          ) : isEmpty ? (
            <div className={styles.emptyBlock}>
              <p className={styles.emptyText}>Ваша корзина пуста</p>
              <button
                type="button"
                className={styles.catalogBtn}
                onClick={() => navigate('/catalog')}
              >
                Перейти в каталог
              </button>
            </div>
          ) : (
            <>
              <div className={styles.list}>
                {visibleItems.map((item) => {
                  const imageUrl = typeof item.main_image === 'string'
                    ? item.main_image
                    : item.main_image?.image_url ?? null;
                  const total = item.price * item.localQty;

                  return (
                    <div key={itemKey(item)} className={styles.row}>
                      <div className={styles.infoCol}>
                        <div className={styles.details}>
                          <p className={styles.text}>{item.name}</p>
                          <p className={styles.text}>{item.brand}</p>
                          {item.size && <p className={styles.textMuted}>{item.size}</p>}
                          {item.color && <p className={styles.textMuted}>{item.color}</p>}
                        </div>

                        <div className={styles.bottom}>
                          <div className={styles.counter}>
                            <button
                              type="button"
                              className={styles.arrowBtn}
                              onClick={() => handleDecrease(item)}
                            >
                              <img src={downIcon} alt="Уменьшить" className={styles.arrowLeft} />
                            </button>
                            <span className={styles.text}>{item.localQty}</span>
                            <button
                              type="button"
                              className={styles.arrowBtn}
                              onClick={() => handleIncrease(item)}
                            >
                              <img src={downIcon} alt="Увеличить" className={styles.arrowRight} />
                            </button>
                          </div>
                          <p className={styles.text}>{formatPrice(total)}</p>
                        </div>
                      </div>

                      <div className={styles.imageWrap}>
                        {imageUrl
                          ? <img src={imageUrl} alt={item.name} className={styles.image} />
                          : <div className={styles.imagePlaceholder} />
                        }
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.checkoutWrap}>
                <button
                  type="button"
                  className={styles.checkoutBtn}
                  onClick={() => navigate('/checkout')}
                >
                  Перейти к оформлению
                </button>
              </div>
            </>
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

export default CartPage;
