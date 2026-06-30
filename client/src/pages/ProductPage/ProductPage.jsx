import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Footer from '../../components/layout/Footer';
import NewArrivalsSection from '../HomePage/sections/NewArrivalsSection';
import { useAuth } from '../../store/AuthContext';
import { useCart } from '../../store/CartContext';
import { useWishlist } from '../../store/WishlistContext';
import { productsService } from '../../services/productsService';
import { ReactComponent as LikeIcon } from '../../assets/vector/like.svg';
import errorIcon from '../../assets/vector/error.svg';
import styles from './ProductPage.module.css';

const FIXED_SIZES = ['XS', 'S', 'M', 'L', 'XL'];

const formatPrice = (price) =>
  price != null ? `${Number(price).toLocaleString('ru-RU')} ₽` : '';

const normalizeArrivals = (arr) =>
  arr.map((p) => ({
    ...p,
    main_image: typeof p.main_image === 'string'
      ? { image_url: p.main_image }
      : p.main_image,
  }));

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [activeImageUrl, setActiveImageUrl] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 3000);
  };

  useEffect(() => {
    setLoading(true);
    setSelectedSize(null);
    productsService.getProductById(id)
      .then((res) => {
        const p = res.data.product;
        setProduct(p);
        const imgs = p.images || [];
        setImages(imgs);
        const main = imgs.find((i) => i.is_main) || imgs[0];
        setActiveImageUrl(main?.image_url || null);
      })
      .catch(() => showError('Не удалось загрузить товар'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    productsService.getNewArrivals(5)
      .then((arr) => setNewArrivals(normalizeArrivals(arr)))
      .catch(() => {});
  }, []);

  const availableSizes = product?.size
    ? product.size.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
    : [];

  const inWishlist = user ? isInWishlist(Number(id)) : false;

  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return; }
    if (availableSizes.length > 0 && !selectedSize) {
      showError('Выберите размер');
      return;
    }
    try {
      await addToCart(product.id, 1, selectedSize || null);
    } catch {
      showError('Не удалось добавить в корзину');
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      if (inWishlist) await removeFromWishlist(product.id);
      else await addToWishlist(product.id);
    } catch {
      showError('Не удалось обновить избранное');
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.loadingText}>Загрузка...</p>
      </div>
    );
  }

  if (!product) return <div className={styles.page} />;

  return (
    <div className={styles.page}>
      {/* ── Product block ── */}
      <div className={styles.productBlock}>
        {/* Gallery */}
        <div className={styles.galleryCol}>
          {images.length > 1 && (
            <div className={styles.thumbnails}>
              {images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  className={`${styles.thumbBtn} ${activeImageUrl === img.image_url ? styles.thumbActive : ''}`}
                  onClick={() => setActiveImageUrl(img.image_url)}
                >
                  <img src={img.image_url} alt="" className={styles.thumb} />
                </button>
              ))}
            </div>
          )}
          <div className={styles.mainImageWrap}>
            {activeImageUrl
              ? <img src={activeImageUrl} alt={product.name} className={styles.mainImage} />
              : <div className={styles.mainImagePlaceholder} />
            }
          </div>
        </div>

        {/* Info */}
        <div className={styles.infoCol}>
          <p className={styles.brand}>{product.brand}</p>
          <p className={styles.title}>{product.name}</p>

          <p className={styles.price} style={{ marginTop: 30 }}>{formatPrice(product.price)}</p>

          <div style={{ marginTop: 30 }}>
            <p className={styles.sizesLabel}>Размеры</p>
            <div className={styles.sizes} style={{ marginTop: 5 }}>
              {FIXED_SIZES.map((size) => {
                const available = availableSizes.length === 0 || availableSizes.includes(size);
                const selected = selectedSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    disabled={!available}
                    className={`${styles.sizeBtn} ${!available ? styles.sizeBtnUnavailable : ''} ${selected ? styles.sizeBtnSelected : ''}`}
                    onClick={() => available && setSelectedSize(size)}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.addRow} style={{ marginTop: 30 }}>
            <button type="button" className={styles.addToCartBtn} onClick={handleAddToCart}>
              Добавить в корзину
            </button>
            <button type="button" className={styles.wishlistBtn} onClick={handleToggleWishlist}>
              <LikeIcon
                className={styles.likeIcon}
                fill={inWishlist ? 'rgba(123, 98, 198, 0.3)' : 'none'}
                stroke="rgba(123, 98, 198, 0.3)"
                strokeWidth="1.5"
              />
            </button>
          </div>

          {product.material && (
            <div style={{ marginTop: 30 }}>
              <p className={styles.detailLabel}>Состав:</p>
              <p className={styles.detailValue}>{product.material}</p>
            </div>
          )}

          {product.color && (
            <div style={{ marginTop: 30 }}>
              <p className={styles.detailLabel}>Цвет:</p>
              <p className={styles.detailValue}>{product.color}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── New arrivals ── */}
      {newArrivals.length > 0 && (
        <div className={styles.relatedSection}>
          <NewArrivalsSection
            products={newArrivals}
            onProductClick={(productId) => navigate(`/product/${productId}`)}
          />
        </div>
      )}

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

export default ProductPage;
