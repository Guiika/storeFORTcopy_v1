import React from 'react';
import styles from './ProductCard.module.css';

const resolveImageUrl = (main_image) => {
  if (!main_image) return null;
  if (typeof main_image === 'string') return main_image;
  return main_image.image_url || null;
};

const ProductCard = ({ product, onClick }) => {
  const imageUrl = resolveImageUrl(product.main_image);

  return (
    <button type="button" className={styles.card} onClick={onClick}>
      <div className={styles.media}>
        {imageUrl && <img src={imageUrl} alt={product.name} className={styles.image} />}
        <div className={styles.overlay}>
          <p className={styles.name}>{product.name}</p>
          <p className={styles.brand}>{product.brand || 'Бренд'}</p>
          <p className={styles.price}>{product.price} ₽</p>
        </div>
      </div>
    </button>
  );
};

export default ProductCard;