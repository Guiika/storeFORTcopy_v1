import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.column}>
          <h3>Компания</h3>
          <ul>
            <li>О нас</li>
            <li>Контакты</li>
            <li>Вакансии</li>
          </ul>
        </div>
        <div className={styles.column}>
          <h3>Помощь</h3>
          <ul>
            <li>Доставка</li>
            <li>Возврат</li>
            <li>Частые вопросы</li>
          </ul>
        </div>
        <div className={styles.column}>
          <h3>Контакты</h3>
          <ul>
            <li>Email: shop@store.com</li>
            <li>Телефон: +7 (999) 123-45-67</li>
          </ul>
        </div>
      </div>
      <div className={styles.copyright}>
        © 2025 Магазин одежды. Все права защищены.
      </div>
    </footer>
  );
};

export default Footer;