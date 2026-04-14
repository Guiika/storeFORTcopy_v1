const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { authenticate, isAdmin } = require('../middlewares/auth');

// Все маршруты требуют аутентификации и прав администратора
router.use(authenticate, isAdmin);

// ============= ДАШБОРД =============
router.get('/dashboard', AdminController.getDashboardStats);
router.get('/system-info', AdminController.getSystemInfo);
router.post('/cleanup', AdminController.cleanupOldData);

// ============= УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ =============
router.get('/users', AdminController.getAllUsers);
router.get('/users/:id', AdminController.getUserById);
router.put('/users/:id/role', AdminController.updateUserRole);
router.put('/users/:id/status', AdminController.toggleUserStatus);

// ============= УПРАВЛЕНИЕ ЗАКАЗАМИ =============
router.get('/orders', AdminController.getAllOrders);
router.put('/orders/:id/status', AdminController.updateOrderStatus);

// ============= УПРАВЛЕНИЕ ТОВАРАМИ =============
router.post('/products/bulk-update-prices', AdminController.bulkUpdatePrices);
router.get('/products/export', AdminController.exportProducts);

module.exports = router;