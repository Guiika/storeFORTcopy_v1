import React from 'react';
import styles from '../HomePage.module.css';

const BrandsSection = ({ onBrandClick }) => {
  // Временные бренды (позже можно загрузить из API)
  const brands = ['Nike', 'Adidas', 'Puma', 'Zara', 'H&M', 'Gucci'];

  return (
    <div className={styles.brandsSection}>
      <div className={styles.brandsContainer}>
        {brands.map(brand => (
          <div 
            key={brand} 
            className={styles.brandItem}
            onClick={() => onBrandClick(brand)}
          >
            {brand}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrandsSection;