import React from 'react';
import Dropdown from './Dropdown';
import styles from './Header.module.css';

const NavCategories = ({
  categories,
  activeCategoryId,
  onCategoryEnter,
  onCategoryLeave,
  onCategoryClick,
  onSubcategoryClick,
}) => (
  <nav className={styles.nav} aria-label="Категории">
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
          onClick={() => onCategoryClick(category.name)}
        >
          {category.name}
        </button>
        {activeCategoryId === category.id && category.children?.length > 0 && (
          <Dropdown
            items={category.children}
            categoryName={category.name}
            onSubcategoryClick={onSubcategoryClick}
          />
        )}
      </div>
    ))}
  </nav>
);

export default NavCategories;
