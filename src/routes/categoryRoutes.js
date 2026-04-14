const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');
const { authenticate, isAdmin } = require('../middlewares/auth');
const { categoryValidator, categoryUpdateValidator, validate } = require('../utils/validators');

// Публичные маршруты (доступны всем)
router.get('/', CategoryController.getAllCategories);
router.get('/flat', CategoryController.getAllCategoriesFlat);
router.get('/:id', CategoryController.getCategoryById);
router.get('/:parentId/subcategories', CategoryController.getSubcategories);

// Защищенные маршруты (только для администраторов)
router.post('/', authenticate, isAdmin, categoryValidator, validate, CategoryController.createCategory);
router.put('/:id', authenticate, isAdmin, categoryUpdateValidator, validate, CategoryController.updateCategory);
router.delete('/:id', authenticate, isAdmin, CategoryController.deleteCategory);
router.delete('/:id/force', authenticate, isAdmin, CategoryController.forceDeleteCategory);

module.exports = router;