import React from 'react';
import ProductCard from '../../../components/ProductCard/ProductCard';
import { useAuth } from '../../../store/AuthContext';
import { useWishlist } from '../../../store/WishlistContext';
import styles from '../HomePage.module.css';

const NewArrivalsSection = ({ products, onProductClick }) => {
  const { user } = useAuth();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  if (!products || products.length === 0) {
    return <div className={styles.noProducts}>Нет новинок</div>;
  }

  const handleWishlistToggle = async (productId) => {
    if (!user) return;
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  return (
    <section className={styles.newArrivals}>
      <h2 className={styles.sectionTitle}>НОВИНКИ</h2>
      <div className={styles.productsGrid}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onClick={() => onProductClick(product.id)}
            inWishlist={user ? isInWishlist(product.id) : false}
            onWishlistToggle={() => handleWishlistToggle(product.id)}
          />
        ))}
      </div>
    </section>
  );
};

export default NewArrivalsSection;
