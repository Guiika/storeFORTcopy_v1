import React from 'react';
import { ReactComponent as LikeIcon } from '../../assets/vector/like.svg';
import styles from './ProductCard.module.css';

const resolveImageUrl = (main_image) => {
  if (!main_image) return null;
  if (typeof main_image === 'string') return main_image;
  return main_image.image_url || null;
};

const formatPrice = (price) =>
  price != null ? `${Number(price).toLocaleString('ru-RU')} ₽` : '—';

const ProductCard = ({ product, onClick, inWishlist, onWishlistToggle }) => {
  const imageUrl = resolveImageUrl(product.main_image);

  return (
    <button type="button" className={styles.card} onClick={onClick}>
      <div className={styles.media}>
        {imageUrl && <img src={imageUrl} alt={product.name} className={styles.image} />}

        {onWishlistToggle && (
          <div className={styles.iconWrap}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={(e) => { e.stopPropagation(); onWishlistToggle(); }}
              aria-label={inWishlist ? 'Удалить из избранного' : 'Добавить в избранное'}
            >
              <LikeIcon
                fill={inWishlist ? 'rgba(123, 98, 198, 0.3)' : 'none'}
                stroke="rgba(123, 98, 198, 0.3)"
                strokeWidth="1.5"
                className={styles.heartIcon}
              />
            </button>
          </div>
        )}

        <div className={styles.overlay}>
          <p className={styles.name}>{product.name}</p>
          <p className={styles.brand}>{product.brand || 'Бренд'}</p>
          <p className={styles.price}>{formatPrice(product.price)}</p>
        </div>
      </div>
    </button>
  );
};

export default ProductCard;
