const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/database');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

// Импорт маршрутов
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const cartRoutes = require('./routes/cartRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Инициализация Express приложения
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы (для изображений товаров)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Инициализация базы данных при запуске
db.initializeTables();

// Базовый маршрут для проверки
app.get('/', (req, res) => {
  res.json({
    message: 'Online Store API',
    version: '1.0.0',
    documentation: '/api-docs (coming soon)'
  });
});

// Swagger документация
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Online Store API Documentation'
}));

// Маршруты API
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/wishlist', wishlistRoutes); 
app.use('/api/cart', cartRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Обработка ошибок уникальности email
  if (err.message.includes('UNIQUE constraint failed')) {
    return res.status(409).json({ error: 'Email already exists' });
  }
  
  // Обработка JWT ошибок
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }
  
  // Обработка кастомных ошибок
  if (err.message) {
    return res.status(400).json({ error: err.message });
  }
  
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;