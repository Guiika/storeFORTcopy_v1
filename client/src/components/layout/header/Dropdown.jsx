import React from 'react';
import styles from './Header.module.css';

const Dropdown = ({ items, categoryName, onSubcategoryClick }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className={styles.dropdown}>
      <ul className={styles.dropdownList}>
        {items.map((sub) => (
          <li key={sub.id} className={styles.dropdownItem}>
            <button
              type="button"
              className={styles.dropdownButton}
              onClick={() => onSubcategoryClick(categoryName, sub.name)}
            >
              {sub.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dropdown;
