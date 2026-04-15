import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useCart } from '../../store/CartContext';
import { useWishlist } from '../../store/WishlistContext';
import { categoriesService } from '../../services/categoriesService';
import Logo from '../../assets/icons/Logo';
import HeartIcon from '../../assets/icons/HeartIcon';
import UserIcon from '../../assets/icons/UserIcon';
import CartIcon from '../../assets/icons/CartIcon';
import SettingsIcon from '../../assets/icons/SettingsIcon';
import styles from './Header.module.css';

const Header = () => {
  const { user } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesService.getAllCategories();
        // Преобразуем в формат для меню (плоский список)
        const flat = response.data.categories.flatMap(cat => {
          const main = { id: cat.id, name: cat.name, parent_id: null };
          const children = (cat.children || []).map(sub => ({
            id: sub.id,
            name: sub.name,
            parent_id: cat.id,
            parent_name: cat.name,
          }));
          return [main, ...children];
        });
        setCategories(flat);
      } catch (error) {
        console.error('Failed to load categories', error);
      }
    };
    fetchCategories();
  }, []);

  // Группируем подкатегории по родительским категориям
  const groupedCategories = categories.reduce((acc, cat) => {
    if (cat.parent_id === null) {
      acc[cat.id] = { name: cat.name, subcategories: [] };
    } else {
      const parent = Object.values(acc).find(p => p.name === cat.parent_name);
      if (parent) parent.subcategories.push(cat.name);
    }
    return acc;
  }, {});

  const menuItems = Object.values(groupedCategories).map(item => ({
    name: item.name,
    subcategories: item.subcategories,
  }));

  const handleLogoClick = () => navigate('/');
  const handleCategoryClick = (categoryName) => navigate(`/catalog?category=${categoryName}`);
  const handleSubcategoryClick = (categoryName, subName) => navigate(`/catalog?category=${categoryName}&subcategory=${subName}`);
  const handleWishlistClick = () => navigate('/wishlist');
  const handleProfileClick = () => navigate('/profile');
  const handleCartClick = () => navigate('/cart');
  const handleAdminClick = () => navigate('/admin');

  return (
    <header className={styles.header}>
      <div className={styles.logo} onClick={handleLogoClick}>
        <Logo />
      </div>
      <nav className={styles.nav}>
        {menuItems.map(item => (
          <div key={item.name} className={styles.navItem}>
            <span onClick={() => handleCategoryClick(item.name)}>
              {item.name}
            </span>
            {item.subcategories.length > 0 && (
              <div className={styles.dropdown}>
                {item.subcategories.map(sub => (
                  <div
                    key={sub}
                    className={styles.dropdownItem}
                    onClick={() => handleSubcategoryClick(item.name, sub)}
                  >
                    {sub}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      <div className={styles.rightIcons}>
        <div className={styles.iconWrapper} onClick={handleWishlistClick}>
          <HeartIcon filled={wishlistCount > 0} />
          {wishlistCount > 0 && <span className={styles.cartBadge}>{wishlistCount}</span>}
        </div>
        <div className={styles.iconWrapper} onClick={handleProfileClick}>
          <UserIcon />
        </div>
        <div className={styles.iconWrapper} onClick={handleCartClick}>
          <CartIcon />
          {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
        </div>
        {user?.role === 'ADMIN' && (
          <div className={styles.iconWrapper} onClick={handleAdminClick}>
            <SettingsIcon />
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;