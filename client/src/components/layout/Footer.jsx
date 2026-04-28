import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.topRow}>
        <div className={styles.leftGroup}>
          <section className={styles.column}>
            <h3 className={styles.title}>Компания</h3>
            <ul className={styles.list}>
              <li><button type="button" className={styles.linkButton}>О нас</button></li>
              <li><button type="button" className={styles.linkButton}>Контакты</button></li>
              <li><button type="button" className={styles.linkButton}>Реквизиты</button></li>
            </ul>
          </section>

          <section className={styles.column}>
            <h3 className={styles.title}>Помощь</h3>
            <ul className={styles.list}>
              <li><button type="button" className={styles.linkButton}>Оплата</button></li>
              <li><button type="button" className={styles.linkButton}>Доставка</button></li>
              <li><button type="button" className={styles.linkButton}>Конфиденциальность</button></li>
              <li><button type="button" className={styles.linkButton}>Условия возврата</button></li>
            </ul>
          </section>
        </div>

        <section className={styles.columnRight}>
          <h3 className={styles.title}>Служба поддержки</h3>
          <ul className={styles.list}>
            <a href="tel:+79995414145" className={styles.link}>+7 999 541 41 45 </a>
            {" | "}
            <a href="mailto:fortboutique.info@gmail.com" className={styles.link}> fortboutique.info@gmail.com</a>
          </ul>
        </section>
      </div>

      <div className={styles.bottomRow}>
        <p className={styles.bottomText}>© 2026 Multibrand boutique FORT</p>
        <p className={styles.bottomText}>Все права защищены</p>
      </div>
    </footer>
  );
};

export default Footer;