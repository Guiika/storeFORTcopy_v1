const express = require('express');
const router = express.Router();
const CatalogController = require('../controllers/catalogController');

// Главная страница каталога
router.get('/home', CatalogController.getHomepage);

// Страница категории
router.get('/category/:id', CatalogController.getCategoryPage);

// Детальная страница товара
router.get('/product/:id', CatalogController.getProductDetail);

// Быстрый поиск для автодополнения
router.get('/quick-search', CatalogController.quickSearch);

// Получение фильтров для поиска
router.get('/search-filters', CatalogController.getSearchFilters);

// Все товары (расширенный поиск)
router.get('/all', CatalogController.getAllProducts);

module.exports = router;