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
}) => {
  const navigate = useNavigate();

  return (
  <nav className={styles.nav} aria-label="Категории">
    <div className={styles.navItem}>
      <button
        type="button"
        className={styles.navButton}
        onClick={() => navigate('/catalog')}
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
          onClick={() => onCategoryClick(category.id)}
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
