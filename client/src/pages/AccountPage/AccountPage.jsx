import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../store/AuthContext';
import { authService } from '../../services/authService';
import errorIcon from '../../assets/vector/error.svg';
import styles from './AccountPage.module.css';

const AccountPage = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();

  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', msg }

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    authService.getProfile()
      .then((res) => {
        const u = res.data.user;
        setLastName(u.last_name || '');
        setFirstName(u.first_name || '');
        setEmail(u.email || '');
        setPhone(u.phone || '');
      })
      .catch(() => showToast('error', 'Не удалось загрузить профиль'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSave = async () => {
    if (newPassword && !oldPassword) {
      showToast('error', 'Введите старый пароль');
      return;
    }
    setSaving(true);
    try {
      const res = await authService.updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone,
      });
      updateUser(res.data.user || { first_name: firstName, last_name: lastName });

      if (newPassword) {
        await authService.changePassword({ currentPassword: oldPassword, newPassword });
        setOldPassword('');
        setNewPassword('');
      }
      showToast('success', 'Данные сохранены');
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.loadingText}>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Column 1 — nav */}
        <nav className={styles.nav}>
          <button type="button" className={`${styles.navItem} ${styles.navItemActive}`}>
            Данные аккаунта
          </button>
          <button type="button" className={styles.navItem} onClick={() => navigate('/orders')}>
            Мои заказы
          </button>
          <button type="button" className={styles.navItem} onClick={handleLogout}>
            Выйти
          </button>
        </nav>

        {/* Columns 2+3 + save button */}
        <div className={styles.formArea}>
          <div className={styles.formCols}>
            {/* Column 2 — personal */}
            <div className={styles.col}>
              <p className={styles.colTitle}>Личные данные</p>
              <div className={styles.fields}>
                <input
                  className={styles.field}
                  placeholder="Фамилия"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
                <input
                  className={styles.field}
                  placeholder="Имя"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <input
                  type="password"
                  className={styles.field}
                  placeholder="Старый пароль"
                  autoComplete="current-password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
                <input
                  type="password"
                  className={styles.field}
                  placeholder="Новый пароль"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Column 3 — contact */}
            <div className={styles.col}>
              <p className={styles.colTitle}>Контактные данные</p>
              <div className={styles.fields}>
                <input
                  className={styles.field}
                  placeholder="Email"
                  value={email}
                  readOnly
                />
                <input
                  className={styles.field}
                  placeholder="Номер телефона"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className={styles.saveRow}>
            <button
              type="button"
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>

      <Footer />

      {toast && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {toast.type === 'error' && (
            <img src={errorIcon} alt="" className={styles.toastIcon} />
          )}
          <p className={styles.toastText}>{toast.msg}</p>
        </div>
      )}
    </div>
  );
};

export default AccountPage;
