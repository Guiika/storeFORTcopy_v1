import React from 'react';
import styles from '../HomePage.module.css';

import room from '../../../assets/posters/room.png';

const ShopBanner = () => {
  return (
    <section className={styles.shopBanner}>
      <img
        src={room}
        alt="Интерьер магазина"
        className={styles.bannerImage}
      />
    </section>
  );
};

export default ShopBanner;