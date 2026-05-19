import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import HomePage from './pages/HomePage/HomePage';
import CatalogPage from './pages/CatalogPage/CatalogPage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import AdminPage from './pages/AdminPage/AdminPage';
import ProductPage from './pages/ProductPage/ProductPage';
import FavoritesPage from './pages/FavoritesPage/FavoritesPage';
import CartPage from './pages/CartPage/CartPage';
import AccountPage from './pages/AccountPage/AccountPage';
import OrdersPage from './pages/AccountPage/OrdersPage';
import AdminProductCreatePage from './pages/AdminPage/stubs/AdminProductCreatePage';
import AdminProductEditPage from './pages/AdminPage/stubs/AdminProductEditPage';

const NO_HEADER_PATHS = ['/login', '/register'];

function App() {
  const location = useLocation();
  const showHeader = !NO_HEADER_PATHS.includes(location.pathname);

  return (
    <div className="app">
      {showHeader && <Header />}
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/profile" element={<AccountPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/products/create" element={<AdminProductCreatePage />} />
          <Route path="/admin/products/:id/edit" element={<AdminProductEditPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;