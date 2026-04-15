import React from 'react';
import styles from '../HomePage.module.css';

const HeroSection = ({ onCatalogClick }) => {
  return (
    <div className={styles.hero}>
      <div className={styles.heroLeft}>
        <div className={styles.heroBanner}>
          <img src="https://via.placeholder.com/800x500?text=Hero+Banner" alt="Hero" />
        </div>
      </div>
      <div className={styles.heroRight}>
        <div className={styles.heroText}>
          <p className={styles.heroSmall}>Новая коллекция</p>
          <h1 className={styles.heroLarge}>Лучшие образы<br />для вас</h1>
          <button className={styles.heroButton} onClick={onCatalogClick}>в каталог</button>
        </div>
        <div className={styles.heroImage}>
          <img src="https://via.placeholder.com/300x300?text=Image" alt="Side" />
        </div>
        <div className={styles.heroDesc}>
          <p>Стильная одежда и аксессуары от ведущих брендов. Быстрая доставка.</p>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;