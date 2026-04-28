import React from 'react';
import styles from '../HomePage.module.css';

const ShopBanner = () => {
  return (
    <section className={styles.shopBanner}>
      <img
        src="/плакаты/IMG_0367%202.png"
        alt="Интерьер магазина"
        className={styles.bannerImage}
      />
    </section>
  );
};

export default ShopBanner;
