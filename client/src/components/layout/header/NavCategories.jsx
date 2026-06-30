import React from 'react';
import { useNavigate } from 'react-router-dom';
import Dropdown from './Dropdown';
import styles from './Header.module.css';

const NavCategories = ({
  categories,
  activeCategoryId,
  onCategoryEnter,
  onCategoryLeave,
  onCategoryClick,
  onSubcategoryClick,
  isMobileOpen,
  onNavigate,
}) => {
  const navigate = useNavigate();

  const isMobileViewport = () => window.matchMedia('(max-width: 768px)').matches;

  const handleNewArrivalsClick = () => {
    navigate('/catalog');
    onNavigate?.();
  };

  const handleCategoryButtonClick = (category) => {
    if (category.children?.length > 0 && isMobileViewport()) {
      onCategoryEnter(activeCategoryId === category.id ? null : category.id);
      return;
    }
    onCategoryClick(category.id);
  };

  return (
  <nav className={`${styles.nav} ${isMobileOpen ? styles.navOpen : ''}`} aria-label="Категории">
    <div className={styles.navItem}>
      <button
        type="button"
        className={styles.navButton}
        onClick={handleNewArrivalsClick}
      >
        новинки
      </button>
    </div>
    {categories.map((category) => (
      <div
        key={category.id}
        className={styles.navItem}
        onMouseEnter={() => onCategoryEnter(category.id)}
        onMouseLeave={onCategoryLeave}
      >
        <button
          type="button"
          className={styles.navButton}
          onClick={() => handleCategoryButtonClick(category)}
        >
          {category.name}
        </button>
        {activeCategoryId === category.id && category.children?.length > 0 && (
          <Dropdown
            items={category.children}
            categoryName={category.name}
            onSubcategoryClick={onSubcategoryClick}
            onMouseEnter={() => onCategoryEnter(category.id)}
            onMouseLeave={onCategoryLeave}
          />
        )}
      </div>
    ))}
  </nav>
  );
};

export default NavCategories;
