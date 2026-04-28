import React from 'react';
import styles from '../HomePage.module.css';

const brands = [
  { key: 'PINKO', logo: '/иконки/pinko.svg' },
  { key: 'MaxMara', logo: '/иконки/maxmara.svg' },
  { key: 'PATRIZIA PEPE', logo: '/иконки/pepe.svg' },
  { key: 'PHILIPP PLEIN', logo: '/иконки/pp.svg' },
];

const BrandsSection = ({ onBrandClick }) => {
  return (
    <section className={styles.brandsSection}>
      <div className={styles.brandsContainer}>
        {brands.map((brand) => (
          <button
            key={brand.key}
            type="button"
            className={styles.brandButton}
            onClick={() => onBrandClick(brand.key)}
            aria-label={`Открыть каталог бренда ${brand.key}`}
          >
            <img src={brand.logo} alt={brand.key} className={styles.brandLogo} />
          </button>
        ))}
      </div>
    </section>
  );
};

export default BrandsSection;