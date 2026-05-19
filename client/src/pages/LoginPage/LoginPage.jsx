import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { ReactComponent as FortLogo } from '../../assets/vector/FORT.svg';
import eyeIcon from '../../assets/vector/eye.svg';
import eyeCloseIcon from '../../assets/vector/eye_close.svg';
import errorIcon from '../../assets/vector/error.svg';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleLogin = async () => {
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <button type="button" className={styles.logoButton} onClick={() => navigate('/')}>
          <FortLogo fill="#A391D7" className={styles.logo} />
        </button>

        <div className={styles.inputWrapper} style={{ marginTop: '200px' }}>
          <input
            type="email"
            className={styles.input}
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className={styles.inputWrapper} style={{ marginTop: '70px' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            className={styles.input}
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
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

        <button
          type="button"
          className={styles.loginButton}
          style={{ marginTop: '200px' }}
          onClick={handleLogin}
        >
          Войти
        </button>

        <button
          type="button"
          className={styles.registerButton}
          style={{ marginTop: '10px' }}
          onClick={() => navigate('/register')}
        >
          Зарегистрироваться
        </button>
      </div>

      {showError && (
        <div className={styles.errorToast}>
          <img src={errorIcon} alt="Ошибка" className={styles.errorIcon} />
          <div className={styles.errorTexts}>
            <p className={styles.errorLine}>Попробуйте ещё раз</p>
            <p className={styles.errorLine}>Неверные данные</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
