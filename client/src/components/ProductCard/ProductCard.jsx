import React from 'react';
import styles from './ProductCard.module.css';

const ProductCard = ({ product, onClick }) => {
  const imageUrl = product.main_image?.image_url || '/плакаты/photo_2024-08-11_19-21-32%201.png';

  return (
    <button type="button" className={styles.card} onClick={onClick}>
      <div className={styles.media}>
        <img src={imageUrl} alt={product.name} className={styles.image} />
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