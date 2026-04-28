import React from 'react';
import styles from '../HomePage.module.css';

const HeroSection = ({ onCatalogClick }) => {
  return (
    <section className={styles.hero}>
      <div className={styles.heroLeft}>
        <img src="/плакаты/банер.png" alt="Главный баннер" className={styles.heroMainBanner} />
      </div>

      <div className={styles.heroRight}>
        <div className={styles.heroTextRow}>
          <p className={styles.heroSmall}>Вдохновляем на смелые решения</p>
          <h1 className={styles.heroLarge}>МУЛЬТИБРЕНДОВЫЙ БУТИК</h1>
                  </div>

        <div className={styles.heroContentRow}>
          <div className={styles.heroColumnLeft}>
            <img
              src="/плакаты/photo_2024-08-11_19-21-32%201.png"
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
              src="/плакаты/photo_2025-03-14_17-18-48%201.png"
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

