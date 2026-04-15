import React from 'react';
import styles from '../HomePage.module.css';

const ShopBanner = () => {
  return (
    <div className={styles.shopBanner}>
      <img 
        src="https://via.placeholder.com/1200x400?text=Магазин+интерьер" 
        alt="Магазин"
        className={styles.bannerImage}
      />
    </div>
  );
};

export default ShopBanner;