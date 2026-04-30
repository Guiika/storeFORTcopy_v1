import React from 'react';
import styles from '../HomePage.module.css';

import banner from '../../../assets/posters/banner.png';
import posterMiniBag from '../../../assets/posters/poster_mini_bag.png';
import posterMiniAcsses from '../../../assets/posters/poster_mini_acsses.png';

const HeroSection = ({ onCatalogClick }) => {
  return (
    <section className={styles.hero}>
      <div className={styles.heroLeft}>
        <img src={banner} alt="Главный баннер" className={styles.heroMainBanner} />
      </div>

      <div className={styles.heroRight}>
        <div className={styles.heroTextRow}>
          <p className={styles.heroSmall}>Вдохновляем на смелые решения</p>
          <h1 className={styles.heroLarge}>МУЛЬТИБРЕНДОВЫЙ БУТИК</h1>
        </div>

        <div className={styles.heroContentRow}>
          <div className={styles.heroColumnLeft}>
            <img
              src={posterMiniBag}
              alt="Сумка"
              className={styles.heroFirstImage}
            />
            <button type="button" className={styles.heroButton} onClick={onCatalogClick}>
              В каталог
            </button>
          </div>

          <div className={styles.heroColumnRight}>
            <p className={styles.heroDesc}>
              Модная площадка на берегу моря,
              <br />
              в самом сердце сочинского порта
              <br />
              галереи Grand Marina
            </p>
            <img
              src={posterMiniAcsses}
              alt="Аксессуар"
              className={styles.heroSecondImage}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;