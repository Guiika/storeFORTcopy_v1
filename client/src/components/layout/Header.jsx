import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useCart } from '../../store/CartContext';
import { useWishlist } from '../../store/WishlistContext';
import { categoriesService } from '../../services/categoriesService';
import Logo from '../../assets/icons/Logo';
import NavCategories from './header/NavCategories';
import UserActions from './header/UserActions';
import styles from './header/Header.module.css';

const normalizeCategories = (categories = []) => categories.map((category) => ({
  id: category.id,
  name: category.name,
  children: (category.children || []).map((child) => ({
    id: child.id,
    name: child.name,
  })),
}));

const Header = () => {
  const { user } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  React.useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        const response = await categoriesService.getAllCategories();
        if (!isMounted) return;
        setCategories(normalizeCategories(response.data.categories));
      } catch (error) {
        console.error('Failed to load categories', error);
      } finally {
        if (isMounted) {
          setIsCategoriesLoading(false);
        }
      }
    };
    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const isDropdownOpen = activeCategoryId !== null;
  const headerClassName = useMemo(
    () => `${styles.header} ${isDropdownOpen ? styles.headerHover : ''}`,
    [isDropdownOpen]
  );

  const handleLogoClick = () => navigate('/');
  const handleCategoryClick = (categoryName) => navigate(`/catalog?category=${encodeURIComponent(categoryName)}`);
  const handleSubcategoryClick = (categoryName, subcategoryName) => {
    navigate(
      `/catalog?category=${encodeURIComponent(categoryName)}&subcategory=${encodeURIComponent(subcategoryName)}`
    );
  };

  return (
    <header className={headerClassName}>
      <div className={styles.leftSection}>
        <button type="button" className={styles.logoButton} onClick={handleLogoClick} aria-label="На главную">
          <Logo />
        </button>

        {!isCategoriesLoading && (
          <NavCategories
            categories={categories}
            activeCategoryId={activeCategoryId}
            onCategoryEnter={setActiveCategoryId}
            onCategoryLeave={() => setActiveCategoryId(null)}
            onCategoryClick={handleCategoryClick}
            onSubcategoryClick={handleSubcategoryClick}
          />
        )}
      </div>

      <UserActions
        user={user}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onWishlistClick={() => navigate('/wishlist')}
        onProfileClick={() => navigate('/profile')}
        onCartClick={() => navigate('/cart')}
        onAdminClick={() => navigate('/admin')}
      />
    </header>
  );
};

export default Header;