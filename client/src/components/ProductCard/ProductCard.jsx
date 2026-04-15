import React from 'react';
import styles from './ProductCard.module.css';

const ProductCard = ({ product, onClick }) => {
  const imageUrl = product.main_image?.image_url || 'https://via.placeholder.com/200x200?text=No+Image';

  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.imageWrapper}>
        <img src={imageUrl} alt={product.name} className={styles.image} />
      </div>
      <div className={styles.info}>
        <h3 className={styles.name}>{product.name}</h3>
        <p className={styles.brand}>{product.brand || 'Бренд'}</p>
        <p className={styles.price}>{product.price} ₽</p>
      </div>
    </div>
  );
};

export default ProductCard;