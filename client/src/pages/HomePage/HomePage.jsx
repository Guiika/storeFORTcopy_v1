import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from './sections/HeroSection';
import ShopBanner from './sections/ShopBanner';
import BrandsSection from './sections/BrandsSection';
import NewArrivalsSection from './sections/NewArrivalsSection';
import Footer from '../../components/layout/Footer';
import { productsService } from '../../services/productsService';
import styles from './HomePage.module.css';

const HomePage = () => {
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await productsService.getNewArrivals();
        setNewArrivals(data);
      } catch (error) {
        console.error('Failed to load new arrivals', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleBrandClick = (brand) => {
    navigate(`/catalog?brand=${encodeURIComponent(brand)}`);
  };

  const handleCatalogClick = () => {
    navigate('/catalog');
  };

  return (
    <div className={styles.homePage}>
      <HeroSection onCatalogClick={handleCatalogClick} />
      <ShopBanner />
      <BrandsSection onBrandClick={handleBrandClick} />
      {loading ? (
        <div className={styles.loader}>Загрузка новинок...</div>
      ) : (
        <NewArrivalsSection products={newArrivals} onProductClick={handleProductClick} />
      )}
      <Footer />
    </div>
  );
};

export default HomePage;