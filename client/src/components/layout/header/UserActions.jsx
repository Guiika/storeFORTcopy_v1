import React from 'react';
import HeartIcon from '../../../assets/icons/HeartIcon';
import UserIcon from '../../../assets/icons/UserIcon';
import CartIcon from '../../../assets/icons/CartIcon';
import SettingsIcon from '../../../assets/icons/SettingsIcon';
import styles from './Header.module.css';

const UserActions = ({ user, cartCount, wishlistCount, onWishlistClick, onProfileClick, onCartClick, onAdminClick }) => (
  <div className={styles.rightActions}>
    {user?.role === 'ADMIN' && (
      <button type="button" className={styles.iconButton} onClick={onAdminClick} aria-label="Админ панель">
        <SettingsIcon />
      </button>
    )}

    <button type="button" className={styles.iconButton} onClick={onWishlistClick} aria-label="Избранное">
      <HeartIcon />
      {wishlistCount > 0 && <span className={styles.badge}>{wishlistCount}</span>}
    </button>

    <button type="button" className={styles.iconButton} onClick={onProfileClick} aria-label="Профиль">
      <UserIcon />
    </button>

    <button type="button" className={styles.iconButton} onClick={onCartClick} aria-label="Корзина">
      <CartIcon filled={cartCount > 0} />
      {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
    </button>
  </div>
);

export default UserActions;
