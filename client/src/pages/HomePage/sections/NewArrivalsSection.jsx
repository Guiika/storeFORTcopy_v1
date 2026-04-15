import React from 'react';
import ProductCard from '../../../components/ProductCard/ProductCard';
import styles from '../HomePage.module.css';

const NewArrivalsSection = ({ products, onProductClick }) => {
  if (!products || products.length === 0) {
    return <div className={styles.noProducts}>Нет новинок</div>;
  }

  return (
    <section className={styles.newArrivals}>
      <h2 className={styles.sectionTitle}>Новинки</h2>
      <div className={styles.productsGrid}>
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onClick={() => onProductClick(product.id)}
          />
        ))}
      </div>
    </section>
  );
};

export default NewArrivalsSection;