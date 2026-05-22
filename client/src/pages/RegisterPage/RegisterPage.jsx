import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { ReactComponent as FortLogo } from '../../assets/vector/FORT.svg';
import eyeIcon from '../../assets/vector/eye.svg';
import eyeCloseIcon from '../../assets/vector/eye_close.svg';
import errorIcon from '../../assets/vector/error.svg';
import styles from './RegisterPage.module.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 3000);
  };

  const handleSubmit = async () => {
    if (!lastName || !firstName || !password || !passwordConfirm || !email || !phone) {
      showError('Заполните все поля');
      return;
    }
    if (password !== passwordConfirm) {
      showError('Пароли не совпадают');
      return;
    }
    try {
      await register({ email, password, first_name: firstName, last_name: lastName, phone });
      navigate('/login');
    } catch {
      showError('Попробуйте ещё раз');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <button type="button" className={styles.logoButton} onClick={() => navigate('/')}>
          <FortLogo fill="rgba(123, 98, 198, 0.7)" className={styles.logo} />
        </button>

        <div className={styles.columns}>
          <div className={styles.column}>
            <p className={styles.columnTitle}>Личные данные</p>

            <div className={styles.inputWrapper}>
              <input
                className={styles.input}
                placeholder="Фамилия"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <div className={styles.inputWrapper}>
              <input
                className={styles.input}
                placeholder="Имя"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div className={styles.inputWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                className={styles.input}
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowPassword((v) => !v)}
              >
                <img
                  src={showPassword ? eyeCloseIcon : eyeIcon}
                  alt=""
                  className={styles.eyeIcon}
                />
              </button>
            </div>

            <div className={styles.inputWrapper}>
              <input
                type={showPasswordConfirm ? 'text' : 'password'}
                className={styles.input}
                placeholder="Повторите пароль"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowPasswordConfirm((v) => !v)}
              >
                <img
                  src={showPasswordConfirm ? eyeCloseIcon : eyeIcon}
                  alt=""
                  className={styles.eyeIcon}
                />
              </button>
            </div>
          </div>

          <div className={styles.column}>
            <p className={styles.columnTitle}>Контактные данные</p>

            <div className={styles.inputWrapper}>
              <input
                type="email"
                className={styles.input}
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className={styles.inputWrapper}>
              <input
                type="tel"
                className={styles.input}
                placeholder="Номер телефона"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          className={styles.submitButton}
          onClick={handleSubmit}
        >
          Зарегистрироваться
        </button>

        <button
          type="button"
          className={styles.loginButton}
          onClick={() => navigate('/login')}
        >
          Вход
        </button>
      </div>

      {errorMessage && (
        <div className={styles.errorToast}>
          <img src={errorIcon} alt="Ошибка" className={styles.errorIcon} />
          <div className={styles.errorTexts}>
            <p className={styles.errorLine}>{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterPage;
