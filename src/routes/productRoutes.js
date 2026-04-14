const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const { authenticate, isAdmin } = require('../middlewares/auth');
const { productValidator, productUpdateValidator, validate } = require('../utils/validators');
const upload = require('../middlewares/upload');

// Публичные маршруты (доступны всем)
router.get('/', ProductController.getAllProducts);
router.get('/search', ProductController.searchProducts);
router.get('/:id', ProductController.getProductById);
router.get('/:id/images', ProductController.getProductImages);
router.get('/:id/recommended', ProductController.getRecommendedProducts);

// Защищенные маршруты (только для администраторов)
router.post('/', authenticate, isAdmin, productValidator, validate, ProductController.createProduct);
router.put('/:id', authenticate, isAdmin, productUpdateValidator, validate, ProductController.updateProduct);
router.delete('/:id', authenticate, isAdmin, ProductController.deleteProduct);

// Маршруты для работы с изображениями (админ)
router.post('/:id/images', authenticate, isAdmin, upload.single('image'), ProductController.uploadImage);
router.delete('/images/:id', authenticate, isAdmin, ProductController.deleteImage);
router.put('/images/:id', authenticate, isAdmin, ProductController.updateImage);

module.exports = router;