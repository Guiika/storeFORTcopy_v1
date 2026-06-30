import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../store/AuthContext';
import { useCart } from '../../store/CartContext';
import { cartService } from '../../services/cartService';
import { orderService } from '../../services/orderService';
import downIcon from '../../assets/vector/down.svg';
import errorIcon from '../../assets/vector/error.svg';
import styles from './CheckoutPage.module.css';

const formatPrice = (value) =>
  Number(value).toLocaleString('ru-RU') + ' ₽';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, loading, updateQuantity, removeFromCart, clearCart } = useCart();

  const [localItems, setLocalItems] = useState([]);
  const [removingIds, setRemovingIds] = useState(new Set());
  const removeTimers = useRef({});

  const [promoCode, setPromoCode]           = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [appliedPromo, setAppliedPromo]     = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');

  const [city, setCity]           = useState('');
  const [street, setStreet]       = useState('');
  const [house, setHouse]         = useState('');
  const [apartment, setApartment] = useState('');
  const [zip, setZip]             = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg]     = useState('');

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 3000);
  };

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!loading && cartItems.length === 0) navigate('/cart');
  }, [user, loading, cartItems, navigate]);

  useEffect(() => {
    setLocalItems(cartItems.map((item) => ({ ...item, localQty: item.quantity })));
  }, [cartItems]);

  // Pre-fill user data
  useEffect(() => {
    if (!user) return;
    setFirstName(user.first_name || '');
    setLastName(user.last_name || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
  }, [user]);

  if (!user) return null;

  const itemKey = (item) => `${item.product_id}__${item.size || ''}`;

  /* ── Quantity handlers (same as CartPage) ── */
  const handleDecrease = (item) => {
    const key = itemKey(item);
    const newQty = item.localQty - 1;
    setLocalItems((prev) =>
      prev.map((i) => itemKey(i) === key ? { ...i, localQty: newQty } : i)
    );
    if (newQty <= 0) {
      const timer = setTimeout(async () => {
        setRemovingIds((prev) => new Set(prev).add(key));
        try { await removeFromCart(item.product_id, item.size); }
        catch { showError('Не удалось удалить товар'); }
        finally {
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

  /* ── Totals ── */
  const subtotal = visibleItems.reduce((sum, i) => sum + i.price * i.localQty, 0);
  const total = discountPercent > 0
    ? Math.round(subtotal * (1 - discountPercent / 100) * 100) / 100
    : subtotal;

  /* ── Promo ── */
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    try {
      const res = await cartService.applyPromoCode(promoCode.trim().toUpperCase());
      setDiscountPercent(res.data.discount_percent);
      setAppliedPromo(promoCode.trim().toUpperCase());
    } catch {
      showError('Недействительный промокод');
    }
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      showError('Заполните все данные заказа');
      return;
    }
    if (!city.trim() || !street.trim() || !house.trim() || !zip.trim()) {
      showError('Заполните все обязательные поля адреса доставки');
      return;
    }
    setSubmitting(true);
    try {
      const items = visibleItems.map((i) => ({
        product_id: i.product_id,
        name: i.name,
        brand: i.brand || null,
        size: i.size || null,
        color: i.color || null,
        quantity: i.localQty,
        price: i.price,
      }));
      await orderService.createOrder({
        items,
        total_price: total,
        promo_code: appliedPromo || null,
        discount_percent: discountPercent,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        delivery_address: {
          city: city.trim(),
          street: street.trim(),
          house: house.trim(),
          apartment: apartment.trim() || null,
          zip: zip.trim(),
        },
      });
      await clearCart();
      navigate('/', { state: { orderSuccess: true } });
    } catch {
      showError('Не удалось оформить заказ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Left label */}
        <p className={styles.label}>Корзина</p>

        {/* Main content */}
        <div className={styles.mainContent}>
          {loading ? (
            <p className={styles.loadingText}>Загрузка...</p>
          ) : (
            <>
              {/* Items list */}
              <div className={styles.list}>
                {visibleItems.map((item) => {
                  const imageUrl = typeof item.main_image === 'string'
                    ? item.main_image
                    : item.main_image?.image_url ?? null;
                  const itemTotal = item.price * item.localQty;

                  return (
                    <div key={itemKey(item)} className={styles.row}>
                      <div className={styles.infoCol}>
                        <div className={styles.details}>
                          <p className={styles.text}>{item.name}</p>
                          <p className={styles.text}>{item.brand}</p>
                          {item.size  && <p className={styles.textMuted}>Размер {item.size}</p>}
                          {item.color && <p className={styles.textMuted}>Цвет {item.color}</p>}
                        </div>

                        <div className={styles.bottom}>
                          <div className={styles.counter}>
                            <button type="button" className={styles.arrowBtn} onClick={() => handleDecrease(item)}>
                              <img src={downIcon} alt="Уменьшить" className={styles.arrowLeft} />
                            </button>
                            <span className={styles.text}>{item.localQty}</span>
                            <button type="button" className={styles.arrowBtn} onClick={() => handleIncrease(item)}>
                              <img src={downIcon} alt="Увеличить" className={styles.arrowRight} />
                            </button>
                          </div>
                          <p className={styles.text}>{formatPrice(itemTotal)}</p>
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

              {/* Promo + Total */}
              <div className={styles.promoBlock}>
                <div className={styles.promoRow}>
                  <input
                    className={styles.promoInput}
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Промокод"
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                  />
                  <button type="button" className={styles.promoBtn} onClick={handleApplyPromo}>
                    Применить
                  </button>
                </div>

                {discountPercent > 0 && (
                  <p className={styles.discountNote}>
                    Скидка {discountPercent}% применена
                  </p>
                )}

                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Итого к оплате:</span>
                  <span className={styles.totalValue}>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Order data */}
              <div className={styles.formBlock}>
                <div className={styles.formCols}>
                  {/* Column 1 — recipient */}
                  <div className={styles.col}>
                    <p className={styles.colTitle}>Данные получателя</p>
                    <div className={styles.fields}>
                      <input className={styles.field} placeholder="Фамилия" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                      <input className={styles.field} placeholder="Имя" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                      <input className={styles.field} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                      <input className={styles.field} placeholder="Номер телефона" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                  </div>

                  {/* Column 2 — delivery address */}
                  <div className={styles.col}>
                    <p className={styles.colTitle}>Адрес доставки</p>
                    <div className={styles.fields}>
                      <input className={styles.field} placeholder="Город" value={city} onChange={(e) => setCity(e.target.value)} />
                      <input className={styles.field} placeholder="Улица" value={street} onChange={(e) => setStreet(e.target.value)} />
                      <input className={styles.field} placeholder="Дом / корпус" value={house} onChange={(e) => setHouse(e.target.value)} />
                      <input className={styles.field} placeholder="Квартира" value={apartment} onChange={(e) => setApartment(e.target.value)} />
                      <input className={styles.field} placeholder="Индекс" value={zip} onChange={(e) => setZip(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className={styles.submitWrap}>
                <button
                  type="button"
                  className={styles.submitBtn}
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? 'Оформление...' : 'Перейти к оплате'}
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

export default CheckoutPage;
